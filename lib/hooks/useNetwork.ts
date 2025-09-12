'use client'

import { useChainId } from 'wagmi'
import { somniaMainnet, somniaTestnet } from '@/lib/chains/somnia'

export function useNetwork() {
  const chainId = useChainId()
  
  const isTestnet = chainId === somniaTestnet.id
  const isMainnet = chainId === somniaMainnet.id
  const isSomnia = isTestnet || isMainnet
  
  return {
    chainId,
    isTestnet,
    isMainnet,
    isSomnia,
    networkName: isTestnet ? 'Somnia Testnet' : isMainnet ? 'Somnia' : 'Unknown Network',
    nativeToken: isTestnet ? 'STT' : 'SOMI',
    explorerUrl: isTestnet 
      ? 'https://shannon-explorer.somnia.network'
      : 'https://explorer.somnia.network',
    faucetUrl: isTestnet ? 'https://somnia.faucetme.pro/' : null,
  }
}

// Helper to get RPC URL based on network
export function getRpcUrl(isTestnet: boolean): string {
  return isTestnet 
    ? 'https://dream-rpc.somnia.network'
    : 'https://api.infra.mainnet.somnia.network'
}

// Helper to check if we're on a supported network
export function isSupportedNetwork(chainId: number): boolean {
  return chainId === somniaMainnet.id || chainId === somniaTestnet.id
}