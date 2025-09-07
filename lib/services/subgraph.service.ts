/**
 * Subgraph Service
 * Queries blockchain data from Somnia's GraphQL endpoints
 * Provides historical data, analytics, and complex queries for DEX operations
 */

import { getCurrentNetwork, getCurrentNetworkName } from '../config/networks.config';

// GraphQL query types
export interface Pool {
  id: string;
  token0: {
    id: string;
    symbol: string;
    decimals: string;
  };
  token1: {
    id: string;
    symbol: string;
    decimals: string;
  };
  totalValueLockedUSD: string;
  volumeUSD: string;
  feesUSD: string;
  txCount: string;
  liquidity: string;
  sqrtPrice: string;
  tick: string;
  feeTier?: string; // QuickSwap only
  reserve0?: string; // SimpleDEX only
  reserve1?: string; // SimpleDEX only
}

export interface Position {
  id: string;
  owner: string;
  pool: Pool;
  liquidity: string;
  tickLower?: string; // QuickSwap only
  tickUpper?: string; // QuickSwap only
  feeGrowthInside0LastX128?: string;
  feeGrowthInside1LastX128?: string;
  tokensOwed0: string;
  tokensOwed1: string;
  shares?: string; // SimpleDEX only
}

export interface Swap {
  id: string;
  timestamp: string;
  pool: Pool;
  sender: string;
  recipient: string;
  amount0: string;
  amount1: string;
  amountUSD: string;
  tick?: string;
  sqrtPriceX96?: string;
}

export interface Mint {
  id: string;
  timestamp: string;
  pool: Pool;
  owner: string;
  sender: string;
  amount0: string;
  amount1: string;
  amountUSD: string;
  tickLower?: string;
  tickUpper?: string;
  liquidity?: string;
}

export interface Burn {
  id: string;
  timestamp: string;
  pool: Pool;
  owner: string;
  amount0: string;
  amount1: string;
  amountUSD: string;
  tickLower?: string;
  tickUpper?: string;
  liquidity?: string;
}

export interface PoolDayData {
  date: number;
  pool: Pool;
  volumeUSD: string;
  tvlUSD: string;
  feesUSD: string;
  txCount: string;
  open: string;
  high: string;
  low: string;
  close: string;
}

export interface TokenDayData {
  date: number;
  token: {
    id: string;
    symbol: string;
  };
  priceUSD: string;
  volumeUSD: string;
  tvlUSD: string;
  open: string;
  high: string;
  low: string;
  close: string;
}

export class SubgraphService {
  private endpoint: string = '';
  private subgraphName: string = '';

  constructor() {
    this.initialize();
  }

  /**
   * Initialize subgraph based on current network
   */
  private initialize() {
    const config = getCurrentNetwork();
    if (config.subgraph) {
      this.endpoint = config.subgraph.endpoint;
      this.subgraphName = config.subgraph.name;
      console.log(`📈 Subgraph initialized: ${this.subgraphName} on ${config.name}`);
    } else {
      console.warn('⚠️ Subgraph not configured for this network');
    }
  }

