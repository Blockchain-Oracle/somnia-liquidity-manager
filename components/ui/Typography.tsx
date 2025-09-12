'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface TypographyProps {
  children: ReactNode
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span'
  gradient?: 'brand' | 'blue' | 'purple' | 'green' | 'orange' | 'custom'
  color?: 'white' | 'gray' | 'muted' | 'blue' | 'purple' | 'green'
  className?: string
  as?: keyof JSX.IntrinsicElements
}

export function Typography({
  children,
  variant = 'p',
  gradient,
  color,
  className = '',
  as
}: TypographyProps) {
  const Component = as || variant

  const variantStyles = {
    h1: 'text-4xl lg:text-5xl xl:text-6xl font-black tracking-tight',
    h2: 'text-3xl lg:text-4xl xl:text-5xl font-black tracking-tight',
    h3: 'text-2xl lg:text-3xl font-bold',
    h4: 'text-xl lg:text-2xl font-bold',
    h5: 'text-lg lg:text-xl font-semibold',
    h6: 'text-base lg:text-lg font-semibold',
    p: 'text-base',
    span: 'text-base'
  }

  const gradientStyles = {
    brand: 'bg-gradient-to-r from-blue-500 via-purple-500 to-green-500',
    blue: 'bg-gradient-to-r from-blue-400 to-blue-600',
    purple: 'bg-gradient-to-r from-purple-400 to-purple-600',
    green: 'bg-gradient-to-r from-green-400 to-green-600',
    orange: 'bg-gradient-to-r from-orange-400 to-orange-600',
    custom: ''
  }

  const colorStyles = {
    white: 'text-white',
    gray: 'text-gray-900 dark:text-white',
    muted: 'text-gray-600 dark:text-gray-400',
    blue: 'text-blue-500',
    purple: 'text-purple-500',
    green: 'text-green-500'
  }

  const classes = cn(
    variantStyles[variant],
    gradient ? `${gradientStyles[gradient]} bg-clip-text text-transparent` : colorStyles[color || 'gray'],
    className
  )

  return <Component className={classes}>{children}</Component>
}