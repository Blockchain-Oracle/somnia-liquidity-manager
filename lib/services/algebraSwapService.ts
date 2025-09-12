/**
 * Algebra Swap Service
 * Handles swaps on QuickSwap V4 (Algebra) pools with excellent UX
 */

import { ethers } from 'ethers';
import { quickswapV4Service } from './quickswapV4Service';

// Algebra SwapRouter address on Somnia
const SWAP_ROUTER = '0x1582f6f3D26658F7208A799Be46e34b1f366CE44';

// Router ABI for swapping
const ROUTER_ABI = [
  'function exactInputSingle((address tokenIn, address tokenOut, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 limitSqrtPrice)) payable returns (uint256 amountOut)',
  'function exactOutputSingle((address tokenIn, address tokenOut, address recipient, uint256 deadline, uint256 amountOut, uint256 amountInMaximum, uint160 limitSqrtPrice)) payable returns (uint256 amountIn)',
  'function quoteExactInputSingle((address tokenIn, address tokenOut, uint256 amountIn, uint160 limitSqrtPrice)) returns (uint256 amountOut, uint16 fee, uint160 sqrtPriceX96After, uint256 gasEstimate)',
  'function quoteExactOutputSingle((address tokenIn, address tokenOut, uint256 amountOut, uint160 limitSqrtPrice)) returns (uint256 amountIn, uint16 fee, uint160 sqrtPriceX96After, uint256 gasEstimate)',
];

// ERC20 ABI for token operations
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
];

export interface SwapQuote {
  amountIn: string;
  amountOut: string;
  priceImpact: number;
  fee: number;
  route: string;
  gasEstimate?: string;
  minimumReceived?: string;
}

export interface SwapError {
  code: 'INSUFFICIENT_BALANCE' | 'INSUFFICIENT_LIQUIDITY' | 'PRICE_IMPACT_TOO_HIGH' | 'APPROVAL_NEEDED' | 'UNKNOWN';
  message: string;
  details?: any;
}

export interface UserBalance {
  token: string;
  symbol: string;
  balance: string;
  balanceFormatted: number;
  allowance: string;
  needsApproval: boolean;
}

class AlgebraSwapService {
  private provider: ethers.JsonRpcProvider;
  private router: ethers.Contract;

  constructor() {
    this.provider = new ethers.JsonRpcProvider('https://api.infra.mainnet.somnia.network/');
    this.router = new ethers.Contract(SWAP_ROUTER, ROUTER_ABI, this.provider);
  }

  /**
   * Get user token balance and allowance
   */
  async getUserBalance(
    userAddress: string,
    tokenAddress: string,
    checkAllowance: boolean = true
  ): Promise<UserBalance> {
    try {
      const token = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
      
      const [balance, decimals, symbol, allowance] = await Promise.all([
        token.balanceOf(userAddress),
        token.decimals(),
        token.symbol(),
        checkAllowance ? token.allowance(userAddress, SWAP_ROUTER) : Promise.resolve(0n)
      ]);

      const balanceFormatted = Number(ethers.formatUnits(balance, decimals));
      const needsApproval = checkAllowance && allowance < balance;

      return {
        token: tokenAddress,
        symbol,
        balance: balance.toString(),
        balanceFormatted,
        allowance: allowance.toString(),
        needsApproval
      };
    } catch (error) {
      console.error('[AlgebraSwap] Error getting user balance:', error);
      throw error;
    }
  }

