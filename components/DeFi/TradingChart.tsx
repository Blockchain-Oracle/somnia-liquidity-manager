'use client'

import React, { useEffect, useRef, useState } from 'react'
import { 
  createChart, 
  IChartApi, 
  ISeriesApi, 
  ColorType, 
  CrosshairMode,
  Time,
  CandlestickSeries,
  LineSeries,
  AreaSeries
} from 'lightweight-charts'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Activity, TrendingUp, TrendingDown, Loader2 } from 'lucide-react'
import { priceService, OHLCData, CurrentPrice } from '@/lib/services/priceService'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { TokenInfo } from '@/lib/constants/tokenImages'

interface TradingChartProps {
  token0?: TokenInfo;
  token1?: TokenInfo;
  height?: number;
  className?: string;
}

const timeframes = [
  { label: '1m', value: '1m' as const },
  { label: '5m', value: '5m' as const },
  { label: '15m', value: '15m' as const },
  { label: '1H', value: '1h' as const },
  { label: '4H', value: '4h' as const },
  { label: '1D', value: '1d' as const },
];

const chartTypes = [
  { label: 'Candles', value: 'candles' as const },
  { label: 'Line', value: 'line' as const },
  { label: 'Area', value: 'area' as const },
];

export function TradingChart({ 
  token0, 
  token1, 
  height = 400,
  className = '' 
}: TradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Candlestick' | 'Line' | 'Area'> | null>(null)
  const [chartReady, setChartReady] = useState(false)
  
  const [timeframe, setTimeframe] = useState<'1m' | '5m' | '15m' | '1h' | '4h' | '1d'>('1h')
  const [chartType, setChartType] = useState<'candles' | 'line' | 'area'>('candles')
  const [isLoading, setIsLoading] = useState(false)
  const [priceData, setPriceData] = useState<CurrentPrice | null>(null)
  const [currentPrice, setCurrentPrice] = useState<number>(0)
  const [ohlcData, setOhlcData] = useState<OHLCData[]>([])

  // Get trading pair display
  const tradingPair = token0 && token1 
    ? `${token0.symbol}/${token1.symbol}`
    : 'Select tokens';

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: height,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#9CA3AF',
      },
      grid: {
        vertLines: { color: 'rgba(42, 46, 57, 0.5)' },
        horzLines: { color: 'rgba(42, 46, 57, 0.5)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: '#758696',
          width: 1,
          style: 2,
          visible: true,
        },
        horzLine: {
          color: '#758696',
          width: 1,
          style: 2,
          visible: true,
        },
      },
      rightPriceScale: {
        borderColor: 'rgba(42, 46, 57, 0.5)',
        visible: true,
      },
      timeScale: {
        borderColor: 'rgba(42, 46, 57, 0.5)',
        timeVisible: true,
        secondsVisible: false,
      },
    })

    chartRef.current = chart
    setChartReady(true)

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ 
          width: chartContainerRef.current.clientWidth 
        })
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      setChartReady(false)
      chart.remove()
    }
  }, [height])

  // Load data when tokens or timeframe changes
  useEffect(() => {
    if (!token0 || !chartRef.current || !chartReady) return

    loadChartData()
  }, [token0, token1, timeframe, chartType, chartReady])

  // Subscribe to real-time updates
  useEffect(() => {
    if (!token0) return

    const unsubscribe = priceService.subscribeToPriceUpdates(
      token0.symbol,
      (priceData) => {
        setCurrentPrice(priceData.price)
        setPriceData(priceData)
        
        // Update the last candle with new price
        if (seriesRef.current && ohlcData.length > 0) {
          const lastCandle = ohlcData[ohlcData.length - 1]
          const now = Math.floor(Date.now() / 1000)
          
          if (chartType === 'candles') {
            try {
              seriesRef.current.update({
                time: now as Time,
                open: lastCandle.close,
                high: Math.max(lastCandle.high, priceData.price),
                low: Math.min(lastCandle.low, priceData.price),
                close: priceData.price,
              })
            } catch (e) {
              // Ignore update errors
            }
          } else if (chartType === 'line' || chartType === 'area') {
            try {
              seriesRef.current.update({
                time: now as Time,
                value: priceData.price,
              })
            } catch (e) {
              // Ignore update errors
            }
          }
        }
      },
      5000 // Update every 5 seconds
    )

    return unsubscribe
  }, [token0, chartType, ohlcData])

  const loadChartData = async () => {
    console.log('[TradingChart] loadChartData called', {
      token0: token0?.symbol,
      chartRef: !!chartRef.current,
      chartReady,
      timeframe,
      chartType
    });
    
    if (!token0 || !chartRef.current || !chartReady) {
      console.log('[TradingChart] Chart not ready yet', { 
        token0: !!token0, 
        chart: !!chartRef.current, 
        ready: chartReady 
      });
      return;
    }

    setIsLoading(true);
    try {
      // Determine days based on timeframe
      const daysMap: Record<string, number> = {
        '1m': 1,
        '5m': 1,
        '15m': 1,
        '1h': 7,
        '4h': 30,
        '1d': 90,
      };
      
      const days = daysMap[timeframe] || 7;
      console.log(`[TradingChart] Fetching data for ${token0.symbol}, days: ${days}`);
      
      // Fetch OHLC data from CoinGecko or generate realistic data
      const fetchedOhlcData = await priceService.getOHLCData(token0.symbol, days);
      console.log(`[TradingChart] Received ${fetchedOhlcData.length} OHLC candles`);
      console.log('[TradingChart] First candle:', fetchedOhlcData[0]);
      console.log('[TradingChart] Last candle:', fetchedOhlcData[fetchedOhlcData.length - 1]);
      setOhlcData(fetchedOhlcData);
      
      // Fetch current price data
      const currentPriceData = await priceService.getCurrentPrice(token0.symbol);
      console.log('[TradingChart] Current price data:', currentPriceData);
      setPriceData(currentPriceData);
      if (currentPriceData) {
        setCurrentPrice(currentPriceData.price);
        console.log(`[TradingChart] Set current price to: ${currentPriceData.price}`);
      } else {
        console.warn('[TradingChart] No current price data received!');
      }

      // Clear existing series
      if (seriesRef.current && chartRef.current) {
        try {
          console.log('[TradingChart] Removing existing series');
          chartRef.current.removeSeries(seriesRef.current);
        } catch (e) {
          console.log('[TradingChart] Series already removed or error:', e);
        }
        seriesRef.current = null;
      }

      // Double-check chart is available
      if (!chartRef.current) {
        console.error('[TradingChart] Chart not available after data fetch!');
        return;
      }


      // Create new series based on chart type - using correct v5 API
      console.log(`[TradingChart] Creating ${chartType} series`);
      try {
        if (chartType === 'candles') {
          console.log('[TradingChart] Adding CandlestickSeries to chart');
          const candlestickSeries = chartRef.current.addSeries(CandlestickSeries, {
          upColor: '#22c55e',
          downColor: '#ef4444',
          borderUpColor: '#22c55e',
          borderDownColor: '#ef4444',
          wickUpColor: '#22c55e',
          wickDownColor: '#ef4444',
        })
        
        const formattedData = fetchedOhlcData.map(d => ({
          time: d.time as Time,
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
        }));
        
        console.log(`[TradingChart] Setting ${formattedData.length} candles to series`);
        console.log('[TradingChart] Sample formatted candle:', formattedData[0]);
        
        candlestickSeries.setData(formattedData);
        seriesRef.current = candlestickSeries as any;
        console.log('[TradingChart] Candlestick series created successfully');
      } else if (chartType === 'line') {
        console.log('[TradingChart] Adding LineSeries to chart');
        const lineSeries = chartRef.current.addSeries(LineSeries, {
          color: '#3b82f6',
          lineWidth: 2,
        })
        
        const formattedData = fetchedOhlcData.map(d => ({
          time: d.time as Time,
          value: d.close,
        }));
        
        console.log(`[TradingChart] Setting ${formattedData.length} line points`);
        lineSeries.setData(formattedData);
        seriesRef.current = lineSeries as any;
        console.log('[TradingChart] Line series created successfully');
      } else if (chartType === 'area') {
        console.log('[TradingChart] Adding AreaSeries to chart');
        const areaSeries = chartRef.current.addSeries(AreaSeries, {
          lineColor: '#3b82f6',
          topColor: 'rgba(59, 130, 246, 0.4)',
          bottomColor: 'rgba(59, 130, 246, 0.04)',
        })
        
        const formattedData = fetchedOhlcData.map(d => ({
          time: d.time as Time,
          value: d.close,
        }));
        
        console.log(`[TradingChart] Setting ${formattedData.length} area points`);
        areaSeries.setData(formattedData);
        seriesRef.current = areaSeries as any;
        console.log('[TradingChart] Area series created successfully');
      }
      } catch (seriesError) {
        console.error('[TradingChart] Error creating series:', seriesError);
        console.error('[TradingChart] Error details:', {
          chartType,
          dataLength: fetchedOhlcData.length,
          hasChart: !!chartRef.current
        });
      }

      // Fit content
      if (chartRef.current && chartRef.current.timeScale) {
        console.log('[TradingChart] Fitting chart content');
        chartRef.current.timeScale().fitContent();
      } else {
        console.warn('[TradingChart] Could not fit content - timeScale not available');
      }
    } catch (error) {
      console.error('[TradingChart] Error loading chart data:', error);
    } finally {
      setIsLoading(false);
      console.log('[TradingChart] loadChartData completed');
    }
  }

  return (
    <Card className={`bg-slate-900/50 border-border/50 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              {token0 && token1 ? (
                <>
                  <div className="flex items-center -space-x-2">
                    <img src={token0.image} alt={token0.symbol} className="w-6 h-6 rounded-full" />
                    <img src={token1.image} alt={token1.symbol} className="w-6 h-6 rounded-full" />
                  </div>
                  <span>{tradingPair}</span>
                </>
              ) : (
                <span className="text-muted-foreground">Select trading pair</span>
              )}
            </h3>
            {priceData && (
              <div className="flex items-center gap-4 mt-2">
                <span className="text-2xl font-bold">
                  {formatCurrency(currentPrice || priceData?.price || 0)}
                </span>
                <span className={`flex items-center gap-1 text-sm ${
                  priceData.change24hPercent >= 0 ? 'text-success' : 'text-destructive'
                }`}>
                  {priceData.change24hPercent >= 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {Math.abs(priceData.change24hPercent).toFixed(2)}%
                </span>
              </div>
            )}
          </div>
          
          {/* Chart Controls */}
          <div className="flex items-center gap-2">
            {/* Chart Type Selector */}
            <div className="flex gap-1 bg-slate-800/50 rounded-lg p-1">
              {chartTypes.map((type) => (
                <Button
                  key={type.value}
                  variant={chartType === type.value ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setChartType(type.value)}
                  className={`px-3 py-1 ${
                    chartType === type.value 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-slate-700/50'
                  }`}
                >
                  {type.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats */}
        {priceData && (
          <div className="grid grid-cols-4 gap-4 mt-4">
            <div>
              <p className="text-xs text-muted-foreground">24h High</p>
              <p className="text-sm font-medium">{formatCurrency(priceData.high24h)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">24h Low</p>
              <p className="text-sm font-medium">{formatCurrency(priceData.low24h)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">24h Volume</p>
              <p className="text-sm font-medium">{priceData.volume24h ? formatNumber(priceData.volume24h) : 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Market Cap</p>
              <p className="text-sm font-medium">
                {priceData.marketCap ? formatNumber(priceData.marketCap) : 'N/A'}
              </p>
            </div>
          </div>
        )}

        {/* Timeframe Selector */}
        <div className="flex gap-1 mt-4">
          {timeframes.map((tf) => (
            <Button
              key={tf.value}
              variant={timeframe === tf.value ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTimeframe(tf.value)}
              className={`px-3 py-1 ${
                timeframe === tf.value 
                  ? 'bg-primary/10 text-primary border border-primary/20' 
                  : 'hover:bg-slate-800/50'
              }`}
            >
              {tf.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Chart Container */}
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}
        <div ref={chartContainerRef} className="w-full" />
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Activity className="w-3 h-3" />
          <span>Live data from {priceData?.source === 'dia' ? 'DIA Oracle' : 'CoinGecko'} • Updated every 5s</span>
        </div>
        <span>Powered by TradingView Lightweight Charts</span>
      </div>
    </Card>
  )
}