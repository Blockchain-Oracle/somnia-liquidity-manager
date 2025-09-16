// Stargate Token Constants
// Key token addresses for important chains

export const STARGATE_TOKENS = {
  // Somnia Network
  somnia: {
    WETH: {
      address: '0x936Ab8C674bcb567CD5dEB85D8A216494704E9D8',
      decimals: 18,
      symbol: 'WETH',
      name: 'WETH',
      isBridgeable: false
    },
    'USDC.e': {
      address: '0x28BEc7E30E6faee657a03e19Bf1128AaD7632A00',
      decimals: 6,
      symbol: 'USDC.e',
      name: 'Bridged USDC (Stargate)',
      isBridgeable: false
    },
    USDT: {
      address: '0x67B302E35Aef5EEE8c32D934F5856869EF428330',
      decimals: 6,
      symbol: 'USDT',
      name: 'Bridged stgUSDT',
      isBridgeable: false
    },
    SOMI: {
      address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      decimals: 18,
      symbol: 'SOMI',
      name: 'SOMI',
      isBridgeable: false
    }
  },

  // Ethereum
  ethereum: {
    ETH: {
      address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      decimals: 18,
      symbol: 'ETH',
      name: 'ETH',
      isBridgeable: true
    },
    USDC: {
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      decimals: 6,
      symbol: 'USDC',
      name: 'USDC',
      isBridgeable: true
    },
    USDT: {
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      decimals: 6,
      symbol: 'USDT',
      name: 'USDT',
      isBridgeable: true
    },
    WETH: {
      address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      decimals: 18,
      symbol: 'WETH',
      name: 'WETH',
      isBridgeable: true
    },
    WBTC: {
      address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
      decimals: 8,
      symbol: 'WBTC',
      name: 'Wrapped BTC',
      isBridgeable: true
    }
  },

  // Arbitrum
  arbitrum: {
    ETH: {
      address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      decimals: 18,
      symbol: 'ETH',
      name: 'ETH',
      isBridgeable: true
    },
    USDC: {
      address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
      decimals: 6,
      symbol: 'USDC',
      name: 'USD Coin',
      isBridgeable: true
    },
    USDT: {
      address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
      decimals: 6,
      symbol: 'USDT',
      name: 'Tether USD',
      isBridgeable: true
    },
    WETH: {
      address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
      decimals: 18,
      symbol: 'WETH',
      name: 'Wrapped Ether',
      isBridgeable: true
    }
  },

  // Base
  base: {
    ETH: {
      address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      decimals: 18,
      symbol: 'ETH',
      name: 'ETH',
      isBridgeable: true
    },
    USDC: {
      address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      decimals: 6,
      symbol: 'USDC',
      name: 'USD Coin',
      isBridgeable: true
    },
    USDbC: {
      address: '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA',
      decimals: 6,
      symbol: 'USDbC',
      name: 'USD Base Coin',
      isBridgeable: true
    }
  },

  // BSC
  bsc: {
    USDC: {
      address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
      decimals: 18,
      symbol: 'USDC',
      name: 'USD Coin',
      isBridgeable: true
    },
    USDT: {
      address: '0x55d398326f99059fF775485246999027B3197955',
      decimals: 18,
      symbol: 'USDT',
      name: 'Tether USD',
      isBridgeable: true
    },
    WBNB: {
      address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
      decimals: 18,
      symbol: 'WBNB',
      name: 'WBNB',
      isBridgeable: true
    },
    WBTC: {
      address: '0x0555E30da8f98308EdB960aa94C0Db47230d2B9c',
      decimals: 8,
      symbol: 'WBTC',
      name: 'Wrapped BTC',
      isBridgeable: true
    }
  },

  // Optimism
  optimism: {
    ETH: {
      address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      decimals: 18,
      symbol: 'ETH',
      name: 'ETH',
      isBridgeable: true
    },
    USDC: {
      address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
      decimals: 6,
      symbol: 'USDC',
      name: 'USD Coin',
      isBridgeable: true
    },
    USDT: {
      address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
      decimals: 6,
      symbol: 'USDT',
      name: 'Tether USD',
      isBridgeable: true
    },
    WETH: {
      address: '0x4200000000000000000000000000000000000006',
      decimals: 18,
      symbol: 'WETH',
      name: 'Wrapped Ether',
      isBridgeable: true
    }
  },

  // Avalanche
  avalanche: {
    USDC: {
      address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
      decimals: 6,
      symbol: 'USDC',
      name: 'USD Coin',
      isBridgeable: true
    },
    USDT: {
      address: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7',
      decimals: 6,
      symbol: 'USDt',
      name: 'TetherToken',
      isBridgeable: true
    },
    WETH: {
      address: '0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB',
      decimals: 18,
      symbol: 'WETH.e',
      name: 'Wrapped Ether',
      isBridgeable: true
    },
    'BTC.b': {
      address: '0x152b9d0FdC40C096757F570A51E494bd4b943E50',
      decimals: 8,
      symbol: 'BTC.b',
      name: 'BTC.b',
      isBridgeable: true
    }
  },

  // Polygon
  polygon: {
    USDC: {
      address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
      decimals: 6,
      symbol: 'USDC',
      name: 'USD Coin',
      isBridgeable: true
    },
    USDT: {
      address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
      decimals: 6,
      symbol: 'USDT',
      name: 'Tether USD',
      isBridgeable: true
    },
    WETH: {
      address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
      decimals: 18,
      symbol: 'WETH',
      name: 'Wrapped Ether',
      isBridgeable: true
    }
  },

  // Mantle
  mantle: {
    USDC: {
      address: '0x09Bc4E0D864854c6aFB6eB9A9cdF58aC190D0dF9',
      decimals: 6,
      symbol: 'USDC',
      name: 'USD Coin',
      isBridgeable: true
    },
    USDT: {
      address: '0x201EBa5CC46D216Ce6DC03F6a759e8E766e956aE',
      decimals: 6,
      symbol: 'USDT',
      name: 'Tether USD',
      isBridgeable: true
    },
    WETH: {
      address: '0xdEAddEaDdeadDEadDEADDEAddEADDEAddead1111',
      decimals: 18,
      symbol: 'WETH',
      name: 'Ether',
      isBridgeable: true
    },
    mETH: {
      address: '0xcDA86A272531e8640cD7F1a92c01839911B90bb0',
      decimals: 18,
      symbol: 'mETH',
      name: 'mETH',
      isBridgeable: true
    }
  },

  // Metis
  metis: {
    WETH: {
      address: '0x420000000000000000000000000000000000000A',
      decimals: 18,
      symbol: 'WETH',
      name: 'Ether',
      isBridgeable: true
    },
    USDT: {
      address: '0xbB06DCA3AE6887fAbF931640f67cab3e3a16F4dC',
      decimals: 6,
      symbol: 'm.USDT',
      name: 'USDT Token',
      isBridgeable: true
    },
    Metis: {
      address: '0xDeadDeAddeAddEAddeadDEaDDEAdDeaDDeAD0000',
      decimals: 18,
      symbol: 'Metis',
      name: 'Metis Token',
      isBridgeable: true
    }
  },

  // Other important chains
  scroll: {
    ETH: {
      address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      decimals: 18,
      symbol: 'ETH',
      name: 'ETH',
      isBridgeable: true
    },
    USDC: {
      address: '0x06eFdBFf2a14a7c8E15944D1F4A48F9F95F663A4',
      decimals: 6,
      symbol: 'USDC',
      name: 'USD Coin',
      isBridgeable: true
    }
  },

  linea: {
    ETH: {
      address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      decimals: 18,
      symbol: 'ETH',
      name: 'ETH',
      isBridgeable: true
    },
    USDC: {
      address: '0x176211869cA2b568f2A7D4EE941E073a821EE1ff',
      decimals: 6,
      symbol: 'USDC',
      name: 'USD Coin',
      isBridgeable: true
    }
  },

  zksync: {
    ETH: {
      address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      decimals: 18,
      symbol: 'ETH',
      name: 'Ether',
      isBridgeable: true
    },
    USDC: {
      address: '0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4',
      decimals: 6,
      symbol: 'USDC',
      name: 'USD Coin',
      isBridgeable: true
    }
  }
};

