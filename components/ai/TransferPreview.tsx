'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Send, Loader2, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAccount, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits, type Address } from 'viem'
import { type TransferTransactionProps } from '@/lib/ai/tools/makeTransferTransaction'

interface TransferPreviewProps {
  transaction: TransferTransactionProps
}

export default function TransferPreview({ transaction }: TransferPreviewProps) {
  const { address, isConnected } = useAccount()
  const [isExecuting, setIsExecuting] = useState(false)
  
  const {
    sendTransaction,
    data: txHash,
    isPending: isSending,
    error: sendError,
  } = useSendTransaction()

  const {
    isLoading: isConfirming,
    isSuccess,
    error: txError,
  } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  const handleExecute = async () => {
    if (!isConnected || !address) {
      console.error('Wallet not connected')
      return
    }

    setIsExecuting(true)

    try {
      // Parse amount to smallest unit
      const value = parseUnits(transaction.amount, transaction.decimals)

      // For native token transfers
      if (transaction.tokenAddress === '0x0000000000000000000000000000000000000000') {
        sendTransaction({
          to: transaction.to as Address,
          value,
        })
      } else {
        // For ERC20 transfers, we'd need to call the transfer function
        // This would require encoding the function call
        console.log('ERC20 transfer not yet implemented in preview')
      }
    } catch (error) {
      console.error('Error executing transfer:', error)
      setIsExecuting(false)
    }
  }

  const shortenAddress = (addr: string) => {
    return addr.length > 10 ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : addr
  }

  const getExplorerUrl = (hash: string) => {
    return `https://somniascan.com/tx/${hash}`
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-4 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl border border-border"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-primary/20 rounded-lg">
          <Send className="w-4 h-4 text-primary" />
        </div>
        <h3 className="font-semibold">Transfer Transaction</h3>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg">
          <span className="text-sm text-muted-foreground">From</span>
          <span className="font-mono text-sm">{shortenAddress(transaction.from)}</span>
        </div>

        <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg">
          <span className="text-sm text-muted-foreground">To</span>
          <span className="font-mono text-sm">{shortenAddress(transaction.to)}</span>
        </div>

        <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg">
          <span className="text-sm text-muted-foreground">Amount</span>
          <div className="text-right">
            <div className="font-semibold">
              {transaction.amount} {transaction.tokenSymbol}
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg">
          <span className="text-sm text-muted-foreground">Network</span>
          <span className="text-sm">Somnia Mainnet</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-4 space-y-3">
        {!txHash && !isSuccess && (
          <Button
            onClick={handleExecute}
            disabled={!isConnected || isSending || isExecuting}
            className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Confirming...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Execute Transfer
              </>
            )}
          </Button>
        )}

        {isConfirming && (
          <div className="flex items-center justify-center gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
            <span className="text-sm">Waiting for confirmation...</span>
          </div>
        )}

        {isSuccess && txHash && (
          <div className="p-3 bg-success/10 border border-success/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              <span className="font-medium text-success">Transfer Successful!</span>
            </div>
            <a
              href={getExplorerUrl(txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              View on Explorer
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {(sendError || txError) && (
          <div className="p-3 bg-error/10 border border-error/20 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-error mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-error">Transaction Failed</p>
                <p className="text-muted-foreground mt-1">
                  {sendError?.message || txError?.message}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}