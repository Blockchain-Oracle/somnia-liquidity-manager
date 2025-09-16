'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { Send, Sparkles, Loader2, Bot, Zap, Cpu, Globe, Layers, Binary, Shield, Flame } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAccount, useChainId } from 'wagmi'
import MessageParser from './MessageParser'
import { cn } from '@/lib/utils'

// Floating orb component
const FloatingOrb = ({ delay = 0, size = 100, color = "purple" }) => (
  <motion.div
    className={`absolute rounded-full blur-3xl opacity-20`}
    style={{
      width: size,
      height: size,
      background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
    }}
    animate={{
      x: [0, 30, -30, 0],
      y: [0, -30, 30, 0],
      scale: [1, 1.2, 0.9, 1],
    }}
    transition={{
      duration: 20,
      delay,
      repeat: Infinity,
      ease: "easeInOut",
    }}
  />
);

// Animated grid background
const AnimatedGrid = () => (
  <div className="absolute inset-0 overflow-hidden">
    <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
    <motion.div
      className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"
      animate={{
        opacity: [0.5, 0.8, 0.5],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  </div>
);

// Glowing card wrapper
const GlowCard = ({ children, className, delay = 0 }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, type: "spring", stiffness: 100 }}
    className={cn(
      "relative group",
      className
    )}
  >
    {/* Glow effect */}
    <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200" />
    
    {/* Card content */}
    <div className="relative bg-black/40 backdrop-blur-2xl rounded-2xl border border-white/10 p-6 h-full">
      {children}
    </div>
  </motion.div>
);

