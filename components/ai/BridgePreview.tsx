'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Globe, Loader2, CheckCircle2, AlertCircle, ExternalLink, Clock, Fuel } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAccount } from 'wagmi'
import { type BridgeTransactionProps } from '@/lib/ai/tools/makeBridgeTransaction'

interface BridgePreviewProps {
  transaction: BridgeTransactionProps
}

const CHAIN_INFO = {
  somnia: { name: 'Somnia', shortName: 'SOM' },
  ethereum: { name: 'Ethereum', shortName: 'ETH' },
  polygon: { name: 'Polygon', shortName: 'POL' },
  arbitrum: { name: 'Arbitrum', shortName: 'ARB' },
  base: { name: 'Base', shortName: 'BASE' },
  bsc: { name: 'BNB Chain', shortName: 'BNB' },
}

export default function BridgePreview({ transaction }: BridgePreviewProps) {
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
      // In production, this would interact with Stargate contracts
      console.log('Executing bridge:', transaction)
      
      // Simulate transaction delay
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Mock transaction hash
      setTxHash('0x' + Math.random().toString(36).substring(2, 15))
      
    } catch (err: any) {
      console.error('Bridge error:', err)
      setError(err.message || 'Bridge failed')
    } finally {
      setIsExecuting(false)
    }
  }

  const fromChain = CHAIN_INFO[transaction.fromChain as keyof typeof CHAIN_INFO]
  const toChain = CHAIN_INFO[transaction.toChain as keyof typeof CHAIN_INFO]
  
  // Mock fee calculation
  const bridgeFee = (parseFloat(transaction.amount) * 0.001).toFixed(6)
  const estimatedTime = '3-5 minutes'

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-4 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl border border-border"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-primary/20 rounded-lg">
          <Globe className="w-4 h-4 text-primary" />
        </div>
        <h3 className="font-semibold">Bridge Transaction</h3>
      </div>

      <div className="space-y-3">
        {/* Bridge Route */}
        <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <span className="text-xs font-bold">{fromChain.shortName}</span>
            </div>
            <div>
              <div className="font-medium">{fromChain.name}</div>
              <div className="text-xs text-muted-foreground">Source</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="h-px w-8 bg-border" />
            <Globe className="w-4 h-4 text-muted-foreground" />
            <div className="h-px w-8 bg-border" />
          </div>
          
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="font-medium">{toChain.name}</div>
              <div className="text-xs text-muted-foreground">Destination</div>
            </div>
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <span className="text-xs font-bold">{toChain.shortName}</span>
            </div>
          </div>
        </div>

        {/* Amount */}
        <div className="p-3 bg-slate-900/50 rounded-lg">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-muted-foreground">Amount</span>
            <span className="text-xs text-muted-foreground">{transaction.tokenSymbol}</span>
          </div>
          <div className="text-xl font-bold">{transaction.amount}</div>
        </div>

        {/* Bridge Details */}
        <div className="space-y-2 pt-2 border-t border-border/50">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <span className="text-muted-foreground">Estimated Time</span>
            </div>
            <span>{estimatedTime}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-1">
              <Fuel className="w-3 h-3 text-muted-foreground" />
              <span className="text-muted-foreground">Bridge Fee</span>
            </div>
            <span>{bridgeFee} {transaction.tokenSymbol}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Protocol</span>
            <span>Stargate</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Slippage</span>
            <span>{transaction.slippage}%</span>
          </div>
        </div>

        {/* You will receive */}
        <div className="p-3 bg-success/10 border border-success/20 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm text-success">You will receive</span>
            <div className="text-right">
              <div className="font-bold text-success">
                ~{(parseFloat(transaction.amount) - parseFloat(bridgeFee)).toFixed(6)} {transaction.tokenSymbol}
              </div>
              <div className="text-xs text-muted-foreground">on {toChain.name}</div>
            </div>
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
                Initiating Bridge...
              </>
            ) : (
              <>
                <Globe className="w-4 h-4 mr-2" />
                Execute Bridge
              </>
            )}
          </Button>
        )}

        {txHash && (
          <div className="p-3 bg-success/10 border border-success/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              <span className="font-medium text-success">Bridge Initiated!</span>
            </div>
            <div className="text-sm text-muted-foreground mb-2">
              Your {transaction.amount} {transaction.tokenSymbol} is being bridged to {toChain.name}.
              Estimated arrival in {estimatedTime}.
            </div>
            <div className="flex gap-2">
              <a
                href={`https://layerzeroscan.com/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-primary hover:underline"
              >
                Track on LayerZero
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-error/10 border border-error/20 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-error mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-error">Bridge Failed</p>
                <p className="text-muted-foreground mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}