/**
 * Token Images and Metadata
 * Centralized token branding for consistent UI
 */

export interface TokenInfo {
  symbol: string;
  name: string;
  decimals: number;
  image: string;
  color: string; // Primary color for gradients
  addresses?: {
    mainnet?: string;
    testnet?: string;
  };
}

// Token images using CoinGecko CDN and other reliable sources
// Only tokens available on Somnia network
export const TOKEN_IMAGES: Record<string, TokenInfo> = {
  WETH: {
    symbol: 'WETH',
    name: 'Wrapped Ether',
    decimals: 18,
    image: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
    color: '#627EEA',
    addresses: {
      mainnet: '0x936Ab8C674bcb567CD5dEB85D8A216494704E9D8',
    }
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    image: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png',
    color: '#2775CA',
    addresses: {
      mainnet: '0x28BEc7E30E6faee657a03e19Bf1128AaD7632A00',
      testnet: '0xb81713B44ef5F68eF921A8637FabC025e63B3523',
    }
  },
  USDT: {
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    image: 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
    color: '#50AF95',
    addresses: {
      mainnet: '0x67B302E35Aef5EEE8c32D934F5856869EF428330',
    }
  },
  SOMI: {
    symbol: 'SOMI',
    name: 'Somnia',
    decimals: 18,
    image: '/somi_token_logo.png',
    color: '#8B5CF6',
    addresses: {
      mainnet: '0xC3D4E9Ac47D7f37bB07C2f8355Bb4940DEA3bbC3', // NativeOFTAdapter
    }
  },
  WSOMI: {
    symbol: 'WSOMI',
    name: 'Wrapped Somnia',
    decimals: 18,
    image: '/somi_token_logo.png',
    color: '#8B5CF6',
    addresses: {
      mainnet: '0x046EDe9564A72571df6F5e44d0405360c0f4dCab',
      testnet: '0x001Da752ACD5e96077Ac5Cd757dC9ebAd109210A',
    }
  },
  WSTT: {
    symbol: 'WSTT',
    name: 'Wrapped STT',
    decimals: 18,
    image: '/somi_token_logo.png', // Use SOMI logo for test token
    color: '#F59E0B',
    addresses: {
      testnet: '0x001Da752ACD5e96077Ac5Cd757dC9ebAd109210A',
    }
  },
  // Testnet tokens
  tWETH: {
    symbol: 'tWETH',
    name: 'Test Wrapped Ether',
    decimals: 18,
    image: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
    color: '#627EEA',
    addresses: {
      testnet: '0x4DfB21D6419dc430F5D5F901B0E699ff2BaD9Ac1',
    }
  },
  tUSDC: {
    symbol: 'tUSDC',
    name: 'Test USD Coin',
    decimals: 6,
    image: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png',
    color: '#2775CA',
    addresses: {
      testnet: '0xbb9474aA3a654DDA7Ff09A94a9Bd7C7095E62732',
    }
  },
  tUSDT: {
    symbol: 'tUSDT',
    name: 'Test Tether USD',
    decimals: 6,
    image: 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
    color: '#50AF95',
    addresses: {
      testnet: '0x0EC9D4B712F16F5054c2CE9Da5c5FEbf360AE149',
    }
  },
};

// Helper function to get token info
export function getTokenInfo(symbol: string): TokenInfo {
  return TOKEN_IMAGES[symbol.toUpperCase()] || {
    symbol: symbol.toUpperCase(),
    name: symbol,
    decimals: 18,
    image: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png', // Generic token fallback
    color: '#6B7280',
  };
}

// Helper to get token image URL
export function getTokenImage(symbol: string): string {
  return getTokenInfo(symbol).image;
}

// Helper to get token color for gradients
export function getTokenColor(symbol: string): string {
  return getTokenInfo(symbol).color;
}

// Get token pair image URLs
export function getTokenPairImages(symbol0: string, symbol1: string): [string, string] {
  return [getTokenImage(symbol0), getTokenImage(symbol1)];
}

// Get tokens available for a specific network
export function getTokensByNetwork(isTestnet: boolean): TokenInfo[] {
  const tokens: TokenInfo[] = [];
  
  Object.values(TOKEN_IMAGES).forEach(token => {
    if (isTestnet) {
      // On testnet, only show test-specific tokens
      // WSTT is the testnet token, and tokens with 't' prefix are test versions
      if (token.symbol === 'WSTT' || token.symbol.startsWith('t')) {
        tokens.push(token);
      }
    } else {
      // On mainnet, show only mainnet tokens
      // Exclude WSTT (testnet token) and tokens with 't' prefix
      if (token.symbol !== 'WSTT' && !token.symbol.startsWith('t')) {
        // Also verify token has mainnet address
        if (token.addresses?.mainnet) {
          tokens.push(token);
        }
      }
    }
  });
  
  return tokens;
}

// Alias for getTokensByNetwork for compatibility
export function getAllTokens(isTestnet: boolean): TokenInfo[] {
  return getTokensByNetwork(isTestnet);
}

// Check if a token is available on a network
export function isTokenAvailable(symbol: string, isTestnet: boolean): boolean {
  const token = TOKEN_IMAGES[symbol.toUpperCase()];
  if (!token) return false;
  
  if (isTestnet) {
    return token.addresses?.testnet !== undefined;
  } else {
    return token.addresses?.mainnet !== undefined;
  }
}