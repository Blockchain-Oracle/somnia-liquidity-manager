'use client'

import { useState, useEffect } from 'react'
import { useAccount, usePublicClient, useWalletClient } from 'wagmi'
import { parseEther, type Address } from 'viem'
import { toast } from 'sonner'
import NFTLaunchpadABI from '@/artifacts/contracts/NFTLaunchpad.sol/NFTLaunchpad.json'

export interface MintPhase {
  startTime: bigint
  endTime: bigint
  price: bigint
  merkleRoot: string
  maxSupply: bigint
  minted: bigint
  isPublic: boolean
}

export interface MintEligibility {
  canMint: boolean
  maxMintable: number
  price: bigint
  reason: string
}

export function useNFTMint(collectionAddress: Address | undefined) {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  
  const [loading, setLoading] = useState(false)
  const [minting, setMinting] = useState(false)
  const [currentPhase, setCurrentPhase] = useState<MintPhase | null>(null)
  const [eligibility, setEligibility] = useState<MintEligibility | null>(null)
  const [userBalance, setUserBalance] = useState(0)
  
  // Fetch current phase
  const fetchCurrentPhase = async () => {
    if (!collectionAddress || !publicClient) return
    
    try {
      const phase = await publicClient.readContract({
        address: collectionAddress,
        abi: NFTLaunchpadABI.abi,
        functionName: 'getCurrentPhase'
      })
      
      setCurrentPhase(phase as MintPhase)
    } catch (error) {
      console.error('Error fetching phase:', error)
    }
  }
  
  // Check mint eligibility
  const checkEligibility = async () => {
    if (!collectionAddress || !publicClient || !address) return
    
    try {
      const result = await publicClient.readContract({
        address: collectionAddress,
        abi: NFTLaunchpadABI.abi,
        functionName: 'getMintEligibility',
        args: [address]
      })
      
      const [canMint, maxMintable, price, reason] = result as [boolean, bigint, bigint, string]
      
      setEligibility({
        canMint,
        maxMintable: Number(maxMintable),
        price,
        reason
      })
    } catch (error) {
      console.error('Error checking eligibility:', error)
    }
  }
  
  // Get user balance
  const fetchUserBalance = async () => {
    if (!collectionAddress || !publicClient || !address) return
    
    try {
      const balance = await publicClient.readContract({
        address: collectionAddress,
        abi: NFTLaunchpadABI.abi,
        functionName: 'balanceOf',
        args: [address]
      })
      
      setUserBalance(Number(balance))
    } catch (error) {
      console.error('Error fetching balance:', error)
    }
  }
  
  // Mint NFTs
  const mint = async (quantity: number, merkleProof: string[] = []) => {
    if (!collectionAddress || !walletClient || !address || !currentPhase) {
      toast.error('Wallet not connected')
      return
    }
    
    setMinting(true)
    
    try {
      const totalPrice = currentPhase.price * BigInt(quantity)
      
      const hash = await walletClient.writeContract({
        address: collectionAddress,
        abi: NFTLaunchpadABI.abi,
        functionName: 'mint',
        args: [BigInt(quantity), merkleProof],
        value: totalPrice,
        account: address
      })
      
      toast.success('Minting transaction submitted!')
      
      // Wait for confirmation
      if (publicClient) {
        const receipt = await publicClient.waitForTransactionReceipt({ hash })
        
        if (receipt.status === 'success') {
          toast.success(`Successfully minted ${quantity} NFT${quantity > 1 ? 's' : ''}!`)
          
          // Refresh data
          await Promise.all([
            fetchCurrentPhase(),
            checkEligibility(),
            fetchUserBalance()
          ])
        }
      }
    } catch (error: any) {
      console.error('Mint error:', error)
      toast.error(error.message || 'Failed to mint')
    } finally {
      setMinting(false)
    }
  }
  
  // Load all data on mount or when dependencies change
  useEffect(() => {
    const loadData = async () => {
      if (!collectionAddress || !publicClient) return
      
      setLoading(true)
      
      await Promise.all([
        fetchCurrentPhase(),
        checkEligibility(),
        fetchUserBalance()
      ])
      
      setLoading(false)
    }
    
    loadData()
  }, [collectionAddress, publicClient, address])
  
  return {
    loading,
    minting,
    currentPhase,
    eligibility,
    userBalance,
    mint,
    refresh: async () => {
      await Promise.all([
        fetchCurrentPhase(),
        checkEligibility(),
        fetchUserBalance()
      ])
    }
  }
}