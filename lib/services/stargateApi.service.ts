import axios from 'axios'

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
  },
  bsc: {
    BNB: NATIVE_TOKEN_ADDRESS,
    USDC: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
    USDT: '0x55d398326f99059ff775485246999027b3197955',
    ETH: '0x2170ed0880ac9a755fd29b2688956bd959f933f8',
  },
  somnia: {
    SOMI: NATIVE_TOKEN_ADDRESS,
    USDC: '0x28BEc7E30E6faee657a03e19Bf1128AaD7632A00',
    USDT: '0x67B302E35Aef5EEE8c32D934F5856869EF428330',
    WETH: '0x936Ab8C674bcb567CD5dEB85D8A216494704E9D8',
    WSOMI: '0x046EDe9564A72571df6F5e44d0405360c0f4dCab',
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
  private axiosInstance: any

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
        chainId: 50311,
        shortName: 'Somnia',
        name: 'Somnia',
        nativeCurrency: {
          chainKey: 'somnia',
          name: 'SOMI',
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
  async getTokens(chainKey?: ChainKey): Promise<Token[]> {
    try {
      const url = chainKey 
        ? `${this.apiBase}/tokens?chainKey=${chainKey}`
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
   * Get bridge quotes for a transfer
   */
  async getQuotes(params: QuoteParams): Promise<BridgeQuote[]> {
    try {
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

      const response = await this.axiosInstance.get<QuotesResponse>(
        `${this.apiBase}/quotes?${queryParams.toString()}`
      )
      
      return response.data.quotes || []
    } catch (error: any) {
      console.error('Failed to fetch quotes:', error)
      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        return [] // Return empty array on timeout
      }
      throw error
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
    const tokens = await this.getTokens(chainKey)
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
      const srcTokens = await this.getTokens(srcChainKey)
      const dstTokens = await this.getTokens(dstChainKey)
      
      const srcToken = srcTokens.find(t => t.symbol === tokenSymbol && t.isBridgeable)
      const dstToken = dstTokens.find(t => t.symbol === tokenSymbol && t.isBridgeable)
      
      return !!(srcToken && dstToken)
    } catch {
      return false
    }
  }

  /**
   * Get supported tokens between two chains
   */
  async getSupportedTokens(
    srcChainKey: ChainKey,
    dstChainKey: ChainKey
  ): Promise<{ symbol: string; srcAddress: string; dstAddress: string }[]> {
    const [srcTokens, dstTokens] = await Promise.all([
      this.getTokens(srcChainKey),
      this.getTokens(dstChainKey)
    ])

    const bridgeableTokens: { symbol: string; srcAddress: string; dstAddress: string }[] = []
    
    for (const srcToken of srcTokens) {
      if (!srcToken.isBridgeable) continue
      
      const dstToken = dstTokens.find(
        t => t.symbol === srcToken.symbol && t.isBridgeable
      )
      
      if (dstToken) {
        bridgeableTokens.push({
          symbol: srcToken.symbol,
          srcAddress: srcToken.address,
          dstAddress: dstToken.address
        })
      }
    }

    return bridgeableTokens
  }
}

// Export singleton instance
export const stargateApi = new StargateApiService()