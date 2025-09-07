/**
 * Position Manager Service
 * Orchestrates liquidity position management with AI recommendations
 */

import { QuickSwapService, type Position, type Pool } from './quickswap.service';
import { AIService, type AIRecommendation } from './ai.service';
import { PriceService } from './price.service';
import type { Address } from 'viem';

export interface PositionStrategy {
  type: 'conservative' | 'balanced' | 'aggressive';
  rangeMultiplier: number; // How wide the range should be
  rebalanceThreshold: number; // % out of range before rebalancing
  compoundThreshold: number; // Minimum fees before compounding
  maxGasPrice: number; // Maximum gas price in gwei
}

export interface ManagementAction {
  type: 'rebalance' | 'compound' | 'add' | 'remove' | 'none';
  reason: string;
  params?: any;
  estimatedGas?: bigint;
  estimatedProfit?: number;
  priority: 'low' | 'medium' | 'high';
}

export interface PositionReport {
  position: Position;
  pool: Pool;
  analysis: {
    healthScore: number;
    inRange: boolean;
    feesEarned: string;
    impermanentLoss: number;
  };
  recommendations: AIRecommendation[];
  suggestedActions: ManagementAction[];
  marketConditions?: any;
  arbitrageOpportunities?: any;
}

const DEFAULT_STRATEGIES: Record<string, PositionStrategy> = {
  conservative: {
    type: 'conservative',
    rangeMultiplier: 100, // Wide range
    rebalanceThreshold: 50, // Rebalance when 50% out of range
    compoundThreshold: 0.01, // Compound at 0.01 ETH fees
    maxGasPrice: 100,
  },
  balanced: {
    type: 'balanced',
    rangeMultiplier: 50, // Medium range
    rebalanceThreshold: 30,
    compoundThreshold: 0.005,
    maxGasPrice: 50,
  },
  aggressive: {
    type: 'aggressive',
    rangeMultiplier: 20, // Tight range
    rebalanceThreshold: 10,
    compoundThreshold: 0.001,
    maxGasPrice: 20,
  },
};

export class PositionManagerService {
  private quickswap: QuickSwapService;
  private ai: AIService;
  private priceService: PriceService;
  private strategy: PositionStrategy;

  constructor(
    network: 'testnet' | 'mainnet' = 'testnet',
    privateKey?: string,
    openaiKey?: string,
    strategy: PositionStrategy = DEFAULT_STRATEGIES.balanced
  ) {
    this.quickswap = new QuickSwapService(network, privateKey);
    this.ai = new AIService(openaiKey);
    this.priceService = new PriceService();
    this.strategy = strategy;
  }

  /**
   * Analyze all positions for a user
   */
  async analyzeAllPositions(userAddress: Address): Promise<PositionReport[]> {
    const positions = await this.quickswap.getUserPositions(userAddress);
    const reports: PositionReport[] = [];

    for (const position of positions) {
      const report = await this.analyzePosition(position);
      if (report) {
        reports.push(report);
      }
    }

    return reports;
  }

  /**
   * Analyze a single position
   */
  async analyzePosition(
    position: Position,
    includeMarketData: boolean = true
  ): Promise<PositionReport | null> {
    try {
      // Get pool data
      const pool = await this.quickswap.getPool(
        position.token0,
        position.token1
      );

      if (!pool) {
        console.error('Pool not found for position');
        return null;
      }

      // Get market data if requested
      let marketConditions;
      let arbitrageOpportunities;

      if (includeMarketData) {
        // Map token addresses to symbols (this would need a token mapping)
        const symbol = 'ETH/USDT'; // Example, would need actual mapping

        try {
          marketConditions = await this.priceService.getMarketConditions(symbol);
          
          // Calculate DEX price from pool data
          const dexPrice = this.calculatePriceFromTick(pool.tick);
          arbitrageOpportunities = await this.priceService.findArbitrageOpportunity(
            dexPrice,
            symbol,
            0.5
          );
        } catch (error) {
          console.error('Error fetching market data:', error);
        }
      }

      // Get AI analysis
      const analysis = await this.ai.analyzePosition(
        position,
        pool,
        marketConditions
      );

      // Generate management actions
      const suggestedActions = this.generateActions(
        position,
        pool,
        analysis,
        arbitrageOpportunities
      );

      return {
        position,
        pool,
        analysis: {
          healthScore: analysis.healthScore,
          inRange: analysis.inRange,
          feesEarned: analysis.feesEarned,
          impermanentLoss: analysis.impermanentLoss,
        },
        recommendations: analysis.recommendations,
        suggestedActions,
        marketConditions,
        arbitrageOpportunities,
      };
    } catch (error) {
      console.error('Error analyzing position:', error);
      return null;
    }
  }

