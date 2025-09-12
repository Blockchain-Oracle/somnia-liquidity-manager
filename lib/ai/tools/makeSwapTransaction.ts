import { tool } from "ai";
import { z } from "zod";
import { isAddress } from "viem";
import { getOperationConfig, getOperationTokens } from "@/lib/services/networkOperations.service";
import { somniaMainnet, somniaTestnet } from "@/lib/chains/somnia";

export type SwapTransactionProps = {
  tokenIn: string;
  tokenInSymbol: string;
  tokenOut: string;
  tokenOutSymbol: string;
  amount: string;
  slippage: string;
  userAddress: string;
  chainId: number;
  networkMode?: string;
};

const floorToDecimals = (value: string, dp = 6): string => {
  const num = Number(value) || 0;
  const factor = 10 ** dp;
  const floored = Math.floor(num * factor) / factor;
  return floored.toFixed(dp);
};

export const makeSwapTransaction = tool({
  description:
    "Create a token swap transaction on Somnia. Uses mainnet for real swaps, testnet for demo/testing.",
  inputSchema: z.object({
    tokenIn: z.string().describe("Contract address for token to sell"),
    tokenInSymbol: z.string().describe("Symbol of token to sell"),
    tokenOut: z.string().describe("Contract address for token to buy"),
    tokenOutSymbol: z.string().describe("Symbol of token to buy"),
    amount: z
      .string()
      .describe("Amount of tokenIn to swap, human-readable (e.g., '25.5')"),
    slippage: z
      .string()
      .default("0.5")
      .describe("Maximum allowed slippage percentage"),
    userAddress: z.string().describe("User's wallet address"),
    chainId: z.number().optional().describe("Current chain ID to determine network"),
  }),
  execute: async ({
    tokenIn,
    tokenInSymbol,
    tokenOut,
    tokenOutSymbol,
    amount,
    slippage,
    userAddress,
    chainId,
  }): Promise<SwapTransactionProps> => {
    // Floor amount to 6 decimals
    const flooredAmount = floorToDecimals(amount);
    
    // Get operation config - swap can use mainnet or testnet
    const operationConfig = getOperationConfig('swap', chainId);
    const tokens = getOperationTokens('swap', chainId);
    
    console.log("Executing swap transaction with params:", {
      tokenIn,
      tokenInSymbol,
      tokenOut,
      tokenOutSymbol,
      amount: flooredAmount,
      slippage,
      userAddress,
      network: operationConfig.isTestnet ? 'testnet' : 'mainnet',
    });

    // Validate addresses
    if (!isAddress(userAddress)) {
      throw new Error("Invalid user address");
    }

    // Map token symbols to correct addresses based on network
    let finalTokenIn = tokenIn;
    let finalTokenOut = tokenOut;
    
    // Handle token mapping based on network
    if (operationConfig.isTestnet) {
      // Testnet token mapping
      const upperInSymbol = tokenInSymbol?.toUpperCase();
      const upperOutSymbol = tokenOutSymbol?.toUpperCase();
      
      if (upperInSymbol === 'STT' || tokenIn === 'native') {
        finalTokenIn = '0x0000000000000000000000000000000000000000';
      } else if (upperInSymbol === 'SOMI' || upperInSymbol === 'WSOMI') {
        finalTokenIn = tokens.WSOMI || tokenIn;
      } else if (upperInSymbol === 'USDC') {
        finalTokenIn = tokens.USDC || tokenIn;
      }
      
      if (upperOutSymbol === 'STT' || tokenOut === 'native') {
        finalTokenOut = '0x0000000000000000000000000000000000000000';
      } else if (upperOutSymbol === 'SOMI' || upperOutSymbol === 'WSOMI') {
        finalTokenOut = tokens.WSOMI || tokenOut;
      } else if (upperOutSymbol === 'USDC') {
        finalTokenOut = tokens.USDC || tokenOut;
      }
    } else {
      // Mainnet token mapping
      const upperInSymbol = tokenInSymbol?.toUpperCase();
      const upperOutSymbol = tokenOutSymbol?.toUpperCase();
      
      if (upperInSymbol === 'SOMI' || tokenIn === 'native') {
        finalTokenIn = '0x0000000000000000000000000000000000000000';
      } else if (upperInSymbol === 'WSOMI') {
        finalTokenIn = tokens.WSOMI || tokenIn;
      } else if (upperInSymbol === 'USDC') {
        finalTokenIn = tokens.USDC || tokenIn;
      } else if (upperInSymbol === 'USDT') {
        finalTokenIn = tokens.USDT || tokenIn;
      } else if (upperInSymbol === 'WETH') {
        finalTokenIn = tokens.WETH || tokenIn;
      }
      
      if (upperOutSymbol === 'SOMI' || tokenOut === 'native') {
        finalTokenOut = '0x0000000000000000000000000000000000000000';
      } else if (upperOutSymbol === 'WSOMI') {
        finalTokenOut = tokens.WSOMI || tokenOut;
      } else if (upperOutSymbol === 'USDC') {
        finalTokenOut = tokens.USDC || tokenOut;
      } else if (upperOutSymbol === 'USDT') {
        finalTokenOut = tokens.USDT || tokenOut;
      } else if (upperOutSymbol === 'WETH') {
        finalTokenOut = tokens.WETH || tokenOut;
      }
    }

    // Validate final addresses
    if (!isAddress(finalTokenIn) && finalTokenIn !== "0x0000000000000000000000000000000000000000") {
      throw new Error("tokenIn must be a valid address");
    }
    if (!isAddress(finalTokenOut) && finalTokenOut !== "0x0000000000000000000000000000000000000000") {
      throw new Error("tokenOut must be a valid address");
    }

    return {
      tokenIn: finalTokenIn,
      tokenInSymbol,
      tokenOut: finalTokenOut,
      tokenOutSymbol,
      amount: flooredAmount,
      slippage,
      userAddress,
      chainId: operationConfig.chainId,
      networkMode: operationConfig.isTestnet ? 'Testnet Swap (Demo)' : 'Mainnet Swap',
    };
  },
});