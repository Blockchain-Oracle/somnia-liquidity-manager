/**
 * DEX Manager Service
 * Intelligently manages connections to QuickSwap (mainnet) or SimpleDEX (testnet)
 * Provides automatic fallback and unified interface
 */

import { QuickSwapService } from './quickswap.service';
import { SimpleDEXService } from './simpledex.service';
import { DemoService } from './demo.service';
import type { Address } from 'viem';

export type DEXMode = 'quickswap-mainnet' | 'simpledex-testnet' | 'demo';

interface DEXStatus {
  mode: DEXMode;
  isConnected: boolean;
  network: string;
  rpcUrl: string;
  message: string;
}

export class DEXManagerService {
  private quickswapService: QuickSwapService | null = null;
  private simpleDEXService: SimpleDEXService | null = null;
  private demoService: DemoService;
  private currentMode: DEXMode = 'demo';
  private mainnetAvailable: boolean = false;

  constructor() {
    this.demoService = new DemoService();
    this.initializeDEX();
  }

  /**
   * Initialize DEX connections with automatic detection
   */
  private async initializeDEX() {
    // Check environment preference
    const preferredMode = process.env.DEX_MODE || 'auto';
    
    if (preferredMode === 'quickswap' || preferredMode === 'auto') {
      // Try QuickSwap mainnet first
      try {
        this.quickswapService = new QuickSwapService('mainnet');
        
        // Test connection by querying a known contract
        const testCall = await this.testQuickSwapConnection();
        if (testCall) {
          this.currentMode = 'quickswap-mainnet';
          this.mainnetAvailable = true;
          console.log('✅ Connected to QuickSwap on Somnia mainnet');
          return;
        }
      } catch (error) {
        console.log('⚠️ QuickSwap mainnet not accessible, trying alternatives...');
      }
    }

    if (preferredMode === 'simpledex' || preferredMode === 'auto') {
      // Try SimpleDEX on testnet
      try {
        this.simpleDEXService = new SimpleDEXService();
        const pool = await this.simpleDEXService.getPool();
        
        if (pool) {
          this.currentMode = 'simpledex-testnet';
          console.log('✅ Connected to SimpleDEX on Somnia testnet');
          return;
        }
      } catch (error) {
        console.log('⚠️ SimpleDEX not deployed on testnet');
      }
    }

    // Fallback to demo mode
    this.currentMode = 'demo';
    console.log('ℹ️ Using demo mode for hackathon presentation');
  }

  /**
   * Test QuickSwap connection
   */
  private async testQuickSwapConnection(): Promise<boolean> {
    if (!this.quickswapService) return false;
    
    try {
      // Try to get a pool (any pool) to test connection
      const pool = await this.quickswapService.getPool(
        '0x046EDe9564A72571df6F5e44d0405360c0f4dCab' as Address, // WSOMI
        '0x28BEc7E30E6faee657a03e19Bf1128AaD7632A00' as Address  // USDC
      );
      return pool !== null;
    } catch {
      return false;
    }
  }

  /**
   * Get current DEX status
   */
  getStatus(): DEXStatus {
    switch (this.currentMode) {
      case 'quickswap-mainnet':
        return {
          mode: this.currentMode,
          isConnected: true,
          network: 'Somnia Mainnet',
          rpcUrl: 'https://rpc.somnia.network',
          message: 'Connected to QuickSwap Algebra V4 on mainnet'
        };
      
      case 'simpledex-testnet':
        return {
          mode: this.currentMode,
          isConnected: true,
          network: 'Somnia Testnet',
          rpcUrl: 'https://dream-rpc.somnia.network',
          message: 'Connected to SimpleDEX on testnet'
        };
      
      case 'demo':
      default:
        return {
          mode: this.currentMode,
          isConnected: true,
          network: 'Demo Mode',
          rpcUrl: 'N/A',
          message: 'Using demo mode - QuickSwap mainnet ready when RPC accessible'
        };
    }
  }

