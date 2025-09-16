'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import EnhancedSwapTestnet from '@/components/Trade/EnhancedSwapTestnet'
import { TradingChart } from '@/components/DeFi/TradingChart'
import { TokenInfo, getTokenInfo } from '@/lib/constants/tokenImages'
import { tradesService, Trade } from '@/lib/services/tradesService'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { TestnetFaucet } from '@/components/Faucet/TestnetFaucet'
import { useNetwork } from '@/lib/hooks/useNetwork'
import { AnimatedBackground } from '@/components/ui/AnimatedBackground'
import { TransformCard } from '@/components/ui/TransformCard'
import Terminal from '@/components/ui/Terminal'
import { Typography } from '@/components/ui/Typography'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { 
  Activity,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  RefreshCw,
  Droplets,
  Percent,
  AlertCircle,
  ArrowRightLeft,
  Sparkles,
  Clock,
  Zap,
  Info,
  ChevronUp,
  ChevronDown,
  Flame,
  Shield,
  GitBranch
} from 'lucide-react'

// Market stats interface remains the same
interface MarketStats {
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  high24h: number;
  low24h: number;
}

// Trading features showcase
const tradingFeatures = [
  { icon: Zap, label: '0.05% Fee', color: 'text-yellow-400' },
  { icon: Shield, label: 'MEV Protected', color: 'text-green-400' },
  { icon: GitBranch, label: 'Smart Routing', color: 'text-blue-400' },
  { icon: Flame, label: 'Gas Optimized', color: 'text-orange-400' }
]

