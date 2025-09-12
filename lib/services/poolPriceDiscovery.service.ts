/**
 * Pool-based Price Discovery Service
 * Uses QuickSwap V4 (Algebra) liquidity pools to determine token prices
 * This is especially useful for WETH and WSOMI which don't have DIA adapters
 */

import { createPublicClient, http, parseAbi, type Address } from 'viem'
import { somniaMainnet } from '@/lib/wagmi'
import { QUICKSWAP_V4_ADDRESSES, SOMNIA_TOKENS, TOKEN_INFO } from '@/lib/config/somnia-tokens.config'

// Algebra Pool ABI for price discovery
const ALGEBRA_POOL_ABI = parseAbi([
  'function globalState() external view returns (uint160 price, int24 tick, uint16 feeZto, uint16 feeOtz, uint8 timepointIndex, uint8 communityFee, bool unlocked)',
  'function token0() external view returns (address)',
  'function token1() external view returns (address)',
  'function liquidity() external view returns (uint128)',
])

// Algebra Factory ABI to find pools
const ALGEBRA_FACTORY_ABI = parseAbi([
  'function poolByPair(address tokenA, address tokenB) external view returns (address pool)',
])

// QuoterV2 ABI for getting swap quotes
const QUOTER_V2_ABI = parseAbi([
  'function quoteExactInputSingle(address tokenIn, address tokenOut, uint256 amountIn, uint160 limitSqrtPrice) external returns (uint256 amountOut, uint160 sqrtPriceX96After, uint32 initializedTicksCrossed, uint256 gasEstimate)',
  'function quoteExactOutputSingle(address tokenIn, address tokenOut, uint256 amountOut, uint160 limitSqrtPrice) external returns (uint256 amountIn, uint160 sqrtPriceX96After, uint32 initializedTicksCrossed, uint256 gasEstimate)',
])

export class PoolPriceDiscoveryService {
  private publicClient
  private factory: Address
  private quoter: Address
  
  constructor() {
    this.publicClient = createPublicClient({
      chain: somniaMainnet,
      transport: http(somniaMainnet.rpcUrls.default.http[0]),
    })
    
    this.factory = QUICKSWAP_V4_ADDRESSES.AlgebraFactory
    this.quoter = QUICKSWAP_V4_ADDRESSES.QuoterV2
  }

  /**
   * Get token price using liquidity pools
   * Strategy:
   * 1. For WETH/WSOMI: Try direct pool with USDC
   * 2. If no direct pool: Try routing through intermediate token
   * 3. Use QuoterV2 to simulate swap for price discovery
   */
  async getTokenPriceFromPools(tokenSymbol: string): Promise<number | null> {
    console.log(`[Pool Price Discovery] Getting price for ${tokenSymbol} from pools`)
    
    const tokenAddress = SOMNIA_TOKENS[tokenSymbol as keyof typeof SOMNIA_TOKENS]
    if (!tokenAddress) {
      console.error(`[Pool Price Discovery] Token ${tokenSymbol} not found in config`)
      return null
    }

    // Try to get price against USDC (most common stable pair)
    const usdcAddress = SOMNIA_TOKENS.USDC
    
    try {
      // Method 1: Try using QuoterV2 to simulate a swap
      const price = await this.getPriceViaQuoter(tokenAddress, usdcAddress, tokenSymbol)
      if (price) return price

      // Method 2: Try to find a pool and calculate from sqrt price
      const poolPrice = await this.getPriceFromPool(tokenAddress, usdcAddress, tokenSymbol)
      if (poolPrice) return poolPrice

      // Method 3: Try routing through USDT if USDC fails
      const usdtAddress = SOMNIA_TOKENS.USDT
      const usdtPrice = await this.getPriceViaQuoter(tokenAddress, usdtAddress, tokenSymbol)
      if (usdtPrice) return usdtPrice

      // Method 4: For WSOMI, try routing through WETH
      if (tokenSymbol === 'WSOMI') {
        const wethPrice = await this.getTokenPriceFromPools('WETH')
        if (wethPrice) {
          // Get WSOMI/WETH price
          const wsomiInWeth = await this.getPriceViaQuoter(tokenAddress, SOMNIA_TOKENS.WETH, tokenSymbol)
          if (wsomiInWeth) {
            return wsomiInWeth * wethPrice
          }
        }
      }

      console.log(`[Pool Price Discovery] No pool price found for ${tokenSymbol}`)
      return null
    } catch (error) {
      console.error(`[Pool Price Discovery] Error getting price for ${tokenSymbol}:`, error)
      return null
    }
  }

  /**
   * Get price using QuoterV2 by simulating a swap
   */
  private async getPriceViaQuoter(
    tokenIn: Address,
    tokenOut: Address,
    tokenSymbol: string
  ): Promise<number | null> {
    try {
      console.log(`[Pool Price Discovery] Trying QuoterV2 for ${tokenSymbol}`)
      
      // Get token decimals
      const tokenInInfo = Object.values(TOKEN_INFO).find(t => t.address === tokenIn)
      const tokenOutInfo = Object.values(TOKEN_INFO).find(t => t.address === tokenOut)
      
      if (!tokenInInfo || !tokenOutInfo) {
        console.log(`[Pool Price Discovery] Token info not found`)
        return null
      }

      // Use 1 token as input amount
      const amountIn = BigInt(10 ** tokenInInfo.decimals)
      
      // Try to get quote
      const result = await this.publicClient.simulateContract({
        address: this.quoter,
        abi: QUOTER_V2_ABI,
        functionName: 'quoteExactInputSingle',
        args: [tokenIn, tokenOut, amountIn, BigInt(0)],
      })

      if (result && result.result) {
        const [amountOut] = result.result as [bigint, bigint, number, bigint]
        
        // Calculate price
        const price = Number(amountOut) / (10 ** tokenOutInfo.decimals)
        console.log(`[Pool Price Discovery] QuoterV2 price for ${tokenSymbol}: $${price}`)
        
        return price
      }
    } catch (error: any) {
      console.log(`[Pool Price Discovery] QuoterV2 failed for ${tokenSymbol}:`, error.message?.slice(0, 100))
    }
    
    return null
  }

