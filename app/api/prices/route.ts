/**
 * API Route: /api/prices
 * Get price data from CEXs for comparison with DEX
 */

import { NextRequest, NextResponse } from 'next/server';
import { PriceService } from '@/lib/services/price.service';

// Create singleton instance
let priceService: PriceService | null = null;

function getPriceService() {
  if (!priceService) {
    priceService = new PriceService();
  }
  return priceService;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const exchange = searchParams.get('exchange');
    const aggregated = searchParams.get('aggregated') === 'true';

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol parameter is required' },
        { status: 400 }
      );
    }

    const service = getPriceService();

    // Get aggregated prices from multiple exchanges
    if (aggregated || !exchange) {
      const data = await service.getAggregatedPrice(symbol);
      
      if (!data) {
        return NextResponse.json(
          { error: 'Failed to fetch price data' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data
      });
    }

    // Get price from specific exchange
    const data = await service.getPriceFromExchange(exchange, symbol);
    
    if (!data) {
      return NextResponse.json(
        { error: `Failed to fetch price from ${exchange}` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error in /api/prices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch price data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symbol, dexPrice, minProfitPercent = 0.5 } = body;

    if (!symbol || dexPrice === undefined) {
      return NextResponse.json(
        { error: 'Symbol and dexPrice are required' },
        { status: 400 }
      );
    }

    const service = getPriceService();

    // Find arbitrage opportunities
    const opportunity = await service.findArbitrageOpportunity(
      Number(dexPrice),
      symbol,
      minProfitPercent
    );

    // Get market conditions
    const marketConditions = await service.getMarketConditions(symbol);

    return NextResponse.json({
      success: true,
      data: {
        arbitrage: opportunity,
        marketConditions
      }
    });
  } catch (error) {
    console.error('Error in /api/prices POST:', error);
    return NextResponse.json(
      { error: 'Failed to analyze arbitrage opportunity' },
      { status: 500 }
    );
  }
}