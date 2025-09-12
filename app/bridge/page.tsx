'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import EnhancedStargateBridge from '@/components/Bridge/EnhancedStargateBridge'
import { useNetwork } from '@/lib/hooks/useNetwork'
import { AnimatedBackground } from '@/components/ui/AnimatedBackground'
import { TransformCard } from '@/components/ui/TransformCard'
import Terminal from '@/components/ui/Terminal'
import { Typography } from '@/components/ui/Typography'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { 
  AlertTriangle,
  Globe,
  ArrowRight,
  Zap,
  Shield,
  Activity,
  Clock,
  ChevronRight,
  Sparkles,
  Network,
  Layers,
  Link2,
  TrendingUp,
  Lock,
  CheckCircle,
  ArrowUpRight,
  Wallet
} from 'lucide-react'

// Supported chains for bridging
const supportedChains = [
  { name: 'Somnia', id: 5031, color: 'from-blue-500 to-cyan-500', icon: '🌙' },
  { name: 'Polygon', id: 137, color: 'from-purple-500 to-pink-500', icon: '🟣' },
  { name: 'Arbitrum', id: 42161, color: 'from-blue-600 to-blue-400', icon: '🔷' },
  { name: 'Optimism', id: 10, color: 'from-red-500 to-red-400', icon: '🔴' },
  { name: 'Base', id: 8453, color: 'from-blue-400 to-blue-600', icon: '🔵' },
  { name: 'Avalanche', id: 43114, color: 'from-red-600 to-red-400', icon: '🔺' }
]

// Bridge features
const bridgeFeatures = [
  { icon: Zap, label: 'Fast Transfers', value: '~2 min', color: 'text-yellow-400' },
  { icon: Shield, label: 'Secure', value: 'Audited', color: 'text-green-400' },
  { icon: Globe, label: 'Networks', value: '6+', color: 'text-blue-400' },
  { icon: Lock, label: 'Protection', value: 'Multi-sig', color: 'text-purple-400' }
]

// Bridge stats
const bridgeStats = [
  { label: 'Total Bridged', value: '$1.2B+', change: '+15.2%', icon: TrendingUp },
  { label: 'Daily Volume', value: '$42M', change: '+8.3%', icon: Activity },
  { label: 'Active Routes', value: '124', change: '+12', icon: Network },
  { label: 'Avg Time', value: '2.1 min', change: '-0.3', icon: Clock }
]

