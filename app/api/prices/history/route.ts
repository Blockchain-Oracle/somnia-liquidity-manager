/**
 * API Route: /api/prices/history
 * Get historical price data and volatility metrics
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
    const timeframe = searchParams.get('timeframe') as '1m' | '5m' | '15m' | '1h' | '4h' | '1d' || '1h';
    const limit = parseInt(searchParams.get('limit') || '100');
    const exchange = searchParams.get('exchange') || 'binance';
    const includeVolatility = searchParams.get('volatility') === 'true';

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol parameter is required' },
        { status: 400 }
      );
    }

    const service = getPriceService();

    // Get historical data
    const historicalData = await service.getHistoricalData(
      symbol,
      timeframe,
      limit,
      exchange
    );

    if (historicalData.length === 0) {
      return NextResponse.json(
        { error: 'No historical data available' },
        { status: 404 }
      );
    }

    let responseData: any = {
      success: true,
      data: {
        symbol,
        timeframe,
        exchange,
        candles: historicalData,
        count: historicalData.length,
      }
    };

    // Add volatility if requested
    if (includeVolatility) {
      const volatility = await service.calculateVolatility(symbol, 24, exchange);
      responseData.data.volatility = {
        value: volatility,
        level: volatility < 20 ? 'low' : volatility < 50 ? 'medium' : 'high',
        period: '24h'
      };
    }

    // Calculate summary statistics
    const prices = historicalData.map(d => d.close);
    const volumes = historicalData.map(d => d.volume);
    
    responseData.data.summary = {
      high: Math.max(...historicalData.map(d => d.high)),
      low: Math.min(...historicalData.map(d => d.low)),
      open: historicalData[0]?.open,
      close: historicalData[historicalData.length - 1]?.close,
      averagePrice: prices.reduce((a, b) => a + b, 0) / prices.length,
      totalVolume: volumes.reduce((a, b) => a + b, 0),
      priceChange: historicalData.length > 1 
        ? ((historicalData[historicalData.length - 1].close - historicalData[0].open) / historicalData[0].open) * 100
        : 0,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error in /api/prices/history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch historical data' },
      { status: 500 }
    );
  }
}