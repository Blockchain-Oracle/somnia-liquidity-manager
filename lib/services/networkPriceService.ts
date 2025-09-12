/**
 * Network-aware price service
 * Provides mock prices for testnet tokens and real prices for mainnet
 */

interface TokenPrice {
  symbol: string
  price: number
  change24h: number
}

// Testnet mock prices - consistent for testing
const TESTNET_PRICES: Record<string, TokenPrice> = {
  'STT': { symbol: 'STT', price: 2.00, change24h: 5.2 },
  'tWETH': { symbol: 'tWETH', price: 4000.00, change24h: 2.1 },
  'tUSDC': { symbol: 'tUSDC', price: 1.00, change24h: 0.01 },
  'tUSDT': { symbol: 'tUSDT', price: 1.00, change24h: -0.02 }
}

// Mainnet prices - these would come from real APIs
const MAINNET_PRICES: Record<string, TokenPrice> = {
  'SOMI': { symbol: 'SOMI', price: 0.05, change24h: 8.5 },
  'WETH': { symbol: 'WETH', price: 3850.00, change24h: 1.8 },
  'USDC': { symbol: 'USDC', price: 1.00, change24h: 0.01 },
  'USDT': { symbol: 'USDT', price: 0.999, change24h: -0.01 }
}

export class NetworkPriceService {
  private isTestnet: boolean
  private priceCache: Map<string, { price: TokenPrice; timestamp: number }> = new Map()
  private readonly CACHE_DURATION = 60000 // 1 minute cache

  constructor(isTestnet: boolean) {
    this.isTestnet = isTestnet
  }

  /**
   * Get price for a single token
   */
  async getTokenPrice(symbol: string): Promise<TokenPrice | null> {
    // Check cache first
    const cached = this.priceCache.get(symbol)
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.price
    }

    if (this.isTestnet) {
      // Return mock testnet price
      const price = TESTNET_PRICES[symbol]
      if (price) {
        this.priceCache.set(symbol, { price, timestamp: Date.now() })
        return price
      }
    } else {
      // For mainnet, fetch real prices (placeholder for now)
      const price = MAINNET_PRICES[symbol]
      if (price) {
        // In production, this would fetch from CoinGecko/CoinMarketCap
        this.priceCache.set(symbol, { price, timestamp: Date.now() })
        return price
      }
    }

    return null
  }

  /**
   * Get prices for multiple tokens
   */
  async getTokenPrices(symbols: string[]): Promise<Record<string, TokenPrice>> {
    const prices: Record<string, TokenPrice> = {}
    
    await Promise.all(
      symbols.map(async (symbol) => {
        const price = await this.getTokenPrice(symbol)
        if (price) {
          prices[symbol] = price
        }
      })
    )
    
    return prices
  }

  /**
   * Calculate token value in USD
   */
  calculateValue(amount: number, tokenSymbol: string, tokenPrice?: number): number {
    if (tokenPrice !== undefined) {
      return amount * tokenPrice
    }

    const prices = this.isTestnet ? TESTNET_PRICES : MAINNET_PRICES
    const token = prices[tokenSymbol]
    return token ? amount * token.price : 0
  }

  /**
   * Get price ratio between two tokens
   */
  async getPriceRatio(token0: string, token1: string): Promise<number> {
    const [price0, price1] = await Promise.all([
      this.getTokenPrice(token0),
      this.getTokenPrice(token1)
    ])

    if (!price0 || !price1) return 0
    return price0.price / price1.price
  }

  /**
   * Format price for display
   */
  formatPrice(price: number): string {
    if (price >= 1000) {
      return `$${price.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
    } else if (price >= 1) {
      return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    } else {
      return `$${price.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 6 })}`
    }
  }

  /**
   * Get mock price data for chart (testnet only)
   */
  getMockChartData(tokenSymbol: string, days: number = 7): Array<{ time: number; value: number }> {
    const basePrice = this.isTestnet ? TESTNET_PRICES[tokenSymbol]?.price : MAINNET_PRICES[tokenSymbol]?.price
    if (!basePrice) return []

    const data = []
    const now = Date.now()
    const interval = (24 * 60 * 60 * 1000) / 24 // Hourly data points

    for (let i = days * 24; i >= 0; i--) {
      const time = now - (i * interval)
      // Add some random variation for realistic chart
      const variation = 1 + (Math.sin(i / 10) * 0.05) + (Math.random() * 0.02 - 0.01)
      data.push({
        time: Math.floor(time / 1000),
        value: basePrice * variation
      })
    }

    return data
  }
}

// Export singleton instances
let testnetPriceService: NetworkPriceService | null = null
let mainnetPriceService: NetworkPriceService | null = null

export function getPriceService(isTestnet: boolean): NetworkPriceService {
  if (isTestnet) {
    if (!testnetPriceService) {
      testnetPriceService = new NetworkPriceService(true)
    }
    return testnetPriceService
  } else {
    if (!mainnetPriceService) {
      mainnetPriceService = new NetworkPriceService(false)
    }
    return mainnetPriceService
  }
}

// Hook for React components
export function useNetworkPrices() {
  const { isTestnet } = require('@/lib/hooks/useNetwork').useNetwork()
  return getPriceService(isTestnet)
}