export default function BridgePage() {
  const { isTestnet } = useNetwork()
  const [selectedRoute, setSelectedRoute] = useState(0)
  const [recentTransfers, setRecentTransfers] = useState<any[]>([])
  
  // Simulate recent transfers
  useEffect(() => {
    const interval = setInterval(() => {
      setRecentTransfers(prev => {
        const newTransfer = {
          from: supportedChains[Math.floor(Math.random() * supportedChains.length)].name,
          to: supportedChains[Math.floor(Math.random() * supportedChains.length)].name,
          amount: (Math.random() * 1000).toFixed(2),
          token: ['USDC', 'USDT', 'ETH', 'SOMI'][Math.floor(Math.random() * 4)],
          time: new Date().toLocaleTimeString()
        }
        return [newTransfer, ...prev.slice(0, 4)]
      })
    }, 5000)
    
    return () => clearInterval(interval)
  }, [])

  // Route rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setSelectedRoute(prev => (prev + 1) % supportedChains.length)
    }, 4000)
    
    return () => clearInterval(interval)
  }, [])
  
  return (
    <div className="relative min-h-screen bg-black">
      {/* Animated backgrounds */}
      <AnimatedBackground 
        variant="blobs" 
        colors={['#06b6d4', '#8b5cf6', '#10b981']} 
        intensity="low" 
        opacity={0.08} 
      />
      <AnimatedBackground 
        variant="grid" 
        colors={['#06b6d4']} 
        opacity={0.02} 
      />

      {isTestnet ? (
        // TESTNET: Not available message
        <div className="container mx-auto px-4 pt-20 py-8">
          <div className="max-w-2xl mx-auto">
            <TransformCard
              rotation="rotate-0"
              background="bg-gradient-to-br from-yellow-900/20 via-orange-900/20 to-red-900/20"
              border="border border-yellow-500/30"
              className="p-8 text-center"
            >
              <AlertTriangle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              <Typography variant="h3" className="mb-3">
                <span className="text-yellow-400">Bridge Not Available</span>
              </Typography>
              <p className="text-gray-400 mb-6">
                Cross-chain bridging is only available on mainnet. 
                Switch to Somnia Mainnet to unlock bridge functionality.
              </p>
              
              <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto mb-6">
                <div className="p-3 bg-gray-800/50 rounded-lg">
                  <p className="text-xl font-bold text-white">6+</p>
                  <p className="text-xs text-gray-400">Supported Chains</p>
                </div>
                <div className="p-3 bg-gray-800/50 rounded-lg">
                  <p className="text-xl font-bold text-white">$1.2B</p>
                  <p className="text-xs text-gray-400">Total Bridged</p>
                </div>
              </div>

              <Terminal title="network-check.sh">
                <Terminal.Line command="checkNetwork --current" />
                <Terminal.Line type="error" output="✗ Current network: Testnet" />
                <Terminal.Line type="output" output="Bridge requires: Mainnet" />
                <Terminal.Line type="comment" output="// Switch to mainnet to continue" />
              </Terminal>
            </TransformCard>
          </div>
        </div>
      ) : (
        // MAINNET: Full Bridge Interface
        <div className="container mx-auto px-4 pt-8 pb-4">
          <div className="grid lg:grid-cols-4 gap-4 max-w-7xl mx-auto">
            {/* Left Side - Chain Routes (Compact) */}
            <div className="lg:col-span-1 space-y-3">
              <TransformCard
                rotation="-rotate-0.5"
                background="bg-gradient-to-br from-gray-900 to-gray-800"
                className="p-3 h-fit"
              >
                <h3 className="text-white font-semibold mb-2 flex items-center gap-1.5 text-xs">
                  <Network className="w-3.5 h-3.5 text-cyan-400" />
                  Routes
                </h3>
                
                <div className="space-y-0.5">
                  {supportedChains.map((chain, index) => (
                    <motion.div
                      key={chain.id}
                      animate={{
                        scale: index === selectedRoute ? 1.02 : 1,
                        x: index === selectedRoute ? 5 : 0
                      }}
                      className={`py-1.5 px-2 rounded cursor-pointer transition-all ${
                        index === selectedRoute 
                          ? 'bg-cyan-500/20 border-l-2 border-cyan-500' 
                          : 'bg-gray-800/50 hover:bg-gray-700/50'
                      }`}
                      onClick={() => setSelectedRoute(index)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs">{chain.icon}</span>
                          <span className={`text-xs font-medium ${
                            index === selectedRoute ? 'text-white' : 'text-gray-300'
                          }`}>
                            {chain.name}
                          </span>
                        </div>
                        <ChevronRight className={`w-3 h-3 ${
                          index === selectedRoute ? 'text-cyan-400' : 'text-gray-500'
                        }`} />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </TransformCard>

              {/* Live Transfers Terminal */}
              <Terminal title="live.log" className="h-fit">
                <Terminal.Line type="comment" output="// Activity" />
                {recentTransfers.slice(0, 2).map((transfer, i) => (
                  <Terminal.Line
                    key={i}
                    type="success"
                    output={`${transfer.from.slice(0,3)}→${transfer.to.slice(0,3)}: ${transfer.amount} ${transfer.token}`}
                  />
                ))}
              </Terminal>
            </div>

            {/* Right - Main Bridge Interface (Much Bigger) */}
            <div className="lg:col-span-3">
              <TransformCard
                rotation="rotate-0"
                background="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
                border="border border-gray-700/50"
                className="p-1"
                animate={false}
              >
                <EnhancedStargateBridge />
              </TransformCard>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}