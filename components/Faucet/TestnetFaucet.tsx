'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useNetwork } from '@/lib/hooks/useNetwork'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { Droplets, Loader2, CheckCircle, AlertCircle, ExternalLink, Coins, X } from 'lucide-react'
import { TOKEN_IMAGES } from '@/lib/constants/tokenImages'
import { TESTNET_CONTRACTS, MOCK_ERC20_ABI, isTestnetDeployed } from '@/lib/constants/contracts'
import { toast } from 'sonner'

interface FaucetToken {
  symbol: string
  name: string
  address: string
  amount: string
}

// Get testnet tokens from deployed contracts
const TESTNET_TOKENS: FaucetToken[] = [
  {
    symbol: 'WSTT',
    name: 'Wrapped STT',
    address: TESTNET_CONTRACTS.tokens.WSTT || '',
    amount: '1000 WSTT'
  },
  {
    symbol: 'tWETH',
    name: 'Test Wrapped Ether',
    address: TESTNET_CONTRACTS.tokens.tWETH || '',
    amount: '1000 tWETH'
  },
  {
    symbol: 'tUSDC',
    name: 'Test USD Coin',
    address: TESTNET_CONTRACTS.tokens.tUSDC || '',
    amount: '10000 tUSDC'
  },
  {
    symbol: 'tUSDT',
    name: 'Test Tether USD',
    address: TESTNET_CONTRACTS.tokens.tUSDT || '',
    amount: '10000 tUSDT'
  }
]

export function TestnetFaucet() {
  const { isTestnet, faucetUrl } = useNetwork()
  const { isConnected, address } = useAccount()
  const [selectedToken, setSelectedToken] = useState<FaucetToken | null>(null)
  const [claimedTokens, setClaimedTokens] = useState<Set<string>>(new Set())
  const [isVisible, setIsVisible] = useState(true)
  
  // Check if user has dismissed the faucet for this session
  useEffect(() => {
    const dismissed = sessionStorage.getItem('faucet-dismissed')
    if (dismissed === 'true') {
      setIsVisible(false)
    }
  }, [])
  
  const { 
    writeContract, 
    data: txHash,
    isPending: isWriting,
    isError: writeError 
  } = useWriteContract()
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  })
  
  // Effect for handling successful claims
  React.useEffect(() => {
    if (isSuccess && selectedToken) {
      setClaimedTokens(prev => new Set([...prev, selectedToken.symbol]))
      toast.success(`Successfully claimed ${selectedToken.amount}!`)
      setSelectedToken(null)
    }
  }, [isSuccess, selectedToken])

  // Only show on testnet and if not dismissed
  if (!isTestnet || !isVisible) {
    return null
  }
  
  const handleClose = () => {
    setIsVisible(false)
    sessionStorage.setItem('faucet-dismissed', 'true')
  }

  const handleClaim = async (token: FaucetToken) => {
    if (!token.address) {
      toast.error('Token contract not deployed yet. Please run deployment script.')
      return
    }

    setSelectedToken(token)
    
    try {
      await writeContract({
        address: token.address as `0x${string}`,
        abi: MOCK_ERC20_ABI,
        functionName: 'faucet',
      })
      
      // Add to claimed tokens after successful tx
      if (isSuccess) {
        setClaimedTokens(prev => new Set([...prev, token.symbol]))
        toast.success(`Successfully claimed ${token.amount}!`)
      }
    } catch (error) {
      console.error('Faucet error:', error)
      toast.error('Failed to claim tokens')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <Card className="glass-card border-warning/20 bg-warning/5 relative">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1 hover:bg-white/10 rounded-lg transition-colors"
          aria-label="Close faucet"
        >
          <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
        </button>
        
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/20 rounded-xl">
                <Droplets className="w-5 h-5 text-warning" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Testnet Faucet</h3>
                <p className="text-sm text-muted-foreground">
                  Get free test tokens for trading
                </p>
              </div>
            </div>
            
            {/* STT Faucet Link */}
            {faucetUrl && (
              <a
                href={faucetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors text-sm mr-8"
              >
                Get STT
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {/* Warning Message */}
          <div className="flex items-start gap-2 p-3 bg-warning/10 border border-warning/20 rounded-lg mb-4">
            <AlertCircle className="w-4 h-4 text-warning mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-warning">Testnet Only</p>
              <p className="text-muted-foreground">
                These tokens have no real value and are for testing purposes only.
              </p>
            </div>
          </div>

          {/* Token List */}
          {!isConnected ? (
            <div className="text-center py-8 text-muted-foreground">
              Connect your wallet to claim test tokens
            </div>
          ) : (
            <div className="space-y-3">
              {TESTNET_TOKENS.map((token) => {
                const tokenInfo = TOKEN_IMAGES[token.symbol]
                const isClaimed = claimedTokens.has(token.symbol)
                const isLoading = selectedToken?.symbol === token.symbol && (isWriting || isConfirming)
                
                return (
                  <motion.div
                    key={token.symbol}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center justify-between p-4 bg-background/50 hover:bg-background/70 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {tokenInfo && (
                        <img 
                          src={tokenInfo.image} 
                          alt={token.symbol}
                          className="w-8 h-8 rounded-full"
                        />
                      )}
                      <div>
                        <div className="font-medium">{token.symbol}</div>
                        <div className="text-sm text-muted-foreground">{token.name}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm font-medium text-primary">
                          {token.amount}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          per claim
                        </div>
                      </div>
                      
                      <Button
                        size="sm"
                        onClick={() => handleClaim(token)}
                        disabled={!token.address || isLoading || isClaimed}
                        className="min-w-[100px]"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            Claiming...
                          </>
                        ) : isClaimed ? (
                          <>
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Claimed
                          </>
                        ) : (
                          <>
                            <Coins className="w-4 h-4 mr-1" />
                            Claim
                          </>
                        )}
                      </Button>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}

          {/* Instructions */}
          <div className="mt-4 pt-4 border-t border-border/50">
            <p className="text-xs text-muted-foreground">
              Each token can be claimed once per transaction. You can claim multiple times if you need more tokens.
              Native STT for gas fees: use the external faucet link above.
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}