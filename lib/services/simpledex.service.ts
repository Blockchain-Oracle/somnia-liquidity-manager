/**
 * SimpleDEX Service
 * Interacts with our deployed SimpleLiquidityPool contract
 */

import { createPublicClient, createWalletClient, http, type Address, type Hash, parseEther, parseUnits, formatEther, formatUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { somniaTestnet } from '../chains/somnia';
import { TESTNET_CONFIG } from '../config/networks.config';
import * as fs from 'fs';
import * as path from 'path';

// Load deployment info
function getDeploymentInfo() {
  const deploymentPath = path.join(process.cwd(), 'deployments', 'testnet.json');
  if (!fs.existsSync(deploymentPath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
}

// Contract ABIs
const ERC20_ABI = [
  {
    inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }],
    name: 'approve',
    outputs: [{ type: 'bool' }],
    type: 'function',
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ type: 'uint256' }],
    type: 'function',
  },
  {
    inputs: [],
    name: 'faucet',
    outputs: [],
    type: 'function',
  },
  {
    inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }],
    name: 'mint',
    outputs: [],
    type: 'function',
  },
] as const;

const POOL_ABI = [
  {
    inputs: [{ name: 'amount0', type: 'uint256' }, { name: 'amount1', type: 'uint256' }],
    name: 'addLiquidity',
    outputs: [{ name: 'liquidity', type: 'uint256' }],
    type: 'function',
  },
  {
    inputs: [{ name: 'liquidity', type: 'uint256' }],
    name: 'removeLiquidity',
    outputs: [{ name: 'amount0', type: 'uint256' }, { name: 'amount1', type: 'uint256' }],
    type: 'function',
  },
  {
    inputs: [{ name: 'amountIn', type: 'uint256' }, { name: 'zeroForOne', type: 'bool' }],
    name: 'swap',
    outputs: [{ name: 'amountOut', type: 'uint256' }],
    type: 'function',
  },
  {
    inputs: [{ name: 'amountIn', type: 'uint256' }, { name: 'zeroForOne', type: 'bool' }],
    name: 'getAmountOut',
    outputs: [{ type: 'uint256' }],
    type: 'function',
  },
  {
    inputs: [],
    name: 'reserve0',
    outputs: [{ type: 'uint256' }],
    type: 'function',
  },
  {
    inputs: [],
    name: 'reserve1',
    outputs: [{ type: 'uint256' }],
    type: 'function',
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ type: 'uint256' }],
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ type: 'uint256' }],
    type: 'function',
  },
] as const;

export interface SimpleDEXPool {
  address: Address;
  token0: Address;
  token1: Address;
  reserve0: bigint;
  reserve1: bigint;
  totalSupply: bigint;
  price: number;
}

export interface SimpleDEXPosition {
  poolAddress: Address;
  liquidity: bigint;
  share: number; // Percentage of pool
  value0: bigint;
  value1: bigint;
}

export class SimpleDEXService {
  private publicClient;
  private walletClient;
  private deployment: any;

  constructor() {
    this.publicClient = createPublicClient({
      chain: somniaTestnet,
      transport: http('https://dream-rpc.somnia.network'),
    });

    // Setup wallet client if private key is available
    const privateKey = process.env.PRIVATE_KEY;
    if (privateKey) {
      const account = privateKeyToAccount(privateKey as `0x${string}`);
      this.walletClient = createWalletClient({
        account,
        chain: somniaTestnet,
        transport: http('https://dream-rpc.somnia.network'),
      });
    }

    // Load deployment info (fallback to TESTNET_CONFIG if not present/incompatible)
    const fileDeployment = getDeploymentInfo() as any;
    if (fileDeployment && fileDeployment.contracts) {
      this.deployment = fileDeployment;
    } else if (TESTNET_CONFIG.contracts.simpledex) {
      this.deployment = {
        contracts: {
          pool: TESTNET_CONFIG.contracts.simpledex.pool,
          wsomi: TESTNET_CONFIG.contracts.simpledex.wsomi,
          usdc: TESTNET_CONFIG.contracts.simpledex.usdc,
        }
      };
    } else {
      this.deployment = null;
    }
  }

  /**
   * Get pool information
   */
  async getPool(): Promise<SimpleDEXPool | null> {
    if (!this.deployment || !this.deployment.contracts) {
      console.log('SimpleDEX not configured on testnet.');
      return null;
    }

    try {
      const poolAddress = this.deployment.contracts.pool as Address;
      
      // Get reserves
      const [reserve0, reserve1, totalSupply] = await Promise.all([
        this.publicClient.readContract({
          address: poolAddress,
          abi: POOL_ABI,
          functionName: 'reserve0',
        }),
        this.publicClient.readContract({
          address: poolAddress,
          abi: POOL_ABI,
          functionName: 'reserve1',
        }),
        this.publicClient.readContract({
          address: poolAddress,
          abi: POOL_ABI,
          functionName: 'totalSupply',
        }),
      ]) as unknown as [bigint, bigint, bigint];

      // Calculate price (WSOMI/USDC)
      const price = reserve0 > BigInt(0) 
        ? Number(reserve1) * 1e12 / Number(reserve0) // Adjust for decimal difference (18 - 6)
        : 0;

      return {
        address: poolAddress,
        token0: this.deployment.contracts.wsomi,
        token1: this.deployment.contracts.usdc,
        reserve0,
        reserve1,
        totalSupply,
        price,
      };
    } catch (error) {
      console.error('Error fetching pool:', error);
      return null;
    }
  }

