'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface TransformCardProps {
  children: ReactNode
  rotation?: string
  background?: string
  border?: string
  shadow?: string
  rounded?: string
  className?: string
  animate?: boolean
  delay?: number
}

export function TransformCard({
  children,
  rotation = 'rotate-0',
  background = 'bg-gradient-to-br from-gray-900 to-gray-800',
  border = 'border border-gray-700/50',
  shadow = 'xl',
  rounded = '3xl',
  className = '',
  animate = true,
  delay = 0
}: TransformCardProps) {
  if (!animate) {
    return (
      <div
        className={cn(
          rotation,
          background,
          border,
          `shadow-${shadow}`,
          `rounded-${rounded}`,
          'transition-all duration-500 hover:scale-105',
          className
        )}
      >
        {children}
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.6,
        delay,
        type: 'spring',
        stiffness: 100
      }}
      whileHover={{ 
        scale: 1.05,
        transition: { duration: 0.3 }
      }}
      className={cn(
        rotation,
        background,
        border,
        `shadow-${shadow}`,
        `rounded-${rounded}`,
        'transition-all duration-500',
        className
      )}
    >
      {children}
    </motion.div>
  )
}