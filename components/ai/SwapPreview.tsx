'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowDownUp, Loader2, CheckCircle2, AlertCircle, ExternalLink, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAccount } from 'wagmi'
import { type SwapTransactionProps } from '@/lib/ai/tools/makeSwapTransaction'

interface SwapPreviewProps {
  transaction: SwapTransactionProps
}

export default function SwapPreview({ transaction }: SwapPreviewProps) {
  const { address, isConnected } = useAccount()
  const [isExecuting, setIsExecuting] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleExecute = async () => {
    if (!isConnected || !address) {
      setError('Please connect your wallet first')
      return
    }

    setIsExecuting(true)
    setError(null)

    try {
      // In production, this would interact with QuickSwap V4 contracts
      // For now, simulating the swap
      console.log('Executing swap:', transaction)
      
      // Simulate transaction delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Mock transaction hash
      setTxHash('0x' + Math.random().toString(36).substring(2, 15))
      
    } catch (err: any) {
      console.error('Swap error:', err)
      setError(err.message || 'Swap failed')
    } finally {
      setIsExecuting(false)
    }
  }

  const shortenAddress = (addr: string) => {
    return addr.length > 10 ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : addr
  }

  // Mock exchange rate calculation
  const estimatedOutput = (parseFloat(transaction.amount) * 0.98).toFixed(6)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-4 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl border border-border"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-primary/20 rounded-lg">
          <ArrowDownUp className="w-4 h-4 text-primary" />
        </div>
        <h3 className="font-semibold">Swap Transaction</h3>
      </div>

      <div className="space-y-3">
        {/* From Token */}
        <div className="p-3 bg-slate-900/50 rounded-lg">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-muted-foreground">You Pay</span>
            <span className="text-xs text-muted-foreground">{transaction.tokenInSymbol}</span>
          </div>
          <div className="text-xl font-bold">{transaction.amount}</div>
        </div>

        {/* Swap Direction Arrow */}
        <div className="flex justify-center">
          <div className="p-2 bg-slate-800 rounded-full">
            <ArrowDownUp className="w-4 h-4" />
          </div>
        </div>

        {/* To Token */}
        <div className="p-3 bg-slate-900/50 rounded-lg">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-muted-foreground">You Receive</span>
            <span className="text-xs text-muted-foreground">{transaction.tokenOutSymbol}</span>
          </div>
          <div className="text-xl font-bold text-success">~{estimatedOutput}</div>
        </div>

        {/* Transaction Details */}
        <div className="space-y-2 pt-2 border-t border-border/50">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Slippage Tolerance</span>
            <span>{transaction.slippage}%</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Protocol</span>
            <span>QuickSwap V4</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Network</span>
            <span>Somnia</span>
          </div>
        </div>

        {/* Price Impact Warning */}
        <div className="flex items-start gap-2 p-3 bg-warning/10 border border-warning/20 rounded-lg">
          <Info className="w-4 h-4 text-warning mt-0.5" />
          <div className="text-xs">
            <p className="font-medium text-warning">Price Impact: ~2%</p>
            <p className="text-muted-foreground mt-1">
              The difference between market price and estimated price due to trade size.
            </p>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-4 space-y-3">
        {!txHash && (
          <Button
            onClick={handleExecute}
            disabled={!isConnected || isExecuting}
            className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          >
            {isExecuting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Swapping...
              </>
            ) : (
              <>
                <ArrowDownUp className="w-4 h-4 mr-2" />
                Execute Swap
              </>
            )}
          </Button>
        )}

        {txHash && (
          <div className="p-3 bg-success/10 border border-success/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              <span className="font-medium text-success">Swap Successful!</span>
            </div>
            <div className="text-sm text-muted-foreground mb-2">
              Swapped {transaction.amount} {transaction.tokenInSymbol} for {estimatedOutput} {transaction.tokenOutSymbol}
            </div>
            <a
              href={`https://somniascan.com/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              View on Explorer
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {error && (
          <div className="p-3 bg-error/10 border border-error/20 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-error mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-error">Swap Failed</p>
                <p className="text-muted-foreground mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}