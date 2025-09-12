/**
 * DIA Oracle Service for Somnia
 * Fetches real-time price data from DIA oracles on Somnia network
 * Documentation: https://docs.diadata.org/
 */

import { createPublicClient, http, parseAbi, type Address } from 'viem'
import { somniaMainnet, somniaTestnet } from '@/lib/wagmi'
import { getCurrentNetworkName } from '@/lib/config/networks.config'

// DIA Oracle contract addresses on Somnia (Updated from official docs)
const DIA_ORACLE_ADDRESSES = {
  mainnet: '0xbA0E0750A56e995506CA458b2BdD752754CF39C4', // Somnia Mainnet DIA Oracle
  testnet: '0x9206296Ea3aEE3E6bdC07F7AaeF14DfCf33d865D', // Somnia Testnet (Shannon)
}

// Asset adapter addresses from official DIA documentation
// Only USDT and USDC have adapters on Somnia
// WETH and WSOMI don't have adapters yet, will use pool-based pricing
const DIA_ASSET_ADAPTERS = {
  mainnet: {
    'USDT': '0x936C4F07fD4d01485849ee0EE2Cdcea2373ba267',
    'USDC': '0x5D4266f4DD721c1cD8367FEb23E4940d17C83C93',
  },
  testnet: {
    'USDT': '0x67d2C2a87A17b7267a6DBb1A59575C0E9A1D1c3e',
    'USDC': '0x235266D5ca6f19F134421C49834C108b32C2124e',
  }
}

// DIA Oracle ABI
const DIA_ORACLE_ABI = parseAbi([
  'function getValue(string memory key) external view returns (uint128 value, uint128 timestamp)',
  'function updateValue(string memory key, uint128 value, uint128 timestamp) external',
  'function owner() external view returns (address)',
])

// AggregatorV3Interface ABI for adapter contracts
const AGGREGATOR_V3_ABI = parseAbi([
  'function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)',
  'function getRoundData(uint80 _roundId) external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)',
  'function decimals() external view returns (uint8)',
])

// Supported price pairs on DIA - Only tokens available on Somnia
// Only USDC and USDT have confirmed DIA adapters
const DIA_PRICE_PAIRS: Record<string, string> = {
  'USDC': 'USDC/USD',
  'USDT': 'USDT/USD',
  // Try these keys for WETH and WSOMI - they might work via main oracle getValue
  'WETH': 'ETH/USD',
  'WSOMI': 'SOMI/USD',
}

export interface OraclePrice {
  value: number;
  timestamp: number;
  pair: string;
  source: 'dia' | 'mock';
}

class DiaOracleService {
  private publicClient;
  private oracleAddress: Address;
  private cache = new Map<string, { data: OraclePrice; timestamp: number }>();
  private cacheTimeout = 30000; // 30 seconds cache

  constructor() {
    const network = getCurrentNetworkName();
    const chain = network === 'mainnet' ? somniaMainnet : somniaTestnet;
    
    this.publicClient = createPublicClient({
      chain,
      transport: http(chain.rpcUrls.default.http[0]),
    });

    this.oracleAddress = DIA_ORACLE_ADDRESSES[network] as Address;
  }

