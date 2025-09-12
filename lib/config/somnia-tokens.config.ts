/**
 * Official Somnia Token Configuration
 * These are the official token addresses on Somnia mainnet
 */

import type { Address } from 'viem';

// Official Token Addresses on Somnia Mainnet
export const SOMNIA_TOKENS = {
  WSOMI: '0x046EDe9564A72571df6F5e44d0405360c0f4dCab' as Address,
  USDC: '0x28bec7e30e6faee657a03e19bf1128aad7632a00' as Address, 
  WETH: '0x936Ab8C674bcb567CD5dEB85D8A216494704E9D8' as Address,
  USDT: '0x67B302E35Aef5EEE8c32D934F5856869EF428330' as Address,
} as const;

// DIA Oracle Configuration (when deployed)
export const DIA_ORACLE_CONFIG = {
  // Main Oracle Contract
  oracle: '0xbA0E0750A56e995506CA458b2BdD752754CF39C4' as Address,
  gasWallet: '0x3073d2E61ecb6E4BF4273Af83d53eDAE099ea04a' as Address,
  
  // Price Feed Adapters (Chainlink-compatible)
  adapters: {
    USDT: '0x936C4F07fD4d01485849ee0EE2Cdcea2373ba267' as Address,
    USDC: '0x5D4266f4DD721c1cD8367FEb23E4940d17C83C93' as Address,
    // WETH and WSOMI adapters to be added when available
  } as const,
} as const;

// QuickSwap V4 (Algebra) Contract Addresses
export const QUICKSWAP_V4_ADDRESSES = {
  AlgebraFactory: '0x0ccff3D02A3a200263eC4e0Fdb5E60a56721B8Ae' as Address,
  AlgebraPoolDeployer: '0x0361B4883FfD676BB0a4642B3139D38A33e452f5' as Address,
  QuoterV2: '0xcB68373404a835268D3ED76255C8148578A82b77' as Address,
  SwapRouter: '0x1582f6f3D26658F7208A799Be46e34b1f366CE44' as Address,
  NonfungiblePositionManager: '0xfE02219e0578B1E4831CDE7C3CB36f71AEb4A833' as Address,
} as const;

// Token Metadata
export const TOKEN_INFO = {
  WSOMI: {
    symbol: 'WSOMI',
    name: 'Wrapped Somnia',
    decimals: 18,
    address: SOMNIA_TOKENS.WSOMI,
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    address: SOMNIA_TOKENS.USDC,
  },
  WETH: {
    symbol: 'WETH',
    name: 'Wrapped Ether',
    decimals: 18,
    address: SOMNIA_TOKENS.WETH,
  },
  USDT: {
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    address: SOMNIA_TOKENS.USDT,
  },
} as const;

// Hardcoded fallback prices (until DIA Oracle is fully deployed)
// These should be updated with real market prices periodically
export const FALLBACK_PRICES = {
  WETH: 3500,   // $3,500 per ETH
  WSOMI: 0.10,  // $0.10 per SOMI (placeholder - update with real price)
  USDC: 1.00,   // $1.00 (stablecoin)
  USDT: 1.00,   // $1.00 (stablecoin)
} as const;

// Helper to get token address by symbol
export function getTokenAddress(symbol: string): Address | undefined {
  return SOMNIA_TOKENS[symbol as keyof typeof SOMNIA_TOKENS];
}

// Helper to get DIA adapter address by symbol
export function getDiaAdapter(symbol: string): Address | undefined {
  return DIA_ORACLE_CONFIG.adapters[symbol as keyof typeof DIA_ORACLE_CONFIG.adapters];
}