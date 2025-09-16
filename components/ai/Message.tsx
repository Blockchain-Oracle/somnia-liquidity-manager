'use client'

import { type UIMessage } from 'ai'
import { motion } from 'framer-motion'
import { Bot, User, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MessageProps {
  message: UIMessage
  isLoading?: boolean
}

export default function AIMessage({ message, isLoading }: MessageProps) {
  const isUser = message.role === 'user'

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
        {message && (
          <div className="prose prose-invert max-w-none">
            {(((message as any).parts || [])
              .map((p: any) => (p?.type === 'text' ? p.text : ''))
              .join('') || '')}
          </div>
        )}

        {isLoading && (
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Thinking...</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}