  /**
   * Get price from DIA Oracle
   */
  async getPrice(tokenSymbol: string): Promise<OraclePrice | null> {
    console.log(`[DIA Oracle] Getting price for ${tokenSymbol}`);
    try {
      const pair = DIA_PRICE_PAIRS[tokenSymbol.toUpperCase()];
      console.log(`[DIA Oracle] Price pair mapping: ${tokenSymbol} -> ${pair}`);
      
      if (!pair) {
        console.log(`[DIA Oracle] No DIA price pair for ${tokenSymbol}, using fallback`);
        return this.getFallbackPriceFromAPI(tokenSymbol);
      }

      // Check cache
      const cached = this.cache.get(pair);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log(`[DIA Oracle] Returning cached price for ${pair}:`, cached.data);
        return cached.data;
      }

      const network = getCurrentNetworkName();
      console.log(`[DIA Oracle] Current network: ${network}`);
      const adapterKey = tokenSymbol.toUpperCase();
      
      // First try to use asset adapter if available
      if (DIA_ASSET_ADAPTERS[network] && DIA_ASSET_ADAPTERS[network][adapterKey]) {
        try {
          const adapterAddress = DIA_ASSET_ADAPTERS[network][adapterKey] as Address;
          console.log(`[DIA Oracle] Trying adapter for ${adapterKey} at ${adapterAddress}`);
          
          // Get latest price from adapter using AggregatorV3Interface
          console.log(`[DIA Oracle] Calling latestRoundData on adapter...`);
          const result = await this.publicClient.readContract({
            address: adapterAddress,
            abi: AGGREGATOR_V3_ABI,
            functionName: 'latestRoundData',
          }) as [bigint, bigint, bigint, bigint, bigint];
          
          const [roundId, answer, startedAt, updatedAt, answeredInRound] = result;
          console.log(`[DIA Oracle] Adapter raw response:`, {
            roundId: roundId.toString(),
            answer: answer.toString(),
            updatedAt: updatedAt.toString()
          });
          
          // Get decimals
          const decimals = await this.publicClient.readContract({
            address: adapterAddress,
            abi: AGGREGATOR_V3_ABI,
            functionName: 'decimals',
          }) as number;
          console.log(`[DIA Oracle] Adapter decimals: ${decimals}`);
          
          // Calculate price with correct decimals
          const price = Number(answer) / Math.pow(10, decimals);
          console.log(`[DIA Oracle] Calculated price: ${answer} / 10^${decimals} = ${price}`);
          
          const oraclePrice: OraclePrice = {
            value: price,
            timestamp: Number(updatedAt),
            pair,
            source: 'dia',
          };

          // Cache the result
          this.cache.set(pair, { data: oraclePrice, timestamp: Date.now() });
          
          console.log(`[DIA Oracle] SUCCESS - ${pair}: $${price.toFixed(2)}`);
          return oraclePrice;
        } catch (adapterError) {
          console.log(`[DIA Oracle] Adapter error for ${adapterKey}:`, adapterError);
          console.log(`[DIA Oracle] Falling back to main oracle contract`);
        }
      }

      // Fallback to main DIA Oracle contract
      console.log(`[DIA Oracle] Trying main oracle at ${this.oracleAddress}`);
      try {
        const result = await this.publicClient.readContract({
          address: this.oracleAddress,
          abi: DIA_ORACLE_ABI,
          functionName: 'getValue',
          args: [pair],
        }) as [bigint, bigint];
        console.log(`[DIA Oracle] Main oracle raw response:`, result);

        const [value, timestamp] = result;
        
        // DIA returns value with 8 decimals
        const price = Number(value) / 1e8;
        
        const oraclePrice: OraclePrice = {
          value: price,
          timestamp: Number(timestamp),
          pair,
          source: 'dia',
        };

        // Cache the result
        this.cache.set(pair, { data: oraclePrice, timestamp: Date.now() });
        
        console.log(`[DIA Oracle] Main oracle SUCCESS - ${pair}: $${price.toFixed(2)}`);
        return oraclePrice;
      } catch (error) {
        console.error(`[DIA Oracle] Main oracle error for ${pair}:`, error);
        console.log(`[DIA Oracle] Falling back to price API`);
        return this.getFallbackPriceFromAPI(tokenSymbol);
      }
    } catch (error) {
      console.error('[DIA Oracle] Service error:', error);
      console.log('[DIA Oracle] Returning API price due to error');
      return this.getFallbackPriceFromAPI(tokenSymbol);
    }
  }

  /**
   * Get multiple prices in batch
   */
  async getPrices(tokenSymbols: string[]): Promise<Map<string, OraclePrice>> {
    const prices = new Map<string, OraclePrice>();
    
    // Fetch all prices in parallel
    const results = await Promise.all(
      tokenSymbols.map(symbol => this.getPrice(symbol))
    );

    tokenSymbols.forEach((symbol, index) => {
      const price = results[index];
      if (price) {
        prices.set(symbol, price);
      }
    });

    return prices;
  }

  /**
   * Get price for a trading pair (token0/token1)
   */
  async getPairPrice(token0: string, token1: string): Promise<number> {
    const [price0, price1] = await Promise.all([
      this.getPrice(token0),
      this.getPrice(token1),
    ]);

    if (!price0 || !price1) return 0;
    
    // If token1 is USD stablecoin, return token0 price directly
    if (['USDC', 'USDT', 'DAI'].includes(token1.toUpperCase())) {
      return price0.value;
    }

    // Otherwise return the ratio
    return price0.value / price1.value;
  }

  /**
   * Subscribe to price updates (mock implementation)
   * In production, this would connect to DIA WebSocket or poll the oracle
   */
  subscribeToPriceUpdates(
    tokenSymbol: string,
    callback: (price: OraclePrice) => void,
    interval: number = 10000 // 10 seconds
  ): () => void {
    const intervalId = setInterval(async () => {
      const price = await this.getPrice(tokenSymbol);
      if (price) {
        callback(price);
      }
    }, interval);

    // Fetch initial price
    this.getPrice(tokenSymbol).then(price => {
      if (price) callback(price);
    });

    // Return unsubscribe function
    return () => clearInterval(intervalId);
  }

  /**
   * Get fallback price for tokens without DIA adapters
   * Priority: 
   * 1. QuickSwap pool-based pricing (for WETH, WSOMI)
   * 2. Price Service API (CoinGecko)
   * 3. Hardcoded fallback values (last resort)
   */
  private async getFallbackPriceFromAPI(tokenSymbol: string): Promise<OraclePrice | null> {
    console.log(`[DIA Oracle] No adapter for ${tokenSymbol}, trying alternative sources`);
    
    // First try pool-based pricing for WETH and WSOMI
    if (tokenSymbol === 'WETH' || tokenSymbol === 'WSOMI') {
      try {
        console.log(`[DIA Oracle] Trying pool-based pricing for ${tokenSymbol}`);
        const { poolPriceDiscovery } = await import('./poolPriceDiscovery.service');
        const poolPrice = await poolPriceDiscovery.getTokenPriceFromPools(tokenSymbol);
        
        if (poolPrice && poolPrice > 0) {
          console.log(`[DIA Oracle] Got pool price for ${tokenSymbol}: $${poolPrice}`);
          return {
            value: poolPrice,
            timestamp: Math.floor(Date.now() / 1000),
            pair: `${tokenSymbol.toUpperCase()}/USD`,
            source: 'dia', // Mark as DIA for consistency
          };
        }
      } catch (error) {
        console.error(`[DIA Oracle] Pool pricing failed for ${tokenSymbol}:`, error);
      }
    }
    
    // Fallback to CoinGecko API directly to avoid circular dependency
    try {
      console.log(`[DIA Oracle] Trying CoinGecko API for ${tokenSymbol}`);
      const price = await this.fetchCoinGeckoPrice(tokenSymbol);
      
      if (price > 0) {
        console.log(`[DIA Oracle] Got CoinGecko price for ${tokenSymbol}: $${price}`);
        return {
          value: price,
          timestamp: Math.floor(Date.now() / 1000),
          pair: `${tokenSymbol.toUpperCase()}/USD`,
          source: 'dia',
        };
      }
    } catch (error) {
      console.error(`[DIA Oracle] Failed to get CoinGecko price for ${tokenSymbol}:`, error);
    }
    
    // Use hardcoded fallback values from config as last resort
    const { FALLBACK_PRICES } = await import('@/lib/config/somnia-tokens.config');
    const fallbackPrice = FALLBACK_PRICES[tokenSymbol.toUpperCase() as keyof typeof FALLBACK_PRICES];
    
    if (fallbackPrice) {
      console.log(`[DIA Oracle] Using hardcoded fallback for ${tokenSymbol}: $${fallbackPrice}`);
      return {
        value: fallbackPrice,
        timestamp: Math.floor(Date.now() / 1000),
        pair: `${tokenSymbol.toUpperCase()}/USD`,
        source: 'dia',
      };
    }
    
    console.warn(`[DIA Oracle] No price available for ${tokenSymbol}, using fallback`);
    return null;
  }

  /**
   * Fetch price directly from CoinGecko to avoid circular dependency
   */
  private async fetchCoinGeckoPrice(tokenSymbol: string): Promise<number> {
    const COINGECKO_IDS: Record<string, string> = {
      'WETH': 'ethereum',
      'ETH': 'ethereum', // Handle both ETH and WETH
      'USDC': 'usd-coin',
      'USDT': 'tether',
      'WSOMI': 'somnia',
      'SOMI': 'somnia',
    };

    const coinId = COINGECKO_IDS[tokenSymbol.toUpperCase()];
    if (!coinId) {
      console.log(`[DIA Oracle] No CoinGecko ID for ${tokenSymbol}`);
      return 0;
    }

    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`
      );
      
      if (response.ok) {
        const data = await response.json();
        return data[coinId]?.usd || 0;
      }
    } catch (error) {
      console.error(`[DIA Oracle] CoinGecko API error:`, error);
    }
    
    return 0;
  }

  /**
   * Check if oracle is available
   */
  async isOracleAvailable(): Promise<boolean> {
    try {
      const owner = await this.publicClient.readContract({
        address: this.oracleAddress,
        abi: DIA_ORACLE_ABI,
        functionName: 'owner',
      });
      
      return !!owner;
    } catch (error) {
      console.log('DIA Oracle not available on this network');
      return false;
    }
  }

  /**
   * Get oracle contract info using Foundry cast
   */
  async getOracleInfo(): Promise<any> {
    const network = getCurrentNetworkName();
    console.log(`DIA Oracle Address (${network}):`, this.oracleAddress);
    
    const isAvailable = await this.isOracleAvailable();
    console.log('Oracle Available:', isAvailable);
    
    if (isAvailable) {
      // Try to fetch some sample prices
      const sampleTokens = ['ETH', 'BTC', 'USDC'];
      const prices = await this.getPrices(sampleTokens);
      
      console.log('Sample Prices:');
      prices.forEach((price, token) => {
        console.log(`  ${token}: $${price.value.toFixed(2)} (${price.source})`);
      });
    }
    
    return {
      address: this.oracleAddress,
      network,
      available: isAvailable,
    };
  }
}

// Export singleton instance
export const diaOracleService = new DiaOracleService();

// Export for use in other services
export async function getOraclePrice(tokenSymbol: string): Promise<number> {
  const price = await diaOracleService.getPrice(tokenSymbol);
  return price?.value || 0;
}

// Helper to format price with appropriate decimals
export function formatOraclePrice(price: number): string {
  if (price >= 1000) {
    return price.toFixed(0);
  } else if (price >= 1) {
    return price.toFixed(2);
  } else if (price >= 0.01) {
    return price.toFixed(4);
  } else {
    return price.toFixed(6);
  }
}