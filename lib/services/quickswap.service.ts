/**
 * QuickSwap Service
 * Handles all interactions with QuickSwap Algebra V4 contracts on Somnia
 */

import { 
  createPublicClient, 
  createWalletClient,
  http, 
  type PublicClient,
  type WalletClient,
  type Address,
  type Hash,
  parseUnits,
  formatUnits,
  encodeFunctionData,
  decodeFunctionResult
} from 'viem';
import { privateKeyToAccount, type PrivateKeyAccount } from 'viem/accounts';
import { CONTRACTS, type NetworkConfig } from '../contracts/addresses';
import NonfungiblePositionManagerABI from '../abi/NonfungiblePositionManager.json';
import SwapRouterABI from '../abi/SwapRouter.json';
import FactoryABI from '../abi/Factory.json';
import PoolABI from '../abi/Pool.json';

import { somniaMainnet, somniaTestnet } from '../chains/somnia';

export interface Position {
  tokenId: bigint;
  token0: Address;
  token1: Address;
  tickLower: number;
  tickUpper: number;
  liquidity: bigint;
  feeGrowthInside0LastX128: bigint;
  feeGrowthInside1LastX128: bigint;
  tokensOwed0: bigint;
  tokensOwed1: bigint;
}

export interface Pool {
  address: Address;
  token0: Address;
  token1: Address;
  fee: number;
  tick: number;
  price: bigint;
  liquidity: bigint;
  tickSpacing: number;
}

export interface MintParams {
  token0: Address;
  token1: Address;
  tickLower: number;
  tickUpper: number;
  amount0Desired: bigint;
  amount1Desired: bigint;
  amount0Min: bigint;
  amount1Min: bigint;
  recipient: Address;
  deadline: bigint;
}

export class QuickSwapService {
  private publicClient: PublicClient;
  private walletClient?: WalletClient;
  private account?: PrivateKeyAccount;
  private config: typeof CONTRACTS.testnet | typeof CONTRACTS.mainnet;

  private getPositionManagerAddress(): Address {
    return ('nonfungiblePositionManager' in this.config 
      ? this.config.nonfungiblePositionManager 
      : (this.config as any).positionManager) as Address;
  }

  private getSwapRouterAddress(): Address {
    return ('swapRouter' in this.config 
      ? this.config.swapRouter 
      : (this.config as any).router) as Address;
  }

  private getFactoryAddress(): Address {
    return ('algebraFactory' in this.config 
      ? this.config.algebraFactory 
      : (this.config as any).factory) as Address;
  }

  constructor(
    network: 'testnet' | 'mainnet' = 'testnet',
    privateKey?: string
  ) {
    const chain = network === 'testnet' ? somniaTestnet : somniaMainnet;
    this.config = CONTRACTS[network];

    // Create public client for reading
    this.publicClient = createPublicClient({
      chain,
      transport: http(),
    });

    // Create wallet client if private key provided
    if (privateKey) {
      this.account = privateKeyToAccount(privateKey as `0x${string}`);
      this.walletClient = createWalletClient({
        account: this.account,
        chain,
        transport: http(),
      });
    }
  }

  /**
   * Get all positions for a user
   */
  async getUserPositions(userAddress: Address): Promise<Position[]> {
    try {
      // Get balance of NFTs
      const balance = await this.publicClient.readContract({
        address: this.getPositionManagerAddress(),
        abi: NonfungiblePositionManagerABI.abi,
        functionName: 'balanceOf',
        args: [userAddress],
      });

      const positions: Position[] = [];
      
      // Get each position
      for (let i = 0; i < Number(balance); i++) {
        const tokenId = await this.publicClient.readContract({
          address: this.getPositionManagerAddress(),
          abi: NonfungiblePositionManagerABI.abi,
          functionName: 'tokenOfOwnerByIndex',
          args: [userAddress, BigInt(i)],
        });

        const position = await this.getPosition(tokenId as bigint);
        if (position) {
          positions.push({ ...position, tokenId: tokenId as bigint });
        }
      }

      return positions;
    } catch (error) {
      console.error('Error fetching user positions:', error);
      return [];
    }
  }

  /**
   * Get position details by token ID
   */
  async getPosition(tokenId: bigint): Promise<Position | null> {
    try {
      const result = await this.publicClient.readContract({
        address: this.getPositionManagerAddress(),
        abi: NonfungiblePositionManagerABI.abi,
        functionName: 'positions',
        args: [tokenId],
      });

      // Parse result based on ABI output
      const [
        nonce,
        operator,
        poolId,
        tickLower,
        tickUpper,
        liquidity,
        feeGrowthInside0LastX128,
        feeGrowthInside1LastX128,
        tokensOwed0,
        tokensOwed1
      ] = result as any[];

      // Get pool address to fetch tokens
      // Note: This would need the actual pool address lookup
      // For now, returning basic position data
      return {
        tokenId,
        token0: '0x0000000000000000000000000000000000000000' as Address,
        token1: '0x0000000000000000000000000000000000000000' as Address,
        tickLower: Number(tickLower),
        tickUpper: Number(tickUpper),
        liquidity: liquidity as bigint,
        feeGrowthInside0LastX128: feeGrowthInside0LastX128 as bigint,
        feeGrowthInside1LastX128: feeGrowthInside1LastX128 as bigint,
        tokensOwed0: tokensOwed0 as bigint,
        tokensOwed1: tokensOwed1 as bigint,
      };
    } catch (error) {
      console.error('Error fetching position:', error);
      return null;
    }
  }

