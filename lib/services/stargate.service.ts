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

// Chain configurations
export const SUPPORTED_CHAINS = {
  somnia: {
    key: 'somnia',
    chainId: 50311,
    name: 'Somnia',
    chain: somniaMainnet,
    layerZeroEndpoint: '0x6F475642a6e85809B1c36Fa62763669b1b48DD5B' as Address,
    nativeOFTAdapter: '0xC3D4E9Ac47D7f37bB07C2f8355Bb4940DEA3bbC3' as Address,
    eid: 30380,
  },
  ethereum: {
    key: 'ethereum',
    chainId: 1,
    name: 'Ethereum',
    chain: mainnet,
    oftToken: '0x1B0F6590d21dc02B92ad3A7D00F8884dC4f1aed9' as Address,
  },
  bnb: {
    key: 'bnb',
    chainId: 56,
    name: 'BNB Chain',
    chain: bsc,
    oftToken: '0xa9616e5e23ec1582c2828b025becf3ef610e266f' as Address,
  },
  base: {
    key: 'base',
    chainId: 8453,
    name: 'Base',
    chain: base,
    oftToken: '0x47636b3188774a3E7273D85A537b9bA4Ee7b2535' as Address,
  },
};

// Token configurations using Stargate constants
export const BRIDGE_TOKENS = {
  USDC: {
    symbol: 'USDC',
    decimals: 6,
    addresses: {
      somnia: getStargateToken('somnia', 'USDC.e')?.address || '0x28BEc7E30E6faee657a03e19Bf1128AaD7632A00',
      ethereum: getStargateToken('ethereum', 'USDC')?.address || '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      bnb: getStargateToken('bsc', 'USDC')?.address || '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
      base: getStargateToken('base', 'USDC')?.address || '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
    },
  },
  USDT: {
    symbol: 'USDT',
    decimals: 6,
    addresses: {
      somnia: getStargateToken('somnia', 'USDT')?.address || '0x67B302E35Aef5EEE8c32D934F5856869EF428330',
      ethereum: getStargateToken('ethereum', 'USDT')?.address || '0xdac17f958d2ee523a2206206994597c13d831ec7',
      bnb: getStargateToken('bsc', 'USDT')?.address || '0x55d398326f99059ff775485246999027b3197955',
      base: '0xfde4c96c8593536e31f229ea8f37b2ada2699bb2',
  },
  WETH: {
    symbol: 'WETH',
    decimals: 18,
    addresses: {
      somnia: getStargateToken('somnia', 'WETH')?.address || '0x936Ab8C674bcb567CD5dEB85D8A216494704E9D8',
      ethereum: getStargateToken('ethereum', 'WETH')?.address || '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
      bnb: '0x2170ed0880ac9a755fd29b2688956bd959f933f8',
      base: getStargateToken('base', 'ETH')?.address || '0x4200000000000000000000000000000000000006',
    },
  },
  SOMI: {
    symbol: 'SOMI',
    decimals: 18,
    isOFT: true, // Uses LayerZero OFT
    addresses: {
      somnia: '0xC3D4E9Ac47D7f37bB07C2f8355Bb4940DEA3bbC3', // NativeOFTAdapter
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
        chain: config.chain,
        transport: http(),
      }));
    });

    // Initialize wallet clients if private key provided
    if (privateKey) {
      this.account = privateKeyToAccount(privateKey as `0x${string}`);
      
      Object.entries(SUPPORTED_CHAINS).forEach(([key, config]) => {
        this.walletClients.set(key, createWalletClient({
          account: this.account!,
          chain: config.chain,
          transport: http(),
        }));
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

      const srcToken = token.addresses[params.srcChain];
      const dstToken = token.addresses[params.dstChain];

      if (!srcToken || !dstToken) {
        throw new Error(`Token not available on selected chains`);
      }

      // Convert amount to smallest unit
      const srcAmount = BigInt(params.amount) * BigInt(10 ** token.decimals);
      
      // Calculate minimum destination amount (with slippage)
      const slippage = params.slippage || 0.5; // Default 0.5%
      const dstAmountMin = (srcAmount * BigInt(10000 - Math.floor(slippage * 100))) / BigInt(10000);

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
    } catch (error) {
      console.error('Error fetching bridge quotes:', error);
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
          const approveTx = await walletClient.sendTransaction({
            to: step.transaction.to,
            data: step.transaction.data as `0x${string}`,
            account: this.account,
          });
          
          result.approveTx = approveTx;
          
          // Wait for approval confirmation
          const publicClient = this.publicClients.get(quote.srcChainKey)!;
          await publicClient.waitForTransactionReceipt({ hash: approveTx });
          
        } else if (step.type === 'bridge') {
          // Execute bridge transaction
          const bridgeTx = await walletClient.sendTransaction({
            to: step.transaction.to,
            data: step.transaction.data as `0x${string}`,
            value: step.transaction.value ? BigInt(step.transaction.value) : undefined,
            account: this.account,
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