export default function FuturisticChatInterface() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [input, setInput] = useState('')
  
  // Futuristic action cards
  const FUTURISTIC_ACTIONS = [
    { 
      title: "Neural Scan", 
      subtitle: "Analyze wallet metrics",
      icon: Cpu, 
      gradient: "from-cyan-500 to-blue-600",
      command: "Check my wallet balance",
      glow: "cyan"
    },
    { 
      title: "Quantum Transfer", 
      subtitle: "Cross-dimensional token teleport",
      icon: Zap, 
      gradient: "from-purple-500 to-pink-600",
      command: "Transfer 10 WSTT to address",
      glow: "purple"
    },
    { 
      title: "Fusion Swap", 
      subtitle: "Molecular token transformation",
      icon: Layers, 
      gradient: "from-orange-500 to-red-600",
      command: "Swap 50 WSTT for tUSDC",
      glow: "orange"
    },
    { 
      title: "Wormhole Bridge", 
      subtitle: "Inter-chain quantum tunneling",
      icon: Globe, 
      gradient: "from-green-500 to-emerald-600",
      command: "Bridge 100 tUSDC to Polygon",
      glow: "green"
    },
    { 
      title: "NFT Genesis", 
      subtitle: "Launch your collection",
      icon: Sparkles, 
      gradient: "from-pink-500 to-rose-600",
      command: "Create an NFT collection called 'Cyber Dreams' with 1000 supply",
      glow: "pink"
    },
    { 
      title: "AI Artisan", 
      subtitle: "Generate quantum artwork",
      icon: Flame, 
      gradient: "from-indigo-500 to-purple-600",
      command: "Generate artwork for my NFT collection",
      glow: "indigo"
    }
  ]

  const { 
    messages,
    sendMessage,
    status,
    stop,
    setMessages,
    error
  } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
    onError: (error) => {
      console.error('Chat error:', error)
    }
  })

  const handleActionClick = (command: string) => {
    if (address && command.includes('address')) {
      command = command.replace('address', address)
    }
    sendMessage({ text: command }, { body: { walletAddress: address } })
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    
    sendMessage({ text: input }, { body: { walletAddress: address } })
    setInput('')
  }

  const isLoading = status === 'submitted' || status === 'streaming'

  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      {/* Animated background elements */}
      <AnimatedGrid />
      
      {/* Floating orbs */}
      <FloatingOrb delay={0} size={300} color="purple" />
      <FloatingOrb delay={2} size={200} color="cyan" />
      <FloatingOrb delay={4} size={250} color="pink" />
      
      {/* Particle field */}
      <div className="absolute inset-0">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [-20, 20],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <motion.div
            className="inline-flex items-center gap-3 mb-4"
            animate={{
              filter: [
                "hue-rotate(0deg)",
                "hue-rotate(360deg)",
              ],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <Bot className="w-10 h-10 text-cyan-400" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              SOMNIA AI
            </h1>
          </motion.div>
          <p className="text-gray-400 text-lg">
            Your quantum-powered DeFi assistant
          </p>
        </motion.div>

        {/* Chat messages or action grid */}
        {messages.length === 0 ? (
          <div className="space-y-8">
            {/* Welcome message */}
            <GlowCard className="max-w-2xl mx-auto text-center">
              <motion.div
                animate={{
                  scale: [1, 1.02, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
              >
                <h2 className="text-2xl font-bold text-white mb-2">
                  Welcome to the Future of DeFi
                </h2>
                <p className="text-gray-400">
                  Execute quantum transactions across multiple dimensions
                </p>
              </motion.div>
            </GlowCard>

            {/* Action cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {FUTURISTIC_ACTIONS.map((action, index) => (
                <motion.button
                  key={index}
                  onClick={() => handleActionClick(action.command)}
                  onHoverStart={() => setHoveredCard(index)}
                  onHoverEnd={() => setHoveredCard(null)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative group"
                >
                  {/* Animated border */}
                  <motion.div
                    className={cn(
                      "absolute -inset-0.5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity",
                      `bg-gradient-to-r ${action.gradient}`
                    )}
                    animate={{
                      rotate: [0, 360],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    style={{
                      filter: hoveredCard === index ? "blur(8px)" : "blur(4px)",
                    }}
                  />
                  
                  {/* Card content */}
                  <div className="relative bg-black/80 backdrop-blur-xl rounded-2xl border border-white/10 p-6 h-full">
                    <div className="flex flex-col items-start space-y-4">
                      {/* Icon with glow */}
                      <div className="relative">
                        <motion.div
                          className={cn(
                            "absolute inset-0 rounded-full",
                            `bg-${action.glow}-500/30`
                          )}
                          animate={{
                            scale: [1, 1.5, 1],
                            opacity: [0.5, 0.8, 0.5],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                          }}
                          style={{
                            filter: "blur(20px)",
                          }}
                        />
                        <action.icon className={cn(
                          "w-8 h-8 relative z-10",
                          `text-${action.glow}-400`
                        )} />
                      </div>
                      
                      {/* Text */}
                      <div className="text-left">
                        <h3 className="text-white font-bold text-lg">
                          {action.title}
                        </h3>
                        <p className="text-gray-500 text-sm">
                          {action.subtitle}
                        </p>
                      </div>
                      
                      {/* Hover indicator */}
                      <motion.div
                        className="absolute bottom-2 right-2"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{
                          opacity: hoveredCard === index ? 1 : 0,
                          scale: hoveredCard === index ? 1 : 0,
                        }}
                      >
                        <Sparkles className="w-4 h-4 text-white/50" />
                      </motion.div>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-4 mb-32">
            <AnimatePresence>
              {messages.map((message) => (
                <MessageParser
                  key={message.id}
                  message={message}
                  isLoading={isLoading && message === messages[messages.length - 1]}
                  onSendMessage={(text) => {
                    sendMessage({ text }, { body: { walletAddress: address } })
                  }}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Futuristic input */}
        <motion.div
          className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/90 to-transparent"
          initial={{ y: 100 }}
          animate={{ y: 0 }}
        >
          <form onSubmit={onSubmit} className="max-w-4xl mx-auto">
            <GlowCard className="p-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Enter quantum command..."
                    disabled={isLoading}
                    className="bg-black/50 border-white/10 text-white placeholder:text-gray-500 pr-10"
                  />
                  <motion.div
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    animate={{
                      rotate: isLoading ? 360 : 0,
                    }}
                    transition={{
                      duration: 1,
                      repeat: isLoading ? Infinity : 0,
                      ease: "linear",
                    }}
                  >
                    <Binary className="w-5 h-5 text-purple-400" />
                  </motion.div>
                </div>
                
                <Button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className={cn(
                    "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700",
                    "border-0 text-white font-bold"
                  )}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </Button>
              </div>
            </GlowCard>
          </form>
        </motion.div>
      </div>
    </div>
  )
}