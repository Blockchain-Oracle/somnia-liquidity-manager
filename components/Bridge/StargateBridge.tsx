'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  Route,
  TrendingUp,
  Sparkles,
  ArrowUpDown
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TokenSelect, TokenDisplay } from '@/components/ui/TokenSelect'
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

// Chain configurations with logos
const CHAIN_CONFIG = {
  ethereum: {
    name: 'Ethereum',
    logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
    color: '#627EEA',
    nativeToken: 'ETH',
    icon: '⟠'
  },
  polygon: {
    name: 'Polygon',
    logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png',
    color: '#8247E5',
    nativeToken: 'MATIC',
    icon: '🟣'
  },
  arbitrum: {
    name: 'Arbitrum',
    logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png',
    color: '#2D374B',
    nativeToken: 'ETH',
    icon: '🔵'
  },
  optimism: {
    name: 'Optimism',
    logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/optimism/info/logo.png',
    color: '#FF0420',
    nativeToken: 'ETH',
    icon: '🔴'
  },
  base: {
    name: 'Base',
    logo: 'https://avatars.githubusercontent.com/u/108554348?s=200&v=4',
    color: '#0052FF',
    nativeToken: 'ETH',
    icon: '🔷'
  },
  bsc: {
    name: 'BNB Chain',
    logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/info/logo.png',
    color: '#F3BA2F',
    nativeToken: 'BNB',
    icon: '🟡'
  },
  avalanche: {
    name: 'Avalanche',
    logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/avalanche/info/logo.png',
    color: '#E84142',
    nativeToken: 'AVAX',
    icon: '🔺'
  },
  somnia: {
    name: 'Somnia',
    logo: '/somnia-logo.png',
    color: '#FF6B6B',
    nativeToken: 'SOMI',
    icon: '✨'
  },
  soneium: {
    name: 'Soneium',
    logo: '/soneium-logo.png',
    color: '#00D4FF',
    nativeToken: 'ETH',
    icon: '💠'
  }
}

interface ChainSelectorProps {
  value: string;
  onChange: (chain: string) => void;
  label: string;
}

