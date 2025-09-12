'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import EnhancedSwapTestnet from '@/components/Trade/EnhancedSwapTestnet'
import { TradingChart } from '@/components/DeFi/TradingChart'
import { TokenInfo, getTokenInfo } from '@/lib/constants/tokenImages'
import { tradesService, Trade } from '@/lib/services/tradesService'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { TestnetFaucet } from '@/components/Faucet/TestnetFaucet'
import { useNetwork } from '@/lib/hooks/useNetwork'
import { 
  Activity,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  RefreshCw,
  Droplets,
  Percent,
  AlertCircle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface MarketStats {
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  high24h: number;
  low24h: number;
}

export default function TradePage() {
  const { isTestnet } = useNetwork()
  
  // State for selected tokens - shared between swap and chart
  // Use testnet tokens if on testnet
  const [selectedToken0, setSelectedToken0] = useState<TokenInfo>(
    getTokenInfo(isTestnet ? 'WSTT' : 'WETH')
  )
  const [selectedToken1, setSelectedToken1] = useState<TokenInfo>(
    getTokenInfo(isTestnet ? 'tUSDC' : 'USDC')
  )
  const [marketStats, setMarketStats] = useState<MarketStats | null>(null)
  const [recentTrades, setRecentTrades] = useState<Trade[]>([])
  const [isLoadingStats, setIsLoadingStats] = useState(true)

  // Fetch market statistics and liquidity data
  useEffect(() => {
    const fetchMarketData = async () => {
      setIsLoadingStats(true)
      try {
        // On testnet, we don't have real price data
        if (isTestnet) {
          setMarketStats(null)
        } else {
          // Placeholder for mainnet price fetching
          setMarketStats(null)
        }
      } catch (error) {
        console.error('Error fetching market data:', error)
      } finally {
        setIsLoadingStats(false)
      }
    }

    fetchMarketData()
    const interval = setInterval(fetchMarketData, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [selectedToken0, selectedToken1, isTestnet])

  // Subscribe to real-time trades from tradesService
  useEffect(() => {
    const unsubscribe = tradesService.subscribeToTrades(
      selectedToken0.symbol,
      selectedToken1.symbol,
      (trades) => {
        console.log(`[TradePage] Received ${trades.length} trades for ${selectedToken0.symbol}/${selectedToken1.symbol}`)
        setRecentTrades(trades)
      },
      10000 // Update every 10 seconds
    )
    
    return unsubscribe
  }, [selectedToken0, selectedToken1])

  const marketData = marketStats ? [
    { 
      label: 'Price', 
      value: formatCurrency(marketStats.price), 
      change: `${marketStats.change24h >= 0 ? '+' : ''}${marketStats.change24h.toFixed(2)}%`,
      icon: marketStats.change24h >= 0 ? TrendingUp : TrendingDown,
      positive: marketStats.change24h >= 0 
    },
    { 
      label: '24h Volume', 
      value: formatNumber(marketStats.volume24h), 
      change: '+12.3%', // This would need another API call for volume change
      icon: Activity,
      positive: true 
    },
    { 
      label: '24h High', 
      value: formatCurrency(marketStats.high24h), 
      change: `${((marketStats.high24h - marketStats.price) / marketStats.price * 100).toFixed(2)}%`,
      icon: TrendingUp,
      positive: true 
    },
    { 
      label: 'Market Cap', 
      value: marketStats.marketCap ? formatNumber(marketStats.marketCap) : 'N/A', 
      change: `${marketStats.change24h >= 0 ? '+' : ''}${marketStats.change24h.toFixed(2)}%`,
      icon: BarChart3,
      positive: marketStats.change24h >= 0 
    },
  ] : []

  // Render different UI based on network but without early return
  return isTestnet ? (
    // TESTNET: Simple swap interface
      <div className="container mx-auto px-4 py-8">
        {/* Testnet Banner */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className="bg-warning/10 border-warning/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-warning" />
                <div>
                  <p className="font-medium text-warning">Testnet Mode</p>
                  <p className="text-sm text-muted-foreground">
                    You are using test tokens with no real value. Only token swaps are available on testnet.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Show TestnetFaucet */}
        <TestnetFaucet />
        
        {/* Centered Swap Interface for Testnet */}
        <div className="max-w-lg mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <EnhancedSwapTestnet 
              onTokenChange={(token0, token1) => {
                setSelectedToken0(token0)
                setSelectedToken1(token1)
              }}
              initialToken0={selectedToken0}
              initialToken1={selectedToken1}
            />
          </motion.div>
          
          {/* Simple Pool Info */}
        </div>
      </div>
  ) : (
    // MAINNET: Full trading interface
    <div className="container mx-auto px-4 py-8">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Chart and Market Data */}
        <div className="lg:col-span-2 space-y-6">
          {/* Trading Chart - Synchronized with swap */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <TradingChart 
              token0={selectedToken0}
              token1={selectedToken1}
              height={450}
            />
          </motion.div>

          {/* Market Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {isLoadingStats ? (
                // Loading skeleton
                [...Array(4)].map((_, i) => (
                  <Card key={i} className="bg-slate-900/50 border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="h-4 w-20 bg-slate-800 rounded animate-pulse" />
                          <div className="h-6 w-24 bg-slate-800 rounded animate-pulse" />
                          <div className="h-4 w-16 bg-slate-800 rounded animate-pulse" />
                        </div>
                        <div className="w-8 h-8 bg-slate-800 rounded-lg animate-pulse" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                marketData.map((item, index) => (
                  <Card key={item.label} className="bg-slate-900/50 border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">{item.label}</p>
                          <p className="text-xl font-bold mt-1">{item.value}</p>
                          <p className={`text-sm mt-1 ${
                            item.positive ? 'text-success' : 'text-destructive'
                          }`}>
                            {item.change}
                          </p>
                        </div>
                        <div className={`p-2 rounded-lg ${
                          item.positive ? 'bg-success/10' : 'bg-destructive/10'
                        }`}>
                          <item.icon className={`w-4 h-4 ${
                            item.positive ? 'text-success' : 'text-destructive'
                          }`} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </motion.div>

          {/* Recent Trades */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="bg-slate-900/50 border-border/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Recent Trades</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                    <span className="text-xs text-muted-foreground">Live</span>
                  </div>
                  <RefreshCw className="w-3 h-3 text-muted-foreground animate-spin" style={{ animationDuration: '3s' }} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentTrades.length === 0 ? (
                    // Loading skeleton for trades
                    [...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="h-4 w-10 bg-slate-800 rounded animate-pulse" />
                          <div className="h-4 w-20 bg-slate-800 rounded animate-pulse" />
                        </div>
                        <div className="text-right space-y-1">
                          <div className="h-4 w-16 bg-slate-800 rounded animate-pulse ml-auto" />
                          <div className="h-3 w-12 bg-slate-800 rounded animate-pulse ml-auto" />
                        </div>
                      </div>
                    ))
                  ) : (
                    recentTrades.slice(0, 5).map((trade, i) => (
                      <motion.div 
                        key={i} 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: i * 0.05 }}
                        className="flex items-center justify-between py-2 border-b border-border/30 last:border-0"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`text-sm font-medium ${
                            trade.type === 'BUY' ? 'text-success' : 'text-destructive'
                          }`}>
                            {trade.type}
                          </span>
                          <span className="text-sm">
                            {trade.amount} {selectedToken0.symbol}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {formatCurrency(trade.price)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {trade.timestamp.toLocaleTimeString('en-US', { 
                              hour: '2-digit', 
                              minute: '2-digit', 
                              second: '2-digit' 
                            })}
                          </p>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Right Column - Swap Interface */}
        <div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <EnhancedSwapTestnet 
              onTokenChange={(token0, token1) => {
                setSelectedToken0(token0)
                setSelectedToken1(token1)
              }}
              initialToken0={selectedToken0}
              initialToken1={selectedToken1}
            />
          </motion.div>

          {/* Order Book */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-6"
          >
            <Card className="bg-slate-900/50 border-border/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Order Book</CardTitle>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Depth: ±2%</span>
                  <RefreshCw className="w-3 h-3 animate-spin" style={{ animationDuration: '3s' }} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {/* Sell Orders - Based on current price */}
                  <div className="space-y-1">
                    {marketStats && [0.002, 0.003, 0.005].map((spread, i) => {
                      const price = marketStats.price * (1 + spread)
                      const amount = (Math.random() * 10 + 1).toFixed(4)
                      return (
                        <div key={`sell-${i}`} className="flex items-center justify-between text-sm">
                          <span className="text-destructive">
                            {amount}
                          </span>
                          <span className="text-destructive">
                            {formatCurrency(price)}
                          </span>
                        </div>
                      )
                    })}
                    {!marketStats && [...Array(3)].map((_, i) => (
                      <div key={`sell-${i}`} className="flex items-center justify-between">
                        <div className="h-4 w-16 bg-slate-800 rounded animate-pulse" />
                        <div className="h-4 w-20 bg-slate-800 rounded animate-pulse" />
                      </div>
                    ))}
                  </div>
                  
                  {/* Current Price with spread calculation */}
                  <div className="py-2 border-y border-border/50">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Mid Price</span>
                      <span className="text-sm font-bold text-primary">
                        {marketStats ? formatCurrency(marketStats.price) : '...'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-muted-foreground">Spread</span>
                      <span className="text-xs text-muted-foreground">
                        {marketStats ? '0.20%' : '...'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Buy Orders - Based on current price */}
                  <div className="space-y-1">
                    {marketStats && [0.002, 0.003, 0.005].map((spread, i) => {
                      const price = marketStats.price * (1 - spread)
                      const amount = (Math.random() * 10 + 1).toFixed(4)
                      return (
                        <div key={`buy-${i}`} className="flex items-center justify-between text-sm">
                          <span className="text-success">
                            {amount}
                          </span>
                          <span className="text-success">
                            {formatCurrency(price)}
                          </span>
                        </div>
                      )
                    })}
                    {!marketStats && [...Array(3)].map((_, i) => (
                      <div key={`buy-${i}`} className="flex items-center justify-between">
                        <div className="h-4 w-16 bg-slate-800 rounded animate-pulse" />
                        <div className="h-4 w-20 bg-slate-800 rounded animate-pulse" />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

        </div>
      </div>
    </div>
  )
}