'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  Users,
  PieChart,
  Calendar,
  Info,
  Download,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Globe,
  Layers,
  Clock,
  Filter,
  ChevronDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatPercentage, formatNumber } from '@/lib/utils'

const timeRanges = [
  { id: '24h', label: '24H' },
  { id: '7d', label: '7D' },
  { id: '30d', label: '30D' },
  { id: '90d', label: '90D' },
  { id: '1y', label: '1Y' },
  { id: 'all', label: 'ALL' },
]

const protocolMetrics = {
  tvl: 270504902,
  tvlChange: 0.124,
  volume24h: 66028378,
  volumeChange: 0.087,
  fees24h: 198085,
  feesChange: 0.092,
  users24h: 12456,
  usersChange: 0.156,
  transactions24h: 45678,
  transactionsChange: 0.234,
  totalPools: 24,
  poolsChange: 0.08,
}

const topPools = [
  { rank: 1, pair: 'ETH/USDC', tvl: 45678900, volume24h: 12345678, apy: 0.245, change: 0.124 },
  { rank: 2, pair: 'USDC/USDT', tvl: 89012345, volume24h: 23456789, apy: 0.085, change: 0.032 },
  { rank: 3, pair: 'STT/USDC', tvl: 23456789, volume24h: 5678900, apy: 0.421, change: 0.256 },
  { rank: 4, pair: 'BTC/ETH', tvl: 34567890, volume24h: 8901234, apy: 0.183, change: -0.045 },
  { rank: 5, pair: 'DAI/USDC', tvl: 56789012, volume24h: 12345678, apy: 0.092, change: 0.018 },
]

const topTokens = [
  { rank: 1, symbol: 'ETH', name: 'Ethereum', price: 2234.56, volume24h: 34567890, change: 0.024, icon: '🔷' },
  { rank: 2, symbol: 'USDC', name: 'USD Coin', price: 1.00, volume24h: 45678901, change: 0.0001, icon: '💵' },
  { rank: 3, symbol: 'STT', name: 'Somnia Token', price: 0.45, volume24h: 12345678, change: 0.156, icon: '🌟' },
  { rank: 4, symbol: 'BTC', name: 'Bitcoin', price: 43567.89, volume24h: 23456789, change: 0.018, icon: '🪙' },
  { rank: 5, symbol: 'USDT', name: 'Tether', price: 1.00, volume24h: 34567890, change: -0.0002, icon: '💰' },
]

const recentTransactions = [
  { type: 'Swap', pair: 'ETH/USDC', value: 5585.40, time: '2 min ago', txHash: '0x1234...5678' },
  { type: 'Add Liquidity', pair: 'STT/USDC', value: 10000.00, time: '5 min ago', txHash: '0x2345...6789' },
  { type: 'Remove Liquidity', pair: 'BTC/ETH', value: 23456.78, time: '8 min ago', txHash: '0x3456...7890' },
  { type: 'Swap', pair: 'USDC/USDT', value: 50000.00, time: '12 min ago', txHash: '0x4567...8901' },
  { type: 'Swap', pair: 'MATIC/USDC', value: 3456.78, time: '15 min ago', txHash: '0x5678...9012' },
]

