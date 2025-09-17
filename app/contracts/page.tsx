'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Copy, ExternalLink, Code, Layers, Shield, Sparkles, Network, Zap, Database, Globe, Cpu, Check, ChevronDown, Search, GitBranch } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

// Network configurations
const NETWORKS = {
  mainnet: {
    name: 'Somnia Mainnet',
    chainId: 50311,
    explorer: 'https://explorer.somnia.network',
    rpc: 'https://dream-rpc.somnia.network',
    symbol: 'SOMI',
    gradient: 'from-purple-600 to-blue-600',
    glow: 'purple',
  },
  testnet: {
    name: 'Somnia Testnet',
    chainId: 50312,
    explorer: 'https://shannon-explorer.somnia.network',
    rpc: 'https://testnet.somnia.network',
    symbol: 'STT',
    gradient: 'from-cyan-600 to-teal-600',
    glow: 'cyan',
  }
}

// Contract categories with all addresses
const CONTRACT_DATA = {
  mainnet: {
    'Core Tokens': {
      icon: Sparkles,
      color: 'text-yellow-400',
      contracts: {
        'SOMI Token (OFT)': '0xC3D4E9Ac47D7f37bB07C2f8355Bb4940DEA3bbC3',
        'Wrapped SOMI': '0x046EDe9564A72571df6F5e44d0405360c0f4dCab',
        'Wrapped ETH': '0x936Ab8C674bcb567CD5dEB85D8A216494704E9D8',
        'USDC': '0x28BEc7E30E6faee657a03e19Bf1128AaD7632A00',
        'USDT': '0x67B302E35Aef5EEE8c32D934F5856869EF428330',
      }
    },
    'QuickSwap Algebra V4': {
      icon: Zap,
      color: 'text-purple-400',
      contracts: {
        'Algebra Factory': '0x0ccff3D02A3a200263eC4e0Fdb5E60a56721B8Ae',
        'Pool Deployer': '0x0361B4883FfD676BB0a4642B3139D38A33e452f5',
        'Swap Router': '0x1582f6f3D26658F7208A799Be46e34b1f366CE44',
        'Position Manager': '0xfE02219e0578B1E4831CDE7C3CB36f71AEb4A833',
        'Quoter V1': '0xd86C6620300f59f3C6566b3Fb9269674fd5c5264',
        'Quoter V2': '0xcB68373404a835268D3ED76255C8148578A82b77',
        'Tick Lens': '0xc868a65f702E1d55CDD2F426DCF97D29A2dA90B9',
        'Interface Multicall': '0x5793c5bA2E1821a817336DAd9bf8bfC9406d3045',
      }
    },
    'Farming & Vaults': {
      icon: Database,
      color: 'text-green-400',
      contracts: {
        'Eternal Farming': '0xFd4D18867d21cD0b0db5918cEf1a3fea55D7D317',
        'Farming Center': '0xEf181Ea0d1223CFEe104439213AF3F1Be6788850',
        'Community Vault': '0xBC8e2d40B90F27Fd9d54005bb38A2770fe9180eF',
        'Vault Factory': '0xE7Fe2F9B4fbfebB1A5f1f44857425A3f2598599C',
        'Plugin Factory': '0x57Fd247Ce7922067710452923806F52F4b1c2D34',
      }
    },
    'LayerZero Bridge': {
      icon: Globe,
      color: 'text-blue-400',
      contracts: {
        'LZ Endpoint': '0x6F475642a6e85809B1c36Fa62763669b1b48DD5B',
        'Send ULN302': '0xC39161c743D0307EB9BCc9FEF03eeb9Dc4802de7',
        'Receive ULN302': '0xe1844c5D63a9543023008D332Bd3d2e6f1FE1043',
        'LZ Executor': '0x4208D6E27538189bB48E603D6123A94b8Abe0A0b',
      }
    },
    'DIA Oracle': {
      icon: Cpu,
      color: 'text-orange-400',
      contracts: {
        'Price Oracle': '0xbA0E0750A56e995506CA458b2BdD752754CF39C4',
        'Gas Wallet': '0x3073d2E61ecb6E4BF4273Af83d53eDAE099ea04a',
      }
    },
    'System Contracts': {
      icon: Shield,
      color: 'text-red-400',
      contracts: {
        'Multicall': '0x5e44F178E8cF9B2F5409B6f18ce936aB817C5a11',
        'Entry Point': '0x69cfa238cDD06F4519d70e78272D880646c51F95',
        'NFT Descriptor': '0xfa49223107Ad26c7a91957f2c5b239bC5d02C153',
        'Proxy': '0xD4ba86fbf231ecBc99d99Cd74C998C5f73d4D641',
      }
    },
    'Stargate Bridge Tokens': {
      icon: GitBranch,
      color: 'text-indigo-400',
      contracts: {
        'SOMI on Ethereum': '0x1B0F6590d21dc02B92ad3A7D00F8884dC4f1aed9',
        'SOMI on BNB Chain': '0xa9616e5e23ec1582c2828b025becf3ef610e266f',
        'SOMI on Base': '0x47636b3188774a3E7273D85A537b9bA4Ee7b2535',
      }
    }
  },
  testnet: {
    'Test Tokens': {
      icon: Sparkles,
      color: 'text-yellow-400',
      contracts: {
        'Wrapped STT': '0x001Da752ACD5e96077Ac5Cd757dC9ebAd109210A',
        'Test WETH': '0x4DfB21D6419dc430F5D5F901B0E699ff2BaD9Ac1',
        'Test USDC': '0xbb9474aA3a654DDA7Ff09A94a9Bd7C7095E62732',
        'Test USDT': '0x0EC9D4B712F16F5054c2CE9Da5c5FEbf360AE149',
      }
    },
    'Liquidity Pools': {
      icon: Network,
      color: 'text-blue-400',
      contracts: {
        'WSTT/tWETH Pool': '0xd0BC69A4A4599b561c944f4F0263f498F396e4BD',
        'WSTT/tUSDC Pool': '0x735901b22d167e2FA38F97E95886754CAe925CEF',
        'WSTT/tUSDT Pool': '0xeCa49817EeDDCE89A6e0b978d46B51c4d8A8f611',
        'tWETH/tUSDC Pool': '0xa55B7A74D05b5D5C48E431e44Fea83a1047A7582',
        'tWETH/tUSDT Pool': '0x0247FFDb658563f019eE256226f6B82e9Ae79000',
        'tUSDC/tUSDT Pool': '0xD0dAFd63d42cae8220089fbC3c541c4F09740bCb',
      }
    },
    'NFT Marketplace': {
      icon: Layers,
      color: 'text-purple-400',
      contracts: {
        'NFT Factory': '0x4bc9106160414c2579F5b7eac06976D9E65730D9',
        'NFT Implementation': '0xe494Fd4B0A34c2824F09BC01a8Ae3bA50F52b922',
        'NFT Marketplace': '0xF308d971F3dbCd32135Cd3e823603aeE010A6b53',
      }
    },
    'QuickSwap Core': {
      icon: Zap,
      color: 'text-green-400',
      contracts: {
        'Factory': '0x0ccff3D02A3a200263eC4e0Fdb5E60a56721B8Ae',
        'Router': '0x1582f6f3D26658F7208A799Be46e34b1f366CE44',
        'Position Manager': '0xfE02219e0578B1E4831CDE7C3CB36f71AEb4A833',
        'Quoter': '0x0524E833cCD057e4d7A296e3aaAb9f7675964Ce1',
        'Multicall': '0x5e44F178E8cF9B2F5409B6f18ce936aB817C5a11',
      }
    }
  }
}

