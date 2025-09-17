'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAccount, useWalletClient, usePublicClient, useBalance, useChainId } from 'wagmi'
import { parseEther, formatUnits, type Address } from 'viem'
import * as chains from 'viem/chains'
import { 
  ArrowDownUp,
  Sparkles,
  ChevronDown,
  Settings,
  Info,
  Clock,
  Fuel,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Loader2,
  ExternalLink,
  Route as RouteIcon,
  TrendingUp,
  Activity,
  Zap,
  Shield,
  Globe,
  Layers,
  ArrowRight,
  RefreshCw,
  Wallet,
  ChevronRight,
  Star,
  Gem
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TokenDisplay } from '@/components/ui/TokenSelect'
import { getTokenInfo, type TokenInfo } from '@/lib/constants/tokenImages'
import { 
  stargateApi, 
  type BridgeQuote,
  type Chain,
  TOKEN_ADDRESSES,
  NATIVE_TOKEN_ADDRESS
} from '@/lib/services/stargateApi.service'
import { formatNumber, formatCurrency } from '@/lib/utils'
import { TokenSelectionModal } from './TokenSelectionModal'
import { ChainSelectionModal } from './ChainSelectionModal'
import { BridgeLoadingState } from './BridgeLoadingState'
import { ConversionPreview } from './ConversionPreview'

// Supported tokens for bridging on each chain
const BRIDGE_TOKENS = {
  somnia: ['SOMI', 'WETH', 'USDC', 'USDT'],
  ethereum: ['ETH', 'USDC', 'USDT', 'WETH', 'SOMI'],
  polygon: ['MATIC', 'USDC', 'USDT', 'WETH'],
  arbitrum: ['ETH', 'USDC', 'USDT', 'WETH'],
  base: ['ETH', 'USDC', 'WETH', 'SOMI'],
  bsc: ['BNB', 'USDC', 'USDT', 'ETH', 'SOMI'],
}

// Beautiful chain configurations with logos and gradients
const CHAIN_CONFIG = {
  ethereum: {
    name: 'Ethereum',
    logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
    color: '#627EEA',
    gradient: 'from-blue-500 to-blue-600',
    bgGradient: 'from-blue-500/10 via-transparent to-blue-600/10',
    nativeToken: 'ETH'
  },
  polygon: {
    name: 'Polygon',
    logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png',
    color: '#8247E5',
    gradient: 'from-purple-500 to-purple-600',
    bgGradient: 'from-purple-500/10 via-transparent to-purple-600/10',
    nativeToken: 'MATIC'
  },
  arbitrum: {
    name: 'Arbitrum',
    logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png',
    color: '#2D374B',
    gradient: 'from-slate-600 to-slate-700',
    bgGradient: 'from-slate-600/10 via-transparent to-slate-700/10',
    nativeToken: 'ETH'
  },
  base: {
    name: 'Base',
    logo: 'https://avatars.githubusercontent.com/u/108554348?s=200&v=4',
    color: '#0052FF',
    gradient: 'from-blue-500 to-indigo-600',
    bgGradient: 'from-blue-500/10 via-transparent to-indigo-600/10',
    nativeToken: 'ETH'
  },
  bsc: {
    name: 'BNB Chain',
    logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/info/logo.png',
    color: '#F3BA2F',
    gradient: 'from-yellow-400 to-yellow-500',
    bgGradient: 'from-yellow-400/10 via-transparent to-yellow-500/10',
    nativeToken: 'BNB'
  },
  somnia: {
    name: 'Somnia',
    logo: '/somi_token_logo.png',
    color: '#8B5CF6',
    gradient: 'from-purple-500 to-pink-500',
    bgGradient: 'from-purple-500/10 via-transparent to-pink-500/10',
    nativeToken: 'SOMI'
  }
}

