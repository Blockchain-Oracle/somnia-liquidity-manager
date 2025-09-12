/**
 * Token Registry Service
 * Unified service for managing token information across all chains
 * Combines Stargate API data with hardcoded constants
 */

import { STARGATE_TOKENS, CHAIN_IDS, getStargateToken, isNativeToken } from '../constants/stargateTokens';
import { stargateTokensService, type StargateToken } from './stargateTokens.service';

export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  chainId: number;
  chainKey: string;
  isBridgeable: boolean;
  isNative?: boolean;
  price?: number;
}

export interface ChainTokens {
  chainId: number;
  chainKey: string;
  chainName: string;
  tokens: TokenInfo[];
}

class TokenRegistryService {
  private initialized = false;
  private tokenCache = new Map<string, TokenInfo>();

  /**
   * Initialize the token registry with Stargate data
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      // Fetch latest token data from Stargate API
      await stargateTokensService.fetchTokens();
      this.initialized = true;
      console.log('✅ Token Registry initialized with Stargate data');
    } catch (error) {
      console.warn('⚠️ Failed to fetch Stargate tokens, using hardcoded constants only', error);
      this.initialized = true;
    }
  }

  /**
   * Get token info for a specific chain and symbol
   * Prioritizes Stargate API data, falls back to hardcoded constants
   */
  async getToken(chainKey: string, symbol: string): Promise<TokenInfo | null> {
    await this.initialize();
    
    const cacheKey = `${chainKey}:${symbol}`;
    if (this.tokenCache.has(cacheKey)) {
      return this.tokenCache.get(cacheKey)!;
    }

    // Try Stargate API first
    const stargateToken = stargateTokensService.getToken(chainKey, symbol);
    if (stargateToken) {
      const tokenInfo = this.convertStargateToken(stargateToken, chainKey);
      this.tokenCache.set(cacheKey, tokenInfo);
      return tokenInfo;
    }

    // Fall back to hardcoded constants
    const hardcodedToken = getStargateToken(chainKey, symbol);
    if (hardcodedToken) {
      const chainId = CHAIN_IDS[chainKey as keyof typeof CHAIN_IDS];
      const tokenInfo: TokenInfo = {
        address: hardcodedToken.address,
        symbol: hardcodedToken.symbol,
        name: hardcodedToken.name,
        decimals: hardcodedToken.decimals,
        chainId: chainId || 0,
        chainKey,
        isBridgeable: hardcodedToken.isBridgeable,
        isNative: isNativeToken(hardcodedToken.address),
      };
      this.tokenCache.set(cacheKey, tokenInfo);
      return tokenInfo;
    }

    return null;
  }

  /**
   * Get all tokens for a specific chain
   */
  async getChainTokens(chainKey: string): Promise<ChainTokens> {
    await this.initialize();

    const chainId = CHAIN_IDS[chainKey as keyof typeof CHAIN_IDS];
    const tokens: TokenInfo[] = [];

    // Get tokens from Stargate API
    const stargateTokens = stargateTokensService.getTokensByChain(chainKey);
    for (const token of stargateTokens) {
      tokens.push(this.convertStargateToken(token, chainKey));
    }

    // Add hardcoded tokens if not already present
    const hardcodedTokens = STARGATE_TOKENS[chainKey as keyof typeof STARGATE_TOKENS];
    if (hardcodedTokens) {
      for (const [symbol, tokenData] of Object.entries(hardcodedTokens)) {
        const exists = tokens.some(t => t.symbol === symbol);
        if (!exists) {
          tokens.push({
            address: tokenData.address,
            symbol: tokenData.symbol,
            name: tokenData.name,
            decimals: tokenData.decimals,
            chainId: chainId || 0,
            chainKey,
            isBridgeable: tokenData.isBridgeable,
            isNative: isNativeToken(tokenData.address),
          });
        }
      }
    }

    return {
      chainId: chainId || 0,
      chainKey,
      chainName: this.getChainName(chainKey),
      tokens,
    };
  }

  /**
   * Get Somnia-specific tokens
   */
  async getSomniaTokens(): Promise<TokenInfo[]> {
    const chainTokens = await this.getChainTokens('somnia');
    return chainTokens.tokens;
  }

  /**
   * Get bridgeable token pairs for cross-chain transfers
   */
  async getBridgeableTokens(symbol: string): Promise<{ chains: string[]; tokens: TokenInfo[] }> {
    await this.initialize();

    const chains: string[] = [];
    const tokens: TokenInfo[] = [];

    // Get from Stargate API
    const stargateChains = stargateTokensService.getChainsForToken(symbol);
    for (const chainKey of stargateChains) {
      const token = await this.getToken(chainKey, symbol);
      if (token && token.isBridgeable) {
        chains.push(chainKey);
        tokens.push(token);
      }
    }

    // Check hardcoded tokens
    for (const [chainKey, chainTokens] of Object.entries(STARGATE_TOKENS)) {
      if (!chains.includes(chainKey) && chainTokens[symbol as keyof typeof chainTokens]) {
        const token = await this.getToken(chainKey, symbol);
        if (token && token.isBridgeable) {
          chains.push(chainKey);
          tokens.push(token);
        }
      }
    }

    return { chains, tokens };
  }

