/**
 * Price Service
 * Fetches price data from CEXs using CCXT for comparison with DEX prices
 */

import * as ccxt from 'ccxt';
import type { Exchange, Ticker, OHLCV } from 'ccxt';

export interface PriceData {
  symbol: string;
  price: number;
  bid: number;
  ask: number;
  volume24h: number;
  change24h: number;
  timestamp: number;
  exchange: string;
}

export interface AggregatedPrice {
  symbol: string;
  averagePrice: number;
  minPrice: number;
  maxPrice: number;
  totalVolume: number;
  exchanges: string[];
  prices: PriceData[];
  timestamp: number;
}

export interface HistoricalData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export class PriceService {
  private exchanges: Map<string, Exchange> = new Map();
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTimeout = 10000; // 10 seconds cache

  constructor(exchangeIds: string[] = ['binance', 'okx', 'gate']) {
    // Initialize exchanges with rate limiting
    for (const id of exchangeIds) {
      try {
        const ExchangeClass = (ccxt as any)[id];
        if (ExchangeClass) {
          const exchange = new ExchangeClass({
            enableRateLimit: true,
            timeout: 10000,
          });
          this.exchanges.set(id, exchange);
        }
      } catch (error) {
        console.error(`Failed to initialize ${id}:`, error);
      }
    }
  }

  /**
   * Get price from a specific exchange
   */
  async getPriceFromExchange(
    exchangeId: string,
    symbol: string
  ): Promise<PriceData | null> {
    const exchange = this.exchanges.get(exchangeId);
    if (!exchange) {
      console.error(`Exchange ${exchangeId} not initialized`);
      return null;
    }

    try {
      // Check cache
      const cacheKey = `${exchangeId}-${symbol}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      // Load markets if not loaded
      if (!exchange.markets) {
        await exchange.loadMarkets();
      }

      // Fetch ticker
      const ticker: Ticker = await exchange.fetchTicker(symbol);

      const priceData: PriceData = {
        symbol,
        price: ticker.last || 0,
        bid: ticker.bid || 0,
        ask: ticker.ask || 0,
        volume24h: ticker.quoteVolume || 0,
        change24h: ticker.percentage || 0,
        timestamp: ticker.timestamp || Date.now(),
        exchange: exchangeId,
      };

      // Cache the result
      this.setCache(cacheKey, priceData);

      return priceData;
    } catch (error) {
      console.error(`Error fetching ${symbol} from ${exchangeId}:`, error);
      return null;
    }
  }

  /**
   * Get aggregated prices from multiple exchanges
   */
  async getAggregatedPrice(symbol: string): Promise<AggregatedPrice | null> {
    const promises = Array.from(this.exchanges.keys()).map(exchangeId =>
      this.getPriceFromExchange(exchangeId, symbol)
    );

    const results = await Promise.allSettled(promises);
    const prices: PriceData[] = results
      .filter(r => r.status === 'fulfilled' && r.value !== null)
      .map(r => (r as PromiseFulfilledResult<PriceData>).value);

    if (prices.length === 0) {
      return null;
    }

    const priceValues = prices.map(p => p.price);
    const totalVolume = prices.reduce((sum, p) => sum + p.volume24h, 0);

    // Calculate volume-weighted average price
    const vwap = prices.reduce((sum, p) => {
      const weight = p.volume24h / (totalVolume || 1);
      return sum + (p.price * weight);
    }, 0);

    return {
      symbol,
      averagePrice: vwap,
      minPrice: Math.min(...priceValues),
      maxPrice: Math.max(...priceValues),
      totalVolume,
      exchanges: prices.map(p => p.exchange),
      prices,
      timestamp: Date.now(),
    };
  }

  /**
   * Get historical OHLCV data
   */
  async getHistoricalData(
    symbol: string,
    timeframe: '1m' | '5m' | '15m' | '1h' | '4h' | '1d' = '1h',
    limit: number = 100,
    exchangeId: string = 'binance'
  ): Promise<HistoricalData[]> {
    const exchange = this.exchanges.get(exchangeId);
    if (!exchange) {
      throw new Error(`Exchange ${exchangeId} not initialized`);
    }

    try {
      // Check cache
      const cacheKey = `ohlcv-${exchangeId}-${symbol}-${timeframe}-${limit}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      // Load markets if needed
      if (!exchange.markets) {
        await exchange.loadMarkets();
      }

      // Check if exchange supports OHLCV
      if (!exchange.has['fetchOHLCV']) {
        throw new Error(`${exchangeId} does not support OHLCV data`);
      }

      // Fetch OHLCV data
      const ohlcv: OHLCV[] = await exchange.fetchOHLCV(symbol, timeframe, undefined, limit);

      const historicalData: HistoricalData[] = ohlcv.map(candle => ({
        timestamp: candle[0],
        open: candle[1],
        high: candle[2],
        low: candle[3],
        close: candle[4],
        volume: candle[5],
      }));

      // Cache the result
      this.setCache(cacheKey, historicalData);

      return historicalData;
    } catch (error) {
      console.error(`Error fetching historical data:`, error);
      return [];
    }
  }

