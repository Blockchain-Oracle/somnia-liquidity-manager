/**
 * Enhanced Swap Service with QuickSwap V4 Integration
 * Provides swap quotes, token balances, and execution on Somnia
 */

import { 
  createPublicClient, 
  createWalletClient,
  http, 
  parseAbi, 
  type Address,
  formatUnits,
  parseUnits,
  encodePacked
} from 'viem';
import { somniaMainnet, somniaTestnet } from '@/lib/wagmi';
import { getCurrentNetworkName } from '@/lib/config/networks.config';
import { diaOracleService } from './diaOracle.service';

// QuickSwap V4 Contract Addresses on Somnia Mainnet
const CONTRACTS = {
  AlgebraFactory: '0x0ccff3D02A3a200263eC4e0Fdb5E60a56721B8Ae' as Address,
  AlgebraPoolDeployer: '0x0361B4883FfD676BB0a4642B3139D38A33e452f5' as Address,
  QuoterV2: '0xcB68373404a835268D3ED76255C8148578A82b77' as Address,
  SwapRouter: '0x1582f6f3D26658F7208A799Be46e34b1f366CE44' as Address,
  NonfungiblePositionManager: '0xfE02219e0578B1E4831CDE7C3CB36f71AEb4A833' as Address,
  WETH: '0x936Ab8C674bcb567CD5dEB85D8A216494704E9D8' as Address,
  USDC: '0x28BEc7E30E6faee657a03e19Bf1128AaD7632A00' as Address,
  USDT: '0x67B302E35Aef5EEE8c32D934F5856869EF428330' as Address,
  WSOMI: '0x046EDe9564A72571df6F5e44d0405360c0f4dCab' as Address,
};

// Token decimals mapping
const TOKEN_DECIMALS: Record<string, number> = {
  'WETH': 18,
  'USDC': 6,
  'USDT': 6,
  'SOMI': 18,
  'WSOMI': 18,
};

// Token address mapping
const TOKEN_ADDRESSES: Record<string, Address> = {
  'WETH': CONTRACTS.WETH,
  'USDC': CONTRACTS.USDC,
  'USDT': CONTRACTS.USDT,
  'SOMI': CONTRACTS.WSOMI, // SOMI uses WSOMI address for swaps
  'WSOMI': CONTRACTS.WSOMI,
};

// QuoterV2 ABI - for getting swap quotes
const QUOTER_V2_ABI = parseAbi([
  'struct QuoteExactInputSingleParams { address tokenIn; address tokenOut; address deployer; uint256 amountIn; uint160 limitSqrtPrice; }',
  'struct QuoteExactOutputSingleParams { address tokenIn; address tokenOut; address deployer; uint256 amount; uint160 limitSqrtPrice; }',
  'function quoteExactInputSingle(QuoteExactInputSingleParams memory params) external returns (uint256 amountOut, uint256 amountIn, uint160 sqrtPriceX96After, uint32 initializedTicksCrossed, uint256 gasEstimate, uint16 fee)',
  'function quoteExactOutputSingle(QuoteExactOutputSingleParams memory params) external returns (uint256 amountOut, uint256 amountIn, uint160 sqrtPriceX96After, uint32 initializedTicksCrossed, uint256 gasEstimate, uint16 fee)',
]);

// SwapRouter ABI
const SWAP_ROUTER_ABI = parseAbi([
  'struct ExactInputSingleParams { address tokenIn; address tokenOut; address deployer; address recipient; uint256 deadline; uint256 amountIn; uint256 amountOutMinimum; uint160 limitSqrtPrice; }',
  'struct ExactOutputSingleParams { address tokenIn; address tokenOut; address deployer; address recipient; uint256 deadline; uint256 amountOut; uint256 amountInMaximum; uint160 limitSqrtPrice; }',
  'function exactInputSingle(ExactInputSingleParams calldata params) external payable returns (uint256 amountOut)',
  'function exactOutputSingle(ExactOutputSingleParams calldata params) external payable returns (uint256 amountIn)',
  'function multicall(bytes[] calldata data) external payable returns (bytes[] memory results)',
]);

// ERC20 ABI for token operations
const ERC20_ABI = parseAbi([
  'function balanceOf(address owner) external view returns (uint256)',
  'function decimals() external view returns (uint8)',
  'function symbol() external view returns (string)',
  'function name() external view returns (string)',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function transfer(address to, uint256 amount) external returns (bool)',
]);