  /**
   * Execute a management action
   */
  async executeAction(
    action: ManagementAction,
    position: Position,
    autoApprove: boolean = false
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      if (!autoApprove) {
        // In a real app, this would prompt user for confirmation
        console.log('Action requires approval:', action);
        return { success: false, error: 'User approval required' };
      }

      let txHash: string | null = null;

      switch (action.type) {
        case 'rebalance':
          txHash = await this.rebalancePosition(position, action.params);
          break;

        case 'compound':
          txHash = await this.compoundFees(position);
          break;

        case 'add':
          txHash = await this.addLiquidity(position, action.params);
          break;

        case 'remove':
          txHash = await this.removeLiquidity(position, action.params);
          break;

        default:
          return { success: false, error: 'Unknown action type' };
      }

      if (txHash) {
        return { success: true, txHash };
      } else {
        return { success: false, error: 'Transaction failed' };
      }
    } catch (error) {
      console.error('Error executing action:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Generate management actions based on analysis
   */
  private generateActions(
    position: Position,
    pool: Pool,
    analysis: any,
    arbitrage?: any
  ): ManagementAction[] {
    const actions: ManagementAction[] = [];

    // Check if rebalancing is needed
    if (!analysis.inRange) {
      const outOfRangePercent = this.calculateOutOfRangePercent(
        pool.tick,
        position.tickLower,
        position.tickUpper
      );

      if (outOfRangePercent > this.strategy.rebalanceThreshold) {
        actions.push({
          type: 'rebalance',
          reason: `Position is ${outOfRangePercent.toFixed(1)}% out of range`,
          priority: outOfRangePercent > 50 ? 'high' : 'medium',
          params: {
            newTickLower: analysis.recommendations[0]?.suggestedParams?.tickLower,
            newTickUpper: analysis.recommendations[0]?.suggestedParams?.tickUpper,
          },
        });
      }
    }

    // Check if fees should be compounded
    const estimatedFees = Number(position.tokensOwed0) + Number(position.tokensOwed1);
    if (estimatedFees > this.strategy.compoundThreshold) {
      actions.push({
        type: 'compound',
        reason: `Compound ${estimatedFees.toFixed(6)} in uncollected fees`,
        priority: 'low',
        estimatedProfit: estimatedFees * 0.05, // Assume 5% APR boost
      });
    }

    // Check for arbitrage opportunities
    if (arbitrage?.hasOpportunity && arbitrage.profitPercent > 1) {
      actions.push({
        type: 'none', // Would need separate arbitrage logic
        reason: `Arbitrage opportunity: ${arbitrage.profitPercent.toFixed(2)}% profit on ${arbitrage.bestExchange}`,
        priority: 'high',
      });
    }

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    actions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return actions;
  }

  /**
   * Rebalance a position
   */
  private async rebalancePosition(
    position: Position,
    params: any
  ): Promise<string | null> {
    // This would:
    // 1. Remove liquidity from current position
    // 2. Calculate new amounts for new range
    // 3. Create new position with new range
    
    // For now, return null as this needs transaction batching
    console.log('Rebalancing position:', position.tokenId, params);
    return null;
  }

  /**
   * Compound fees back into position
   */
  private async compoundFees(position: Position): Promise<string | null> {
    // First collect fees
    const collectTx = await this.quickswap.collectFees(
      position.tokenId,
      position.token0 // Collect to position owner
    );

    if (!collectTx) {
      return null;
    }

    // Then increase liquidity with collected amounts
    const increaseTx = await this.quickswap.increaseLiquidity(
      position.tokenId,
      position.tokensOwed0,
      position.tokensOwed1,
      BigInt(0), // Min amounts
      BigInt(0),
      BigInt(Math.floor(Date.now() / 1000) + 3600)
    );

    return increaseTx;
  }

  /**
   * Add liquidity to position
   */
  private async addLiquidity(
    position: Position,
    params: any
  ): Promise<string | null> {
    return await this.quickswap.increaseLiquidity(
      position.tokenId,
      BigInt(params.amount0 || 0),
      BigInt(params.amount1 || 0),
      BigInt(0),
      BigInt(0),
      BigInt(Math.floor(Date.now() / 1000) + 3600)
    );
  }

  /**
   * Remove liquidity from position
   */
  private async removeLiquidity(
    position: Position,
    params: any
  ): Promise<string | null> {
    const liquidityToRemove = params.percentage 
      ? (position.liquidity * BigInt(params.percentage)) / BigInt(100)
      : position.liquidity;

    return await this.quickswap.decreaseLiquidity(
      position.tokenId,
      liquidityToRemove,
      BigInt(0),
      BigInt(0),
      BigInt(Math.floor(Date.now() / 1000) + 3600)
    );
  }

  /**
   * Calculate how far out of range a position is
   */
  private calculateOutOfRangePercent(
    currentTick: number,
    tickLower: number,
    tickUpper: number
  ): number {
    if (currentTick >= tickLower && currentTick <= tickUpper) {
      return 0;
    }

    if (currentTick < tickLower) {
      return ((tickLower - currentTick) / (tickUpper - tickLower)) * 100;
    } else {
      return ((currentTick - tickUpper) / (tickUpper - tickLower)) * 100;
    }
  }

  /**
   * Calculate price from tick
   */
  private calculatePriceFromTick(tick: number): number {
    return Math.pow(1.0001, tick);
  }

  /**
   * Set management strategy
   */
  setStrategy(strategy: PositionStrategy | 'conservative' | 'balanced' | 'aggressive'): void {
    if (typeof strategy === 'string') {
      this.strategy = DEFAULT_STRATEGIES[strategy];
    } else {
      this.strategy = strategy;
    }
  }

  /**
   * Clean up resources
   */
  async close(): Promise<void> {
    await this.priceService.close();
  }
}