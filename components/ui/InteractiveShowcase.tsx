'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import Terminal from './Terminal'

export interface ShowcaseItem {
  id: string
  name: string
  description: string
  [key: string]: any
}

interface InteractiveShowcaseProps<T extends ShowcaseItem> {
  items: T[]
  title?: string
  MainContent: React.ComponentType<{ item: T; index: number }>
  SidebarItem: React.ComponentType<{ 
    item: T; 
    index: number; 
    isActive: boolean; 
    onClick: () => void 
  }>
  terminalTitle?: string
  rotationInterval?: number
  className?: string
}

export function InteractiveShowcase<T extends ShowcaseItem>({
  items,
  title,
  MainContent,
  SidebarItem,
  terminalTitle = 'showcase',
  rotationInterval = 5000,
  className = ''
}: InteractiveShowcaseProps<T>) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isAutoRotating, setIsAutoRotating] = useState(true)

  useEffect(() => {
    if (!isAutoRotating || items.length <= 1) return

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % items.length)
    }, rotationInterval)

    return () => clearInterval(interval)
  }, [isAutoRotating, items.length, rotationInterval])

  const handlePrevious = () => {
    setIsAutoRotating(false)
    setActiveIndex((prev) => (prev - 1 + items.length) % items.length)
  }

  const handleNext = () => {
    setIsAutoRotating(false)
    setActiveIndex((prev) => (prev + 1) % items.length)
  }

  const handleItemClick = (index: number) => {
    setIsAutoRotating(false)
    setActiveIndex(index)
  }

  if (items.length === 0) return null

  const activeItem = items[activeIndex]

  return (
    <div className={cn('relative', className)}>
      {title && (
        <div className="mb-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-black text-white">{title}</h2>
        </div>
      )}

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Sidebar with items */}
        <div className="lg:col-span-4 space-y-2">
          <Terminal title={terminalTitle}>
            <Terminal.Line type="comment" output={`// ${items.length} items available`} />
            <Terminal.Line command="ls -la" />
            {items.map((item, index) => (
              <div key={item.id}>
                <SidebarItem
                  item={item}
                  index={index}
                  isActive={index === activeIndex}
                  onClick={() => handleItemClick(index)}
                />
              </div>
            ))}
          </Terminal>
        </div>

        {/* Main content area */}
        <div className="lg:col-span-8">
          <div className="relative">
            {/* Navigation buttons */}
            <div className="absolute -left-12 top-1/2 -translate-y-1/2 z-20 hidden lg:block">
              <button
                onClick={handlePrevious}
                className="p-2 rounded-full bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
                aria-label="Previous item"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
            </div>
            <div className="absolute -right-12 top-1/2 -translate-y-1/2 z-20 hidden lg:block">
              <button
                onClick={handleNext}
                className="p-2 rounded-full bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
                aria-label="Next item"
              >
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Content with animation */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeItem.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <MainContent item={activeItem} index={activeIndex} />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Mobile navigation */}
          <div className="flex justify-center gap-4 mt-6 lg:hidden">
            <button
              onClick={handlePrevious}
              className="p-2 rounded-full bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
              aria-label="Previous item"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <div className="flex items-center gap-2">
              {items.map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleItemClick(index)}
                  className={cn(
                    'w-2 h-2 rounded-full transition-all',
                    index === activeIndex
                      ? 'w-8 bg-primary'
                      : 'bg-gray-600 hover:bg-gray-500'
                  )}
                  aria-label={`Go to item ${index + 1}`}
                />
              ))}
            </div>
            <button
              onClick={handleNext}
              className="p-2 rounded-full bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
              aria-label="Next item"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Auto-rotation indicator */}
      {isAutoRotating && (
        <div className="absolute top-4 right-4">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Auto-rotating
          </div>
        </div>
      )}
    </div>
  )
}