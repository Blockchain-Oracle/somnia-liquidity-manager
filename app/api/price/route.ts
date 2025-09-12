/**
 * Price API endpoint
 * Proxies price requests to avoid CORS issues
 */

import { NextRequest, NextResponse } from 'next/server';

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

// Simple in-memory cache to avoid rate limits
const priceCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 180000; // 3 minutes

// Map common symbols to CoinGecko IDs - Only tokens available on Somnia
const TOKEN_MAP: Record<string, string> = {
  'WETH': 'ethereum',
  'USDC': 'usd-coin',
  'USDT': 'tether',
  'SOMI': 'somnia',
  'WSOMI': 'somnia',
};

// Binance symbol mapping - Only tokens available on Somnia
const BINANCE_SYMBOLS: Record<string, string> = {
  'WETH': 'ETHUSDT',
  // Note: SOMI is not on Binance
};

async function fetchFromBinance(token: string) {
  const symbol = BINANCE_SYMBOLS[token.toUpperCase()];
  if (!symbol) return null;

  try {
    const [tickerResponse, statsResponse] = await Promise.all([
      fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`, {
        signal: AbortSignal.timeout(5000) // 5 second timeout
      }),
      fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`, {
        signal: AbortSignal.timeout(5000) // 5 second timeout
      })
    ]);

    if (!tickerResponse.ok || !statsResponse.ok) {
      return null;
    }

    const ticker = await tickerResponse.json();
    const stats = await statsResponse.json();

    return {
      price: parseFloat(ticker.price),
      change24h: parseFloat(stats.priceChangePercent),
      volume24h: parseFloat(stats.volume) * parseFloat(ticker.price),
      high24h: parseFloat(stats.highPrice),
      low24h: parseFloat(stats.lowPrice),
    };
  } catch (error) {
    console.error(`[Price API] Binance error:`, error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  
  if (!token) {
    return NextResponse.json({ error: 'Token parameter required' }, { status: 400 });
  }

  // Check cache first
  const cacheKey = token.toUpperCase();
  const cached = priceCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`[Price API] Returning cached price for ${token}`);
    return NextResponse.json(cached.data);
  }

  // For stablecoins, return fixed price
  if (['USDC', 'USDT'].includes(token.toUpperCase())) {
    const stableData = {
      success: true,
      token,
      price: 1,
      change24h: 0,
      volume24h: 1000000000, // $1B placeholder
      marketCap: 50000000000, // $50B placeholder
    };
    priceCache.set(cacheKey, { data: stableData, timestamp: Date.now() });
    return NextResponse.json(stableData);
  }

  try {
    // Try Binance first (no rate limits)
    const binanceData = await fetchFromBinance(token);
    if (binanceData) {
      console.log(`[Price API] Got price from Binance for ${token}`);
      const responseData = {
        success: true,
        token,
        price: binanceData.price,
        change24h: binanceData.change24h,
        volume24h: binanceData.volume24h,
        marketCap: 0, // Binance doesn't provide market cap
        source: 'binance'
      };
      priceCache.set(cacheKey, { data: responseData, timestamp: Date.now() });
      return NextResponse.json(responseData);
    }

    // Fallback to CoinGecko
    const tokenId = TOKEN_MAP[token.toUpperCase()] || token.toLowerCase();
    const url = `${COINGECKO_API}/simple/price?ids=${tokenId}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`;
    
    console.log(`[Price API] Fetching price for ${token} (${tokenId}) from CoinGecko`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`[Price API] CoinGecko returned status ${response.status}`);
      if (response.status === 429) {
        // Rate limited - fallback to DIA Oracle on Somnia
        console.log(`[Price API] Rate limited, fetching from DIA Oracle for ${token}`);
        
        try {
          // Import the DIA Oracle service
          const { diaOracleService } = await import('@/lib/services/diaOracle.service');
          const diaPrice = await diaOracleService.getPrice(token);
          
          if (diaPrice && diaPrice.value > 0) {
            console.log(`[Price API] Got price from DIA Oracle: $${diaPrice.value}`);
            const diaData = {
              success: true,
              token,
              price: diaPrice.value,
              change24h: 0, // DIA doesn't provide 24h change
              volume24h: 0,
              marketCap: 0,
              source: 'dia-oracle',
              timestamp: diaPrice.timestamp
            };
            priceCache.set(cacheKey, { data: diaData, timestamp: Date.now() });
            return NextResponse.json(diaData);
          }
        } catch (error) {
          console.error(`[Price API] DIA Oracle error:`, error);
        }
      }
      throw new Error(`CoinGecko API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data[tokenId]) {
      console.log(`[Price API] No data for ${tokenId}`);
      return NextResponse.json({
        success: false,
        error: `No price data for ${token}`
      }, { status: 404 });
    }
    
    const priceData = data[tokenId];
    
    const responseData = {
      success: true,
      token,
      price: priceData.usd || 0,
      change24h: priceData.usd_24h_change || 0,
      volume24h: priceData.usd_24h_vol || 0,
      marketCap: priceData.usd_market_cap || 0,
      source: 'coingecko'
    };
    priceCache.set(cacheKey, { data: responseData, timestamp: Date.now() });
    return NextResponse.json(responseData);
    
  } catch (error: any) {
    console.error('[Price API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch price'
    }, { status: 500 });
  }
}

// Also support fetching historical OHLC data
export async function POST(request: NextRequest) {
  const { token, days = 7 } = await request.json();
  
  if (!token) {
    return NextResponse.json({ error: 'Token parameter required' }, { status: 400 });
  }

  try {
    const tokenId = TOKEN_MAP[token.toUpperCase()] || token.toLowerCase();
    
    // Fetch OHLC from CoinGecko
    const url = `${COINGECKO_API}/coins/${tokenId}/ohlc?vs_currency=usd&days=${days}`;
    
    console.log(`[Price API] Fetching OHLC for ${token} (${tokenId}), ${days} days`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Transform to our format
    const ohlc = data.map((item: number[]) => ({
      time: Math.floor(item[0] / 1000), // Convert ms to seconds
      open: item[1],
      high: item[2],
      low: item[3],
      close: item[4],
    }));
    
    return NextResponse.json({
      success: true,
      token,
      days,
      data: ohlc
    });
    
  } catch (error: any) {
    console.error('[Price API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch OHLC data'
    }, { status: 500 });
  }
}