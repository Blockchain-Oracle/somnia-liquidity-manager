/**
 * API Route: /api/pools
 * Get pool information and create new pools
 */

import { NextRequest, NextResponse } from 'next/server';
import { QuickSwapService } from '@/lib/services/quickswap.service';
import type { Address } from 'viem';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token0 = searchParams.get('token0') as Address | null;
    const token1 = searchParams.get('token1') as Address | null;
    const network = (searchParams.get('network') || 'testnet') as 'testnet' | 'mainnet';

    if (!token0 || !token1) {
      return NextResponse.json(
        { error: 'token0 and token1 parameters are required' },
        { status: 400 }
      );
    }

    const quickswap = new QuickSwapService(network);
    const pool = await quickswap.getPool(token0, token1);

    if (!pool) {
      return NextResponse.json(
        { error: 'Pool not found' },
        { status: 404 }
      );
    }

    // Calculate additional pool metrics
    const priceToken0 = Number(pool.price) / (2 ** 96); // Convert from Q96 format
    const priceToken1 = 1 / priceToken0;

    return NextResponse.json({
      success: true,
      data: {
        ...pool,
        priceToken0,
        priceToken1,
        tvl: 0, // Would need to calculate based on liquidity and prices
        volume24h: 0, // Would need historical data
        fees24h: 0, // Would need historical data
      }
    });
  } catch (error) {
    console.error('Error in /api/pools:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pool data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token0, token1, network = 'testnet' } = body;

    if (!token0 || !token1) {
      return NextResponse.json(
        { error: 'token0 and token1 are required' },
        { status: 400 }
      );
    }

    // Note: Creating pools typically requires special permissions
    // This is a placeholder for the actual implementation
    return NextResponse.json({
      success: false,
      error: 'Pool creation not yet implemented'
    }, { status: 501 });
  } catch (error) {
    console.error('Error creating pool:', error);
    return NextResponse.json(
      { error: 'Failed to create pool' },
      { status: 500 }
    );
  }
}