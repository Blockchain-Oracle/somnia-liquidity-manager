'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import ModernStargateBridge from '@/components/Bridge/ModernStargateBridge'
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
        // MAINNET: Full Bridge Interface - Use the new modern design full screen
        <ModernStargateBridge />
      )}
    </div>
  )
}