export default function ModernStargateBridge() {
  // Wagmi hooks
  const { address, isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()
  
  // State management
  const [loading, setLoading] = useState(false)
  const [quotes, setQuotes] = useState<BridgeQuote[]>([])
  const [selectedQuote, setSelectedQuote] = useState<BridgeQuote | null>(null)
  const [availableRoutes, setAvailableRoutes] = useState<any[]>([])
  const [availableFromTokens, setAvailableFromTokens] = useState<string[]>([])
  const [availableToTokens, setAvailableToTokens] = useState<string[]>([])
  const [tokenPrices, setTokenPrices] = useState<Record<string, number>>({})
  
  // Form state - Always start with Somnia as destination
  const [fromChain, setFromChain] = useState('ethereum')
  const [toChain, setToChain] = useState('somnia')
  const [fromToken, setFromToken] = useState<TokenInfo>(getTokenInfo('ETH'))
  const [toToken, setToToken] = useState<TokenInfo>(getTokenInfo('SOMI'))
  const [fromAmount, setFromAmount] = useState('')
  const [toAmount, setToAmount] = useState('')
  const [slippage, setSlippage] = useState('0.5')
  const [showSettings, setShowSettings] = useState(false)
  const [showRoutes, setShowRoutes] = useState(false)
  const [showChainSelect, setShowChainSelect] = useState<'from' | 'to' | null>(null)
  const [showFromTokenSelect, setShowFromTokenSelect] = useState(false)
  const [showToTokenSelect, setShowToTokenSelect] = useState(false)
  
  // Transaction state
  const [txStatus, setTxStatus] = useState<'idle' | 'fetching' | 'approving' | 'bridging' | 'success' | 'error'>('idle')
  const [txHash, setTxHash] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  
  // Get token address based on chain and token selection
  const getTokenAddress = (chain: string, token: TokenInfo): Address | undefined => {
    const chainTokens = TOKEN_ADDRESSES[chain as keyof typeof TOKEN_ADDRESSES]
    if (!chainTokens) return undefined
    
    const tokenAddress = (chainTokens as any)[token.symbol]
    if (!tokenAddress) return undefined
    
    // For native tokens, return undefined (useBalance will fetch native balance)
    if (tokenAddress === NATIVE_TOKEN_ADDRESS) return undefined
    
    return tokenAddress as Address
  }
  
  // Fetch balances for from and to tokens
  const fromTokenAddress = getTokenAddress(fromChain, fromToken)
  const toTokenAddress = getTokenAddress(toChain, toToken)
  
  const { data: fromBalance } = useBalance({
    address,
    token: fromTokenAddress,
    chainId: chains[fromChain as keyof typeof chains]?.id
  })
  
  const { data: toBalance } = useBalance({
    address,
    token: toTokenAddress,
    chainId: chains[toChain as keyof typeof chains]?.id
  })

  // Validate and set chains to ensure Somnia is always on one side
  const validateAndSetChains = (newFromChain: string, newToChain: string, source: 'from' | 'to') => {
    // Enforce Somnia on one side
    if (source === 'from') {
      if (newFromChain === 'somnia') {
        // Selecting Somnia as source
        if (newToChain === 'somnia') {
          // Both can't be Somnia, switch destination
          setToChain('ethereum')
        }
        setFromChain(newFromChain)
      } else {
        // Selecting non-Somnia as source, ensure destination is Somnia
        setFromChain(newFromChain)
        if (newToChain !== 'somnia') {
          setToChain('somnia')
        }
      }
    } else {
      if (newToChain === 'somnia') {
        // Selecting Somnia as destination
        if (newFromChain === 'somnia') {
          // Both can't be Somnia, switch source
          setFromChain('ethereum')
        }
        setToChain(newToChain)
      } else {
        // Selecting non-Somnia as destination, ensure source is Somnia
        if (newFromChain !== 'somnia') {
          setFromChain('somnia')
        }
        setToChain(newToChain)
      }
    }
    
    setError(null)
    setQuotes([])
    setSelectedQuote(null)
    setToAmount('')
    return true
  }

  const handleSwapChains = () => {
    // Always keep Somnia on one side when swapping
    if (fromChain === 'somnia') {
      // Somnia is source, move to destination
      setFromChain(toChain)
      setToChain('somnia')
    } else if (toChain === 'somnia') {
      // Somnia is destination, move to source
      setFromChain('somnia')
      setToChain(fromChain)
    } else {
      // Neither is Somnia (shouldn't happen), set Somnia as destination
      setToChain('somnia')
    }
    
    setFromAmount(toAmount)
    setToAmount(fromAmount)
    setQuotes([])
    setSelectedQuote(null)
    setError(null)
  }

  const fetchQuotes = async () => {
    if (!fromAmount || parseFloat(fromAmount) <= 0) return

    setLoading(true)
    setError(null)
    setTxStatus('fetching')
    
    try {
      // Try to fetch real quotes from Stargate API
      const srcChainTokens = TOKEN_ADDRESSES[fromChain as keyof typeof TOKEN_ADDRESSES];
      const dstChainTokens = TOKEN_ADDRESSES[toChain as keyof typeof TOKEN_ADDRESSES];
      
      // Find matching route from available routes
      let srcToken = NATIVE_TOKEN_ADDRESS;
      let dstToken = NATIVE_TOKEN_ADDRESS;
      
      const matchingRoute = availableRoutes.find(route => {
        // Match based on token symbols
        const srcMatches = route.symbol === fromToken.symbol || 
          (fromToken.symbol === 'SOMI' && route.symbol === 'SOMI');
        
        const dstSymbol = route.dstName ? route.dstName.split(' ')[0].toUpperCase() : route.symbol;
        const dstMatches = dstSymbol === toToken.symbol ||
          (toToken.symbol === 'SOMI' && (dstSymbol === 'SOMI' || dstSymbol === 'SOMNIAOFT'));
        
        return srcMatches && dstMatches;
      });
      
      if (matchingRoute) {
        srcToken = matchingRoute.srcAddress;
        dstToken = matchingRoute.dstAddress;
      } else {
        // Fallback to hardcoded addresses for known tokens
        // Special case for SOMI bridging
        if (fromToken.symbol === 'SOMI') {
          if (fromChain === 'ethereum') {
            srcToken = TOKEN_ADDRESSES.ethereum.SOMI;
            dstToken = TOKEN_ADDRESSES.somnia.SOMI;
          } else if (fromChain === 'somnia') {
            srcToken = TOKEN_ADDRESSES.somnia.SOMI;
            dstToken = (dstChainTokens as any)?.SOMI || NATIVE_TOKEN_ADDRESS;
          } else if (fromChain === 'base') {
            srcToken = TOKEN_ADDRESSES.base.SOMI;
            dstToken = TOKEN_ADDRESSES.somnia.SOMI;
          } else if (fromChain === 'bsc') {
            srcToken = TOKEN_ADDRESSES.bsc.SOMI;
            dstToken = TOKEN_ADDRESSES.somnia.SOMI;
          }
        } else {
          srcToken = (srcChainTokens && fromToken.symbol in srcChainTokens) 
            ? (srcChainTokens as any)[fromToken.symbol] 
            : NATIVE_TOKEN_ADDRESS;
          dstToken = (dstChainTokens && toToken.symbol in dstChainTokens) 
            ? (dstChainTokens as any)[toToken.symbol] 
            : NATIVE_TOKEN_ADDRESS;
        }
      }
      
      const params = {
        srcToken,
        dstToken,
        srcAddress: address || '0x0000000000000000000000000000000000000001' as Address,
        dstAddress: address || '0x0000000000000000000000000000000000000001' as Address,
        srcChainKey: fromChain as any,
        dstChainKey: toChain as any,
        srcAmount: stargateApi.formatTokenAmount(fromAmount, fromToken.decimals),
        dstAmountMin: stargateApi.formatTokenAmount((parseFloat(fromAmount) * (1 - parseFloat(slippage) / 100)).toString(), toToken.decimals),
      }
      
      const realQuotes = await stargateApi.getQuotes(params)
      
      if (realQuotes && realQuotes.length > 0) {
        setQuotes(realQuotes)
        setSelectedQuote(realQuotes[0])
        const outputAmount = stargateApi.parseTokenAmount(realQuotes[0].dstAmount, toToken.decimals)
        setToAmount(outputAmount)
      } else {
        setQuotes([])
        setSelectedQuote(null)
        setToAmount('')
        setError('This bridge route is not available. Please try a different token or chain combination.')
      }
    } catch (error) {
      console.error('Failed to generate quotes:', error)
      setError('Bridge service temporarily unavailable.')
    } finally {
      setLoading(false)
      setTxStatus('idle')
    }
  }

  // Fetch available tokens when chains change
  useEffect(() => {
    const loadAvailableTokens = async () => {
      try {
        const routes = await stargateApi.getSupportedTokens(fromChain as any, toChain as any)
        setAvailableRoutes(routes)
        
        const uniqueFromTokens = [...new Set(routes.map(r => r.symbol))]
        const uniqueToTokens = [...new Set(routes.map(r => {
          const dstName = r.dstName || r.symbol
          return dstName.split(' ')[0].toUpperCase()
        }))]
        
        setAvailableFromTokens(uniqueFromTokens)
        setAvailableToTokens(uniqueToTokens)
        
        // Get token prices
        const prices = await stargateApi.getTokenPrices()
        setTokenPrices(prices)
      } catch (error) {
        console.error('Failed to load available tokens:', error)
      }
    }
    
    loadAvailableTokens()
  }, [fromChain, toChain])

  // Auto-fetch quotes when amount changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (fromAmount && parseFloat(fromAmount) > 0) {
        fetchQuotes()
      } else {
        setToAmount('')
        setQuotes([])
        setSelectedQuote(null)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [fromAmount, fromChain, toChain, fromToken, toToken, slippage])

  const executeBridge = async () => {
    if (!selectedQuote || !walletClient || !address) return

    try {
      // Execute bridge transaction steps
      for (const step of selectedQuote.steps) {
        if (step.type === 'approve') {
          setTxStatus('approving')
          console.log('Approving token...')
          
          const approveTx = await walletClient.sendTransaction({
            to: step.transaction.to as Address,
            data: step.transaction.data as `0x${string}`,
            value: step.transaction.value ? BigInt(step.transaction.value) : undefined,
            account: address,
            chain: chains[fromChain as keyof typeof chains],
          })
          
          if (publicClient) {
            await publicClient.waitForTransactionReceipt({ hash: approveTx })
          }
        } else if (step.type === 'bridge') {
          setTxStatus('bridging')
          console.log('Executing bridge transaction...')
          
          const bridgeTx = await walletClient.sendTransaction({
            to: step.transaction.to as Address,
            data: step.transaction.data as `0x${string}`,
            value: step.transaction.value ? BigInt(step.transaction.value) : undefined,
            account: address,
            chain: chains[fromChain as keyof typeof chains],
          })
          
          setTxHash(bridgeTx)
          
          if (publicClient) {
            const receipt = await publicClient.waitForTransactionReceipt({ hash: bridgeTx })
            
            if (receipt?.status === 'success') {
              setTxStatus('success')
            } else {
              throw new Error('Transaction failed')
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Bridge error:', error)
      setError(error.message || 'Bridge transaction failed')
      setTxStatus('idle')
    }
  }

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`
    return `${Math.round(seconds / 3600)}h`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 md:py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 md:mb-12"
        >
          <div className="inline-flex items-center px-4 py-2 mb-4 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
            <Sparkles className="w-4 h-4 mr-2 text-purple-400" />
            <span className="text-sm font-medium text-purple-300">Powered by Stargate Protocol</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Somnia Bridge
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto">
            Transfer assets seamlessly between Somnia and major blockchain networks
          </p>
        </motion.div>

        {/* Main Bridge Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl mx-auto"
        >
          <div className="relative bg-gradient-to-b from-slate-900/80 to-slate-950/80 backdrop-blur-xl rounded-3xl border border-purple-500/20 shadow-2xl shadow-purple-500/10 overflow-hidden">
            {/* Card Header with Settings */}
            <div className="p-6 md:p-8 pb-0">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl">
                    <Layers className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Cross-Chain Transfer</h2>
                    <p className="text-sm text-slate-400">Bridge your assets instantly</p>
                  </div>
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-3 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl transition-colors"
                >
                  <Settings className={`w-5 h-5 text-slate-400 transition-transform ${showSettings ? 'rotate-90' : ''}`} />
                </motion.button>
              </div>

              {/* Settings Panel */}
              <AnimatePresence>
                {showSettings && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6 p-4 bg-slate-800/30 rounded-2xl"
                  >
                    <label className="text-sm text-slate-400 mb-3 block">Slippage Tolerance</label>
                    <div className="flex flex-wrap gap-2">
                      {['0.1', '0.5', '1.0', '2.0'].map(value => (
                        <motion.button
                          key={value}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSlippage(value)}
                          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                            slippage === value
                              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                              : 'bg-slate-700/50 hover:bg-slate-600/50 text-slate-300'
                          }`}
                        >
                          {value}%
                        </motion.button>
                      ))}
                      <Input
                        type="number"
                        value={slippage}
                        onChange={(e) => setSlippage(e.target.value)}
                        className="w-24 bg-slate-800/50 border-slate-700 text-white"
                        placeholder="Custom"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bridge Form */}
            <div className="p-6 md:p-8 space-y-4">
              {/* From Section */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-2xl"></div>
                <div className="relative p-5 bg-slate-900/50 rounded-2xl border border-slate-800/50">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-slate-400">From</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">Balance:</span>
                      <span className="text-sm font-medium text-white">
                        {fromBalance ? parseFloat(fromBalance.formatted).toFixed(4) : '0.0000'}
                      </span>
                      {fromBalance && tokenPrices[fromToken.symbol] && (
                        <span className="text-xs text-slate-400">
                          (${(parseFloat(fromBalance.formatted) * tokenPrices[fromToken.symbol]).toFixed(2)})
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowChainSelect('from')}
                      className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl transition-all group"
                    >
                      <img 
                        src={CHAIN_CONFIG[fromChain as keyof typeof CHAIN_CONFIG]?.logo}
                        alt={fromChain}
                        className="w-6 h-6 rounded-full"
                      />
                      <span className="font-medium text-white hidden sm:block">
                        {CHAIN_CONFIG[fromChain as keyof typeof CHAIN_CONFIG]?.name}
                      </span>
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    </button>
                    
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={fromAmount}
                      onChange={(e) => setFromAmount(e.target.value)}
                      className="flex-1 bg-transparent border-0 text-2xl md:text-3xl font-bold text-white placeholder:text-slate-600 focus-visible:ring-0"
                    />
                    
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowFromTokenSelect(true)}
                      className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl transition-all group"
                    >
                      <TokenDisplay value={fromToken} />
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    </motion.button>
                  </div>
                  
                  {fromAmount && tokenPrices[fromToken.symbol] && (
                    <div className="mt-3 text-sm text-slate-400">
                      ≈ {formatCurrency(parseFloat(fromAmount) * tokenPrices[fromToken.symbol])}
                    </div>
                  )}
                </div>
              </div>

              {/* Swap Button */}
              <div className="flex justify-center -my-2 relative z-10">
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 180 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleSwapChains}
                  className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-lg shadow-purple-500/25"
                >
                  <ArrowDownUp className="w-5 h-5 text-white" />
                </motion.button>
              </div>

              {/* To Section */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 rounded-2xl"></div>
                <div className="relative p-5 bg-slate-900/50 rounded-2xl border border-slate-800/50">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-slate-400">To</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">Balance:</span>
                      <span className="text-sm font-medium text-white">
                        {toBalance ? parseFloat(toBalance.formatted).toFixed(4) : '0.0000'}
                      </span>
                      {toBalance && tokenPrices[toToken.symbol] && (
                        <span className="text-xs text-slate-400">
                          (${(parseFloat(toBalance.formatted) * tokenPrices[toToken.symbol]).toFixed(2)})
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowChainSelect('to')}
                      className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl transition-all group"
                    >
                      <img 
                        src={CHAIN_CONFIG[toChain as keyof typeof CHAIN_CONFIG]?.logo}
                        alt={toChain}
                        className="w-6 h-6 rounded-full"
                      />
                      <span className="font-medium text-white hidden sm:block">
                        {CHAIN_CONFIG[toChain as keyof typeof CHAIN_CONFIG]?.name}
                      </span>
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    </button>
                    
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={toAmount}
                      readOnly
                      className="flex-1 bg-transparent border-0 text-2xl md:text-3xl font-bold text-white placeholder:text-slate-600 focus-visible:ring-0"
                    />
                    
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowToTokenSelect(true)}
                      className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl transition-all group"
                    >
                      <TokenDisplay value={toToken} />
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    </motion.button>
                  </div>
                  
                  {toAmount && tokenPrices[toToken.symbol] && (
                    <div className="mt-3 text-sm text-slate-400">
                      ≈ {formatCurrency(parseFloat(toAmount) * tokenPrices[toToken.symbol])}
                    </div>
                  )}
                </div>
              </div>

              {/* Conversion Preview */}
              <ConversionPreview
                fromAmount={fromAmount}
                toAmount={toAmount}
                fromToken={fromToken.symbol}
                toToken={toToken.symbol}
                fromPrice={tokenPrices[fromToken.symbol]}
                toPrice={tokenPrices[toToken.symbol]}
                exchangeRate={fromAmount && toAmount ? parseFloat(toAmount) / parseFloat(fromAmount) : undefined}
                slippage={parseFloat(slippage)}
                isLoading={loading}
              />

              {/* Routes Section */}
              {quotes.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-slate-900/50 rounded-2xl"
                >
                  <button
                    onClick={() => setShowRoutes(!showRoutes)}
                    className="w-full flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-500/20 rounded-xl">
                        <RouteIcon className="w-4 h-4 text-purple-400" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-white">{quotes.length} Routes Available</div>
                        <div className="text-xs text-slate-400">
                          Best route ~{formatDuration(selectedQuote?.duration.estimated || 0)}
                        </div>
                      </div>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${showRoutes ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {showRoutes && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 space-y-2"
                      >
                        {quotes.slice(0, 3).map((quote, index) => (
                          <motion.div
                            key={index}
                            whileHover={{ x: 4 }}
                            onClick={() => {
                              setSelectedQuote(quote)
                              setToAmount(stargateApi.parseTokenAmount(quote.dstAmount, toToken.decimals))
                            }}
                            className={`p-4 rounded-xl cursor-pointer transition-all ${
                              selectedQuote === quote 
                                ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30' 
                                : 'bg-slate-800/30 hover:bg-slate-800/50 border border-transparent'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-medium text-white">Route {index + 1}</span>
                              {selectedQuote === quote && (
                                <span className="px-2 py-1 bg-purple-500/20 rounded-lg text-xs text-purple-300">Selected</span>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-3 gap-3">
                              <div className="text-center p-2 bg-slate-900/50 rounded-lg">
                                <Activity className="w-4 h-4 mx-auto mb-1 text-slate-400" />
                                <div className="text-sm font-medium text-white">
                                  {parseFloat(stargateApi.parseTokenAmount(quote.dstAmount, toToken.decimals)).toFixed(4)}
                                </div>
                                <div className="text-xs text-slate-500">Output</div>
                              </div>
                              <div className="text-center p-2 bg-slate-900/50 rounded-lg">
                                <Clock className="w-4 h-4 mx-auto mb-1 text-slate-400" />
                                <div className="text-sm font-medium text-white">
                                  ~{formatDuration(quote.duration.estimated)}
                                </div>
                                <div className="text-xs text-slate-500">Time</div>
                              </div>
                              <div className="text-center p-2 bg-slate-900/50 rounded-lg">
                                <Fuel className="w-4 h-4 mx-auto mb-1 text-slate-400" />
                                <div className="text-sm font-medium text-white">
                                  ${(parseFloat(quote.fees[0]?.amount || '0') / 1e18 * 2000).toFixed(2)}
                                </div>
                                <div className="text-xs text-slate-500">Fee</div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl"
                >
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-red-400">Bridge Error</div>
                      <div className="text-sm text-red-400/80 mt-1">{error}</div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Bridge Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={executeBridge}
                disabled={!selectedQuote || !isConnected || !fromAmount || loading}
                className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all flex items-center justify-center gap-3 ${
                  !isConnected
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white'
                    : selectedQuote && fromAmount && !loading
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/25'
                    : 'bg-slate-800/50 text-slate-400 cursor-not-allowed'
                }`}
              >
                {!isConnected ? (
                  <>
                    <Wallet className="w-5 h-5" />
                    Connect Wallet
                  </>
                ) : loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Fetching Best Route...
                  </>
                ) : selectedQuote && fromAmount ? (
                  <>
                    <Zap className="w-5 h-5" />
                    Bridge {fromToken.symbol}
                  </>
                ) : (
                  'Enter Amount to Bridge'
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Modals */}
      <BridgeLoadingState
        isLoading={txStatus !== 'idle'}
        status={txStatus}
        fromToken={fromToken.symbol}
        toToken={toToken.symbol}
        fromChain={CHAIN_CONFIG[fromChain as keyof typeof CHAIN_CONFIG]?.name}
        toChain={CHAIN_CONFIG[toChain as keyof typeof CHAIN_CONFIG]?.name}
        amount={fromAmount}
        estimatedTime={selectedQuote?.duration.estimated}
        txHash={txHash}
      />

      <TokenSelectionModal
        isOpen={showFromTokenSelect}
        onClose={() => setShowFromTokenSelect(false)}
        onSelect={(token) => {
          setFromToken(token)
          setShowFromTokenSelect(false)
        }}
        availableTokens={availableFromTokens.length > 0 ? availableFromTokens : BRIDGE_TOKENS[fromChain as keyof typeof BRIDGE_TOKENS] || []}
        tokenPrices={tokenPrices}
        selectedToken={fromToken}
        chainName={CHAIN_CONFIG[fromChain as keyof typeof CHAIN_CONFIG]?.name || fromChain}
      />

      <TokenSelectionModal
        isOpen={showToTokenSelect}
        onClose={() => setShowToTokenSelect(false)}
        onSelect={(token) => {
          setToToken(token)
          setShowToTokenSelect(false)
        }}
        availableTokens={availableToTokens.length > 0 ? availableToTokens : BRIDGE_TOKENS[toChain as keyof typeof BRIDGE_TOKENS] || []}
        tokenPrices={tokenPrices}
        selectedToken={toToken}
        chainName={CHAIN_CONFIG[toChain as keyof typeof CHAIN_CONFIG]?.name || toChain}
      />

      <ChainSelectionModal
        isOpen={showChainSelect !== null}
        onClose={() => setShowChainSelect(null)}
        onSelect={(chain) => {
          if (showChainSelect === 'from') {
            validateAndSetChains(chain, toChain, 'from')
          } else {
            validateAndSetChains(fromChain, chain, 'to')
          }
          setShowChainSelect(null)
        }}
        chains={CHAIN_CONFIG}
        selectedChain={showChainSelect === 'from' ? fromChain : toChain}
        otherChain={showChainSelect === 'from' ? toChain : fromChain}
        direction={showChainSelect || 'from'}
      />

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -30px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(30px, 10px) scale(1.05); }
        }
        .animate-blob {
          animation: blob 20s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}