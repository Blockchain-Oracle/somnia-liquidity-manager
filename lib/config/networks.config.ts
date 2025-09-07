/**
 * Network Configuration
 * Centralized configuration for Mainnet and Testnet
 * NO ENVIRONMENT VARIABLES NEEDED!
 */

export interface NetworkConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
  wsUrl?: string;
  explorer: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  contracts: {
    // QuickSwap Contracts (Mainnet only)
    quickswap?: {
      algebraFactory: string;
      swapRouter: string;
      nonfungiblePositionManager: string;
      quoterV2: string;
      farmingCenter: string;
    };
    // SimpleDEX Contracts (Testnet only)
    simpledex?: {
      pool: string;
      wsomi: string;
      usdc: string;
    };
    // DIA Oracle Contracts
    diaOracle?: {
      mainOracle: string;
      adapters: {
        USDT?: string;
        USDC?: string;
        BTC?: string;
        ARB?: string;
        SOL?: string;
      };
    };
    // Common Token Addresses
    tokens: {
      WSOMI?: string;
      USDC?: string;
      USDT?: string;
      WETH?: string;
    };
  };
  subgraph?: {
    endpoint: string;
    name: string;
  };
  isTestnet: boolean;
  faucetUrl?: string;
}

// MAINNET CONFIGURATION
export const MAINNET_CONFIG: NetworkConfig = {
  name: 'Somnia Mainnet',
  chainId: 5031,
  rpcUrl: 'https://api.infra.mainnet.somnia.network',
  wsUrl: 'wss://rpc.somnia.network/ws',
  explorer: 'https://explorer.somnia.network',
  nativeCurrency: {
    name: 'Somnia',
    symbol: 'SOMI',
    decimals: 18
  },
  contracts: {
    // QuickSwap is ONLY on mainnet
    quickswap: {
      algebraFactory: '0x0ccff3D02A3a200263eC4e0Fdb5E60a56721B8Ae',
      swapRouter: '0x1582f6f3D26658F7208A799Be46e34b1f366CE44',
      nonfungiblePositionManager: '0xfE02219e0578B1E4831CDE7C3CB36f71AEb4A833',
      quoterV2: '0xcB68373404a835268D3ED76255C8148578A82b77',
      farmingCenter: '0xEf181Ea0d1223CFEe104439213AF3F1Be6788850'
    },
    // DIA Oracle on Mainnet
    diaOracle: {
      mainOracle: '0xbA0E0750A56e995506CA458b2BdD752754CF39C4',
      adapters: {
        USDT: '0x936C4F07fD4d01485849ee0EE2Cdcea2373ba267',
        USDC: '0x5D4266f4DD721c1cD8367FEb23E4940d17C83C93',
        BTC: '0xb12e1d47b0022fA577c455E7df2Ca9943D0152bE',
        ARB: '0x6a96a0232402c2BC027a12C73f763b604c9F77a6',
        SOL: '0xa4a3a8B729939E2a79dCd9079cee7d84b0d96234'
      }
    },
    // Mainnet token addresses
    tokens: {
      WSOMI: '0x046EDe9564A72571df6F5e44d0405360c0f4dCab',
      USDC: '0x28BEc7E30E6faee657a03e19Bf1128AaD7632A00',
      USDT: '0xc45AfEE99178ED378a3E5F8b3B60977b3f1e8758',
      WETH: '0xB9164670A2F388D835B868b3D0D441fa1bE5bb00'
    }
  },
  subgraph: {
    endpoint: 'https://proxy.somnia.chain.love/subgraphs/name/somnia-mainnet',
    name: 'quickswap-v4'
  },
  isTestnet: false
};

// TESTNET CONFIGURATION
export const TESTNET_CONFIG: NetworkConfig = {
  name: 'Somnia Testnet',
  chainId: 50312,
  rpcUrl: 'https://dream-rpc.somnia.network',
  wsUrl: 'wss://dream-rpc.somnia.network/ws',
  explorer: 'https://shannon-explorer.somnia.network',
  nativeCurrency: {
    name: 'Somnia Test Token',
    symbol: 'STT',
    decimals: 18
  },
  contracts: {
    // SimpleDEX DEPLOYED on testnet (2025-09-07)
    simpledex: {
      pool: '0xF4a6bbF79D16207a527518fBEB6Be5Aa771984CB', // DEPLOYED!
      wsomi: '0x001Da752ACD5e96077Ac5Cd757dC9ebAd109210A', // DEPLOYED!
      usdc: '0xb81713B44ef5F68eF921A8637FabC025e63B3523' // DEPLOYED!
    },
    // DIA Oracle on Testnet
    diaOracle: {
      mainOracle: '0x9206296Ea3aEE3E6bdC07F7AaeF14DfCf33d865D',
      adapters: {
        USDT: '0x67d2C2a87A17b7267a6DBb1A59575C0E9A1D1c3e',
        USDC: '0x235266D5ca6f19F134421C49834C108b32C2124e',
        BTC: '0x4803db1ca3A1DA49c3DB991e1c390321c20e1f21',
        ARB: '0x74952812B6a9e4f826b2969C6D189c4425CBc19B',
        SOL: '0xD5Ea6C434582F827303423dA21729bEa4F87D519'
      }
    },
    // Testnet token addresses (our deployed mock tokens)
    tokens: {
      WSOMI: '0x001Da752ACD5e96077Ac5Cd757dC9ebAd109210A',
      USDC: '0xb81713B44ef5F68eF921A8637FabC025e63B3523'
    }
  },
  subgraph: {
    endpoint: 'https://proxy.somnia.chain.love/subgraphs/name/somnia-testnet',
    name: 'simpledex'
  },
  isTestnet: true,
  faucetUrl: 'https://somnia.faucetme.pro/'
};

// Default network (can be changed by user)
let currentNetwork: 'mainnet' | 'testnet' = 'mainnet';

// Get current network configuration
export function getCurrentNetwork(): NetworkConfig {
  return currentNetwork === 'mainnet' ? MAINNET_CONFIG : TESTNET_CONFIG;
}

// Switch network
export function switchNetwork(network: 'mainnet' | 'testnet'): NetworkConfig {
  currentNetwork = network;
  console.log(`🔄 Switched to ${network === 'mainnet' ? 'Somnia Mainnet' : 'Somnia Testnet'}`);
  return getCurrentNetwork();
}

// Get current network name
export function getCurrentNetworkName(): 'mainnet' | 'testnet' {
  return currentNetwork;
}

// Check if QuickSwap is available on current network
export function isQuickSwapAvailable(): boolean {
  const config = getCurrentNetwork();
  return !!config.contracts.quickswap;
}

// Check if SimpleDEX is available on current network
export function isSimpleDEXAvailable(): boolean {
  const config = getCurrentNetwork();
  return !!config.contracts.simpledex && !!config.contracts.simpledex.pool;
}

// Update SimpleDEX addresses after deployment
export function updateSimpleDEXAddresses(addresses: {
  pool: string;
  wsomi: string;
  usdc: string;
}) {
  TESTNET_CONFIG.contracts.simpledex = addresses;
  TESTNET_CONFIG.contracts.tokens.WSOMI = addresses.wsomi;
  TESTNET_CONFIG.contracts.tokens.USDC = addresses.usdc;
  console.log('✅ SimpleDEX addresses updated in testnet config');
}