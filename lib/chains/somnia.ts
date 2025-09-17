/**
 * Somnia Chain Configurations for Viem
 */

import { defineChain } from 'viem';

export const somniaMainnet = defineChain({
  id: 50311,
  name: 'Somnia',
  network: 'somnia',
  nativeCurrency: {
    decimals: 18,
    name: 'Somnia',
    symbol: 'SOMI',
  },
  rpcUrls: {
    default: { 
      http: ['https://api.infra.mainnet.somnia.network/'],
      webSocket: ['wss://api.infra.mainnet.somnia.network/ws']
    },
    public: { 
      http: ['https://api.infra.mainnet.somnia.network/'],
      webSocket: ['wss://api.infra.mainnet.somnia.network/ws']
    },
  },
  blockExplorers: {
    default: { 
      name: 'Somnia Explorer', 
      url: 'https://explorer.somnia.network' 
    },
  },
  testnet: false,
});

export const somniaTestnet = defineChain({
  id: 50312,
  name: 'Somnia Testnet',
  network: 'somnia-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Somnia Test Token',
    symbol: 'STT',
  },
  rpcUrls: {
    default: { 
      http: ['https://testnet.somnia.network'],
      webSocket: ['wss://testnet.somnia.network/ws']
    },
    public: { 
      http: ['https://testnet.somnia.network'],
      webSocket: ['wss://testnet.somnia.network/ws']
    },
  },
  blockExplorers: {
    default: { 
      name: 'Somnia Testnet Explorer', 
      url: 'https://shannon-explorer.somnia.network' 
    },
  },
  testnet: true,
});