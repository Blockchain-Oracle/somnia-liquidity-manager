'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface AnimatedBackgroundProps {
  variant?: 'blobs' | 'lines' | 'grid' | 'dots'
  colors?: string[]
  intensity?: 'low' | 'medium' | 'high'
  opacity?: number
  className?: string
}

export function AnimatedBackground({
  variant = 'blobs',
  colors = ['#3b82f6', '#8b5cf6', '#10b981'],
  intensity = 'medium',
  opacity = 0.15,
  className = ''
}: AnimatedBackgroundProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const intensityMap = {
    low: { count: 3, duration: 30 },
    medium: { count: 5, duration: 20 },
    high: { count: 8, duration: 15 }
  }

  const config = intensityMap[intensity]

  if (variant === 'blobs') {
    return (
      <div className={`absolute inset-0 overflow-hidden ${className}`}>
        {Array.from({ length: config.count }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full mix-blend-multiply filter blur-3xl"
            style={{
              background: colors[i % colors.length],
              opacity,
              width: `${Math.random() * 400 + 200}px`,
              height: `${Math.random() * 400 + 200}px`,
            }}
            animate={{
              x: [
                Math.random() * window.innerWidth,
                Math.random() * window.innerWidth,
                Math.random() * window.innerWidth,
              ],
              y: [
                Math.random() * window.innerHeight,
                Math.random() * window.innerHeight,
                Math.random() * window.innerHeight,
              ],
            }}
            transition={{
              duration: config.duration + Math.random() * 10,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: 'easeInOut',
              delay: i * 2,
            }}
          />
        ))}
      </div>
    )
  }

  if (variant === 'lines') {
    return (
      <svg className={`absolute inset-0 ${className}`} style={{ opacity }}>
        <defs>
          <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            {colors.map((color, i) => (
              <stop key={i} offset={`${(i / colors.length) * 100}%`} stopColor={color} />
            ))}
          </linearGradient>
        </defs>
        {Array.from({ length: config.count }).map((_, i) => (
          <motion.line
            key={i}
            x1={`${Math.random() * 100}%`}
            y1={`${Math.random() * 100}%`}
            x2={`${Math.random() * 100}%`}
            y2={`${Math.random() * 100}%`}
            stroke="url(#line-gradient)"
            strokeWidth="1"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{
              duration: config.duration,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: 'easeInOut',
              delay: i * 0.5,
            }}
          />
        ))}
      </svg>
    )
  }

  if (variant === 'grid') {
    return (
      <div 
        className={`absolute inset-0 ${className}`}
        style={{
          backgroundImage: `linear-gradient(${colors[0]}22 1px, transparent 1px), linear-gradient(90deg, ${colors[0]}22 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
          opacity,
        }}
      />
    )
  }

  // Dots variant
  return (
    <div className={`absolute inset-0 ${className}`}>
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle, ${colors[0]} 1px, transparent 1px)`,
          backgroundSize: '30px 30px',
          opacity,
        }}
      />
    </div>
  )
}