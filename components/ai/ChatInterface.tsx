'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Bot, Loader2, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAccount, useChainId } from 'wagmi'
import MessageParser from './MessageParser'
import { Wallet, Send as SendIcon, ArrowRightLeft, Globe2, BarChart2, Droplets, Store, ShoppingBag } from 'lucide-react'

export default function ChatInterface() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  
  // Different prompts for mainnet vs testnet
  const SUGGESTED_PROMPTS = chainId === 5031 ? [
    // Mainnet prompts with SOMI/WSOMI tokens
    { text: "Check my wallet balance", Icon: Wallet, category: "view" },
    { text: "Transfer 10 SOMI to address", Icon: SendIcon, category: "action" },
    { text: "Swap 50 SOMI for WSOMI", Icon: ArrowRightLeft, category: "action" },
    { text: "Bridge 100 SOMI to Polygon", Icon: Globe2, category: "action" },
    { text: "Browse NFT marketplace", Icon: ShoppingBag, category: "view" },
    { text: "List my NFT for sale", Icon: Store, category: "action" },
  ] : [
    // Testnet prompts with STT/WSTT and test tokens
    { text: "Check my wallet balance", Icon: Wallet, category: "view" },
    { text: "Transfer 10 WSTT to address", Icon: SendIcon, category: "action" },
    { text: "Swap 50 WSTT for tUSDC", Icon: ArrowRightLeft, category: "action" },
    { text: "Bridge 100 tUSDC to Polygon", Icon: Globe2, category: "action" },
    { text: "Browse NFT marketplace", Icon: ShoppingBag, category: "view" },
    { text: "List my NFT for sale", Icon: Store, category: "action" },
  ]
  const [hasError, setHasError] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const [input, setInput] = useState('')
  
  // Initialize useChat with proper configuration
  const { 
    messages,
    sendMessage,
    status,
    stop,
    setMessages,
    error
  } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
    onError: (error) => {
      console.error('[CLIENT] Chat error:', error)
      setHasError(true)
      setTimeout(() => setHasError(false), 5000)
    },
    onFinish: ({ message }) => {
      const textContent = message.parts
        ?.map((part: any) => (part?.type === 'text' ? part.text : ''))
        .join('') || ''
      console.log('[CLIENT] Message finished:', {
        role: message.role,
        contentLength: textContent.length,
        contentPreview: textContent.substring(0, 100)
      })
    }
  })

  // Log when messages change
  useEffect(() => {
    if (messages.length > 0) {
      console.log('[CLIENT] Messages updated:', {
        count: messages.length,
        lastMessage: messages[messages.length - 1]
      })
    }
  }, [messages])

  const handleSuggestedPrompt = (promptText: string) => {
    let finalPrompt = promptText
    if (address && finalPrompt.includes('address')) {
      finalPrompt = finalPrompt.replace('address', address)
    }
    
    console.log('[CLIENT] Using suggested prompt:', finalPrompt)
    // Send message directly using the chat helper
    sendMessage({ text: finalPrompt }, { body: { walletAddress: address } })
  }

  const isLoading = status === 'submitted' || status === 'streaming'

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input || !input.trim() || isLoading) return
    
    console.log('[CLIENT] Submitting message:', input)
    console.log('[CLIENT] With wallet address:', address)
    
    void sendMessage({ text: input }, { body: { walletAddress: address } })
    setInput('')
  }

  const clearChat = () => {
    console.log('[CLIENT] Clearing chat')
    setMessages([])
    if (inputRef.current) {
      inputRef.current.value = ''
    }
    if (isLoading) {
      stop()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-sm">AI Assistant</h2>
            <p className="text-xs text-muted-foreground">
              {isConnected ? `${address?.slice(0, 6)}...${address?.slice(-4)}` : 'Connect wallet to start'}
            </p>
          </div>
        </div>
        
        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearChat}
            disabled={isLoading}
            className="text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full space-y-6">
            <div className="text-center space-y-4">
              <div className="p-3 bg-primary/5 rounded-xl inline-block">
                <Bot className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium">How can I help you today?</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  I can execute transfers, swaps, bridges, and create NFT collections on Somnia.
                </p>
              </div>
            </div>

            {/* Suggested prompts */}
            <div className="w-full max-w-3xl space-y-4">
              <div className="text-center space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Quick Actions</p>
                <p className="text-xs text-muted-foreground/60">Click any card to get started</p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {SUGGESTED_PROMPTS.map((prompt, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ 
                      delay: index * 0.05,
                      type: "spring",
                      stiffness: 300,
                      damping: 20
                    }}
                    whileHover={{ 
                      scale: 1.05,
                      transition: { duration: 0.2 }
                    }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSuggestedPrompt(prompt.text)}
                    className={`
                      relative overflow-hidden p-4 rounded-xl border transition-all duration-300
                      ${prompt.category === 'action' 
                        ? 'bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 hover:border-primary/40 hover:from-primary/10 hover:to-primary/15' 
                        : 'bg-gradient-to-br from-slate-800/30 to-slate-700/30 border-slate-700 hover:border-slate-600 hover:from-slate-800/50 hover:to-slate-700/50'
                      }
                      group cursor-pointer
                    `}
                  >
                    <div className="flex flex-col items-start gap-3">
                      <div className={`
                        p-2 rounded-lg transition-all duration-300
                        ${prompt.category === 'action' 
                          ? 'bg-primary/10 group-hover:bg-primary/20' 
                          : 'bg-slate-700/30 group-hover:bg-slate-700/50'
                        }
                      `}>
                        <prompt.Icon className={`
                          w-5 h-5 transition-colors
                          ${prompt.category === 'action' 
                            ? 'text-primary group-hover:text-primary' 
                            : 'text-slate-400 group-hover:text-slate-300'
                          }
                        `} />
                      </div>
                      <span className="text-sm text-left text-muted-foreground group-hover:text-foreground transition-colors font-medium">
                        {prompt.text}
                      </span>
                    </div>
                    
                    {/* Animated background effect */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            <AnimatePresence>
              {messages.map((message) => (
                <MessageParser
                  key={message.id}
                  message={message}
                  isLoading={isLoading && message === messages[messages.length - 1]}
                  onSendMessage={(text) => {
                    sendMessage({ text }, { body: { walletAddress: address } })
                  }}
                />
              ))}
            </AnimatePresence>
            
            {isLoading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">AI is thinking...</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Error notification */}
      {hasError && (
        <div className="mx-4 mb-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-sm text-red-400">
            Failed to send message. Please try again.
          </p>
        </div>
      )}

      {/* Input */}
      <form onSubmit={onSubmit} className="p-4 border-t border-slate-800">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything about DeFi on Somnia..."
            disabled={isLoading}
            className="flex-1"
          />
          
          {isLoading ? (
            <Button
              type="button"
              onClick={stop}
              variant="destructive"
              size="icon"
            >
              <Loader2 className="w-4 h-4 animate-spin" />
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={!input || !input.trim()}
              size="icon"
              className="bg-primary hover:bg-primary/90"
            >
              <Send className="w-4 h-4" />
            </Button>
          )}
        </div>
        
        {!isConnected && (
          <p className="text-xs text-warning mt-2">
            Wallet connection recommended for full functionality
          </p>
        )}
      </form>
    </div>
  )
}