  /**
   * Get quote for exact input swap
   */
  async getQuoteExactInput(
    tokenIn: string,
    tokenOut: string,
    amountIn: string,
    userAddress?: string
  ): Promise<{ quote: SwapQuote; userBalance?: UserBalance; error?: SwapError }> {
    try {
      console.log(`[AlgebraSwap] Getting quote for ${amountIn} ${tokenIn} -> ${tokenOut}`);
      
      // Get token addresses
      const tokenInAddress = this.getTokenAddress(tokenIn);
      const tokenOutAddress = this.getTokenAddress(tokenOut);
      
      if (!tokenInAddress || !tokenOutAddress) {
        return {
          quote: null as any,
          error: {
            code: 'UNKNOWN',
            message: `Unknown token: ${!tokenInAddress ? tokenIn : tokenOut}`
          }
        };
      }

      // Get decimals
      const tokenInContract = new ethers.Contract(tokenInAddress, ERC20_ABI, this.provider);
      const tokenOutContract = new ethers.Contract(tokenOutAddress, ERC20_ABI, this.provider);
      
      const [decimalsIn, decimalsOut] = await Promise.all([
        tokenInContract.decimals(),
        tokenOutContract.decimals()
      ]);

      // Convert amount to wei
      const amountInWei = ethers.parseUnits(amountIn, decimalsIn);

      // Get user balance if address provided
      let userBalance: UserBalance | undefined;
      if (userAddress) {
        userBalance = await this.getUserBalance(userAddress, tokenInAddress);
        
        // Check if user has sufficient balance
        if (BigInt(userBalance.balance) < amountInWei) {
          return {
            quote: null as any,
            userBalance,
            error: {
              code: 'INSUFFICIENT_BALANCE',
              message: `Insufficient ${tokenIn} balance. You have ${userBalance.balanceFormatted} ${tokenIn}`,
              details: { required: amountIn, available: userBalance.balanceFormatted }
            }
          };
        }
      }

      // Get quote from router
      const quoteData = await this.router.quoteExactInputSingle({
        tokenIn: tokenInAddress,
        tokenOut: tokenOutAddress,
        amountIn: amountInWei,
        limitSqrtPrice: 0
      });

      const amountOut = quoteData.amountOut;
      const fee = Number(quoteData.fee) / 10000; // Convert to percentage
      
      // Calculate price impact (simplified)
      const priceImpact = this.calculatePriceImpact(amountInWei, amountOut, decimalsIn, decimalsOut);
      
      // Check for high price impact
      if (priceImpact > 10) {
        return {
          quote: null as any,
          userBalance,
          error: {
            code: 'PRICE_IMPACT_TOO_HIGH',
            message: `Price impact too high: ${priceImpact.toFixed(2)}%`,
            details: { priceImpact }
          }
        };
      }

      // Calculate minimum received with 0.5% slippage
      const slippageTolerance = 0.005; // 0.5%
      const minimumReceived = amountOut * BigInt(Math.floor((1 - slippageTolerance) * 10000)) / 10000n;

      const quote: SwapQuote = {
        amountIn: amountIn,
        amountOut: ethers.formatUnits(amountOut, decimalsOut),
        priceImpact,
        fee,
        route: `${tokenIn} → ${tokenOut}`,
        gasEstimate: quoteData.gasEstimate?.toString(),
        minimumReceived: ethers.formatUnits(minimumReceived, decimalsOut)
      };

      return { quote, userBalance };

    } catch (error: any) {
      console.error('[AlgebraSwap] Quote error:', error);
      
      // Parse error for better UX
      if (error.message?.includes('INSUFFICIENT_LIQUIDITY')) {
        return {
          quote: null as any,
          error: {
            code: 'INSUFFICIENT_LIQUIDITY',
            message: 'Insufficient liquidity in the pool for this trade'
          }
        };
      }
      
      return {
        quote: null as any,
        error: {
          code: 'UNKNOWN',
          message: error.message || 'Failed to get swap quote'
        }
      };
    }
  }

