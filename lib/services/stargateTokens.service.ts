// Stargate Finance Token Service
// Fetches and manages token data from Stargate API

export interface StargateToken {
  isBridgeable: boolean;
  chainKey: string;
  address: string;
  decimals: number;
  symbol: string;
  name: string;
  price?: {
    usd: number;
  };
}

export interface StargateTokensResponse {
  tokens: StargateToken[];
}

// Important tokens for Somnia and cross-chain operations
export const IMPORTANT_TOKENS = {
  // Stablecoins
  USDC: ['USDC', 'USDC.e', 'USDbC'],
  USDT: ['USDT', 'USDT0', 'USD₮0'],
  
  // Major assets
  ETH: ['ETH', 'WETH'],
  BTC: ['WBTC', 'BTC.b', 'BTCB'],
  
  // Somnia specific
  SOMNIA: {
    chainKey: 'somnia',
    tokens: [
      { symbol: 'WETH', address: '0x936Ab8C674bcb567CD5dEB85D8A216494704E9D8', decimals: 18 },
      { symbol: 'USDC.e', address: '0x28BEc7E30E6faee657a03e19Bf1128AaD7632A00', decimals: 6 },
      { symbol: 'USDT', address: '0x67B302E35Aef5EEE8c32D934F5856869EF428330', decimals: 6 },
      { symbol: 'SOMI', address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', decimals: 18 }
    ]
  }
};

class StargateTokensService {
  private tokens: Map<string, StargateToken[]> = new Map();
  private tokensBySymbol: Map<string, StargateToken[]> = new Map();
  private tokensByChainAndSymbol: Map<string, StargateToken> = new Map();
  private lastFetchTime: number = 0;
  private CACHE_DURATION = 60 * 60 * 1000; // 1 hour cache

  async fetchTokens(): Promise<StargateToken[]> {
    const now = Date.now();
    
    // Return cached data if still valid
    if (this.lastFetchTime && (now - this.lastFetchTime) < this.CACHE_DURATION) {
      return this.getAllTokens();
    }

    try {
      const response = await fetch('https://stargate.finance/api/v1/tokens');
      const data: StargateTokensResponse = await response.json();
      
      // Clear existing data
      this.tokens.clear();
      this.tokensBySymbol.clear();
      this.tokensByChainAndSymbol.clear();
      
      // Process and store tokens
      for (const token of data.tokens) {
        // Store by chain
        if (!this.tokens.has(token.chainKey)) {
          this.tokens.set(token.chainKey, []);
        }
        this.tokens.get(token.chainKey)!.push(token);
        
        // Store by symbol
        if (!this.tokensBySymbol.has(token.symbol)) {
          this.tokensBySymbol.set(token.symbol, []);
        }
        this.tokensBySymbol.get(token.symbol)!.push(token);
        
        // Store by chain+symbol for quick lookup
        const key = `${token.chainKey}:${token.symbol}`;
        this.tokensByChainAndSymbol.set(key, token);
      }
      
      this.lastFetchTime = now;
      return data.tokens;
    } catch (error) {
      console.error('Error fetching Stargate tokens:', error);
      throw error;
    }
  }

  // Get all tokens
  getAllTokens(): StargateToken[] {
    const allTokens: StargateToken[] = [];
    this.tokens.forEach((tokens) => {
      allTokens.push(...tokens);
    });
    return allTokens;
  }

  // Get tokens for a specific chain
  getTokensByChain(chainKey: string): StargateToken[] {
    return this.tokens.get(chainKey) || [];
  }

  // Get tokens by symbol across all chains
  getTokensBySymbol(symbol: string): StargateToken[] {
    return this.tokensBySymbol.get(symbol) || [];
  }

  // Get specific token for a chain
  getToken(chainKey: string, symbol: string): StargateToken | undefined {
    return this.tokensByChainAndSymbol.get(`${chainKey}:${symbol}`);
  }

  // Get token address
  getTokenAddress(chainKey: string, symbol: string): string | undefined {
    const token = this.getToken(chainKey, symbol);
    return token?.address;
  }

  // Get token decimals
  getTokenDecimals(chainKey: string, symbol: string): number | undefined {
    const token = this.getToken(chainKey, symbol);
    return token?.decimals;
  }

  // Get token price in USD
  getTokenPrice(chainKey: string, symbol: string): number | undefined {
    const token = this.getToken(chainKey, symbol);
    return token?.price?.usd;
  }

  // Get bridgeable tokens for a chain
  getBridgeableTokens(chainKey: string): StargateToken[] {
    const chainTokens = this.getTokensByChain(chainKey);
    return chainTokens.filter(token => token.isBridgeable);
  }

  // Find all chains that support a specific token
  getChainsForToken(symbol: string): string[] {
    const tokens = this.getTokensBySymbol(symbol);
    return [...new Set(tokens.map(t => t.chainKey))];
  }

  // Get Somnia tokens
  getSomniaTokens(): StargateToken[] {
    return this.getTokensByChain('somnia');
  }

  // Check if token exists on chain
  tokenExistsOnChain(chainKey: string, symbol: string): boolean {
    return this.tokensByChainAndSymbol.has(`${chainKey}:${symbol}`);
  }

  // Get cross-chain token pairs for bridging
  getBridgePairs(symbol: string): Array<{ from: string; to: string; token: StargateToken }> {
    const tokens = this.getTokensBySymbol(symbol).filter(t => t.isBridgeable);
    const pairs: Array<{ from: string; to: string; token: StargateToken }> = [];
    
    for (let i = 0; i < tokens.length; i++) {
      for (let j = i + 1; j < tokens.length; j++) {
        pairs.push({
          from: tokens[i].chainKey,
          to: tokens[j].chainKey,
          token: tokens[i]
        });
        pairs.push({
          from: tokens[j].chainKey,
          to: tokens[i].chainKey,
          token: tokens[j]
        });
      }
    }
    
    return pairs;
  }

  // Get popular/important tokens for a chain
  getImportantTokens(chainKey: string): StargateToken[] {
    const chainTokens = this.getTokensByChain(chainKey);
    const importantSymbols = [
      'USDC', 'USDT', 'USDC.e', 'ETH', 'WETH', 'WBTC', 'BTC.b',
      'DAI', 'BUSD', 'FRAX', 'USDD', 'MATIC', 'BNB', 'AVAX'
    ];
    
    return chainTokens.filter(token => 
      importantSymbols.includes(token.symbol) ||
      (token.price?.usd && token.price.usd > 0)
    );
  }

  // Search tokens
  searchTokens(query: string): StargateToken[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllTokens().filter(token =>
      token.symbol.toLowerCase().includes(lowerQuery) ||
      token.name.toLowerCase().includes(lowerQuery) ||
      token.address.toLowerCase().includes(lowerQuery)
    );
  }

  // Get token statistics
  getTokenStats() {
    const allTokens = this.getAllTokens();
    const chains = new Set(allTokens.map(t => t.chainKey));
    const bridgeableTokens = allTokens.filter(t => t.isBridgeable);
    const tokensWithPrice = allTokens.filter(t => t.price?.usd);
    
    return {
      totalTokens: allTokens.length,
      totalChains: chains.size,
      bridgeableTokens: bridgeableTokens.length,
      tokensWithPrice: tokensWithPrice.length,
      chains: Array.from(chains)
    };
  }
}

// Export singleton instance
export const stargateTokensService = new StargateTokensService();

// Helper function to get token info
export async function getStargateTokenInfo(chainKey: string, symbol: string): Promise<StargateToken | undefined> {
  await stargateTokensService.fetchTokens();
  return stargateTokensService.getToken(chainKey, symbol);
}

// Helper function to get Somnia tokens
export async function getSomniaTokens(): Promise<StargateToken[]> {
  await stargateTokensService.fetchTokens();
  return stargateTokensService.getSomniaTokens();
}

// Helper function to get bridgeable pairs
export async function getBridgeablePairs(symbol: string) {
  await stargateTokensService.fetchTokens();
  return stargateTokensService.getBridgePairs(symbol);
}