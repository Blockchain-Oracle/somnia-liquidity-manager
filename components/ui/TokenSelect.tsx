'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { getTokenInfo, type TokenInfo } from '@/lib/constants/tokenImages'

interface TokenSelectProps {
  value: TokenInfo;
  onChange: (token: TokenInfo) => void;
  availableTokens?: string[];
  excludeToken?: string;
}

export function TokenSelect({ 
  value, 
  onChange, 
  availableTokens = [],
  excludeToken
}: TokenSelectProps) {
  const filteredTokens = availableTokens.filter(token => token !== excludeToken)

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      type="button"
      className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-slate-800/50 to-slate-700/50 hover:from-slate-700/50 hover:to-slate-600/50 rounded-xl transition-all group"
    >
      <TokenDisplay value={value} />
      <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
    </motion.button>
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