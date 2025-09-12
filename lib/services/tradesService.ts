/**
 * Trades Service
 * Fetches recent trades from various sources
 */

export interface Trade {
  type: 'BUY' | 'SELL';
  amount: number;
  price: number;
  timestamp: Date;
  txHash?: string;
  maker?: string;
  taker?: string;
}

class TradesService {
  private cache = new Map<string, { data: Trade[]; timestamp: number }>();
  private cacheTimeout = 30000; // 30 seconds

  /**
   * Get recent trades for a token pair
   * For now, generates realistic trades based on current price
   * In production, this would fetch from:
   * - Somnia DEX subgraph
   * - QuickSwap/Algebra API
   * - Or listen to contract events
   */
  async getRecentTrades(
    token0: string,
    token1: string,
    limit: number = 20
  ): Promise<Trade[]> {
    const cacheKey = `${token0}-${token1}`;
    
    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      // In production, fetch from DEX API or subgraph
      // For now, generate realistic trades
      const trades = await this.generateRealisticTrades(token0, token1, limit);
      
      // Cache the result
      this.cache.set(cacheKey, { data: trades, timestamp: Date.now() });
      
      return trades;
    } catch (error) {
      console.error('Error fetching trades:', error);
      return this.generateRealisticTrades(token0, token1, limit);
    }
  }

  /**
   * Generate realistic trades based on market conditions
   */
  private async generateRealisticTrades(
    token0: string,
    token1: string,
    limit: number
  ): Promise<Trade[]> {
    // Import priceService dynamically to avoid circular dependency
    const { priceService } = await import('./priceService');
    
    const trades: Trade[] = [];
    const now = new Date();
    
    // Get current price
    const priceData = await priceService.getCurrentPrice(token0);
    
    // If no price data, use reasonable defaults based on token
    let basePrice: number;
    if (priceData?.price) {
      basePrice = priceData.price;
    } else if (['USDC', 'USDT', 'DAI'].includes(token0.toUpperCase())) {
      basePrice = 1;
    } else if (['ETH', 'WETH'].includes(token0.toUpperCase())) {
      // Try to get WETH price from DIA Oracle
      const { diaOracleService } = await import('./diaOracle.service');
      const wethPrice = await diaOracleService.getPrice('WETH');
      basePrice = wethPrice?.value || 3500; // Fallback to reasonable estimate
    } else if (token0.toUpperCase() === 'WSOMI') {
      // Try to get WSOMI price
      const { diaOracleService } = await import('./diaOracle.service');
      const wsomiPrice = await diaOracleService.getPrice('WSOMI');
      basePrice = wsomiPrice?.value || 0.10; // Fallback to reasonable estimate
    } else {
      basePrice = 100; // Generic fallback
    }
    
    // Generate trades with realistic patterns
    for (let i = 0; i < limit; i++) {
      const minutesAgo = i * (Math.random() * 3 + 1); // Random 1-4 minutes between trades
      const timestamp = new Date(now.getTime() - minutesAgo * 60000);
      
      // Simulate market microstructure
      const isBuy = Math.random() > 0.48; // Slightly more buys in uptrend
      const spread = 0.001; // 0.1% spread
      const slippage = Math.random() * 0.002; // Up to 0.2% slippage
      
      // Price with spread and slippage
      const price = isBuy 
        ? basePrice * (1 + spread/2 + slippage)
        : basePrice * (1 - spread/2 - slippage);
      
      // Realistic trade sizes (log-normal distribution)
      const sizeExponent = Math.random() * 3 - 1; // -1 to 2
      const amount = Math.pow(10, sizeExponent) * (Math.random() * 2 + 0.5);
      
      // Add some price drift over time
      const drift = (Math.random() - 0.5) * 0.001 * i;
      
      trades.push({
        type: isBuy ? 'BUY' : 'SELL',
        amount: parseFloat(amount.toFixed(6)),
        price: price * (1 + drift),
        timestamp,
        txHash: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`,
      });
    }
    
    return trades;
  }

  /**
   * Subscribe to live trades updates
   */
  subscribeToTrades(
    token0: string,
    token1: string,
    callback: (trades: Trade[]) => void,
    interval: number = 10000
  ): () => void {
    // Initial fetch
    this.getRecentTrades(token0, token1).then(callback);
    
    // Set up interval for updates
    const intervalId = setInterval(async () => {
      const trades = await this.getRecentTrades(token0, token1);
      callback(trades);
    }, interval);
    
    // Return unsubscribe function
    return () => clearInterval(intervalId);
  }

  /**
   * Calculate trade statistics
   */
  calculateTradeStats(trades: Trade[]) {
    if (trades.length === 0) return null;
    
    const buyTrades = trades.filter(t => t.type === 'BUY');
    const sellTrades = trades.filter(t => t.type === 'SELL');
    
    const totalVolume = trades.reduce((sum, t) => sum + t.amount * t.price, 0);
    const avgPrice = trades.reduce((sum, t) => sum + t.price, 0) / trades.length;
    
    const buyVolume = buyTrades.reduce((sum, t) => sum + t.amount * t.price, 0);
    const sellVolume = sellTrades.reduce((sum, t) => sum + t.amount * t.price, 0);
    
    return {
      totalTrades: trades.length,
      buyTrades: buyTrades.length,
      sellTrades: sellTrades.length,
      totalVolume,
      buyVolume,
      sellVolume,
      avgPrice,
      buyPressure: buyVolume / totalVolume * 100,
      sellPressure: sellVolume / totalVolume * 100,
    };
  }
}

export const tradesService = new TradesService();