import axios from 'axios'
import type { AxiosInstance } from 'axios'

const STARGATE_API_BASE = 'https://stargate.finance/api/v1'

// Chain keys supported by Stargate
export const CHAIN_KEYS = {
  ETHEREUM: 'ethereum',
  ARBITRUM: 'arbitrum',
  OPTIMISM: 'optimism',
  POLYGON: 'polygon',
  BSC: 'bsc',
  AVALANCHE: 'avalanche',
  BASE: 'base',
  LINEA: 'linea',
  SCROLL: 'scroll',
  MANTLE: 'mantle',
  METIS: 'metis',
  BLAST: 'blast',
  ZKPOLYGON: 'zkpolygon',
  ZKSYNC: 'zksync',
  SEI: 'sei',
  KAIA: 'kaia',
  SONEIUM: 'soneium',
  SOMNIA: 'somnia', // Add Somnia to the list
} as const

export type ChainKey = typeof CHAIN_KEYS[keyof typeof CHAIN_KEYS]

// Native token address (ETH, BNB, etc)
export const NATIVE_TOKEN_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'

// Common token addresses on different chains
export const TOKEN_ADDRESSES = {
  ethereum: {
    ETH: NATIVE_TOKEN_ADDRESS,
    USDC: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    USDT: '0xdac17f958d2ee523a2206206994597c13d831ec7',
    WETH: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    SOMI: '0x1B0F6590d21dc02B92ad3A7D00F8884dC4f1aed9', // SomniaOFT on Ethereum
  },
  polygon: {
    MATIC: NATIVE_TOKEN_ADDRESS,
    USDC: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
    USDT: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
    WETH: '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619',
  },
  arbitrum: {
    ETH: NATIVE_TOKEN_ADDRESS,
    USDC: '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
    USDT: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9',
    WETH: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
  },
  base: {
    ETH: NATIVE_TOKEN_ADDRESS,
    USDC: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
    WETH: '0x4200000000000000000000000000000000000006',
    SOMI: '0x47636b3188774a3E7273D85A537b9bA4Ee7b2535', // SomniaOFT on Base
  },
  bsc: {
    BNB: NATIVE_TOKEN_ADDRESS,
    USDC: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
    USDT: '0x55d398326f99059ff775485246999027b3197955',
    ETH: '0x2170ed0880ac9a755fd29b2688956bd959f933f8',
    SOMI: '0xa9616e5e23EC1582c2828B025bEcf3Ef610e266F', // SomniaOFT on BSC
  },
  somnia: {
    SOMI: NATIVE_TOKEN_ADDRESS, // Native SOMI
    'USDC.e': '0x28BEc7E30E6faee657a03e19Bf1128AaD7632A00', // Bridged USDC
    USDC: '0x28BEc7E30E6faee657a03e19Bf1128AaD7632A00', // Same as USDC.e
    USDT: '0x67B302E35Aef5EEE8c32D934F5856869EF428330', // Bridged USDT
    WETH: '0x936Ab8C674bcb567CD5dEB85D8A216494704E9D8', // WETH on Somnia
  }
}

// Types for API responses
export interface Chain {
  chainKey: string
  chainType: 'evm' | 'solana' | 'aptos'
  chainId: number
  shortName: string
  name: string
  nativeCurrency: {
    chainKey: string
    name: string
    symbol: string
    decimals: number
    address: string
  }
}

export interface Token {
  isBridgeable: boolean
  chainKey: string
  address: string
  decimals: number
  symbol: string
  name: string
  price?: {
    usd: number
  }
}

export interface Fee {
  token: string
  amount: string
  type: 'message' | 'protocol'
  chainKey: string
}

export interface TransactionStep {
  type: 'approve' | 'bridge'
  sender: string
  chainKey: string
  transaction: {
    data: string
    to: string
    from: string
    value?: string
  }
}

export interface BridgeQuote {
  route: string
  srcAddress: string
  dstAddress: string
  srcChainKey: string
  dstChainKey: string
  error: string | null
  srcToken: string
  dstToken: string
  srcAmount: string
  srcAmountMax: string
  dstAmount: string
  dstAmountMin: string
  duration: {
    estimated: number
  }
  allowance: string
  dstNativeAmount: string
  fees: Fee[]
  steps: TransactionStep[]
}

