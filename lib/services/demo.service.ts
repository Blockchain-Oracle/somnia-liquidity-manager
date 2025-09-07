/**
 * Demo Service for Hackathon
 * Simulates QuickSwap functionality when mainnet is not accessible
 */

import type { Position, Pool } from './quickswap.service';
import type { Address } from 'viem';

export class DemoService {
  private mockPositions: Map<string, Position[]> = new Map();
  private mockPools: Map<string, Pool> = new Map();

  constructor() {
    this.initializeMockData();
  }

  /**
   * Initialize with demo data
   */
  private initializeMockData() {
    // Create mock pools
    const demoPool: Pool = {
      address: '0x1234567890123456789012345678901234567890' as Address,
      token0: '0x046EDe9564A72571df6F5e44d0405360c0f4dCab' as Address, // WSOMI
      token1: '0x28BEc7E30E6faee657a03e19Bf1128AaD7632A00' as Address, // USDC
      fee: 3000,
      tick: -887272,
      price: BigInt('79228162514264337593543950336'), // ~1:1 price
      liquidity: BigInt('1000000000000000000000'), // 1000 tokens
      tickSpacing: 60,
    };

    this.mockPools.set('WSOMI-USDC', demoPool);

    // Create mock positions
    const demoPosition: Position = {
      tokenId: BigInt(1),
      token0: demoPool.token0,
      token1: demoPool.token1,
      tickLower: -887220,
      tickUpper: 887220,
      liquidity: BigInt('100000000000000000'), // 0.1 tokens
      feeGrowthInside0LastX128: BigInt(0),
      feeGrowthInside1LastX128: BigInt(0),
      tokensOwed0: BigInt('1000000000000000'), // 0.001 tokens in fees
      tokensOwed1: BigInt('2000000000000000'), // 0.002 tokens in fees
    };

    // Add demo positions for demo wallet
    this.mockPositions.set('demo', [demoPosition]);
  }

  /**
   * Get demo positions for a user
   */
  async getUserPositions(userAddress: Address): Promise<Position[]> {
    // Return demo positions for any address
    const positions = this.mockPositions.get('demo') || [];
    
    // Simulate dynamic fee growth
    const updatedPositions = positions.map(pos => ({
      ...pos,
      tokensOwed0: pos.tokensOwed0 + BigInt(Math.floor(Math.random() * 1000000000000)),
      tokensOwed1: pos.tokensOwed1 + BigInt(Math.floor(Math.random() * 1000000000000)),
    }));

    return updatedPositions;
  }

  /**
   * Get demo pool
   */
  async getPool(token0: Address, token1: Address): Promise<Pool | null> {
    const pool = this.mockPools.get('WSOMI-USDC');
    if (!pool) return null;

    // Simulate price movement
    const priceChange = 1 + (Math.random() - 0.5) * 0.02; // ±1% price change
    const newPrice = BigInt(Math.floor(Number(pool.price) * priceChange));
    
    // Simulate tick change
    const tickChange = Math.floor((Math.random() - 0.5) * 100);
    const newTick = pool.tick + tickChange;

    return {
      ...pool,
      price: newPrice,
      tick: newTick,
    };
  }

  /**
   * Simulate creating a position
   */
  async createPosition(params: any): Promise<{ success: boolean; tokenId: string; message: string }> {
    const newTokenId = BigInt(Date.now());
    
    const newPosition: Position = {
      tokenId: newTokenId,
      token0: params.token0,
      token1: params.token1,
      tickLower: params.tickLower,
      tickUpper: params.tickUpper,
      liquidity: BigInt(params.amount0Desired),
      feeGrowthInside0LastX128: BigInt(0),
      feeGrowthInside1LastX128: BigInt(0),
      tokensOwed0: BigInt(0),
      tokensOwed1: BigInt(0),
    };

    const currentPositions = this.mockPositions.get('demo') || [];
    currentPositions.push(newPosition);
    this.mockPositions.set('demo', currentPositions);

    return {
      success: true,
      tokenId: newTokenId.toString(),
      message: 'Demo position created successfully! (Testnet simulation)',
    };
  }

  /**
   * Simulate collecting fees
   */
  async collectFees(tokenId: bigint): Promise<{ amount0: string; amount1: string; message: string }> {
    const positions = this.mockPositions.get('demo') || [];
    const position = positions.find(p => p.tokenId === tokenId);
    
    if (!position) {
      return { amount0: '0', amount1: '0', message: 'Position not found' };
    }

    const amount0 = position.tokensOwed0.toString();
    const amount1 = position.tokensOwed1.toString();

    // Reset fees
    position.tokensOwed0 = BigInt(0);
    position.tokensOwed1 = BigInt(0);

    return {
      amount0,
      amount1,
      message: `Demo: Collected ${amount0} token0 and ${amount1} token1 in fees!`,
    };
  }

  /**
   * Generate demo analytics
   */
  generateAnalytics() {
    return {
      totalValueLocked: '$1,234,567',
      volume24h: '$456,789',
      feesEarned24h: '$1,234',
      numberOfPositions: 3,
      averageAPR: '45.67%',
      impermanentLoss: '-2.34%',
      message: 'Demo data - Mainnet coming soon!',
    };
  }

  /**
   * Simulate price history
   */
  getPriceHistory(days: number = 7): Array<{ timestamp: number; price: number }> {
    const history = [];
    const now = Date.now();
    const interval = (days * 24 * 60 * 60 * 1000) / 100; // 100 data points

    let price = 1.0;
    for (let i = 0; i < 100; i++) {
      // Random walk
      price *= 1 + (Math.random() - 0.5) * 0.02;
      history.push({
        timestamp: now - (100 - i) * interval,
        price: price,
      });
    }

    return history;
  }
}