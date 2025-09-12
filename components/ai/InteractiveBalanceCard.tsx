'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Send, ArrowRightLeft, Globe2, Copy, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAccount, useChainId } from 'wagmi'
import { toast } from 'sonner'

interface Token {
  symbol: string
  address: string
  balance: string
  decimals: number
  valueUSD: number
}

interface BalanceData {
  walletAddress: string
  balances: Record<string, Token>
  totalValueUSD: number
  chainName: string
  networkMode: string
}

interface InteractiveBalanceCardProps {
  data: BalanceData
  onAction?: (action: string, token: Token, amount?: string) => void
  onSendMessage?: (message: string) => void
}

export default function InteractiveBalanceCard({ data, onAction, onSendMessage }: InteractiveBalanceCardProps) {
  const [expandedToken, setExpandedToken] = useState<string | null>(null)
  const [actionMode, setActionMode] = useState<{ token: string; action: string } | null>(null)
  const [amount, setAmount] = useState('')
  const [toAddress, setToAddress] = useState('')
  const [toToken, setToToken] = useState('')
  const { isConnected } = useAccount()
  const chainId = useChainId()
  const isMainnet = chainId === 5031 // Somnia mainnet

  const handleTokenClick = (symbol: string) => {
    setExpandedToken(expandedToken === symbol ? null : symbol)
    setActionMode(null)
    setAmount('')
    setToAddress('')
    setToToken('')
  }

  const handleAction = (action: 'send' | 'swap' | 'bridge', token: Token) => {
    if (!isConnected) {
      toast.error('Please connect your wallet first')
      return
    }

    // Bridge only on mainnet
    if (action === 'bridge' && !isMainnet) {
      toast.info('Bridge is only available on Somnia Mainnet')
      return
    }

    setActionMode({ token: token.symbol, action })
  }

  const executeAction = (token: Token) => {
    if (!actionMode) return

    if (actionMode.action === 'send') {
      if (!amount || !toAddress) {
        toast.error('Please enter amount and recipient address')
        return
      }
      // Send message to AI to create transfer preview
      if (onSendMessage) {
        onSendMessage(`Transfer ${amount} ${token.symbol} to ${toAddress}`)
      }
    } else if (actionMode.action === 'swap') {
      if (!amount || !toToken) {
        toast.error('Please enter amount and select token to receive')
        return
      }
      // Send message to AI to create swap preview
      if (onSendMessage) {
        onSendMessage(`Swap ${amount} ${token.symbol} for ${toToken}`)
      }
    } else if (actionMode.action === 'bridge') {
      if (!amount) {
        toast.error('Please enter amount to bridge')
        return
      }
      // Send message to AI to create bridge preview
      if (onSendMessage) {
        onSendMessage(`Bridge ${amount} ${token.symbol} to Polygon`)
      }
    }

    // Reset state
    setActionMode(null)
    setAmount('')
    setToAddress('')
    setToToken('')
    setExpandedToken(null)
  }

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address)
    toast.success('Address copied to clipboard')
  }

  const formatBalance = (balance: string, symbol: string) => {
    const num = parseFloat(balance)
    if (num === 0) return '0'
    if (num < 0.01) return '<0.01'
    if (num < 1) return num.toFixed(4)
    if (num < 1000) return num.toFixed(2)
    return num.toLocaleString(undefined, { maximumFractionDigits: 2 })
  }

  const formatUSD = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)
  }

  const otherTokens = Object.keys(data.balances).filter(s => s !== actionMode?.token)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-6 border border-slate-700"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Wallet className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Wallet Balance</h3>
            <p className="text-sm text-muted-foreground">{data.networkMode}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-primary">{formatUSD(data.totalValueUSD)}</p>
          <p className="text-xs text-muted-foreground">Total Value</p>
        </div>
      </div>

      {/* Wallet Address */}
      <div className="flex items-center gap-2 mb-4 p-3 bg-slate-800/50 rounded-lg">
        <p className="text-xs text-muted-foreground flex-1 font-mono">
          {data.walletAddress}
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => copyAddress(data.walletAddress)}
          className="h-6 px-2"
        >
          <Copy className="w-3 h-3" />
        </Button>
      </div>

      {/* Token List */}
      <div className="space-y-2">
        {Object.entries(data.balances).map(([symbol, token]) => (
          <div key={symbol} className="border border-slate-700 rounded-lg overflow-hidden">
            {/* Token Row - Clickable */}
            <motion.button
              onClick={() => handleTokenClick(symbol)}
              className="w-full p-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center font-bold text-sm">
                  {symbol.slice(0, 2).toUpperCase()}
                </div>
                <div className="text-left">
                  <p className="font-semibold">{symbol}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatBalance(token.balance, symbol)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-semibold">{formatUSD(token.valueUSD)}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatUSD(token.valueUSD / parseFloat(token.balance || '1'))}/token
                  </p>
                </div>
                <motion.div
                  animate={{ rotate: expandedToken === symbol ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </motion.div>
              </div>
            </motion.button>

            {/* Expanded Actions */}
            <AnimatePresence>
              {expandedToken === symbol && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border-t border-slate-700"
                >
                  <div className="p-4 bg-slate-800/30">
                    {/* Action Mode Forms */}
                    {actionMode?.token === symbol ? (
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold capitalize">
                          {actionMode.action} {symbol}
                        </h4>
                        
                        {/* Send Form */}
                        {actionMode.action === 'send' && (
                          <>
                            <Input
                              type="number"
                              placeholder={`Amount of ${symbol} to send`}
                              value={amount}
                              onChange={(e) => setAmount(e.target.value)}
                              max={token.balance}
                              className="bg-slate-900/50"
                            />
                            <Input
                              placeholder="Recipient address (0x...)"
                              value={toAddress}
                              onChange={(e) => setToAddress(e.target.value)}
                              className="bg-slate-900/50"
                            />
                          </>
                        )}

                        {/* Swap Form */}
                        {actionMode.action === 'swap' && (
                          <>
                            <Input
                              type="number"
                              placeholder={`Amount of ${symbol} to swap`}
                              value={amount}
                              onChange={(e) => setAmount(e.target.value)}
                              max={token.balance}
                              className="bg-slate-900/50"
                            />
                            <select
                              value={toToken}
                              onChange={(e) => setToToken(e.target.value)}
                              className="w-full p-2 bg-slate-900/50 border border-slate-600 rounded-lg text-sm"
                            >
                              <option value="">Select token to receive</option>
                              {otherTokens.map(t => (
                                <option key={t} value={t}>{t}</option>
                              ))}
                            </select>
                          </>
                        )}

                        {/* Bridge Form */}
                        {actionMode.action === 'bridge' && (
                          <>
                            <Input
                              type="number"
                              placeholder={`Amount of ${symbol} to bridge`}
                              value={amount}
                              onChange={(e) => setAmount(e.target.value)}
                              max={token.balance}
                              className="bg-slate-900/50"
                            />
                            <p className="text-xs text-muted-foreground">
                              Bridge to Polygon network
                            </p>
                          </>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setActionMode(null)}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => executeAction(token)}
                            className="flex-1 bg-primary hover:bg-primary/90"
                          >
                            Create Preview
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Token Details */}
                        <div className="mb-4 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Contract:</span>
                            <div className="flex items-center gap-1">
                              <span className="font-mono text-xs">
                                {token.address === 'native' 
                                  ? 'Native Token' 
                                  : `${token.address.slice(0, 6)}...${token.address.slice(-4)}`}
                              </span>
                              {token.address !== 'native' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    copyAddress(token.address)
                                  }}
                                  className="h-5 w-5 p-0"
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Decimals:</span>
                            <span>{token.decimals}</span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-3 gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleAction('send', token)
                            }}
                            className="flex items-center gap-1"
                          >
                            <Send className="w-3 h-3" />
                            Send
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleAction('swap', token)
                            }}
                            className="flex items-center gap-1"
                          >
                            <ArrowRightLeft className="w-3 h-3" />
                            Swap
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleAction('bridge', token)
                            }}
                            disabled={!isMainnet}
                            className="flex items-center gap-1"
                            title={!isMainnet ? "Bridge is only available on mainnet" : ""}
                          >
                            <Globe2 className="w-3 h-3" />
                            Bridge
                          </Button>
                        </div>

                        {!isMainnet && (
                          <p className="text-xs text-muted-foreground text-center mt-2">
                            Bridge is only available on Somnia Mainnet
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Network Info */}
      <div className="mt-4 pt-4 border-t border-slate-700 flex items-center justify-between text-xs text-muted-foreground">
        <span>{data.chainName}</span>
        <span>Updated just now</span>
      </div>
    </motion.div>
  )
}