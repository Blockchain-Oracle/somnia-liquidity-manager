import { tool } from "ai";
import { z } from "zod";
import { isAddress } from "viem";
import { getOperationConfig, getOperationTokens } from "@/lib/services/networkOperations.service";
import { somniaTestnet } from "@/lib/chains/somnia";

export type TransferTransactionProps = {
  from: string;
  to: string;
  tokenAddress: string;
  tokenSymbol: string;
  amount: string;
  decimals: number;
  chainId: number;
  networkName?: string;
};

export const makeTransferTransaction = tool({
  description:
    "Create a token transfer transaction on Somnia blockchain. Pass the sender, receiver, token details, and amount.",
  inputSchema: z.object({
    from: z.string().describe("The sender address"),
    to: z.string().describe("The receiver address"),
    tokenAddress: z
      .string()
      .describe("The token contract address (use 'native' for SOMI)"),
    tokenSymbol: z.string().describe("The token symbol (e.g., SOMI, USDC)"),
    amount: z
      .string()
      .describe("The amount to send in human readable format (e.g., '10.5')"),
    decimals: z.number().default(18).describe("Token decimals"),
    chainId: z.number().optional().describe("Chain ID (will use testnet for safety)"),
  }),
  execute: async ({
    from,
    to,
    tokenAddress,
    tokenSymbol,
    amount,
    decimals,
    chainId,
  }) => {
    // Validate addresses
    if (!isAddress(from)) {
      throw new Error("Invalid sender address");
    }
    if (!isAddress(to) && to !== "native") {
      throw new Error("Invalid receiver address");
    }

    // Force testnet for transfers
    const operationConfig = getOperationConfig('transfer', chainId);
    const testnetTokens = getOperationTokens('transfer', chainId);
    
    // Map token symbol to testnet address
    let finalTokenAddress = tokenAddress;
    if (tokenSymbol) {
      const upperSymbol = tokenSymbol.toUpperCase();
      if (upperSymbol === 'SOMI' || upperSymbol === 'WSOMI') {
        finalTokenAddress = testnetTokens.WSOMI || tokenAddress;
      } else if (upperSymbol === 'USDC') {
        finalTokenAddress = testnetTokens.USDC || tokenAddress;
      } else if (upperSymbol === 'STT' || tokenAddress === 'native') {
        finalTokenAddress = '0x0000000000000000000000000000000000000000';
      }
    }

    // Handle native token
    if (tokenAddress === "native") {
      finalTokenAddress = "0x0000000000000000000000000000000000000000";
    }

    const transaction: TransferTransactionProps = {
      from,
      to,
      tokenAddress: finalTokenAddress,
      tokenSymbol,
      amount,
      decimals,
      chainId: somniaTestnet.id, // Always use testnet
      networkName: 'Somnia Testnet (Safe Mode)',
    };

    console.log("Transfer transaction prepared (using testnet):", transaction);
    return transaction;
  },
});