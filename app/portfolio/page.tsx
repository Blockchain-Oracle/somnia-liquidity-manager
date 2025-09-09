'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Activity,
  Award,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  EyeOff,
  Copy,
  Check,
  Filter,
  Download,
  RefreshCw,
  PieChart,
  BarChart3,
  Coins,
  Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatPercentage, formatNumber } from '@/lib/utils'

const portfolioStats = {
  totalValue: 125432.56,
  totalPnL: 12543.21,
  pnlPercentage: 0.0998,
  dailyPnL: 1234.56,
  weeklyPnL: 5432.10,
  monthlyPnL: 12543.21,
  totalRewards: 3421.50,
  claimableRewards: 542.30,
}

const assets = [
  { 
    symbol: 'ETH', 
    name: 'Ethereum', 
    balance: 12.456, 
    value: 27832.45, 
    price: 2234.56, 
    change24h: 0.024,
    allocation: 0.222,
    icon: '🔷'
  },
  { 
    symbol: 'USDC', 
    name: 'USD Coin', 
    balance: 25432.10, 
    value: 25432.10, 
    price: 1.00, 
    change24h: 0.0001,
    allocation: 0.203,
    icon: '💵'
  },
  { 
    symbol: 'STT', 
    name: 'Somnia Token', 
    balance: 100000, 
    value: 45000, 
    price: 0.45, 
    change24h: 0.156,
    allocation: 0.359,
    icon: '🌟'
  },
  { 
    symbol: 'BTC', 
    name: 'Bitcoin', 
    balance: 0.542, 
    value: 23612.34, 
    price: 43567.89, 
    change24h: 0.018,
    allocation: 0.188,
    icon: '🪙'
  },
  { 
    symbol: 'MATIC', 
    name: 'Polygon', 
    balance: 5000, 
    value: 3556.00, 
    price: 0.7112, 
    change24h: -0.032,
    allocation: 0.028,
    icon: '🟣'
  },
]

const positions = [
  {
    id: 1,
    type: 'Liquidity',
    pair: 'ETH/USDC',
    value: 45678.90,
    rewards: 234.56,
    apy: 0.245,
    status: 'active',
    healthScore: 98,
  },
  {
    id: 2,
    type: 'Liquidity',
    pair: 'STT/USDC',
    value: 23456.78,
    rewards: 456.78,
    apy: 0.421,
    status: 'active',
    healthScore: 95,
  },
  {
    id: 3,
    type: 'Staking',
    pair: 'STT',
    value: 15000.00,
    rewards: 125.34,
    apy: 0.185,
    status: 'active',
    healthScore: 100,
  },
]

const transactions = [
  { id: 1, type: 'Swap', from: 'ETH', to: 'USDC', amount: 2.5, value: 5585.40, time: '2 hours ago', status: 'success' },
  { id: 2, type: 'Add Liquidity', pair: 'STT/USDC', amount: 10000, value: 4500.00, time: '5 hours ago', status: 'success' },
  { id: 3, type: 'Claim', token: 'STT', amount: 234.56, value: 105.55, time: '1 day ago', status: 'success' },
  { id: 4, type: 'Remove Liquidity', pair: 'ETH/USDC', amount: 0.5, value: 1117.08, time: '2 days ago', status: 'success' },
  { id: 5, type: 'Swap', from: 'USDC', to: 'BTC', amount: 5000, value: 5000.00, time: '3 days ago', status: 'success' },
]

