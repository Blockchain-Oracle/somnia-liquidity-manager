'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  children: React.ReactNode
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default'
  pulse?: boolean
  className?: string
}

export function StatusBadge({ 
  children, 
  variant = 'default', 
  pulse = false,
  className = '' 
}: StatusBadgeProps) {
  const variantStyles = {
    success: 'bg-green-500/10 text-green-500 border-green-500/30',
    warning: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
    error: 'bg-red-500/10 text-red-500 border-red-500/30',
    info: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
    default: 'bg-gray-500/10 text-gray-500 border-gray-500/30'
  }

  const pulseColors = {
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    default: 'bg-gray-500'
  }

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border',
        variantStyles[variant],
        className
      )}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span className={cn(
            'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
            pulseColors[variant]
          )} />
          <span className={cn(
            'relative inline-flex rounded-full h-2 w-2',
            pulseColors[variant]
          )} />
        </span>
      )}
      {children}
    </motion.div>
  )
}