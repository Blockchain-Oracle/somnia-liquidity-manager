'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import ChatInterface from '@/components/ai/ChatInterface'
import { AnimatedBackground } from '@/components/ui/AnimatedBackground'
import { TransformCard } from '@/components/ui/TransformCard'
import Terminal from '@/components/ui/Terminal'
import { Typography } from '@/components/ui/Typography'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { 
  Bot, 
  Sparkles, 
  Cpu, 
  Zap, 
  Shield, 
  Brain,
  Activity,
  TrendingUp,
  Code2,
  GitBranch,
  Layers,
  Globe
} from 'lucide-react'

// AI capabilities showcase
const aiCapabilities = [
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Sub-second response time',
    gradient: 'from-yellow-500 to-orange-500'
  },
  {
    icon: Shield,
    title: 'Secure Execution',
    description: 'Multi-sig transaction safety',
    gradient: 'from-blue-500 to-cyan-500'
  },
  {
    icon: Brain,
    title: 'Smart Analysis',
    description: 'Real-time market insights',
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    icon: Globe,
    title: 'Cross-Chain',
    description: 'Multi-network support',
    gradient: 'from-green-500 to-emerald-500'
  }
]

// Sample commands for terminal
const sampleCommands = [
  { command: 'Check my wallet balance', type: 'query' },
  { command: 'Swap 100 SOMI for USDC', type: 'action' },
  { command: 'Bridge assets to Polygon', type: 'bridge' },
  { command: 'Show top liquidity pools', type: 'query' },
  { command: 'Add liquidity to SOMI/USDC', type: 'action' }
]

export default function AIAssistantPage() {
  const [activeCommand, setActiveCommand] = useState(0)
  const [stats, setStats] = useState({
    requests: 124542,
    successRate: 99.8,
    avgTime: 0.3
  })

  // Animate stats
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        requests: prev.requests + Math.floor(Math.random() * 5),
        successRate: 99.8,
        avgTime: 0.3 + (Math.random() * 0.2 - 0.1)
      }))
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  // Rotate sample commands
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveCommand(prev => (prev + 1) % sampleCommands.length)
    }, 4000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      {/* Animated backgrounds */}
      <AnimatedBackground 
        variant="blobs" 
        colors={['#8b5cf6', '#ec4899', '#06b6d4']} 
        intensity="low" 
        opacity={0.08} 
      />
      <AnimatedBackground 
        variant="grid" 
        colors={['#8b5cf6']} 
        opacity={0.02} 
      />

      {/* Header Section */}
      <section className="relative container mx-auto px-4 pt-12 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center px-4 py-2 mb-6 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30"
          >
            <Bot className="w-4 h-4 mr-2 text-purple-400" />
            <span className="text-sm font-medium">AI-Powered DeFi Assistant</span>
          </motion.div>

          <Typography variant="h1" className="mb-4">
            <span className="text-white">Meet Your </span>
            <Typography variant="h1" gradient="purple" as="span">
              AI Trading Partner
            </Typography>
          </Typography>

          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Natural language interface for complex DeFi operations. 
            Just describe what you want to do, and let AI handle the rest.
          </p>
        </motion.div>
      </section>


      {/* Main Chat Interface - Full Width */}
      <section className="container mx-auto px-4 pb-8">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <TransformCard
              rotation="rotate-0"
              background="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
              border="border border-gray-700/50"
              className="h-[calc(100vh-320px)] min-h-[600px] overflow-hidden"
              animate={false}
            >
              <div className="h-full flex flex-col">
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-700/50 bg-gray-800/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-500/20 rounded-lg">
                        <Bot className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">AI Assistant</h3>
                        <StatusBadge variant="success" pulse>
                          Online
                        </StatusBadge>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Terminal title="status.sh" className="hidden lg:block">
                        <Terminal.Line type="success" output="GPT-4o-mini" />
                      </Terminal>
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-green-400" />
                        <span className="text-xs text-gray-400">Real-time</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chat Interface */}
                <div className="flex-1 overflow-hidden">
                  <ChatInterface />
                </div>
              </div>
            </TransformCard>
          </motion.div>
        </div>
      </section>

    </div>
  )
}