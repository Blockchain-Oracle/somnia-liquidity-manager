'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, ExternalLink, Copy, ArrowRight, ArrowRightLeft, Globe2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface TransactionSuccessProps {
  type: 'transfer' | 'swap' | 'bridge'
  hash: string
  from: string
  to?: string
  amount: string
  tokenSymbol?: string
  tokenIn?: string
  tokenOut?: string
  amountOut?: string
  explorerUrl: string
  chainName?: string
}

export default function TransactionSuccessCard(props: TransactionSuccessProps) {
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const getIcon = () => {
    switch (props.type) {
      case 'swap':
        return <ArrowRightLeft className="w-5 h-5" />
      case 'bridge':
        return <Globe2 className="w-5 h-5" />
      default:
        return <ArrowRight className="w-5 h-5" />
    }
  }

  const getTitle = () => {
    switch (props.type) {
      case 'swap':
        return 'Swap Successful!'
      case 'bridge':
        return 'Bridge Initiated!'
      default:
        return 'Transfer Successful!'
    }
  }

  const getDescription = () => {
    switch (props.type) {
      case 'swap':
        return `Swapped ${props.amount} ${props.tokenIn} for ${props.amountOut || '~'} ${props.tokenOut}`
      case 'bridge':
        return `Bridging ${props.amount} ${props.tokenSymbol} to ${props.chainName || 'destination chain'}`
      default:
        return `Sent ${props.amount} ${props.tokenSymbol} successfully`
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ 
        type: "spring",
        stiffness: 300,
        damping: 20
      }}
      className="relative overflow-hidden"
    >
      {/* Success Animation Background */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-green-400/5 to-transparent rounded-xl"
      />
      
      <div className="relative bg-gradient-to-r from-slate-900/90 to-slate-800/90 backdrop-blur-sm rounded-xl p-6 border border-green-500/30">
        {/* Success Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                delay: 0.2,
                type: "spring",
                stiffness: 200
              }}
              className="p-2 bg-green-500/20 rounded-lg"
            >
              <CheckCircle2 className="w-6 h-6 text-green-400" />
            </motion.div>
            <div>
              <h3 className="text-lg font-semibold text-green-400">{getTitle()}</h3>
              <p className="text-sm text-muted-foreground">{getDescription()}</p>
            </div>
          </div>
          <div className="p-2 bg-slate-800/50 rounded-lg">
            {getIcon()}
          </div>
        </div>

        {/* Transaction Details */}
        <div className="space-y-3 mb-4">
          {/* Transaction Hash */}
          <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
            <span className="text-sm text-muted-foreground">Transaction Hash</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono">{formatAddress(props.hash)}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(props.hash, 'Transaction hash')}
                className="h-6 w-6 p-0"
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* From Address */}
          <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
            <span className="text-sm text-muted-foreground">From</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono">{formatAddress(props.from)}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(props.from, 'From address')}
                className="h-6 w-6 p-0"
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* To Address (for transfers) */}
          {props.to && props.type === 'transfer' && (
            <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
              <span className="text-sm text-muted-foreground">To</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono">{formatAddress(props.to)}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(props.to!, 'To address')}
                  className="h-6 w-6 p-0"
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}

          {/* Amount Details */}
          <div className="p-3 bg-slate-800/50 rounded-lg">
            {props.type === 'swap' ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{props.amount} {props.tokenIn}</span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-semibold text-green-400">
                    {props.amountOut || '~'} {props.tokenOut}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Amount</span>
                <span className="text-sm font-semibold">
                  {props.amount} {props.tokenSymbol}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Success Animation */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-1 bg-gradient-to-r from-green-500 to-green-400 rounded-full mb-4"
        />

        {/* View on Explorer Button */}
        <Button
          variant="outline"
          className="w-full border-green-500/30 hover:bg-green-500/10"
          onClick={() => window.open(props.explorerUrl, '_blank')}
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          View on Explorer
        </Button>

        {/* Confetti Effect */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 2, times: [0, 0.5, 1] }}
          className="absolute inset-0 pointer-events-none"
        >
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ 
                y: 0, 
                x: Math.random() * 100 - 50,
                opacity: 1 
              }}
              animate={{ 
                y: -100, 
                x: Math.random() * 200 - 100,
                opacity: 0,
                rotate: Math.random() * 360
              }}
              transition={{ 
                duration: 1.5,
                delay: i * 0.1,
                ease: "easeOut"
              }}
              className="absolute top-1/2 left-1/2 w-2 h-2 bg-green-400 rounded-full"
              style={{
                left: `${50 + (i - 3) * 15}%`
              }}
            />
          ))}
        </motion.div>
      </div>
    </motion.div>
  )
}