export default function PortfolioPage() {
  const [showBalances, setShowBalances] = useState(true)
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<'assets' | 'positions' | 'history'>('assets')

  const handleCopy = () => {
    // Copy wallet address logic here
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Portfolio Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold mb-2">Portfolio</h1>
            <p className="text-muted-foreground">Track your assets, positions, and performance</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setShowBalances(!showBalances)}>
              {showBalances ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Wallet Info */}
        <div className="flex items-center gap-4 p-4 bg-slate-800/30 rounded-xl border border-border/50">
          <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <div className="text-sm text-muted-foreground">Connected Wallet</div>
            <div className="flex items-center gap-2">
              <span className="font-mono">0x742d...8F3c</span>
              <button onClick={handleCopy} className="text-muted-foreground hover:text-foreground transition-colors">
                {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
            <span className="text-sm text-muted-foreground">Somnia Network</span>
          </div>
        </div>
      </motion.div>

      {/* Portfolio Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid lg:grid-cols-4 gap-6 mb-8"
      >
        {/* Total Value Card */}
        <Card className="glass-card lg:col-span-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-primary/20 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Portfolio Value</p>
                  <h2 className="text-3xl font-bold">
                    {showBalances ? formatCurrency(portfolioStats.totalValue) : '******'}
                  </h2>
                </div>
              </div>
              <Sparkles className="w-8 h-8 text-primary/20" />
            </div>
            <div className="flex items-center gap-4 pt-4 border-t border-border/50">
              <div className="flex items-center gap-2">
                {portfolioStats.pnlPercentage >= 0 ? (
                  <ArrowUpRight className="w-4 h-4 text-success" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-error" />
                )}
                <span className={portfolioStats.pnlPercentage >= 0 ? 'text-success' : 'text-error'}>
                  {formatPercentage(Math.abs(portfolioStats.pnlPercentage))}
                </span>
              </div>
              <span className="text-sm text-muted-foreground">
                {portfolioStats.pnlPercentage >= 0 ? '+' : '-'}
                {formatCurrency(Math.abs(portfolioStats.totalPnL))} All Time
              </span>
            </div>
          </CardContent>
        </Card>

        {/* PnL Card */}
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Today's PnL</p>
                <h3 className="text-2xl font-bold text-success">
                  +{formatCurrency(portfolioStats.dailyPnL)}
                </h3>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Week</span>
                <span className="text-success">+{formatCurrency(portfolioStats.weeklyPnL)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Month</span>
                <span className="text-success">+{formatCurrency(portfolioStats.monthlyPnL)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rewards Card */}
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-warning/20 flex items-center justify-center">
                <Award className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Rewards</p>
                <h3 className="text-2xl font-bold">
                  {formatCurrency(portfolioStats.totalRewards)}
                </h3>
              </div>
            </div>
            <Button className="w-full" size="sm">
              Claim {formatCurrency(portfolioStats.claimableRewards)}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex items-center gap-4 mb-6"
      >
        <Button
          variant={activeTab === 'assets' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('assets')}
          className="gap-2"
        >
          <Coins className="w-4 h-4" />
          Assets
        </Button>
        <Button
          variant={activeTab === 'positions' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('positions')}
          className="gap-2"
        >
          <PieChart className="w-4 h-4" />
          Positions
        </Button>
        <Button
          variant={activeTab === 'history' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('history')}
          className="gap-2"
        >
          <Clock className="w-4 h-4" />
          History
        </Button>
      </motion.div>

      {/* Tab Content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {/* Assets Tab */}
        {activeTab === 'assets' && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Your Assets</CardTitle>
                  <CardDescription>Token balances and allocation</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {assets.map((asset, index) => (
                      <motion.div
                        key={asset.symbol}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-4 rounded-xl hover:bg-accent/10 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-card flex items-center justify-center text-2xl">
                            {asset.icon}
                          </div>
                          <div>
                            <div className="font-semibold">{asset.symbol}</div>
                            <div className="text-sm text-muted-foreground">{asset.name}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            {showBalances ? formatNumber(asset.balance, 4) : '****'} {asset.symbol}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {showBalances ? formatCurrency(asset.value) : '******'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm">{formatCurrency(asset.price)}</div>
                          <div className={`text-sm ${asset.change24h >= 0 ? 'text-success' : 'text-error'}`}>
                            {asset.change24h >= 0 ? '+' : ''}{formatPercentage(asset.change24h)}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Allocation Chart */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Allocation</CardTitle>
                <CardDescription>Portfolio distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative w-48 h-48 mx-auto mb-6">
                  <div className="absolute inset-0 rounded-full bg-gradient-primary opacity-20 blur-3xl"></div>
                  <div className="relative w-full h-full rounded-full border-8 border-primary/20 flex items-center justify-center">
                    <BarChart3 className="w-16 h-16 text-primary/50" />
                  </div>
                </div>
                <div className="space-y-3">
                  {assets.map((asset) => (
                    <div key={asset.symbol} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-gradient-primary"></div>
                        <span className="text-sm">{asset.symbol}</span>
                      </div>
                      <span className="text-sm font-medium">
                        {formatPercentage(asset.allocation)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Positions Tab */}
        {activeTab === 'positions' && (
          <div className="grid gap-6">
            {positions.map((position, index) => (
              <motion.div
                key={position.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="glass-card card-hover">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-primary/20 flex items-center justify-center">
                          {position.type === 'Liquidity' ? (
                            <Activity className="w-6 h-6 text-primary" />
                          ) : (
                            <Coins className="w-6 h-6 text-primary" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-lg">{position.pair}</div>
                          <div className="text-sm text-muted-foreground">{position.type}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-lg">
                          {showBalances ? formatCurrency(position.value) : '******'}
                        </div>
                        <div className="text-sm text-success">
                          APY: {formatPercentage(position.apy)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Rewards</div>
                        <div className="font-semibold">
                          {formatCurrency(position.rewards)}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground mb-1">Health</div>
                          <div className={`text-sm font-semibold ${
                            position.healthScore >= 90 ? 'text-success' : 
                            position.healthScore >= 70 ? 'text-warning' : 'text-error'
                          }`}>
                            {position.healthScore}%
                          </div>
                        </div>
                        <Button variant="outline" size="sm">Manage</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Transaction History</CardTitle>
                <Button variant="ghost" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions.map((tx, index) => (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 rounded-xl hover:bg-accent/10 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        tx.type === 'Swap' ? 'bg-primary/20' :
                        tx.type === 'Add Liquidity' ? 'bg-success/20' :
                        tx.type === 'Remove Liquidity' ? 'bg-warning/20' :
                        'bg-accent/20'
                      }`}>
                        {tx.type === 'Swap' ? <ArrowUpDown className="w-5 h-5" /> :
                         tx.type.includes('Liquidity') ? <Activity className="w-5 h-5" /> :
                         <Award className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="font-medium">{tx.type}</div>
                        <div className="text-sm text-muted-foreground">
                          {tx.pair || `${tx.from} → ${tx.to}`}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(tx.value)}</div>
                      <div className="text-sm text-muted-foreground">{tx.amount} {tx.token || tx.from}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">{tx.time}</div>
                      <div className="badge badge-success text-xs">{tx.status}</div>
                    </div>
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