  /**
   * Execute swap transaction
   */
  async executeSwap(
    signer: ethers.Signer,
    tokenIn: string,
    tokenOut: string,
    amountIn: string,
    minAmountOut: string,
    recipient?: string
  ): Promise<{ success: boolean; txHash?: string; error?: SwapError }> {
    try {
      const userAddress = await signer.getAddress();
      recipient = recipient || userAddress;

      // Get token addresses
      const tokenInAddress = this.getTokenAddress(tokenIn);
      const tokenOutAddress = this.getTokenAddress(tokenOut);

      if (!tokenInAddress || !tokenOutAddress) {
        return {
          success: false,
          error: {
            code: 'UNKNOWN',
            message: `Unknown token: ${!tokenInAddress ? tokenIn : tokenOut}`
          }
        };
      }

      // Check balance and approval
      const balance = await this.getUserBalance(userAddress, tokenInAddress);
      
      const tokenInContract = new ethers.Contract(tokenInAddress, ERC20_ABI, this.provider);
      const decimalsIn = await tokenInContract.decimals();
      const amountInWei = ethers.parseUnits(amountIn, decimalsIn);

      if (BigInt(balance.balance) < amountInWei) {
        return {
          success: false,
          error: {
            code: 'INSUFFICIENT_BALANCE',
            message: `Insufficient ${tokenIn} balance`
          }
        };
      }

      // Check and request approval if needed
      if (balance.needsApproval) {
        console.log(`[AlgebraSwap] Requesting approval for ${tokenIn}`);
        const tokenWithSigner = new ethers.Contract(tokenInAddress, ERC20_ABI, signer);
        const approveTx = await tokenWithSigner.approve(SWAP_ROUTER, ethers.MaxUint256);
        console.log(`[AlgebraSwap] Approval tx: ${approveTx.hash}`);
        await approveTx.wait();
        console.log(`[AlgebraSwap] Approval confirmed`);
      }

      // Execute swap
      const routerWithSigner = new ethers.Contract(SWAP_ROUTER, ROUTER_ABI, signer);
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes

      const tokenOutContract = new ethers.Contract(tokenOutAddress, ERC20_ABI, this.provider);
      const decimalsOut = await tokenOutContract.decimals();
      const minAmountOutWei = ethers.parseUnits(minAmountOut, decimalsOut);

      console.log(`[AlgebraSwap] Executing swap: ${amountIn} ${tokenIn} -> min ${minAmountOut} ${tokenOut}`);
      
      const tx = await routerWithSigner.exactInputSingle({
        tokenIn: tokenInAddress,
        tokenOut: tokenOutAddress,
        recipient: recipient,
        deadline: deadline,
        amountIn: amountInWei,
        amountOutMinimum: minAmountOutWei,
        limitSqrtPrice: 0
      });

      console.log(`[AlgebraSwap] Swap tx: ${tx.hash}`);
      
      return {
        success: true,
        txHash: tx.hash
      };

    } catch (error: any) {
      console.error('[AlgebraSwap] Swap execution error:', error);
      
      return {
        success: false,
        error: {
          code: 'UNKNOWN',
          message: error.message || 'Swap execution failed'
        }
      };
    }
  }

  /**
   * Calculate price impact (simplified)
   */
  private calculatePriceImpact(
    amountIn: bigint,
    amountOut: bigint,
    decimalsIn: number,
    decimalsOut: number
  ): number {
    // This is a simplified calculation
    // In production, you'd want to compare against the spot price
    const valueIn = Number(ethers.formatUnits(amountIn, decimalsIn));
    const valueOut = Number(ethers.formatUnits(amountOut, decimalsOut));
    
    // Assume 1:1 for stablecoins, otherwise use a ratio
    const expectedRatio = 1; // This should be fetched from price oracle
    const actualRatio = valueOut / valueIn;
    
    const impact = Math.abs((1 - actualRatio / expectedRatio) * 100);
    return Math.min(impact, 100); // Cap at 100%
  }

  /**
   * Map token symbol to address
   */
  private getTokenAddress(symbol: string): string | null {
    const tokenMap: Record<string, string> = {
      'ETH': '0x936Ab8C674bcb567CD5dEB85D8A216494704E9D8', // WETH
      'WETH': '0x936Ab8C674bcb567CD5dEB85D8A216494704E9D8',
      'USDC': '0x28BEc7E30E6faee657a03e19Bf1128AaD7632A00',
      'USDT': '0x67B302E35Aef5EEE8c32D934F5856869EF428330',
      'SOMI': '0x046EDe9564A72571df6F5e44d0405360c0f4dCab', // WSOMI
      'WSOMI': '0x046EDe9564A72571df6F5e44d0405360c0f4dCab',
    };
    return tokenMap[symbol.toUpperCase()] || null;
  }

  /**
   * Get all supported tokens
   */
  getSupportedTokens(): string[] {
    return ['ETH', 'WETH', 'USDC', 'USDT', 'SOMI'];
  }
}

export const algebraSwapService = new AlgebraSwapService();