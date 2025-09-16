'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence, useAnimation } from 'framer-motion'
import { 
  ArrowRight, 
  BarChart3, 
  Shield, 
  Zap, 
  TrendingUp,
  Users,
  Globe,
  ChevronRight,
  Activity,
  DollarSign,
  Bot,
  Layers,
  Cpu,
  GitBranch,
  Terminal as TerminalIcon,
  Code2,
  Wallet,
  ArrowUpRight,
  Trophy,
  Target,
  Rocket,
  CheckCircle,
  Calendar,
  Star,
  ShoppingBag
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AnimatedBackground } from '@/components/ui/AnimatedBackground'
import { TransformCard } from '@/components/ui/TransformCard'
import Terminal from '@/components/ui/Terminal'
import { Typography } from '@/components/ui/Typography'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { InteractiveShowcase } from '@/components/ui/InteractiveShowcase'

// Milestones data
const milestones = [
  {
    id: 'launch',
    date: 'Q4 2024',
    title: 'Platform Launch',
    description: 'Somnia Liquidity Manager goes live with core trading features',
    icon: Rocket,
    status: 'completed',
    metrics: { status: 'Live', network: 'Testnet' },
    gradient: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'ai-integration',
    date: 'Q1 2025',
    title: 'AI Assistant Integration',
    description: 'Revolutionary AI-powered DeFi operations with natural language',
    icon: Bot,
    status: 'completed',
    metrics: { status: 'Active', features: 'NLP' },
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    id: 'bridge-launch',
    date: 'Q1 2025',
    title: 'Cross-Chain Bridge',
    description: 'Seamless asset transfers across 6+ major blockchains',
    icon: Globe,
    status: 'completed',
    metrics: { chains: '6+', status: 'Active' },
    gradient: 'from-green-500 to-emerald-500'
  },
  {
    id: 'nft-marketplace',
    date: 'Q1 2025',
    title: 'NFT Marketplace Launch',
    description: 'Secure escrow-based NFT trading with competitive 2.5% fees',
    icon: ShoppingBag,
    status: 'completed',
    metrics: { status: 'Testnet', type: 'Escrow' },
    gradient: 'from-purple-500 to-indigo-500'
  },
  {
    id: 'v2-release',
    date: 'Q2 2025',
    title: 'Platform V2.0',
    description: 'Enhanced UI, advanced trading algorithms, and institutional features',
    icon: Star,
    status: 'in-progress',
    metrics: { status: 'Coming', quarter: 'Q4' },
    gradient: 'from-yellow-500 to-orange-500'
  },
  {
    id: 'dao-launch',
    date: 'Q1 2025',
    title: 'DAO Governance',
    description: 'Community-driven protocol governance and decision making',
    icon: Users,
    status: 'upcoming',
    metrics: { status: 'Planned', quarter: 'Q1' },
    gradient: 'from-cyan-500 to-blue-500'
  },
  {
    id: 'mobile-app',
    date: 'Q2 2025',
    title: 'Mobile Trading App',
    description: 'Trade on the go with our native iOS and Android applications',
    icon: Target,
    status: 'upcoming',
    metrics: { platforms: 'iOS/Android', features: 'Full parity' },
    gradient: 'from-pink-500 to-purple-500'
  }
]