  /**
   * Execute GraphQL query
   */
  private async query<T>(query: string, variables: Record<string, any> = {}): Promise<T | null> {
    if (!this.endpoint) {
      console.error('Subgraph endpoint not configured');
      return null;
    }

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables,
        }),
      });

      const data = await response.json();
      
      if (data.errors) {
        console.error('Subgraph query errors:', data.errors);
        return null;
      }

      return data.data;
    } catch (error) {
      console.error('Subgraph query error:', error);
      return null;
    }
  }

  /**
   * Get pool by address
   */
  async getPool(poolAddress: string): Promise<Pool | null> {
    const isQuickSwap = getCurrentNetworkName() === 'mainnet';
    
    const query = isQuickSwap ? `
      query GetPool($id: ID!) {
        pool(id: $id) {
          id
          token0 {
            id
            symbol
            decimals
          }
          token1 {
            id
            symbol
            decimals
          }
          totalValueLockedUSD
          volumeUSD
          feesUSD
          txCount
          liquidity
          sqrtPrice
          tick
          feeTier
        }
      }
    ` : `
      query GetPool($id: ID!) {
        pool(id: $id) {
          id
          token0 {
            id
            symbol
            decimals
          }
          token1 {
            id
            symbol
            decimals
          }
          totalValueLockedUSD
          volumeUSD
          feesUSD
          txCount
          reserve0
          reserve1
        }
      }
    `;

    const result = await this.query<{ pool: Pool }>(query, { 
      id: poolAddress.toLowerCase() 
    });
    
    return result?.pool || null;
  }

  /**
   * Get top pools by TVL
   */
  async getTopPools(limit: number = 10): Promise<Pool[]> {
    const isQuickSwap = getCurrentNetworkName() === 'mainnet';
    
    const query = isQuickSwap ? `
      query GetTopPools($first: Int!) {
        pools(
          first: $first,
          orderBy: totalValueLockedUSD,
          orderDirection: desc,
          where: { totalValueLockedUSD_gt: "0" }
        ) {
          id
          token0 {
            id
            symbol
            decimals
          }
          token1 {
            id
            symbol
            decimals
          }
          totalValueLockedUSD
          volumeUSD
          feesUSD
          txCount
          liquidity
          sqrtPrice
          tick
          feeTier
        }
      }
    ` : `
      query GetTopPools($first: Int!) {
        pools(
          first: $first,
          orderBy: totalValueLockedUSD,
          orderDirection: desc
        ) {
          id
          token0 {
            id
            symbol
            decimals
          }
          token1 {
            id
            symbol
            decimals
          }
          totalValueLockedUSD
          volumeUSD
          feesUSD
          txCount
          reserve0
          reserve1
        }
      }
    `;

    const result = await this.query<{ pools: Pool[] }>(query, { first: limit });
    return result?.pools || [];
  }

  /**
   * Get user positions
   */
  async getUserPositions(userAddress: string): Promise<Position[]> {
    const isQuickSwap = getCurrentNetworkName() === 'mainnet';
    
    const query = isQuickSwap ? `
      query GetUserPositions($owner: String!) {
        positions(where: { owner: $owner, liquidity_gt: "0" }) {
          id
          owner
          pool {
            id
            token0 {
              id
              symbol
              decimals
            }
            token1 {
              id
              symbol
              decimals
            }
            totalValueLockedUSD
            volumeUSD
            feesUSD
            sqrtPrice
            tick
            feeTier
          }
          liquidity
          tickLower
          tickUpper
          feeGrowthInside0LastX128
          feeGrowthInside1LastX128
          tokensOwed0
          tokensOwed1
        }
      }
    ` : `
      query GetUserPositions($owner: String!) {
        positions(where: { owner: $owner, shares_gt: "0" }) {
          id
          owner
          pool {
            id
            token0 {
              id
              symbol
              decimals
            }
            token1 {
              id
              symbol
              decimals
            }
            totalValueLockedUSD
            volumeUSD
            feesUSD
            reserve0
            reserve1
          }
          shares
          tokensOwed0
          tokensOwed1
        }
      }
    `;

    const result = await this.query<{ positions: Position[] }>(query, { 
      owner: userAddress.toLowerCase() 
    });
    
    return result?.positions || [];
  }

  /**
   * Get recent swaps for a pool
   */
  async getRecentSwaps(poolAddress: string, limit: number = 20): Promise<Swap[]> {
    const query = `
      query GetRecentSwaps($pool: String!, $first: Int!) {
        swaps(
          first: $first,
          orderBy: timestamp,
          orderDirection: desc,
          where: { pool: $pool }
        ) {
          id
          timestamp
          pool {
            id
            token0 {
              id
              symbol
            }
            token1 {
              id
              symbol
            }
          }
          sender
          recipient
          amount0
          amount1
          amountUSD
          tick
          sqrtPriceX96
        }
      }
    `;

    const result = await this.query<{ swaps: Swap[] }>(query, { 
      pool: poolAddress.toLowerCase(),
      first: limit 
    });
    
    return result?.swaps || [];
  }

  /**
   * Get pool historical data
   */
  async getPoolDayData(
    poolAddress: string,
    days: number = 30
  ): Promise<PoolDayData[]> {
    const startTime = Math.floor(Date.now() / 1000) - (days * 24 * 60 * 60);
    
    const query = `
      query GetPoolDayData($pool: String!, $startTime: Int!) {
        poolDayDatas(
          orderBy: date,
          orderDirection: desc,
          where: { 
            pool: $pool,
            date_gte: $startTime
          }
        ) {
          date
          pool {
            id
            token0 {
              symbol
            }
            token1 {
              symbol
            }
          }
          volumeUSD
          tvlUSD
          feesUSD
          txCount
          open
          high
          low
          close
        }
      }
    `;

    const result = await this.query<{ poolDayDatas: PoolDayData[] }>(query, { 
      pool: poolAddress.toLowerCase(),
      startTime 
    });
    
    return result?.poolDayDatas || [];
  }

  /**
   * Get token price history
   */
  async getTokenDayData(
    tokenAddress: string,
    days: number = 30
  ): Promise<TokenDayData[]> {
    const startTime = Math.floor(Date.now() / 1000) - (days * 24 * 60 * 60);
    
    const query = `
      query GetTokenDayData($token: String!, $startTime: Int!) {
        tokenDayDatas(
          orderBy: date,
          orderDirection: desc,
          where: { 
            token: $token,
            date_gte: $startTime
          }
        ) {
          date
          token {
            id
            symbol
          }
          priceUSD
          volumeUSD
          tvlUSD
          open
          high
          low
          close
        }
      }
    `;

    const result = await this.query<{ tokenDayDatas: TokenDayData[] }>(query, { 
      token: tokenAddress.toLowerCase(),
      startTime 
    });
    
    return result?.tokenDayDatas || [];
  }

  /**
   * Get mints (liquidity adds) for a pool
   */
  async getPoolMints(poolAddress: string, limit: number = 20): Promise<Mint[]> {
    const query = `
      query GetPoolMints($pool: String!, $first: Int!) {
        mints(
          first: $first,
          orderBy: timestamp,
          orderDirection: desc,
          where: { pool: $pool }
        ) {
          id
          timestamp
          pool {
            id
            token0 {
              symbol
            }
            token1 {
              symbol
            }
          }
          owner
          sender
          amount0
          amount1
          amountUSD
          tickLower
          tickUpper
          liquidity
        }
      }
    `;

    const result = await this.query<{ mints: Mint[] }>(query, { 
      pool: poolAddress.toLowerCase(),
      first: limit 
    });
    
    return result?.mints || [];
  }

  /**
   * Get burns (liquidity removes) for a pool
   */
  async getPoolBurns(poolAddress: string, limit: number = 20): Promise<Burn[]> {
    const query = `
      query GetPoolBurns($pool: String!, $first: Int!) {
        burns(
          first: $first,
          orderBy: timestamp,
          orderDirection: desc,
          where: { pool: $pool }
        ) {
          id
          timestamp
          pool {
            id
            token0 {
              symbol
            }
            token1 {
              symbol
            }
          }
          owner
          amount0
          amount1
          amountUSD
          tickLower
          tickUpper
          liquidity
        }
      }
    `;

    const result = await this.query<{ burns: Burn[] }>(query, { 
      pool: poolAddress.toLowerCase(),
      first: limit 
    });
    
    return result?.burns || [];
  }

  /**
   * Calculate pool APR based on fees
   */
  async calculatePoolAPR(poolAddress: string): Promise<number | null> {
    const poolData = await this.getPoolDayData(poolAddress, 7);
    
    if (!poolData || poolData.length === 0) {
      return null;
    }

    // Calculate average daily fees and TVL
    const avgDailyFees = poolData.reduce((sum, day) => 
      sum + parseFloat(day.feesUSD), 0) / poolData.length;
    
    const avgTVL = poolData.reduce((sum, day) => 
      sum + parseFloat(day.tvlUSD), 0) / poolData.length;

    if (avgTVL === 0) return 0;

    // APR = (Daily Fees * 365 / TVL) * 100
    const apr = (avgDailyFees * 365 / avgTVL) * 100;
    
    return apr;
  }

  /**
   * Get pool statistics
   */
  async getPoolStats(poolAddress: string): Promise<{
    tvl: number;
    volume24h: number;
    fees24h: number;
    apr: number | null;
    txCount24h: number;
  } | null> {
    const [pool, dayData, apr] = await Promise.all([
      this.getPool(poolAddress),
      this.getPoolDayData(poolAddress, 1),
      this.calculatePoolAPR(poolAddress)
    ]);

    if (!pool) return null;

    const latest = dayData[0];
    
    return {
      tvl: parseFloat(pool.totalValueLockedUSD),
      volume24h: latest ? parseFloat(latest.volumeUSD) : 0,
      fees24h: latest ? parseFloat(latest.feesUSD) : 0,
      apr,
      txCount24h: latest ? parseInt(latest.txCount) : 0
    };
  }

  /**
   * Search pools by token symbols
   */
  async searchPools(token0Symbol: string, token1Symbol: string): Promise<Pool[]> {
    const query = `
      query SearchPools($token0: String!, $token1: String!) {
        pools(
          where: {
            or: [
              { token0_: { symbol: $token0 }, token1_: { symbol: $token1 } },
              { token0_: { symbol: $token1 }, token1_: { symbol: $token0 } }
            ]
          }
        ) {
          id
          token0 {
            id
            symbol
            decimals
          }
          token1 {
            id
            symbol
            decimals
          }
          totalValueLockedUSD
          volumeUSD
          feesUSD
          txCount
          liquidity
        }
      }
    `;

    const result = await this.query<{ pools: Pool[] }>(query, { 
      token0: token0Symbol.toUpperCase(),
      token1: token1Symbol.toUpperCase()
    });
    
    return result?.pools || [];
  }

  /**
   * Get global protocol statistics
   */
  async getProtocolStats(): Promise<{
    totalTVL: number;
    totalVolume: number;
    totalFees: number;
    poolCount: number;
  } | null> {
    const query = `
      query GetProtocolStats {
        factory(id: "0x1") {
          totalValueLockedUSD
          totalVolumeUSD
          totalFeesUSD
          poolCount
        }
      }
    `;

    const result = await this.query<{ 
      factory: {
        totalValueLockedUSD: string;
        totalVolumeUSD: string;
        totalFeesUSD: string;
        poolCount: string;
      }
    }>(query);

    if (!result?.factory) return null;

    return {
      totalTVL: parseFloat(result.factory.totalValueLockedUSD),
      totalVolume: parseFloat(result.factory.totalVolumeUSD),
      totalFees: parseFloat(result.factory.totalFeesUSD),
      poolCount: parseInt(result.factory.poolCount)
    };
  }

  /**
   * Monitor pool for arbitrage opportunities
   */
  async findArbitrageOpportunities(
    minProfitUSD: number = 100
  ): Promise<Array<{
    pool: Pool;
    profitUSD: number;
    path: string[];
  }>> {
    // This would require complex multi-hop path finding
    // For now, return empty array as placeholder
    console.log('Arbitrage detection requires multi-hop path analysis');
    return [];
  }

  /**
   * Get impermanent loss for position
   */
  async calculateImpermanentLoss(
    poolAddress: string,
    entryTimestamp: number
  ): Promise<{
    currentPriceRatio: number;
    entryPriceRatio: number;
    impermanentLoss: number; // percentage
  } | null> {
    const dayData = await this.getPoolDayData(poolAddress, 90);
    
    if (!dayData || dayData.length === 0) return null;

    // Find entry day data
    const entryDay = dayData.find(d => d.date >= entryTimestamp);
    if (!entryDay) return null;

    const currentPrice = parseFloat(dayData[0].close);
    const entryPrice = parseFloat(entryDay.close);
    
    const priceRatio = currentPrice / entryPrice;
    
    // IL = 2 * sqrt(price_ratio) / (1 + price_ratio) - 1
    const il = (2 * Math.sqrt(priceRatio) / (1 + priceRatio) - 1) * 100;

    return {
      currentPriceRatio: currentPrice,
      entryPriceRatio: entryPrice,
      impermanentLoss: il
    };
  }
}