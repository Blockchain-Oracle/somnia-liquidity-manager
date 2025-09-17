'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  X,
  Sparkles,
  Activity,
  Globe,
  Zap,
  Shield,
  TrendingUp,
  Users,
  DollarSign,
  Lock
} from 'lucide-react'
import { Input } from '@/components/ui/input'

interface ChainConfig {
  name: string
  logo: string
  color: string
  gradient: string
  nativeToken: string
  tvl?: string
  gasPrice?: string
  txSpeed?: string
  popular?: boolean
}

interface ChainSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (chain: string) => void
  chains: Record<string, ChainConfig>
  selectedChain: string
  otherChain: string
  direction: 'from' | 'to'
}

export function ChainSelectionModal({
  isOpen,
  onClose,
  onSelect,
  chains,
  selectedChain,
  otherChain,
  direction
}: ChainSelectionModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [hoveredChain, setHoveredChain] = useState<string | null>(null)

  const popularChains = ['ethereum', 'base', 'arbitrum', 'somnia']

  const filteredChains = Object.entries(chains).filter(([key, config]) => {
    const query = searchQuery.toLowerCase()
    return (
      key.toLowerCase().includes(query) || 
      config.name.toLowerCase().includes(query) ||
      config.nativeToken.toLowerCase().includes(query)
    )
  })

  const getChainStats = (chainKey: string) => {
    // Mock stats - you can replace with real data
    const stats = {
      ethereum: { tvl: '$45.2B', gasPrice: '15 gwei', txSpeed: '~15s', users: '2.5M' },
      arbitrum: { tvl: '$3.1B', gasPrice: '0.1 gwei', txSpeed: '~2s', users: '1.2M' },
      base: { tvl: '$1.8B', gasPrice: '0.01 gwei', txSpeed: '~2s', users: '800K' },
      somnia: { tvl: '$250M', gasPrice: '0.001 gwei', txSpeed: '~1s', users: '150K' },
      polygon: { tvl: '$2.5B', gasPrice: '30 gwei', txSpeed: '~2s', users: '1.5M' },
      bsc: { tvl: '$5.2B', gasPrice: '3 gwei', txSpeed: '~3s', users: '2M' },
    }
    return stats[chainKey as keyof typeof stats] || { tvl: 'N/A', gasPrice: 'N/A', txSpeed: 'N/A', users: 'N/A' }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-xl z-50"
            onClick={onClose}
          />

          {/* Modal - Fixed positioning matching token selection modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 top-1/2 -translate-y-1/2 w-[calc(100%-2rem)] sm:w-full max-w-lg z-50"
          >
            <div className="bg-gradient-to-b from-slate-900/95 to-slate-950/95 border border-purple-500/20 rounded-2xl sm:rounded-3xl shadow-2xl shadow-purple-500/10 overflow-hidden flex flex-col max-h-[80vh] sm:max-h-[85vh]">
              {/* Header */}
              <div className="relative p-4 sm:p-6 pb-0">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-pink-500/10"></div>
                
                <div className="relative flex items-center justify-between mb-4 sm:mb-6">
                  <div>
                    <h2 className="text-lg sm:text-2xl font-bold text-white flex items-center gap-2">
                      <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
                      Select {direction === 'from' ? 'Source' : 'Destination'} Chain
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-400 mt-0.5 sm:mt-1">Choose your preferred blockchain network</p>
                  </div>
                  <motion.button
                    whileHover={{ rotate: 90, scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onClose}
                    className="p-1.5 sm:p-2 bg-white/5 hover:bg-white/10 rounded-lg sm:rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-slate-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search chains..."
                    className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 bg-white/5 border-white/10 focus:border-purple-400/50 rounded-xl sm:rounded-2xl text-sm sm:text-base text-white placeholder:text-slate-500"
                    autoFocus
                  />
                </div>
              </div>

              {/* Popular Chains */}
              {!searchQuery && (
                <div className="px-4 sm:px-6 py-2 sm:py-3">
                  <div className="flex items-center gap-2 mb-2 sm:mb-3">
                    <TrendingUp className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-green-400" />
                    <span className="text-[10px] sm:text-xs font-medium text-slate-400">Most Popular</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {popularChains.map(chainKey => {
                      const config = chains[chainKey]
                      if (!config) return null
                      const isSelected = selectedChain === chainKey
                      const isDisabled = otherChain === chainKey

                      return (
                        <motion.button
                          key={chainKey}
                          whileHover={{ scale: isDisabled ? 1 : 1.05 }}
                          whileTap={{ scale: isDisabled ? 1 : 0.95 }}
                          onClick={() => {
                            if (!isDisabled) {
                              onSelect(chainKey)
                              onClose()
                            }
                          }}
                          className={`p-2 sm:p-3 rounded-lg sm:rounded-xl flex flex-col items-center gap-1 sm:gap-2 transition-all ${
                            isSelected 
                              ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30' 
                              : isDisabled
                              ? 'bg-white/[0.02] opacity-40 cursor-not-allowed'
                              : 'bg-white/5 hover:bg-white/10 border border-transparent'
                          }`}
                          disabled={isDisabled}
                        >
                          <img src={config.logo} alt={config.name} className="w-6 sm:w-8 h-6 sm:h-8 rounded-full" />
                          <span className="text-[10px] sm:text-xs font-medium text-white">{config.name}</span>
                        </motion.button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Chain Grid - Flexible height with scroll */}
              <div className="flex-1 overflow-y-auto px-3 sm:px-6 pb-3 sm:pb-6 min-h-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mt-3 sm:mt-4">
                  {filteredChains.map(([chainKey, config], index) => {
                    const isSelected = selectedChain === chainKey
                    const isDisabled = otherChain === chainKey
                    const isHovered = hoveredChain === chainKey
                    const stats = getChainStats(chainKey)
                    const isSomnia = chainKey === 'somnia'

                    return (
                      <motion.div
                        key={chainKey}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02 }}
                        onHoverStart={() => setHoveredChain(chainKey)}
                        onHoverEnd={() => setHoveredChain(null)}
                        whileHover={{ scale: isDisabled ? 1 : 1.02 }}
                        onClick={() => {
                          if (!isDisabled) {
                            onSelect(chainKey)
                            onClose()
                          }
                        }}
                        className={`relative p-3 sm:p-4 rounded-xl sm:rounded-2xl cursor-pointer transition-all ${
                          isSelected 
                            ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30' 
                            : isDisabled
                            ? 'bg-white/[0.02] opacity-40 cursor-not-allowed'
                            : 'bg-white/[0.03] hover:bg-white/[0.06] border border-white/5'
                        }`}
                      >
                        {/* Special badge for Somnia */}
                        {isSomnia && (
                          <div className="absolute top-2 right-2">
                            <motion.div
                              animate={{ rotate: [0, 360] }}
                              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                              className="p-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg"
                            >
                              <Sparkles className="w-3 h-3 text-white" />
                            </motion.div>
                          </div>
                        )}

                        {/* Locked indicator for disabled chains */}
                        {isDisabled && (
                          <div className="absolute top-2 right-2">
                            <Lock className="w-4 h-4 text-slate-500" />
                          </div>
                        )}

                        <div className="flex items-start gap-3">
                          {/* Chain Logo */}
                          <motion.div
                            animate={{ rotate: isHovered && !isDisabled ? 360 : 0 }}
                            transition={{ duration: 0.5 }}
                            className="relative"
                          >
                            <img 
                              src={config.logo} 
                              alt={config.name}
                              className={`w-12 h-12 rounded-full ${
                                isSelected ? 'ring-2 ring-purple-400' : 'ring-2 ring-white/10'
                              }`}
                            />
                            {isSelected && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full ring-2 ring-slate-900 flex items-center justify-center"
                              >
                                <Zap className="w-2.5 h-2.5 text-slate-900" />
                              </motion.div>
                            )}
                          </motion.div>

                          {/* Chain Info */}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-white font-semibold">{config.name}</span>
                              {isSomnia && (
                                <span className="px-2 py-0.5 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full text-xs text-purple-300">
                                  Featured
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">
                              {config.nativeToken}
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 gap-2 mt-3">
                              <div className="flex items-center gap-1">
                                <Activity className="w-3 h-3 text-green-400" />
                                <span className="text-xs text-slate-300">{stats.txSpeed}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <DollarSign className="w-3 h-3 text-blue-400" />
                                <span className="text-xs text-slate-300">{stats.gasPrice}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Shield className="w-3 h-3 text-purple-400" />
                                <span className="text-xs text-slate-300">{stats.tvl}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="w-3 h-3 text-orange-400" />
                                <span className="text-xs text-slate-300">{stats.users}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Hover effect */}
                        <AnimatePresence>
                          {isHovered && !isDisabled && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-2xl pointer-events-none"
                            />
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}