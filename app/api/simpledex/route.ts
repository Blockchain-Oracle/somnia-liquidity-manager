/**
 * SimpleDEX API Route
 * Provides endpoints for interacting with our deployed SimpleDEX
 */

import { NextRequest, NextResponse } from 'next/server';
import { SimpleDEXService } from '@/lib/services/simpledex.service';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  
  // Create service instance at runtime
  const simpleDEXService = new SimpleDEXService();

  try {
    switch (action) {
      case 'pool': {
        try {
          const pool = await simpleDEXService.getPool();
          if (!pool) {
            return NextResponse.json({
              success: false,
              error: 'SimpleDEX pool not available or not deployed on testnet',
              message: 'The SimpleDEX pool is not currently available. This feature is for testnet only.'
            }, { status: 503 }); // Service Unavailable
          }
          
          return NextResponse.json({
            success: true,
            data: {
              address: pool.address,
              token0: pool.token0,
              token1: pool.token1,
              reserve0: pool.reserve0.toString(),
              reserve1: pool.reserve1.toString(),
              totalSupply: pool.totalSupply.toString(),
              price: pool.price,
              tvl: {
                wsomi: Number(pool.reserve0) / 1e18,
                usdc: Number(pool.reserve1) / 1e6,
                usd: (Number(pool.reserve0) / 1e18 * pool.price) + (Number(pool.reserve1) / 1e6)
              }
            }
          });
        } catch (poolError: any) {
          console.error('SimpleDEX pool fetch error:', poolError);
          return NextResponse.json({
            success: false,
            error: 'Failed to fetch SimpleDEX pool data',
            details: poolError.message || 'Unknown error occurred',
            message: 'SimpleDEX is a testnet-only feature. Pool may not be deployed or accessible.'
          }, { status: 503 });
        }
      }

      case 'position': {
        const address = searchParams.get('address');
        if (!address) {
          return NextResponse.json({
            success: false,
            error: 'Address parameter required'
          }, { status: 400 });
        }

        const position = await simpleDEXService.getUserPosition(address as any);
        if (!position) {
          return NextResponse.json({
            success: true,
            data: null,
            message: 'No position found'
          });
        }

        return NextResponse.json({
          success: true,
          data: {
            poolAddress: position.poolAddress,
            liquidity: position.liquidity.toString(),
            share: position.share.toFixed(2) + '%',
            value0: position.value0.toString(),
            value1: position.value1.toString(),
            valueUSD: (Number(position.value0) / 1e18 + Number(position.value1) / 1e6).toFixed(2)
          }
        });
      }

      case 'quote': {
        const amountIn = searchParams.get('amount');
        const zeroForOne = searchParams.get('zeroForOne') === 'true';
        
        if (!amountIn) {
          return NextResponse.json({
            success: false,
            error: 'Amount parameter required'
          }, { status: 400 });
        }

        const amountOut = await simpleDEXService.getQuote(amountIn, zeroForOne);
        if (!amountOut) {
          return NextResponse.json({
            success: false,
            error: 'Failed to get quote'
          }, { status: 500 });
        }

        const pool = await simpleDEXService.getPool();
        const priceImpact = pool ? calculatePriceImpact(amountIn, amountOut, pool, zeroForOne) : 0;

        return NextResponse.json({
          success: true,
          data: {
            amountIn,
            amountOut,
            zeroForOne,
            priceImpact: priceImpact.toFixed(2) + '%',
            rate: zeroForOne 
              ? (Number(amountOut) / Number(amountIn)).toFixed(4)
              : (Number(amountOut) / Number(amountIn)).toFixed(4)
          }
        });
      }

      default:
        return NextResponse.json({
          success: true,
          message: 'SimpleDEX API - Somnia Testnet',
          endpoints: [
            'GET /api/simpledex?action=pool - Get pool info',
            'GET /api/simpledex?action=position&address=0x... - Get user position',
            'GET /api/simpledex?action=quote&amount=100&zeroForOne=true - Get swap quote',
            'POST /api/simpledex - Execute transactions'
          ]
        });
    }
  } catch (error) {
    console.error('SimpleDEX API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Create service instance at runtime
  const simpleDEXService = new SimpleDEXService();
  const body = await request.json();
  const { action } = body;

  try {
    switch (action) {
      case 'add-liquidity': {
        const { amount0, amount1 } = body;
        if (!amount0 || !amount1) {
          return NextResponse.json({
            success: false,
            error: 'amount0 and amount1 required'
          }, { status: 400 });
        }

        const hash = await simpleDEXService.addLiquidity(amount0, amount1);
        if (!hash) {
          return NextResponse.json({
            success: false,
            error: 'Failed to add liquidity. Check wallet configuration.'
          }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          data: {
            transactionHash: hash,
            message: `Added ${amount0} WSOMI and ${amount1} USDC to pool`
          }
        });
      }

      case 'remove-liquidity': {
        const { liquidity } = body;
        if (!liquidity) {
          return NextResponse.json({
            success: false,
            error: 'liquidity amount required'
          }, { status: 400 });
        }

        const hash = await simpleDEXService.removeLiquidity(liquidity);
        if (!hash) {
          return NextResponse.json({
            success: false,
            error: 'Failed to remove liquidity'
          }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          data: {
            transactionHash: hash,
            message: `Removed ${liquidity} liquidity tokens`
          }
        });
      }

      case 'swap': {
        const { amountIn, zeroForOne } = body;
        if (!amountIn) {
          return NextResponse.json({
            success: false,
            error: 'amountIn required'
          }, { status: 400 });
        }

        const hash = await simpleDEXService.swap(amountIn, zeroForOne);
        if (!hash) {
          return NextResponse.json({
            success: false,
            error: 'Failed to execute swap'
          }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          data: {
            transactionHash: hash,
            message: `Swapped ${amountIn} ${zeroForOne ? 'WSOMI' : 'USDC'}`
          }
        });
      }

      case 'faucet': {
        const { address } = body;
        if (!address) {
          return NextResponse.json({
            success: false,
            error: 'address required'
          }, { status: 400 });
        }

        const result = await simpleDEXService.getFaucetTokens(address);
        return NextResponse.json({
          success: true,
          data: {
            wsomiTx: result.wsomi,
            usdcTx: result.usdc,
            message: 'Claimed 1000 WSOMI and 1000 USDC from faucet'
          }
        });
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'Unknown action'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('SimpleDEX POST error:', error);
    return NextResponse.json({
      success: false,
      error: 'Transaction failed'
    }, { status: 500 });
  }
}

// Helper function to calculate price impact
function calculatePriceImpact(
  amountIn: string, 
  amountOut: string, 
  pool: any, 
  zeroForOne: boolean
): number {
  const amountInNum = Number(amountIn);
  const amountOutNum = Number(amountOut);
  
  if (zeroForOne) {
    const currentPrice = Number(pool.reserve1) / Number(pool.reserve0);
    const newReserve0 = Number(pool.reserve0) + amountInNum * 1e18;
    const newReserve1 = Number(pool.reserve1) - amountOutNum * 1e6;
    const newPrice = newReserve1 / newReserve0;
    return Math.abs((newPrice - currentPrice) / currentPrice * 100);
  } else {
    const currentPrice = Number(pool.reserve0) / Number(pool.reserve1);
    const newReserve1 = Number(pool.reserve1) + amountInNum * 1e6;
    const newReserve0 = Number(pool.reserve0) - amountOutNum * 1e18;
    const newPrice = newReserve0 / newReserve1;
    return Math.abs((newPrice - currentPrice) / currentPrice * 100);
  }
}