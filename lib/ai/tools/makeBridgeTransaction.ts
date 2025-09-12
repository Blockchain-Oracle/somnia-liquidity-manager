import { tool } from "ai";
import { z } from "zod";
import { isAddress } from "viem";
import { getOperationConfig, getOperationTokens } from "@/lib/services/networkOperations.service";

export type BridgeTransactionProps = {
  fromChain: string;
  toChain: string;
  tokenSymbol: string;
  tokenAddress: string;
  amount: string;
  userAddress: string;
  slippage: string;
  networkMode?: string;
};

const SUPPORTED_CHAINS = [
  "somnia",
  "somnia-testnet",
  "ethereum", 
  "polygon",
  "arbitrum",
  "base",
  "bsc",
] as const;

export const makeBridgeTransaction = tool({
  description:
    "Create a cross-chain bridge transaction using Stargate. Bridge tokens between Somnia and other supported chains.",
  inputSchema: z.object({
    fromChain: z
      .enum(SUPPORTED_CHAINS)
      .describe("Source blockchain network"),
    toChain: z
      .enum(SUPPORTED_CHAINS)
      .describe("Destination blockchain network"),
    tokenSymbol: z
      .string()
      .describe("Token symbol to bridge (e.g., USDC, USDT)"),
    tokenAddress: z
      .string()
      .describe("Token contract address on source chain"),
    amount: z
      .string()
      .describe("Amount to bridge in human readable format"),
    userAddress: z.string().describe("User's wallet address"),
    slippage: z
      .string()
      .default("0.5")
      .describe("Maximum slippage percentage"),
  }),
  execute: async ({
    fromChain,
    toChain,
    tokenSymbol,
    tokenAddress,
    amount,
    userAddress,
    slippage,
  }): Promise<BridgeTransactionProps> => {
    // Validate user address
    if (!isAddress(userAddress)) {
      throw new Error("Invalid user address");
    }

    // Force testnet for bridge operations
    const operationConfig = getOperationConfig('bridge');
    const testnetTokens = getOperationTokens('bridge');
    
    // Replace somnia with somnia-testnet for safety
    let finalFromChain = fromChain;
    let finalToChain = toChain;
    
    if (fromChain === 'somnia') {
      finalFromChain = 'somnia-testnet';
    }
    if (toChain === 'somnia') {
      finalToChain = 'somnia-testnet';
    }

    // Validate chains are different
    if (finalFromChain === finalToChain) {
      throw new Error("Source and destination chains must be different");
    }

    // Map token to testnet address if bridging from/to Somnia
    let finalTokenAddress = tokenAddress;
    if ((finalFromChain === 'somnia-testnet' || finalToChain === 'somnia-testnet') && tokenSymbol) {
      const upperSymbol = tokenSymbol.toUpperCase();
      if (upperSymbol === 'SOMI' || upperSymbol === 'WSOMI') {
        finalTokenAddress = testnetTokens.WSOMI || tokenAddress;
      } else if (upperSymbol === 'USDC') {
        finalTokenAddress = testnetTokens.USDC || tokenAddress;
      } else if (upperSymbol === 'STT') {
        finalTokenAddress = 'native';
      }
    }

    // Validate token address
    if (!isAddress(finalTokenAddress) && finalTokenAddress !== "native") {
      throw new Error("Invalid token address");
    }

    // Parse amount to ensure it's valid
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      throw new Error("Invalid amount");
    }

    const transaction: BridgeTransactionProps = {
      fromChain: finalFromChain,
      toChain: finalToChain,
      tokenSymbol,
      tokenAddress: finalTokenAddress,
      amount: parsedAmount.toFixed(6),
      userAddress,
      slippage,
      networkMode: 'Testnet Bridge (Safe Mode)',
    };

    console.log("Bridge transaction prepared (using testnet):", transaction);
    return transaction;
  },
});