/**
 * AI Service
 * Provides intelligent recommendations for liquidity management
 * Integrates DIA Oracle prices and Subgraph data for enhanced analysis
 */

import OpenAI from 'openai';
import type { Position, Pool } from './quickswap.service';
import { DIAOracleService, type PriceData } from './dia-oracle.service';
import { SubgraphService, type PoolDayData } from './subgraph.service';

export interface AIRecommendation {
  action: 'rebalance' | 'compound' | 'remove' | 'hold' | 'add';
  confidence: number; // 0-100
  reasoning: string;
  suggestedParams?: {
    tickLower?: number;
    tickUpper?: number;
    amount0?: string;
    amount1?: string;
  };
  risks: string[];
  expectedReturn?: number;
}

export interface PositionAnalysis {
  healthScore: number; // 0-100
  inRange: boolean;
  impermanentLoss: number;
  feesEarned: string;
  recommendations: AIRecommendation[];
  priceImpact: {
    token0: number;
    token1: number;
  };
}

export interface MarketConditions {
  volatility: 'low' | 'medium' | 'high';
  trend: 'bullish' | 'bearish' | 'neutral';
  volume24h: number;
  priceChange24h: number;
  oraclePrice?: number;
  dexPrice?: number;
  priceDeviation?: number; // % difference between oracle and DEX
  arbitrageOpportunity?: boolean;
}

export class AIService {
  private openai?: OpenAI;
  private oracleService: DIAOracleService;
  private subgraphService: SubgraphService;
  
  constructor(apiKey?: string) {
    if (apiKey) {
      this.openai = new OpenAI({
        apiKey: apiKey,
      });
    }
    this.oracleService = new DIAOracleService();
    this.subgraphService = new SubgraphService();
  }

  /**
   * Analyze a liquidity position and provide recommendations
   */
  async analyzePosition(
    position: Position,
    pool: Pool,
    marketData?: MarketConditions
  ): Promise<PositionAnalysis> {
    // Calculate basic metrics
    const currentTick = pool.tick;
    const inRange = currentTick >= position.tickLower && currentTick <= position.tickUpper;
    
    // Calculate health score
    let healthScore = 50; // Base score
    
    if (inRange) {
      healthScore += 30; // Position is earning fees
    } else {
      healthScore -= 20; // Position out of range
    }
    
    // Adjust for position width
    const tickRange = position.tickUpper - position.tickLower;
    const optimalRange = pool.tickSpacing * 50; // Example optimal range
    
    if (tickRange < optimalRange * 0.5) {
      healthScore -= 10; // Too narrow, high IL risk
    } else if (tickRange > optimalRange * 2) {
      healthScore -= 5; // Too wide, low capital efficiency
    } else {
      healthScore += 10; // Good range
    }
    
    // Calculate impermanent loss (simplified)
    const priceRatio = this.calculatePriceRatio(currentTick, position.tickLower);
    const impermanentLoss = this.estimateImpermanentLoss(priceRatio);
    
    // Generate recommendations
    const recommendations = await this.generateRecommendations(
      position,
      pool,
      inRange,
      healthScore,
      marketData
    );
    
    // Calculate fees earned (simplified)
    const feesEarned = this.calculateFeesEarned(position);
    
    return {
      healthScore: Math.max(0, Math.min(100, healthScore)),
      inRange,
      impermanentLoss,
      feesEarned,
      recommendations,
      priceImpact: {
        token0: priceRatio - 1,
        token1: (1 / priceRatio) - 1,
      }
    };
  }

  /**
   * Generate AI-powered recommendations
   */
  private async generateRecommendations(
    position: Position,
    pool: Pool,
    inRange: boolean,
    healthScore: number,
    marketData?: MarketConditions
  ): Promise<AIRecommendation[]> {
    const recommendations: AIRecommendation[] = [];
    
    // Check if position needs rebalancing
    if (!inRange) {
      const rebalanceRec = await this.recommendRebalance(position, pool, marketData);
      recommendations.push(rebalanceRec);
    }
    
    // Check if fees should be compounded
    if (position.tokensOwed0 > 0n || position.tokensOwed1 > 0n) {
      recommendations.push({
        action: 'compound',
        confidence: 85,
        reasoning: 'You have uncollected fees that can be compounded to increase your position',
        risks: ['Gas costs on Somnia are minimal, making frequent compounding profitable'],
        expectedReturn: 0.5, // Example: 0.5% boost to APR
      });
    }
    
    // Check market conditions
    if (marketData) {
      if (marketData.volatility === 'high' && healthScore < 40) {
        recommendations.push({
          action: 'remove',
          confidence: 70,
          reasoning: 'High volatility combined with poor position health suggests removing liquidity',
          risks: ['Missing potential fee income if volatility decreases'],
        });
      } else if (marketData.trend === 'bullish' && inRange) {
        recommendations.push({
          action: 'add',
          confidence: 60,
          reasoning: 'Bullish market conditions and healthy position suggest adding more liquidity',
          risks: ['Increased exposure to impermanent loss'],
        });
      }
    }
    
    // Default recommendation if nothing specific
    if (recommendations.length === 0) {
      recommendations.push({
        action: 'hold',
        confidence: 75,
        reasoning: 'Position is performing adequately, no immediate action required',
        risks: ['Market conditions may change'],
      });
    }
    
    return recommendations;
  }

