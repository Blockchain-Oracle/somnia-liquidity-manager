'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  BarChart3,
  Layers,
  TrendingUp,
  Globe,
  Menu,
  X,
  ChevronDown,
  Bot,
  ShoppingBag,
  Code
} from 'lucide-react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useChainId, useSwitchChain } from 'wagmi'
import { somniaMainnet, somniaTestnet } from '@/lib/wagmi'

const navigation = [
  { name: 'Trade', href: '/trade', icon: TrendingUp },
  { name: 'Bridge', href: '/bridge', icon: Globe },
  { name: 'Marketplace', href: '/marketplace', icon: ShoppingBag },
  { name: 'AI Assistant', href: '/ai', icon: Bot },
  { name: 'Contracts', href: '/contracts', icon: Code },
]

export function Header() {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isNetworkOpen, setIsNetworkOpen] = useState(false)
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  
  const currentNetwork = chainId === somniaMainnet.id ? 'mainnet' : 'testnet'
  
  // Close menu when route changes
  React.useEffect(() => {
    setIsMenuOpen(false)
  }, [pathname])

  const handleNetworkSwitch = async (network: 'mainnet' | 'testnet') => {
    const targetChain = network === 'mainnet' ? somniaMainnet : somniaTestnet
    await switchChain({ chainId: targetChain.id })
    setIsNetworkOpen(false)
  }

  return (
    <header className="relative z-50 border-b border-border/50 backdrop-blur-xl bg-background/80">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm sm:text-base">S</span>
            </div>
            <span className="font-bold text-lg sm:text-xl hidden xs:block">Somnia DeFi</span>
            <span className="font-bold text-lg sm:text-xl xs:hidden">Somnia</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    px-4 py-2 rounded-lg flex items-center gap-2 transition-all
                    ${isActive 
                      ? 'bg-primary/10 text-primary' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                    }
                  `}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Network Selector - Hidden on mobile, shown in mobile menu */}
            <div className="relative hidden sm:block">
              <button
                onClick={() => setIsNetworkOpen(!isNetworkOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-accent/50 rounded-lg hover:bg-accent transition-colors"
              >
                <div className={`w-2 h-2 rounded-full ${
                  currentNetwork === 'mainnet' ? 'bg-success' : 'bg-warning'
                }`} />
                <span className="text-sm font-medium">
                  {currentNetwork === 'mainnet' ? 'Mainnet' : 'Testnet'}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${
                  isNetworkOpen ? 'rotate-180' : ''
                }`} />
              </button>

              {isNetworkOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 mt-2 w-48 bg-slate-800 border border-border rounded-xl overflow-hidden z-50"
                >
                  <button
                    onClick={() => handleNetworkSwitch('mainnet')}
                    className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-700 transition-colors ${
                      currentNetwork === 'mainnet' ? 'bg-primary/10' : ''
                    }`}
                  >
                    <div className="w-2 h-2 bg-success rounded-full" />
                    <div className="text-left">
                      <p className="font-medium">Somnia Mainnet</p>
                      <p className="text-xs text-muted-foreground">Chain ID: 50311</p>
                    </div>
                  </button>
                  <button
                    onClick={() => handleNetworkSwitch('testnet')}
                    className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-700 transition-colors ${
                      currentNetwork === 'testnet' ? 'bg-primary/10' : ''
                    }`}
                  >
                    <div className="w-2 h-2 bg-warning rounded-full" />
                    <div className="text-left">
                      <p className="font-medium">Somnia Testnet</p>
                      <p className="text-xs text-muted-foreground">Chain ID: 50312</p>
                    </div>
                  </button>
                </motion.div>
              )}
            </div>

            {/* Connect Wallet with RainbowKit */}
            <div className="flex items-center">
              <ConnectButton 
                showBalance={false}
                accountStatus={{
                  smallScreen: 'avatar',
                  largeScreen: 'full',
                }}
                chainStatus="none"
              />
            </div>

            {/* Mobile Menu */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="md:hidden py-4 border-t border-border/50"
          >
            {/* Mobile Network Selector */}
            <div className="sm:hidden px-4 pb-4">
              <div className="text-xs text-muted-foreground mb-2">Network</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleNetworkSwitch('mainnet')}
                  className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    currentNetwork === 'mainnet'
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'border-border text-muted-foreground'
                  }`}
                >
                  Mainnet
                </button>
                <button
                  onClick={() => handleNetworkSwitch('testnet')}
                  className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    currentNetwork === 'testnet'
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'border-border text-muted-foreground'
                  }`}
                >
                  Testnet
                </button>
              </div>
            </div>
            
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                    ${isActive 
                      ? 'bg-primary/10 text-primary' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                    }
                  `}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              )
            })}
          </motion.nav>
        )}
      </div>
    </header>
  )
}