  /**
   * Search for tokens across all chains
   */
  async searchTokens(query: string): Promise<TokenInfo[]> {
    await this.initialize();

    const results: TokenInfo[] = [];
    const seen = new Set<string>();

    // Search in Stargate API data
    const stargateResults = stargateTokensService.searchTokens(query);
    for (const token of stargateResults) {
      const key = `${token.chainKey}:${token.symbol}`;
      if (!seen.has(key)) {
        seen.add(key);
        results.push(this.convertStargateToken(token, token.chainKey));
      }
    }

    // Search in hardcoded constants
    const lowerQuery = query.toLowerCase();
    for (const [chainKey, chainTokens] of Object.entries(STARGATE_TOKENS)) {
      for (const [symbol, tokenData] of Object.entries(chainTokens)) {
        const key = `${chainKey}:${symbol}`;
        if (!seen.has(key) && 
            (symbol.toLowerCase().includes(lowerQuery) || 
             tokenData.name.toLowerCase().includes(lowerQuery) ||
             tokenData.address.toLowerCase().includes(lowerQuery))) {
          seen.add(key);
          const chainId = CHAIN_IDS[chainKey as keyof typeof CHAIN_IDS];
          results.push({
            address: tokenData.address,
            symbol: tokenData.symbol,
            name: tokenData.name,
            decimals: tokenData.decimals,
            chainId: chainId || 0,
            chainKey,
            isBridgeable: tokenData.isBridgeable,
            isNative: isNativeToken(tokenData.address),
          });
        }
      }
    }

    return results;
  }

  /**
   * Get token address for a specific chain and symbol
   */
  async getTokenAddress(chainKey: string, symbol: string): Promise<string | null> {
    const token = await this.getToken(chainKey, symbol);
    return token?.address || null;
  }

  /**
   * Get token decimals for a specific chain and symbol
   */
  async getTokenDecimals(chainKey: string, symbol: string): Promise<number | null> {
    const token = await this.getToken(chainKey, symbol);
    return token?.decimals || null;
  }

  /**
   * Check if a token is native (ETH, BNB, etc.)
   */
  isNativeToken(address: string): boolean {
    return isNativeToken(address);
  }

  /**
   * Get all supported chains
   */
  getSupportedChains(): string[] {
    const chains = new Set<string>();
    
    // Add chains from constants
    Object.keys(STARGATE_TOKENS).forEach(chain => chains.add(chain));
    
    // Add chains from Stargate API
    const stats = stargateTokensService.getTokenStats();
    stats.chains.forEach(chain => chains.add(chain));
    
    return Array.from(chains);
  }

  /**
   * Convert Stargate token to TokenInfo
   */
  private convertStargateToken(token: StargateToken, chainKey: string): TokenInfo {
    const chainId = CHAIN_IDS[chainKey as keyof typeof CHAIN_IDS];
    return {
      address: token.address,
      symbol: token.symbol,
      name: token.name,
      decimals: token.decimals,
      chainId: chainId || 0,
      chainKey,
      isBridgeable: token.isBridgeable,
      isNative: isNativeToken(token.address),
      price: token.price?.usd,
    };
  }

  /**
   * Get chain name from chain key
   */
  private getChainName(chainKey: string): string {
    const names: Record<string, string> = {
      ethereum: 'Ethereum',
      arbitrum: 'Arbitrum',
      optimism: 'Optimism',
      base: 'Base',
      bsc: 'BSC',
      polygon: 'Polygon',
      avalanche: 'Avalanche',
      somnia: 'Somnia',
      mantle: 'Mantle',
      metis: 'Metis',
      scroll: 'Scroll',
      linea: 'Linea',
      zksync: 'zkSync',
    };
    return names[chainKey] || chainKey;
  }

  /**
   * Clear the token cache
   */
  clearCache(): void {
    this.tokenCache.clear();
    this.initialized = false;
  }
}

// Export singleton instance
export const tokenRegistryService = new TokenRegistryService();

// Export convenience functions
export async function getTokenInfo(chainKey: string, symbol: string): Promise<TokenInfo | null> {
  return tokenRegistryService.getToken(chainKey, symbol);
}

export async function getSomniaTokenInfo(): Promise<TokenInfo[]> {
  return tokenRegistryService.getSomniaTokens();
}

export async function getTokenAddress(chainKey: string, symbol: string): Promise<string | null> {
  return tokenRegistryService.getTokenAddress(chainKey, symbol);
}

export async function searchAllTokens(query: string): Promise<TokenInfo[]> {
  return tokenRegistryService.searchTokens(query);
}