'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  ArrowRight, 
  BarChart3, 
  Shield, 
  Zap, 
  TrendingUp,
  Users,
  Lock,
  Globe,
  Sparkles,
  ChevronRight,
  Activity,
  DollarSign
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const stats = [
  { label: 'Total Value Locked', value: '$2.4B', change: '+12.5%', icon: DollarSign },
  { label: '24h Volume', value: '$342M', change: '+8.3%', icon: Activity },
  { label: 'Active Users', value: '124K', change: '+15.2%', icon: Users },
  { label: 'Total Trades', value: '1.2M', change: '+22.1%', icon: TrendingUp },
]

const features = [
  {
    icon: Shield,
    title: 'Secure & Audited',
    description: 'Multi-sig protection and professionally audited smart contracts ensure your assets are always safe.',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Built on Somnia Network for instant transactions with minimal fees and maximum efficiency.',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    icon: BarChart3,
    title: 'Real-Time Data',
    description: 'Live market data, price charts, and trading insights to make informed decisions.',
    gradient: 'from-orange-500 to-red-500',
  },
  {
    icon: Globe,
    title: 'Cross-Chain Support',
    description: 'Seamlessly bridge assets across multiple chains with our integrated cross-chain protocol.',
    gradient: 'from-green-500 to-emerald-500',
  },
]

const pools = [
  { pair: 'ETH/USDC', apy: '24.5%', tvl: '$342M', volume24h: '$45.2M' },
  { pair: 'BTC/ETH', apy: '18.3%', tvl: '$256M', volume24h: '$38.7M' },
  { pair: 'STT/USDC', apy: '42.1%', tvl: '$128M', volume24h: '$22.4M' },
  { pair: 'MATIC/USDC', apy: '31.2%', tvl: '$89M', volume24h: '$15.8M' },
]

export default function Home() {
  return (
    <div className="relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-mesh opacity-30"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-radial from-gmx-blue-500/20 to-transparent rounded-full blur-3xl"></div>
      
      {/* Hero Section */}
      <section className="relative container mx-auto px-4 py-20 sm:py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-4xl mx-auto"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center px-4 py-2 mb-6 rounded-full bg-gradient-card border border-border/50"
          >
            <Sparkles className="w-4 h-4 mr-2 text-primary" />
            <span className="text-sm font-medium">Introducing Somnia DeFi v2.0</span>
          </motion.div>
          
          <h1 className="text-5xl sm:text-7xl font-bold mb-6">
            <span className="text-gradient">Maximize Your</span>
            <br />
            <span className="text-white">DeFi Potential</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Professional liquidity management platform with AI-powered insights, 
            cross-chain support, and institutional-grade security on Somnia Network.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/trade">
              <Button size="lg" className="group">
                Start Trading
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/pools">
              <Button variant="glass" size="lg">
                Explore Pools
                <ChevronRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="stat-card">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <Icon className="w-5 h-5 text-muted-foreground" />
                      <span className="badge badge-success text-xs">
                        {stat.change}
                      </span>
                    </div>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold mb-4">Why Choose Somnia DeFi?</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Built with institutional traders in mind, our platform offers unmatched features
            for serious DeFi participants.
          </p>
        </motion.div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full card-hover group">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} p-2.5 mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className="w-full h-full text-white" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* Top Pools Section */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold mb-4">Top Liquidity Pools</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Earn competitive yields by providing liquidity to our most active trading pairs.
          </p>
        </motion.div>
        
        <div className="grid gap-4 max-w-4xl mx-auto">
          {pools.map((pool, index) => (
            <motion.div
              key={pool.pair}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="card-hover">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex -space-x-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500"></div>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500"></div>
                      </div>
                      <div>
                        <div className="font-semibold text-lg">{pool.pair}</div>
                        <div className="text-sm text-muted-foreground">TVL: {pool.tvl}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-success text-2xl font-bold">{pool.apy}</div>
                      <div className="text-sm text-muted-foreground">APY</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-medium">{pool.volume24h}</div>
                      <div className="text-sm text-muted-foreground">24h Volume</div>
                    </div>
                    <Link href="/pools">
                      <Button variant="glass" size="sm">
                        Add Liquidity
                        <ArrowRight className="ml-2 w-3 h-3" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative"
        >
          <Card className="overflow-hidden">
            <div className="absolute inset-0 bg-gradient-primary opacity-10"></div>
            <CardContent className="relative p-12 text-center">
              <h2 className="text-4xl font-bold mb-4">Ready to Start?</h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join thousands of traders maximizing their DeFi returns with our advanced platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/trade">
                  <Button size="lg" className="min-w-[200px]">
                    Launch App
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/docs">
                  <Button variant="outline" size="lg" className="min-w-[200px]">
                    Read Documentation
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </section>
    </div>
  )
}