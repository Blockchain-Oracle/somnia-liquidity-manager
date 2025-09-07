/**
 * Network Manager Service
 * Handles all network switching and DEX selection
 * Users can easily toggle between mainnet and testnet
 */

import { createPublicClient, http, type PublicClient } from 'viem';
import { 
  getCurrentNetwork, 
  switchNetwork, 
  getCurrentNetworkName,
  isQuickSwapAvailable,
  isSimpleDEXAvailable,
  type NetworkConfig,
  updateSimpleDEXAddresses
} from '../config/networks.config';
import { QuickSwapService } from './quickswap.service';
import { SimpleDEXService } from './simpledex.service';
import { DemoService } from './demo.service';
import * as fs from 'fs';
import * as path from 'path';

export type DEXType = 'quickswap' | 'simpledex' | 'demo';

export interface NetworkStatus {
  network: 'mainnet' | 'testnet';
  chainId: number;
  rpcUrl: string;
  isConnected: boolean;
  availableDEX: DEXType[];
  activeDEX: DEXType;
  contracts: any;
  message: string;
}

export class NetworkManagerService {
  private static instance: NetworkManagerService;
  private publicClient: PublicClient | null = null;
  private quickswapService: QuickSwapService | null = null;
  private simpleDEXService: SimpleDEXService | null = null;
  private demoService: DemoService;
  private isConnected: boolean = false;
  private activeDEX: DEXType = 'demo';

  private constructor() {
    this.demoService = new DemoService();
    this.initialize();
  }

  // Singleton pattern
  public static getInstance(): NetworkManagerService {
    if (!NetworkManagerService.instance) {
      NetworkManagerService.instance = new NetworkManagerService();
    }
    return NetworkManagerService.instance;
  }

  /**
   * Initialize connection to current network
   */
  private async initialize() {
    await this.connectToNetwork();
  }

  /**
   * Connect to the current network and determine available DEX
   */
  private async connectToNetwork(): Promise<void> {
    const config = getCurrentNetwork();
    console.log(`🔌 Connecting to ${config.name}...`);

    try {
      // Create public client for current network
      this.publicClient = createPublicClient({
        transport: http(config.rpcUrl),
      });

      // Test connection
      const blockNumber = await this.publicClient.getBlockNumber();
      this.isConnected = true;
      console.log(`✅ Connected to ${config.name} at block ${blockNumber}`);

      // Determine which DEX to use based on network
      await this.selectDEX();
    } catch (error) {
      console.error(`❌ Failed to connect to ${config.name}:`, error);
      this.isConnected = false;
      this.activeDEX = 'demo';
    }
  }

  /**
   * Select appropriate DEX based on current network
   */
  private async selectDEX(): Promise<void> {
    const config = getCurrentNetwork();
    const network = getCurrentNetworkName();

    if (network === 'mainnet' && isQuickSwapAvailable()) {
      // On mainnet, use QuickSwap
      try {
        this.quickswapService = new QuickSwapService('mainnet');
        this.activeDEX = 'quickswap';
        console.log('✅ Using QuickSwap on mainnet');
      } catch (error) {
        console.log('⚠️ QuickSwap not accessible, falling back to demo');
        this.activeDEX = 'demo';
      }
    } else if (network === 'testnet') {
      // On testnet, check if SimpleDEX is deployed
      this.loadSimpleDEXDeployment();
      
      if (isSimpleDEXAvailable()) {
        try {
          this.simpleDEXService = new SimpleDEXService();
          this.activeDEX = 'simpledex';
          console.log('✅ Using SimpleDEX on testnet');
        } catch (error) {
          console.log('⚠️ SimpleDEX not accessible, falling back to demo');
          this.activeDEX = 'demo';
        }
      } else {
        console.log('ℹ️ SimpleDEX not deployed on testnet, using demo mode');
        this.activeDEX = 'demo';
      }
    }
  }

  /**
   * Load SimpleDEX deployment info from file
   */
  private loadSimpleDEXDeployment(): void {
    const deploymentPath = path.join(process.cwd(), 'deployments', 'testnet.json');
    if (fs.existsSync(deploymentPath)) {
      try {
        const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
        if (deployment.contracts) {
          updateSimpleDEXAddresses({
            pool: deployment.contracts.pool,
            wsomi: deployment.contracts.wsomi,
            usdc: deployment.contracts.usdc
          });
        }
      } catch (error) {
        console.log('Could not load SimpleDEX deployment');
      }
    }
  }

