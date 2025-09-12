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
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, useSimulateContract } from 'wagmi'
import { parseUnits, type Address } from 'viem'
import { useNetwork } from '@/lib/hooks/useNetwork'
import { TESTNET_CONTRACTS, SIMPLE_POOL_ABI } from '@/lib/constants/contracts'
import { testnetSwapService, ERC20_ABI } from '@/lib/services/testnetSwapService'
import { toast } from 'sonner'

interface EnhancedSwapProps {
  onTokenChange?: (token0: TokenInfo, token1: TokenInfo) => void;
  initialToken0?: TokenInfo;
  initialToken1?: TokenInfo;
}

export default function EnhancedSwapTestnet({ 
  onTokenChange,
  initialToken0,
  initialToken1 
}: EnhancedSwapProps = {}) {
  const { address: userAddress, isConnected } = useAccount()
  const { isTestnet } = useNetwork()
  
  const [fromToken, setFromToken] = useState<TokenInfo>(initialToken0 || getTokenInfo(isTestnet ? 'STT' : 'WETH'))
  const [toToken, setToToken] = useState<TokenInfo>(initialToken1 || getTokenInfo(isTestnet ? 'tUSDC' : 'USDC'))
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
  
  // Testnet specific states
  const [needsApproval, setNeedsApproval] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const [isSwapping, setIsSwapping] = useState(false)
  const [approveTxHash, setApproveTxHash] = useState<`0x${string}` | undefined>()
  const [swapTxHash, setSwapTxHash] = useState<`0x${string}` | undefined>()
  
  // Contract interaction hooks (only for testnet)
  const { writeContract: writeApprove, data: approveData, isPending: isApprovePending, isError: isApproveError, error: approveError } = useWriteContract()
  const { writeContract: writeSwap, data: swapData, isPending: isSwapPending, isError: isSwapError, error: swapError } = useWriteContract()
  
  // Wait for transaction receipts
  const { isLoading: isApproveConfirming, isSuccess: approveSuccess } = useWaitForTransactionReceipt({ 
    hash: approveData 
  })
  const { isLoading: isSwapConfirming, isSuccess: swapSuccess } = useWaitForTransactionReceipt({ 
    hash: swapData 
  })

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

    // Set new timer
    const timer = setTimeout(async () => {
      if (fromAmount && parseFloat(fromAmount) > 0) {
        await fetchQuote()
      } else {
        setToAmount('')
        setQuote(null)
      }
    }, 500) // 500ms debounce

    setQuoteDebounceTimer(timer)

    // Cleanup
    return () => {
      if (timer) {
        clearTimeout(timer)
      }
    }
  }, [fromAmount, fromToken, toToken, slippage])

  // Update parent component when tokens change
  useEffect(() => {
    if (onTokenChange) {
      onTokenChange(fromToken, toToken)
    }
  }, [fromToken, toToken, onTokenChange])

  // Handle approval success
  useEffect(() => {
    if (approveSuccess && approveData) {
      toast.success('Token approved successfully!')
      setNeedsApproval(false)
      setIsApproving(false)
      // Open explorer (testnet or mainnet)
      const explorerUrl = isTestnet 
        ? `https://shannon-explorer.somnia.network/tx/${approveData}`
        : `https://explorer.somnia.network/tx/${approveData}`
      window.open(explorerUrl, '_blank')
    }
  }, [approveSuccess, approveData, isTestnet])

  // Handle swap success
  useEffect(() => {
    if (swapSuccess && swapData) {
      toast.success('Swap completed successfully!')
      setIsSwapping(false)
      // Reset form
      setFromAmount('')
      setToAmount('')
      // Refresh balances
      fetchBalances()
      // Open explorer (testnet or mainnet)
      const explorerUrl = isTestnet
        ? `https://shannon-explorer.somnia.network/tx/${swapData}`
        : `https://explorer.somnia.network/tx/${swapData}`
      window.open(explorerUrl, '_blank')
    }
  }, [swapSuccess, swapData, isTestnet])

  const fetchBalances = async () => {
    if (!userAddress) return
    
    setIsLoadingBalances(true)
    try {
      // Use testnet balance service for testnet
      if (isTestnet) {
        const [from, to] = await Promise.all([
          testnetSwapService.getTestnetTokenBalance(fromToken.symbol, userAddress),
          testnetSwapService.getTestnetTokenBalance(toToken.symbol, userAddress)
        ])
        setFromBalance(from)
        setToBalance(to)
      } else {
        // Use mainnet service for mainnet
        const [from, to] = await Promise.all([
          enhancedSwapService.getTokenBalance(fromToken, userAddress),
          enhancedSwapService.getTokenBalance(toToken, userAddress)
        ])
        setFromBalance(from)
        setToBalance(to)
      }
    } catch (error) {
      console.error('Error fetching balances:', error)
    } finally {
      setIsLoadingBalances(false)
    }
  }

  const fetchQuote = async () => {
    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      setToAmount('')
      setQuote(null)
      return
    }

    setIsLoadingQuote(true)
    setQuoteError(null)
    
    try {
      // Use testnet quote service for testnet
      if (isTestnet) {
        const testnetQuote = await testnetSwapService.getTestnetQuote(
          fromToken.symbol,
          toToken.symbol,
          fromAmount,
          parseFloat(slippage)
        )
        
        if (testnetQuote) {
          setQuote(testnetQuote)
          setToAmount(testnetQuote.estimatedOutput.toFixed(6))
        } else {
          setQuoteError('No route available for this swap')
        }
      } else {
        // Use mainnet service for mainnet
        const swapQuote = await enhancedSwapService.getQuote(
          fromToken,
          toToken,
          parseFloat(fromAmount),
          parseFloat(slippage)
        )
        
        if (swapQuote) {
          setQuote(swapQuote)
          setToAmount(swapQuote.estimatedOutput.toFixed(6))
        } else {
          setQuoteError('No route available for this swap')
        }
      }
    } catch (error) {
      console.error('Quote error:', error)
      setQuoteError('Failed to fetch quote. Please try again.')
      setToAmount('')
    } finally {
      setIsLoadingQuote(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([fetchBalances(), fetchQuote()])
    setRefreshing(false)
  }

  // Swap tokens
  const handleSwapTokens = () => {
    const temp = fromToken
    setFromToken(toToken)
    setToToken(temp)
    setFromAmount(toAmount)
    setToAmount(fromAmount)
  }

  // Handle max button click
  const handleMaxClick = () => {
    if (fromBalance) {
      const maxAmount = parseFloat(fromBalance.formatted)
      setFromAmount(maxAmount.toString())
    }
  }
  
  // Check if approval is needed (TESTNET ONLY)
  const checkApproval = useCallback(async () => {
    if (!isTestnet || !userAddress || !fromAmount || parseFloat(fromAmount) <= 0) {
      setNeedsApproval(false)
      return
    }
    
    try {
      const poolAddress = testnetSwapService.getPoolAddress(fromToken.symbol, toToken.symbol)
      const tokenAddress = testnetSwapService.getTokenAddress(fromToken.symbol)
      
      if (!poolAddress || !tokenAddress) {
        setNeedsApproval(false)
        return
      }
      
      // For testnet, always require approval for simplicity
      // In production, you'd check the actual allowance
      setNeedsApproval(true)
    } catch (error) {
      console.error('Error checking approval:', error)
      setNeedsApproval(false)
    }
  }, [isTestnet, userAddress, fromAmount, fromToken, toToken])
  
  // Handle approval (TESTNET ONLY)
  const handleApprove = async () => {
    if (!isTestnet || !userAddress || !fromAmount) return
    
    try {
      const poolAddress = testnetSwapService.getPoolAddress(fromToken.symbol, toToken.symbol)
      const tokenAddress = testnetSwapService.getTokenAddress(fromToken.symbol)
      
      if (!poolAddress || !tokenAddress) {
        throw new Error('Pool or token not found')
      }
      
      console.log('Approving token:', tokenAddress, 'for pool:', poolAddress)
      
      // Approve max amount for convenience
      await writeApprove({
        address: tokenAddress as Address,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [poolAddress as Address, parseUnits('1000000000', 18)]
      })
      
      setIsApproving(true)
    } catch (error) {
      console.error('Approval error:', error)
      toast.error('Failed to approve token')
      setIsApproving(false)
    }
  }
  
  // Handle swap execution (TESTNET ONLY)
  const handleSwap = async () => {
    if (!isTestnet) {
      toast.error('Swap is only available on testnet')
      return
    }
    
    if (!userAddress || !fromAmount || !toAmount) return
    
    try {
      console.log('Attempting swap:', {
        from: fromToken.symbol,
        to: toToken.symbol,
        amount: fromAmount,
        slippage: slippage
      })
      
      const swapParams = testnetSwapService.formatSwapParams(
        fromToken.symbol,
        toToken.symbol,
        fromAmount,
        parseFloat(slippage)
      )
      
      if (!swapParams) {
        // Check what's missing
        const poolAddress = testnetSwapService.getPoolAddress(fromToken.symbol, toToken.symbol)
        const tokenAddress = testnetSwapService.getTokenAddress(fromToken.symbol)
        
        if (!poolAddress) {
          throw new Error(`No pool found for ${fromToken.symbol}/${toToken.symbol}`)
        }
        if (!tokenAddress) {
          throw new Error(`Token ${fromToken.symbol} not found in contracts`)
        }
        throw new Error('Failed to prepare swap parameters')
      }
      
      console.log('Executing swap with params:', swapParams)
      
      // Execute swap on SimpleLiquidityPool
      await writeSwap({
        address: swapParams.poolAddress as Address,
        abi: SIMPLE_POOL_ABI,
        functionName: 'swap',
        args: [swapParams.amountInWei, swapParams.zeroForOne]
      })
      
      setIsSwapping(true)
    } catch (error) {
      console.error('Swap error:', error)
      toast.error('Failed to execute swap')
      setIsSwapping(false)
    }
  }
  
  // Check approval when amount changes (TESTNET ONLY)
  useEffect(() => {
    if (isTestnet) {
      checkApproval()
    }
  }, [checkApproval, isTestnet])
  
  return (
    <Card className="bg-slate-900/50 border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Swap</CardTitle>
            <CardDescription>Trade tokens instantly</CardDescription>
          </div>
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
            <Input
              type="number"
              placeholder="0.00"
              value={toAmount}
              readOnly
              className="flex-1 bg-transparent border-0 text-2xl font-medium focus:ring-0"
            />
            <TokenSelect
              value={toToken}
              onChange={setToToken}
              excludeToken={fromToken.symbol}
            />
          </div>
          {toAmount && quote && (
            <div className="mt-2 text-sm text-muted-foreground">
              ≈ ${formatNumber(parseFloat(toAmount) * (quote.executionPrice || 1))}
            </div>
          )}
        </div>

        {/* Error Message */}
        {quoteError && (
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

        {/* Swap Button - WITH onClick handler for testnet */}
        <Button 
          className="w-full" 
          size="lg"
          onClick={isTestnet ? (needsApproval ? handleApprove : handleSwap) : undefined}
          disabled={
            !isConnected || 
            !fromAmount || 
            !toAmount || 
            isLoadingQuote ||
            isApproving || isApprovePending || isApproveConfirming ||
            isSwapping || isSwapPending || isSwapConfirming ||
            (fromBalance && parseFloat(fromAmount) > parseFloat(fromBalance.formatted))
          }
        >
          {!isConnected ? (
            'Connect Wallet'
          ) : (isApproving || isApprovePending) ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Approving...
            </>
          ) : isApproveConfirming ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Confirming Approval...
            </>
          ) : (isSwapping || isSwapPending) ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Swapping...
            </>
          ) : isSwapConfirming ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Confirming Swap...
            </>
          ) : isLoadingQuote ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Fetching Best Price...
            </>
          ) : fromBalance && parseFloat(fromAmount) > parseFloat(fromBalance.formatted) ? (
            'Insufficient Balance'
          ) : !fromAmount || !toAmount ? (
            'Enter Amount'
          ) : isTestnet && needsApproval ? (
            `Approve ${fromToken.symbol}`
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