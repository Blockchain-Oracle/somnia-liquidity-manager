/**
 * QuickSwap V4 (Algebra) Service
 * Fetches real liquidity data from QuickSwap V4 on Somnia mainnet
 */

import { ethers } from 'ethers';

// Somnia Mainnet QuickSwap V4 Addresses
const CONTRACTS = {
  AlgebraFactory: '0x0ccff3D02A3a200263eC4e0Fdb5E60a56721B8Ae',
  QuoterV2: '0xcB68373404a835268D3ED76255C8148578A82b77',
  NonfungiblePositionManager: '0xfE02219e0578B1E4831CDE7C3CB36f71AEb4A833',
  WETH: '0x936Ab8C674bcb567CD5dEB85D8A216494704E9D8',
  USDC: '0x28BEc7E30E6faee657a03e19Bf1128AaD7632A00',
  USDT: '0x67B302E35Aef5EEE8c32D934F5856869EF428330',
  WSOMI: '0x046EDe9564A72571df6F5e44d0405360c0f4dCab',
};

// Simplified ABIs for the contracts we need
const FACTORY_ABI = [
  'function poolByPair(address tokenA, address tokenB) view returns (address pool)',
];

const POOL_ABI = [
  // Use the proper Algebra V4 interface
  'function safelyGetStateOfAMM() view returns (uint160 sqrtPrice, int24 tick, uint16 lastFee, uint8 pluginConfig, uint128 activeLiquidity, int24 nextTick, int24 previousTick)',
  'function getReserves() view returns (uint128 reserve0, uint128 reserve1)',
  'function liquidity() view returns (uint128)',
  'function fee() view returns (uint16 currentFee)',
  'function token0() view returns (address)',
  'function token1() view returns (address)',
  'function tickSpacing() view returns (int24)',
];

const ERC20_ABI = [
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function balanceOf(address) view returns (uint256)',
];

export interface PoolData {
  address: string;
  liquidity: string;
  sqrtPriceX96: string;
  tick: number;
  token0: string;
  token1: string;
  tvlUSD: number;
  token0Reserve: number;
  token1Reserve: number;
  fee: number;
}

class QuickSwapV4Service {
  private provider: ethers.JsonRpcProvider;
  private factory: ethers.Contract;
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTimeout = 60000; // 1 minute

  constructor() {
    // Initialize provider with Somnia mainnet RPC
    this.provider = new ethers.JsonRpcProvider('https://api.infra.mainnet.somnia.network/');
    this.factory = new ethers.Contract(CONTRACTS.AlgebraFactory, FACTORY_ABI, this.provider);
  }

  /**
   * Get pool address for a token pair
   */
  async getPoolAddress(token0: string, token1: string): Promise<string | null> {
    try {
      const poolAddress = await this.factory.poolByPair(token0, token1);
      if (poolAddress === ethers.ZeroAddress) {
        return null;
      }
      return poolAddress;
    } catch (error) {
      console.error('Error getting pool address:', error);
      return null;
    }
  }