export default function TradePage() {
  const { isTestnet } = useNetwork()
  
  // State management
  const [selectedToken0, setSelectedToken0] = useState<TokenInfo>(
    getTokenInfo(isTestnet ? 'WSTT' : 'WETH')
  )
  const [selectedToken1, setSelectedToken1] = useState<TokenInfo>(
    getTokenInfo(isTestnet ? 'tUSDC' : 'USDC')
  )
  const [marketStats, setMarketStats] = useState<MarketStats | null>(null)
  const [recentTrades, setRecentTrades] = useState<Trade[]>([])
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [selectedTimeframe, setSelectedTimeframe] = useState('24H')
  const [orderBookData, setOrderBookData] = useState({ bids: [], asks: [] })

  // Fetch market data
  useEffect(() => {
    const fetchMarketData = async () => {
      setIsLoadingStats(true)
      try {
        if (isTestnet) {
          // Demo data for testnet
          setMarketStats({
            price: 1852.45,
            change24h: 3.24,
            volume24h: 1234567,
            marketCap: 0,
            high24h: 1899.99,
            low24h: 1799.99
          })
        } else {
          setMarketStats(null)
        }
      } catch (error) {
        console.error('Error fetching market data:', error)
      } finally {
        setIsLoadingStats(false)
      }
    }

    fetchMarketData()
    const interval = setInterval(fetchMarketData, 30000)
    return () => clearInterval(interval)
  }, [selectedToken0, selectedToken1, isTestnet])

  // Subscribe to trades
  useEffect(() => {
    const unsubscribe = tradesService.subscribeToTrades(
      selectedToken0.symbol,
      selectedToken1.symbol,
      (trades) => {
        setRecentTrades(trades)
      },
      10000
    )
    
    return unsubscribe
  }, [selectedToken0, selectedToken1])

  const timeframes = ['1M', '5M', '15M', '1H', '4H', '24H', '1W']

  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      {/* Animated backgrounds */}
      <AnimatedBackground 
        variant="dots" 
        colors={['#3b82f6']} 
        opacity={0.03} 
      />
      <AnimatedBackground 
        variant="lines" 
        colors={['#3b82f6', '#10b981']} 
        opacity={0.05} 
      />

      {/* Header Section */}
      <section className="relative container mx-auto px-4 pt-8 pb-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between"
        >
          <div>
            <Typography variant="h2" className="mb-2">
              <span className="text-white">Professional </span>
              <Typography variant="h2" gradient="blue" as="span">
                Trading Terminal
              </Typography>
            </Typography>
            <div className="flex items-center gap-4">
              {tradingFeatures.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-2"
                >
                  <feature.icon className={`w-4 h-4 ${feature.color}`} />
                  <span className="text-sm text-gray-400">{feature.label}</span>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <StatusBadge variant="success" pulse>
              {isTestnet ? 'TESTNET' : 'MAINNET'}
            </StatusBadge>
            <StatusBadge variant="info">
              <Activity className="w-3 h-3 mr-1" />
              Live
            </StatusBadge>
          </div>
        </motion.div>
      </section>

      {isTestnet ? (
        // TESTNET Interface
        <div className="container mx-auto px-4 py-8">
          {/* Testnet Alert */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <TransformCard
              rotation="rotate-0"
              background="bg-gradient-to-r from-yellow-900/20 to-orange-900/20"
              border="border border-yellow-500/30"
              className="p-4"
            >
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-400" />
                <div>
                  <p className="font-medium text-yellow-400">Testnet Mode Active</p>
                  <p className="text-sm text-gray-400">
                    Trading with test tokens. Get free tokens from the faucet below.
                  </p>
                </div>
              </div>
            </TransformCard>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Side - Terminal Info */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <Terminal title="market-info.sh">
                <Terminal.Line type="comment" output="// Testnet Market Status" />
                <Terminal.Line command="getPrice WSTT/tUSDC" />
                <Terminal.Line type="output" output="Price: 1.852 tUSDC" />
                <Terminal.Line type="output" output="24h Change: +3.24%" />
                <Terminal.Line type="success" output="✓ Pool liquidity healthy" />
              </Terminal>

              <TransformCard
                rotation="-rotate-1"
                background="bg-gradient-to-br from-gray-900 to-gray-800"
                className="p-6"
              >
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Droplets className="w-5 h-5 text-blue-400" />
                  Pool Statistics
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">TVL</span>
                    <span className="text-white font-medium">$2.4M</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">24h Volume</span>
                    <span className="text-white font-medium">$342K</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">APY</span>
                    <span className="text-green-400 font-medium">12.4%</span>
                  </div>
                </div>
              </TransformCard>
            </motion.div>

            {/* Center - Swap Interface */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <TransformCard
                rotation="rotate-0"
                background="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
                border="border border-gray-700/50"
                className="p-1"
                animate={false}
              >
                <EnhancedSwapTestnet 
                  onTokenChange={(token0, token1) => {
                    setSelectedToken0(token0)
                    setSelectedToken1(token1)
                  }}
                  initialToken0={selectedToken0}
                  initialToken1={selectedToken1}
                />
              </TransformCard>
            </motion.div>

            {/* Right Side - Faucet */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <TestnetFaucet />
            </motion.div>
          </div>
        </div>
      ) : (
        // MAINNET Professional Trading Interface
        <div className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-12 gap-6">
            {/* Main Trading Area */}
            <div className="lg:col-span-8 space-y-6">
              {/* Chart with timeframe selector */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <TransformCard
                  rotation="rotate-0"
                  background="bg-gradient-to-br from-gray-900 to-gray-800"
                  className="p-6"
                  animate={false}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-bold text-white">
                        {selectedToken0.symbol}/{selectedToken1.symbol}
                      </h3>
                      <StatusBadge variant="success">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        +3.24%
                      </StatusBadge>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {timeframes.map((tf) => (
                        <button
                          key={tf}
                          onClick={() => setSelectedTimeframe(tf)}
                          className={`px-3 py-1 rounded-lg text-sm transition-all ${
                            selectedTimeframe === tf
                              ? 'bg-primary text-white'
                              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                          }`}
                        >
                          {tf}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <TradingChart 
                    token0={selectedToken0}
                    token1={selectedToken1}
                    height={450}
                  />
                </TransformCard>
              </motion.div>

              {/* Market Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {marketStats && [
                  { 
                    label: 'Price',
                    value: formatCurrency(marketStats.price),
                    change: marketStats.change24h,
                    icon: DollarSign,
                    gradient: 'from-blue-500 to-cyan-500'
                  },
                  { 
                    label: '24h Volume',
                    value: formatNumber(marketStats.volume24h),
                    change: 12.3,
                    icon: Activity,
                    gradient: 'from-purple-500 to-pink-500'
                  },
                  { 
                    label: '24h High',
                    value: formatCurrency(marketStats.high24h),
                    change: 0,
                    icon: TrendingUp,
                    gradient: 'from-green-500 to-emerald-500'
                  },
                  { 
                    label: '24h Low',
                    value: formatCurrency(marketStats.low24h),
                    change: 0,
                    icon: TrendingDown,
                    gradient: 'from-orange-500 to-red-500'
                  }
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                  >
                    <TransformCard
                      rotation={index % 2 === 0 ? "rotate-1" : "-rotate-1"}
                      background="bg-gradient-to-br from-gray-900 to-gray-800"
                      className="p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs text-gray-400">{stat.label}</p>
                          <p className="text-xl font-bold text-white mt-1">{stat.value}</p>
                          {stat.change !== 0 && (
                            <p className={`text-sm mt-1 ${
                              stat.change > 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {stat.change > 0 ? '+' : ''}{stat.change.toFixed(2)}%
                            </p>
                          )}
                        </div>
                        <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.gradient}`}>
                          <stat.icon className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    </TransformCard>
                  </motion.div>
                ))}
              </div>

              {/* Recent Trades Terminal */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Terminal title="recent-trades.log">
                  <Terminal.Line type="comment" output="// Live trade feed" />
                  {recentTrades.length > 0 ? (
                    recentTrades.slice(0, 5).map((trade, i) => (
                      <Terminal.Line
                        key={i}
                        type={trade.type === 'BUY' ? 'success' : 'error'}
                        output={`${trade.type.toUpperCase()} ${trade.amount} ${selectedToken0.symbol} @ ${trade.price} | ${new Date(trade.timestamp).toLocaleTimeString()}`}
                      />
                    ))
                  ) : (
                    <Terminal.Line type="output" output="Waiting for trades..." />
                  )}
                </Terminal>
              </motion.div>
            </div>

            {/* Right Sidebar - Swap & Order Book */}
            <div className="lg:col-span-4 space-y-6">
              {/* Swap Interface */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <TransformCard
                  rotation="rotate-1"
                  background="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
                  border="border border-gray-700/50"
                  className="p-1"
                >
                  <EnhancedSwapTestnet 
                    onTokenChange={(token0, token1) => {
                      setSelectedToken0(token0)
                      setSelectedToken1(token1)
                    }}
                    initialToken0={selectedToken0}
                    initialToken1={selectedToken1}
                  />
                </TransformCard>
              </motion.div>

              {/* Order Book */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <TransformCard
                  rotation="-rotate-1"
                  background="bg-gradient-to-br from-gray-900 to-gray-800"
                  className="p-6"
                >
                  <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-purple-400" />
                    Order Book
                  </h3>
                  
                  <div className="space-y-2">
                    {/* Asks */}
                    <div className="space-y-1">
                      {[...Array(3)].map((_, i) => (
                        <div key={`ask-${i}`} className="flex justify-between text-sm">
                          <span className="text-red-400">1,852.{45 + i}</span>
                          <span className="text-gray-400">{(Math.random() * 10).toFixed(3)}</span>
                          <span className="text-gray-500">{(Math.random() * 100).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    
                    {/* Spread */}
                    <div className="border-t border-b border-gray-700 py-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Spread</span>
                        <span className="text-white font-medium">0.05%</span>
                      </div>
                    </div>
                    
                    {/* Bids */}
                    <div className="space-y-1">
                      {[...Array(3)].map((_, i) => (
                        <div key={`bid-${i}`} className="flex justify-between text-sm">
                          <span className="text-green-400">1,852.{40 - i}</span>
                          <span className="text-gray-400">{(Math.random() * 10).toFixed(3)}</span>
                          <span className="text-gray-500">{(Math.random() * 100).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </TransformCard>
              </motion.div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}