/**
 * Stargate Bridge Service
 * Cross-chain token transfers using Stargate Finance
 * Supports USDC, USDT, WETH, and SOMI (via OFT)
 */

import axios from 'axios';
import { 
  createPublicClient, 
  createWalletClient,
  http, 
  type PublicClient,
  type WalletClient,
  type Address,
  type Hash,
  parseAbi,
  encodeFunctionData
} from 'viem';
import { privateKeyToAccount, type PrivateKeyAccount } from 'viem/accounts';
import { mainnet, bsc, base } from 'viem/chains';
import { somniaMainnet } from '../chains/somnia';
import { STARGATE_TOKENS, CHAIN_IDS, getStargateToken } from '../constants/stargateTokens';
import { stargateTokensService } from './stargateTokens.service';

// Stargate API endpoint
const STARGATE_API = 'https://stargate.finance/api/v1';

// Special address for native tokens (ETH, BNB, etc)
const NATIVE_TOKEN_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' as Address;

// Chain configurations - using Stargate API chain keys
export const SUPPORTED_CHAINS = {
  ethereum: {
    key: 'ethereum',
    chainId: 1,
    name: 'Ethereum',
    chain: mainnet,
  },
  polygon: {
    key: 'polygon',
    chainId: 137,
    name: 'Polygon',
    chain: undefined, // Add polygon chain config if needed
  },
  arbitrum: {
    key: 'arbitrum',
    chainId: 42161,
    name: 'Arbitrum',
    chain: undefined, // Add arbitrum chain config if needed
  },
  base: {
    key: 'base',
    chainId: 8453,
    name: 'Base',
    chain: base,
  },
  bnb: {
    key: 'bnb', // Stargate uses 'bnb' not 'bsc'
    chainId: 56,
    name: 'BNB Chain',
    chain: bsc,
  },
};

// Token configurations - use proper addresses for Stargate API
export const BRIDGE_TOKENS: Record<string, any> = {
  ETH: {
    symbol: 'ETH',
    decimals: 18,
    isNative: true,
    addresses: {
      ethereum: NATIVE_TOKEN_ADDRESS,  // Native ETH
      arbitrum: NATIVE_TOKEN_ADDRESS,  // Native ETH
      base: NATIVE_TOKEN_ADDRESS,      // Native ETH
      polygon: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',  // WETH on Polygon
    },
  },
  USDC: {
    symbol: 'USDC',
    decimals: 6,
    addresses: {
      ethereum: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      polygon: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',  // Native USDC on Polygon
      bnb: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
      base: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
      arbitrum: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    },
  },
  USDT: {
    symbol: 'USDT',
    decimals: 6,
    addresses: {
      ethereum: '0xdac17f958d2ee523a2206206994597c13d831ec7',
      polygon: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
      bnb: '0x55d398326f99059ff775485246999027b3197955',
      base: '0xfde4c96c8593536e31f229ea8f37b2ada2699bb2',
      arbitrum: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    },
  },
  SOMI: {
    symbol: 'SOMI',
    decimals: 18,
    isOFT: true, // Uses LayerZero OFT
    addresses: {
      ethereum: '0x1B0F6590d21dc02B92ad3A7D00F8884dC4f1aed9',
      bnb: '0xa9616e5e23ec1582c2828b025becf3ef610e266f',
      base: '0x47636b3188774a3E7273D85A537b9bA4Ee7b2535',
    },
  },
};

// Stargate route types
export type RouteType = 'stargate/v2/taxi' | 'stargate/v2/bus';

export interface BridgeQuote {
  route: RouteType;
  srcAddress: Address;
  dstAddress: Address;
  srcChainKey: string;
  dstChainKey: string;
  srcToken: Address;
  dstToken: Address;
  srcAmount: string;
  dstAmount: string;
  dstAmountMin: string;
  duration: {
    estimated: number;
  };
  fees: Array<{
    token: Address;
    amount: string;
    type: string;
    chainKey: string;
  }>;
  steps: Array<{
    type: 'approve' | 'bridge';
    chainKey: string;
    sender: Address;
    transaction: {
      data: string;
      to: Address;
      from: Address;
      value?: string;
    };
  }>;
}