  /**
   * Calculate market volatility
   */
  async calculateVolatility(
    symbol: string,
    period: number = 24,
    exchangeId: string = 'binance'
  ): Promise<number> {
    try {
      const historicalData = await this.getHistoricalData(
        symbol,
        '1h',
        period,
        exchangeId
      );

      if (historicalData.length < 2) {
        return 0;
      }

      // Calculate returns
      const returns: number[] = [];
      for (let i = 1; i < historicalData.length; i++) {
        const return_i = (historicalData[i].close - historicalData[i - 1].close) / 
                         historicalData[i - 1].close;
        returns.push(return_i);
      }

      // Calculate standard deviation
      const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
      const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
      const stdDev = Math.sqrt(variance);

      // Annualize volatility
      const annualizedVolatility = stdDev * Math.sqrt(365 * 24); // Hourly data

      return annualizedVolatility * 100; // Return as percentage
    } catch (error) {
      console.error('Error calculating volatility:', error);
      return 0;
    }
  }

  /**
   * Get market conditions for AI analysis
   */
  async getMarketConditions(
    symbol: string
  ): Promise<{
    volatility: 'low' | 'medium' | 'high';
    trend: 'bullish' | 'bearish' | 'neutral';
    volume24h: number;
    priceChange24h: number;
  }> {
    try {
      // Get aggregated price data
      const priceData = await this.getAggregatedPrice(symbol);
      if (!priceData) {
        throw new Error('Could not fetch price data');
      }

      // Calculate volatility
      const volatility = await this.calculateVolatility(symbol);
      
      // Determine volatility level
      let volatilityLevel: 'low' | 'medium' | 'high';
      if (volatility < 20) {
        volatilityLevel = 'low';
      } else if (volatility < 50) {
        volatilityLevel = 'medium';
      } else {
        volatilityLevel = 'high';
      }

      // Calculate average price change
      const avgPriceChange = priceData.prices.reduce(
        (sum, p) => sum + p.change24h,
        0
      ) / priceData.prices.length;

      // Determine trend
      let trend: 'bullish' | 'bearish' | 'neutral';
      if (avgPriceChange > 2) {
        trend = 'bullish';
      } else if (avgPriceChange < -2) {
        trend = 'bearish';
      } else {
        trend = 'neutral';
      }

      return {
        volatility: volatilityLevel,
        trend,
        volume24h: priceData.totalVolume,
        priceChange24h: avgPriceChange,
      };
    } catch (error) {
      console.error('Error getting market conditions:', error);
      // Return default values
      return {
        volatility: 'medium',
        trend: 'neutral',
        volume24h: 0,
        priceChange24h: 0,
      };
    }
  }

  /**
   * Compare DEX and CEX prices for arbitrage opportunities
   */
  async findArbitrageOpportunity(
    dexPrice: number,
    symbol: string,
    minProfitPercent: number = 0.5
  ): Promise<{
    hasOpportunity: boolean;
    bestExchange?: string;
    cexPrice?: number;
    profitPercent?: number;
    direction?: 'buy_dex_sell_cex' | 'buy_cex_sell_dex';
  }> {
    const aggregatedPrice = await this.getAggregatedPrice(symbol);
    if (!aggregatedPrice) {
      return { hasOpportunity: false };
    }

    let bestOpportunity = {
      hasOpportunity: false,
      bestExchange: '',
      cexPrice: 0,
      profitPercent: 0,
      direction: '' as 'buy_dex_sell_cex' | 'buy_cex_sell_dex',
    };

    for (const priceData of aggregatedPrice.prices) {
      // Check buy DEX, sell CEX
      const profitBuyDex = ((priceData.bid - dexPrice) / dexPrice) * 100;
      if (profitBuyDex > minProfitPercent && profitBuyDex > bestOpportunity.profitPercent) {
        bestOpportunity = {
          hasOpportunity: true,
          bestExchange: priceData.exchange,
          cexPrice: priceData.bid,
          profitPercent: profitBuyDex,
          direction: 'buy_dex_sell_cex',
        };
      }

      // Check buy CEX, sell DEX
      const profitBuyCex = ((dexPrice - priceData.ask) / priceData.ask) * 100;
      if (profitBuyCex > minProfitPercent && profitBuyCex > bestOpportunity.profitPercent) {
        bestOpportunity = {
          hasOpportunity: true,
          bestExchange: priceData.exchange,
          cexPrice: priceData.ask,
          profitPercent: profitBuyCex,
          direction: 'buy_cex_sell_dex',
        };
      }
    }

    return bestOpportunity;
  }

  /**
   * Cache helper functions
   */
  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * Clean up resources
   */
  async close(): Promise<void> {
    for (const exchange of this.exchanges.values()) {
      if (exchange.close) {
        await exchange.close();
      }
    }
    this.exchanges.clear();
    this.cache.clear();
  }
}