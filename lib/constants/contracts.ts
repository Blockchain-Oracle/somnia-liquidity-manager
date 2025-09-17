/**
 * Contract Addresses and Configuration
 * This file manages deployed contract addresses for both mainnet and testnet
 */

import { somniaMainnet, somniaTestnet } from '@/lib/chains/somnia'

export interface ContractAddresses {
  tokens: {
    WSTT?: string
    SOMI?: string
    WSOMI?: string
    WETH?: string
    USDC?: string
    USDT?: string
    tWETH?: string
    tUSDC?: string
    tUSDT?: string
  }
  pools: {
    [pair: string]: string // e.g., "STT/tWETH": "0x..."
  }
  dex?: {
    factory?: string
    router?: string
  }
  nft?: {
    factory?: string
    implementation?: string
    marketplace?: string
  }
}

// Testnet Contracts (Somnia Testnet - Chain ID: 50312)
export const TESTNET_CONTRACTS: ContractAddresses = {
  tokens: {
    WSTT: '0x001Da752ACD5e96077Ac5Cd757dC9ebAd109210A', // Wrapped STT on testnet
    tWETH: '0x4DfB21D6419dc430F5D5F901B0E699ff2BaD9Ac1',
    tUSDC: '0xbb9474aA3a654DDA7Ff09A94a9Bd7C7095E62732',
    tUSDT: '0x0EC9D4B712F16F5054c2CE9Da5c5FEbf360AE149',
  },
  pools: {
    'WSTT/tWETH': '0xd0BC69A4A4599b561c944f4F0263f498F396e4BD',
    'WSTT/tUSDC': '0x735901b22d167e2FA38F97E95886754CAe925CEF',
    'WSTT/tUSDT': '0xeCa49817EeDDCE89A6e0b978d46B51c4d8A8f611',
    'tWETH/tUSDC': '0xa55B7A74D05b5D5C48E431e44Fea83a1047A7582',
    'tWETH/tUSDT': '0x0247FFDb658563f019eE256226f6B82e9Ae79000',
    'tUSDC/tUSDT': '0xD0dAFd63d42cae8220089fbC3c541c4F09740bCb',
  },
  dex: {
    factory: undefined,
    router: undefined,
  },
  nft: {
    factory: '0x4bc9106160414c2579F5b7eac06976D9E65730D9',
    implementation: '0xe494Fd4B0A34c2824F09BC01a8Ae3bA50F52b922',
    marketplace: '0xF308d971F3dbCd32135Cd3e823603aeE010A6b53',
  }
}

// Mainnet Contracts (Somnia Mainnet - Chain ID: 5031)
export const MAINNET_CONTRACTS: ContractAddresses = {
  tokens: {
    SOMI: '0xC3D4E9Ac47D7f37bB07C2f8355Bb4940DEA3bbC3', // NativeOFTAdapter
    WSOMI: '0x046EDe9564A72571df6F5e44d0405360c0f4dCab',
    WETH: '0x936Ab8C674bcb567CD5dEB85D8A216494704E9D8',
    USDC: '0x28BEc7E30E6faee657a03e19Bf1128AaD7632A00',
    USDT: '0x67B302E35Aef5EEE8c32D934F5856869EF428330',
  },
  pools: {},
  dex: {
    factory: undefined,
    router: undefined,
  },
  nft: {
    factory: undefined,
    implementation: undefined,
  }
}

// Helper function to get contracts for current network
export function getContractAddresses(chainId: number): ContractAddresses {
  if (chainId === somniaTestnet.id) {
    return TESTNET_CONTRACTS
  } else if (chainId === somniaMainnet.id) {
    return MAINNET_CONTRACTS
  }
  
  // Return empty addresses for unsupported networks
  return {
    tokens: {},
    pools: {},
    dex: {}
  }
}

// Helper to get token address
export function getTokenAddress(symbol: string, chainId: number): string | undefined {
  const contracts = getContractAddresses(chainId)
  return contracts.tokens[symbol as keyof typeof contracts.tokens]
}

// Helper to get pool address for a pair
export function getPoolAddress(token0: string, token1: string, chainId: number): string | undefined {
  const contracts = getContractAddresses(chainId)
  const pair1 = `${token0}/${token1}`
  const pair2 = `${token1}/${token0}`
  
  return contracts.pools[pair1] || contracts.pools[pair2]
}

// SimpleLiquidityPool ABI (only essential functions)
export const SIMPLE_POOL_ABI = [
  {
    "inputs": [
      { "internalType": "uint256", "name": "amount0", "type": "uint256" },
      { "internalType": "uint256", "name": "amount1", "type": "uint256" }
    ],
    "name": "addLiquidity",
    "outputs": [
      { "internalType": "uint256", "name": "liquidity", "type": "uint256" }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "liquidity", "type": "uint256" }
    ],
    "name": "removeLiquidity",
    "outputs": [
      { "internalType": "uint256", "name": "amount0", "type": "uint256" },
      { "internalType": "uint256", "name": "amount1", "type": "uint256" }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "amountIn", "type": "uint256" },
      { "internalType": "bool", "name": "zeroForOne", "type": "bool" }
    ],
    "name": "swap",
    "outputs": [
      { "internalType": "uint256", "name": "amountOut", "type": "uint256" }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "amountIn", "type": "uint256" },
      { "internalType": "bool", "name": "zeroForOne", "type": "bool" }
    ],
    "name": "getAmountOut",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "reserve0",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "reserve1",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
] as const

// MockERC20 ABI (for testnet tokens)
export const MOCK_ERC20_ABI = [
  {
    "inputs": [],
    "name": "faucet",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "to", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "mint",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // Standard ERC20 functions
  {
    "inputs": [
      { "internalType": "address", "name": "spender", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "approve",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "", "type": "address" }
    ],
    "name": "balanceOf",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "to", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "transfer",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "from", "type": "address" },
      { "internalType": "address", "name": "to", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "transferFrom",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const

// Log deployment status
if (typeof window !== 'undefined') {
  console.log('Contract Deployment Status:', {
    testnetTokens: TESTNET_CONTRACTS.tokens,
    testnetPools: Object.keys(TESTNET_CONTRACTS.pools).length + ' pools',
    nftContracts: TESTNET_CONTRACTS.nft
  })
}