// Algebra Factory ABI
const FACTORY_ABI = parseAbi([
  'function poolByPair(address tokenA, address tokenB) external view returns (address pool)',
]);

// Algebra Pool ABI
const POOL_ABI = parseAbi([
  'function safelyGetStateOfAMM() external view returns (uint160 sqrtPrice, int24 tick, uint16 lastFee, uint8 pluginConfig, uint128 activeLiquidity, int24 nextTick, int24 previousTick)',
  'function getReserves() external view returns (uint128 reserve0, uint128 reserve1)',
  'function token0() external view returns (address)',
  'function token1() external view returns (address)',
]);

export interface SwapQuote {
  amountIn: string;
  amountOut: string;
  priceImpact: number;
  fee: number;
  route: string;
  gasEstimate: bigint;
  executionPrice: number;
  minimumReceived?: string;
}

export interface TokenBalance {
  balance: string;
  formatted: string;
  decimals: number;
  symbol: string;
  usdValue?: number;
}

export interface PoolInfo {
  address: Address;
  token0: Address;
  token1: Address;
  sqrtPrice: bigint;
  tick: number;
  fee: number;
  liquidity: bigint;
  reserve0: string;
  reserve1: string;
}

class EnhancedSwapService {
  private publicClient;
  private chain;

  constructor() {
    const network = getCurrentNetworkName();
    this.chain = network === 'mainnet' ? somniaMainnet : somniaTestnet;
    
    this.publicClient = createPublicClient({
      chain: this.chain,
      transport: http(this.chain.rpcUrls.default.http[0]),
    });
  }

  /**
   * Get token balance for a user
   */
  async getTokenBalance(userAddress: Address, tokenSymbol: string): Promise<TokenBalance> {
    try {
      const tokenAddress = TOKEN_ADDRESSES[tokenSymbol.toUpperCase()];
      if (!tokenAddress) {
        console.warn(`Token ${tokenSymbol} not in local mapping, returning zero balance`);
        return {
          balance: '0',
          formatted: '0',
          decimals: 18,
          symbol: tokenSymbol.toUpperCase(),
        };
      }


      // Get ERC20 balance
      const balance = await this.publicClient.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [userAddress],
      }) as bigint;

      const decimals = TOKEN_DECIMALS[tokenSymbol.toUpperCase()] || 18;