// Helper to get native token address (ETH, BNB, etc.)
export const NATIVE_TOKEN_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

// Common token symbols across chains
export const COMMON_TOKENS = {
  stablecoins: ['USDC', 'USDT', 'USDC.e', 'USDbC', 'DAI', 'FRAX', 'USDD', 'BUSD'],
  eth: ['ETH', 'WETH'],
  btc: ['WBTC', 'BTC.b', 'BTCB'],
  native: {
    ethereum: 'ETH',
    arbitrum: 'ETH',
    optimism: 'ETH',
    base: 'ETH',
    bsc: 'BNB',
    polygon: 'MATIC',
    avalanche: 'AVAX',
    somnia: 'SOMI'
  }
};

// Chain IDs mapping
export const CHAIN_IDS = {
  ethereum: 1,
  arbitrum: 42161,
  optimism: 10,
  base: 8453,
  bsc: 56,
  polygon: 137,
  avalanche: 43114,
  mantle: 5000,
  metis: 1088,
  scroll: 534352,
  linea: 59144,
  zksync: 324,
  somnia: 424242 // Placeholder - update with actual chain ID
};

// Export helper function to get token by chain and symbol
export function getStargateToken(chain: string, symbol: string) {
  const chainTokens = STARGATE_TOKENS[chain as keyof typeof STARGATE_TOKENS];
  if (!chainTokens) return undefined;
  return (chainTokens as any)[symbol];
}

// Export helper to check if address is native token
export function isNativeToken(address: string): boolean {
  return address.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase();
}