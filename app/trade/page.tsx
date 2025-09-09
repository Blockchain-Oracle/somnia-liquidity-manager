'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  ArrowUpDown, 
  Settings, 
  Info, 
  TrendingUp, 
  Activity,
  DollarSign,
  Clock,
  ChevronDown,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import * as Tabs from '@radix-ui/react-tabs'

const tokens = [
  { symbol: 'ETH', name: 'Ethereum', balance: '12.456', price: 2234.56 },
  { symbol: 'USDC', name: 'USD Coin', balance: '25,432.10', price: 1.00 },
  { symbol: 'STT', name: 'Somnia Token', balance: '100,000', price: 0.45 },
  { symbol: 'BTC', name: 'Bitcoin', balance: '0.542', price: 43567.89 },
]

const marketData = [
  { label: 'Price', value: '$2,234.56', change: '+2.4%' },
  { label: '24h Volume', value: '$1.2B', change: '+12.3%' },
  { label: 'Liquidity', value: '$342M', change: '+5.7%' },
  { label: 'Market Cap', value: '$268B', change: '+1.8%' },
]

export default function TradePage() {
  const [fromToken, setFromToken] = useState(tokens[0])
  const [toToken, setToToken] = useState(tokens[1])
  const [fromAmount, setFromAmount] = useState('')
  const [toAmount, setToAmount] = useState('')
  const [activeTab, setActiveTab] = useState('swap')

  const handleSwapTokens = () => {
    const temp = fromToken
    setFromToken(toToken)
    setToToken(temp)
    const tempAmount = fromAmount
    setFromAmount(toAmount)
    setToAmount(tempAmount)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Trading Interface */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="glass-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl">Trade</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon">
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
                  <Tabs.List className="grid w-full grid-cols-3 mb-6 p-1 bg-muted/50 rounded-xl">
                    <Tabs.Trigger 
                      value="swap" 
                      className="data-[state=active]:bg-background data-[state=active]:text-foreground rounded-lg py-2 px-4 transition-all"
                    >
                      Swap
                    </Tabs.Trigger>
                    <Tabs.Trigger 
                      value="liquidity" 
                      className="data-[state=active]:bg-background data-[state=active]:text-foreground rounded-lg py-2 px-4 transition-all"
                    >
                      Liquidity
                    </Tabs.Trigger>
                    <Tabs.Trigger 
                      value="limit" 
                      className="data-[state=active]:bg-background data-[state=active]:text-foreground rounded-lg py-2 px-4 transition-all"
                    >
                      Limit
                    </Tabs.Trigger>
                  </Tabs.List>

                  <Tabs.Content value="swap" className="space-y-4">
                    {/* From Token */}
                    <div className="p-4 bg-slate-800/30 rounded-xl border border-border/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">From</span>
                        <span className="text-xs text-muted-foreground">
                          Balance: {fromToken.balance}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <Input
                          type="number"
                          value={fromAmount}
                          onChange={(e) => setFromAmount(e.target.value)}
                          placeholder="0.0"
                          className="bg-transparent border-0 text-3xl font-bold focus:ring-0 p-0"
                        />
                        <Button variant="glass" className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500"></div>
                          {fromToken.symbol}
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground">
                        ≈ ${fromAmount ? (parseFloat(fromAmount) * fromToken.price).toFixed(2) : '0.00'}
                      </div>
                    </div>

                    {/* Swap Button */}
                    <div className="flex justify-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleSwapTokens}
                        className="rounded-full border-2 border-border hover:border-primary transition-colors"
                      >
                        <ArrowUpDown className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* To Token */}
                    <div className="p-4 bg-slate-800/30 rounded-xl border border-border/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">To</span>
                        <span className="text-xs text-muted-foreground">
                          Balance: {toToken.balance}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <Input
                          type="number"
                          value={toAmount}
                          onChange={(e) => setToAmount(e.target.value)}
                          placeholder="0.0"
                          className="bg-transparent border-0 text-3xl font-bold focus:ring-0 p-0"
                        />
                        <Button variant="glass" className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-500 to-red-500"></div>
                          {toToken.symbol}
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground">
                        ≈ ${toAmount ? (parseFloat(toAmount) * toToken.price).toFixed(2) : '0.00'}
                      </div>
                    </div>

                    {/* Trade Info */}
                    <div className="p-4 bg-slate-800/30 rounded-xl border border-border/50 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Rate</span>
                        <span>1 {fromToken.symbol} = {(fromToken.price / toToken.price).toFixed(4)} {toToken.symbol}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Price Impact</span>
                        <span className="text-success">{'<'}0.01%</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Network Fee</span>
                        <span>~$2.34</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Route</span>
                        <span className="flex items-center gap-1">
                          {fromToken.symbol} → {toToken.symbol}
                          <Info className="w-3 h-3 text-muted-foreground" />
                        </span>
                      </div>
                    </div>

                    {/* Swap Button */}
                    <Button className="w-full" size="lg">
                      Swap Tokens
                    </Button>
                  </Tabs.Content>

                  <Tabs.Content value="liquidity" className="space-y-4">
                    <div className="text-center py-8">
                      <h3 className="text-xl font-semibold mb-2">Add Liquidity</h3>
                      <p className="text-muted-foreground mb-4">
                        Provide liquidity to earn fees and rewards
                      </p>
                      <Button>Select Pool</Button>
                    </div>
                  </Tabs.Content>

                  <Tabs.Content value="limit" className="space-y-4">
                    <div className="text-center py-8">
                      <h3 className="text-xl font-semibold mb-2">Limit Orders</h3>
                      <p className="text-muted-foreground mb-4">
                        Set your price and wait for execution
                      </p>
                      <Button>Create Order</Button>
                    </div>
                  </Tabs.Content>
                </Tabs.Root>
              </CardContent>
            </Card>
          </motion.div>

          {/* Chart Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-6"
          >
            <Card className="glass-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Price Chart</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">1H</Button>
                    <Button variant="ghost" size="sm">4H</Button>
                    <Button variant="ghost" size="sm" className="bg-primary/10 text-primary">1D</Button>
                    <Button variant="ghost" size="sm">1W</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Chart will be displayed here</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Side Panel */}
        <div className="space-y-6">
          {/* Market Stats */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg">Market Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {marketData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <div className="text-right">
                      <div className="font-medium">{item.value}</div>
                      <div className={`text-xs ${item.change.startsWith('+') ? 'text-success' : 'text-error'}`}>
                        {item.change}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Transactions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg">Recent Trades</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/10 transition-colors">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${i % 2 === 0 ? 'bg-success' : 'bg-error'}`}></div>
                        <div>
                          <div className="text-sm font-medium">
                            {i % 2 === 0 ? 'Buy' : 'Sell'} ETH
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {5 + i} mins ago
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {(Math.random() * 10).toFixed(3)} ETH
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ${(Math.random() * 20000).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Your Positions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg">Your Positions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No open positions</p>
                  <Button variant="ghost" size="sm" className="mt-4">
                    View History
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}