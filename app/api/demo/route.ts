/**
 * Demo API Route for Hackathon
 * Provides simulated data when mainnet is not accessible
 */

import { NextRequest, NextResponse } from 'next/server';
import { DemoService } from '@/lib/services/demo.service';

const demoService = new DemoService();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    switch (action) {
      case 'positions': {
        const address = searchParams.get('address') || '0x0000000000000000000000000000000000000000';
        const positions = await demoService.getUserPositions(address as any);
        
        return NextResponse.json({
          success: true,
          demo: true,
          message: 'Using testnet demo data - QuickSwap mainnet integration ready',
          data: positions.map(p => ({
            ...p,
            tokenId: p.tokenId.toString(),
            liquidity: p.liquidity.toString(),
            tokensOwed0: p.tokensOwed0.toString(),
            tokensOwed1: p.tokensOwed1.toString(),
          }))
        });
      }

      case 'pool': {
        const pool = await demoService.getPool(
          '0x046EDe9564A72571df6F5e44d0405360c0f4dCab' as any,
          '0x28BEc7E30E6faee657a03e19Bf1128AaD7632A00' as any
        );
        
        return NextResponse.json({
          success: true,
          demo: true,
          data: pool ? {
            ...pool,
            price: pool.price.toString(),
            liquidity: pool.liquidity.toString(),
            priceImpact: (Math.random() * 0.5).toFixed(2) + '%',
            volume24h: '$' + (Math.random() * 1000000).toFixed(0),
          } : null
        });
      }

      case 'analytics': {
        return NextResponse.json({
          success: true,
          demo: true,
          data: demoService.generateAnalytics()
        });
      }

      case 'price-history': {
        const days = parseInt(searchParams.get('days') || '7');
        return NextResponse.json({
          success: true,
          demo: true,
          data: demoService.getPriceHistory(days)
        });
      }

      case 'ai-recommendation': {
        // Simulate AI recommendations
        return NextResponse.json({
          success: true,
          demo: true,
          data: {
            recommendation: 'REBALANCE',
            confidence: 85,
            reasoning: 'Position is 15% out of optimal range. Gas costs on Somnia are negligible ($0.001), making rebalancing profitable.',
            suggestedRange: {
              tickLower: -887220,
              tickUpper: 887220,
              expectedAPR: '45.2%',
            },
            risks: [
              'Moderate impermanent loss risk (2.3%)',
              'Price volatility in last 24h: 8.5%'
            ],
            potentialProfit: '$124.50',
            message: 'Demo AI analysis - Real analysis available on mainnet'
          }
        });
      }

      default:
        return NextResponse.json({
          success: true,
          demo: true,
          message: 'Somnia QuickSwap Demo Mode - Mainnet integration complete and ready',
          features: [
            '✅ Liquidity position management',
            '✅ AI-powered recommendations',
            '✅ Real-time WebSocket monitoring',
            '✅ Cross-exchange arbitrage detection',
            '✅ Automated rebalancing suggestions',
            '✅ Fee compounding optimization'
          ],
          status: 'Using demo data on testnet. Full functionality available when mainnet RPC is accessible.'
        });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      demo: true,
      error: 'Demo service error',
      message: 'This is a demo endpoint for hackathon presentation'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action } = body;

  try {
    switch (action) {
      case 'create-position': {
        const result = await demoService.createPosition(body.params);
        return NextResponse.json({
          success: true,
          demo: true,
          data: result,
          message: 'Demo position created! In production, this would create a real position on QuickSwap.'
        });
      }

      case 'collect-fees': {
        const result = await demoService.collectFees(BigInt(body.tokenId));
        return NextResponse.json({
          success: true,
          demo: true,
          data: result,
          message: 'Demo fees collected! Real fee collection available on mainnet.'
        });
      }

      case 'rebalance': {
        return NextResponse.json({
          success: true,
          demo: true,
          data: {
            oldPosition: { tokenId: body.tokenId, status: 'closed' },
            newPosition: { tokenId: Date.now().toString(), status: 'created' },
            gasUsed: '0.001 SOMI',
            message: 'Demo rebalance successful! Position optimized for current price range.'
          }
        });
      }

      default:
        return NextResponse.json({
          success: false,
          demo: true,
          error: 'Unknown action'
        }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      demo: true,
      error: 'Demo service error'
    }, { status: 500 });
  }
}