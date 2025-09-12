/**
 * Price Data Service
 * Fetches OHLCV data for trading pairs
 * Uses DIA Oracle as primary source, CoinGecko as fallback
 */

import { diaOracleService } from './diaOracle.service'

export interface OHLCVData {
  time: number; // Unix timestamp
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface PriceData {
  current: number;
  change24h: number;
  change24hPercent: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  marketCap?: number;
}

// Token ID mapping for CoinGecko
const COINGECKO_IDS: Record<string, string> = {
  'ETH': 'ethereum',
  'WETH': 'ethereum',
  'BTC': 'bitcoin',
  'WBTC': 'wrapped-bitcoin',
  'USDC': 'usd-coin',
  'USDT': 'tether',
  'DAI': 'dai',
  'ARB': 'arbitrum',
  'SOL': 'solana',
  'MATIC': 'matic-network',
  'BNB': 'binancecoin',
  'AVAX': 'avalanche-2',
  'OP': 'optimism',
  'SOMI': 'somnia', // This might not exist on CoinGecko
  'WSOMI': 'somnia',
};

class PriceDataService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTimeout = 60000; // 1 minute cache

  /**
   * Get current price data for a token pair
   */
  async getPriceData(tokenSymbol: string): Promise<PriceData | null> {
    try {
      // First try DIA Oracle for on-chain price
      const oraclePrice = await diaOracleService.getPrice(tokenSymbol);
      if (oraclePrice && oraclePrice.source === 'dia') {
        // DIA Oracle data - create PriceData from oracle price
        const price = oraclePrice.value;
        return {
          current: price,
          change24h: 0, // DIA doesn't provide 24h change
          change24hPercent: 0,
          high24h: price * 1.02, // Approximate
          low24h: price * 0.98, // Approximate
          volume24h: 0, // DIA doesn't provide volume
          marketCap: 0,
        };
      }

      // Fallback to CoinGecko API
      const tokenId = COINGECKO_IDS[tokenSymbol.toUpperCase()];
      if (!tokenId) {
        // Return mock data for unsupported tokens
        return this.getMockPriceData(tokenSymbol);
      }

      // Check cache
      const cached = this.cache.get(tokenId);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }

      // Fetch from CoinGecko
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${tokenId}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`
      );

      if (!response.ok) {
        return this.getMockPriceData(tokenSymbol);
      }

      const data = await response.json();
      const tokenData = data[tokenId];

      if (!tokenData) {
        return this.getMockPriceData(tokenSymbol);
      }

      const priceData: PriceData = {
        current: tokenData.usd || 0,
        change24h: tokenData.usd_24h_change || 0,
        change24hPercent: tokenData.usd_24h_change || 0,
        high24h: tokenData.usd * 1.05, // Approximate
        low24h: tokenData.usd * 0.95, // Approximate
        volume24h: tokenData.usd_24h_vol || 0,
        marketCap: tokenData.usd_market_cap || 0,
      };

      // Cache the result
      this.cache.set(tokenId, { data: priceData, timestamp: Date.now() });

      return priceData;
    } catch (error) {
      console.error('Error fetching price data:', error);
      return this.getMockPriceData(tokenSymbol);
    }
  }

  /**
   * Get OHLCV data for charting
   * Note: CoinGecko free tier has limited OHLC endpoint access
   * Using mock data for demo purposes
   */
  async getOHLCVData(
    tokenSymbol: string,
    interval: '1m' | '5m' | '15m' | '1h' | '4h' | '1d' = '1h',
    limit: number = 100
  ): Promise<OHLCVData[]> {
    try {
      const tokenId = COINGECKO_IDS[tokenSymbol.toUpperCase()];
      
      // For demo, return mock OHLCV data
      // In production, you'd use CoinGecko OHLC endpoint or another service
      return this.generateMockOHLCVData(tokenSymbol, interval, limit);
    } catch (error) {
      console.error('Error fetching OHLCV data:', error);
      return this.generateMockOHLCVData(tokenSymbol, interval, limit);
    }
  }

  /**
   * Get price for a trading pair
   */
  async getPairPrice(token0: string, token1: string): Promise<number> {
    try {
      // If quote is USD stable coin, just return token0 price
      if (['USDC', 'USDT', 'DAI'].includes(token1.toUpperCase())) {
        const priceData = await this.getPriceData(token0);
        return priceData?.current || 0;
      }

      // Otherwise calculate the ratio
      const [price0, price1] = await Promise.all([
        this.getPriceData(token0),
        this.getPriceData(token1),
      ]);

      if (!price0?.current || !price1?.current) return 0;
      
      return price0.current / price1.current;
    } catch (error) {
      console.error('Error fetching pair price:', error);
      return 0;
    }
  }

  /**
   * Generate mock price data for demo
   */
  private getMockPriceData(tokenSymbol: string): PriceData {
    const basePrices: Record<string, number> = {
      'ETH': 2500,
      'WETH': 2500,
      'BTC': 45000,
      'WBTC': 45000,
      'USDC': 1,
      'USDT': 1,
      'DAI': 1,
      'ARB': 1.2,
      'SOL': 150,
      'MATIC': 0.8,
      'BNB': 350,
      'AVAX': 35,
      'OP': 2.5,
      'SOMI': 0.5,
      'WSOMI': 0.5,
    };

    const basePrice = basePrices[tokenSymbol.toUpperCase()] || 1;
    const change = (Math.random() - 0.5) * 10; // -5% to +5%

    return {
      current: basePrice,
      change24h: basePrice * (change / 100),
      change24hPercent: change,
      high24h: basePrice * 1.05,
      low24h: basePrice * 0.95,
      volume24h: Math.random() * 1000000,
      marketCap: basePrice * 1000000000,
    };
  }

  /**
   * Generate mock OHLCV data for charting
   */
  private generateMockOHLCVData(
    tokenSymbol: string,
    interval: string,
    limit: number
  ): OHLCVData[] {
    const data: OHLCVData[] = [];
    const now = Date.now();
    
    // Interval in milliseconds
    const intervalMs = {
      '1m': 60000,
      '5m': 300000,
      '15m': 900000,
      '1h': 3600000,
      '4h': 14400000,
      '1d': 86400000,
    }[interval] || 3600000;

    // Base price for the token
    const basePrices: Record<string, number> = {
      'ETH': 2500,
      'WETH': 2500,
      'BTC': 45000,
      'WBTC': 45000,
      'USDC': 1,
      'USDT': 1,
      'DAI': 1,
      'ARB': 1.2,
      'SOL': 150,
      'MATIC': 0.8,
      'BNB': 350,
      'AVAX': 35,
      'OP': 2.5,
      'SOMI': 0.5,
      'WSOMI': 0.5,
    };

    let basePrice = basePrices[tokenSymbol.toUpperCase()] || 100;
    let trend = Math.random() > 0.5 ? 1 : -1;
    let volatility = 0.02; // 2% volatility

    for (let i = limit - 1; i >= 0; i--) {
      const time = now - (i * intervalMs);
      
      // Random walk with trend
      const change = (Math.random() - 0.5) * volatility + trend * 0.001;
      basePrice *= (1 + change);
      
      // Occasionally reverse trend
      if (Math.random() < 0.1) {
        trend *= -1;
      }

      const open = basePrice * (1 + (Math.random() - 0.5) * volatility);
      const close = basePrice * (1 + (Math.random() - 0.5) * volatility);
      const high = Math.max(open, close) * (1 + Math.random() * volatility * 0.5);
      const low = Math.min(open, close) * (1 - Math.random() * volatility * 0.5);

      data.push({
        time: Math.floor(time / 1000), // Unix timestamp in seconds
        open,
        high,
        low,
        close,
        volume: Math.random() * 1000000,
      });
    }

    return data;
  }

  /**
   * Subscribe to real-time price updates (mock implementation)
   * In production, this would connect to WebSocket feed
   */
  subscribeToPriceUpdates(
    tokenSymbol: string,
    callback: (price: number) => void
  ): () => void {
    const interval = setInterval(async () => {
      const priceData = await this.getPriceData(tokenSymbol);
      if (priceData) {
        // Add small random variation for demo
        const variation = 1 + (Math.random() - 0.5) * 0.001;
        callback(priceData.current * variation);
      }
    }, 5000); // Update every 5 seconds

    // Return unsubscribe function
    return () => clearInterval(interval);
  }
}

export const priceDataService = new PriceDataService();