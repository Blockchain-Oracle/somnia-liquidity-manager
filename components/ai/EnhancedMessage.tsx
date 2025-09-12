'use client'

import { motion } from 'framer-motion'
import { User, Bot, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { BalanceCard, TransactionPreview, TransactionResult, PoolInfoCard } from './ResultCards'
import { useSendTransaction, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther, parseUnits } from 'viem'

interface MessageProps {
  message: {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp?: Date
  }
  isLoading?: boolean
}

export default function EnhancedMessage({ message, isLoading }: MessageProps) {
  const [parsedContent, setParsedContent] = useState<any>(null)
  const [transactionDetails, setTransactionDetails] = useState<any>(null)
  const [isSigningTransaction, setIsSigningTransaction] = useState(false)
  
  const { sendTransaction, data: txHash } = useSendTransaction()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  useEffect(() => {
    // Try to parse structured data from the message content
    if (message.role === 'assistant') {
      try {
        // Check if message contains JSON data blocks
        const jsonMatch = message.content.match(/```json\n([\s\S]*?)\n```/)
        if (jsonMatch) {
          const jsonData = JSON.parse(jsonMatch[1])
          setParsedContent(jsonData)
        }
        
        // Check for balance data
        if (message.content.includes('walletAddress') && message.content.includes('balances')) {
          const balanceMatch = message.content.match(/\{[\s\S]*walletAddress[\s\S]*\}/)
          if (balanceMatch) {
            try {
              const balanceData = JSON.parse(balanceMatch[0])
              setParsedContent({ type: 'balance', data: balanceData })
            } catch (e) {
              // Not valid JSON, ignore
            }
          }
        }
        
        // Check for transaction preview
        if (message.content.includes('TRANSACTION_PREVIEW:')) {
          const previewMatch = message.content.match(/TRANSACTION_PREVIEW:\s*(\{[\s\S]*?\})/)
          if (previewMatch) {
            try {
              const txData = JSON.parse(previewMatch[1])
              setParsedContent({ type: 'transaction_preview', data: txData })
              setTransactionDetails(txData)
            } catch (e) {
              // Not valid JSON, ignore
            }
          }
        }
        
        // Check for pool info
        if (message.content.includes('pool') && message.content.includes('tvl')) {
          const poolMatch = message.content.match(/\{[\s\S]*pool[\s\S]*tvl[\s\S]*\}/)
          if (poolMatch) {
            try {
              const poolData = JSON.parse(poolMatch[0])
              setParsedContent({ type: 'pool', data: poolData })
            } catch (e) {
              // Not valid JSON, ignore
            }
          }
        }
      } catch (error) {
        console.error('Error parsing message content:', error)
      }
    }
  }, [message.content, message.role])

  const handleSignTransaction = async () => {
    if (!transactionDetails) return
    
    setIsSigningTransaction(true)
    
    try {
      // Build transaction based on type
      let tx: any = {}
      
      if (transactionDetails.type === 'transfer') {
        // Handle token transfer
        if (transactionDetails.tokenAddress === '0x0000000000000000000000000000000000000000') {
          // Native token transfer
          tx = {
            to: transactionDetails.to,
            value: parseEther(transactionDetails.amount),
          }
        } else {
          // ERC20 transfer - would need to encode transfer function
          // This is simplified - in production you'd use the actual contract ABI
          console.log('ERC20 transfer not fully implemented in demo')
        }
      } else if (transactionDetails.type === 'swap') {
        // Handle swap transaction
        console.log('Swap transaction:', transactionDetails)
        // Would interact with QuickSwap router contract
      }
      
      // Send the transaction
      await sendTransaction(tx)
      
    } catch (error) {
      console.error('Transaction error:', error)
    } finally {
      setIsSigningTransaction(false)
    }
  }

  const handleCancelTransaction = () => {
    setParsedContent(null)
    setTransactionDetails(null)
  }

  // Render user message
  if (message.role === 'user') {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex gap-3 justify-end"
      >
        <div className="max-w-[80%] lg:max-w-[60%]">
          <div className="flex items-end gap-2 justify-end mb-1">
            <span className="text-xs text-muted-foreground">You</span>
            <div className="p-1.5 bg-primary/10 rounded-lg">
              <User className="w-3 h-3 text-primary" />
            </div>
          </div>
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
            <p className="text-sm">{message.content}</p>
          </div>
        </div>
      </motion.div>
    )
  }

  // Render assistant message with enhanced cards
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex gap-3"
    >
      <div className="max-w-[80%] lg:max-w-[60%]">
        <div className="flex items-end gap-2 mb-1">
          <div className="p-1.5 bg-slate-800 rounded-lg">
            <Bot className="w-3 h-3 text-slate-400" />
          </div>
          <span className="text-xs text-muted-foreground">AI Assistant</span>
        </div>
        
        {/* Render special cards if detected */}
        {parsedContent?.type === 'balance' && parsedContent.data && (
          <BalanceCard {...parsedContent.data} />
        )}
        
        {parsedContent?.type === 'transaction_preview' && parsedContent.data && (
          <TransactionPreview
            type={parsedContent.data.type}
            details={parsedContent.data}
            onSign={handleSignTransaction}
            onCancel={handleCancelTransaction}
            isLoading={isSigningTransaction}
          />
        )}
        
        {parsedContent?.type === 'pool' && parsedContent.data && (
          <PoolInfoCard pool={parsedContent.data} />
        )}
        
        {/* Show transaction result if we have a hash */}
        {txHash && (
          <TransactionResult
            success={isConfirmed}
            hash={txHash}
            explorerUrl={`https://shannon-explorer.somnia.network/tx/${txHash}`}
          />
        )}
        
        {/* Render regular message content if no special card */}
        {!parsedContent && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span className="text-sm text-muted-foreground">Thinking...</span>
              </div>
            ) : (
              <div className="prose prose-sm prose-invert max-w-none">
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <p className="text-sm mb-2 last:mb-0">{children}</p>,
                    ul: ({ children }) => <ul className="text-sm space-y-1 ml-4">{children}</ul>,
                    ol: ({ children }) => <ol className="text-sm space-y-1 ml-4">{children}</ol>,
                    li: ({ children }) => <li className="text-sm">{children}</li>,
                    code: ({ children, className }) => {
                      const isInline = !className
                      return isInline ? (
                        <code className="px-1 py-0.5 bg-slate-700 rounded text-xs">{children}</code>
                      ) : (
                        <code className="block p-2 bg-slate-900 rounded text-xs overflow-x-auto">{children}</code>
                      )
                    },
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}