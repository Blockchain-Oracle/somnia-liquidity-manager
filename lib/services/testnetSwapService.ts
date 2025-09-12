/**
 * Testnet Swap Service
 * Handles token approvals and swaps on testnet SimpleLiquidityPool contracts
 */

import { parseUnits, formatUnits, type Address } from 'viem'
import { TESTNET_CONTRACTS, SIMPLE_LIQUIDITY_POOL_ABI } from '@/lib/constants/contracts'

// ERC20 ABI for approvals and allowance checks
export const ERC20_ABI = [
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const

export class TestnetSwapService {
  /**
   * Get a mock quote for testnet swaps
   * Uses simple AMM formula: outputAmount = (inputAmount * reserveOut) / (reserveIn + inputAmount)
   */
  async getTestnetQuote(
    fromTokenSymbol: string,
    toTokenSymbol: string,
    amountIn: string,
    slippagePercent: number = 0.5
  ) {
    try {
      // For testnet, return a simple mock quote
      const amountInFloat = parseFloat(amountIn)
      
      // Simple price ratios for testnet tokens (mock values)
      const mockPrices: Record<string, number> = {
        'WSTT': 2.0,     // $2 per WSTT
        'tWETH': 4000.0, // $4000 per tWETH
        'tUSDC': 1.0,    // $1 per tUSDC
        'tUSDT': 1.0     // $1 per tUSDT
      }
      
      const fromPrice = mockPrices[fromTokenSymbol] || 1
      const toPrice = mockPrices[toTokenSymbol] || 1
      
      // Calculate output amount based on price ratio
      const valueInUSD = amountInFloat * fromPrice
      const amountOut = valueInUSD / toPrice
      
      // Apply 0.3% fee
      const amountOutWithFee = amountOut * 0.997
      
      // Calculate minimum received with slippage
      const minReceived = amountOutWithFee * (1 - slippagePercent / 100)
      
      return {
        estimatedOutput: amountOutWithFee,
        executionPrice: amountOutWithFee / amountInFloat,
        priceImpact: 0.5, // Mock price impact
        fee: 0.3,
        minimumReceived: minReceived.toFixed(6),
        route: `${fromTokenSymbol} → ${toTokenSymbol}`,
        gasEstimate: 150000n
      }
    } catch (error) {
      console.error('Error getting testnet quote:', error)
      return null
    }
  }
  /**
   * Get token balance for testnet tokens
   */
  async getTestnetTokenBalance(tokenSymbol: string, userAddress: string) {
    try {
      // Import viem client
      const { createPublicClient, http, formatUnits } = await import('viem')
      const { somniaTestnet } = await import('@/lib/wagmi')
      
      const publicClient = createPublicClient({
        chain: somniaTestnet,
        transport: http()
      })
      
      // STT on testnet is actually WSOMI (wrapped), an ERC20 token
      // Users need native STT for gas, but STT token for swaps
      
      // For ERC20 tokens
      const tokenAddress = this.getTokenAddress(tokenSymbol)
      
      if (!tokenAddress) {
        console.warn(`Token ${tokenSymbol} not found in testnet contracts`)
        return {
          balance: '0',
          formatted: '0',
          decimals: 18,
          symbol: tokenSymbol,
        }
      }
      
      // Get ERC20 balance
      const balance = await publicClient.readContract({
        address: tokenAddress as Address,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [userAddress as Address],
      }) as bigint
      
      // All testnet tokens use 18 decimals
      const decimals = 18
      const formatted = formatUnits(balance, decimals)
      
      return {
        balance: balance.toString(),
        formatted,
        decimals,
        symbol: tokenSymbol,
      }
    } catch (error) {
      console.error(`Error fetching balance for ${tokenSymbol}:`, error)
      return {
        balance: '0',
        formatted: '0',
        decimals: 18,
        symbol: tokenSymbol,
      }
    }
  }
  
  /**
   * Get the pool address for a token pair
   */
  getPoolAddress(token0Symbol: string, token1Symbol: string): string | null {
    // Try both directions
    const poolKey = `${token0Symbol}/${token1Symbol}`
    const reversePoolKey = `${token1Symbol}/${token0Symbol}`
    
    return TESTNET_CONTRACTS.pools[poolKey] || TESTNET_CONTRACTS.pools[reversePoolKey] || null
  }

  /**
   * Get token address from symbol
   */
  getTokenAddress(symbol: string): string | null {
    return TESTNET_CONTRACTS.tokens[symbol] || null
  }

  /**
   * Check if tokens are in correct order for the pool
   */
  getTokenOrder(token0Symbol: string, token1Symbol: string): { 
    isCorrectOrder: boolean, 
    poolKey: string,
    poolAddress: string | null 
  } {
    const poolKey = `${token0Symbol}/${token1Symbol}`
    const reversePoolKey = `${token1Symbol}/${token0Symbol}`
    
    if (TESTNET_CONTRACTS.pools[poolKey]) {
      return { 
        isCorrectOrder: true, 
        poolKey,
        poolAddress: TESTNET_CONTRACTS.pools[poolKey] 
      }
    } else if (TESTNET_CONTRACTS.pools[reversePoolKey]) {
      return { 
        isCorrectOrder: false, 
        poolKey: reversePoolKey,
        poolAddress: TESTNET_CONTRACTS.pools[reversePoolKey] 
      }
    }
    
    return { isCorrectOrder: true, poolKey, poolAddress: null }
  }

  /**
   * Calculate swap output amount using AMM formula
   */
  calculateSwapOutput(
    amountIn: bigint,
    reserveIn: bigint,
    reserveOut: bigint,
    feePercent: number = 0.3
  ): bigint {
    const amountInWithFee = amountIn * BigInt(1000 - feePercent * 10) // 0.3% = 997/1000
    const numerator = amountInWithFee * reserveOut
    const denominator = reserveIn * 1000n + amountInWithFee
    return numerator / denominator
  }

  /**
   * Calculate price impact
   */
  calculatePriceImpact(
    amountIn: bigint,
    amountOut: bigint,
    reserveIn: bigint,
    reserveOut: bigint
  ): number {
    // Current price = reserveOut / reserveIn
    // New price after swap = (reserveOut - amountOut) / (reserveIn + amountIn)
    // Price impact = (newPrice - currentPrice) / currentPrice * 100
    
    const currentPrice = Number(reserveOut) / Number(reserveIn)
    const newReserveOut = Number(reserveOut) - Number(amountOut)
    const newReserveIn = Number(reserveIn) + Number(amountIn)
    const newPrice = newReserveOut / newReserveIn
    
    const impact = Math.abs((newPrice - currentPrice) / currentPrice) * 100
    return impact
  }

  /**
   * Format swap parameters for the contract
   */
  formatSwapParams(
    fromTokenSymbol: string,
    toTokenSymbol: string,
    amountIn: string,
    slippagePercent: number = 0.5
  ): {
    poolAddress: string
    tokenInAddress: string
    amountInWei: bigint
    minAmountOut: bigint
    zeroForOne: boolean
  } | null {
    const { poolAddress, isCorrectOrder } = this.getTokenOrder(fromTokenSymbol, toTokenSymbol)
    if (!poolAddress) return null

    const tokenInAddress = this.getTokenAddress(fromTokenSymbol)
    if (!tokenInAddress) return null

    // Parse amount with 18 decimals (all testnet tokens use 18 decimals)
    const amountInWei = parseUnits(amountIn, 18)
    
    // For min amount out, we'd need to fetch reserves and calculate
    // For now, using a simple slippage calculation
    const minAmountOut = amountInWei * BigInt(Math.floor((100 - slippagePercent) * 10)) / 1000n

    return {
      poolAddress,
      tokenInAddress,
      amountInWei,
      minAmountOut,
      zeroForOne: isCorrectOrder
    }
  }
}

// Export singleton instance
export const testnetSwapService = new TestnetSwapService()