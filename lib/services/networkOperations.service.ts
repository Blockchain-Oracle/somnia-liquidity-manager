/**
 * Network Operations Service
 * Forces testnet operations for most functions, with mainnet swap only
 */

import { getRpcUrl } from '@/lib/hooks/useNetwork'
import { TESTNET_CONFIG, MAINNET_CONFIG } from '@/lib/config/networks.config'
import { somniaTestnet, somniaMainnet } from '@/lib/chains/somnia'

export interface OperationConfig {
  chainId: number
  rpcUrl: string
  contracts: any
  tokens: any
  isTestnet: boolean
  forceTestnet: boolean
}

/**
 * Get operation configuration based on the operation type and current network
 * @param operation Type of operation: 'transfer' | 'bridge' | 'balance' | 'swap' | 'liquidity'
 * @param currentChainId Current chain ID from wallet
 * @returns Configuration for the operation
 */
export function getOperationConfig(
  operation: 'transfer' | 'bridge' | 'balance' | 'swap' | 'liquidity' | 'tokens',
  currentChainId?: number
): OperationConfig {
  const isMainnet = currentChainId === somniaMainnet.id
  const isTestnet = currentChainId === somniaTestnet.id

  // Bridge operations use mainnet only
  if (operation === 'bridge' && (isMainnet || currentChainId === undefined)) {
    return {
      chainId: somniaMainnet.id,
      rpcUrl: MAINNET_CONFIG.rpcUrl,
      contracts: MAINNET_CONFIG.contracts,
      tokens: MAINNET_CONFIG.contracts.tokens,
      isTestnet: false,
      forceTestnet: false
    }
  }

  // Swap can use either mainnet or testnet
  if (operation === 'swap') {
    if (isMainnet) {
      return {
        chainId: somniaMainnet.id,
        rpcUrl: MAINNET_CONFIG.rpcUrl,
        contracts: MAINNET_CONFIG.contracts,
        tokens: MAINNET_CONFIG.contracts.tokens,
        isTestnet: false,
        forceTestnet: false
      }
    }
    // Swap on testnet
    return {
      chainId: somniaTestnet.id,
      rpcUrl: TESTNET_CONFIG.rpcUrl,
      contracts: TESTNET_CONFIG.contracts,
      tokens: TESTNET_CONFIG.contracts.tokens,
      isTestnet: true,
      forceTestnet: false
    }
  }

  // All other operations (transfer, balance, liquidity, tokens, NFT) use testnet only
  return {
    chainId: somniaTestnet.id,
    rpcUrl: TESTNET_CONFIG.rpcUrl,
    contracts: TESTNET_CONFIG.contracts,
    tokens: TESTNET_CONFIG.contracts.tokens,
    isTestnet: true,
    forceTestnet: !isTestnet // If user is on mainnet but we're forcing testnet
  }
}

/**
 * Get the appropriate network name for display
 */
export function getOperationNetworkName(
  operation: 'transfer' | 'bridge' | 'balance' | 'swap' | 'liquidity' | 'tokens',
  currentChainId?: number
): string {
  const config = getOperationConfig(operation, currentChainId)
  
  if (config.forceTestnet) {
    return 'Somnia Testnet (Demo Mode)'
  }
  
  return config.isTestnet ? 'Somnia Testnet' : 'Somnia Mainnet'
}

/**
 * Check if user needs to switch network for an operation
 */
export function needsNetworkSwitch(
  operation: 'transfer' | 'bridge' | 'balance' | 'swap' | 'liquidity' | 'tokens',
  currentChainId?: number
): boolean {
  // Bridge needs mainnet
  if (operation === 'bridge') {
    return currentChainId !== somniaMainnet.id
  }
  
  // Swap works on both
  if (operation === 'swap') {
    return currentChainId !== somniaMainnet.id && currentChainId !== somniaTestnet.id
  }
  
  // All other operations need testnet
  return currentChainId !== somniaTestnet.id
}

/**
 * Get warning message for operations
 */
