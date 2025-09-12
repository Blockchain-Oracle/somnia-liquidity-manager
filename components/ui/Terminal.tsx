'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface TerminalProps {
  title?: string
  children: ReactNode
  className?: string
}

interface TerminalLineProps {
  command?: string
  output?: string
  type?: 'command' | 'output' | 'comment' | 'success' | 'error'
  clickable?: boolean
  onClick?: () => void
  children?: ReactNode
}

export function Terminal({ title = 'terminal', children, className = '' }: TerminalProps) {
  return (
    <div className={cn('bg-gray-900 rounded-xl overflow-hidden shadow-2xl border border-gray-800', className)}>
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" />
        </div>
        <span className="text-xs text-gray-400 font-mono">{title}</span>
        <div className="w-16" />
      </div>
      
      {/* Terminal Content */}
      <div className="p-4 font-mono text-sm space-y-2 max-h-96 overflow-y-auto">
        {children}
      </div>
    </div>
  )
}

function TerminalLine({ 
  command, 
  output, 
  type = 'command', 
  clickable = false, 
  onClick,
  children 
}: TerminalLineProps) {
  const getPrefix = () => {
    switch (type) {
      case 'command':
        return <span className="text-green-400">$</span>
      case 'output':
        return null
      case 'comment':
        return <span className="text-gray-500">#</span>
      case 'success':
        return <span className="text-green-400">✓</span>
      case 'error':
        return <span className="text-red-400">✗</span>
      default:
        return null
    }
  }

  const getTextColor = () => {
    switch (type) {
      case 'command':
        return 'text-white'
      case 'output':
        return 'text-gray-300'
      case 'comment':
        return 'text-gray-500'
      case 'success':
        return 'text-green-400'
      case 'error':
        return 'text-red-400'
      default:
        return 'text-gray-300'
    }
  }

  const content = command || output || children

  if (clickable) {
    return (
      <motion.div
        className={cn(
          'flex items-center gap-2 cursor-pointer hover:bg-gray-800/50 -mx-2 px-2 py-1 rounded transition-colors',
          getTextColor()
        )}
        onClick={onClick}
        whileHover={{ x: 5 }}
        whileTap={{ scale: 0.98 }}
      >
        {getPrefix()}
        <span>{content}</span>
      </motion.div>
    )
  }

  return (
    <div className={cn('flex items-center gap-2', getTextColor())}>
      {getPrefix()}
      <span>{content}</span>
    </div>
  )
}

Terminal.Line = TerminalLine

export default Terminal