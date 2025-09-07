/**
 * WebSocket Service for Somnia
 * Real-time event monitoring for liquidity positions
 */

import { ethers } from 'ethers';
import type { Contract, EventLog } from 'ethers';

export interface WebSocketConfig {
  wsUrl: string;
  contractAddress: string;
  abi: any[];
  reconnectAttempts?: number;
  keepAliveInterval?: number;
}

export class WebSocketService {
  private provider: ethers.WebSocketProvider | null = null;
  private contract: Contract | null = null;
  private config: WebSocketConfig;
  private listeners: Map<string, Function[]> = new Map();
  private reconnectTimer: NodeJS.Timeout | null = null;
  private keepAliveTimer: NodeJS.Timeout | null = null;
  private reconnectCount: number = 0;

  constructor(config: WebSocketConfig) {
    this.config = {
      reconnectAttempts: 5,
      keepAliveInterval: 30000, // 30 seconds
      ...config,
    };
  }

  /**
   * Connect to Somnia WebSocket
   */
  async connect(): Promise<void> {
    try {
      console.log('Connecting to Somnia WebSocket...');
      
      // Create WebSocket provider
      this.provider = new ethers.WebSocketProvider(this.config.wsUrl);
      
      // Wait for connection
      await this.provider._waitUntilReady();
      
      // Create contract instance
      this.contract = new ethers.Contract(
        this.config.contractAddress,
        this.config.abi,
        this.provider
      );
      
      console.log('✅ WebSocket connected to Somnia');
      
      // Setup keep-alive
      this.setupKeepAlive();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Reset reconnect counter on successful connection
      this.reconnectCount = 0;
      
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      this.handleReconnect();
    }
  }

  /**
   * Setup keep-alive to prevent timeout
   */
  private setupKeepAlive(): void {
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
    }

    this.keepAliveTimer = setInterval(async () => {
      if (this.provider) {
        try {
          await this.provider.getBlockNumber();
        } catch (error) {
          console.error('Keep-alive failed, reconnecting...');
          this.handleReconnect();
        }
      }
    }, this.config.keepAliveInterval!);
  }

  /**
   * Setup event listeners for contract events
   */
  private setupEventListeners(): void {
    if (!this.contract || !this.provider) return;

    // Listen for position minted events
    const mintFilter = {
      address: this.config.contractAddress,
      topics: [ethers.id("IncreaseLiquidity(uint256,uint128,uint256,uint256)")],
    };

    this.provider.on(mintFilter, (log: EventLog) => {
      this.handleEvent('IncreaseLiquidity', log);
    });

    // Listen for position decreased events
    const decreaseFilter = {
      address: this.config.contractAddress,
      topics: [ethers.id("DecreaseLiquidity(uint256,uint128,uint256,uint256)")],
    };

    this.provider.on(decreaseFilter, (log: EventLog) => {
      this.handleEvent('DecreaseLiquidity', log);
    });

    // Listen for fee collection events
    const collectFilter = {
      address: this.config.contractAddress,
      topics: [ethers.id("Collect(uint256,address,uint256,uint256)")],
    };

    this.provider.on(collectFilter, (log: EventLog) => {
      this.handleEvent('Collect', log);
    });
  }

  /**
   * Handle incoming events
   */
  private handleEvent(eventName: string, log: EventLog): void {
    try {
      // Parse the log
      const parsedLog = this.contract?.interface.parseLog({
        topics: log.topics as string[],
        data: log.data,
      });

      // Notify all listeners for this event
      const listeners = this.listeners.get(eventName) || [];
      listeners.forEach(listener => {
        listener({
          eventName,
          args: parsedLog?.args,
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash,
          timestamp: Date.now(),
        });
      });

      // Also notify global listeners
      const globalListeners = this.listeners.get('*') || [];
      globalListeners.forEach(listener => {
        listener({
          eventName,
          args: parsedLog?.args,
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash,
          timestamp: Date.now(),
        });
      });

    } catch (error) {
      console.error(`Error handling event ${eventName}:`, error);
    }
  }

  /**
   * Subscribe to events
   */
  on(eventName: string, callback: Function): void {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    this.listeners.get(eventName)!.push(callback);
  }

  /**
   * Unsubscribe from events
   */
  off(eventName: string, callback: Function): void {
    const listeners = this.listeners.get(eventName);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Handle reconnection logic
   */
  private handleReconnect(): void {
    if (this.reconnectCount >= this.config.reconnectAttempts!) {
      console.error('Max reconnection attempts reached');
      this.disconnect();
      return;
    }

    this.reconnectCount++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectCount), 30000); // Exponential backoff

    console.log(`Reconnecting in ${delay / 1000} seconds... (Attempt ${this.reconnectCount}/${this.config.reconnectAttempts})`);

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Get recent events from blockchain
   */
  async getRecentEvents(
    eventName: string,
    fromBlock: number = -100
  ): Promise<any[]> {
    if (!this.contract || !this.provider) {
      throw new Error('Not connected');
    }

    const currentBlock = await this.provider.getBlockNumber();
    const startBlock = currentBlock + fromBlock; // fromBlock is negative

    const events = await this.contract.queryFilter(
      eventName,
      startBlock,
      currentBlock
    );

    return events.map(event => ({
      eventName,
      args: event.args,
      blockNumber: event.blockNumber,
      transactionHash: event.transactionHash,
    }));
  }

  /**
   * Monitor specific position
   */
  async monitorPosition(tokenId: string): Promise<void> {
    if (!this.contract || !this.provider) {
      throw new Error('Not connected');
    }

    // Create filters for this specific position
    const filters = [
      this.contract.filters.IncreaseLiquidity(tokenId),
      this.contract.filters.DecreaseLiquidity(tokenId),
      this.contract.filters.Collect(tokenId),
    ];

    filters.forEach(filter => {
      this.provider!.on(filter, (log: EventLog) => {
        this.handleEvent(`Position_${tokenId}`, log);
      });
    });
  }

  /**
   * Stop monitoring position
   */
  stopMonitoringPosition(tokenId: string): void {
    if (!this.contract || !this.provider) return;

    const filters = [
      this.contract.filters.IncreaseLiquidity(tokenId),
      this.contract.filters.DecreaseLiquidity(tokenId),
      this.contract.filters.Collect(tokenId),
    ];

    filters.forEach(filter => {
      this.provider!.off(filter);
    });
  }

  /**
   * Disconnect and cleanup
   */
  disconnect(): void {
    console.log('Disconnecting WebSocket...');

    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.provider) {
      this.provider.destroy();
      this.provider = null;
    }

    this.contract = null;
    this.listeners.clear();
    this.reconnectCount = 0;

    console.log('WebSocket disconnected');
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.provider !== null && this.provider._websocket.readyState === 1;
  }
}