  /**
   * Switch to a different network
   */
  async switchToNetwork(network: 'mainnet' | 'testnet'): Promise<NetworkStatus> {
    console.log(`🔄 Switching to ${network}...`);
    
    // Switch network configuration
    switchNetwork(network);
    
    // Reconnect with new network
    await this.connectToNetwork();
    
    return this.getStatus();
  }

  /**
   * Get current network status
   */
  getStatus(): NetworkStatus {
    const config = getCurrentNetwork();
    const network = getCurrentNetworkName();
    const availableDEX: DEXType[] = ['demo']; // Demo always available

    // Add available DEXs based on network
    if (network === 'mainnet' && isQuickSwapAvailable()) {
      availableDEX.push('quickswap');
    }
    if (network === 'testnet' && isSimpleDEXAvailable()) {
      availableDEX.push('simpledex');
    }

    // Determine message based on status
    let message = '';
    if (this.isConnected) {
      if (this.activeDEX === 'quickswap') {
        message = '🚀 Connected to QuickSwap on Somnia Mainnet';
      } else if (this.activeDEX === 'simpledex') {
        message = '🧪 Connected to SimpleDEX on Somnia Testnet';
      } else {
        message = '📊 Using demo mode (deploy SimpleDEX or switch to mainnet)';
      }
    } else {
      message = `❌ Not connected to ${config.name} - using demo mode`;
    }

    return {
      network,
      chainId: config.chainId,
      rpcUrl: config.rpcUrl,
      isConnected: this.isConnected,
      availableDEX,
      activeDEX: this.activeDEX,
      contracts: config.contracts,
      message
    };
  }

  /**
   * Get pool information based on active DEX
   */
  async getPool(token0?: string, token1?: string): Promise<any> {
    switch (this.activeDEX) {
      case 'quickswap':
        if (this.quickswapService && token0 && token1) {
          return await this.quickswapService.getPool(token0 as any, token1 as any);
        }
        break;
      
      case 'simpledex':
        if (this.simpleDEXService) {
          return await this.simpleDEXService.getPool();
        }
        break;
      
      case 'demo':
      default:
        return await this.demoService.getPool(
          token0 as any || '0x0000000000000000000000000000000000000000' as any,
          token1 as any || '0x0000000000000000000000000000000000000000' as any
        );
    }
    return null;
  }

  /**
   * Get user positions based on active DEX
   */
  async getUserPositions(address: string): Promise<any[]> {
    switch (this.activeDEX) {
      case 'quickswap':
        if (this.quickswapService) {
          return await this.quickswapService.getUserPositions(address as any);
        }
        break;
      
      case 'simpledex':
        if (this.simpleDEXService) {
          const position = await this.simpleDEXService.getUserPosition(address as any);
          return position ? [position] : [];
        }
        break;
      
      case 'demo':
      default:
        return await this.demoService.getUserPositions(address as any);
    }
    return [];
  }

  /**
   * Add liquidity based on active DEX
   */
  async addLiquidity(params: any): Promise<any> {
    switch (this.activeDEX) {
      case 'quickswap':
        if (this.quickswapService) {
          return await this.quickswapService.mintPosition(params);
        }
        break;
      
      case 'simpledex':
        if (this.simpleDEXService) {
          return await this.simpleDEXService.addLiquidity(
            params.amount0,
            params.amount1
          );
        }
        break;
      
      case 'demo':
      default:
        return await this.demoService.createPosition(params);
    }
    return null;
  }

  /**
   * Get active DEX service
   */
  getActiveDEX(): DEXType {
    return this.activeDEX;
  }

  /**
   * Get current network name
   */
  getCurrentNetwork(): 'mainnet' | 'testnet' {
    return getCurrentNetworkName();
  }

  /**
   * Check if we're on testnet
   */
  isTestnet(): boolean {
    return getCurrentNetworkName() === 'testnet';
  }

  /**
   * Check if we're on mainnet
   */
  isMainnet(): boolean {
    return getCurrentNetworkName() === 'mainnet';
  }
}