const ChainSelector: React.FC<ChainSelectorProps> = ({ value, onChange, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedChain = CHAIN_CONFIG[value as keyof typeof CHAIN_CONFIG];

  return (
    <div className="relative">
      <label className="text-sm text-muted-foreground mb-2 block">{label}</label>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-3 bg-slate-800/30 border border-border/50 rounded-xl flex items-center justify-between hover:bg-slate-700/30 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <img 
              src={selectedChain?.logo}
              alt={selectedChain?.name}
              className="w-8 h-8 rounded-full"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <span className="hidden text-xl">{selectedChain?.icon}</span>
          </div>
          <div className="text-left">
            <div className="font-medium">{selectedChain?.name}</div>
            <div className="text-xs text-muted-foreground">{selectedChain?.nativeToken}</div>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform group-hover:rotate-180 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-2 bg-slate-800 border border-border rounded-xl overflow-hidden"
          >
            {Object.entries(CHAIN_CONFIG).map(([key, config]) => (
              <button
                key={key}
                onClick={() => {
                  onChange(key);
                  setIsOpen(false);
                }}
                className="w-full p-3 flex items-center gap-3 hover:bg-slate-700 transition-colors"
              >
                <img 
                  src={config.logo}
                  alt={config.name}
                  className="w-6 h-6 rounded-full"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <span className="hidden text-xl">{config.icon}</span>
                <div className="text-left">
                  <div>{config.name}</div>
                  <div className="text-xs text-muted-foreground">{config.nativeToken}</div>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface RouteOption {
  quote: BridgeQuote
  selected: boolean
}

export default function StargateBridge() {
  // State management
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [chains, setChains] = useState<Chain[]>([])
  const [tokens, setTokens] = useState<Token[]>([])
  const [quotes, setQuotes] = useState<BridgeQuote[]>([])
  const [selectedQuote, setSelectedQuote] = useState<BridgeQuote | null>(null)
  
  // Form state
  const [fromChain, setFromChain] = useState<string>('ethereum')
  const [toChain, setToChain] = useState<string>('polygon')
  const [fromToken, setFromToken] = useState<TokenInfo>(getTokenInfo('USDC'))
  const [toToken, setToToken] = useState<TokenInfo>(getTokenInfo('USDC'))
  const [fromAmount, setFromAmount] = useState('')
  const [toAmount, setToAmount] = useState('')
  const [slippage, setSlippage] = useState('0.5')
  const [showSettings, setShowSettings] = useState(false)
  const [showRoutes, setShowRoutes] = useState(false)
  
  // Transaction state
  const [txStatus, setTxStatus] = useState<'idle' | 'approving' | 'bridging' | 'success' | 'error'>('idle')
  const [txHash, setTxHash] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  // Load chains and tokens on mount
  useEffect(() => {
    loadChains()
    loadTokens()
  }, [])

  // Load tokens when chain changes
  useEffect(() => {
    if (fromChain) {
      loadTokensForChain(fromChain)
    }
  }, [fromChain])

  const loadChains = async () => {
    try {
      const chainsData = await stargateApi.getChains()
      setChains(chainsData)
    } catch (error) {
      console.error('Failed to load chains:', error)
    }
  }

  const loadTokens = async () => {
    try {
      const tokensData = await stargateApi.getTokens()
      setTokens(tokensData)
    } catch (error) {
      console.error('Failed to load tokens:', error)
    }
  }

  const loadTokensForChain = async (chainKey: string) => {
    try {
      const tokensData = await stargateApi.getTokens(chainKey as any)
      // Update available tokens
    } catch (error) {
      console.error('Failed to load tokens for chain:', error)
    }
  }

  const handleSwapChains = () => {
    setFromChain(toChain)
    setToChain(fromChain)
    setFromToken(toToken)
    setToToken(fromToken)
    setFromAmount(toAmount)
    setToAmount(fromAmount)
  }

  const fetchQuotes = async () => {
    if (!fromAmount || parseFloat(fromAmount) <= 0) return

    setLoading(true)
    setError(null)
    try {
      // Get token addresses for the selected chains
      const srcChainTokens = TOKEN_ADDRESSES[fromChain as keyof typeof TOKEN_ADDRESSES];
      const dstChainTokens = TOKEN_ADDRESSES[toChain as keyof typeof TOKEN_ADDRESSES];
      
      const srcTokenAddress = (srcChainTokens && fromToken.symbol in srcChainTokens) 
        ? (srcChainTokens as any)[fromToken.symbol] 
        : NATIVE_TOKEN_ADDRESS
      const dstTokenAddress = (dstChainTokens && toToken.symbol in dstChainTokens) 
        ? (dstChainTokens as any)[toToken.symbol] 
        : NATIVE_TOKEN_ADDRESS

      const quotesData = await stargateApi.getQuotes({
        srcToken: srcTokenAddress,
        dstToken: dstTokenAddress,
        srcAddress: '0x0000000000000000000000000000000000000000', // User address
        dstAddress: '0x0000000000000000000000000000000000000000', // User address
        srcChainKey: fromChain as any,
        dstChainKey: toChain as any,
        srcAmount: stargateApi.formatTokenAmount(fromAmount, fromToken.decimals),
        dstAmountMin: stargateApi.formatTokenAmount(
          (parseFloat(fromAmount) * (1 - parseFloat(slippage) / 100)).toString(),
          toToken.decimals
        )
      })

      setQuotes(quotesData)
      if (quotesData.length > 0) {
        setSelectedQuote(quotesData[0])
        setToAmount(stargateApi.parseTokenAmount(quotesData[0].dstAmount, toToken.decimals))
      }
    } catch (error) {
      console.error('Failed to fetch quotes:', error)
      setError('Failed to fetch bridge quotes')
    } finally {
      setLoading(false)
    }
  }

  // Auto-fetch quotes when amount changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (fromAmount) {
        fetchQuotes()
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [fromAmount, fromChain, toChain, fromToken, toToken])

  const handleBridge = async () => {
    if (!selectedQuote) return

    setTxStatus('approving')
    setError(null)
    // Here you would integrate with wallet to sign and send transactions
    // This is a placeholder for the actual implementation
    
    setTimeout(() => {
      setTxStatus('bridging')
      setTimeout(() => {
        setTxStatus('success')
        setTxHash('0x1234...5678')
      }, 3000)
    }, 2000)
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
    <div className="space-y-6">
      {/* Main Bridge Card */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Globe className="w-6 h-6 text-primary" />
                Cross-Chain Bridge
              </CardTitle>
              <CardDescription>Transfer tokens between chains using Stargate</CardDescription>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Shield className="w-4 h-4 text-success" />
              <span className="text-success">Secure & Non-Custodial</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Chain Selection */}
          <div className="grid md:grid-cols-2 gap-4">
            <ChainSelector
              value={fromChain}
              onChange={setFromChain}
              label="From Chain"
            />
            
            <div className="relative">
              <button
                onClick={handleSwapChains}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 p-2 bg-primary rounded-full hover:bg-primary/80 transition-colors md:-left-6"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
              
              <ChainSelector
                value={toChain}
                onChange={setToChain}
                label="To Chain"
              />
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Amount</label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={fromAmount}
                  onChange={(e) => setFromAmount(e.target.value)}
                  className="pr-24"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <TokenSelect
                    value={fromToken}
                    onChange={setFromToken}
                  />
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setAmount('100')} // Would use actual balance
              >
                MAX
              </Button>
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Balance: 1,000.00 {token.symbol}</span>
              <span>≈ ${formatCurrency(parseFloat(amount || '0'))}</span>
            </div>
          </div>

          {/* Quotes */}
          {quotes.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Available Routes</span>
                <button 
                  onClick={fetchQuotes}
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  Refresh
                </button>
              </div>

              {quotes.map((quote, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedQuote(quote)}
                  className={`w-full p-4 rounded-xl border transition-all ${
                    selectedQuote === quote 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border/50 bg-slate-800/30 hover:bg-slate-700/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-warning" />
                      <span className="font-medium">
                        {quote.route === 'stargate/v2/taxi' ? 'Fast Route' : 'Standard Route'}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      ~{Math.round(quote.duration.estimated / 60)} min
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">You receive:</span>
                      <p className="font-medium">
                        {formatNumber(parseFloat(quote.dstAmount) / (10 ** token.decimals))} {token.symbol}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Bridge fee:</span>
                      <p className="font-medium">
                        {quote.fees.map(f => `$${formatNumber(parseFloat(f.amount) / 1e18)}`).join(' + ')}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </motion.div>
          )}

          {/* Estimated Output */}
          {selectedQuote && (
            <div className="p-4 bg-slate-800/30 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Estimated Receive</span>
                <span className="font-medium">
                  {formatNumber(estimatedReceive)} {token.symbol}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Bridge Time</span>
                <span className="font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  ~{Math.round(selectedQuote.duration.estimated / 60)} minutes
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Network Fee</span>
                <span className="font-medium">
                  ${selectedQuote.fees.reduce((sum, f) => sum + parseFloat(f.amount) / 1e18, 0).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {!quotes.length ? (
              <Button 
                className="flex-1" 
                onClick={fetchQuotes}
                disabled={loading || !amount}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Fetching Quotes...
                  </>
                ) : (
                  'Get Bridge Quote'
                )}
              </Button>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setQuotes([]);
                    setSelectedQuote(null);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1"
                  onClick={executeBridge}
                  disabled={!selectedQuote || txStatus !== 'idle'}
                >
                  {txStatus === 'approving' && (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Approving...
                    </>
                  )}
                  {txStatus === 'bridging' && (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Bridging...
                    </>
                  )}
                  {txStatus === 'success' && (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Bridge Successful!
                    </>
                  )}
                  {txStatus === 'idle' && 'Bridge Tokens'}
                  {txStatus === 'error' && 'Try Again'}
                </Button>
              </>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-error/10 border border-error/20 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-error mt-0.5" />
              <span className="text-sm text-error">{error}</span>
            </div>
          )}

          {/* Success Message */}
          {txStatus === 'success' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-success/10 border border-success/20 rounded-xl"
            >
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-success mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-success">Bridge Initiated Successfully!</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your tokens will arrive in approximately {Math.round(selectedQuote?.duration.estimated! / 60)} minutes.
                  </p>
                  <button className="text-sm text-primary hover:underline mt-2 flex items-center gap-1">
                    View on Explorer
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Info Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Zap className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h4 className="font-medium mb-1">Fast & Reliable</h4>
                <p className="text-sm text-muted-foreground">
                  Bridge tokens in minutes with Stargate's optimized routes
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-success/20 rounded-lg">
                <Shield className="w-4 h-4 text-success" />
              </div>
              <div>
                <h4 className="font-medium mb-1">Secure Protocol</h4>
                <p className="text-sm text-muted-foreground">
                  Audited contracts with billions in volume processed
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-warning/20 rounded-lg">
                <DollarSign className="w-4 h-4 text-warning" />
              </div>
              <div>
                <h4 className="font-medium mb-1">Low Fees</h4>
                <p className="text-sm text-muted-foreground">
                  Competitive rates with transparent fee structure
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}