export interface BridgeParams {
  srcChain: keyof typeof SUPPORTED_CHAINS;
  dstChain: keyof typeof SUPPORTED_CHAINS;
  token: keyof typeof BRIDGE_TOKENS;
  amount: string; // Amount in token units
  srcAddress: Address;
  dstAddress: Address;
  slippage?: number; // Percentage (e.g., 0.5 for 0.5%)
}

export class StargateService {
  private publicClients: Map<string, PublicClient> = new Map();
  private walletClients: Map<string, WalletClient> = new Map();
  private account?: PrivateKeyAccount;

  constructor(privateKey?: string) {
    // Initialize public clients for each chain
    Object.entries(SUPPORTED_CHAINS).forEach(([key, config]) => {
      this.publicClients.set(key, createPublicClient({
        chain: config.chain as any,
        transport: http(),
      }) as PublicClient);
    });

    // Initialize wallet clients if private key provided
    if (privateKey) {
      this.account = privateKeyToAccount(privateKey as `0x${string}`);
      
      Object.entries(SUPPORTED_CHAINS).forEach(([key, config]) => {
        this.walletClients.set(key, createWalletClient({
          account: this.account!,
          chain: config.chain as any,
          transport: http(),
        }) as WalletClient);
      });
    }
  }

  /**
   * Get bridge quotes from Stargate API
   */
  async getQuotes(params: BridgeParams): Promise<BridgeQuote[]> {
    try {
      const token = BRIDGE_TOKENS[params.token];
      if (!token) {
        throw new Error(`Unsupported token: ${params.token}`);
      }

      // Validate addresses
      if (!params.srcAddress || params.srcAddress === '0x0' || params.srcAddress.length !== 42) {
        throw new Error('Invalid source address');
      }
      if (!params.dstAddress || params.dstAddress === '0x0' || params.dstAddress.length !== 42) {
        throw new Error('Invalid destination address');
      }

      const srcToken = token.addresses[params.srcChain];
      const dstToken = token.addresses[params.dstChain];

      if (!srcToken || !dstToken) {
        throw new Error(`Token ${params.token} not available on ${params.srcChain} -> ${params.dstChain}`);
      }

      // Convert amount to smallest unit
      const srcAmount = BigInt(params.amount) * BigInt(10 ** token.decimals);
      
      // Calculate minimum destination amount (with slippage)
      const slippage = params.slippage || 0.5; // Default 0.5%
      const dstAmountMin = (srcAmount * BigInt(10000 - Math.floor(slippage * 100))) / BigInt(10000);

      console.log('Stargate API request params:', {
        srcToken,
        dstToken,
        srcAddress: params.srcAddress,
        dstAddress: params.dstAddress,
        srcChainKey: params.srcChain,
        dstChainKey: params.dstChain,
        srcAmount: srcAmount.toString(),
        dstAmountMin: dstAmountMin.toString(),
      });

      const response = await axios.get(`${STARGATE_API}/quotes`, {
        params: {
          srcToken,
          dstToken,
          srcAddress: params.srcAddress,
          dstAddress: params.dstAddress,
          srcChainKey: params.srcChain,
          dstChainKey: params.dstChain,
          srcAmount: srcAmount.toString(),
          dstAmountMin: dstAmountMin.toString(),
        },
      });

      return response.data.quotes || [];
    } catch (error: any) {
      console.error('Error fetching bridge quotes:', error.response?.data || error);
      if (error.response?.status === 422) {
        const errorDetails = error.response.data;
        console.error('Stargate API validation error:', errorDetails);
        throw new Error(`Invalid parameters: ${JSON.stringify(errorDetails)}`);
      }
      throw error;
    }
  }

