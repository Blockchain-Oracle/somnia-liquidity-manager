'use client'

import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Globe, Shield, Zap, Info, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function StargateWidget() {
  // For now, use the Stargate app directly via iframe or link
  // The official widget package has compatibility issues with React 19

  // Configuration for Somnia network
  const widgetConfig = {
    srcChains: ['ethereum', 'bnb', 'base', 'somnia'],
    dstChains: ['ethereum', 'bnb', 'base', 'somnia'],
    tokens: ['USDC', 'USDT', 'ETH'],
  }

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
          <Globe className="w-8 h-8 text-primary" />
          Cross-Chain Bridge
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Transfer tokens seamlessly between Somnia and other chains using Stargate's unified liquidity pools
        </p>
      </motion.div>

      {/* Main Widget Card */}
      <Card className="glass-card max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Stargate Bridge</CardTitle>
            <div className="flex items-center gap-2 text-sm">
              <Shield className="w-4 h-4 text-success" />
              <span className="text-success">Secured by LayerZero</span>
            </div>
          </div>
          <CardDescription>
            Fast, secure cross-chain transfers with deep liquidity
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Bridge Interface */}
          <div className="p-8 text-center space-y-6">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-primary to-primary/50 rounded-full flex items-center justify-center">
              <Globe className="w-12 h-12 text-white" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Stargate Bridge</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Bridge your assets between Somnia and other supported chains using Stargate's unified liquidity pools.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a 
                href="https://stargate.finance/bridge" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button size="lg" className="min-w-[200px]">
                  Open Stargate Bridge
                  <ExternalLink className="ml-2 w-4 h-4" />
                </Button>
              </a>
              <a 
                href="https://docs.stargate.finance" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="lg" className="min-w-[200px]">
                  View Documentation
                  <ExternalLink className="ml-2 w-4 h-4" />
                </Button>
              </a>
            </div>

            <div className="mt-6 p-4 bg-slate-800/30 rounded-xl">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> When using Stargate, select Somnia as your source or destination chain.
                Supported tokens include USDC, USDT, and WETH.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Cards */}
      <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Instant Finality</h3>
                <p className="text-sm text-muted-foreground">
                  Bridge assets in minutes with guaranteed finality
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-success/20 rounded-lg">
                <Shield className="w-5 h-5 text-success" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">$65B+ Secured</h3>
                <p className="text-sm text-muted-foreground">
                  Battle-tested protocol with billions in volume
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-warning/20 rounded-lg">
                <Globe className="w-5 h-5 text-warning" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">80+ Chains</h3>
                <p className="text-sm text-muted-foreground">
                  Access liquidity across the entire omnichain ecosystem
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Section */}
      <Card className="glass-card max-w-4xl mx-auto">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-primary mt-0.5" />
            <div className="space-y-3">
              <h3 className="font-semibold">Supported Assets on Somnia</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium mb-2">Stablecoins</p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• USDC - USD Coin</li>
                    <li>• USDT - Tether USD</li>
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Native Assets</p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• ETH/WETH - Ethereum</li>
                    <li>• SOMI - Somnia (via LayerZero OFT)</li>
                  </ul>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Bridge fees are automatically calculated based on the route and current network conditions.
                Typical transfers complete in 1-3 minutes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}