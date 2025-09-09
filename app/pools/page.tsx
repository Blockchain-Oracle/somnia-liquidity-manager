'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Droplets,
  Plus,
  Minus,
  TrendingUp,
  Info,
  Search,
  Filter,
  Star,
  StarOff,
  ChevronDown,
  ArrowRight,
  Zap,
  Shield,
  Award,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Activity,
  Sparkles,
  Flame,
  Trophy
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalFooter } from '@/components/ui/modal'
import { formatCurrency, formatPercentage, formatNumber } from '@/lib/utils'

const poolCategories = [
  { id: 'all', name: 'All Pools', count: 24 },
  { id: 'stable', name: 'Stable Pools', count: 8 },
  { id: 'volatile', name: 'Volatile Pools', count: 12 },
  { id: 'concentrated', name: 'Concentrated', count: 4 },
]

const pools = [
  {
    id: 1,
    pair: 'ETH/USDC',
    token0: { symbol: 'ETH', icon: '🔷' },
    token1: { symbol: 'USDC', icon: '💵' },
    tvl: 45678900,
    volume24h: 12345678,
    apy: 0.245,
    fee: 0.003,
    myLiquidity: 12456.78,
    rewards: 234.56,
    type: 'volatile',
    riskLevel: 'low',
    boosted: true,
    verified: true,
  },
  {
    id: 2,
    pair: 'STT/USDC',
    token0: { symbol: 'STT', icon: '🌟' },
    token1: { symbol: 'USDC', icon: '💵' },
    tvl: 23456789,
    volume24h: 5678900,
    apy: 0.421,
    fee: 0.003,
    myLiquidity: 0,
    rewards: 0,
    type: 'volatile',
    riskLevel: 'medium',
    boosted: true,
    verified: true,
  },
  {
    id: 3,
    pair: 'USDC/USDT',
    token0: { symbol: 'USDC', icon: '💵' },
    token1: { symbol: 'USDT', icon: '💰' },
    tvl: 89012345,
    volume24h: 23456789,
    apy: 0.085,
    fee: 0.0005,
    myLiquidity: 25000,
    rewards: 45.23,
    type: 'stable',
    riskLevel: 'low',
    boosted: false,
    verified: true,
  },
  {
    id: 4,
    pair: 'BTC/ETH',
    token0: { symbol: 'BTC', icon: '🪙' },
    token1: { symbol: 'ETH', icon: '🔷' },
    tvl: 34567890,
    volume24h: 8901234,
    apy: 0.183,
    fee: 0.003,
    myLiquidity: 0,
    rewards: 0,
    type: 'volatile',
    riskLevel: 'low',
    boosted: false,
    verified: true,
  },
  {
    id: 5,
    pair: 'MATIC/USDC',
    token0: { symbol: 'MATIC', icon: '🟣' },
    token1: { symbol: 'USDC', icon: '💵' },
    tvl: 12345678,
    volume24h: 3456789,
    apy: 0.312,
    fee: 0.003,
    myLiquidity: 5432.10,
    rewards: 67.89,
    type: 'volatile',
    riskLevel: 'medium',
    boosted: true,
    verified: true,
  },
  {
    id: 6,
    pair: 'DAI/USDC',
    token0: { symbol: 'DAI', icon: '📊' },
    token1: { symbol: 'USDC', icon: '💵' },
    tvl: 56789012,
    volume24h: 12345678,
    apy: 0.092,
    fee: 0.0005,
    myLiquidity: 0,
    rewards: 0,
    type: 'stable',
    riskLevel: 'low',
    boosted: false,
    verified: true,
  },
]

const incentives = [
  { name: 'STT Rewards', amount: 1000, icon: '🌟', color: 'text-primary' },
  { name: 'Trading Fees', amount: 0.3, icon: '💸', color: 'text-success', isPercentage: true },
  { name: 'Bonus APY', amount: 5, icon: '🎁', color: 'text-warning', isPercentage: true },
]

