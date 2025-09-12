/**
 * QuickSwap V4 API endpoint for testing
 */

import { NextRequest, NextResponse } from 'next/server';
import { quickswapV4Service } from '@/lib/services/quickswapV4Service';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token0 = searchParams.get('token0') || 'ETH';
  const token1 = searchParams.get('token1') || 'USDC';

  try {
    console.log(`[API] Fetching QuickSwap V4 pool data for ${token0}/${token1}`);
    
    // Get pool data
    const poolData = await quickswapV4Service.getPoolData(token0, token1);
    
    if (!poolData) {
      // Try reverse pair
      const reversePoolData = await quickswapV4Service.getPoolData(token1, token0);
      if (reversePoolData) {
        return NextResponse.json({
          success: true,
          pair: `${token1}/${token0}`,
          data: reversePoolData,
          message: 'Found pool with reversed pair'
        });
      }
      
      return NextResponse.json({
        success: false,
        error: `No pool found for ${token0}/${token1}`,
        availablePools: await quickswapV4Service.getAvailablePools()
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      pair: `${token0}/${token1}`,
      data: {
        address: poolData.address,
        liquidity: poolData.liquidity,
        tvlUSD: poolData.tvlUSD,
        token0Reserve: poolData.token0Reserve,
        token1Reserve: poolData.token1Reserve,
        fee: poolData.fee,
        tick: poolData.tick
      }
    });
  } catch (error: any) {
    console.error('[API] Error fetching QuickSwap data:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch pool data'
    }, { status: 500 });
  }
}