// Milestones Carousel Component
const MilestonesCarousel = () => {
  const [activeIndex, setActiveIndex] = useState(3) // Start with current milestone
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  useEffect(() => {
    if (!isAutoPlaying) return
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % milestones.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [isAutoPlaying])

  const handleSelect = (index: number) => {
    setActiveIndex(index)
    setIsAutoPlaying(false)
  }

  return (
    <div className="relative">
      {/* Timeline */}
      <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gray-800 -translate-y-1/2 z-0">
        <motion.div 
          className="h-full bg-gradient-to-r from-transparent via-primary to-transparent"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
        />
      </div>

      {/* Milestones Grid */}
      <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {milestones.slice(0, 6).map((milestone, index) => {
          const isActive = index === activeIndex
          const isCompleted = milestone.status === 'completed'
          const isInProgress = milestone.status === 'in-progress'
          
          return (
            <motion.div
              key={milestone.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              onClick={() => handleSelect(index)}
              className={`cursor-pointer transition-all ${
                isActive ? 'scale-105' : 'scale-100 opacity-70 hover:opacity-100'
              }`}
            >
              <TransformCard
                rotation={isActive ? 'rotate-0' : index % 2 === 0 ? 'rotate-1' : '-rotate-1'}
                background={`bg-gradient-to-br ${
                  isActive ? milestone.gradient : 'from-gray-900 to-gray-800'
                }`}
                border={`border ${
                  isActive ? 'border-primary/50' : 'border-gray-700/50'
                }`}
                className="p-6 h-full"
                animate={isActive}
              >
                {/* Status Badge */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-400 font-mono">{milestone.date}</span>
                  </div>
                  {isCompleted && (
                    <StatusBadge variant="success">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Completed
                    </StatusBadge>
                  )}
                  {isInProgress && (
                    <StatusBadge variant="warning" pulse>
                      <Activity className="w-3 h-3 mr-1" />
                      In Progress
                    </StatusBadge>
                  )}
                  {milestone.status === 'upcoming' && (
                    <StatusBadge variant="default">
                      <Target className="w-3 h-3 mr-1" />
                      Upcoming
                    </StatusBadge>
                  )}
                </div>

                {/* Icon & Title */}
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${
                    isActive ? 'bg-white/10' : 'bg-gray-800/50'
                  }`}>
                    <milestone.icon className={`w-5 h-5 ${
                      isActive ? 'text-white' : 'text-gray-400'
                    }`} />
                  </div>
                  <h3 className="font-semibold text-white">{milestone.title}</h3>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-400 mb-4">
                  {milestone.description}
                </p>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(milestone.metrics).map(([key, value]) => (
                    <div key={key} className="text-center p-2 bg-gray-800/30 rounded">
                      <div className="text-xs text-gray-500 capitalize">{key}</div>
                      <div className="text-sm font-semibold text-white">{value}</div>
                    </div>
                  ))}
                </div>

                {/* Progress Indicator */}
                {isActive && (
                  <motion.div 
                    className="absolute -bottom-2 left-1/2 transform -translate-x-1/2"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <ChevronRight className="w-6 h-6 text-primary rotate-90" />
                  </motion.div>
                )}
              </TransformCard>
            </motion.div>
          )
        })}
      </div>

      {/* Navigation Dots */}
      <div className="flex justify-center gap-2">
        {milestones.map((_, index) => (
          <button
            key={index}
            onClick={() => handleSelect(index)}
            className={`transition-all ${
              index === activeIndex
                ? 'w-8 h-2 bg-primary rounded-full'
                : 'w-2 h-2 bg-gray-600 rounded-full hover:bg-gray-500'
            }`}
            aria-label={`Go to milestone ${index + 1}`}
          />
        ))}
      </div>

      {/* Auto-play indicator */}
      {isAutoPlaying && (
        <div className="absolute top-0 right-0 flex items-center gap-2 text-xs text-gray-500">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          Auto-playing
        </div>
      )}
    </div>
  )
}

// Feature items for showcase
const showcaseFeatures = [
  {
    id: 'ai-trading',
    name: 'AI-Powered Trading',
    title: 'Intelligent DeFi Assistant',
    description: 'Natural language interface for complex DeFi operations. Just describe what you want to do.',
    icon: Bot,
    gradient: 'from-purple-500 to-pink-500',
    codeExample: 'ai.execute("Swap 100 SOMI for USDC")',
    status: 'LIVE',
    stats: { status: 'Live', mode: 'Testnet' }
  },
  {
    id: 'cross-chain',
    name: 'Cross-Chain Bridge',
    title: 'Seamless Asset Transfer',
    description: 'Bridge assets across multiple chains with minimal fees and maximum security.',
    icon: Globe,
    gradient: 'from-blue-500 to-cyan-500',
    codeExample: 'bridge.transfer("USDC", "Polygon", 1000)',
    status: 'LIVE',
    stats: { chains: '6+', status: 'Active' }
  },
  {
    id: 'nft-marketplace',
    name: 'NFT Marketplace',
    title: 'Trade NFTs Securely',
    description: 'Buy and sell NFTs with escrow-based security, competitive 2.5% fees, and instant settlement.',
    icon: ShoppingBag,
    gradient: 'from-purple-500 to-indigo-500',
    codeExample: 'marketplace.list(nftAddress, tokenId, price)',
    status: 'TESTNET',
    stats: { status: 'Testnet', type: 'Escrow' }
  },
  {
    id: 'liquidity',
    name: 'Liquidity Pools',
    title: 'Maximize Your Yields',
    description: 'Provide liquidity and earn competitive APYs with automated position management.',
    icon: Layers,
    gradient: 'from-green-500 to-emerald-500',
    codeExample: 'pool.addLiquidity("SOMI/USDC", amount)',
    status: 'LIVE',
    stats: { status: 'Active', type: 'AMM' }
  },
  {
    id: 'smart-routing',
    name: 'Smart Order Routing',
    title: 'Best Price Execution',
    description: 'AI-powered routing finds the best prices across multiple DEXs and liquidity sources.',
    icon: GitBranch,
    gradient: 'from-orange-500 to-red-500',
    codeExample: 'router.findBestPath("ETH", "USDC", size)',
    status: 'BETA',
    stats: { status: 'Beta', mode: 'Testing' }
  }
]


// Main content component for showcase
const FeatureMainContent = ({ item, index }: { item: any; index: number }) => {
  const Icon = item.icon
  return (
    <TransformCard
      rotation="rotate-1"
      background="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
      border="border border-gray-700/50"
      shadow="2xl"
      className="p-8"
      delay={0.2}
    >
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl bg-gradient-to-br ${item.gradient}`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">{item.title}</h3>
              <StatusBadge variant={item.status === 'LIVE' ? 'success' : 'warning'} pulse>
                {item.status}
              </StatusBadge>
            </div>
          </div>
        </div>
        
        <p className="text-gray-300 text-lg leading-relaxed">{item.description}</p>
        
        <Terminal title="example.sh">
          <Terminal.Line type="comment" output="// Initialize feature" />
          <Terminal.Line command={item.codeExample} />
          <Terminal.Line type="success" output="Transaction successful" />
        </Terminal>
        
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(item.stats).map(([key, value]) => (
            <div key={key} className="bg-gray-800/50 rounded-lg p-3">
              <div className="text-2xl font-bold text-white">{value as string}</div>
              <div className="text-sm text-gray-400 capitalize">{key}</div>
            </div>
          ))}
        </div>
        
        <Button className="w-full" size="lg">
          Try {item.name}
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </TransformCard>
  )
}

// Sidebar item component for showcase
const FeatureSidebarItem = ({ item, index, isActive, onClick }: any) => {
  const Icon = item.icon
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className={`cursor-pointer p-3 rounded-lg transition-all ${
        isActive 
          ? 'bg-gradient-to-r from-primary/20 to-purple-500/20 border-l-4 border-primary' 
          : 'hover:bg-gray-800/50'
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-gray-400'}`} />
        <div className="flex-1">
          <div className={`font-medium ${isActive ? 'text-white' : 'text-gray-300'}`}>
            {item.name}
          </div>
          <div className="text-xs text-gray-500">{item.status}</div>
        </div>
      </div>
    </motion.div>
  )
}

export default function Home() {
  const [typedText, setTypedText] = useState('')
  const [showCursor, setShowCursor] = useState(true)
  const fullText = 'Liquidity Infrastructure for the Autonomous Internet'
  
  useEffect(() => {
    let index = 0
    const interval = setInterval(() => {
      if (index <= fullText.length) {
        setTypedText(fullText.slice(0, index))
        index++
      } else {
        clearInterval(interval)
      }
    }, 50)
    
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev)
    }, 500)
    
    return () => {
      clearInterval(interval)
      clearInterval(cursorInterval)
    }
  }, [])

  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      {/* Animated backgrounds */}
      <AnimatedBackground variant="blobs" colors={['#3b82f6', '#8b5cf6', '#10b981']} intensity="medium" opacity={0.1} />
      <AnimatedBackground variant="grid" colors={['#3b82f6']} opacity={0.03} />
      
      {/* Hero Section */}
      <section className="relative container mx-auto px-4 py-20 sm:py-32">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-7xl mx-auto"
        >
          {/* Terminal-style intro */}
          <div className="mb-12">
            <Terminal title="somnia-defi.sh">
              <Terminal.Line command="./initialize --mode=production" />
              <Terminal.Line type="output" output="✓ Initializing Somnia DeFi Infrastructure..." />
              <Terminal.Line type="success" output="// Ready to revolutionize DeFi" />
            </Terminal>
          </div>
          
          {/* Main heading */}
          <div className="text-center space-y-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
              className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/30"
            >
              <span className="text-sm font-medium">Powered by Somnia Network</span>
            </motion.div>
            
            <div>
              <Typography variant="h1" className="mb-4">
                <span className="text-white">Next-Gen </span>
                <Typography variant="h1" gradient="brand" as="span">
                  DeFi Protocol
                </Typography>
              </Typography>
              
              <div className="h-8 flex items-center justify-center">
                <span className="text-xl text-gray-400 font-mono">
                  {typedText}
                  {showCursor && <span className="ml-1 inline-block w-3 h-6 bg-primary animate-pulse" />}
                </span>
              </div>
            </div>
            
            <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Professional liquidity management with{' '}
              <span className="text-primary">AI-powered trading</span>,{' '}
              <span className="text-green-500">cross-chain bridges</span>,{' '}
              <span className="text-purple-500">NFT marketplace</span>, and{' '}
              <span className="text-blue-500">institutional-grade security</span>{' '}
              on Somnia Network.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Link href="/trade">
                <Button size="lg" className="group min-w-[200px]">
                  Launch App
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/marketplace">
                <Button variant="outline" size="lg" className="min-w-[200px] border-purple-500/30 hover:bg-purple-500/10">
                  <ShoppingBag className="mr-2 w-4 h-4" />
                  NFT Marketplace
                </Button>
              </Link>
              <Link href="/ai">
                <Button variant="outline" size="lg" className="min-w-[200px] border-purple-500/30 hover:bg-purple-500/10">
                  <Bot className="mr-2 w-4 h-4" />
                  AI Assistant
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </section>


      {/* Interactive Feature Showcase */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <Typography variant="h2" className="mb-4">
            <span className="text-white">Platform </span>
            <Typography variant="h2" gradient="brand" as="span">
              Features_
            </Typography>
          </Typography>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Battle-tested infrastructure powering the next generation of DeFi
          </p>
        </div>
        
        <InteractiveShowcase
          items={showcaseFeatures}
          MainContent={FeatureMainContent}
          SidebarItem={FeatureSidebarItem}
          terminalTitle="features.sh"
          rotationInterval={8000}
        />
      </section>

      {/* Vision Section */}
      <section className="relative py-20 lg:py-32">
        <AnimatedBackground variant="lines" colors={['#3b82f6', '#8b5cf6']} opacity={0.1} />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div>
                <Typography variant="h2" className="mb-6">
                  <span className="text-white">Building the </span>
                  <Typography variant="h2" gradient="green" as="span">
                    Future of Finance
                  </Typography>
                </Typography>
                <p className="text-gray-400 text-lg leading-relaxed">
                  When smart contracts become autonomous, liquidity flows seamlessly, 
                  and AI agents execute complex strategies — that's the future we're building.
                </p>
              </div>
              
              <div className="space-y-4">
                <TransformCard rotation="rotate-1" className="p-6">
                  <div className="flex items-center gap-4">
                    <Cpu className="w-8 h-8 text-primary" />
                    <div>
                      <h4 className="text-white font-semibold">AI-Native Infrastructure</h4>
                      <p className="text-sm text-gray-400">Natural language DeFi operations</p>
                    </div>
                  </div>
                </TransformCard>
                
                <TransformCard rotation="-rotate-1" className="p-6">
                  <div className="flex items-center gap-4">
                    <Shield className="w-8 h-8 text-green-500" />
                    <div>
                      <h4 className="text-white font-semibold">Multi-Sig Security</h4>
                      <p className="text-sm text-gray-400">Institutional-grade protection</p>
                    </div>
                  </div>
                </TransformCard>
                
                <TransformCard rotation="rotate-1" className="p-6">
                  <div className="flex items-center gap-4">
                    <Zap className="w-8 h-8 text-purple-500" />
                    <div>
                      <h4 className="text-white font-semibold">Lightning Fast</h4>
                      <p className="text-sm text-gray-400">Sub-second transaction finality</p>
                    </div>
                  </div>
                </TransformCard>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="relative h-[500px] rounded-3xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black" />
                
                {/* Terminal Demo */}
                <div className="relative h-full p-8 flex flex-col justify-center">
                  <Terminal title="somnia.sh">
                    <Terminal.Line type="command" command="somnia status" />
                    <Terminal.Line type="success" output="✓ Network: Active" />
                    <Terminal.Line type="success" output="✓ Mode: Testnet" />
                    <Terminal.Line type="success" output="✓ Bridge: Connected" />
                    <Terminal.Line type="success" output="✓ Marketplace: Running" />
                    <Terminal.Line type="success" output="✓ AI Assistant: Online" />
                  </Terminal>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Milestones Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <AnimatedBackground variant="dots" colors={['#06b6d4', '#8b5cf6']} opacity={0.05} />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center px-4 py-2 mb-6 rounded-full bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30">
              <Trophy className="w-4 h-4 mr-2 text-green-400" />
              <span className="text-sm font-medium">Our Journey</span>
            </div>
            
            <Typography variant="h2" className="mb-4">
              <span className="text-white">Milestones & </span>
              <Typography variant="h2" gradient="green" as="span">
                Achievements
              </Typography>
            </Typography>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              From inception to industry leader - tracking our journey of innovation
            </p>
          </motion.div>

          <MilestonesCarousel />
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <TransformCard
            rotation="rotate-0"
            background="bg-gradient-to-br from-primary/20 via-purple-500/20 to-green-500/20"
            border="border border-primary/30"
            className="p-12 text-center"
          >
            <Typography variant="h2" className="mb-4">
              <span className="text-white">Ready to </span>
              <Typography variant="h2" gradient="brand" as="span">
                Get Started?
              </Typography>
            </Typography>
            <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
              Join thousands of traders maximizing their returns with our advanced DeFi platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/trade">
                <Button size="lg" className="min-w-[200px]">
                  Start Trading
                  <ArrowUpRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link href="/bridge">
                <Button variant="outline" size="lg" className="min-w-[200px]">
                  <Globe className="mr-2 w-4 h-4" />
                  Bridge Assets
                </Button>
              </Link>
            </div>
          </TransformCard>
        </motion.div>
      </section>
    </div>
  )
}