export default function PoolsPage() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showOnlyMyPools, setShowOnlyMyPools] = useState(false)
  const [selectedPool, setSelectedPool] = useState<any>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalType, setModalType] = useState<'add' | 'remove'>('add')

  const filteredPools = pools.filter(pool => {
    if (selectedCategory !== 'all' && pool.type !== selectedCategory) return false
    if (showOnlyMyPools && pool.myLiquidity === 0) return false
    if (searchQuery && !pool.pair.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const openModal = (pool: any, type: 'add' | 'remove') => {
    setSelectedPool(pool)
    setModalType(type)
    setModalOpen(true)
  }

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
              Liquidity Pools
              <Droplets className="w-8 h-8 text-primary" />
            </h1>
            <p className="text-muted-foreground">Provide liquidity and earn rewards from trading fees</p>
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Create New Pool
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total TVL</p>
                  <p className="text-2xl font-bold">{formatCurrency(270504902)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-primary/20" />
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">24h Volume</p>
                  <p className="text-2xl font-bold">{formatCurrency(66028378)}</p>
                </div>
                <Activity className="w-8 h-8 text-success/20" />
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg APY</p>
                  <p className="text-2xl font-bold text-success">23.5%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-success/20" />
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">My Positions</p>
                  <p className="text-2xl font-bold">4</p>
                </div>
                <Award className="w-8 h-8 text-warning/20" />
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Filters and Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex gap-2 flex-1">
            {poolCategories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(category.id)}
                className="gap-2"
              >
                {category.name}
                <span className="text-xs opacity-70">({category.count})</span>
              </Button>
            ))}
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search pools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-[200px]"
              />
            </div>
            <Button
              variant={showOnlyMyPools ? 'default' : 'outline'}
              onClick={() => setShowOnlyMyPools(!showOnlyMyPools)}
              className="gap-2"
            >
              {showOnlyMyPools ? <Star className="w-4 h-4" /> : <StarOff className="w-4 h-4" />}
              My Pools
            </Button>
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Current Incentives Banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-6"
      >
        <Card className="glass-card border-primary/50 bg-gradient-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Flame className="w-6 h-6 text-primary animate-pulse" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    Active Incentive Program
                    <Sparkles className="w-4 h-4 text-warning" />
                  </h3>
                  <p className="text-sm text-muted-foreground">Earn extra rewards on selected pools</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                {incentives.map((incentive, index) => (
                  <div key={index} className="text-center">
                    <div className="text-2xl mb-1">{incentive.icon}</div>
                    <div className={`text-sm font-semibold ${incentive.color}`}>
                      {incentive.isPercentage ? `${incentive.amount}%` : formatNumber(incentive.amount)}
                    </div>
                    <div className="text-xs text-muted-foreground">{incentive.name}</div>
                  </div>
                ))}
                <Button variant="outline" size="sm">
                  Learn More
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Pools Grid */}
      <div className="grid gap-4">
        {filteredPools.map((pool, index) => (
          <motion.div
            key={pool.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="glass-card card-hover">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  {/* Pool Info */}
                  <div className="flex items-center gap-4">
                    <div className="flex -space-x-2">
                      <div className="w-12 h-12 rounded-full bg-gradient-card border-2 border-background flex items-center justify-center text-2xl">
                        {pool.token0.icon}
                      </div>
                      <div className="w-12 h-12 rounded-full bg-gradient-card border-2 border-background flex items-center justify-center text-2xl">
                        {pool.token1.icon}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-semibold">{pool.pair}</h3>
                        {pool.verified && <CheckCircle className="w-4 h-4 text-primary" />}
                        {pool.boosted && (
                          <div className="px-2 py-0.5 bg-warning/20 text-warning text-xs rounded-full flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            Boosted
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-muted-foreground">Fee: {formatPercentage(pool.fee)}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          pool.riskLevel === 'low' ? 'bg-success/20 text-success' :
                          pool.riskLevel === 'medium' ? 'bg-warning/20 text-warning' :
                          'bg-error/20 text-error'
                        }`}>
                          {pool.riskLevel} risk
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Pool Stats */}
                  <div className="grid grid-cols-3 gap-8">
                    <div>
                      <p className="text-sm text-muted-foreground">TVL</p>
                      <p className="text-lg font-semibold">{formatCurrency(pool.tvl)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">24h Volume</p>
                      <p className="text-lg font-semibold">{formatCurrency(pool.volume24h)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">APY</p>
                      <p className="text-lg font-semibold text-success">{formatPercentage(pool.apy)}</p>
                    </div>
                  </div>

                  {/* User Position */}
                  {pool.myLiquidity > 0 ? (
                    <div className="text-right border-l border-border/50 pl-6">
                      <p className="text-sm text-muted-foreground">My Liquidity</p>
                      <p className="text-lg font-semibold">{formatCurrency(pool.myLiquidity)}</p>
                      <p className="text-sm text-success">
                        Rewards: {formatCurrency(pool.rewards)}
                      </p>
                    </div>
                  ) : (
                    <div className="w-32"></div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    {pool.myLiquidity > 0 ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openModal(pool, 'remove')}
                          className="gap-1"
                        >
                          <Minus className="w-3 h-3" />
                          Remove
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => openModal(pool, 'add')}
                          className="gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          Add
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={() => openModal(pool, 'add')}
                        className="gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add Liquidity
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Add/Remove Liquidity Modal */}
      <Modal open={modalOpen} onOpenChange={setModalOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>
              {modalType === 'add' ? 'Add Liquidity' : 'Remove Liquidity'}
            </ModalTitle>
            <ModalDescription>
              {modalType === 'add' 
                ? 'Provide liquidity to earn trading fees and rewards'
                : 'Remove your liquidity from the pool'
              }
            </ModalDescription>
          </ModalHeader>
          {selectedPool && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-center gap-2">
                <div className="text-3xl">{selectedPool.token0.icon}</div>
                <Plus className="w-4 h-4 text-muted-foreground" />
                <div className="text-3xl">{selectedPool.token1.icon}</div>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-semibold">{selectedPool.pair}</h3>
                <p className="text-sm text-muted-foreground">
                  Current APY: <span className="text-success">{formatPercentage(selectedPool.apy)}</span>
                </p>
              </div>
              <div className="space-y-2">
                <Input placeholder={`Amount of ${selectedPool.token0.symbol}`} />
                <Input placeholder={`Amount of ${selectedPool.token1.symbol}`} />
              </div>
              <div className="p-4 bg-slate-800/30 rounded-xl space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Share of Pool</span>
                  <span>0.05%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Estimated Rewards</span>
                  <span className="text-success">~$45.23/day</span>
                </div>
              </div>
            </div>
          )}
          <ModalFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setModalOpen(false)}>
              {modalType === 'add' ? 'Add Liquidity' : 'Remove Liquidity'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  )
}