  /**
   * Get price directly from pool's sqrt price
   */
  private async getPriceFromPool(
    token0: Address,
    token1: Address,
    tokenSymbol: string
  ): Promise<number | null> {
    try {
      console.log(`[Pool Price Discovery] Looking for pool for ${tokenSymbol}`)
      
      // Find pool address
      const poolAddress = await this.publicClient.readContract({
        address: this.factory,
        abi: ALGEBRA_FACTORY_ABI,
        functionName: 'poolByPair',
        args: [token0, token1],
      }) as Address

      if (!poolAddress || poolAddress === '0x0000000000000000000000000000000000000000') {
        console.log(`[Pool Price Discovery] No pool found for ${tokenSymbol}`)
        return null
      }

      console.log(`[Pool Price Discovery] Found pool at ${poolAddress}`)

      // Get pool state
      const [globalState, poolToken0, poolToken1] = await Promise.all([
        this.publicClient.readContract({
          address: poolAddress,
          abi: ALGEBRA_POOL_ABI,
          functionName: 'globalState',
        }) as Promise<[bigint, number, number, number, number, number, boolean]>,
        this.publicClient.readContract({
          address: poolAddress,
          abi: ALGEBRA_POOL_ABI,
          functionName: 'token0',
        }) as Promise<Address>,
        this.publicClient.readContract({
          address: poolAddress,
          abi: ALGEBRA_POOL_ABI,
          functionName: 'token1',
        }) as Promise<Address>,
      ])

      const [sqrtPriceX96] = globalState

      // Calculate price from sqrt price
      const price = this.calculatePriceFromSqrtPrice(
        sqrtPriceX96,
        poolToken0,
        poolToken1,
        token0
      )

      if (price) {
        console.log(`[Pool Price Discovery] Pool price for ${tokenSymbol}: $${price}`)
        return price
      }
    } catch (error) {
      console.log(`[Pool Price Discovery] Pool read failed for ${tokenSymbol}`)
    }

    return null
  }

  /**
   * Calculate price from Uniswap V3 sqrt price
   */
  private calculatePriceFromSqrtPrice(
    sqrtPriceX96: bigint,
    poolToken0: Address,
    poolToken1: Address,
    targetToken: Address
  ): number | null {
    try {
      const token0Info = Object.values(TOKEN_INFO).find(t => t.address === poolToken0)
      const token1Info = Object.values(TOKEN_INFO).find(t => t.address === poolToken1)
      
      if (!token0Info || !token1Info) return null

      // Convert sqrt price to actual price
      const sqrtPrice = Number(sqrtPriceX96) / (2 ** 96)
      let price = sqrtPrice ** 2

      // Adjust for decimals
      const decimalAdjustment = 10 ** (token0Info.decimals - token1Info.decimals)
      price = price * decimalAdjustment

      // If target token is token1, invert the price
      if (targetToken.toLowerCase() === poolToken1.toLowerCase()) {
        price = 1 / price
      }

      return price
    } catch (error) {
      console.error('[Pool Price Discovery] Error calculating price from sqrt:', error)
      return null
    }
  }

  /**
   * Get all available pools for a token
   */
  async getAvailablePoolsForToken(tokenSymbol: string): Promise<Array<{ pair: string, address: Address }>> {
    const pools: Array<{ pair: string, address: Address }> = []
    const tokenAddress = SOMNIA_TOKENS[tokenSymbol as keyof typeof SOMNIA_TOKENS]
    
    if (!tokenAddress) return pools

    // Check against all other tokens
    for (const [symbol, address] of Object.entries(SOMNIA_TOKENS)) {
      if (symbol === tokenSymbol) continue
      
      try {
        const poolAddress = await this.publicClient.readContract({
          address: this.factory,
          abi: ALGEBRA_FACTORY_ABI,
          functionName: 'poolByPair',
          args: [tokenAddress, address as Address],
        }) as Address

        if (poolAddress && poolAddress !== '0x0000000000000000000000000000000000000000') {
          pools.push({
            pair: `${tokenSymbol}/${symbol}`,
            address: poolAddress,
          })
          console.log(`[Pool Price Discovery] Found pool: ${tokenSymbol}/${symbol} at ${poolAddress}`)
        }
      } catch (error) {
        // Pool doesn't exist, continue
      }
    }

    return pools
  }
}

// Export singleton instance
export const poolPriceDiscovery = new PoolPriceDiscoveryService()

// Helper function for other services to use
export async function getPoolPrice(tokenSymbol: string): Promise<number> {
  const price = await poolPriceDiscovery.getTokenPriceFromPools(tokenSymbol)
  return price || 0
}