  /**
   * Get supported chains list
   */
  async getSupportedChains() {
    try {
      const response = await axios.get(`${STARGATE_API}/chains`);
      return response.data;
    } catch (error) {
      console.error('Error fetching supported chains:', error);
      return Object.values(SUPPORTED_CHAINS).map(c => ({
        key: c.key,
        name: c.name,
        chainId: c.chainId,
      }));
    }
  }

  /**
   * Get supported tokens for a chain pair
   */
  async getSupportedTokens(srcChain: string, dstChain: string) {
    try {
      const response = await axios.get(`${STARGATE_API}/tokens`, {
        params: {
          srcChainKey: srcChain,
          dstChainKey: dstChain,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching supported tokens:', error);
      // Return our configured tokens as fallback
      return Object.entries(BRIDGE_TOKENS)
        .filter(([_, token]) => 
          token.addresses[srcChain as keyof typeof token.addresses] && 
          token.addresses[dstChain as keyof typeof token.addresses]
        )
        .map(([key, token]) => ({
          symbol: token.symbol,
          decimals: token.decimals,
          srcAddress: token.addresses[srcChain as keyof typeof token.addresses],
          dstAddress: token.addresses[dstChain as keyof typeof token.addresses],
        }));
    }
  }

  /**
   * Execute bridge transaction
   */
  async executeBridge(quote: BridgeQuote): Promise<{ 
    approveTx?: Hash; 
    bridgeTx: Hash 
  }> {
    if (!this.account || !this.walletClients.has(quote.srcChainKey)) {
      throw new Error('Wallet not initialized');
    }

    const walletClient = this.walletClients.get(quote.srcChainKey)!;
    const result: { approveTx?: Hash; bridgeTx: Hash } = { bridgeTx: '0x' as Hash };

    try {
      // Process each step
      for (const step of quote.steps) {
        if (step.type === 'approve') {
          // Execute approval transaction
          // @ts-ignore
          const approveTx = await walletClient.sendTransaction({
            to: step.transaction.to,
            data: step.transaction.data as `0x${string}`,
            account: this.account,
            // @ts-ignore
            chain: SUPPORTED_CHAINS[quote.srcChainKey].chain as any,
          });
          
          result.approveTx = approveTx;
          
          // Wait for approval confirmation
          const publicClient = this.publicClients.get(quote.srcChainKey)!;
          await publicClient.waitForTransactionReceipt({ hash: approveTx });
          
        } else if (step.type === 'bridge') {
          // Execute bridge transaction
          // @ts-ignore
          const bridgeTx = await walletClient.sendTransaction({
            to: step.transaction.to,
            data: step.transaction.data as `0x${string}`,
            value: step.transaction.value ? BigInt(step.transaction.value) : undefined,
            account: this.account,
            // @ts-ignore
            chain: SUPPORTED_CHAINS[quote.srcChainKey].chain as any,
          });
          
          result.bridgeTx = bridgeTx;
        }
      }

      return result;
    } catch (error) {
      console.error('Error executing bridge:', error);
      throw error;
    }
  }

  /**
   * Check bridge transaction status
   */
  async checkBridgeStatus(txHash: Hash, chainKey: string): Promise<{
    status: 'pending' | 'success' | 'failed';
    confirmations: number;
    estimatedArrival?: number;
  }> {
    const publicClient = this.publicClients.get(chainKey);
    if (!publicClient) {
      throw new Error(`Unsupported chain: ${chainKey}`);
    }

    try {
      const receipt = await publicClient.getTransactionReceipt({ hash: txHash });
      
      if (!receipt) {
        return { status: 'pending', confirmations: 0 };
      }

      const latestBlock = await publicClient.getBlockNumber();
      const confirmations = Number(latestBlock - receipt.blockNumber);

      // Estimate arrival time based on route
      const estimatedArrival = confirmations > 0 ? Date.now() + (3 * 60 * 1000) : undefined; // 3 minutes average

      return {
        status: receipt.status === 'success' ? 'success' : 'failed',
        confirmations,
        estimatedArrival,
      };
    } catch (error) {
      console.error('Error checking bridge status:', error);
      return { status: 'pending', confirmations: 0 };
    }
  }

  /**
   * Estimate bridge fees
   */
  async estimateBridgeFees(params: BridgeParams): Promise<{
    bridgeFee: bigint;
    messageFee: bigint;
    totalFee: bigint;
    estimatedGas: bigint;
  }> {
    try {
      const quotes = await this.getQuotes(params);
      if (quotes.length === 0) {
        throw new Error('No quotes available');
      }

      const quote = quotes[0]; // Use fastest route (taxi)
      
      let bridgeFee = BigInt(0);
      let messageFee = BigInt(0);
      
      for (const fee of quote.fees) {
        if (fee.type === 'bridge') {
          bridgeFee = BigInt(fee.amount);
        } else if (fee.type === 'message') {
          messageFee = BigInt(fee.amount);
        }
      }

      // Estimate gas for the transaction
      const publicClient = this.publicClients.get(params.srcChain)!;
      const estimatedGas = await publicClient.estimateGas({
        account: params.srcAddress,
        to: quote.steps[quote.steps.length - 1].transaction.to,
        data: quote.steps[quote.steps.length - 1].transaction.data as `0x${string}`,
        value: messageFee,
      });

      return {
        bridgeFee,
        messageFee,
        totalFee: bridgeFee + messageFee,
        estimatedGas,
      };
    } catch (error) {
      console.error('Error estimating fees:', error);
      throw error;
    }
  }

  /**
   * Bridge SOMI token using LayerZero OFT
   */
  async bridgeSOMI(params: {
    srcChain: keyof typeof SUPPORTED_CHAINS;
    dstChain: keyof typeof SUPPORTED_CHAINS;
    amount: bigint;
    recipient: Address;
  }): Promise<Hash> {
    if (!this.account) {
      throw new Error('Wallet not initialized');
    }

    const srcConfig = SUPPORTED_CHAINS[params.srcChain];
    const dstConfig = SUPPORTED_CHAINS[params.dstChain];
    
    if (!srcConfig || !dstConfig) {
      throw new Error('Invalid chain configuration');
    }

    const walletClient = this.walletClients.get(params.srcChain);
    if (!walletClient) {
      throw new Error('Wallet client not initialized');
    }

    // OFT send function
    const OFT_ABI = parseAbi([
      'function send(uint16 dstChainId, bytes toAddress, uint amount, address payable refundAddress, address zroPaymentAddress, bytes adapterParams) payable',
      'function estimateSendFee(uint16 dstChainId, bytes toAddress, uint amount, bool useZro, bytes adapterParams) view returns (uint nativeFee, uint zroFee)'
    ]);

    const oftAddress = params.srcChain === 'somnia' 
      ? srcConfig.nativeOFTAdapter! 
      : BRIDGE_TOKENS.SOMI.addresses[params.srcChain];

    if (!oftAddress) {
      throw new Error('SOMI OFT not available on source chain');
    }

    try {
      // Encode recipient address for LayerZero
      const toAddressBytes = params.recipient as `0x${string}`;
      
      // Estimate fees
      const publicClient = this.publicClients.get(params.srcChain)!;
      const [nativeFee] = await publicClient.readContract({
        address: oftAddress as Address,
        abi: OFT_ABI,
        functionName: 'estimateSendFee',
        args: [
          dstConfig.eid || 1, // Destination EID
          toAddressBytes,
          params.amount,
          false,
          '0x' as `0x${string}`,
        ],
      }) as [bigint, bigint];

      // Send transaction
      const txHash = await walletClient.sendTransaction({
        to: oftAddress as Address,
        chain: srcConfig.chain as any,
        data: encodeFunctionData({
          abi: OFT_ABI,
          functionName: 'send',
          args: [
            dstConfig.eid || 1,
            toAddressBytes,
            params.amount,
            params.recipient,
            '0x0000000000000000000000000000000000000000' as Address,
            '0x' as `0x${string}`,
          ],
        }),
        value: nativeFee,
        account: this.account,
      });

      return txHash;
    } catch (error) {
      console.error('Error bridging SOMI:', error);
      throw error;
    }
  }
}