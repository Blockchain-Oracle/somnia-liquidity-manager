'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Search, X } from 'lucide-react'
import { Input } from './input'
import { TOKEN_IMAGES, getTokenInfo, getTokensByNetwork, type TokenInfo } from '@/lib/constants/tokenImages'
import { useNetwork } from '@/lib/hooks/useNetwork'

interface TokenSelectProps {
  value?: TokenInfo;
  onChange: (token: TokenInfo) => void;
  availableTokens?: string[];
  excludeToken?: string;
  label?: string;
  balance?: string;
  showBalance?: boolean;
  className?: string;
}

export function TokenSelect({
  value,
  onChange,
  availableTokens,
  excludeToken,
  label,
  balance,
  showBalance = true,
  className = ''
}: TokenSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { isTestnet } = useNetwork()

  // Get available tokens based on network
  const tokens = availableTokens 
    ? availableTokens.map(symbol => getTokenInfo(symbol))
    : getTokensByNetwork(isTestnet)

  // Filter tokens
  const filteredTokens = tokens.filter(token => {
    if (excludeToken && token.symbol === excludeToken) return false
    if (!searchQuery) return true
    
    const query = searchQuery.toLowerCase()
    return (
      token.symbol.toLowerCase().includes(query) ||
      token.name.toLowerCase().includes(query)
    )
  })

  const handleSelect = (token: TokenInfo) => {
    onChange(token)
    setIsOpen(false)
    setSearchQuery('')
  }

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="text-sm text-muted-foreground mb-1 block">
          {label}
        </label>
      )}
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 hover:bg-slate-700/50 border border-border/50 rounded-xl transition-colors"
      >
        {value ? (
          <>
            <img 
              src={value.image} 
              alt={value.symbol}
              className="w-6 h-6 rounded-full"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                if (!img.dataset.fallbackAttempted) {
                  img.dataset.fallbackAttempted = 'true';
                  img.src = 'https://assets.coingecko.com/coins/images/279/small/ethereum.png';
                } else {
                  img.style.display = 'none';
                }
              }}
            />
            <span className="font-medium">{value.symbol}</span>
          </>
        ) : (
          <span className="text-muted-foreground">Select token</span>
        )}
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {showBalance && balance && value && (
        <div className="mt-1 text-xs text-muted-foreground">
          Balance: {balance} {value.symbol}
        </div>
      )}

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Token List Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute z-50 mt-2 w-80 bg-slate-900 border border-border rounded-xl shadow-xl overflow-hidden"
              style={{
                maxHeight: '400px',
                right: '0',
                top: '100%'
              }}
            >
              {/* Search Header */}
              <div className="p-3 border-b border-border/50">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search name or symbol"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-10"
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                    </button>
                  )}
                </div>
              </div>

              {/* Token List */}
              <div className="overflow-y-auto" style={{ maxHeight: '320px' }}>
                {filteredTokens.length > 0 ? (
                  filteredTokens.map((token) => (
                    <button
                      key={token.symbol}
                      onClick={() => handleSelect(token)}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800/50 transition-colors
                        ${value?.symbol === token.symbol ? 'bg-primary/10' : ''}
                      `}
                    >
                      <img 
                        src={token.image} 
                        alt={token.symbol}
                        className="w-8 h-8 rounded-full"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          if (!img.dataset.fallbackAttempted) {
                            img.dataset.fallbackAttempted = 'true';
                            img.src = 'https://assets.coingecko.com/coins/images/279/small/ethereum.png';
                          } else {
                            img.style.display = 'none';
                          }
                        }}
                      />
                      <div className="flex-1 text-left">
                        <div className="font-medium">{token.symbol}</div>
                        <div className="text-sm text-muted-foreground">{token.name}</div>
                      </div>
                      {/* You can add balance here if available */}
                    </button>
                  ))
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    No tokens found
                  </div>
                )}
              </div>

              {/* Popular Tokens Section */}
              {!searchQuery && (
                <div className="border-t border-border/50 p-3">
                  <div className="text-xs text-muted-foreground mb-2">Popular tokens</div>
                  <div className="flex flex-wrap gap-2">
                    {(isTestnet ? ['STT', 'tWETH', 'tUSDC', 'tUSDT'] : ['WETH', 'USDC', 'USDT', 'SOMI']).map((symbol) => {
                      const token = getTokenInfo(symbol)
                      if (excludeToken === symbol) return null
                      
                      return (
                        <button
                          key={symbol}
                          onClick={() => handleSelect(token)}
                          className="flex items-center gap-1.5 px-2 py-1 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg transition-colors"
                        >
                          <img 
                            src={token.image} 
                            alt={token.symbol}
                            className="w-4 h-4 rounded-full"
                          />
                          <span className="text-sm">{token.symbol}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// Token Display Component (for showing selected token)
interface TokenDisplayProps {
  token: TokenInfo;
  amount?: string;
  showAmount?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function TokenDisplay({ 
  token, 
  amount, 
  showAmount = false,
  size = 'md' 
}: TokenDisplayProps) {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  return (
    <div className="flex items-center gap-2">
      <img 
        src={token.image} 
        alt={token.symbol}
        className={`${sizeClasses[size]} rounded-full`}
        onError={(e) => {
          const img = e.target as HTMLImageElement;
          if (!img.dataset.fallbackAttempted) {
            img.dataset.fallbackAttempted = 'true';
            img.src = 'https://assets.coingecko.com/coins/images/279/small/ethereum.png';
          } else {
            img.style.display = 'none';
          }
        }}
      />
      <div className="flex items-baseline gap-1">
        {showAmount && amount && (
          <span className="font-medium">{amount}</span>
        )}
        <span className={showAmount ? 'text-muted-foreground' : 'font-medium'}>
          {token.symbol}
        </span>
      </div>
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