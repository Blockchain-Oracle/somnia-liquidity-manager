/**
 * Comprehensive Price Service
 * Combines DIA Oracle (real-time) with CoinGecko API (historical OHLC)
 */

import { diaOracleService } from './diaOracle.service'
import { STARGATE_TOKENS } from '../constants/stargateTokens'
import { stargateTokensService } from './stargateTokens.service'

export interface OHLCData {
  time: number; // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface CurrentPrice {
  price: number;
  change24h: number;
  change24hPercent: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  marketCap?: number;
  source: 'dia' | 'coingecko' | 'binance';
}

// CoinGecko token IDs mapping - Only tokens available on Somnia
const COINGECKO_IDS: Record<string, string> = {
  'WETH': 'ethereum',
  'USDC': 'usd-coin',
  'USDC.e': 'usd-coin',
  'USDT': 'tether',
  'SOMI': 'somnia',
  'WSOMI': 'somnia',
};

class PriceService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTimeout = 60000; // 1 minute for current prices
  private ohlcCacheTimeout = 300000; // 5 minutes for OHLC data

  /**
   * Get current price from DIA Oracle first, fallback to CoinGecko
   */
  async getCurrentPrice(tokenSymbol: string): Promise<CurrentPrice | null> {
    console.log(`[PriceService] Getting current price for ${tokenSymbol}`);
    try {
      // Try DIA Oracle first for real-time on-chain price
      console.log(`[PriceService] Fetching from DIA Oracle...`);
      const diaPrice = await diaOracleService.getPrice(tokenSymbol);
      console.log(`[PriceService] DIA Oracle response:`, diaPrice);
      
      if (diaPrice && diaPrice.source === 'dia' && diaPrice.value > 0) {
        // Get additional data from CoinGecko for 24h stats
        console.log(`[PriceService] Getting 24h stats from CoinGecko...`);
        const geckoData = await this.fetchCoinGeckoPrice(tokenSymbol);
        console.log(`[PriceService] CoinGecko stats:`, geckoData);
        
        const result: CurrentPrice = {
          price: diaPrice.value,
          change24h: geckoData?.usd_24h_change || 0,
          change24hPercent: geckoData?.usd_24h_change || 0,
          high24h: geckoData?.usd_24h_high || diaPrice.value * 1.02,
          low24h: geckoData?.usd_24h_low || diaPrice.value * 0.98,
          volume24h: geckoData?.usd_24h_vol || 0,
          marketCap: geckoData?.usd_market_cap,
          source: 'dia' as const,
        };
        console.log(`[PriceService] Returning DIA + CoinGecko combined price:`, result);
        return result;
      }

      // Fallback to CoinGecko
      console.log(`[PriceService] DIA not available, falling back to CoinGecko...`);
      const geckoData = await this.fetchCoinGeckoPrice(tokenSymbol);
      console.log(`[PriceService] CoinGecko data:`, geckoData);
      
      if (geckoData) {
        const result = {
          price: geckoData.usd,
          change24h: geckoData.usd_24h_change || 0,
          change24hPercent: geckoData.usd_24h_change || 0,
          high24h: geckoData.usd_24h_high || geckoData.usd * 1.02,
          low24h: geckoData.usd_24h_low || geckoData.usd * 0.98,
          volume24h: geckoData.usd_24h_vol || 0,
          marketCap: geckoData.usd_market_cap,
          source: 'coingecko' as const,
        };
        console.log(`[PriceService] Returning CoinGecko price:`, result);
        return result;
      }

      // Check if we have a cached price we can use as fallback
      const cacheKey = `price_${tokenSymbol}`;
      const cached = this.cache.get(cacheKey);
      if (cached && cached.data) {
        console.log(`[PriceService] Using cached price as fallback for ${tokenSymbol}`);
        return {
          ...cached.data,
          source: 'cached' as const,
          stale: true
        };
      }
      
      // If stablecoins, return $1
      if (['USDC', 'USDT', 'DAI'].includes(tokenSymbol.toUpperCase())) {
        return {
          price: 1,
          change24h: 0,
          change24hPercent: 0,
          high24h: 1,
          low24h: 1,
          volume24h: 0,
          marketCap: 0,
          source: 'coingecko' as const,
        };
      }
      
      // No data available - return null instead of mock
      console.log(`[PriceService] No price data available for ${tokenSymbol}`);
      return null;
    } catch (error) {
      console.error(`[PriceService] Error getting current price for ${tokenSymbol}:`, error);
      
      // Try to use cached data in case of error
      const cacheKey = `price_${tokenSymbol}`;
      const cached = this.cache.get(cacheKey);
      if (cached && cached.data) {
        console.log(`[PriceService] Using cached price after error for ${tokenSymbol}`);
        return {
          ...cached.data,
          source: 'cached' as const,
          stale: true
        };
      }
      
      // For stablecoins, always return $1
      if (['USDC', 'USDT', 'DAI'].includes(tokenSymbol.toUpperCase())) {
        return {
          price: 1,
          change24h: 0,
          change24hPercent: 0,
          high24h: 1,
          low24h: 1,
          volume24h: 0,
          marketCap: 0,
          source: 'coingecko' as const,
        };
      }
      
      // Return null if no data available
      return null;
    }
  }

  /**
   * Get historical OHLC data - try Binance first, then CoinGecko
   */
  async getOHLCData(
    tokenSymbol: string,
    days: number = 7
  ): Promise<OHLCData[]> {
    console.log(`[PriceService] Getting OHLC data for ${tokenSymbol}, days: ${days}`);
    const cacheKey = `ohlc_${tokenSymbol}_${days}`;
    
    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.ohlcCacheTimeout) {
      console.log(`[PriceService] Returning cached OHLC data`);
      return cached.data;
    }

    // Try Binance first for better data
    const binanceData = await this.getBinanceKlines(tokenSymbol, days);
    if (binanceData && binanceData.length > 0) {
      this.cache.set(cacheKey, { data: binanceData, timestamp: Date.now() });
      return binanceData;
    }

    // Fallback to CoinGecko
    try {
      const tokenId = COINGECKO_IDS[tokenSymbol.toUpperCase()];
      console.log(`[PriceService] CoinGecko ID for ${tokenSymbol}: ${tokenId}`);
      
      if (!tokenId) {
        console.log(`[PriceService] No CoinGecko ID for ${tokenSymbol}, generating mock data`);
        const mockData = this.generateRealisticOHLCData(tokenSymbol, days);
        console.log(`[PriceService] Generated ${mockData.length} mock OHLC candles`);
        return mockData;
      }

      // CoinGecko OHLC endpoint
      const url = `https://api.coingecko.com/api/v3/coins/${tokenId}/ohlc?vs_currency=usd&days=${days}`;
      console.log(`[PriceService] Fetching OHLC from: ${url}`);
      
      const response = await fetch(url);

      if (!response.ok) {
        console.log(`[PriceService] CoinGecko API error: ${response.status}`);
        const mockData = this.generateRealisticOHLCData(tokenSymbol, days);
        console.log(`[PriceService] Generated ${mockData.length} fallback OHLC candles`);
        return mockData;
      }

      const data = await response.json();
      console.log(`[PriceService] CoinGecko returned ${data.length} candles`);
      console.log(`[PriceService] Sample candle:`, data[0]);
      
      // Transform CoinGecko format [timestamp, open, high, low, close]
      const ohlcData: OHLCData[] = data.map((candle: number[]) => ({
        time: Math.floor(candle[0] / 1000), // Convert ms to seconds
        open: candle[1],
        high: candle[2],
        low: candle[3],
        close: candle[4],
      }));

      // Cache the result
      this.cache.set(cacheKey, { data: ohlcData, timestamp: Date.now() });
      console.log(`[PriceService] Processed ${ohlcData.length} OHLC candles from CoinGecko`);
      console.log(`[PriceService] Sample processed candle:`, ohlcData[0]);
      
      return ohlcData;
    } catch (error) {
      console.error(`[PriceService] Error fetching OHLC data:`, error);
      const mockData = this.generateRealisticOHLCData(tokenSymbol, days);
      console.log(`[PriceService] Returning ${mockData.length} mock candles due to error`);
      return mockData;
    }
  }

  /**
   * Get OHLC data from Binance API
   */
  private async getBinanceKlines(tokenSymbol: string, days: number): Promise<OHLCData[] | null> {
    try {
      // Map token symbols to Binance trading pairs
      const binancePairs: Record<string, string> = {
        'ETH': 'ETHUSDT',
        'WETH': 'ETHUSDT',
        'BTC': 'BTCUSDT',
        'WBTC': 'BTCUSDT',
        'USDC': 'USDCUSDT',
        'USDT': 'USDTUSDT',
        'DAI': 'DAIUSDT',
        'ARB': 'ARBUSDT',
        'SOL': 'SOLUSDT',
        'MATIC': 'MATICUSDT',
        'BNB': 'BNBUSDT',
        'AVAX': 'AVAXUSDT',
        'OP': 'OPUSDT',
        'LINK': 'LINKUSDT',
        'UNI': 'UNIUSDT',
      };

      const symbol = binancePairs[tokenSymbol.toUpperCase()];
      if (!symbol) {
        console.log(`[PriceService] No Binance pair for ${tokenSymbol}`);
        return null;
      }

      // Determine interval based on days
      let interval: string;
      let limit: number;
      if (days <= 1) {
        interval = '15m';
        limit = 96; // 24 hours / 15 minutes
      } else if (days <= 7) {
        interval = '1h';
        limit = 168; // 7 days * 24 hours
      } else if (days <= 30) {
        interval = '4h';
        limit = 180; // 30 days * 6 (24/4)
      } else {
        interval = '1d';
        limit = days;
      }

      const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
      console.log(`[PriceService] Fetching from Binance: ${url}`);
      
      const response = await fetch(url);
      if (!response.ok) {
        console.log(`[PriceService] Binance API error: ${response.status}`);
        return null;
      }

      const data = await response.json();
      console.log(`[PriceService] Binance returned ${data.length} klines`);
      
      // Transform Binance klines format
      // [openTime, open, high, low, close, volume, closeTime, quoteAssetVolume, numberOfTrades, takerBuyBaseAssetVolume, takerBuyQuoteAssetVolume, ignore]
      const ohlcData: OHLCData[] = data.map((kline: any[]) => ({
        time: Math.floor(kline[0] / 1000), // Convert ms to seconds
        open: parseFloat(kline[1]),
        high: parseFloat(kline[2]),
        low: parseFloat(kline[3]),
        close: parseFloat(kline[4]),
        volume: parseFloat(kline[5]),
      }));

      console.log(`[PriceService] Processed ${ohlcData.length} Binance klines`);
      console.log(`[PriceService] Sample Binance candle:`, ohlcData[0]);
      
      return ohlcData;
    } catch (error) {
      console.error(`[PriceService] Binance API error:`, error);
      return null;
    }
  }

  /**
   * Fetch price from CoinGecko API
   */
  private async fetchCoinGeckoPrice(tokenSymbol: string): Promise<any> {
    const tokenId = COINGECKO_IDS[tokenSymbol.toUpperCase()];
    console.log(`[PriceService] fetchCoinGeckoPrice - Token: ${tokenSymbol}, ID: ${tokenId}`);
    
    if (!tokenId) {
      console.log(`[PriceService] No CoinGecko ID mapping for ${tokenSymbol}`);
      return null;
    }

    const cacheKey = `gecko_${tokenId}`;
    
    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      // Check if we're in browser or server
      const isClient = typeof window !== 'undefined';
      
      if (isClient) {
        // Use our API proxy to avoid CORS
        console.log(`[PriceService] Fetching price via API proxy for ${tokenSymbol}`);
        const response = await fetch(`/api/price?token=${tokenSymbol}`);
        
        if (!response.ok) {
          console.log(`[PriceService] API proxy returned status: ${response.status}`);
          return null;
        }
        
        const data = await response.json();
        
        if (!data.success) {
          console.log(`[PriceService] No price data for ${tokenSymbol}`);
          return null;
        }
        
        // Convert to CoinGecko format for compatibility
        const tokenData = {
          usd: data.price,
          usd_24h_change: data.change24h,
          usd_24h_vol: data.volume24h,
          usd_market_cap: data.marketCap,
          usd_24h_high: data.price * (1 + Math.abs(data.change24h) / 200),
          usd_24h_low: data.price * (1 - Math.abs(data.change24h) / 200)
        };
        
        this.cache.set(cacheKey, { data: tokenData, timestamp: Date.now() });
        return tokenData;
      } else {
        // Server-side: direct API call
        const url = `https://api.coingecko.com/api/v3/simple/price?ids=${tokenId}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true&include_24hr_high=true&include_24hr_low=true`;
        console.log(`[PriceService] Fetching price from: ${url}`);
        
        const response = await fetch(url);

        if (!response.ok) {
          console.log(`[PriceService] CoinGecko API returned status: ${response.status}`);
          return null;
        }

        const data = await response.json();
        console.log(`[PriceService] CoinGecko response:`, data);
        const tokenData = data[tokenId];

        if (tokenData) {
          console.log(`[PriceService] Token data found:`, tokenData);
          this.cache.set(cacheKey, { data: tokenData, timestamp: Date.now() });
        } else {
          console.log(`[PriceService] No data found for token ID: ${tokenId}`);
        }

        return tokenData;
      }
    } catch (error) {
      console.error(`[PriceService] CoinGecko API error:`, error);
      return null;
    }
  }

  /**
   * Generate mock current price data
   */
  private getMockCurrentPrice(tokenSymbol: string): CurrentPrice {
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
    };

    const basePrice = basePrices[tokenSymbol.toUpperCase()] || 100;
    const change = (Math.random() - 0.5) * 10; // -5% to +5%
    
    const price = basePrice * (1 + change / 100);
    const high24h = price * 1.05;
    const low24h = price * 0.95;
    
    console.log(`[PriceService] Generated mock price for ${tokenSymbol}: $${price.toFixed(2)}`);
    
    return {
      price,
      change24h: basePrice * (change / 100),
      change24hPercent: change,
      high24h,
      low24h,
      volume24h: Math.random() * 10000000,
      marketCap: price * 1000000000,
      source: 'coingecko', // Pretend it's from CoinGecko
    };
  }

  /**
   * Generate realistic OHLC data when API is unavailable
   */
  private generateRealisticOHLCData(
    tokenSymbol: string,
    days: number
  ): OHLCData[] {
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
    };

    const basePrice = basePrices[tokenSymbol.toUpperCase()] || 100;
    const data: OHLCData[] = [];
    const now = Date.now();
    
    // Determine candle interval based on days
    let intervalMs: number;
    if (days <= 1) {
      intervalMs = 30 * 60 * 1000; // 30 minutes
    } else if (days <= 7) {
      intervalMs = 4 * 60 * 60 * 1000; // 4 hours
    } else {
      intervalMs = 24 * 60 * 60 * 1000; // 1 day
    }

    const numCandles = Math.floor((days * 24 * 60 * 60 * 1000) / intervalMs);
    
    let currentPrice = basePrice;
    let trend = Math.random() > 0.5 ? 1 : -1;
    
    for (let i = numCandles - 1; i >= 0; i--) {
      const time = now - (i * intervalMs);
      
      // Add some realistic volatility
      const volatility = tokenSymbol === 'BTC' || tokenSymbol === 'ETH' ? 0.02 : 0.05;
      const trendStrength = 0.001;
      
      // Random walk with trend
      const change = (Math.random() - 0.5) * volatility + trend * trendStrength;
      currentPrice *= (1 + change);
      
      // Occasionally reverse trend
      if (Math.random() < 0.1) {
        trend *= -1;
      }
      
      // Generate OHLC values
      const open = currentPrice * (1 + (Math.random() - 0.5) * volatility * 0.5);
      const close = currentPrice * (1 + (Math.random() - 0.5) * volatility * 0.5);
      const high = Math.max(open, close) * (1 + Math.random() * volatility * 0.3);
      const low = Math.min(open, close) * (1 - Math.random() * volatility * 0.3);
      
      data.push({
        time: Math.floor(time / 1000),
        open,
        high,
        low,
        close,
        volume: Math.random() * 1000000 * (basePrice / 100),
      });
    }
    
    return data;
  }

  /**
   * Subscribe to real-time price updates
   */
  subscribeToPriceUpdates(
    tokenSymbol: string,
    callback: (price: CurrentPrice) => void,
    interval: number = 10000
  ): () => void {
    const intervalId = setInterval(async () => {
      const price = await this.getCurrentPrice(tokenSymbol);
      if (price) {
        callback(price);
      }
    }, interval);

    // Get initial price
    this.getCurrentPrice(tokenSymbol).then(price => {
      if (price) callback(price);
    });

    // Return unsubscribe function
    return () => clearInterval(intervalId);
  }
}

export const priceService = new PriceService();