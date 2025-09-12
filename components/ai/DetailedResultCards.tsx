'use client'

import { motion } from 'framer-motion'
import { 
  Wallet, CheckCircle, XCircle, ExternalLink, Clock, 
  ArrowRightLeft, Send, Globe2, Droplets, TrendingUp,
  AlertCircle, Loader2, CreditCard, Hash, Copy, Check,
  ChevronRight, Info, Shield, Zap, DollarSign, Activity
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { useConnectModal } from '@rainbow-me/rainbowkit'

// Balance Result Card
export function BalanceResultCard({ 
  walletAddress, 
  balances, 
  totalValueUSD, 
  chainName, 
  networkMode 
}: any) {
  const [copied, setCopied] = useState(false)
  const isTestnet = (networkMode || chainName || '').toLowerCase().includes('testnet')

  const copyAddress = () => {
    navigator.clipboard.writeText(walletAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const compose = (action: 'send' | 'swap' | 'bridge', token: any) => {
    window.dispatchEvent(new CustomEvent('somnia:compose', {
      detail: { action, token: { symbol: token.symbol, address: token.address } }
    }))
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl border border-slate-700 overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 p-4 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <Wallet className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Wallet Balance</h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Shield className="w-3 h-3" />
                {networkMode || chainName}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
              ${totalValueUSD?.toFixed(2) || '0.00'}
            </p>
            <p className="text-xs text-muted-foreground">Total Value</p>
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="px-4 py-3 bg-slate-800/30">
        <div className="flex items-center gap-2">
          <Hash className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-mono flex-1 truncate">{walletAddress}</span>
          <button
            onClick={copyAddress}
            className="p-1.5 hover:bg-slate-700 rounded transition-colors"
          >
            {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
          </button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(`https://shannon-explorer.somnia.network/address/${walletAddress}`, '_blank')}
          >
            <ExternalLink className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Token List */}
      <div className="p-4 space-y-2">
        {balances && Object.values(balances).map((token: any) => (
          <motion.div 
            key={token.symbol}
            whileHover={{ scale: 1.01 }}
            className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg hover:bg-slate-800/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold">{token.symbol?.[0]}</span>
              </div>
              <div>
                <p className="font-medium">{token.symbol}</p>
                <p className="text-xs text-muted-foreground">{token.balance}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="font-medium">${token.valueUSD?.toFixed(2) || '0'}</p>
                <p className="text-xs text-muted-foreground">
                  {(token.valueUSD && token.balance ? (token.valueUSD / parseFloat(token.balance || '1')) : 0).toFixed(4)}/token
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="xs" onClick={() => compose('send', token)}>
                  <Send className="w-3 h-3 mr-1" />
                  Send
                </Button>
                <Button variant="outline" size="xs" onClick={() => compose('swap', token)}>
                  <ArrowRightLeft className="w-3 h-3 mr-1" />
                  Swap
                </Button>
                <Button 
                  variant="outline" 
                  size="xs" 
                  disabled={!isTestnet}
                  title={isTestnet ? 'Bridge on Testnet' : 'Bridge available on Testnet only'}
                  onClick={() => compose('bridge', token)}
                >
                  <Globe2 className="w-3 h-3 mr-1" />
                  Bridge
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="p-4 pt-0 flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={() => compose('send', { symbol: 'USDC', address: balances?.USDC?.address })}>
          <Send className="w-3 h-3 mr-1" />
          Send
        </Button>
        <Button variant="outline" size="sm" className="flex-1" onClick={() => compose('swap', { symbol: 'USDC', address: balances?.USDC?.address })}>
          <ArrowRightLeft className="w-3 h-3 mr-1" />
          Swap
        </Button>
        <Button variant="outline" size="sm" className="flex-1" disabled={!isTestnet} title={isTestnet ? 'Bridge on Testnet' : 'Bridge available on Testnet only'} onClick={() => compose('bridge', { symbol: 'USDC', address: balances?.USDC?.address })}>
          <Globe2 className="w-3 h-3 mr-1" />
          Bridge
        </Button>
      </div>
    </motion.div>
  )
}

// Transaction Preview Card
export function TransactionPreviewCard({ type, data, onSign, onCancel, isLoading, loadingLabel, buttonLabel }: any) {
  const isTestnet = String(data?.networkMode || '').toLowerCase().includes('testnet') || data?.chainId === 50312
  const getIcon = () => {
    switch (type) {
      case 'transfer': return <Send className="w-5 h-5" />
      case 'swap': return <ArrowRightLeft className="w-5 h-5" />
      case 'bridge': return <Globe2 className="w-5 h-5" />
      default: return <Activity className="w-5 h-5" />
    }
  }

  const getTitle = () => {
    switch (type) {
      case 'transfer': return 'Transfer Transaction'
      case 'swap': return 'Swap Transaction'
      case 'bridge': return 'Cross-Chain Bridge'
      default: return 'Transaction'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl border border-primary/30 overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/20 to-purple-500/20 p-4 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              {getIcon()}
            </div>
            <div>
              <h3 className="font-semibold">{getTitle()}</h3>
              <p className="text-xs text-muted-foreground">
                {data.networkMode || 'Review and confirm'}
              </p>
            </div>
          </div>
          <AlertCircle className="w-5 h-5 text-yellow-500" />
        </div>
      </div>

      {/* Transaction Details */}
      <div className="p-4 space-y-3">
        {type === 'transfer' && (
          <>
            <div className="space-y-2">
              <div className="flex justify-between p-3 bg-slate-800/30 rounded-lg">
                <span className="text-sm text-muted-foreground">From</span>
                <span className="text-sm font-mono">{data.from?.slice(0, 6)}...{data.from?.slice(-4)}</span>
              </div>
              <ChevronRight className="w-4 h-4 mx-auto text-primary" />
              <div className="flex justify-between p-3 bg-slate-800/30 rounded-lg">
                <span className="text-sm text-muted-foreground">To</span>
                <span className="text-sm font-mono">{data.to?.slice(0, 6)}...{data.to?.slice(-4)}</span>
              </div>
            </div>
            
            <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-muted-foreground">Amount</p>
                  <p className="text-lg font-bold">
                    {data.amount}
                    {" "}
                    <button
                      className="underline decoration-dotted underline-offset-4 hover:text-primary ml-1"
                      onClick={() => window.dispatchEvent(new CustomEvent('somnia:compose', { detail: { action: 'swap', token: { symbol: data.tokenSymbol, address: data.tokenAddress } } }))}
                      title={`Swap ${data.tokenSymbol}`}
                    >
                      {data.tokenSymbol}
                    </button>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Token Address</p>
                  <p className="text-xs font-mono">{data.tokenAddress?.slice(0, 8)}...</p>
                </div>
              </div>
            </div>
            {/* Token Quick Actions */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => window.dispatchEvent(new CustomEvent('somnia:compose', { detail: { action: 'send', token: { symbol: data.tokenSymbol, address: data.tokenAddress } } }))}>
                <Send className="w-3 h-3 mr-1" /> Send {data.tokenSymbol}
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.dispatchEvent(new CustomEvent('somnia:compose', { detail: { action: 'swap', token: { symbol: data.tokenSymbol, address: data.tokenAddress } } }))}>
                <ArrowRightLeft className="w-3 h-3 mr-1" /> Swap {data.tokenSymbol}
              </Button>
              <Button variant="outline" size="sm" disabled={!isTestnet} title={isTestnet ? 'Bridge on Testnet' : 'Bridge available on Testnet only'} onClick={() => window.dispatchEvent(new CustomEvent('somnia:compose', { detail: { action: 'bridge', token: { symbol: data.tokenSymbol, address: data.tokenAddress } } }))}>
                <Globe2 className="w-3 h-3 mr-1" /> Bridge {data.tokenSymbol}
              </Button>
            </div>
          </>
        )}

        {type === 'swap' && (
          <>
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">You Pay</p>
              <div className="flex justify-between items-center">
                <p className="text-lg font-bold">
                  {data.amount}{" "}
                  <button className="underline decoration-dotted underline-offset-4 hover:text-primary ml-1" onClick={() => window.dispatchEvent(new CustomEvent('somnia:compose', { detail: { action: 'send', token: { symbol: data.tokenInSymbol, address: data.tokenIn } } }))} title={`Send ${data.tokenInSymbol}`}>
                    {data.tokenInSymbol}
                  </button>
                </p>
                <p className="text-xs font-mono">{data.tokenIn?.slice(0, 8)}...</p>
              </div>
            </div>
            
            <div className="flex justify-center">
              <ArrowRightLeft className="w-5 h-5 text-primary" />
            </div>
            
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">You Receive (Estimated)</p>
              <div className="flex justify-between items-center">
                <p className="text-lg font-bold">
                  ~{data.estimatedOutput || '?'}{' '}
                  <button className="underline decoration-dotted underline-offset-4 hover:text-primary ml-1" onClick={() => window.dispatchEvent(new CustomEvent('somnia:compose', { detail: { action: 'send', token: { symbol: data.tokenOutSymbol, address: data.tokenOut } } }))} title={`Send ${data.tokenOutSymbol}`}>
                    {data.tokenOutSymbol}
                  </button>
                </p>
                <p className="text-xs font-mono">{data.tokenOut?.slice(0, 8)}...</p>
              </div>
            </div>
            
            <div className="flex justify-between p-2 bg-slate-800/30 rounded-lg text-xs">
              <span className="text-muted-foreground">Slippage Tolerance</span>
              <span>{data.slippage}%</span>
            </div>
            {/* Token Quick Actions */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => window.dispatchEvent(new CustomEvent('somnia:compose', { detail: { action: 'swap', token: { symbol: data.tokenOutSymbol, address: data.tokenOut } } }))}>
                <ArrowRightLeft className="w-3 h-3 mr-1" /> Swap {data.tokenOutSymbol}
              </Button>
              <Button variant="outline" size="sm" disabled={!isTestnet} title={isTestnet ? 'Bridge on Testnet' : 'Bridge available on Testnet only'} onClick={() => window.dispatchEvent(new CustomEvent('somnia:compose', { detail: { action: 'bridge', token: { symbol: data.tokenOutSymbol, address: data.tokenOut } } }))}>
                <Globe2 className="w-3 h-3 mr-1" /> Bridge {data.tokenOutSymbol}
              </Button>
            </div>
          </>
        )}

        {type === 'bridge' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-800/30 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">From Chain</p>
                <p className="font-medium">{data.fromChain}</p>
              </div>
              <div className="p-3 bg-slate-800/30 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">To Chain</p>
                <p className="font-medium">{data.toChain}</p>
              </div>
            </div>
            
            <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-muted-foreground">Bridge Amount</p>
                  <p className="text-lg font-bold">{data.amount} {data.tokenSymbol}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Est. Time</p>
                  <p className="text-sm">2-5 min</p>
                </div>
              </div>
            </div>
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-center gap-2">
              <Info className="w-4 h-4 text-yellow-500" />
              <span className="text-xs text-yellow-500">Bridge is available on Testnet only.</span>
            </div>
          </>
        )}

        {/* Gas Estimate */}
        <div className="flex items-center justify-between p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            <span className="text-sm text-yellow-500">Estimated Gas</span>
          </div>
          <span className="text-sm font-medium text-yellow-500">
            ~0.01 {data.chainId === 50312 ? 'STT' : 'SOMI'}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 pt-0 flex gap-3">
        <Button 
          variant="outline" 
          className="flex-1"
          type="button"
          disabled={isLoading}
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button 
          onClick={onSign}
          type="button"
          disabled={isLoading}
          className="flex-1 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {loadingLabel || 'Signing...'}
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              {buttonLabel || 'Sign & Send'}
            </>
          )}
        </Button>
      </div>
    </motion.div>
  )
}

// Transfer Success Card
export function TransferResultCard({ success, hash, from, to, amount, tokenSymbol, tokenAddress, explorerUrl, receipt }: any) {
  const [copied, setCopied] = useState(false)

  const copyHash = () => {
    navigator.clipboard.writeText(hash)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border overflow-hidden ${
        success 
          ? 'bg-gradient-to-br from-green-900/20 via-green-800/20 to-green-900/20 border-green-500/30' 
          : 'bg-gradient-to-br from-red-900/20 via-red-800/20 to-red-900/20 border-red-500/30'
      }`}
    >
      {/* Header */}
      <div className={`p-4 border-b ${success ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${success ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
            {success ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">
              {success ? 'Transfer Successful!' : 'Transfer Failed'}
            </h3>
            <p className="text-xs text-muted-foreground">
              {success ? 'Your transaction has been confirmed' : 'Transaction was not completed'}
            </p>
          </div>
        </div>
      </div>

      {/* Transaction Details */}
      <div className="p-4 space-y-3">
        {/* Amount and Token */}
        <div className="p-3 bg-slate-800/30 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">Amount Sent</span>
            <span className="text-lg font-bold">{amount} {tokenSymbol}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Token Contract</span>
            <span className="font-mono">{tokenAddress?.slice(0, 10)}...</span>
          </div>
        </div>

        {/* From/To */}
        <div className="space-y-2">
          <div className="flex justify-between p-2 bg-slate-800/30 rounded">
            <span className="text-xs text-muted-foreground">From</span>
            <span className="text-xs font-mono">{from?.slice(0, 8)}...{from?.slice(-6)}</span>
          </div>
          <div className="flex justify-between p-2 bg-slate-800/30 rounded">
            <span className="text-xs text-muted-foreground">To</span>
            <span className="text-xs font-mono">{to?.slice(0, 8)}...{to?.slice(-6)}</span>
          </div>
        </div>

        {/* Transaction Hash */}
        {hash && (
          <div className="p-3 bg-slate-800/30 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Transaction Hash</span>
              <button
                onClick={copyHash}
                className="p-1 hover:bg-slate-700 rounded transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
            <p className="text-xs font-mono truncate">{hash}</p>
          </div>
        )}

        {/* Gas Used */}
        {receipt && (
          <div className="flex justify-between p-2 bg-slate-800/30 rounded text-xs">
            <span className="text-muted-foreground">Gas Used</span>
            <span>{receipt.gasUsed?.toString()} wei</span>
          </div>
        )}
      </div>

      {/* View on Explorer */}
      {explorerUrl && (
        <div className="p-4 pt-0">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => window.open(explorerUrl, '_blank')}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View on Explorer
          </Button>
        </div>
      )}
    </motion.div>
  )
}

// Swap Result Card
export function SwapResultCard({ success, hash, tokenIn, tokenInSymbol, amountIn, tokenOut, tokenOutSymbol, amountOut, explorerUrl }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border overflow-hidden ${
        success 
          ? 'bg-gradient-to-br from-green-900/20 via-green-800/20 to-green-900/20 border-green-500/30' 
          : 'bg-gradient-to-br from-red-900/20 via-red-800/20 to-red-900/20 border-red-500/30'
      }`}
    >
      <div className={`p-4 border-b ${success ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${success ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
            <ArrowRightLeft className={`w-5 h-5 ${success ? 'text-green-500' : 'text-red-500'}`} />
          </div>
          <div>
            <h3 className="font-semibold">
              {success ? 'Swap Successful!' : 'Swap Failed'}
            </h3>
            <p className="text-xs text-muted-foreground">
              {tokenInSymbol} → {tokenOutSymbol}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="space-y-2">
          <div className="p-3 bg-red-500/10 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">You Paid</p>
            <p className="text-lg font-bold">{amountIn} {tokenInSymbol}</p>
          </div>
          <div className="p-3 bg-green-500/10 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">You Received</p>
            <p className="text-lg font-bold">{amountOut} {tokenOutSymbol}</p>
          </div>
        </div>

        {hash && (
          <div className="p-3 bg-slate-800/30 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Transaction Hash</p>
            <p className="text-xs font-mono truncate">{hash}</p>
          </div>
        )}
      </div>

      {explorerUrl && (
        <div className="p-4 pt-0">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => window.open(explorerUrl, '_blank')}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View on Explorer
          </Button>
        </div>
      )}
    </motion.div>
  )
}

// Bridge Result Card
export function BridgeResultCard({ success, hash, fromChain, toChain, amount, tokenSymbol, explorerUrl }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border overflow-hidden ${
        success 
          ? 'bg-gradient-to-br from-green-900/20 via-green-800/20 to-green-900/20 border-green-500/30' 
          : 'bg-gradient-to-br from-red-900/20 via-red-800/20 to-red-900/20 border-red-500/30'
      }`}
    >
      <div className={`p-4 border-b ${success ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${success ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
            <Globe2 className={`w-5 h-5 ${success ? 'text-green-500' : 'text-red-500'}`} />
          </div>
          <div>
            <h3 className="font-semibold">
              {success ? 'Bridge Initiated!' : 'Bridge Failed'}
            </h3>
            <p className="text-xs text-muted-foreground">
              {fromChain} → {toChain}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-muted-foreground">Amount Bridged</p>
              <p className="text-lg font-bold">{amount} {tokenSymbol}</p>
            </div>
            <Clock className="w-5 h-5 text-primary" />
          </div>
        </div>

        <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-yellow-500" />
            <p className="text-xs text-yellow-500">
              Bridge transfer usually takes 2-5 minutes to complete
            </p>
          </div>
        </div>

        {hash && (
          <div className="p-3 bg-slate-800/30 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Transaction Hash</p>
            <p className="text-xs font-mono truncate">{hash}</p>
          </div>
        )}
      </div>

      {explorerUrl && (
        <div className="p-4 pt-0">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => window.open(explorerUrl, '_blank')}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Track on Explorer
          </Button>
        </div>
      )}
    </motion.div>
  )
}

// Pool Result Card
export function PoolResultCard({ token0Symbol, token1Symbol, tvl, volume24h, apr, feeTier, liquidity }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl border border-slate-700 overflow-hidden"
    >
      <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 p-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-lg">
            <Droplets className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">{token0Symbol}/{token1Symbol} Pool</h3>
            <p className="text-xs text-muted-foreground">QuickSwap V4</p>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-slate-800/30 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-3 h-3 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">TVL</p>
            </div>
            <p className="text-lg font-bold">${tvl?.toLocaleString() || '0'}</p>
          </div>
          
          <div className="p-3 bg-slate-800/30 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-3 h-3 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">24h Volume</p>
            </div>
            <p className="text-lg font-bold">${volume24h?.toLocaleString() || '0'}</p>
          </div>
          
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-3 h-3 text-green-500" />
              <p className="text-xs text-green-500">APR</p>
            </div>
            <p className="text-lg font-bold text-green-500">{apr || '0'}%</p>
          </div>
          
          <div className="p-3 bg-slate-800/30 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-3 h-3 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Fee Tier</p>
            </div>
            <p className="text-lg font-bold">{feeTier || '0.3'}%</p>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <Button variant="outline" size="sm" className="flex-1">
            <Droplets className="w-3 h-3 mr-1" />
            Add Liquidity
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            <ArrowRightLeft className="w-3 h-3 mr-1" />
            Swap in Pool
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

// Error Card
export function ErrorCard({ error }: { error: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-red-900/20 to-red-800/20 rounded-xl border border-red-500/30 p-4"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-red-500/20 rounded-lg">
          <XCircle className="w-5 h-5 text-red-500" />
        </div>
        <h3 className="font-semibold">Transaction Error</h3>
      </div>
      <p className="text-sm text-red-400">{error}</p>
    </motion.div>
  )
}

// Wallet Connection Card
export function WalletConnectionCard() {
  const { openConnectModal } = useConnectModal()
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-xl border border-primary/30 p-6 text-center"
    >
      <Wallet className="w-12 h-12 text-primary mx-auto mb-3" />
      <h3 className="font-semibold mb-2">Connect Your Wallet</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Please connect your wallet to perform this action
      </p>
      <Button 
        onClick={openConnectModal}
        className="bg-gradient-to-r from-primary to-purple-500"
      >
        Connect Wallet
      </Button>
    </motion.div>
  )
}