  /**
   * Get pool information
   */
  async getPool(token0: Address, token1: Address): Promise<Pool | null> {
    try {
      // Get pool address from factory
      const poolAddress = await this.publicClient.readContract({
        address: this.getFactoryAddress(),
        abi: FactoryABI.abi,
        functionName: 'poolByPair',
        args: [token0, token1],
      });

      if (!poolAddress || poolAddress === '0x0000000000000000000000000000000000000000') {
        return null;
      }

      // Get pool state
      const globalState = await this.publicClient.readContract({
        address: poolAddress as Address,
        abi: PoolABI.abi,
        functionName: 'globalState',
      });

      const [price, tick, fee] = globalState as any[];

      // Get liquidity
      const liquidity = await this.publicClient.readContract({
        address: poolAddress as Address,
        abi: PoolABI.abi,
        functionName: 'liquidity',
      });

      // Get tick spacing
      const tickSpacing = await this.publicClient.readContract({
        address: poolAddress as Address,
        abi: PoolABI.abi,
        functionName: 'tickSpacing',
      });

      return {
        address: poolAddress as Address,
        token0,
        token1,
        fee: Number(fee),
        tick: Number(tick),
        price: price as bigint,
        liquidity: liquidity as bigint,
        tickSpacing: Number(tickSpacing),
      };
    } catch (error) {
      console.error('Error fetching pool:', error);
      return null;
    }
  }

  /**
   * Create a new liquidity position
   */
  async mintPosition(params: MintParams): Promise<Hash | null> {
    if (!this.walletClient || !this.account) {
      throw new Error('Wallet not initialized');
    }

    try {
      const { request } = await this.publicClient.simulateContract({
        account: this.account,
        address: this.getPositionManagerAddress(),
        abi: NonfungiblePositionManagerABI.abi,
        functionName: 'mint',
        args: [params],
      });

      const hash = await this.walletClient.writeContract(request);
      return hash;
    } catch (error) {
      console.error('Error minting position:', error);
      return null;
    }
  }

  /**
   * Add liquidity to existing position
   */
  async increaseLiquidity(
    tokenId: bigint,
    amount0Desired: bigint,
    amount1Desired: bigint,
    amount0Min: bigint,
    amount1Min: bigint,
    deadline: bigint
  ): Promise<Hash | null> {
    if (!this.walletClient || !this.account) {
      throw new Error('Wallet not initialized');
    }

    try {
      const params = {
        tokenId,
        amount0Desired,
        amount1Desired,
        amount0Min,
        amount1Min,
        deadline,
      };

      const { request } = await this.publicClient.simulateContract({
        account: this.account,
        address: this.getPositionManagerAddress(),
        abi: NonfungiblePositionManagerABI.abi,
        functionName: 'increaseLiquidity',
        args: [params],
      });

      const hash = await this.walletClient.writeContract(request);
      return hash;
    } catch (error) {
      console.error('Error increasing liquidity:', error);
      return null;
    }
  }

  /**
   * Remove liquidity from position
   */
  async decreaseLiquidity(
    tokenId: bigint,
    liquidity: bigint,
    amount0Min: bigint,
    amount1Min: bigint,
    deadline: bigint
  ): Promise<Hash | null> {
    if (!this.walletClient || !this.account) {
      throw new Error('Wallet not initialized');
    }

    try {
      const params = {
        tokenId,
        liquidity,
        amount0Min,
        amount1Min,
        deadline,
      };

      const { request } = await this.publicClient.simulateContract({
        account: this.account,
        address: this.getPositionManagerAddress(),
        abi: NonfungiblePositionManagerABI.abi,
        functionName: 'decreaseLiquidity',
        args: [params],
      });

      const hash = await this.walletClient.writeContract(request);
      return hash;
    } catch (error) {
      console.error('Error decreasing liquidity:', error);
      return null;
    }
  }

  /**
   * Collect fees from position
   */
  async collectFees(
    tokenId: bigint,
    recipient: Address
  ): Promise<Hash | null> {
    if (!this.walletClient || !this.account) {
      throw new Error('Wallet not initialized');
    }

    try {
      const params = {
        tokenId,
        recipient,
        amount0Max: BigInt(2) ** BigInt(128) - BigInt(1), // Max uint128
        amount1Max: BigInt(2) ** BigInt(128) - BigInt(1), // Max uint128
      };

      const { request } = await this.publicClient.simulateContract({
        account: this.account,
        address: this.getPositionManagerAddress(),
        abi: NonfungiblePositionManagerABI.abi,
        functionName: 'collect',
        args: [params],
      });

      const hash = await this.walletClient.writeContract(request);
      return hash;
    } catch (error) {
      console.error('Error collecting fees:', error);
      return null;
    }
  }

  /**
   * Execute a swap
   */
  async swap(
    tokenIn: Address,
    tokenOut: Address,
    amountIn: bigint,
    amountOutMinimum: bigint,
    recipient: Address,
    deadline: bigint
  ): Promise<Hash | null> {
    if (!this.walletClient || !this.account) {
      throw new Error('Wallet not initialized');
    }

    try {
      const params = {
        tokenIn,
        tokenOut,
        recipient,
        deadline,
        amountIn,
        amountOutMinimum,
        limitSqrtPrice: BigInt(0),
      };

      const { request } = await this.publicClient.simulateContract({
        account: this.account,
        address: this.getSwapRouterAddress(),
        abi: SwapRouterABI.abi,
        functionName: 'exactInputSingle',
        args: [params],
      });

      const hash = await this.walletClient.writeContract(request);
      return hash;
    } catch (error) {
      console.error('Error executing swap:', error);
      return null;
    }
  }
}