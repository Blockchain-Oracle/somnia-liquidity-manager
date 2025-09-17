'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAccount, useBalance, useWalletClient, usePublicClient, useChainId } from 'wagmi'
import { formatUnits, parseUnits, type Address } from 'viem'
import { mainnet, bsc, base, polygon, arbitrum } from 'viem/chains'
import { somniaMainnet } from '@/lib/wagmi'
import { 
  ArrowDown,
  ArrowRight,
  Globe,
  Shield,
  Zap,
  Info,
  Settings,
  ChevronDown,
  RefreshCw,
  Clock,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Loader2,
  ExternalLink,
  Fuel,
  Route as RouteIcon,
  TrendingUp,
  Sparkles,
  ArrowUpDown,
  Layers,
  Activity
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TokenDisplay } from '@/components/ui/TokenSelect'
import { TokenSelectionModal } from './TokenSelectionModal'
import { ChainSelectionModal } from './ChainSelectionModal'
import { BridgeLoadingState } from './BridgeLoadingState'
import { ConversionPreview } from './ConversionPreview'
import { getTokenInfo, type TokenInfo } from '@/lib/constants/tokenImages'
import { 
  stargateApi, 
  type BridgeQuote,
  type Chain,
  type Token,
  CHAIN_KEYS,
  TOKEN_ADDRESSES,
  NATIVE_TOKEN_ADDRESS
} from '@/lib/services/stargateApi.service'
import { formatNumber, formatCurrency } from '@/lib/utils'

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
    nativeToken: 'ETH'
  },
  polygon: {
    name: 'Polygon',
    logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png',
    color: '#8247E5',
    gradient: 'from-purple-500 to-purple-600',
    nativeToken: 'MATIC'
  },
  arbitrum: {
    name: 'Arbitrum',
    logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png',
    color: '#2D374B',
    gradient: 'from-blue-600 to-blue-700',
    nativeToken: 'ETH'
  },
  optimism: {
    name: 'Optimism',
    logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/optimism/info/logo.png',
    color: '#FF0420',
    gradient: 'from-red-500 to-red-600',
    nativeToken: 'ETH'
  },
  base: {
    name: 'Base',
    logo: 'https://avatars.githubusercontent.com/u/108554348?s=200&v=4',
    color: '#0052FF',
    gradient: 'from-blue-500 to-indigo-600',
    nativeToken: 'ETH'
  },
  bsc: {
    name: 'BNB Chain',
    logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/info/logo.png',
    color: '#F3BA2F',
    gradient: 'from-yellow-400 to-yellow-500',
    nativeToken: 'BNB'
  },
  somnia: {
    name: 'Somnia',
    logo: '/somi-logo.png',
    color: '#8B5CF6',
    gradient: 'from-purple-500 to-pink-500',
    nativeToken: 'SOMI'
  }
}