export function getOperationWarning(
  operation: 'transfer' | 'bridge' | 'balance' | 'swap' | 'liquidity' | 'tokens',
  currentChainId?: number
): string | null {
  const isMainnet = currentChainId === somniaMainnet.id
  const isTestnet = currentChainId === somniaTestnet.id
  
  // Bridge requires mainnet
  if (operation === 'bridge') {
    if (!isMainnet) {
      return '⚠️ Bridge requires Somnia Mainnet. Please switch networks.'
    }
    return null
  }
  
  // Swap works on both
  if (operation === 'swap') {
    if (!isMainnet && !isTestnet) {
      return '⚠️ Please connect to Somnia network to use swap.'
    }
    return null
  }
  
  // All other operations require testnet
  if (!isTestnet) {
    if (isMainnet) {
      return '⚠️ This operation is only available on testnet. Your mainnet funds are not affected.'
    }
    return '⚠️ Please connect to Somnia Testnet to use this feature.'
  }
  
  return null
}

/**
 * Get testnet token addresses for operations
 */
export function getTestnetTokens() {
  return {
    WSOMI: TESTNET_CONFIG.contracts.tokens.WSOMI || '0x001Da752ACD5e96077Ac5Cd757dC9ebAd109210A',
    USDC: TESTNET_CONFIG.contracts.tokens.USDC || '0xb81713B44ef5F68eF921A8637FabC025e63B3523',
    USDT: TESTNET_CONFIG.contracts.tokens.USDT,
    WETH: TESTNET_CONFIG.contracts.tokens.WETH,
    STT: 'native', // Testnet native token
  }
}

/**
 * Get mainnet token addresses for swap only
 */
export function getMainnetTokens() {
  return {
    WSOMI: MAINNET_CONFIG.contracts.tokens.WSOMI || '0x046EDe9564A72571df6F5e44d0405360c0f4dCab',
    USDC: MAINNET_CONFIG.contracts.tokens.USDC || '0x28BEc7E30E6faee657a03e19Bf1128AaD7632A00',
    USDT: MAINNET_CONFIG.contracts.tokens.USDT || '0xc45AfEE99178ED378a3E5F8b3B60977b3f1e8758',
    WETH: MAINNET_CONFIG.contracts.tokens.WETH || '0xB9164670A2F388D835B868b3D0D441fa1bE5bb00',
    SOMI: 'native', // Mainnet native token
  }
}

/**
 * Get appropriate tokens based on operation
 */
export function getOperationTokens(
  operation: 'transfer' | 'bridge' | 'balance' | 'swap' | 'liquidity' | 'tokens',
  currentChainId?: number
) {
  const config = getOperationConfig(operation, currentChainId)
  return config.isTestnet ? getTestnetTokens() : getMainnetTokens()
}

/**
 * Get testnet faucet URL
 */
export function getFaucetUrl(): string {
  return TESTNET_CONFIG.faucetUrl || 'https://somnia.faucetme.pro/'
}

/**
 * Check if operation is available on current network
 */
export function isOperationAvailable(
  operation: 'transfer' | 'bridge' | 'balance' | 'swap' | 'liquidity' | 'tokens',
  currentChainId?: number
): boolean {
  // Bridge requires mainnet
  if (operation === 'bridge') {
    return currentChainId === somniaMainnet.id
  }
  
  // Swap works on both mainnet and testnet
  if (operation === 'swap') {
    return currentChainId === somniaMainnet.id || currentChainId === somniaTestnet.id
  }
  
  // All other operations need testnet
  return currentChainId === somniaTestnet.id
}

/**
 * Get RPC URL for operation
 */
export function getOperationRpcUrl(
  operation: 'transfer' | 'bridge' | 'balance' | 'swap' | 'liquidity' | 'tokens',
  currentChainId?: number
): string {
  const config = getOperationConfig(operation, currentChainId)
  return config.rpcUrl
}

/**
 * Helper to create a testnet provider for operations
 */
export async function getTestnetProvider() {
  const { ethers } = await import('ethers')
  return new ethers.JsonRpcProvider(TESTNET_CONFIG.rpcUrl)
}

/**
 * Helper to create a mainnet provider for swap
 */
export async function getMainnetProvider() {
  const { ethers } = await import('ethers')
  return new ethers.JsonRpcProvider(MAINNET_CONFIG.rpcUrl)
}