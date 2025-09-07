/**
 * API Route: /api/manage
 * Comprehensive position management endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { PositionManagerService } from '@/lib/services/position-manager.service';
import type { Address } from 'viem';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      action,
      userAddress,
      tokenId,
      position,
      strategy = 'balanced',
      network = 'testnet',
      privateKey,
      openaiKey,
      includeMarketData = true,
      autoExecute = false,
    } = body;

    // Initialize position manager
    const manager = new PositionManagerService(
      network,
      privateKey,
      openaiKey
    );

    // Set strategy if provided
    if (strategy) {
      manager.setStrategy(strategy);
    }

    switch (action) {
      case 'analyze_all': {
        if (!userAddress) {
          return NextResponse.json(
            { error: 'userAddress required for analyze_all' },
            { status: 400 }
          );
        }

        const reports = await manager.analyzeAllPositions(userAddress as Address);
        
        return NextResponse.json({
          success: true,
          data: {
            count: reports.length,
            reports: reports.map(formatReport),
            summary: generateSummary(reports),
          }
        });
      }

      case 'analyze_position': {
        if (!position && !tokenId) {
          return NextResponse.json(
            { error: 'position or tokenId required' },
            { status: 400 }
          );
        }

        // Get position data if needed
        let positionData = position;
        if (!positionData && tokenId) {
          const quickswap = new (await import('@/lib/services/quickswap.service')).QuickSwapService(network);
          positionData = await quickswap.getPosition(BigInt(tokenId));
        }

        if (!positionData) {
          return NextResponse.json(
            { error: 'Position not found' },
            { status: 404 }
          );
        }

        const report = await manager.analyzePosition(positionData, includeMarketData);
        
        if (!report) {
          return NextResponse.json(
            { error: 'Failed to analyze position' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          data: formatReport(report)
        });
      }

      case 'execute': {
        if (!privateKey) {
          return NextResponse.json(
            { error: 'privateKey required for execution' },
            { status: 400 }
          );
        }

        const { actionToExecute, position: positionForAction } = body;
        
        if (!actionToExecute || !positionForAction) {
          return NextResponse.json(
            { error: 'actionToExecute and position required' },
            { status: 400 }
          );
        }

        const result = await manager.executeAction(
          actionToExecute,
          positionForAction,
          autoExecute
        );

        return NextResponse.json({
          success: result.success,
          data: result
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: analyze_all, analyze_position, or execute' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in /api/manage:', error);
    return NextResponse.json(
      { error: 'Failed to process management request' },
      { status: 500 }
    );
  } finally {
    // Clean up any resources
    // Note: In production, you'd want to keep services alive between requests
  }
}

/**
 * Format report for API response
 */
function formatReport(report: any) {
  return {
    position: {
      tokenId: report.position.tokenId?.toString(),
      token0: report.position.token0,
      token1: report.position.token1,
      tickLower: report.position.tickLower,
      tickUpper: report.position.tickUpper,
      liquidity: report.position.liquidity?.toString(),
      tokensOwed0: report.position.tokensOwed0?.toString(),
      tokensOwed1: report.position.tokensOwed1?.toString(),
    },
    pool: {
      address: report.pool.address,
      tick: report.pool.tick,
      price: report.pool.price?.toString(),
      liquidity: report.pool.liquidity?.toString(),
      fee: report.pool.fee,
      tickSpacing: report.pool.tickSpacing,
    },
    analysis: report.analysis,
    recommendations: report.recommendations,
    suggestedActions: report.suggestedActions,
    marketConditions: report.marketConditions,
    arbitrageOpportunities: report.arbitrageOpportunities,
  };
}

/**
 * Generate summary of all positions
 */
function generateSummary(reports: any[]) {
  const totalPositions = reports.length;
  const inRangeCount = reports.filter(r => r.analysis.inRange).length;
  const avgHealthScore = reports.reduce((sum, r) => sum + r.analysis.healthScore, 0) / totalPositions;
  const totalFeesEarned = reports.reduce((sum, r) => sum + parseFloat(r.analysis.feesEarned || '0'), 0);
  const avgImpermanentLoss = reports.reduce((sum, r) => sum + r.analysis.impermanentLoss, 0) / totalPositions;
  
  const actionCounts = reports.reduce((acc, r) => {
    r.suggestedActions.forEach((action: any) => {
      acc[action.type] = (acc[action.type] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  return {
    totalPositions,
    inRangeCount,
    outOfRangeCount: totalPositions - inRangeCount,
    averageHealthScore: avgHealthScore.toFixed(1),
    totalFeesEarned: totalFeesEarned.toFixed(6),
    averageImpermanentLoss: avgImpermanentLoss.toFixed(2) + '%',
    suggestedActionsSummary: actionCounts,
    topPriority: reports
      .flatMap(r => r.suggestedActions)
      .find((a: any) => a.priority === 'high'),
  };
}