  /**
   * Get user's position in the pool
   */
  async getUserPosition(userAddress: Address): Promise<SimpleDEXPosition | null> {
    if (!this.deployment) return null;

    try {
      const poolAddress = this.deployment.contracts.pool as Address;
      const pool = await this.getPool();
      if (!pool) return null;

      const liquidity = await this.publicClient.readContract({
        address: poolAddress,
        abi: POOL_ABI,
        functionName: 'balanceOf',
        args: [userAddress],
      }) as unknown as bigint;

      if (liquidity === BigInt(0)) return null;

      // Calculate share and values
      const share = pool.totalSupply > BigInt(0) 
        ? Number(liquidity) / Number(pool.totalSupply) 
        : 0;

      const value0 = pool.reserve0 * liquidity / pool.totalSupply;
      const value1 = pool.reserve1 * liquidity / pool.totalSupply;

      return {
        poolAddress,
        liquidity,
        share: share * 100, // As percentage
        value0,
        value1,
      };
    } catch (error) {
      console.error('Error fetching position:', error);
      return null;
    }
  }

  /**
   * Add liquidity to the pool
   */
  async addLiquidity(amount0: string, amount1: string): Promise<Hash | null> {
    if (!this.walletClient || !this.deployment) return null;

    try {
      const poolAddress = this.deployment.contracts.pool as Address;
      const wsomiAddress = this.deployment.contracts.wsomi as Address;
      const usdcAddress = this.deployment.contracts.usdc as Address;

      // Parse amounts
      const amount0Wei = parseEther(amount0);
      const amount1Wei = parseUnits(amount1, 6);

      // Approve tokens
      await this.walletClient.writeContract({
        address: wsomiAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [poolAddress, amount0Wei],
      });

      await this.walletClient.writeContract({
        address: usdcAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [poolAddress, amount1Wei],
      });

      // Add liquidity
      const hash = await this.walletClient.writeContract({
        address: poolAddress,
        abi: POOL_ABI,
        functionName: 'addLiquidity',
        args: [amount0Wei, amount1Wei],
      });

      return hash;
    } catch (error) {
      console.error('Error adding liquidity:', error);
      return null;
    }
  }

  /**
   * Remove liquidity from the pool
   */
  async removeLiquidity(liquidityAmount: string): Promise<Hash | null> {
    if (!this.walletClient || !this.deployment) return null;

    try {
      const poolAddress = this.deployment.contracts.pool as Address;
      const liquidity = parseEther(liquidityAmount);

      const hash = await this.walletClient.writeContract({
        address: poolAddress,
        abi: POOL_ABI,
        functionName: 'removeLiquidity',
        args: [liquidity],
      });

      return hash;
    } catch (error) {
      console.error('Error removing liquidity:', error);
      return null;
    }
  }

  /**
   * Swap tokens
   */
  async swap(amountIn: string, zeroForOne: boolean): Promise<Hash | null> {
    if (!this.walletClient || !this.deployment) return null;

    try {
      const poolAddress = this.deployment.contracts.pool as Address;
      const tokenAddress = zeroForOne 
        ? this.deployment.contracts.wsomi as Address
        : this.deployment.contracts.usdc as Address;
      
      const amount = zeroForOne 
        ? parseEther(amountIn)
        : parseUnits(amountIn, 6);

      // Approve token
      await this.walletClient.writeContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [poolAddress, amount],
      });

      // Execute swap
      const hash = await this.walletClient.writeContract({
        address: poolAddress,
        abi: POOL_ABI,
        functionName: 'swap',
        args: [amount, zeroForOne],
      });

      return hash;
    } catch (error) {
      console.error('Error swapping:', error);
      return null;
    }
  }

  /**
   * Get quote for swap
   */
  async getQuote(amountIn: string, zeroForOne: boolean): Promise<string | null> {
    if (!this.deployment) return null;

    try {
      const poolAddress = this.deployment.contracts.pool as Address;
      const amount = zeroForOne 
        ? parseEther(amountIn)
        : parseUnits(amountIn, 6);

      const amountOut = await this.publicClient.readContract({
        address: poolAddress,
        abi: POOL_ABI,
        functionName: 'getAmountOut',
        args: [amount, zeroForOne],
      }) as unknown as bigint;

      return zeroForOne 
        ? formatUnits(amountOut, 6)
        : formatEther(amountOut);
    } catch (error) {
      console.error('Error getting quote:', error);
      return null;
    }
  }

  /**
   * Get testnet tokens from faucet
   */
  async getFaucetTokens(userAddress: Address): Promise<{ wsomi: Hash | null; usdc: Hash | null }> {
    if (!this.walletClient || !this.deployment) {
      return { wsomi: null, usdc: null };
    }

    try {
      const wsomiHash = await this.walletClient.writeContract({
        address: this.deployment.contracts.wsomi,
        abi: ERC20_ABI,
        functionName: 'faucet',
      });

      const usdcHash = await this.walletClient.writeContract({
        address: this.deployment.contracts.usdc,
        abi: ERC20_ABI,
        functionName: 'faucet',
      });

      return { wsomi: wsomiHash, usdc: usdcHash };
    } catch (error) {
      console.error('Error getting faucet tokens:', error);
      return { wsomi: null, usdc: null };
    }
  }
}