export default function AnalyticsPage() {
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h')
  const [activeTab, setActiveTab] = useState<'overview' | 'pools' | 'tokens' | 'transactions'>('overview')

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
              Protocol Analytics
              <BarChart3 className="w-8 h-8 text-primary" />
            </h1>
            <p className="text-muted-foreground">Real-time metrics and insights for Somnia DeFi</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </Button>
            <Button size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center gap-2">
          {timeRanges.map((range) => (
            <Button
              key={range.id}
              variant={selectedTimeRange === range.id ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedTimeRange(range.id)}
            >
              {range.label}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* Key Metrics Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Total Value Locked</p>
              <DollarSign className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold mb-2">{formatCurrency(protocolMetrics.tvl)}</p>
            <div className="flex items-center gap-2">
              {protocolMetrics.tvlChange >= 0 ? (
                <ArrowUpRight className="w-4 h-4 text-success" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-error" />
              )}
              <span className={protocolMetrics.tvlChange >= 0 ? 'text-success text-sm' : 'text-error text-sm'}>
                {formatPercentage(Math.abs(protocolMetrics.tvlChange))}
              </span>
              <span className="text-xs text-muted-foreground">vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">24h Volume</p>
              <Activity className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold mb-2">{formatCurrency(protocolMetrics.volume24h)}</p>
            <div className="flex items-center gap-2">
              {protocolMetrics.volumeChange >= 0 ? (
                <ArrowUpRight className="w-4 h-4 text-success" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-error" />
              )}
              <span className={protocolMetrics.volumeChange >= 0 ? 'text-success text-sm' : 'text-error text-sm'}>
                {formatPercentage(Math.abs(protocolMetrics.volumeChange))}
              </span>
              <span className="text-xs text-muted-foreground">vs yesterday</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">24h Fees</p>
              <Zap className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold mb-2">{formatCurrency(protocolMetrics.fees24h)}</p>
            <div className="flex items-center gap-2">
              {protocolMetrics.feesChange >= 0 ? (
                <ArrowUpRight className="w-4 h-4 text-success" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-error" />
              )}
              <span className={protocolMetrics.feesChange >= 0 ? 'text-success text-sm' : 'text-error text-sm'}>
                {formatPercentage(Math.abs(protocolMetrics.feesChange))}
              </span>
              <span className="text-xs text-muted-foreground">vs yesterday</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Active Users (24h)</p>
              <Users className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold mb-2">{formatNumber(protocolMetrics.users24h)}</p>
            <div className="flex items-center gap-2">
              {protocolMetrics.usersChange >= 0 ? (
                <ArrowUpRight className="w-4 h-4 text-success" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-error" />
              )}
              <span className={protocolMetrics.usersChange >= 0 ? 'text-success text-sm' : 'text-error text-sm'}>
                {formatPercentage(Math.abs(protocolMetrics.usersChange))}
              </span>
              <span className="text-xs text-muted-foreground">vs yesterday</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid lg:grid-cols-2 gap-6 mb-8"
      >
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>TVL Over Time</CardTitle>
            <CardDescription>Total value locked in the protocol</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Interactive chart would be displayed here</p>
                <p className="text-sm mt-2">Using Recharts or similar library</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Volume & Fees</CardTitle>
            <CardDescription>Trading volume and fees generated</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Activity className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Interactive chart would be displayed here</p>
                <p className="text-sm mt-2">Using Recharts or similar library</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant={activeTab === 'overview' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('overview')}
            className="gap-2"
          >
            <Globe className="w-4 h-4" />
            Overview
          </Button>
          <Button
            variant={activeTab === 'pools' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('pools')}
            className="gap-2"
          >
            <Layers className="w-4 h-4" />
            Top Pools
          </Button>
          <Button
            variant={activeTab === 'tokens' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('tokens')}
            className="gap-2"
          >
            <PieChart className="w-4 h-4" />
            Top Tokens
          </Button>
          <Button
            variant={activeTab === 'transactions' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('transactions')}
            className="gap-2"
          >
            <Clock className="w-4 h-4" />
            Transactions
          </Button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Protocol Health</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Liquidity Utilization</span>
                      <span className="text-sm font-medium">68%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full w-[68%] bg-gradient-primary rounded-full"></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Protocol Efficiency</span>
                      <span className="text-sm font-medium">92%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full w-[92%] bg-success rounded-full"></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Network Load</span>
                      <span className="text-sm font-medium">45%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full w-[45%] bg-warning rounded-full"></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Distribution</CardTitle>
                <CardDescription>Asset allocation across pools</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative w-48 h-48 mx-auto">
                  <div className="absolute inset-0 rounded-full bg-gradient-primary opacity-20 blur-3xl"></div>
                  <div className="relative w-full h-full rounded-full border-8 border-primary/20 flex items-center justify-center">
                    <PieChart className="w-16 h-16 text-primary/50" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold">45%</p>
                    <p className="text-xs text-muted-foreground">Stable Pools</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">55%</p>
                    <p className="text-xs text-muted-foreground">Volatile Pools</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'pools' && (
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Top Performing Pools</CardTitle>
                <Button variant="ghost" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topPools.map((pool) => (
                  <div key={pool.rank} className="flex items-center justify-between p-4 rounded-xl hover:bg-accent/10 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-gradient-primary/20 flex items-center justify-center text-sm font-bold">
                        {pool.rank}
                      </div>
                      <div>
                        <p className="font-semibold">{pool.pair}</p>
                        <p className="text-sm text-muted-foreground">
                          APY: <span className="text-success">{formatPercentage(pool.apy)}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(pool.tvl)}</p>
                      <p className="text-sm text-muted-foreground">TVL</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(pool.volume24h)}</p>
                      <p className="text-sm text-muted-foreground">24h Volume</p>
                    </div>
                    <div className={`flex items-center gap-1 ${pool.change >= 0 ? 'text-success' : 'text-error'}`}>
                      {pool.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      <span className="text-sm">{formatPercentage(Math.abs(pool.change))}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'tokens' && (
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Top Tokens by Volume</CardTitle>
                <Button variant="ghost" size="sm">
                  <ChevronDown className="w-4 h-4 mr-2" />
                  Sort
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topTokens.map((token) => (
                  <div key={token.rank} className="flex items-center justify-between p-4 rounded-xl hover:bg-accent/10 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-card flex items-center justify-center text-xl">
                        {token.icon}
                      </div>
                      <div>
                        <p className="font-semibold">{token.symbol}</p>
                        <p className="text-sm text-muted-foreground">{token.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(token.price)}</p>
                      <p className="text-sm text-muted-foreground">Price</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(token.volume24h)}</p>
                      <p className="text-sm text-muted-foreground">24h Volume</p>
                    </div>
                    <div className={`flex items-center gap-1 ${token.change >= 0 ? 'text-success' : 'text-error'}`}>
                      {token.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      <span className="text-sm">{formatPercentage(Math.abs(token.change))}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'transactions' && (
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Transactions</CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                  Live
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTransactions.map((tx, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 rounded-xl hover:bg-accent/10 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        tx.type === 'Swap' ? 'bg-primary/20' :
                        tx.type === 'Add Liquidity' ? 'bg-success/20' :
                        'bg-warning/20'
                      }`}>
                        {tx.type === 'Swap' ? <ArrowUpRight className="w-5 h-5" /> :
                         tx.type === 'Add Liquidity' ? <Plus className="w-5 h-5" /> :
                         <Minus className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="font-medium">{tx.type}</p>
                        <p className="text-sm text-muted-foreground">{tx.pair}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(tx.value)}</p>
                      <p className="text-sm text-muted-foreground">{tx.time}</p>
                    </div>
                    <a href="#" className="text-sm text-primary hover:underline font-mono">
                      {tx.txHash}
                    </a>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  )
}

// Add these imports at the top
import { Plus, Minus, ArrowUpDown } from 'lucide-react'