'use client'

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  Star, 
  TrendingUp, 
  Clock, 
  X,
  Sparkles,
  ChevronRight,
  Zap,
  Shield,
  Coins
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { getTokenInfo, type TokenInfo } from '@/lib/constants/tokenImages'
import { formatNumber } from '@/lib/utils'

interface TokenSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (token: TokenInfo) => void
  availableTokens: string[]
  tokenPrices: Record<string, number>
  balances?: Record<string, string>
  selectedToken?: TokenInfo
  chainName: string
}

export function TokenSelectionModal({
  isOpen,
  onClose,
  onSelect,
  availableTokens,
  tokenPrices,
  balances,
  selectedToken,
  chainName
}: TokenSelectionModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [hoveredToken, setHoveredToken] = useState<string | null>(null)

  const popularTokens = ['ETH', 'WETH', 'USDC', 'USDT', 'SOMI']

  const filteredTokens = useMemo(() => {
    const query = searchQuery.toLowerCase()
    return availableTokens.filter(token => 
      token.toLowerCase().includes(query) ||
      getTokenInfo(token).name.toLowerCase().includes(query)
    )
  }, [searchQuery, availableTokens])

  const getTokenBalance = (symbol: string) => {
    if (!balances || !balances[symbol]) return '0'
    return balances[symbol]
  }

  const getTokenValue = (symbol: string) => {
    const balance = parseFloat(getTokenBalance(symbol))
    const price = tokenPrices[symbol] || 0
    return balance * price
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

          {/* Modal - Fixed positioning with max-height and scrollable content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 top-1/2 -translate-y-1/2 w-[calc(100%-2rem)] sm:w-full max-w-md z-50"
          >
            <div className="bg-gradient-to-b from-slate-900/95 to-slate-950/95 border border-purple-500/20 rounded-2xl sm:rounded-3xl shadow-2xl shadow-purple-500/10 overflow-hidden flex flex-col max-h-[80vh] sm:max-h-[85vh]">
              {/* Header */}
              <div className="relative p-4 sm:p-6 pb-0">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-pink-500/10"></div>
                
                <div className="relative flex items-center justify-between mb-4 sm:mb-6">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                      <Coins className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
                      <span className="text-lg sm:text-2xl">Select Token</span>
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-400 mt-0.5 sm:mt-1">on {chainName}</p>
                  </div>
                  <motion.button
                    whileHover={{ rotate: 90, scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onClose}
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
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
                    placeholder="Search token..."
                    className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 bg-white/5 border-white/10 focus:border-purple-400/50 rounded-xl sm:rounded-2xl text-sm sm:text-base text-white placeholder:text-slate-500"
                    autoFocus
                  />
                  {searchQuery && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-white/5 hover:bg-white/10 rounded-lg"
                    >
                      <X className="w-3.5 h-3.5" />
                    </motion.button>
                  )}
                </div>
              </div>

              {/* Popular Tokens */}
              {!searchQuery && (
                <div className="px-4 sm:px-6 py-2 sm:py-3">
                  <div className="flex items-center gap-2 mb-2 sm:mb-3">
                    <Star className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-yellow-400" />
                    <span className="text-[10px] sm:text-xs font-medium text-slate-400 uppercase tracking-wider">Popular</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {popularTokens.filter(t => availableTokens.includes(t)).map(token => (
                      <motion.button
                        key={token}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          onSelect(getTokenInfo(token))
                          onClose()
                        }}
                        className={`px-2.5 sm:px-3 py-1.5 sm:py-2 bg-gradient-to-r ${
                          selectedToken?.symbol === token 
                            ? 'from-purple-500 to-pink-500' 
                            : 'from-white/5 to-white/10'
                        } rounded-lg sm:rounded-xl flex items-center gap-1.5 sm:gap-2 hover:from-purple-500/20 hover:to-pink-500/20 transition-all`}
                      >
                        <img src={getTokenInfo(token).image} alt={token} className="w-4 sm:w-5 h-4 sm:h-5 rounded-full" />
                        <span className="text-xs sm:text-sm font-medium text-white">{token}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Token List - Flexible height with scroll */}
              <div className="flex-1 overflow-y-auto px-2 sm:px-3 pb-2 sm:pb-3 min-h-0">
                <div className="space-y-0.5 sm:space-y-1">
                  {filteredTokens.map((token, index) => {
                    const tokenInfo = getTokenInfo(token)
                    const balance = getTokenBalance(token)
                    const value = getTokenValue(token)
                    const isSelected = selectedToken?.symbol === token
                    const isHovered = hoveredToken === token

                    return (
                      <motion.div
                        key={token}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.02 }}
                        onHoverStart={() => setHoveredToken(token)}
                        onHoverEnd={() => setHoveredToken(null)}
                        whileHover={{ x: 4 }}
                        onClick={() => {
                          onSelect(tokenInfo)
                          onClose()
                        }}
                        className={`relative p-3 sm:p-4 rounded-xl sm:rounded-2xl cursor-pointer transition-all ${
                          isSelected 
                            ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30' 
                            : 'bg-white/[0.02] hover:bg-white/[0.06] border border-transparent'
                        }`}
                      >
                        {/* Background decoration */}
                        <AnimatePresence>
                          {isHovered && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 rounded-2xl"
                            />
                          )}
                        </AnimatePresence>

                        <div className="relative flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {/* Token Icon */}
                            <motion.div
                              animate={{ rotate: isHovered ? 360 : 0 }}
                              transition={{ duration: 0.5 }}
                              className="relative"
                            >
                              <img 
                                src={tokenInfo.image} 
                                alt={tokenInfo.name}
                                className="w-8 sm:w-10 h-8 sm:h-10 rounded-full ring-2 ring-white/10"
                              />
                              {isSelected && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full ring-2 ring-slate-900"
                                />
                              )}
                            </motion.div>

                            {/* Token Info */}
                            <div>
                              <div className="flex items-center gap-1.5 sm:gap-2">
                                <span className="text-sm sm:text-base text-white font-semibold">{token}</span>
                                {tokenPrices[token] > 100 && (
                                  <Zap className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-yellow-400" />
                                )}
                              </div>
                              <div className="flex items-center gap-1 sm:gap-2 mt-0.5">
                                <span className="text-[10px] sm:text-xs text-slate-400 line-clamp-1">{tokenInfo.name}</span>
                                {tokenPrices[token] && (
                                  <span className="text-[10px] sm:text-xs text-slate-500">
                                    ${formatNumber(tokenPrices[token])}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Balance & Value */}
                          <div className="text-right">
                            <div className="text-sm sm:text-base text-white font-medium">
                              {parseFloat(balance).toFixed(4)}
                            </div>
                            {value > 0 && (
                              <div className="text-[10px] sm:text-xs text-slate-400">
                                ${formatNumber(value)}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Hover indicator */}
                        <AnimatePresence>
                          {isHovered && (
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: '100%' }}
                              exit={{ width: 0 }}
                              className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-purple-400 to-pink-400"
                            />
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="p-3 sm:p-4 border-t border-white/5">
                <div className="flex items-center justify-between text-[10px] sm:text-xs text-slate-400">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Shield className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                    <span>Verified tokens</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Clock className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                    <span>Live prices</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}