  /**
   * Get pool data including liquidity and reserves
   */
  async getPoolData(token0Symbol: string, token1Symbol: string): Promise<PoolData | null> {
    const cacheKey = `${token0Symbol}-${token1Symbol}`;
    
    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      // Map symbols to addresses
      const token0Address = this.getTokenAddress(token0Symbol);
      const token1Address = this.getTokenAddress(token1Symbol);
      
      if (!token0Address || !token1Address) {
        console.log(`[QuickSwapV4] Unknown tokens: ${token0Symbol} or ${token1Symbol}`);
        return null;
      }

      // Get pool address
      const poolAddress = await this.getPoolAddress(token0Address, token1Address);
      if (!poolAddress) {
        console.log(`[QuickSwapV4] No pool found for ${token0Symbol}/${token1Symbol}`);
        return null;
      }

      console.log(`[QuickSwapV4] Found pool at ${poolAddress} for ${token0Symbol}/${token1Symbol}`);

      // Get pool contract
      const pool = new ethers.Contract(poolAddress, POOL_ABI, this.provider);

      // Fetch pool data using proper Algebra V4 methods
      const [
        safeState,
        reserves,
        actualToken0,
        actualToken1,
        currentFee
      ] = await Promise.all([
        pool.safelyGetStateOfAMM(),
        pool.getReserves(),
        pool.token0(),
        pool.token1(),
        pool.fee()
      ]);

      // Destructure the safe state
      const [sqrtPrice, tick, lastFee, pluginConfig, activeLiquidity] = safeState;
      const [reserve0, reserve1] = reserves;

      // Get token contracts for decimals
      const token0Contract = new ethers.Contract(actualToken0, ERC20_ABI, this.provider);
      const token1Contract = new ethers.Contract(actualToken1, ERC20_ABI, this.provider);

      const [decimals0, decimals1] = await Promise.all([
        token0Contract.decimals(),
        token1Contract.decimals(),
      ]);

      // Calculate reserves from the getReserves() method
      const token0Reserve = Number(ethers.formatUnits(reserve0, decimals0));
      const token1Reserve = Number(ethers.formatUnits(reserve1, decimals1));

      // Get real prices for accurate TVL calculation
      const [token0Price, token1Price] = await Promise.all([
        this.getTokenPrice(token0Symbol),
        this.getTokenPrice(token1Symbol)
      ]);
      
      const tvlUSD = (token0Reserve * token0Price) + (token1Reserve * token1Price);

      const poolData: PoolData = {
        address: poolAddress,
        liquidity: activeLiquidity.toString(),
        sqrtPriceX96: sqrtPrice.toString(),
        tick: Number(tick),
        token0: actualToken0,
        token1: actualToken1,
        tvlUSD,
        token0Reserve,
        token1Reserve,
        fee: Number(currentFee) / 10000, // Convert from hundredths of a bip to percentage
      };

      console.log(`[QuickSwapV4] Pool data:`, {
        pair: `${token0Symbol}/${token1Symbol}`,
        activeLiquidity: poolData.liquidity,
        tvl: `$${tvlUSD.toFixed(2)}`,
        reserves: `${token0Reserve.toFixed(4)} ${token0Symbol}, ${token1Reserve.toFixed(4)} ${token1Symbol}`,
        fee: `${poolData.fee}%`,
        tick: tick.toString(),
      });

      // Cache the result
      this.cache.set(cacheKey, { data: poolData, timestamp: Date.now() });

      return poolData;
    } catch (error) {
      console.error('[QuickSwapV4] Error fetching pool data:', error);
      return null;
    }
  }

  /**
   * Map token symbol to address
   */
  private getTokenAddress(symbol: string): string | null {
    const tokenMap: Record<string, string> = {
      'ETH': CONTRACTS.WETH,
      'WETH': CONTRACTS.WETH,
      'USDC': CONTRACTS.USDC,
      'USDT': CONTRACTS.USDT,
      'SOMI': CONTRACTS.WSOMI,
      'WSOMI': CONTRACTS.WSOMI,
    };
    return tokenMap[symbol.toUpperCase()] || null;
  }

  /**
   * Get real token price from price service
   */
  private async getTokenPrice(token: string): Promise<number> {
    // Map WETH to ETH for price fetching since they have same value
    const priceToken = token.toUpperCase() === 'WETH' ? 'ETH' : token;
    
    // Get real price from price service
    const { priceService } = await import('./priceService');
    const priceData = await priceService.getCurrentPrice(priceToken);
    
    if (!priceData || priceData.price <= 0) {
      console.error(`[QuickSwapV4] Failed to get price for ${token}`);
      throw new Error(`No price data available for ${token}`);
    }
    
    console.log(`[QuickSwapV4] Got price for ${token}: $${priceData.price}`);
    return priceData.price;
  }

  /**
   * Calculate price from sqrtPriceX96
   */
  calculatePrice(sqrtPriceX96: bigint, decimals0: number, decimals1: number): number {
    const Q96 = 2n ** 96n;
    const price = (Number(sqrtPriceX96) / Number(Q96)) ** 2;
    const decimalAdjustment = 10 ** (decimals1 - decimals0);
    return price * decimalAdjustment;
  }

  /**
   * Get all available pools
   */
  async getAvailablePools(): Promise<Array<{ token0: string; token1: string; address: string }>> {
    const pairs = [
      ['WETH', 'USDC'],
      ['WETH', 'USDT'],
      ['USDC', 'USDT'],
      ['SOMI', 'USDC'],
      ['SOMI', 'WETH'],
    ];

    const pools = [];
    for (const [token0, token1] of pairs) {
      const token0Address = this.getTokenAddress(token0);
      const token1Address = this.getTokenAddress(token1);
      
      if (token0Address && token1Address) {
        const address = await this.getPoolAddress(token0Address, token1Address);
        if (address) {
          pools.push({ token0, token1, address });
        }
      }
    }

    return pools;
  }
}

export const quickswapV4Service = new QuickSwapV4Service();