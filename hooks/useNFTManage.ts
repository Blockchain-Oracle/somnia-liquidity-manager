'use client'

import { useState } from 'react'
import { useAccount, usePublicClient, useWalletClient } from 'wagmi'
import { parseEther, type Address } from 'viem'
import { toast } from 'sonner'
import NFTLaunchpadABI from '@/artifacts/contracts/NFTLaunchpad.sol/NFTLaunchpad.json'

export interface MintPhaseConfig {
  phaseId: number
  startTime: string
  endTime: string
  price: string
  merkleRoot?: string
  maxSupply: number
  isPublic: boolean
}

export function useNFTManage(collectionAddress: Address | undefined) {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  
  const [loading, setLoading] = useState(false)
  
  // Configure mint phase
  const configurePhase = async (config: MintPhaseConfig) => {
    if (!collectionAddress || !walletClient || !address) {
      toast.error('Wallet not connected')
      return
    }
    
    setLoading(true)
    
    try {
      const phase = {
        startTime: BigInt(Math.floor(new Date(config.startTime).getTime() / 1000)),
        endTime: BigInt(Math.floor(new Date(config.endTime).getTime() / 1000)),
        price: parseEther(config.price),
        merkleRoot: config.merkleRoot || '0x0000000000000000000000000000000000000000000000000000000000000000',
        maxSupply: BigInt(config.maxSupply),
        minted: BigInt(0),
        isPublic: config.isPublic
      }
      
      const hash = await walletClient.writeContract({
        address: collectionAddress,
        abi: NFTLaunchpadABI.abi,
        functionName: 'configurePhase',
        args: [config.phaseId, phase],
        account: address
      })
      
      toast.success('Phase configuration submitted!')
      
      if (publicClient) {
        const receipt = await publicClient.waitForTransactionReceipt({ hash })
        
        if (receipt.status === 'success') {
          toast.success('Phase configured successfully!')
        }
      }
    } catch (error: any) {
      console.error('Configure phase error:', error)
      toast.error(error.message || 'Failed to configure phase')
    } finally {
      setLoading(false)
    }
  }
  
  // Start a phase
  const startPhase = async (phaseId: number) => {
    if (!collectionAddress || !walletClient || !address) {
      toast.error('Wallet not connected')
      return
    }
    
    setLoading(true)
    
    try {
      const hash = await walletClient.writeContract({
        address: collectionAddress,
        abi: NFTLaunchpadABI.abi,
        functionName: 'startPhase',
        args: [phaseId],
        account: address
      })
      
      toast.success('Phase start submitted!')
      
      if (publicClient) {
        const receipt = await publicClient.waitForTransactionReceipt({ hash })
        
        if (receipt.status === 'success') {
          toast.success(`Phase ${phaseId} started!`)
        }
      }
    } catch (error: any) {
      console.error('Start phase error:', error)
      toast.error(error.message || 'Failed to start phase')
    } finally {
      setLoading(false)
    }
  }
  
  // Reveal collection
  const reveal = async (baseURI: string) => {
    if (!collectionAddress || !walletClient || !address) {
      toast.error('Wallet not connected')
      return
    }
    
    setLoading(true)
    
    try {
      const hash = await walletClient.writeContract({
        address: collectionAddress,
        abi: NFTLaunchpadABI.abi,
        functionName: 'reveal',
        args: [baseURI],
        account: address
      })
      
      toast.success('Reveal transaction submitted!')
      
      if (publicClient) {
        const receipt = await publicClient.waitForTransactionReceipt({ hash })
        
        if (receipt.status === 'success') {
          toast.success('Collection revealed!')
        }
      }
    } catch (error: any) {
      console.error('Reveal error:', error)
      toast.error(error.message || 'Failed to reveal')
    } finally {
      setLoading(false)
    }
  }
  
  // Toggle pause
  const setPaused = async (paused: boolean) => {
    if (!collectionAddress || !walletClient || !address) {
      toast.error('Wallet not connected')
      return
    }
    
    setLoading(true)
    
    try {
      const hash = await walletClient.writeContract({
        address: collectionAddress,
        abi: NFTLaunchpadABI.abi,
        functionName: 'setPaused',
        args: [paused],
        account: address
      })
      
      toast.success(`${paused ? 'Pause' : 'Unpause'} transaction submitted!`)
      
      if (publicClient) {
        const receipt = await publicClient.waitForTransactionReceipt({ hash })
        
        if (receipt.status === 'success') {
          toast.success(`Collection ${paused ? 'paused' : 'unpaused'}!`)
        }
      }
    } catch (error: any) {
      console.error('Set paused error:', error)
      toast.error(error.message || 'Failed to update pause state')
    } finally {
      setLoading(false)
    }
  }
  
  // Withdraw funds
  const withdraw = async () => {
    if (!collectionAddress || !walletClient || !address) {
      toast.error('Wallet not connected')
      return
    }
    
    setLoading(true)
    
    try {
      const hash = await walletClient.writeContract({
        address: collectionAddress,
        abi: NFTLaunchpadABI.abi,
        functionName: 'withdraw',
        args: [],
        account: address
      })
      
      toast.success('Withdraw transaction submitted!')
      
      if (publicClient) {
        const receipt = await publicClient.waitForTransactionReceipt({ hash })
        
        if (receipt.status === 'success') {
          toast.success('Funds withdrawn successfully!')
        }
      }
    } catch (error: any) {
      console.error('Withdraw error:', error)
      toast.error(error.message || 'Failed to withdraw')
    } finally {
      setLoading(false)
    }
  }
  
  // Set contract URI
  const setContractURI = async (uri: string) => {
    if (!collectionAddress || !walletClient || !address) {
      toast.error('Wallet not connected')
      return
    }
    
    setLoading(true)
    
    try {
      const hash = await walletClient.writeContract({
        address: collectionAddress,
        abi: NFTLaunchpadABI.abi,
        functionName: 'setContractURI',
        args: [uri],
        account: address
      })
      
      toast.success('Contract URI update submitted!')
      
      if (publicClient) {
        const receipt = await publicClient.waitForTransactionReceipt({ hash })
        
        if (receipt.status === 'success') {
          toast.success('Contract URI updated!')
        }
      }
    } catch (error: any) {
      console.error('Set contract URI error:', error)
      toast.error(error.message || 'Failed to update contract URI')
    } finally {
      setLoading(false)
    }
  }
  
  return {
    loading,
    configurePhase,
    startPhase,
    reveal,
    setPaused,
    withdraw,
    setContractURI
  }
}