export interface QuoteParams {
  srcToken: string
  dstToken: string
  srcAddress: string
  dstAddress: string
  srcChainKey: ChainKey
  dstChainKey: ChainKey
  srcAmount: string
  dstAmountMin: string
}

export interface QuotesResponse {
  quotes: BridgeQuote[]
}

export class StargateApiService {
  private apiBase: string
  private axiosInstance: AxiosInstance
  
  // Cache for route availability to avoid repeated API calls
  private routeCache: Map<string, { available: boolean; timestamp: number }> = new Map()
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes cache
  
  // Chains that are NOT supported by Stargate Bridge
  private unsupportedChains = ['somnia-testnet'] // Somnia mainnet IS supported!

  constructor() {
    this.apiBase = STARGATE_API_BASE
    // Create axios instance with timeout and retry logic
    this.axiosInstance = axios.create({
      timeout: 10000, // 10 second timeout
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })
  }

  /**
   * Get available chains from Stargate API
   */
  async getChains(): Promise<Chain[]> {
    try {
      const response = await this.axiosInstance.get<{ chains: Chain[] }>(`${this.apiBase}/chains`)
      console.log('[Stargate API] Fetched chains:', response.data.chains.length)
      return response.data.chains
    } catch (error: any) {
      console.error('[Stargate API] Failed to fetch chains, using fallback:', error.message)
      // Return fallback chains if API fails
      return this.getFallbackChains()
    }
  }

  /**
   * Fallback chain list when API is unavailable
   */
  private getFallbackChains(): Chain[] {
    return [
      {
        chainKey: 'ethereum',
        chainType: 'evm',
        chainId: 1,
        shortName: 'Ethereum',
        name: 'Ethereum',
        nativeCurrency: {
          chainKey: 'ethereum',
          name: 'ETH',
          symbol: 'ETH',
          decimals: 18,
          address: NATIVE_TOKEN_ADDRESS
        }
      },
      {
        chainKey: 'polygon',
        chainType: 'evm',
        chainId: 137,
        shortName: 'Polygon',
        name: 'Polygon',
        nativeCurrency: {
          chainKey: 'polygon',
          name: 'MATIC',
          symbol: 'MATIC',
          decimals: 18,
          address: NATIVE_TOKEN_ADDRESS
        }
      },
      {
        chainKey: 'arbitrum',
        chainType: 'evm',
        chainId: 42161,
        shortName: 'Arbitrum',
        name: 'Arbitrum',
        nativeCurrency: {
          chainKey: 'arbitrum',
          name: 'ETH',
          symbol: 'ETH',
          decimals: 18,
          address: NATIVE_TOKEN_ADDRESS
        }
      },
      {
        chainKey: 'base',
        chainType: 'evm',
        chainId: 8453,
        shortName: 'Base',
        name: 'Base',
        nativeCurrency: {
          chainKey: 'base',
          name: 'ETH',
          symbol: 'ETH',
          decimals: 18,
          address: NATIVE_TOKEN_ADDRESS
        }
      },
      {
        chainKey: 'bsc',
        chainType: 'evm',
        chainId: 56,
        shortName: 'BSC',
        name: 'BNB Chain',
        nativeCurrency: {
          chainKey: 'bsc',
          name: 'BNB',
          symbol: 'BNB',
          decimals: 18,
          address: NATIVE_TOKEN_ADDRESS
        }
      },
      {
        chainKey: 'somnia',
        chainType: 'evm',
        chainId: 5031, // Correct mainnet chain ID from Stargate API
        shortName: 'Somnia',
        name: 'Somnia',
        nativeCurrency: {
          chainKey: 'somnia',
          name: 'Somnia',
          symbol: 'SOMI',
          decimals: 18,
          address: NATIVE_TOKEN_ADDRESS
        }
      }
    ]
  }

