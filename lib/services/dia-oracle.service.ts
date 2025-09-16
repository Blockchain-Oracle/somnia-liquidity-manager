/**
 * DIA Oracle Service
 * Integrates with DIA price feeds on Somnia
 * Provides real-time on-chain price data for trading decisions
 */

import { createPublicClient, http, type Address } from 'viem';
import { getCurrentNetwork, getCurrentNetworkName } from '../config/networks.config';
import { somniaMainnet, somniaTestnet } from '../chains/somnia';

// DIA Oracle V2 Interface ABI
const DIA_ORACLE_ABI = [
  {
    inputs: [{ name: 'key', type: 'string' }],
    name: 'getValue',
    outputs: [
      { name: 'price', type: 'uint128' },
      { name: 'timestamp', type: 'uint128' }
    ],
    stateMutability: 'view',
    type: 'function'
  }
] as const;

// AggregatorV3Interface for adapter contracts
const AGGREGATOR_V3_ABI = [
  {
    inputs: [],
    name: 'latestRoundData',
    outputs: [
      { name: 'roundId', type: 'uint80' },
      { name: 'answer', type: 'int256' },
      { name: 'startedAt', type: 'uint256' },
      { name: 'updatedAt', type: 'uint256' },
      { name: 'answeredInRound', type: 'uint80' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ type: 'uint8' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const;

export interface PriceData {
  asset: string;
  price: number;
  priceWei: bigint;
  timestamp: number;
  formattedTime: string;
  isStale: boolean;
  source: 'DIA' | 'ADAPTER';
}

export interface OracleHealth {
  isConnected: boolean;
  lastUpdate: number;
  staleness: number; // seconds since last update
  network: 'mainnet' | 'testnet';
  availableAssets: string[];
}

export class DIAOracleService {
  private publicClient: any;
  private oracleAddress: Address | null = null;
  private adapters: Record<string, Address> = {};
  private readonly STALENESS_THRESHOLD = 3600; // 1 hour in seconds
  private readonly HEARTBEAT = 86400; // 24 hours

  constructor() {
    this.initialize();
  }

  /**
   * Initialize oracle based on current network
   */
  private initialize() {
    const config = getCurrentNetwork();
    const chain = getCurrentNetworkName() === 'mainnet' ? somniaMainnet : somniaTestnet;
    
    this.publicClient = createPublicClient({
      chain,
      transport: http(config.rpcUrl),
    });

    if (config.contracts.diaOracle) {
      this.oracleAddress = config.contracts.diaOracle.mainOracle as Address;
      this.adapters = config.contracts.diaOracle.adapters as Record<string, Address>;
      console.log(`📊 DIA Oracle initialized on ${config.name}`);
    } else {
      console.warn('⚠️ DIA Oracle not configured for this network');
    }
  }

  /**
   * Get price from main oracle using key
   */
  async getPrice(key: string): Promise<PriceData | null> {
    if (!this.oracleAddress) {
      console.error('Oracle not initialized');
      return null;
    }

    try {
      const [price, timestamp] = await this.publicClient.readContract({
        address: this.oracleAddress,
        abi: DIA_ORACLE_ABI,
        functionName: 'getValue',
        args: [key],
      });

      const now = Math.floor(Date.now() / 1000);
      const isStale = (now - Number(timestamp)) > this.STALENESS_THRESHOLD;

      return {
        asset: key,
        price: Number(price) / 1e8, // DIA uses 8 decimals
        priceWei: price,
        timestamp: Number(timestamp),
        formattedTime: new Date(Number(timestamp) * 1000).toLocaleString(),
        isStale,
        source: 'DIA'
      };
    } catch (error) {
      console.error(`Error fetching price for ${key}:`, error);
      return null;
    }
  }

  /**
   * Get price from adapter contract (Chainlink compatible interface)
   */
  async getPriceFromAdapter(asset: 'USDT' | 'USDC' | 'BTC' | 'ARB' | 'SOL'): Promise<PriceData | null> {
    const adapterAddress = this.adapters[asset];
    if (!adapterAddress) {
      console.error(`No adapter found for ${asset}`);
      return null;
    }

    try {
      // Get latest round data
      const [roundId, answer, startedAt, updatedAt, answeredInRound] = 
        await this.publicClient.readContract({
          address: adapterAddress,
          abi: AGGREGATOR_V3_ABI,
          functionName: 'latestRoundData',
        });

      // Get decimals
      const decimals = await this.publicClient.readContract({
        address: adapterAddress,
        abi: AGGREGATOR_V3_ABI,
        functionName: 'decimals',
      });

      const price = Number(answer) / (10 ** Number(decimals));
      const now = Math.floor(Date.now() / 1000);
      const isStale = (now - Number(updatedAt)) > this.STALENESS_THRESHOLD;

      return {
        asset,
        price,
        priceWei: answer,
        timestamp: Number(updatedAt),
        formattedTime: new Date(Number(updatedAt) * 1000).toLocaleString(),
        isStale,
        source: 'ADAPTER'
      };
    } catch (error) {
      console.error(`Error fetching price from adapter for ${asset}:`, error);
      return null;
    }
  }

  /**
   * Get multiple asset prices
   */
  async getMultiplePrices(assets: string[]): Promise<Record<string, PriceData | null>> {
    const prices: Record<string, PriceData | null> = {};
    
    await Promise.all(
      assets.map(async (asset) => {
        // Try adapter first if available
        if (this.adapters[asset]) {
          prices[asset] = await this.getPriceFromAdapter(asset as any);
        } else {
          // Fall back to main oracle
          prices[asset] = await this.getPrice(asset);
        }
      })
    );

    return prices;
  }

  /**
   * Calculate price impact based on oracle prices
   */
  async calculatePriceImpact(
    tokenIn: string,
    tokenOut: string,
    amountIn: number,
    dexPrice: number
  ): Promise<{
    oraclePrice: number;
    dexPrice: number;
    impact: number;
    arbitrageOpportunity: boolean;
  } | null> {
    const [priceIn, priceOut] = await Promise.all([
      this.getPrice(tokenIn),
      this.getPrice(tokenOut)
    ]);

    if (!priceIn || !priceOut) {
      return null;
    }

    const oraclePrice = priceOut.price / priceIn.price;
    const impact = ((dexPrice - oraclePrice) / oraclePrice) * 100;
    
    // Arbitrage opportunity if price difference > 1%
    const arbitrageOpportunity = Math.abs(impact) > 1;

    return {
      oraclePrice,
      dexPrice,
      impact,
      arbitrageOpportunity
    };
  }

  /**
   * Get oracle health status
   */
  async getOracleHealth(): Promise<OracleHealth> {
    const config = getCurrentNetwork();
    const availableAssets = Object.keys(this.adapters);
    
    // Test connection with BTC price
    const testPrice = await this.getPriceFromAdapter('BTC');
    const now = Math.floor(Date.now() / 1000);
    
    return {
      isConnected: testPrice !== null,
      lastUpdate: testPrice?.timestamp || 0,
      staleness: testPrice ? now - testPrice.timestamp : Infinity,
      network: getCurrentNetworkName(),
      availableAssets
    };
  }

  /**
   * Check if price is within acceptable deviation
   */
  isPriceValid(price: PriceData, maxAge: number = 3600): boolean {
    const now = Math.floor(Date.now() / 1000);
    const age = now - price.timestamp;
    return age <= maxAge && !price.isStale;
  }

  /**
   * Get price with staleness check
   */
  async getPriceIfNotOlderThan(
    key: string,
    maxAge: number
  ): Promise<{ price: PriceData | null; valid: boolean }> {
    const price = await this.getPrice(key);
    
    if (!price) {
      return { price: null, valid: false };
    }

    const valid = this.isPriceValid(price, maxAge);
    return { price, valid };
  }

  /**
   * Calculate TWAP (Time-Weighted Average Price)
   * Note: This would require historical data from subgraph
   */
  async calculateTWAP(
    asset: string,
    period: number // in seconds
  ): Promise<number | null> {
    // For now, return current price
    // In production, this would query historical prices from subgraph
    const currentPrice = await this.getPrice(asset);
    return currentPrice?.price || null;
  }

  /**
   * Monitor price feeds for alerts
   */
  async monitorPriceFeeds(
    assets: string[],
    callback: (asset: string, price: PriceData) => void
  ): Promise<NodeJS.Timer> {
    // Check prices every 30 seconds
    const interval = setInterval(async () => {
      for (const asset of assets) {
        const price = await this.getPrice(asset);
        if (price && !price.isStale) {
          callback(asset, price);
        }
      }
    }, 30000);

    return interval;
  }
}