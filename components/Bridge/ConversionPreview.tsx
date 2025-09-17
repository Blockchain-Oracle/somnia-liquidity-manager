'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  TrendingUp, 
  TrendingDown, 
  AlertCircle,
  Sparkles,
  DollarSign,
  Percent,
  ArrowRight,
  Info
} from 'lucide-react'
import { formatNumber, formatCurrency } from '@/lib/utils'

interface ConversionPreviewProps {
  fromAmount: string
  toAmount: string
  fromToken: string
  toToken: string
  fromPrice?: number
  toPrice?: number
  exchangeRate?: number
  priceImpact?: number
  minimumReceived?: string
  slippage?: number
  isLoading?: boolean
}

export function ConversionPreview({
  fromAmount,
  toAmount,
  fromToken,
  toToken,
  fromPrice,
  toPrice,
  exchangeRate,
  priceImpact,
  minimumReceived,
  slippage = 0.5,
  isLoading
}: ConversionPreviewProps) {
  const fromValue = parseFloat(fromAmount) * (fromPrice || 0)
  const toValue = parseFloat(toAmount) * (toPrice || 0)
  const valueChange = toValue - fromValue
  const valueChangePercent = fromValue > 0 ? (valueChange / fromValue) * 100 : 0

  return (
    <AnimatePresence mode="wait">
      {(fromAmount && parseFloat(fromAmount) > 0) && (
        <motion.div
          key="preview"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <div className="mt-4 p-4 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5 rounded-2xl border border-purple-500/10">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium text-white">Conversion Preview</span>
              </div>
              {isLoading && (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full"
                />
              )}
            </div>

            {/* Exchange Rate Display */}
            <div className="flex items-center justify-between mb-3 p-3 bg-white/5 rounded-xl">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400">Rate</span>
                <button className="p-1 hover:bg-white/10 rounded-lg transition-colors group">
                  <Info className="w-3 h-3 text-slate-500 group-hover:text-slate-300" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white">
                  1 {fromToken} = {exchangeRate ? formatNumber(exchangeRate) : '~'} {toToken}
                </span>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-1.5 h-1.5 bg-green-400 rounded-full"
                />
              </div>
            </div>

            {/* Value Conversion */}
            <div className="space-y-2 mb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">You Pay</div>
                    <div className="text-sm font-medium text-white">
                      {formatCurrency(fromValue)}
                    </div>
                  </div>
                </div>

                <motion.div
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </motion.div>

                <div className="flex items-center gap-2">
                  <div>
                    <div className="text-xs text-slate-400 text-right">You Receive</div>
                    <div className="text-sm font-medium text-white text-right">
                      {formatCurrency(toValue)}
                    </div>
                  </div>
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-blue-400" />
                  </div>
                </div>
              </div>

              {/* Value Change Indicator */}
              {Math.abs(valueChange) > 0.01 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center justify-center"
                >
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
                    valueChange >= 0 
                      ? 'bg-green-500/10 text-green-400' 
                      : 'bg-red-500/10 text-red-400'
                  }`}>
                    {valueChange >= 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    <span className="text-xs font-medium">
                      {valueChange >= 0 ? '+' : ''}{formatCurrency(valueChange)} ({valueChangePercent.toFixed(2)}%)
                    </span>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Additional Info */}
            <div className="space-y-2 pt-3 border-t border-white/5">
              {/* Minimum Received */}
              {minimumReceived && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Minimum Received</span>
                  <span className="text-slate-300 font-medium">
                    {minimumReceived} {toToken}
                  </span>
                </div>
              )}

              {/* Slippage */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Max Slippage</span>
                <div className="flex items-center gap-1">
                  <Percent className="w-3 h-3 text-slate-500" />
                  <span className="text-slate-300 font-medium">{slippage}%</span>
                </div>
              </div>

              {/* Price Impact Warning */}
              {priceImpact && Math.abs(priceImpact) > 1 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`flex items-center gap-2 p-2 rounded-lg ${
                    Math.abs(priceImpact) > 5 
                      ? 'bg-red-500/10 text-red-400' 
                      : 'bg-yellow-500/10 text-yellow-400'
                  }`}
                >
                  <AlertCircle className="w-3 h-3" />
                  <span className="text-xs">
                    Price impact: {priceImpact.toFixed(2)}%
                  </span>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}