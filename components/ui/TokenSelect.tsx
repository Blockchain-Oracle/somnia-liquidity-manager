'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Search, X } from 'lucide-react'
import { getTokenInfo, getAllTokens, type TokenInfo } from '@/lib/constants/tokenImages'
import { useNetwork } from '@/lib/hooks/useNetwork'
import { cn } from '@/lib/utils'

interface TokenSelectProps {
  value: TokenInfo;
  onChange: (token: TokenInfo) => void;
  availableTokens?: string[];
  excludeToken?: string;
  className?: string;
}

export function TokenSelect({ 
  value, 
  onChange, 
  availableTokens = [],
  excludeToken,
  className
}: TokenSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { isTestnet } = useNetwork()
  
  // Get all available tokens for the current network
  const allTokens = getAllTokens(isTestnet)
  
  // Filter tokens based on availableTokens prop if provided, otherwise use all tokens
  const tokensToShow = availableTokens.length > 0 
    ? allTokens.filter(token => availableTokens.includes(token.symbol))
    : allTokens
  
  // Filter out excluded token and apply search
  const filteredTokens = tokensToShow
    .filter(token => token.symbol !== excludeToken)
    .filter(token => 
      token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])
  
  // Reset search when closing
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('')
    }
  }, [isOpen])
  
  const handleSelect = (token: TokenInfo) => {
    onChange(token)
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-slate-800/50 to-slate-700/50 hover:from-slate-700/50 hover:to-slate-600/50 rounded-xl transition-all group",
          className
        )}
      >
        <TokenDisplay value={value} />
        <ChevronDown className={cn(
          "w-4 h-4 text-slate-400 group-hover:text-white transition-all",
          isOpen && "rotate-180"
        )} />
      </motion.button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-xl overflow-hidden z-50"
          >
            {/* Search Input */}
            <div className="p-3 border-b border-slate-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search tokens..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  autoFocus
                />
              </div>
            </div>
            
            {/* Token List */}
            <div className="max-h-80 overflow-y-auto">
              {filteredTokens.length === 0 ? (
                <div className="p-4 text-center text-slate-400 text-sm">
                  No tokens found
                </div>
              ) : (
                filteredTokens.map((token) => (
                  <button
                    key={token.symbol}
                    onClick={() => handleSelect(token)}
                    className={cn(
                      "w-full p-3 flex items-center gap-3 hover:bg-slate-800/50 transition-colors",
                      value.symbol === token.symbol && "bg-slate-800/30"
                    )}
                  >
                    <img 
                      src={token.image} 
                      alt={token.symbol}
                      className="w-8 h-8 rounded-full"
                    />
                    <div className="flex-1 text-left">
                      <div className="font-medium text-white">{token.symbol}</div>
                      <div className="text-xs text-slate-400">{token.name}</div>
                    </div>
                    {value.symbol === token.symbol && (
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    )}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function TokenDisplay({ value }: { value: TokenInfo }) {
  return (
    <div className="flex items-center gap-2">
      <motion.img 
        whileHover={{ rotate: 360 }}
        transition={{ duration: 0.5 }}
        src={value.image} 
        alt={value.symbol} 
        className="w-6 h-6 rounded-full ring-2 ring-white/10"
      />
      <span className="font-semibold text-white">{value.symbol}</span>
    </div>
  )
}

// Token Pair Display (for liquidity pools)
interface TokenPairProps {
  token0: TokenInfo;
  token1: TokenInfo;
  size?: 'sm' | 'md' | 'lg';
}

export function TokenPair({ token0, token1, size = 'md' }: TokenPairProps) {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  const overlapClasses = {
    sm: '-ml-2',
    md: '-ml-2.5',
    lg: '-ml-3'
  }

  return (
    <div className="flex items-center">
      <img 
        src={token0.image} 
        alt={token0.symbol}
        className={`${sizeClasses[size]} rounded-full border-2 border-background z-10`}
      />
      <img 
        src={token1.image} 
        alt={token1.symbol}
        className={`${sizeClasses[size]} ${overlapClasses[size]} rounded-full border-2 border-background`}
      />
      <span className="ml-2 font-medium">
        {token0.symbol}/{token1.symbol}
      </span>
    </div>
  )
}