  /**
   * Get user positions (unified interface)
   */
  async getUserPositions(address: Address): Promise<any[]> {
    switch (this.currentMode) {
      case 'quickswap-mainnet':
        if (this.quickswapService) {
          return await this.quickswapService.getUserPositions(address);
        }
        break;
      
      case 'simpledex-testnet':
        if (this.simpleDEXService) {
          const position = await this.simpleDEXService.getUserPosition(address);
          return position ? [position] : [];
        }
        break;
    }
    
    // Fallback to demo
    return await this.demoService.getUserPositions(address);
  }

  /**
   * Get pool information (unified interface)
   */
  async getPool(token0?: Address, token1?: Address): Promise<any> {
    switch (this.currentMode) {
      case 'quickswap-mainnet':
        if (this.quickswapService && token0 && token1) {
          return await this.quickswapService.getPool(token0, token1);
        }
        break;
      
      case 'simpledex-testnet':
        if (this.simpleDEXService) {
          return await this.simpleDEXService.getPool();
        }
        break;
    }
    
    // Fallback to demo
    return await this.demoService.getPool(
      token0 || '0x046EDe9564A72571df6F5e44d0405360c0f4dCab' as Address,
      token1 || '0x28BEc7E30E6faee657a03e19Bf1128AaD7632A00' as Address
    );
  }

  /**
   * Add liquidity (unified interface)
   */
  async addLiquidity(params: any): Promise<any> {
    switch (this.currentMode) {
      case 'quickswap-mainnet':
        if (this.quickswapService) {
          return await this.quickswapService.mintPosition(params);
        }
        break;
      
      case 'simpledex-testnet':
        if (this.simpleDEXService) {
          return await this.simpleDEXService.addLiquidity(
            params.amount0Desired,
            params.amount1Desired
          );
        }
        break;
    }
    
    // Fallback to demo
    return await this.demoService.createPosition(params);
  }

  /**
   * Execute swap (unified interface)
   */
  async swap(params: any): Promise<any> {
    switch (this.currentMode) {
      case 'quickswap-mainnet':
        if (this.quickswapService) {
          return await this.quickswapService.swap(
            params.tokenIn,
            params.tokenOut,
            params.amountIn,
            params.amountOutMinimum,
            params.recipient,
            params.deadline || BigInt(Math.floor(Date.now() / 1000) + 1800) // 30 min deadline
          );
        }
        break;
      
      case 'simpledex-testnet':
        if (this.simpleDEXService) {
          return await this.simpleDEXService.swap(
            params.amountIn,
            params.zeroForOne
          );
        }
        break;
    }
    
    // Demo mode doesn't support swaps
    return {
      success: false,
      message: 'Swaps not available in demo mode'
    };
  }

  /**
   * Force a specific mode (for testing)
   */
  async setMode(mode: DEXMode): Promise<boolean> {
    switch (mode) {
      case 'quickswap-mainnet':
        if (!this.quickswapService) {
          this.quickswapService = new QuickSwapService('mainnet');
        }
        const testMainnet = await this.testQuickSwapConnection();
        if (testMainnet) {
          this.currentMode = mode;
          return true;
        }
        break;
      
      case 'simpledex-testnet':
        if (!this.simpleDEXService) {
          this.simpleDEXService = new SimpleDEXService();
        }
        const pool = await this.simpleDEXService.getPool();
        if (pool) {
          this.currentMode = mode;
          return true;
        }
        break;
      
      case 'demo':
        this.currentMode = mode;
        return true;
    }
    
    return false;
  }

  /**
   * Get available modes
   */
  async getAvailableModes(): Promise<DEXMode[]> {
    const modes: DEXMode[] = ['demo']; // Demo always available
    
    // Check QuickSwap
    if (await this.testQuickSwapConnection()) {
      modes.push('quickswap-mainnet');
    }
    
    // Check SimpleDEX
    if (this.simpleDEXService) {
      const pool = await this.simpleDEXService.getPool();
      if (pool) {
        modes.push('simpledex-testnet');
      }
    }
    
    return modes;
  }
}