export default function EnhancedStargateBridge() {
  // Wagmi hooks
  const { address, isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()
  
  // State management
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [chains, setChains] = useState<Chain[]>([])
  const [quotes, setQuotes] = useState<BridgeQuote[]>([])
  const [selectedQuote, setSelectedQuote] = useState<BridgeQuote | null>(null)
  const [availableRoutes, setAvailableRoutes] = useState<any[]>([])
  const [availableFromTokens, setAvailableFromTokens] = useState<string[]>([]) // Dynamic from tokens
  const [availableToTokens, setAvailableToTokens] = useState<string[]>([]) // Dynamic to tokens
  const [tokenPrices, setTokenPrices] = useState<Record<string, number>>({}) // USD prices
  
  // Form state - Always start with Somnia as destination
  const [fromChain, setFromChain] = useState<string>('ethereum')
  const [toChain, setToChain] = useState<string>('somnia')
  const [fromToken, setFromToken] = useState<TokenInfo>(getTokenInfo('ETH'))
  const [toToken, setToToken] = useState<TokenInfo>(getTokenInfo('WETH'))
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
  
  // Get current chain ID
  const chainId = useChainId()
  
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
  
  // Use wagmi's useBalance hook for actual balance fetching
  const { data: fromBalance } = useBalance({
    address: address,
    token: fromTokenAddress,
    chainId: fromChain === 'somnia' ? somniaMainnet.id : 
             fromChain === 'ethereum' ? mainnet.id :
             fromChain === 'polygon' ? polygon.id :
             fromChain === 'arbitrum' ? arbitrum.id :
             fromChain === 'base' ? base.id :
             fromChain === 'bsc' ? bsc.id : 
             chainId,
    query: { enabled: !!address && isConnected },
  })
  
  const { data: toBalance } = useBalance({
    address: address,
    token: toTokenAddress,
    chainId: toChain === 'somnia' ? somniaMainnet.id : 
             toChain === 'ethereum' ? mainnet.id :
             toChain === 'polygon' ? polygon.id :
             toChain === 'arbitrum' ? arbitrum.id :
             toChain === 'base' ? base.id :
             toChain === 'bsc' ? bsc.id :
             chainId,
    query: { enabled: !!address && isConnected },
  })

  // No need to load chains - we have them predefined for Somnia
  // This is a Somnia-specific project

  // Validation: Ensure one chain is always Somnia (pure function, no side effects)
  const isValidChainSelection = (newFromChain: string, newToChain: string) => {
    return newFromChain === 'somnia' || newToChain === 'somnia'
  }
  
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
        console.log('Checking route:', { 
          routeSymbol: route.symbol, 
          fromSymbol: fromToken.symbol, 
          toSymbol: toToken.symbol,
          routeSrcAddress: route.srcAddress,
          routeDstAddress: route.dstAddress,
          routeDstName: route.dstName
        });
        
        // Match based on token symbols, accounting for variations
        const srcMatches = 
          route.symbol === fromToken.symbol ||
          (fromToken.symbol === 'ETH' && (route.symbol === 'WETH' || route.symbol === 'ETH')) ||
          (fromToken.symbol === 'WETH' && (route.symbol === 'WETH' || route.symbol === 'ETH')) ||
          (fromToken.symbol === 'USDC' && route.symbol.includes('USDC')) ||
          (fromToken.symbol === 'SOMI' && route.symbol === 'SOMI'); // Fixed SOMI matching
        
        // For destination, check the destination name/symbol from the route
        const dstSymbol = route.dstName ? route.dstName.split(' ')[0].toUpperCase() : route.symbol;
        const dstMatches = 
          dstSymbol === toToken.symbol ||
          (toToken.symbol === 'ETH' && dstSymbol === 'ETH') ||
          (toToken.symbol === 'WETH' && (dstSymbol === 'WETH' || dstSymbol === 'ETH')) ||
          (toToken.symbol === 'USDC' && dstSymbol.includes('USDC')) ||
          (toToken.symbol === 'SOMI' && (dstSymbol === 'SOMI' || dstSymbol === 'SOMNIAOFT')); // Added SOMI matching
        
        console.log('Match result:', { srcMatches, dstMatches });
        return srcMatches && dstMatches;
      });
      
      if (matchingRoute) {
        srcToken = matchingRoute.srcAddress;
        dstToken = matchingRoute.dstAddress;
        console.log('Using route:', { 
          from: `${fromToken.symbol} (${srcToken})`,
          to: `${toToken.symbol} (${dstToken})`,
          route: matchingRoute 
        });
      } else {
        console.log('No matching route found, using fallback addresses');
        // Fallback to hardcoded addresses for known tokens
        // Special case for SOMI bridging
        if (fromToken.symbol === 'SOMI' && fromChain === 'ethereum') {
          srcToken = TOKEN_ADDRESSES.ethereum.SOMI;
          dstToken = TOKEN_ADDRESSES.somnia.SOMI; // Native on Somnia
        } else if (fromToken.symbol === 'SOMI' && fromChain === 'somnia') {
          srcToken = TOKEN_ADDRESSES.somnia.SOMI; // Native on Somnia
          dstToken = (dstChainTokens as any)?.SOMI || NATIVE_TOKEN_ADDRESS;
        } else if (fromToken.symbol === 'SOMI' && fromChain === 'base') {
          srcToken = TOKEN_ADDRESSES.base.SOMI;
          dstToken = TOKEN_ADDRESSES.somnia.SOMI;
        } else if (fromToken.symbol === 'SOMI' && fromChain === 'bsc') {
          srcToken = TOKEN_ADDRESSES.bsc.SOMI;
          dstToken = TOKEN_ADDRESSES.somnia.SOMI;
        } else {
          // Standard fallback
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
      
      console.log('Fetching quotes with params:', params)
      const realQuotes = await stargateApi.getQuotes(params)
      
      if (realQuotes && realQuotes.length > 0) {
        console.log('Got real quotes:', realQuotes)
        setQuotes(realQuotes)
        setSelectedQuote(realQuotes[0])
        const outputAmount = stargateApi.parseTokenAmount(realQuotes[0].dstAmount, toToken.decimals)
        setToAmount(outputAmount)
      } else {
        // No quotes available for this route
        console.log('No quotes available for this route')
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
        console.log(`Fetching available routes for ${fromChain} -> ${toChain}`)
        
        // Get token prices first
        const prices = await stargateApi.getTokenPrices()
        setTokenPrices(prices)
        
        const routes = await stargateApi.getSupportedTokens(fromChain as any, toChain as any)
        console.log('Available routes:', routes)
        setAvailableRoutes(routes)
        
        // Build lists of unique tokens for each side
        const fromTokenSet = new Set<string>()
        const toTokenSet = new Set<string>()
        
        routes.forEach(route => {
          // Map source token symbols
          let sourceSymbol = route.symbol
          let destSymbol = route.dstName ? route.dstName.split(' ')[0].toUpperCase() : route.symbol
          
          // Special handling for Somnia tokens
          if (fromChain === 'somnia') {
            // On Somnia: WETH, USDC.e -> USDC, USDT, SOMI (native)
            if (sourceSymbol === 'WETH' || sourceSymbol === 'ETH') {
              fromTokenSet.add('WETH')
              toTokenSet.add('ETH')
            } else if (sourceSymbol.includes('USDC')) {
              fromTokenSet.add('USDC') // Show as USDC in UI
              toTokenSet.add('USDC')
            } else if (sourceSymbol === 'USDT') {
              fromTokenSet.add('USDT')
              toTokenSet.add('USDT')
            } else if (route.srcAddress === NATIVE_TOKEN_ADDRESS) {
              fromTokenSet.add('SOMI')
            }
          } else if (toChain === 'somnia') {
            // To Somnia: ETH -> WETH, USDC -> USDC.e
            if (sourceSymbol === 'ETH' || sourceSymbol === 'WETH') {
              fromTokenSet.add('ETH')
              toTokenSet.add('WETH') // Becomes WETH on Somnia
            } else if (sourceSymbol.includes('USDC')) {
              fromTokenSet.add('USDC')
              toTokenSet.add('USDC') // Becomes USDC.e on Somnia
            } else if (sourceSymbol === 'USDT') {
              fromTokenSet.add('USDT')
              toTokenSet.add('USDT')
            } else {
              // Native tokens on source chain
              const nativeSymbol = CHAIN_CONFIG[fromChain as keyof typeof CHAIN_CONFIG]?.nativeToken
              if (route.srcAddress === NATIVE_TOKEN_ADDRESS && nativeSymbol) {
                fromTokenSet.add(nativeSymbol)
              } else {
                fromTokenSet.add(sourceSymbol)
              }
              toTokenSet.add(destSymbol)
            }
          } else {
            // Non-Somnia routes
            fromTokenSet.add(sourceSymbol)
            toTokenSet.add(destSymbol)
          }
        })
        
        const fromList = Array.from(fromTokenSet).sort()
        const toList = Array.from(toTokenSet).sort()
        
        console.log('Available from tokens:', fromList)
        console.log('Available to tokens:', toList)
        
        setAvailableFromTokens(fromList)
        setAvailableToTokens(toList)
        
        // Auto-adjust token selection if current is not available
        if (fromList.length > 0 && !fromList.includes(fromToken.symbol)) {
          const newToken = fromList[0]
          setFromToken(getTokenInfo(newToken))
        }
        
        if (toList.length > 0 && !toList.includes(toToken.symbol)) {
          const newToken = toList[0]
          setToToken(getTokenInfo(newToken))
        }
        
        // If no routes found, show message
        if (routes.length === 0) {
          setError('No bridge routes available between these chains. Try selecting different chains.')
        } else {
          setError(null)
        }
      } catch (error) {
        console.error('Failed to load available tokens:', error)
        // Fallback to static lists
        setAvailableFromTokens(BRIDGE_TOKENS[fromChain as keyof typeof BRIDGE_TOKENS] || [])
        setAvailableToTokens(BRIDGE_TOKENS[toChain as keyof typeof BRIDGE_TOKENS] || [])
      }
    }
    loadAvailableTokens()
  }, [fromChain, toChain])
  
  // Auto-fetch quotes when amount or tokens change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (fromAmount && availableRoutes.length > 0) {
        fetchQuotes()
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [fromAmount, fromChain, toChain, fromToken, toToken, availableRoutes])

  const handleBridge = async () => {
    if (!address || !walletClient) {
      setError('Please connect your wallet first')
      return
    }
    
    if (!selectedQuote) {
      setError('No bridge route available for this token pair')
      return
    }
    
    if (!selectedQuote.steps || selectedQuote.steps.length === 0) {
      setError('Bridge transaction data not available. Please try again.')
      return
    }

    setTxStatus('approving')
    setError(null)
    
    try {
      // Determine the chain configuration
      const chainMap = {
        'ethereum': mainnet,
        'bsc': bsc,
        'base': base,
        'polygon': polygon,
        'arbitrum': arbitrum,
        'somnia': somniaMainnet
      }
      
      const sourceChain = chainMap[fromChain as keyof typeof chainMap]
      
      if (!sourceChain) {
        throw new Error('Unsupported source chain')
      }
      
      // Execute the bridge transaction steps
      for (const step of selectedQuote.steps) {
        if (step.type === 'approve') {
          console.log('Executing approval transaction...')
          
          // Execute approval transaction
          const approveTx = await walletClient.sendTransaction({
            to: step.transaction.to as Address,
            data: step.transaction.data as `0x${string}`,
            account: address,
            chain: sourceChain,
          })
          
          console.log('Approval tx submitted:', approveTx)
          
          if (approveTx && publicClient) {
            // Wait for approval confirmation
            const receipt = await publicClient.waitForTransactionReceipt({ hash: approveTx })
            console.log('Approval confirmed:', receipt)
          }
        } else if (step.type === 'bridge') {
          setTxStatus('bridging')
          console.log('Executing bridge transaction...')
          
          // Execute bridge transaction
          const bridgeTx = await walletClient.sendTransaction({
            to: step.transaction.to as Address,
            data: step.transaction.data as `0x${string}`,
            value: step.transaction.value ? BigInt(step.transaction.value) : undefined,
            account: address,
            chain: sourceChain,
          })
          
          console.log('Bridge tx submitted:', bridgeTx)
          setTxHash(bridgeTx)
          
          if (publicClient) {
            // Wait for bridge confirmation
            const receipt = await publicClient.waitForTransactionReceipt({ hash: bridgeTx })
            console.log('Bridge tx receipt:', receipt)
            
            if (receipt?.status === 'success') {
              setTxStatus('success')
              console.log('Bridge successful! Track on LayerZero Scan:')
              console.log(`https://layerzeroscan.com/tx/${bridgeTx}`)
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

  const formatFee = (fee: string, decimals: number = 18) => {
    const value = parseFloat(stargateApi.parseTokenAmount(fee, decimals))
    if (value < 0.01) return '<$0.01'
    return `$${value.toFixed(2)}`
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header with Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center px-4 py-2 mb-4 rounded-full bg-gradient-card border border-border/50">
          <Sparkles className="w-4 h-4 mr-2 text-primary" />
          <span className="text-sm font-medium">Powered by Stargate Protocol</span>
        </div>
        
        <h1 className="text-5xl font-bold mb-4">
          <span className="text-gradient">Somnia Bridge</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Bridge assets between Somnia and other major chains
        </p>
      </motion.div>
      
      {/* Somnia Ecosystem Banner */}
      {/* Main Bridge Interface */}
      <Card className="glass-card overflow-hidden">
        <div className="absolute inset-0 bg-gradient-mesh opacity-10"></div>
        
        <CardHeader className="relative">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-primary to-primary/50 rounded-xl">
                <Layers className="w-5 h-5 text-white" />
              </div>
              Bridge Assets
            </CardTitle>
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => fetchQuotes()}
                className="p-2.5 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl transition-colors"
                disabled={refreshing}
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowSettings(!showSettings)}
                className="p-2.5 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl transition-colors"
              >
                <Settings className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="relative space-y-6 pb-8">
          {/* Settings Panel */}
          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 bg-gradient-to-br from-slate-800/30 to-slate-900/30 rounded-xl border border-border/50"
              >
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">
                    Slippage Tolerance
                  </label>
                  <div className="flex gap-2">
                    {['0.1', '0.5', '1.0', '2.0'].map(value => (
                      <motion.button
                        key={value}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSlippage(value)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          slippage === value
                            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                            : 'bg-slate-700/50 hover:bg-slate-600/50'
                        }`}
                      >
                        {value}%
                      </motion.button>
                    ))}
                    <Input
                      type="number"
                      value={slippage}
                      onChange={(e) => setSlippage(e.target.value)}
                      className="w-24 text-sm"
                      placeholder="Custom"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* From Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-muted-foreground">From</span>
            </div>
            
            <div className="p-5 bg-gradient-to-br from-slate-800/40 to-slate-900/40 rounded-2xl border border-border/50 hover:border-border transition-colors">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setShowChainSelect('from')}
                  className="flex items-center gap-3 px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl transition-all group"
                >
                  <img 
                    src={CHAIN_CONFIG[fromChain as keyof typeof CHAIN_CONFIG]?.logo}
                    alt={fromChain}
                    className="w-6 h-6 rounded-full"
                  />
                  <span className="font-medium">{CHAIN_CONFIG[fromChain as keyof typeof CHAIN_CONFIG]?.name}</span>
                  <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:rotate-180 transition-transform" />
                </button>
                
                <div className="text-sm text-muted-foreground">
                  Balance: <span className="font-medium text-foreground">
                    {fromBalance ? parseFloat(fromBalance.formatted).toFixed(4) : '0.0000'}
                  </span> {fromToken.symbol}
                  {fromBalance && tokenPrices[fromToken.symbol] && (
                    <span className="ml-1 text-xs">
                      (${(parseFloat(fromBalance.formatted) * tokenPrices[fromToken.symbol]).toFixed(2)})
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={fromAmount}
                  onChange={(e) => setFromAmount(e.target.value)}
                  className="flex-1 bg-transparent border-0 text-3xl font-bold focus:ring-0 placeholder:text-muted-foreground/50"
                />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowFromTokenSelect(true)}
                  type="button"
                  className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-slate-800/50 to-slate-700/50 hover:from-slate-700/50 hover:to-slate-600/50 rounded-xl transition-all group"
                >
                  <TokenDisplay value={fromToken} />
                  <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                </motion.button>
              </div>
              
              {fromAmount && tokenPrices[fromToken.symbol] && (
                <div className="mt-3 text-sm text-muted-foreground">
                  ≈ {formatCurrency(parseFloat(fromAmount) * (tokenPrices[fromToken.symbol] || 0))}
                </div>
              )}
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center -my-2">
            <motion.button
              whileHover={{ scale: 1.1, rotate: 180 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleSwapChains}
              className="p-4 bg-gradient-to-br from-primary to-primary/70 rounded-2xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all"
            >
              <ArrowUpDown className="w-5 h-5 text-white" />
            </motion.button>
          </div>

          {/* To Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-muted-foreground">To</span>
            </div>
            
            <div className="p-5 bg-gradient-to-br from-slate-800/40 to-slate-900/40 rounded-2xl border border-border/50 hover:border-border transition-colors">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setShowChainSelect('to')}
                  className="flex items-center gap-3 px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl transition-all group"
                >
                  <img 
                    src={CHAIN_CONFIG[toChain as keyof typeof CHAIN_CONFIG]?.logo}
                    alt={toChain}
                    className="w-6 h-6 rounded-full"
                  />
                  <span className="font-medium">{CHAIN_CONFIG[toChain as keyof typeof CHAIN_CONFIG]?.name}</span>
                  <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:rotate-180 transition-transform" />
                </button>
                
                <div className="text-sm text-muted-foreground">
                  Balance: <span className="font-medium text-foreground">
                    {toBalance ? parseFloat(toBalance.formatted).toFixed(4) : '0.0000'}
                  </span> {toToken.symbol}
                  {toBalance && tokenPrices[toToken.symbol] && (
                    <span className="ml-1 text-xs">
                      (${(parseFloat(toBalance.formatted) * tokenPrices[toToken.symbol]).toFixed(2)})
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={toAmount}
                  readOnly
                  className="flex-1 bg-transparent border-0 text-3xl font-bold focus:ring-0 placeholder:text-muted-foreground/50"
                />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowToTokenSelect(true)}
                  type="button"
                  className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-slate-800/50 to-slate-700/50 hover:from-slate-700/50 hover:to-slate-600/50 rounded-xl transition-all group"
                >
                  <TokenDisplay value={toToken} />
                  <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                </motion.button>
              </div>
              
              {toAmount && tokenPrices[toToken.symbol] && (
                <div className="mt-3 text-sm text-muted-foreground">
                  ≈ {formatCurrency(parseFloat(toAmount) * (tokenPrices[toToken.symbol] || 0))}
                </div>
              )}
            </div>
          </div>

          {/* Routes Section */}
          {quotes.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <button
                onClick={() => setShowRoutes(!showRoutes)}
                className="w-full flex items-center justify-between p-4 bg-gradient-to-br from-slate-800/30 to-slate-900/30 rounded-xl hover:from-slate-800/40 hover:to-slate-900/40 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/20 rounded-lg">
                    <RouteIcon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">{quotes.length} Routes Available</div>
                    <div className="text-xs text-muted-foreground">
                      Best route saves {formatFee(selectedQuote?.fees[0]?.amount || '0')}
                    </div>
                  </div>
                </div>
                <ChevronDown className={`w-5 h-5 transition-transform ${showRoutes ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {showRoutes && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2"
                  >
                    {quotes.slice(0, 3).map((quote, index) => (
                      <motion.div
                        key={index}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => {
                          setSelectedQuote(quote)
                          setToAmount(stargateApi.parseTokenAmount(quote.dstAmount, toToken.decimals))
                        }}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          selectedQuote === quote
                            ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10'
                            : 'border-border/50 hover:border-border bg-slate-800/20'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${
                              quote.route === 'stargate/v2/taxi' 
                                ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20'
                                : 'bg-gradient-to-br from-green-500/20 to-emerald-500/20'
                            }`}>
                              {quote.route === 'stargate/v2/taxi' ? (
                                <Zap className="w-4 h-4 text-warning" />
                              ) : (
                                <Shield className="w-4 h-4 text-success" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium">
                                {quote.route === 'stargate/v2/taxi' ? 'Fast Route' : 'Standard Route'}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                via {quote.route.split('/').pop()?.toUpperCase()}
                              </div>
                            </div>
                          </div>
                          {index === 0 && (
                            <span className="px-3 py-1 bg-gradient-to-r from-primary to-primary/70 text-primary-foreground text-xs font-medium rounded-full">
                              Recommended
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-3 gap-3">
                          <div className="text-center p-2 bg-slate-800/30 rounded-lg">
                            <Activity className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                            <div className="text-sm font-medium">
                              {parseFloat(stargateApi.parseTokenAmount(quote.dstAmount, toToken.decimals)).toFixed(2)}
                            </div>
                            <div className="text-xs text-muted-foreground">Output</div>
                          </div>
                          <div className="text-center p-2 bg-slate-800/30 rounded-lg">
                            <Clock className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                            <div className="text-sm font-medium">
                              ~{formatDuration(quote.duration.estimated)}
                            </div>
                            <div className="text-xs text-muted-foreground">Time</div>
                          </div>
                          <div className="text-center p-2 bg-slate-800/30 rounded-lg">
                            <Fuel className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                            <div className="text-sm font-medium">
                              {formatFee(quote.fees[0]?.amount || '0')}
                            </div>
                            <div className="text-xs text-muted-foreground">Fee</div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

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

          {/* Bridge Summary */}
          {selectedQuote && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-gradient-to-br from-slate-800/20 to-slate-900/20 rounded-xl border border-border/30"
            >
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Transaction Summary</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Estimated Time</span>
                  <span className="font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDuration(selectedQuote.duration.estimated)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Network Fee</span>
                  <span className="font-medium flex items-center gap-1">
                    <Fuel className="w-3 h-3" />
                    {formatFee(selectedQuote.fees[0]?.amount || '0')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Min. Received</span>
                  <span className="font-medium text-success">
                    {parseFloat(stargateApi.parseTokenAmount(selectedQuote.dstAmountMin, toToken.decimals)).toFixed(4)} {toToken.symbol}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Route Steps</span>
                  <span className="font-medium">{selectedQuote.steps.length} transactions</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Action Button */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button 
              className="w-full h-14 text-lg font-medium bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all" 
              disabled={!isConnected || !fromAmount || !toAmount || loading || txStatus !== 'idle'}
              onClick={handleBridge}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Fetching Best Routes...
                </>
              ) : txStatus === 'approving' ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Approving Token...
                </>
              ) : txStatus === 'bridging' ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Bridging Assets...
                </>
              ) : txStatus === 'success' ? (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Bridge Successful!
                </>
              ) : !isConnected ? (
                <>
                  Connect Wallet to Bridge
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Bridge {fromAmount || '0'} {fromToken.symbol}
                </>
              )}
            </Button>
          </motion.div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-error/10 border border-error/20 rounded-xl"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-error mt-0.5" />
                <div>
                  <p className="font-medium text-error">Transaction Failed</p>
                  <p className="text-sm text-muted-foreground mt-1">{error}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Success Message */}
          {txStatus === 'success' && txHash && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 bg-gradient-to-br from-success/10 to-success/5 border border-success/20 rounded-xl"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-success/20 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-success" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-success">Bridge Initiated Successfully!</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your {fromAmount} {fromToken.symbol} is being bridged to {CHAIN_CONFIG[toChain as keyof typeof CHAIN_CONFIG]?.name}.
                    Estimated arrival in {formatDuration(selectedQuote?.duration.estimated || 180)}.
                  </p>
                  <div className="flex items-center gap-3 mt-3">
                    <a
                      href={getExplorerUrl(txHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      View on Explorer
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <a
                      href={`https://layerzeroscan.com/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      Track on LayerZero
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <button
                      onClick={() => {
                        setTxStatus('idle')
                        setTxHash('')
                        setFromAmount('')
                        setToAmount('')
                        setQuotes([])
                        setSelectedQuote(null)
                      }}
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      New Transfer
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Loading State */}
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

      {/* Token Selection Modals */}
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

      {/* Chain Selection Modal */}
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

    </div>
  )
}

// Helper function to get explorer URL
function getExplorerUrl(txHash: string, chain: string = 'ethereum'): string {
  const explorers = {
    'ethereum': `https://etherscan.io/tx/${txHash}`,
    'polygon': `https://polygonscan.com/tx/${txHash}`,
    'arbitrum': `https://arbiscan.io/tx/${txHash}`,
    'optimism': `https://optimistic.etherscan.io/tx/${txHash}`,
    'base': `https://basescan.org/tx/${txHash}`,
    'bsc': `https://bscscan.com/tx/${txHash}`,
    'avalanche': `https://snowtrace.io/tx/${txHash}`,
    'somnia': `https://somniascan.com/tx/${txHash}`,
  }
  
  return explorers[chain as keyof typeof explorers] || `https://layerzeroscan.com/tx/${txHash}`
}