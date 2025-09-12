'use client'

import { motion } from 'framer-motion'
import { 
  Wallet, CheckCircle, XCircle, ExternalLink, Clock, 
  ArrowRightLeft, Send, Globe2, Droplets, TrendingUp,
  AlertCircle, Loader2, CreditCard, Hash, Copy, Check
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

interface TokenBalance {
  symbol: string
  address: string
  balance: string
  decimals: number
  valueUSD: number
}

interface BalanceCardProps {
  walletAddress: string
  balances: Record<string, TokenBalance>
  totalValueUSD: number
  chainName: string
  networkMode?: string
}

export function BalanceCard({ walletAddress, balances, totalValueUSD, chainName, networkMode }: BalanceCardProps) {
  const [copied, setCopied] = useState(false)

  const copyAddress = () => {
    navigator.clipboard.writeText(walletAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border border-slate-700 p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Wallet className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Wallet Balance</h3>
            <p className="text-xs text-muted-foreground">{networkMode || chainName}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">${totalValueUSD.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">Total Value</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4 p-2 bg-slate-800/50 rounded-lg">
        <Hash className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs font-mono flex-1 truncate">{walletAddress}</span>
        <button
          onClick={copyAddress}
          className="p-1 hover:bg-slate-700 rounded transition-colors"
        >
          {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
        </button>
      </div>

      <div className="space-y-3">
        {Object.values(balances).map((token) => (
          <div key={token.symbol} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold">{token.symbol[0]}</span>
              </div>
              <div>
                <p className="font-medium">{token.symbol}</p>
                <p className="text-xs text-muted-foreground">{token.balance}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-medium">${token.valueUSD.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">
                ${(token.valueUSD / parseFloat(token.balance || '1')).toFixed(4)}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <Button variant="outline" size="sm" className="flex-1">
          <Send className="w-3 h-3 mr-1" />
          Send
        </Button>
        <Button variant="outline" size="sm" className="flex-1">
          <ArrowRightLeft className="w-3 h-3 mr-1" />
          Swap
        </Button>
      </div>
    </motion.div>
  )
}

interface TransactionPreviewProps {
  type: 'transfer' | 'swap' | 'bridge' | 'liquidity'
  details: any
  onSign: () => void
  onCancel: () => void
  isLoading?: boolean
}

export function TransactionPreview({ type, details, onSign, onCancel, isLoading }: TransactionPreviewProps) {
  const getIcon = () => {
    switch (type) {
      case 'transfer': return <Send className="w-5 h-5" />
      case 'swap': return <ArrowRightLeft className="w-5 h-5" />
      case 'bridge': return <Globe2 className="w-5 h-5" />
      case 'liquidity': return <Droplets className="w-5 h-5" />
    }
  }

  const getTitle = () => {
    switch (type) {
      case 'transfer': return 'Transfer Transaction'
      case 'swap': return 'Swap Transaction'
      case 'bridge': return 'Bridge Transaction'
      case 'liquidity': return 'Liquidity Transaction'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border border-primary/20 p-6"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-primary/10 rounded-lg">
          {getIcon()}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold">{getTitle()}</h3>
          <p className="text-xs text-muted-foreground">
            {details.networkMode || 'Review and sign'}
          </p>
        </div>
        <AlertCircle className="w-5 h-5 text-yellow-500" />
      </div>

      <div className="space-y-3 mb-4">
        {type === 'transfer' && (
          <>
            <div className="flex justify-between p-3 bg-slate-800/30 rounded-lg">
              <span className="text-sm text-muted-foreground">From</span>
              <span className="text-sm font-mono">{details.from?.slice(0, 6)}...{details.from?.slice(-4)}</span>
            </div>
            <div className="flex justify-between p-3 bg-slate-800/30 rounded-lg">
              <span className="text-sm text-muted-foreground">To</span>
              <span className="text-sm font-mono">{details.to?.slice(0, 6)}...{details.to?.slice(-4)}</span>
            </div>
            <div className="flex justify-between p-3 bg-slate-800/30 rounded-lg">
              <span className="text-sm text-muted-foreground">Amount</span>
              <span className="text-sm font-medium">{details.amount} {details.tokenSymbol}</span>
            </div>
          </>
        )}

        {type === 'swap' && (
          <>
            <div className="flex justify-between p-3 bg-slate-800/30 rounded-lg">
              <span className="text-sm text-muted-foreground">You Pay</span>
              <span className="text-sm font-medium">{details.amount} {details.tokenInSymbol}</span>
            </div>
            <div className="flex justify-center py-2">
              <ArrowRightLeft className="w-4 h-4 text-primary" />
            </div>
            <div className="flex justify-between p-3 bg-slate-800/30 rounded-lg">
              <span className="text-sm text-muted-foreground">You Receive</span>
              <span className="text-sm font-medium">~{details.estimatedOutput || '?'} {details.tokenOutSymbol}</span>
            </div>
            <div className="flex justify-between p-3 bg-slate-800/30 rounded-lg">
              <span className="text-sm text-muted-foreground">Slippage</span>
              <span className="text-sm">{details.slippage}%</span>
            </div>
          </>
        )}

        {type === 'bridge' && (
          <>
            <div className="flex justify-between p-3 bg-slate-800/30 rounded-lg">
              <span className="text-sm text-muted-foreground">From Chain</span>
              <span className="text-sm font-medium">{details.fromChain}</span>
            </div>
            <div className="flex justify-between p-3 bg-slate-800/30 rounded-lg">
              <span className="text-sm text-muted-foreground">To Chain</span>
              <span className="text-sm font-medium">{details.toChain}</span>
            </div>
            <div className="flex justify-between p-3 bg-slate-800/30 rounded-lg">
              <span className="text-sm text-muted-foreground">Amount</span>
              <span className="text-sm font-medium">{details.amount} {details.tokenSymbol}</span>
            </div>
            <div className="flex justify-between p-3 bg-slate-800/30 rounded-lg">
              <span className="text-sm text-muted-foreground">Est. Time</span>
              <span className="text-sm">~2-5 minutes</span>
            </div>
          </>
        )}

        <div className="flex justify-between p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <span className="text-sm text-yellow-500">Estimated Gas</span>
          <span className="text-sm font-medium text-yellow-500">~0.01 {details.chainId === 50312 ? 'STT' : 'SOMI'}</span>
        </div>
      </div>

      <div className="flex gap-3">
        <Button 
          variant="outline" 
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button 
          onClick={onSign}
          disabled={isLoading}
          className="flex-1 bg-primary hover:bg-primary/90"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Signing...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Sign Transaction
            </>
          )}
        </Button>
      </div>
    </motion.div>
  )
}

interface TransactionResultProps {
  success: boolean
  hash?: string
  error?: string
  explorerUrl?: string
}

export function TransactionResult({ success, hash, error, explorerUrl }: TransactionResultProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border p-6 ${
        success 
          ? 'bg-gradient-to-br from-green-900/20 to-green-800/20 border-green-500/20' 
          : 'bg-gradient-to-br from-red-900/20 to-red-800/20 border-red-500/20'
      }`}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-lg ${success ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
          {success ? (
            <CheckCircle className="w-5 h-5 text-green-500" />
          ) : (
            <XCircle className="w-5 h-5 text-red-500" />
          )}
        </div>
        <div>
          <h3 className="font-semibold">
            {success ? 'Transaction Successful' : 'Transaction Failed'}
          </h3>
          <p className="text-xs text-muted-foreground">
            {success ? 'Your transaction has been confirmed' : 'Something went wrong'}
          </p>
        </div>
      </div>

      {hash && (
        <div className="p-3 bg-slate-800/30 rounded-lg mb-4">
          <p className="text-xs text-muted-foreground mb-1">Transaction Hash</p>
          <p className="text-sm font-mono truncate">{hash}</p>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg mb-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {explorerUrl && (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => window.open(explorerUrl, '_blank')}
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          View on Explorer
        </Button>
      )}
    </motion.div>
  )
}

interface PoolInfoCardProps {
  pool: any
}

export function PoolInfoCard({ pool }: PoolInfoCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border border-slate-700 p-6"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Droplets className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">{pool.token0Symbol}/{pool.token1Symbol} Pool</h3>
          <p className="text-xs text-muted-foreground">QuickSwap V4</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 bg-slate-800/30 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">TVL</p>
          <p className="text-lg font-bold">${pool.tvl?.toLocaleString() || '0'}</p>
        </div>
        <div className="p-3 bg-slate-800/30 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">24h Volume</p>
          <p className="text-lg font-bold">${pool.volume24h?.toLocaleString() || '0'}</p>
        </div>
        <div className="p-3 bg-slate-800/30 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">APR</p>
          <p className="text-lg font-bold text-green-500">{pool.apr || '0'}%</p>
        </div>
        <div className="p-3 bg-slate-800/30 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Fee Tier</p>
          <p className="text-lg font-bold">{pool.feeTier || '0.3'}%</p>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Button variant="outline" size="sm" className="flex-1">
          <Droplets className="w-3 h-3 mr-1" />
          Add Liquidity
        </Button>
        <Button variant="outline" size="sm" className="flex-1">
          <ArrowRightLeft className="w-3 h-3 mr-1" />
          Swap
        </Button>
      </div>
    </motion.div>
  )
}