// Animated background particles
const FloatingParticle = ({ delay = 0 }) => {
  const getRandomPosition = () => {
    if (typeof window !== 'undefined') {
      return {
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
      }
    }
    // Fallback values for SSR
    return {
      x: Math.random() * 1920,
      y: Math.random() * 1080,
    }
  }

  const initial = getRandomPosition()
  const animate = getRandomPosition()

  return (
    <motion.div
      className="absolute w-1 h-1 bg-purple-400/20 rounded-full"
      initial={initial}
      animate={animate}
      transition={{
        duration: 20 + Math.random() * 10,
        delay,
        repeat: Infinity,
        ease: "linear",
      }}
    />
  )
}

export default function ContractsPage() {
  const [network, setNetwork] = useState<'mainnet' | 'testnet'>('mainnet')
  const [searchTerm, setSearchTerm] = useState('')
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  const handleCopy = (address: string, name: string) => {
    navigator.clipboard.writeText(address)
    setCopiedAddress(address)
    toast.success(`Copied ${name} address`)
    setTimeout(() => setCopiedAddress(null), 2000)
  }

  const filteredCategories = Object.entries(CONTRACT_DATA[network]).filter(([category, data]) => {
    if (!searchTerm) return true
    const categoryMatch = category.toLowerCase().includes(searchTerm.toLowerCase())
    const contractMatch = Object.entries(data.contracts).some(
      ([name, address]) => 
        name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        address.toLowerCase().includes(searchTerm.toLowerCase())
    )
    return categoryMatch || contractMatch
  })

  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20" />
        {[...Array(20)].map((_, i) => (
          <FloatingParticle key={i} delay={i * 0.5} />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-3 sm:px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              Somnia Contract Registry
            </span>
          </h1>
          <p className="text-gray-400 text-sm sm:text-base max-w-2xl mx-auto">
            Explore all deployed smart contracts on Somnia blockchain. Click any address to view on explorer.
          </p>
        </motion.div>

        {/* Network Switcher */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8"
        >
          <div className="flex bg-gray-900/50 backdrop-blur-xl rounded-full p-1 border border-gray-700">
            {Object.entries(NETWORKS).map(([key, net]) => (
              <button
                key={key}
                onClick={() => setNetwork(key as 'mainnet' | 'testnet')}
                className={cn(
                  "px-4 sm:px-6 py-2 rounded-full font-medium transition-all text-sm sm:text-base",
                  network === key 
                    ? `bg-gradient-to-r ${net.gradient} text-white` 
                    : 'text-gray-400 hover:text-white'
                )}
              >
                <div className="flex items-center gap-2">
                  <Network className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>{net.name}</span>
                  <span className="text-xs opacity-70">({net.chainId})</span>
                </div>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-md mx-auto mb-8"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search contracts or addresses..."
              className="pl-10 bg-gray-900/50 backdrop-blur-xl border-gray-700 text-white"
            />
          </div>
        </motion.div>

        {/* Network Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8"
        >
          <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-xl rounded-xl p-4 border border-gray-700/50">
            <p className="text-xs text-gray-400 mb-1">Network</p>
            <p className="text-white font-medium">{NETWORKS[network].name}</p>
          </div>
          <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-xl rounded-xl p-4 border border-gray-700/50">
            <p className="text-xs text-gray-400 mb-1">Chain ID</p>
            <p className="text-white font-medium">{NETWORKS[network].chainId}</p>
          </div>
          <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-xl rounded-xl p-4 border border-gray-700/50">
            <p className="text-xs text-gray-400 mb-1">Symbol</p>
            <p className="text-white font-medium">{NETWORKS[network].symbol}</p>
          </div>
          <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-xl rounded-xl p-4 border border-gray-700/50">
            <p className="text-xs text-gray-400 mb-1">RPC</p>
            <a 
              href={NETWORKS[network].rpc} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-purple-400 hover:text-purple-300 text-xs break-all"
            >
              {NETWORKS[network].rpc}
            </a>
          </div>
        </motion.div>

        {/* Contract Categories */}
        <div className="grid gap-4">
          <AnimatePresence mode="wait">
            {filteredCategories.map(([category, data], index) => {
              const Icon = data.icon
              const isExpanded = expandedCategory === category || searchTerm !== ''
              
              return (
                <motion.div
                  key={`${network}-${category}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-700/50 overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedCategory(isExpanded ? null : category)}
                    className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={cn("w-5 h-5", data.color)} />
                      <h2 className="text-lg font-semibold text-white">{category}</h2>
                      <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded-full">
                        {Object.keys(data.contracts).length} contracts
                      </span>
                    </div>
                    <ChevronDown 
                      className={cn(
                        "w-5 h-5 text-gray-400 transition-transform",
                        isExpanded && "rotate-180"
                      )}
                    />
                  </button>
                  
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 pt-0 space-y-2">
                          {Object.entries(data.contracts).map(([name, address]) => (
                            <motion.div
                              key={address}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 bg-black/30 rounded-lg hover:bg-black/50 transition-colors"
                            >
                              <div className="flex-1">
                                <p className="text-white font-medium text-sm sm:text-base">{name}</p>
                                <code className="text-xs text-gray-400 break-all">{address}</code>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleCopy(address, name)}
                                  className="text-gray-400 hover:text-white"
                                >
                                  {copiedAddress === address ? (
                                    <Check className="w-4 h-4 text-green-400" />
                                  ) : (
                                    <Copy className="w-4 h-4" />
                                  )}
                                </Button>
                                <a
                                  href={`${NETWORKS[network].explorer}/address/${address}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-gray-400 hover:text-purple-400 transition-colors"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

        {/* Explorer Links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <p className="text-gray-400 mb-4">Quick Links</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href={NETWORKS[network].explorer}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-500 hover:to-blue-500 transition-all flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Block Explorer
            </a>
            <a
              href="https://docs.somnia.network"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-all flex items-center gap-2"
            >
              <Code className="w-4 h-4" />
              Documentation
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  )
}