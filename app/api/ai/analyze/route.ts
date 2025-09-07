/**
 * API Route: /api/ai/analyze
 * AI-powered position analysis and recommendations
 */

import { NextRequest, NextResponse } from 'next/server';
import { AIService } from '@/lib/services/ai.service';
import { QuickSwapService } from '@/lib/services/quickswap.service';
import type { Address } from 'viem';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tokenId,
      position,
      poolAddress,
      token0,
      token1,
      marketData,
      network = 'testnet',
      openaiKey
    } = body;

    // Initialize services
    const quickswap = new QuickSwapService(network);
    const ai = new AIService(openaiKey);

    // Get position if only tokenId provided
    let positionData = position;
    if (tokenId && !position) {
      positionData = await quickswap.getPosition(BigInt(tokenId));
      if (!positionData) {
        return NextResponse.json(
          { error: 'Position not found' },
          { status: 404 }
        );
      }
    }

    if (!positionData) {
      return NextResponse.json(
        { error: 'Position data or tokenId required' },
        { status: 400 }
      );
    }

    // Get pool data
    let poolData;
    if (poolAddress) {
      // If pool address provided, fetch directly
      // This would require adding a getPoolByAddress method
      poolData = await quickswap.getPool(
        token0 || positionData.token0,
        token1 || positionData.token1
      );
    } else if (token0 && token1) {
      poolData = await quickswap.getPool(token0 as Address, token1 as Address);
    } else if (positionData.token0 && positionData.token1) {
      poolData = await quickswap.getPool(
        positionData.token0,
        positionData.token1
      );
    }

    if (!poolData) {
      return NextResponse.json(
        { error: 'Pool not found' },
        { status: 404 }
      );
    }

    // Analyze position
    const analysis = await ai.analyzePosition(
      positionData,
      poolData,
      marketData
    );

    // Get optimal range suggestion
    const optimalRange = await ai.getOptimalRange(poolData);

    return NextResponse.json({
      success: true,
      data: {
        analysis,
        optimalRange,
        position: {
          ...positionData,
          tokenId: positionData.tokenId?.toString(),
          liquidity: positionData.liquidity.toString(),
          tokensOwed0: positionData.tokensOwed0.toString(),
          tokensOwed1: positionData.tokensOwed1.toString(),
        },
        pool: {
          ...poolData,
          price: poolData.price.toString(),
          liquidity: poolData.liquidity.toString(),
        }
      }
    });
  } catch (error) {
    console.error('Error in /api/ai/analyze:', error);
    return NextResponse.json(
      { error: 'Failed to analyze position' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token0 = searchParams.get('token0') as Address | null;
    const token1 = searchParams.get('token1') as Address | null;
    const network = (searchParams.get('network') || 'testnet') as 'testnet' | 'mainnet';
    const timeframe = (searchParams.get('timeframe') || '24h') as '1h' | '24h' | '7d';

    if (!token0 || !token1) {
      return NextResponse.json(
        { error: 'token0 and token1 parameters required' },
        { status: 400 }
      );
    }

    // Initialize services
    const quickswap = new QuickSwapService(network);
    const ai = new AIService();

    // Get pool
    const pool = await quickswap.getPool(token0, token1);
    if (!pool) {
      return NextResponse.json(
        { error: 'Pool not found' },
        { status: 404 }
      );
    }

    // Get optimal range
    const optimalRange = await ai.getOptimalRange(pool, timeframe);

    return NextResponse.json({
      success: true,
      data: {
        optimalRange,
        pool: {
          address: pool.address,
          currentTick: pool.tick,
          tickSpacing: pool.tickSpacing,
        },
        timeframe
      }
    });
  } catch (error) {
    console.error('Error in /api/ai/analyze GET:', error);
    return NextResponse.json(
      { error: 'Failed to get optimal range' },
      { status: 500 }
    );
  }
}