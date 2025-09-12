'use client'

import { type Message } from 'ai'
import { motion } from 'framer-motion'
import { Bot, User, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import TransferPreview from './TransferPreview'
import SwapPreview from './SwapPreview'
import BridgePreview from './BridgePreview'
import { type TransferTransactionProps } from '@/lib/ai/tools/makeTransferTransaction'
import { type SwapTransactionProps } from '@/lib/ai/tools/makeSwapTransaction'
import { type BridgeTransactionProps } from '@/lib/ai/tools/makeBridgeTransaction'

interface MessageProps {
  message: Message
  isLoading?: boolean
}

export default function AIMessage({ message, isLoading }: MessageProps) {
  const isUser = message.role === 'user'

  // Parse tool calls from the message
  const toolCalls = message.toolInvocations || []

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex gap-3 p-4 rounded-lg',
        isUser ? 'bg-primary/10' : 'bg-secondary/10'
      )}
    >
      <div className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
        isUser ? 'bg-primary' : 'bg-secondary'
      )}>
        {isUser ? (
          <User className="w-5 h-5 text-primary-foreground" />
        ) : (
          <Bot className="w-5 h-5 text-secondary-foreground" />
        )}
      </div>

      <div className="flex-1 space-y-3">
        {/* Text content */}
        {message.content && (
          <div className="prose prose-invert max-w-none">
            {message.content}
          </div>
        )}

        {/* Tool invocations */}
        {toolCalls.map((toolCall: any, index: number) => (
          <div key={index} className="space-y-2">
            {/* Tool loading state */}
            {toolCall.state === 'call' && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">
                  {getToolLoadingMessage(toolCall.toolName)}
                </span>
              </div>
            )}

            {/* Tool result */}
            {toolCall.state === 'result' && toolCall.result && (
              <div className="space-y-2">
                {/* Transfer transaction preview */}
                {toolCall.toolName === 'makeTransferTransaction' && (
                  <TransferPreview 
                    transaction={toolCall.result as TransferTransactionProps}
                  />
                )}

                {/* Swap transaction preview */}
                {toolCall.toolName === 'makeSwapTransaction' && (
                  <SwapPreview 
                    transaction={toolCall.result as SwapTransactionProps}
                  />
                )}

                {/* Bridge transaction preview */}
                {toolCall.toolName === 'makeBridgeTransaction' && (
                  <BridgePreview 
                    transaction={toolCall.result as BridgeTransactionProps}
                  />
                )}

                {/* Token balances result */}
                {toolCall.toolName === 'getTokenBalances' && (
                  <div className="p-4 bg-slate-800/50 rounded-lg border border-border">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-success" />
                      Wallet Balances
                    </h4>
                    <div className="space-y-2">
                      {Object.entries(toolCall.result.balances).map(([symbol, data]: [string, any]) => (
                        <div key={symbol} className="flex justify-between items-center">
                          <span className="text-sm">{symbol}</span>
                          <div className="text-right">
                            <div className="font-medium">{data.balance}</div>
                            <div className="text-xs text-muted-foreground">
                              ${data.valueUSD.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="pt-2 mt-2 border-t border-border">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Total Value</span>
                          <span className="font-bold text-primary">
                            ${toolCall.result.totalValueUSD.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Pool info result */}
                {toolCall.toolName === 'getPoolInfo' && (
                  <div className="p-4 bg-slate-800/50 rounded-lg border border-border">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-success" />
                      Pool Information
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-xs text-muted-foreground">TVL</div>
                        <div className="font-medium">${(toolCall.result.tvlUSD / 1000000).toFixed(2)}M</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">24h Volume</div>
                        <div className="font-medium">${(toolCall.result.volume24h / 1000).toFixed(0)}K</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">APR</div>
                        <div className="font-medium text-success">{toolCall.result.apr}%</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Fee</div>
                        <div className="font-medium">{toolCall.result.fee}%</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tool error */}
            {toolCall.state === 'error' && (
              <div className="flex items-start gap-2 p-3 bg-error/10 border border-error/20 rounded-lg">
                <AlertCircle className="w-4 h-4 text-error mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-error">Error</p>
                  <p className="text-muted-foreground">{toolCall.error}</p>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && !message.content && (
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Thinking...</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

function getToolLoadingMessage(toolName: string): string {
  switch (toolName) {
    case 'makeTransferTransaction':
      return 'Preparing transfer...'
    case 'makeSwapTransaction':
      return 'Calculating swap...'
    case 'makeBridgeTransaction':
      return 'Getting bridge quote...'
    case 'getTokenBalances':
      return 'Fetching balances...'
    case 'getPoolInfo':
      return 'Loading pool data...'
    default:
      return 'Processing...'
  }
}