  /**
   * Get available tokens for bridging
   */
  async getTokens(options?: {
    chainKey?: ChainKey
    srcChainKey?: ChainKey
    srcToken?: string
  }): Promise<Token[]> {
    try {
      const params = new URLSearchParams()
      if (options?.chainKey) params.append('chainKey', options.chainKey)
      if (options?.srcChainKey) params.append('srcChainKey', options.srcChainKey)
      if (options?.srcToken) params.append('srcToken', options.srcToken)
      
      const url = params.toString() 
        ? `${this.apiBase}/tokens?${params.toString()}`
        : `${this.apiBase}/tokens`
      
      const response = await this.axiosInstance.get<{ tokens: Token[] }>(url)
      return response.data.tokens
    } catch (error: any) {
      console.error('Failed to fetch tokens:', error)
      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        return [] // Return empty array on timeout
      }
      throw error
    }
  }

  /**
   * Get available destination chains and tokens for a given source token
   * This uses the srcToken parameter to filter only bridgeable routes
   */
  async getAvailableDestinations(
    srcChainKey: ChainKey,
    srcTokenAddress: string
  ): Promise<{
    chains: string[]
    tokensByChain: Record<string, Token[]>
  }> {
    try {
      // Get all tokens that can be reached from this source token
      const availableTokens = await this.getTokens({
        srcChainKey,
        srcToken: srcTokenAddress
      })
      
      // Group by chain and filter for bridgeable tokens only
      const tokensByChain: Record<string, Token[]> = {}
      const chains = new Set<string>()
      
      for (const token of availableTokens) {
        // Skip non-bridgeable tokens and source chain
        if (!token.isBridgeable || token.chainKey === srcChainKey) continue
        
        if (!tokensByChain[token.chainKey]) {
          tokensByChain[token.chainKey] = []
        }
        tokensByChain[token.chainKey].push(token)
        chains.add(token.chainKey)
      }
      
      return {
        chains: Array.from(chains),
        tokensByChain
      }
    } catch (error) {
      console.error('Failed to get available destinations:', error)
      return { chains: [], tokensByChain: {} }
    }
  }

  /**
   * Check if a specific route is available using the tokens endpoint
   */
  async isRouteAvailableViaTokens(
    srcChainKey: ChainKey,
    srcTokenAddress: string,
    dstChainKey: ChainKey
  ): Promise<boolean> {
    try {
      const destinations = await this.getAvailableDestinations(srcChainKey, srcTokenAddress)
      return destinations.chains.includes(dstChainKey)
    } catch {
      return false
    }
  }

  /**
   * Check if a chain is supported by Stargate
   */
  private async isChainSupported(chainKey: string): Promise<boolean> {
    // First check our known unsupported list
    if (this.unsupportedChains.includes(chainKey.toLowerCase())) {
      return false
    }
    
    // Then check with API
    try {
      const chains = await this.getChains()
      return chains.some(chain => chain.chainKey.toLowerCase() === chainKey.toLowerCase())
    } catch {
      // If API fails, assume supported unless in our unsupported list
      return true
    }
  }

  /**
   * Get token symbol from address
   */
  private getTokenSymbol(address: string): string {
    const addr = address.toLowerCase()
    
    // Check native token
    if (addr === NATIVE_TOKEN_ADDRESS.toLowerCase()) {
      return 'ETH'
    }
    
    // Check known token addresses across chains
    const tokenMap: Record<string, string> = {
      '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': 'USDC', // Ethereum
      '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913': 'USDC', // Base
      '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359': 'USDC', // Polygon
      '0xaf88d065e77c8cc2239327c5edb3a432268e5831': 'USDC', // Arbitrum
      '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d': 'USDC', // BSC
      '0xdac17f958d2ee523a2206206994597c13d831ec7': 'USDT', // Ethereum
      '0xc2132d05d31c914a87c6611c10748aeb04b58e8f': 'USDT', // Polygon
      '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9': 'USDT', // Arbitrum
      '0x55d398326f99059ff775485246999027b3197955': 'USDT', // BSC
      '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': 'WETH', // Ethereum
      '0x82af49447d8a07e3bd95bd0d56f35241523fbab1': 'WETH', // Arbitrum
      '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619': 'WETH', // Polygon
      // Somnia tokens
      '0x28bec7e30e6faee657a03e19bf1128aad7632a00': 'USDC', // USDC.e on Somnia
      '0x67b302e35aef5eee8c32d934f5856869ef428330': 'USDT', // USDT on Somnia
      '0x936ab8c674bcb567cd5deb85d8a216494704e9d8': 'WETH', // WETH on Somnia
    }
    
    return tokenMap[addr] || 'UNKNOWN'
  }

  /**
   * Dynamically check if a route is available using the tokens endpoint first,
   * then fallback to testing with quotes API if needed
   */
  private async checkRouteAvailability(
    srcToken: string,
    dstToken: string,
    srcChainKey: ChainKey,
    dstChainKey: ChainKey
  ): Promise<boolean> {
    // Create cache key
    const cacheKey = `${srcChainKey}:${srcToken}:${dstChainKey}:${dstToken}`
    
    // Check cache first
    const cached = this.routeCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.available
    }
    
    try {
      // First, use the tokens endpoint with srcToken to check available routes
      const availableTokens = await this.getTokens({
        srcChainKey,
        srcToken
      })
      
      // Check if destination chain and token are in the available list
      const routeExists = availableTokens.some(
        token => token.chainKey === dstChainKey && 
                 token.address.toLowerCase() === dstToken.toLowerCase() &&
                 token.isBridgeable
      )
      
      if (routeExists) {
        this.routeCache.set(cacheKey, { available: true, timestamp: Date.now() })
        return true
      }
      
      // If not found via tokens endpoint, try with quotes API as fallback
      // (some routes might work even if not shown in tokens endpoint)
      const testParams = new URLSearchParams({
        srcToken,
        dstToken,
        srcAddress: '0x0000000000000000000000000000000000000001',
        dstAddress: '0x0000000000000000000000000000000000000001',
        srcChainKey,
        dstChainKey,
        srcAmount: '1000000000000000000', // 1 token with 18 decimals
        dstAmountMin: '0',
      })
      
      console.log('🔍 Testing route availability:', `${this.apiBase}/quotes?${testParams.toString()}`)
      
      const response = await this.axiosInstance.get(
        `${this.apiBase}/quotes?${testParams.toString()}`,
        { timeout: 5000 }
      )
      
      const available = response.data.quotes && response.data.quotes.length > 0
      this.routeCache.set(cacheKey, { available, timestamp: Date.now() })
      return available
    } catch (error: any) {
      if (error.response?.status === 422) {
        this.routeCache.set(cacheKey, { available: false, timestamp: Date.now() })
        return false
      }
      return false
    }
  }

  /**
   * Get bridge quotes for a transfer
   */
  async getQuotes(params: QuoteParams): Promise<BridgeQuote[]> {
    try {
      // Check if Somnia testnet is involved - not supported
      if (params.srcChainKey.toLowerCase() === 'somnia-testnet' || 
          params.dstChainKey.toLowerCase() === 'somnia-testnet') {
        console.log('ℹ️ Somnia testnet is not supported by Stargate.')
        console.log('💡 Use Somnia mainnet for bridging operations.')
        return []
      }

      // Check if Somnia is involved
      if (params.srcChainKey.toLowerCase() === 'somnia' || params.dstChainKey.toLowerCase() === 'somnia') {
        console.log('⚠️ Somnia bridge routes are limited. Checking availability...')
      }

      // Check if both chains are supported
      const [srcSupported, dstSupported] = await Promise.all([
        this.isChainSupported(params.srcChainKey),
        this.isChainSupported(params.dstChainKey)
      ])
      
      if (!srcSupported || !dstSupported) {
        console.log(`ℹ️ Chain not supported by Stargate: ${params.srcChainKey} or ${params.dstChainKey}`)
        return []
      }

      // Dynamically check if route is available
      const routeAvailable = await this.checkRouteAvailability(
        params.srcToken,
        params.dstToken,
        params.srcChainKey,
        params.dstChainKey
      )
      
      if (!routeAvailable) {
        const tokenSymbol = this.getTokenSymbol(params.srcToken)
        console.log(`ℹ️ Route not available: ${tokenSymbol} from ${params.srcChainKey} → ${params.dstChainKey}`)
        
        // Get and show available destinations for this token
        const destinations = await this.getAvailableDestinations(params.srcChainKey, params.srcToken)
        if (destinations.chains.length > 0) {
          console.log(`💡 Available destinations for ${tokenSymbol} from ${params.srcChainKey}:`)
          destinations.chains.forEach(chain => {
            const tokens = destinations.tokensByChain[chain]
            const tokenSymbols = tokens.map(t => t.symbol).join(', ')
            console.log(`   • ${chain}: ${tokenSymbols}`)
          })
        } else {
          console.log('💡 No bridge routes available for this token')
        }
        
        return []
      }

      const queryParams = new URLSearchParams({
        srcToken: params.srcToken,
        dstToken: params.dstToken,
        srcAddress: params.srcAddress,
        dstAddress: params.dstAddress,
        srcChainKey: params.srcChainKey,
        dstChainKey: params.dstChainKey,
        srcAmount: params.srcAmount,
        dstAmountMin: params.dstAmountMin,
      })

      const url = `${this.apiBase}/quotes?${queryParams.toString()}`
      console.log('📡 Requesting quotes from:', url)
      console.log('📋 Parameters:', {
        srcToken: params.srcToken,
        dstToken: params.dstToken,
        srcChainKey: params.srcChainKey,
        dstChainKey: params.dstChainKey,
        srcAmount: params.srcAmount,
        dstAmountMin: params.dstAmountMin,
        srcAddress: params.srcAddress,
        dstAddress: params.dstAddress
      })

      const response = await this.axiosInstance.get<QuotesResponse>(url)
      
      return response.data.quotes || []
    } catch (error: any) {
      // Handle 400 errors
      if (error.response?.status === 400) {
        console.log('❌ Bad Request (400):', error.response.data)
        console.log('💡 Check that all parameters are correctly formatted')
        return []
      }

      // Handle 422 errors gracefully - route not supported
      if (error.response?.status === 422) {
        console.log('ℹ️ Stargate API: This route is not available')
        console.log('💡 Try a different token or chain combination')
        return []
      }
      
      // Log error details for debugging
      if (error.response?.data) {
        console.log('Stargate API error:', error.response.data)
      }
      
      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        console.log('⚠️ Request timeout - Stargate API may be slow')
        return []
      }
      
      // Don't throw for bridge errors, just return empty array
      return []
    }
  }

  /**
   * Get chain info by chainKey
   */
  async getChainInfo(chainKey: ChainKey): Promise<Chain | undefined> {
    const chains = await this.getChains()
    return chains.find(chain => chain.chainKey === chainKey)
  }

  /**
   * Get token info by address and chain
   */
  async getTokenInfo(chainKey: ChainKey, tokenAddress: string): Promise<Token | undefined> {
    const tokens = await this.getTokens({ chainKey })
    return tokens.find(token => 
      token.address.toLowerCase() === tokenAddress.toLowerCase() &&
      token.chainKey === chainKey
    )
  }

  /**
   * Estimate bridge fees for a transfer
   */
  async estimateFees(params: QuoteParams): Promise<Fee[]> {
    const quotes = await this.getQuotes(params)
    if (quotes.length === 0) return []
    
    // Return fees from the best route (usually first)
    return quotes[0].fees
  }

  /**
   * Get the best quote (fastest or cheapest)
   */
  async getBestQuote(
    params: QuoteParams, 
    preference: 'fastest' | 'cheapest' = 'fastest'
  ): Promise<BridgeQuote | null> {
    const quotes = await this.getQuotes(params)
    if (quotes.length === 0) return null

    if (preference === 'fastest') {
      // Sort by duration and return fastest
      return quotes.sort((a, b) => a.duration.estimated - b.duration.estimated)[0]
    } else {
      // Sort by total fees and return cheapest
      return quotes.sort((a, b) => {
        const aFees = a.fees.reduce((sum, fee) => sum + BigInt(fee.amount), 0n)
        const bFees = b.fees.reduce((sum, fee) => sum + BigInt(fee.amount), 0n)
        return Number(aFees - bFees)
      })[0]
    }
  }

  /**
   * Format amount for token decimals
   */
  formatTokenAmount(amount: string, decimals: number): string {
    const value = parseFloat(amount)
    return Math.floor(value * Math.pow(10, decimals)).toString()
  }

  /**
   * Parse amount from token decimals
   */
  parseTokenAmount(amount: string, decimals: number): string {
    const value = BigInt(amount)
    const divisor = BigInt(Math.pow(10, decimals))
    const result = Number(value) / Number(divisor)
    return result.toFixed(decimals)
  }

  /**
   * Check if a route is available between two chains for a token
   */
  async isRouteAvailable(
    srcChainKey: ChainKey,
    dstChainKey: ChainKey,
    tokenSymbol: string
  ): Promise<boolean> {
    try {
      // First try to get tokens to find addresses
      const [srcTokens, dstTokens] = await Promise.all([
        this.getTokens({ chainKey: srcChainKey }),
        this.getTokens({ chainKey: dstChainKey })
      ])
      
      const srcToken = srcTokens.find(t => t.symbol === tokenSymbol)
      const dstToken = dstTokens.find(t => t.symbol === tokenSymbol)
      
      if (!srcToken || !dstToken) {
        return false
      }
      
      // Even if tokens are marked as non-bridgeable, check with the API
      // (Somnia tokens are marked non-bridgeable but work)
      return await this.checkRouteAvailability(
        srcToken.address,
        dstToken.address,
        srcChainKey,
        dstChainKey
      )
    } catch {
      return false
    }
  }

  /**
   * Get supported tokens between two chains
   * Now we can use the tokens API with srcChainKey and srcToken
   */
  async getSupportedTokens(
    srcChainKey: ChainKey,
    dstChainKey: ChainKey
  ): Promise<{
    symbol: string
    srcAddress: string
    dstAddress: string
    srcDecimals: number
    dstDecimals: number
    srcName: string
    dstName: string
    price?: number
  }[]> {
    try {
      console.log(`[getSupportedTokens] Finding routes from ${srcChainKey} to ${dstChainKey}`)
      
      const lowerSrc = srcChainKey.toLowerCase()
      const lowerDst = dstChainKey.toLowerCase()
      const supportedRoutes: any[] = []
      
      // Get token prices from the API
      const tokenPrices = await this.getTokenPrices()
      
      // Special handling for Somnia routes
      if (lowerSrc === 'somnia' || lowerDst === 'somnia') {
        // Define the token mappings for Somnia
        const somniaTokens = [
          { address: TOKEN_ADDRESSES.somnia.SOMI, symbol: 'SOMI', decimals: 18, name: 'Somnia' },
          { address: TOKEN_ADDRESSES.somnia.WETH, symbol: 'WETH', decimals: 18, name: 'Wrapped Ether' },
          { address: TOKEN_ADDRESSES.somnia.USDC, symbol: 'USDC', decimals: 6, name: 'USD Coin' },
          { address: TOKEN_ADDRESSES.somnia.USDT, symbol: 'USDT', decimals: 6, name: 'Tether USD' }
        ]
        
        if (lowerSrc === 'somnia') {
          // From Somnia to other chains
          for (const token of somniaTokens) {
            try {
              // Use the tokens API with srcChainKey and srcToken
              const response = await this.axiosInstance.get(
                `${this.apiBase}/tokens?srcChainKey=${srcChainKey}&srcToken=${token.address}`
              )
              
              if (response.data?.tokens) {
                const destinations = response.data.tokens.filter(
                  (t: Token) => t.chainKey === dstChainKey
                )
                
                for (const dest of destinations) {
                  supportedRoutes.push({
                    symbol: token.symbol,
                    srcAddress: token.address,
                    dstAddress: dest.address,
                    srcDecimals: token.decimals,
                    dstDecimals: dest.decimals,
                    srcName: token.name,
                    dstName: dest.name,
                    price: tokenPrices[token.symbol] || dest.price?.usd
                  })
                  console.log(`[getSupportedTokens] Found route: ${token.symbol} -> ${dest.chainKey}:${dest.symbol}`)
                }
              }
            } catch (error) {
              console.log(`[getSupportedTokens] No routes for ${token.symbol} from Somnia`)
            }
          }
          
          // SOMI native to SOMI on other chains (special case)
          const somiDestinations = [
            { chain: 'ethereum', address: TOKEN_ADDRESSES.ethereum.SOMI },
            { chain: 'base', address: TOKEN_ADDRESSES.base.SOMI },
            { chain: 'bsc', address: TOKEN_ADDRESSES.bsc.SOMI }
          ]
          
          const targetRoute = somiDestinations.find(r => r.chain === lowerDst)
          if (targetRoute) {
            supportedRoutes.push({
              symbol: 'SOMI',
              srcAddress: TOKEN_ADDRESSES.somnia.SOMI,
              dstAddress: targetRoute.address,
              srcDecimals: 18,
              dstDecimals: 18,
              srcName: 'Somnia',
              dstName: 'SomniaOFT',
              price: tokenPrices['SOMI'] || 1.26
            })
          }
        } else {
          // To Somnia from other chains
          const sourceChainTokens = (TOKEN_ADDRESSES as any)[lowerSrc]
          if (sourceChainTokens) {
            // Check each token from the source chain
            for (const [symbol, address] of Object.entries(sourceChainTokens)) {
              try {
                const response = await this.axiosInstance.get(
                  `${this.apiBase}/tokens?srcChainKey=${srcChainKey}&srcToken=${address}`
                )
                
                if (response.data?.tokens) {
                  const destinations = response.data.tokens.filter(
                    (t: Token) => t.chainKey === 'somnia'
                  )
                  
                  for (const dest of destinations) {
                    supportedRoutes.push({
                      symbol,
                      srcAddress: address as string,
                      dstAddress: dest.address,
                      srcDecimals: symbol === 'USDC' || symbol === 'USDT' ? 6 : 18,
                      dstDecimals: dest.decimals,
                      srcName: symbol,
                      dstName: dest.name,
                      price: tokenPrices[symbol] || dest.price?.usd
                    })
                    console.log(`[getSupportedTokens] Found route: ${symbol} -> Somnia:${dest.symbol}`)
                  }
                }
              } catch (error) {
                // Continue checking other tokens
              }
            }
            
            // SOMI from other chains to native SOMI (special case)
            if (sourceChainTokens.SOMI) {
              supportedRoutes.push({
                symbol: 'SOMI',
                srcAddress: sourceChainTokens.SOMI,
                dstAddress: TOKEN_ADDRESSES.somnia.SOMI,
                srcDecimals: 18,
                dstDecimals: 18,
                srcName: 'SomniaOFT',
                dstName: 'Somnia',
                price: tokenPrices['SOMI'] || 1.26
              })
            }
          }
        }
        
        // Fallback to hardcoded routes if API fails
        if (supportedRoutes.length === 0) {
          console.log('[getSupportedTokens] Using fallback hardcoded routes')
          const hardcodedRoutes = [
            // ETH <-> WETH
            {
              fromChain: 'ethereum',
              toChain: 'somnia',
              symbol: 'ETH',
              srcAddress: NATIVE_TOKEN_ADDRESS,
              dstAddress: TOKEN_ADDRESSES.somnia.WETH,
              srcDecimals: 18,
              dstDecimals: 18,
              srcName: 'Ethereum',
              dstName: 'Wrapped Ether'
            },
            // USDC routes
            {
              fromChain: 'ethereum',
              toChain: 'somnia',
              symbol: 'USDC',
              srcAddress: TOKEN_ADDRESSES.ethereum.USDC,
              dstAddress: TOKEN_ADDRESSES.somnia.USDC,
              srcDecimals: 6,
              dstDecimals: 6,
              srcName: 'USD Coin',
              dstName: 'USD Coin'
            },
            // SOMI routes
            {
              fromChain: 'somnia',
              toChain: 'ethereum',
              symbol: 'SOMI',
              srcAddress: TOKEN_ADDRESSES.somnia.SOMI,
              dstAddress: TOKEN_ADDRESSES.ethereum.SOMI,
              srcDecimals: 18,
              dstDecimals: 18,
              srcName: 'Somnia',
              dstName: 'SomniaOFT'
            },
            {
              fromChain: 'somnia',
              toChain: 'base',
              symbol: 'SOMI',
              srcAddress: TOKEN_ADDRESSES.somnia.SOMI,
              dstAddress: TOKEN_ADDRESSES.base.SOMI,
              srcDecimals: 18,
              dstDecimals: 18,
              srcName: 'Somnia',
              dstName: 'SomniaOFT'
            },
            {
              fromChain: 'somnia',
              toChain: 'bsc',
              symbol: 'SOMI',
              srcAddress: TOKEN_ADDRESSES.somnia.SOMI,
              dstAddress: TOKEN_ADDRESSES.bsc.SOMI,
              srcDecimals: 18,
              dstDecimals: 18,
              srcName: 'Somnia',
              dstName: 'SomniaOFT'
            }
          ]
        
          // Filter and transform routes
          const filteredRoutes = hardcodedRoutes.filter(route => {
            return (lowerSrc === route.fromChain && lowerDst === route.toChain) ||
                   (lowerSrc === route.toChain && lowerDst === route.fromChain)
          })
          
          for (const route of filteredRoutes) {
            if (lowerSrc === route.toChain) {
              // Reverse the route
              supportedRoutes.push({
                symbol: route.symbol,
                srcAddress: route.dstAddress,
                dstAddress: route.srcAddress,
                srcDecimals: route.dstDecimals,
                dstDecimals: route.srcDecimals,
                srcName: route.dstName,
                dstName: route.srcName,
                price: tokenPrices[route.symbol]
              })
            } else {
              supportedRoutes.push({
                symbol: route.symbol,
                srcAddress: route.srcAddress,
                dstAddress: route.dstAddress,
                srcDecimals: route.srcDecimals,
                dstDecimals: route.dstDecimals,
                srcName: route.srcName,
                dstName: route.dstName,
                price: tokenPrices[route.symbol]
              })
            }
          }
        }
      } else {
        // For non-Somnia routes, try the tokens API first
        try {
          const srcTokens = await this.getTokens({ chainKey: srcChainKey })
          const bridgeableSourceTokens = srcTokens.filter(t => t.isBridgeable)
          
          for (const srcToken of bridgeableSourceTokens) {
            const destinationTokens = await this.getTokens({
              srcChainKey,
              srcToken: srcToken.address
            })
            
            const matchingDestTokens = destinationTokens.filter(
              t => t.chainKey === dstChainKey && t.isBridgeable
            )
            
            for (const dstToken of matchingDestTokens) {
              supportedRoutes.push({
                symbol: srcToken.symbol,
                srcAddress: srcToken.address,
                dstAddress: dstToken.address,
                srcDecimals: srcToken.decimals,
                dstDecimals: dstToken.decimals,
                srcName: srcToken.name,
                dstName: dstToken.name,
                price: srcToken.price?.usd || tokenPrices[srcToken.symbol]
              })
            }
          }
        } catch (error) {
          console.error('[getSupportedTokens] Error getting non-Somnia routes:', error)
        }
      }

      console.log(`[getSupportedTokens] Returning ${supportedRoutes.length} routes`)
      return supportedRoutes
    } catch (error) {
      console.error('[getSupportedTokens] Failed to get supported tokens:', error)
      return []
    }
  }
  
  /**
   * Get token prices from the API
   */
  async getTokenPrices(): Promise<Record<string, number>> {
    try {
      const tokens = await this.getTokens()
      const prices: Record<string, number> = {}
      
      // Get unique prices for each symbol (they're consistent across chains)
      for (const token of tokens) {
        if (token.price?.usd && !prices[token.symbol]) {
          prices[token.symbol] = token.price.usd
        }
      }
      
      // Add common mappings
      if (prices['ETH']) prices['WETH'] = prices['ETH']
      if (prices['USDC']) prices['USDC.e'] = prices['USDC']
      
      // Add SOMI price if not found
      if (!prices['SOMI']) prices['SOMI'] = 1.26
      
      console.log('[getTokenPrices] Loaded prices for:', Object.keys(prices).join(', '))
      return prices
    } catch (error) {
      console.error('[getTokenPrices] Failed to fetch token prices:', error)
      // Return fallback prices
      return {
        'ETH': 4500,
        'WETH': 4500,
        'USDC': 1,
        'USDC.e': 1,
        'USDT': 1,
        'MATIC': 1.5,
        'BNB': 650,
        'SOMI': 0.1
      }
    }
  }
  
  /**
   * Clear route cache (useful after network changes)
   */
  clearRouteCache(): void {
    this.routeCache.clear()
  }
}

// Export singleton instance
export const stargateApi = new StargateApiService()