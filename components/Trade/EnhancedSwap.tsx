'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { 
  ArrowDown,
  Settings,
  Info,
  RefreshCw,
  Zap,
  AlertCircle,
  TrendingUp,
  Shield,
  Clock,
  Loader2,
  Wallet
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { TokenSelect, TokenDisplay } from '@/components/ui/TokenSelect'
import { getTokenInfo, type TokenInfo } from '@/lib/constants/tokenImages'
import { formatNumber, formatCurrency } from '@/lib/utils'
import { enhancedSwapService, type SwapQuote, type TokenBalance } from '@/lib/services/enhancedSwapService'
import { useAccount } from 'wagmi'
import type { Address } from 'viem'


interface EnhancedSwapProps {
  onTokenChange?: (token0: TokenInfo, token1: TokenInfo) => void;
  initialToken0?: TokenInfo;
  initialToken1?: TokenInfo;
}

export default function EnhancedSwap({ 
  onTokenChange,
  initialToken0,
  initialToken1 
}: EnhancedSwapProps = {}) {
  const { address: userAddress, isConnected } = useAccount()
  const [fromToken, setFromToken] = useState<TokenInfo>(initialToken0 || getTokenInfo('WETH'))
  const [toToken, setToToken] = useState<TokenInfo>(initialToken1 || getTokenInfo('USDC'))
  const [fromAmount, setFromAmount] = useState('')
  const [toAmount, setToAmount] = useState('')
  const [slippage, setSlippage] = useState('0.5')
  const [fromBalance, setFromBalance] = useState<TokenBalance | null>(null)
  const [toBalance, setToBalance] = useState<TokenBalance | null>(null)
  const [quote, setQuote] = useState<SwapQuote | null>(null)
  const [isLoadingQuote, setIsLoadingQuote] = useState(false)
  const [isLoadingBalances, setIsLoadingBalances] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [quoteDebounceTimer, setQuoteDebounceTimer] = useState<NodeJS.Timeout | null>(null)
  const [quoteError, setQuoteError] = useState<string | null>(null)

  // Fetch token balances when wallet is connected
  useEffect(() => {
    if (isConnected && userAddress) {
      fetchBalances()
    }
  }, [isConnected, userAddress, fromToken, toToken])

  // Fetch quote when amount changes (with debounce)
  useEffect(() => {
    // Clear previous timer
    if (quoteDebounceTimer) {
      clearTimeout(quoteDebounceTimer)
    }
    
    // Clear output if no input
    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      setToAmount('')
      setQuote(null)
      setIsLoadingQuote(false)
      return
    }
    
    // Set loading state immediately for better UX
    setIsLoadingQuote(true)
    
    // Set new timer for quote fetching
    const timer = setTimeout(async () => {
      await fetchQuote()
    }, 300) // 300ms debounce for faster response
    
    setQuoteDebounceTimer(timer)

    // Cleanup
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [fromAmount, fromToken.symbol, toToken.symbol]) // Use symbol to avoid re-renders

  // Notify parent component when tokens change
  useEffect(() => {
    if (onTokenChange) {
      onTokenChange(fromToken, toToken)
    }
  }, [fromToken, toToken, onTokenChange])

  // Fetch token balances
  const fetchBalances = async () => {
    if (!userAddress) return
    
    setIsLoadingBalances(true)
    try {
      const [fromBal, toBal] = await Promise.all([
        enhancedSwapService.getTokenBalance(userAddress as Address, fromToken.symbol),
        enhancedSwapService.getTokenBalance(userAddress as Address, toToken.symbol)
      ])
      setFromBalance(fromBal)
      setToBalance(toBal)
    } catch (error) {
      console.error('Error fetching balances:', error)
    } finally {
      setIsLoadingBalances(false)
    }
  }

  // Swap tokens
  const handleSwapTokens = () => {
    const temp = fromToken
    setFromToken(toToken)
    setToToken(temp)
    const tempAmount = fromAmount
    setFromAmount(toAmount)
    setToAmount(tempAmount)
  }

  // Fetch quote using enhanced swap service
  const fetchQuote = async () => {
    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      setToAmount('')
      setQuote(null)
      setIsLoadingQuote(false)
      return
    }

    setQuoteError(null)
    
    try {
      console.log(`Fetching quote for ${fromAmount} ${fromToken.symbol} to ${toToken.symbol}`)
      
      const quoteResult = await enhancedSwapService.getQuoteExactInput(
        fromToken.symbol,
        toToken.symbol,
        fromAmount,
        parseFloat(slippage)
      )

      if (quoteResult) {
        console.log('Quote received:', quoteResult)
        setQuote(quoteResult)
        setToAmount(quoteResult.amountOut)
        setQuoteError(null)
      }
    } catch (error: any) {
      console.error('Failed to fetch quote:', error)
      setToAmount('')
      setQuote(null)
      setQuoteError(error.message || 'Unable to fetch quote')
    } finally {
      setIsLoadingQuote(false)
    }
  }


  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([
      fetchQuote(),
      fetchBalances()
    ])
    setTimeout(() => setRefreshing(false), 1000)
  }

  // Handle max button click
  const handleMaxClick = () => {
    if (fromBalance) {
      const maxAmount = parseFloat(fromBalance.formatted)
      setFromAmount(maxAmount.toString())
    }
  }


  return (
    <Card className="glass-card max-w-lg mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl">Swap</CardTitle>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="p-2 hover:bg-accent/50 rounded-lg transition-colors"
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 hover:bg-accent/50 rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Settings Panel */}
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="p-4 bg-slate-800/30 rounded-xl space-y-3"
          >
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                Slippage Tolerance
              </label>
              <div className="flex gap-2">
                {['0.1', '0.5', '1.0'].map(value => (
                  <button
                    key={value}
                    onClick={() => setSlippage(value)}
                    className={`px-3 py-1 rounded-lg text-sm ${
                      slippage === value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-slate-700/50 hover:bg-slate-600/50'
                    }`}
                  >
                    {value}%
                  </button>
                ))}
                <Input
                  type="number"
                  value={slippage}
                  onChange={(e) => setSlippage(e.target.value)}
                  className="w-20 text-sm"
                  placeholder="Custom"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* From Token */}
        <div className="p-4 bg-slate-800/30 rounded-xl border border-border/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">From</span>
            <div className="flex items-center gap-2">
              {isLoadingBalances ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <>
                  <Wallet className="w-3 h-3" />
                  <span className="text-xs text-muted-foreground">
                    {fromBalance ? `${formatNumber(parseFloat(fromBalance.formatted))} ${fromToken.symbol}` : '0.00 ' + fromToken.symbol}
                  </span>
                </>
              )}
              {fromBalance && parseFloat(fromBalance.formatted) > 0 && (
                <button
                  onClick={handleMaxClick}
                  className="px-2 py-0.5 text-xs bg-primary/20 hover:bg-primary/30 rounded transition-colors"
                >
                  MAX
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              placeholder="0.00"
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
              className="flex-1 bg-transparent border-0 text-2xl font-medium focus:ring-0"
            />
            <TokenSelect
              value={fromToken}
              onChange={setFromToken}
              excludeToken={toToken.symbol}
            />
          </div>
          {fromAmount && quote && (
            <div className="mt-2 text-sm text-muted-foreground">
              ≈ ${formatNumber(parseFloat(fromAmount) * (quote.executionPrice || 1))}
            </div>
          )}
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <button
            onClick={handleSwapTokens}
            className="p-3 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl transition-all hover:scale-105"
          >
            <ArrowDown className="w-5 h-5" />
          </button>
        </div>

        {/* To Token */}
        <div className="p-4 bg-slate-800/30 rounded-xl border border-border/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">To</span>
            <div className="flex items-center gap-2">
              {isLoadingBalances ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <>
                  <Wallet className="w-3 h-3" />
                  <span className="text-xs text-muted-foreground">
                    {toBalance ? `${formatNumber(parseFloat(toBalance.formatted))} ${toToken.symbol}` : '0.00 ' + toToken.symbol}
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Input
                type="number"
                placeholder="0.00"
                value={toAmount}
                readOnly
                className="flex-1 bg-transparent border-0 text-2xl font-medium focus:ring-0"
              />
              {isLoadingQuote && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
            <TokenSelect
              value={toToken}
              onChange={setToToken}
              excludeToken={fromToken.symbol}
            />
          </div>
          {toAmount && quote && (
            <div className="mt-2 text-sm text-muted-foreground">
              ≈ ${formatNumber(parseFloat(toAmount) * (1 / quote.executionPrice || 1))}
            </div>
          )}
        </div>

        {/* Error Message */}
        {quoteError && fromAmount && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-destructive mt-0.5" />
            <div className="text-sm">
              <p className="text-destructive">{quoteError}</p>
            </div>
          </div>
        )}

        {/* Price Info */}
        {quote && !quoteError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-slate-800/20 rounded-xl space-y-2"
          >
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Rate</span>
              <span>
                1 {fromToken.symbol} = {quote.executionPrice.toFixed(6)} {toToken.symbol}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <Info className="w-3 h-3" />
                Price Impact
              </span>
              <span className={quote.priceImpact > 3 ? 'text-warning' : 'text-success'}>
                {quote.priceImpact.toFixed(2)}%
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Fee</span>
              <span>{quote.fee}%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Minimum Received</span>
              <span>
                {quote.minimumReceived} {toToken.symbol}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Route</span>
              <div className="flex items-center gap-1">
                <span className="text-xs">{quote.route}</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Swap Button */}
        <Button 
          className="w-full" 
          size="lg"
          disabled={!isConnected || !fromAmount || !toAmount || isLoadingQuote || (fromBalance && parseFloat(fromAmount) > parseFloat(fromBalance.formatted))}
        >
          {!isConnected ? (
            'Connect Wallet'
          ) : isLoadingQuote ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Fetching Best Price...
            </>
          ) : fromBalance && parseFloat(fromAmount) > parseFloat(fromBalance.formatted) ? (
            'Insufficient Balance'
          ) : !fromAmount || !toAmount ? (
            'Enter Amount'
          ) : (
            'Swap'
          )}
        </Button>

        {/* Additional Info */}
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Shield className="w-3 h-3 text-success" />
            <span>Secure</span>
          </div>
          <div className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-warning" />
            <span>Instant</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-primary" />
            <span>Best Price</span>
          </div>
        </div>

        {/* Wallet Connection Status */}
        {!isConnected && (
          <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl flex items-start gap-2">
            <Wallet className="w-4 h-4 text-primary mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-primary">Wallet Not Connected</p>
              <p className="text-muted-foreground mt-1">
                Connect your wallet to view balances and swap tokens.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}