      return {
        balance: balance.toString(),
        formatted: formatUnits(balance, decimals),
        decimals,
        symbol: tokenSymbol.toUpperCase(),
      };
    } catch (error) {
      console.error(`Error fetching balance for ${tokenSymbol}:`, error);
      return {
        balance: '0',
        formatted: '0',
        decimals: 18,
        symbol: tokenSymbol.toUpperCase(),
      };
    }
  }

  /**
   * Get multiple token balances at once
   */
  async getMultipleBalances(userAddress: Address, tokens: string[]): Promise<Record<string, TokenBalance>> {
    const balances: Record<string, TokenBalance> = {};
    
    await Promise.all(
      tokens.map(async (token) => {
        balances[token] = await this.getTokenBalance(userAddress, token);
      })
    );
    
    return balances;
  }

  /**
   * Get swap quote for exact input (know how much to spend)
   */
  async getQuoteExactInput(
    tokenIn: string,
    tokenOut: string,
    amountIn: string,
    slippageTolerance: number = 0.5 // 0.5% default slippage
  ): Promise<SwapQuote> {
    try {
      const tokenInAddress = TOKEN_ADDRESSES[tokenIn.toUpperCase()];
      const tokenOutAddress = TOKEN_ADDRESSES[tokenOut.toUpperCase()];
      
      if (!tokenInAddress || !tokenOutAddress) {
        console.warn(`Token pair not fully supported, trying DIA Oracle`);
        return this.getQuoteFromDiaOracle(tokenIn, tokenOut, amountIn, slippageTolerance);
      }

      const decimalsIn = TOKEN_DECIMALS[tokenIn.toUpperCase()] || 18;
      const decimalsOut = TOKEN_DECIMALS[tokenOut.toUpperCase()] || 18;
      const amountInWei = parseUnits(amountIn, decimalsIn);

      try {
        // Call QuoterV2 to get the quote
        const quoteParams = {
          tokenIn: tokenInAddress,
          tokenOut: tokenOutAddress,
          deployer: CONTRACTS.AlgebraPoolDeployer,
          amountIn: amountInWei,
          limitSqrtPrice: 0n,
        };

        const result = await this.publicClient.simulateContract({
          address: CONTRACTS.QuoterV2,
          abi: QUOTER_V2_ABI,
          functionName: 'quoteExactInputSingle',
          args: [quoteParams],
        });

        const [amountOut, , , , gasEstimate, fee] = result.result as [bigint, bigint, bigint, number, bigint, number];

        // Calculate price impact and other metrics
        const amountOutFormatted = formatUnits(amountOut, decimalsOut);
        const executionPrice = parseFloat(amountOutFormatted) / parseFloat(amountIn);
        
        // Calculate minimum amount out with slippage
        const minAmountOut = amountOut * BigInt(Math.floor((1 - slippageTolerance / 100) * 10000)) / 10000n;
        
        return {
          amountIn,
          amountOut: amountOutFormatted,
          priceImpact: 0, // Would need pool reserves to calculate accurately
          fee: fee / 10000, // Convert from hundredths of a bip to percentage
          route: `${tokenIn} → ${tokenOut}`,
          gasEstimate,
          executionPrice,
          minimumReceived: formatUnits(minAmountOut, decimalsOut),
        };
      } catch (quoteError) {
        console.error('QuoterV2 failed, trying DIA Oracle:', quoteError);
        // Try getting price from DIA Oracle instead
        return this.getQuoteFromDiaOracle(tokenIn, tokenOut, amountIn, slippageTolerance);
      }
    } catch (error) {
      console.error('Error getting quote:', error);
      throw new Error('Unable to fetch quote. Please try again.');
    }
  }

  /**
   * Get quote from DIA Oracle (fallback when QuoterV2 fails)
   */
  private async getQuoteFromDiaOracle(
    tokenIn: string,
    tokenOut: string,
    amountIn: string,
    slippageTolerance: number
  ): Promise<SwapQuote> {
    try {
      console.log(`Getting quote from DIA Oracle for ${tokenIn} -> ${tokenOut}`);
      
      // Get prices from DIA Oracle
      const [priceInData, priceOutData] = await Promise.all([
        diaOracleService.getPrice(tokenIn),
        diaOracleService.getPrice(tokenOut)
      ]);

      if (!priceInData || !priceOutData) {
        throw new Error('DIA Oracle prices not available');
      }

      // Calculate the exchange based on USD prices from oracle
      const amountInFloat = parseFloat(amountIn);
      const valueInUSD = amountInFloat * priceInData.value;
      const amountOut = valueInUSD / priceOutData.value;
      const executionPrice = amountOut / amountInFloat;
      const minAmountOut = amountOut * (1 - slippageTolerance / 100);

      console.log(`DIA Oracle quote: ${amountIn} ${tokenIn} = ${amountOut.toFixed(6)} ${tokenOut}`);

      return {
        amountIn,
        amountOut: amountOut.toFixed(6),
        priceImpact: 0.1, // Low estimate for oracle-based pricing
        fee: 0.3,
        route: `${tokenIn} → ${tokenOut} (via Oracle)`,
        gasEstimate: 150000n,
        executionPrice,
        minimumReceived: minAmountOut.toFixed(6),
      };
    } catch (error) {
      console.error('DIA Oracle fallback failed:', error);
      // Last resort: try price API
      return this.getQuoteFromPriceAPI(tokenIn, tokenOut, amountIn, slippageTolerance);
    }
  }

  /**
   * Get quote from price API (last resort fallback)
   */
  private async getQuoteFromPriceAPI(
    tokenIn: string,
    tokenOut: string,
    amountIn: string,
    slippageTolerance: number
  ): Promise<SwapQuote> {
    try {
      // Fetch current prices from our price API
      const [priceIn, priceOut] = await Promise.all([
        fetch(`/api/price?token=${tokenIn}`).then(r => r.json()),
        fetch(`/api/price?token=${tokenOut}`).then(r => r.json())
      ]);

      if (!priceIn.success || !priceOut.success) {
        throw new Error('Unable to fetch prices from any source');
      }

      // Calculate the exchange based on USD prices
      const amountInFloat = parseFloat(amountIn);
      const valueInUSD = amountInFloat * priceIn.price;
      const amountOut = valueInUSD / priceOut.price;
      const executionPrice = amountOut / amountInFloat;
      const minAmountOut = amountOut * (1 - slippageTolerance / 100);

      return {
        amountIn,
        amountOut: amountOut.toFixed(6),
        priceImpact: 0.2,
        fee: 0.3,
        route: `${tokenIn} → ${tokenOut}`,
        gasEstimate: 150000n,
        executionPrice,
        minimumReceived: minAmountOut.toFixed(6),
      };
    } catch (error) {
      console.error('All price sources failed:', error);
      throw new Error('Unable to fetch quote. Please check your connection and try again.');
    }
  }

  /**
   * Get swap quote for exact output (know how much you want to receive)
   */
  async getQuoteExactOutput(
    tokenIn: string,
    tokenOut: string,
    amountOut: string,
    slippageTolerance: number = 0.5
  ): Promise<SwapQuote> {
    try {
      const tokenInAddress = TOKEN_ADDRESSES[tokenIn.toUpperCase()];
      const tokenOutAddress = TOKEN_ADDRESSES[tokenOut.toUpperCase()];
      
      if (!tokenInAddress || !tokenOutAddress) {
        console.warn(`Token pair not fully supported, trying DIA Oracle`);
        return this.getQuoteFromDiaOracle(tokenIn, tokenOut, amountIn, slippageTolerance);
      }

      const decimalsIn = TOKEN_DECIMALS[tokenIn.toUpperCase()] || 18;
      const decimalsOut = TOKEN_DECIMALS[tokenOut.toUpperCase()] || 18;
      const amountOutWei = parseUnits(amountOut, decimalsOut);

      // Call QuoterV2 to get the quote
      const quoteParams = {
        tokenIn: tokenInAddress,
        tokenOut: tokenOutAddress,
        deployer: CONTRACTS.AlgebraPoolDeployer,
        amount: amountOutWei,
        limitSqrtPrice: 0n,
      };

      const result = await this.publicClient.simulateContract({
        address: CONTRACTS.QuoterV2,
        abi: QUOTER_V2_ABI,
        functionName: 'quoteExactOutputSingle',
        args: [quoteParams],
      });

      const [, amountIn, , , gasEstimate, fee] = result.result as [bigint, bigint, bigint, number, bigint, number];

      // Calculate price impact and other metrics
      const amountInFormatted = formatUnits(amountIn, decimalsIn);
      const executionPrice = parseFloat(amountOut) / parseFloat(amountInFormatted);
      
      // Calculate maximum amount in with slippage
      const maxAmountIn = amountIn * BigInt(Math.floor((1 + slippageTolerance / 100) * 10000)) / 10000n;
      
      return {
        amountIn: amountInFormatted,
        amountOut,
        priceImpact: 0,
        fee: fee / 10000,
        route: `${tokenIn} → ${tokenOut}`,
        gasEstimate,
        executionPrice,
        minimumReceived: amountOut,
      };
    } catch (error) {
      console.error('Error getting quote:', error);
      throw error;
    }
  }

  /**
   * Get pool information for a token pair
   */
  async getPoolInfo(tokenA: string, tokenB: string): Promise<PoolInfo | null> {
    try {
      const tokenAAddress = TOKEN_ADDRESSES[tokenA.toUpperCase()];
      const tokenBAddress = TOKEN_ADDRESSES[tokenB.toUpperCase()];
      
      if (!tokenAAddress || !tokenBAddress) {
        throw new Error('Invalid token pair');
      }

      // Get pool address from factory
      const poolAddress = await this.publicClient.readContract({
        address: CONTRACTS.AlgebraFactory,
        abi: FACTORY_ABI,
        functionName: 'poolByPair',
        args: [tokenAAddress, tokenBAddress],
      }) as Address;

      if (poolAddress === '0x0000000000000000000000000000000000000000') {
        return null; // Pool doesn't exist
      }

      // Get pool state
      const [poolState, reserves] = await Promise.all([
        this.publicClient.readContract({
          address: poolAddress,
          abi: POOL_ABI,
          functionName: 'safelyGetStateOfAMM',
        }) as Promise<[bigint, number, number, number, bigint, number, number]>,
        this.publicClient.readContract({
          address: poolAddress,
          abi: POOL_ABI,
          functionName: 'getReserves',
        }) as Promise<[bigint, bigint]>,
      ]);

      const [sqrtPrice, tick, fee, , liquidity] = poolState;
      const [reserve0, reserve1] = reserves;

      // Get token addresses to determine order
      const [token0, token1] = await Promise.all([
        this.publicClient.readContract({
          address: poolAddress,
          abi: POOL_ABI,
          functionName: 'token0',
        }) as Promise<Address>,
        this.publicClient.readContract({
          address: poolAddress,
          abi: POOL_ABI,
          functionName: 'token1',
        }) as Promise<Address>,
      ]);

      const decimals0 = Object.entries(TOKEN_ADDRESSES).find(([, addr]) => addr === token0)?.[0];
      const decimals1 = Object.entries(TOKEN_ADDRESSES).find(([, addr]) => addr === token1)?.[0];
      
      return {
        address: poolAddress,
        token0,
        token1,
        sqrtPrice,
        tick,
        fee,
        liquidity,
        reserve0: formatUnits(reserve0, TOKEN_DECIMALS[decimals0 || 'ETH'] || 18),
        reserve1: formatUnits(reserve1, TOKEN_DECIMALS[decimals1 || 'ETH'] || 18),
      };
    } catch (error) {
      console.error('Error getting pool info:', error);
      return null;
    }
  }

  /**
   * Check if user has approved enough tokens for swap
   */
  async checkAllowance(
    userAddress: Address,
    tokenSymbol: string,
    amount: string
  ): Promise<boolean> {
    try {
      const tokenAddress = TOKEN_ADDRESSES[tokenSymbol.toUpperCase()];
      if (!tokenAddress) return false;


      const decimals = TOKEN_DECIMALS[tokenSymbol.toUpperCase()] || 18;
      const amountWei = parseUnits(amount, decimals);

      const allowance = await this.publicClient.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [userAddress, CONTRACTS.SwapRouter],
      }) as bigint;

      return allowance >= amountWei;
    } catch (error) {
      console.error('Error checking allowance:', error);
      return false;
    }
  }

  /**
   * Get approval transaction data
   */
  getApprovalTx(tokenSymbol: string, amount: string) {
    const tokenAddress = TOKEN_ADDRESSES[tokenSymbol.toUpperCase()];
    if (!tokenAddress) throw new Error('Invalid token');

    const decimals = TOKEN_DECIMALS[tokenSymbol.toUpperCase()] || 18;
    const amountWei = parseUnits(amount, decimals);

    return {
      to: tokenAddress,
      data: encodePacked(
        ['bytes4', 'address', 'uint256'],
        ['0x095ea7b3', CONTRACTS.SwapRouter, amountWei]
      ),
    };
  }

  /**
   * Get swap transaction data for exact input
   */
  getSwapExactInputTx(
    tokenIn: string,
    tokenOut: string,
    amountIn: string,
    minimumAmountOut: string,
    recipient: Address,
    deadline?: number
  ) {
    const tokenInAddress = TOKEN_ADDRESSES[tokenIn.toUpperCase()];
    const tokenOutAddress = TOKEN_ADDRESSES[tokenOut.toUpperCase()];
    
    if (!tokenInAddress || !tokenOutAddress) {
      throw new Error('Invalid token pair');
    }

    const decimalsIn = TOKEN_DECIMALS[tokenIn.toUpperCase()] || 18;
    const decimalsOut = TOKEN_DECIMALS[tokenOut.toUpperCase()] || 18;
    
    const params = {
      tokenIn: tokenInAddress,
      tokenOut: tokenOutAddress,
      deployer: CONTRACTS.AlgebraPoolDeployer,
      recipient,
      deadline: BigInt(deadline || Math.floor(Date.now() / 1000) + 1200), // 20 minutes
      amountIn: parseUnits(amountIn, decimalsIn),
      amountOutMinimum: parseUnits(minimumAmountOut, decimalsOut),
      limitSqrtPrice: 0n,
    };

    // Encode the function call
    return {
      to: CONTRACTS.SwapRouter,
      data: encodePacked(
        ['bytes4', 'bytes'],
        ['0x04e45aff', params] // exactInputSingle selector
      ),
      value: 0n, // No native ETH, only WETH
    };
  }
}

// Export singleton instance
export const enhancedSwapService = new EnhancedSwapService();

// Export types
export type { SwapQuote, TokenBalance, PoolInfo };