  /**
   * Recommend optimal rebalancing strategy
   */
  private async recommendRebalance(
    position: Position,
    pool: Pool,
    marketData?: MarketConditions
  ): Promise<AIRecommendation> {
    const currentTick = pool.tick;
    const tickSpacing = pool.tickSpacing;
    
    // Calculate new range based on current price
    let rangeMultiplier = 50; // Default range in tick spacings
    
    if (marketData?.volatility === 'high') {
      rangeMultiplier = 100; // Wider range for high volatility
    } else if (marketData?.volatility === 'low') {
      rangeMultiplier = 30; // Tighter range for low volatility
    }
    
    const newTickLower = Math.floor(currentTick / tickSpacing) * tickSpacing - (rangeMultiplier * tickSpacing / 2);
    const newTickUpper = Math.floor(currentTick / tickSpacing) * tickSpacing + (rangeMultiplier * tickSpacing / 2);
    
    // Use AI if available for better recommendations
    if (this.openai) {
      try {
        const prompt = this.buildRebalancePrompt(position, pool, marketData);
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: 'You are an expert DeFi liquidity manager specializing in concentrated liquidity AMMs.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 500,
        });
        
        // Parse AI response and extract recommendations
        const aiAdvice = response.choices[0].message.content || '';
        
        return {
          action: 'rebalance',
          confidence: 80,
          reasoning: aiAdvice.slice(0, 200), // First 200 chars of AI response
          suggestedParams: {
            tickLower: newTickLower,
            tickUpper: newTickUpper,
          },
          risks: ['Rebalancing incurs gas costs and potential slippage'],
        };
      } catch (error) {
        console.error('AI recommendation failed:', error);
      }
    }
    
    // Fallback to rule-based recommendation
    return {
      action: 'rebalance',
      confidence: 65,
      reasoning: `Position is out of range. Current tick: ${currentTick}, your range: ${position.tickLower}-${position.tickUpper}`,
      suggestedParams: {
        tickLower: newTickLower,
        tickUpper: newTickUpper,
      },
      risks: ['Rebalancing incurs gas costs', 'May realize impermanent loss'],
    };
  }

  /**
   * Build prompt for AI rebalancing recommendation
   */
  private buildRebalancePrompt(
    position: Position,
    pool: Pool,
    marketData?: MarketConditions
  ): string {
    return `
    Analyze this QuickSwap liquidity position on Somnia:
    
    Current Pool State:
    - Current Tick: ${pool.tick}
    - Pool Liquidity: ${pool.liquidity}
    - Tick Spacing: ${pool.tickSpacing}
    
    Position Details:
    - Range: ${position.tickLower} to ${position.tickUpper}
    - Liquidity: ${position.liquidity}
    - Uncollected Fees: Token0: ${position.tokensOwed0}, Token1: ${position.tokensOwed1}
    
    ${marketData ? `
    Market Conditions:
    - Volatility: ${marketData.volatility}
    - Trend: ${marketData.trend}
    - 24h Volume: ${marketData.volume24h}
    - 24h Price Change: ${marketData.priceChange24h}%
    ` : ''}
    
    Somnia Network Features:
    - Gas costs: ~$0.001 per transaction
    - Block time: sub-second
    - Rebalancing is extremely cheap
    
    Provide a concise recommendation for rebalancing this position. Consider:
    1. Optimal tick range for current conditions
    2. Whether to widen or tighten the range
    3. Expected impact on returns
    
    Keep response under 200 words.
    `;
  }

  /**
   * Calculate price ratio between two ticks
   */
  private calculatePriceRatio(tick1: number, tick2: number): number {
    // Price = 1.0001^tick
    return Math.pow(1.0001, tick1 - tick2);
  }

  /**
   * Estimate impermanent loss
   */
  private estimateImpermanentLoss(priceRatio: number): number {
    // IL = 2 * sqrt(priceRatio) / (1 + priceRatio) - 1
    const il = 2 * Math.sqrt(priceRatio) / (1 + priceRatio) - 1;
    return Math.abs(il) * 100; // Return as percentage
  }

  /**
   * Calculate fees earned (simplified)
   */
  private calculateFeesEarned(position: Position): string {
    // This is a simplified calculation
    // Real implementation would need token decimals and prices
    const totalFees = Number(position.tokensOwed0) + Number(position.tokensOwed1);
    return totalFees.toFixed(6);
  }

  /**
   * Get optimal range for a pool based on historical data
   */
  async getOptimalRange(
    pool: Pool,
    timeframe: '1h' | '24h' | '7d' = '24h'
  ): Promise<{ tickLower: number; tickUpper: number; confidence: number }> {
    // This would analyze historical price movements
    // For now, return a simple range based on current tick
    const currentTick = pool.tick;
    const tickSpacing = pool.tickSpacing;
    const rangeSize = 50 * tickSpacing; // 50 tick spacings on each side
    
    return {
      tickLower: Math.floor((currentTick - rangeSize) / tickSpacing) * tickSpacing,
      tickUpper: Math.ceil((currentTick + rangeSize) / tickSpacing) * tickSpacing,
      confidence: 70,
    };
  }

  /**
   * Analyze market using DIA Oracle prices
   */
  async analyzeWithOracle(
    token0Symbol: string,
    token1Symbol: string,
    poolAddress: string
  ): Promise<{
    oracleData: { token0: PriceData | null; token1: PriceData | null };
    priceDeviation: number;
    arbitrageOpportunity: boolean;
    recommendation: string;
  }> {
    // Get oracle prices
    const [token0Price, token1Price] = await Promise.all([
      this.oracleService.getPrice(token0Symbol),
      this.oracleService.getPrice(token1Symbol)
    ]);

    // Get pool data from subgraph
    const poolData = await this.subgraphService.getPool(poolAddress);
    
    if (!token0Price || !token1Price || !poolData) {
      return {
        oracleData: { token0: token0Price, token1: token1Price },
        priceDeviation: 0,
        arbitrageOpportunity: false,
        recommendation: 'Insufficient data for analysis'
      };
    }

    // Calculate oracle price ratio
    const oracleRatio = token0Price.price / token1Price.price;
    
    // Calculate DEX price from pool (simplified)
    const sqrtPrice = Number(poolData.sqrtPrice);
    const dexPrice = (sqrtPrice / (2 ** 96)) ** 2;
    
    // Calculate deviation
    const deviation = Math.abs((dexPrice - oracleRatio) / oracleRatio * 100);
    const hasArbitrage = deviation > 2; // 2% threshold
    
    let recommendation = '';
    if (hasArbitrage) {
      recommendation = `Arbitrage opportunity detected! ${deviation.toFixed(2)}% price difference between oracle (${oracleRatio.toFixed(4)}) and DEX (${dexPrice.toFixed(4)})`;
    } else if (token0Price.isStale || token1Price.isStale) {
      recommendation = 'Oracle prices may be stale. Use with caution.';
    } else {
      recommendation = `Prices are aligned. Oracle: ${oracleRatio.toFixed(4)}, DEX: ${dexPrice.toFixed(4)}`;
    }

    return {
      oracleData: { token0: token0Price, token1: token1Price },
      priceDeviation: deviation,
      arbitrageOpportunity: hasArbitrage,
      recommendation
    };
  }

  /**
   * Get enhanced market conditions using Subgraph data
   */
  async getEnhancedMarketConditions(
    poolAddress: string
  ): Promise<MarketConditions> {
    // Get pool stats from subgraph
    const poolStats = await this.subgraphService.getPoolStats(poolAddress);
    const historicalData = await this.subgraphService.getPoolDayData(poolAddress, 7);
    
    if (!poolStats || historicalData.length === 0) {
      return {
        volatility: 'medium',
        trend: 'neutral',
        volume24h: 0,
        priceChange24h: 0
      };
    }

    // Calculate volatility from price movements
    let volatility: 'low' | 'medium' | 'high' = 'medium';
    if (historicalData.length > 1) {
      const priceChanges = historicalData.slice(0, -1).map((day, i) => {
        const nextDay = historicalData[i + 1];
        return Math.abs((Number(day.close) - Number(nextDay.close)) / Number(nextDay.close) * 100);
      });
      const avgChange = priceChanges.reduce((a, b) => a + b, 0) / priceChanges.length;
      
      if (avgChange < 2) volatility = 'low';
      else if (avgChange > 10) volatility = 'high';
    }

    // Determine trend
    const firstPrice = Number(historicalData[historicalData.length - 1].close);
    const lastPrice = Number(historicalData[0].close);
    const priceChange = (lastPrice - firstPrice) / firstPrice * 100;
    
    let trend: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    if (priceChange > 5) trend = 'bullish';
    else if (priceChange < -5) trend = 'bearish';

    return {
      volatility,
      trend,
      volume24h: poolStats.volume24h,
      priceChange24h: priceChange
    };
  }

  /**
   * Get AI recommendation with oracle and subgraph data
   */
  async getEnhancedRecommendation(
    position: Position,
    pool: Pool,
    poolAddress: string
  ): Promise<AIRecommendation> {
    // Get enhanced market conditions
    const marketConditions = await this.getEnhancedMarketConditions(poolAddress);
    
    // Get oracle analysis
    const oracleAnalysis = await this.analyzeWithOracle(
      pool.token0.symbol,
      pool.token1.symbol,
      poolAddress
    );

    // Get pool APR from subgraph
    const apr = await this.subgraphService.calculatePoolAPR(poolAddress);

    // Build comprehensive analysis
    const inRange = pool.tick >= position.tickLower && pool.tick <= position.tickUpper;
    
    let action: AIRecommendation['action'] = 'hold';
    let confidence = 50;
    let reasoning = '';
    const risks: string[] = [];

    // Decision logic with oracle and subgraph data
    if (oracleAnalysis.arbitrageOpportunity) {
      action = 'add';
      confidence = 85;
      reasoning = `Arbitrage opportunity: ${oracleAnalysis.priceDeviation.toFixed(2)}% price difference. Consider adding liquidity to capture fees.`;
      risks.push('Price may converge quickly');
    } else if (!inRange && marketConditions.volatility === 'low') {
      action = 'rebalance';
      confidence = 75;
      reasoning = 'Position out of range in low volatility environment. Rebalancing recommended.';
      risks.push('Gas costs for rebalancing');
    } else if (apr && apr > 100) {
      action = 'compound';
      confidence = 80;
      reasoning = `High APR of ${apr.toFixed(2)}%. Compound fees to maximize returns.`;
      risks.push('APR may decrease with more liquidity');
    } else if (marketConditions.volatility === 'high' && !inRange) {
      action = 'remove';
      confidence = 70;
      reasoning = 'High volatility with position out of range. Consider removing to avoid further losses.';
      risks.push('May miss fee opportunities if price returns');
    }

    // Add market condition context
    reasoning += ` Market: ${marketConditions.trend} trend with ${marketConditions.volatility} volatility.`;

    return {
      action,
      confidence,
      reasoning,
      risks,
      expectedReturn: apr || undefined
    };
  }

  /**
   * Monitor positions for alerts using oracle and subgraph
   */
  async monitorPositionsWithAlerts(
    positions: Position[],
    callback: (alert: {
      position: Position;
      type: 'arbitrage' | 'out_of_range' | 'high_fees' | 'impermanent_loss';
      message: string;
      severity: 'low' | 'medium' | 'high';
    }) => void
  ): Promise<NodeJS.Timer> {
    const checkInterval = 60000; // Check every minute

    const interval = setInterval(async () => {
      for (const position of positions) {
        try {
          // Get pool data
          const pool = await this.subgraphService.getPool(position.pool.id);
          if (!pool) continue;

          // Check if position is in range
          const currentTick = Number(pool.tick || 0);
          const inRange = currentTick >= position.tickLower && currentTick <= position.tickUpper;

          if (!inRange) {
            callback({
              position,
              type: 'out_of_range',
              message: `Position out of range. Current tick: ${currentTick}`,
              severity: 'medium'
            });
          }

          // Check for arbitrage opportunities
          const oracleAnalysis = await this.analyzeWithOracle(
            pool.token0.symbol,
            pool.token1.symbol,
            pool.id
          );

          if (oracleAnalysis.arbitrageOpportunity) {
            callback({
              position,
              type: 'arbitrage',
              message: `${oracleAnalysis.priceDeviation.toFixed(2)}% arbitrage opportunity detected`,
              severity: 'high'
            });
          }

          // Check accumulated fees
          const fees = Number(position.tokensOwed0) + Number(position.tokensOwed1);
          if (fees > 100) { // Threshold in USD equivalent
            callback({
              position,
              type: 'high_fees',
              message: `High uncollected fees: ${fees.toFixed(2)}`,
              severity: 'low'
            });
          }

          // Check impermanent loss
          const il = await this.subgraphService.calculateImpermanentLoss(
            pool.id,
            Date.now() / 1000 - 86400 // 24 hours ago
          );

          if (il && Math.abs(il.impermanentLoss) > 5) {
            callback({
              position,
              type: 'impermanent_loss',
              message: `Impermanent loss: ${il.impermanentLoss.toFixed(2)}%`,
              severity: il.impermanentLoss > 10 ? 'high' : 'medium'
            });
          }
        } catch (error) {
          console.error('Error monitoring position:', error);
        }
      }
    }, checkInterval);

    return interval;
  }
}