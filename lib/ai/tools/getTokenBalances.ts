import { tool } from "ai";
import { z } from "zod";
import { isAddress } from "viem";
import { STARGATE_TOKENS } from "../../constants/stargateTokens";

export const getTokenBalances = tool({
  description:
    "Get token balances for a wallet address on Somnia blockchain, including SOMI, USDC, USDT, and WETH.",
  inputSchema: z.object({
    walletAddress: z.string().describe("The wallet address to check balances for"),
  }),
  execute: async ({ walletAddress }) => {
    if (!isAddress(walletAddress)) {
      throw new Error("Invalid wallet address");
    }

    // Get Somnia token addresses from Stargate constants
    const somniaTokens = STARGATE_TOKENS.somnia;

    // In production, this would fetch real balances from the blockchain
    // For now, returning mock data structure with accurate addresses from Stargate
    const balances = {
      SOMI: {
        symbol: "SOMI",
        address: somniaTokens.SOMI.address,
        balance: "100.5",
        decimals: somniaTokens.SOMI.decimals,
        valueUSD: 150.75,
      },
      WSOMI: {
        symbol: "WSOMI",
        address: "0x046EDe9564A72571df6F5e44d0405360c0f4dCab",
        balance: "50.0",
        decimals: 18,
        valueUSD: 75.0,
      },
      "USDC.e": {
        symbol: somniaTokens["USDC.e"].symbol,
        address: somniaTokens["USDC.e"].address,
        balance: "1000.0",
        decimals: somniaTokens["USDC.e"].decimals,
        valueUSD: 1000.0,
      },
      USDT: {
        symbol: somniaTokens.USDT.symbol,
        address: somniaTokens.USDT.address,
        balance: "500.0",
        decimals: somniaTokens.USDT.decimals,
        valueUSD: 500.0,
      },
      WETH: {
        symbol: somniaTokens.WETH.symbol,
        address: somniaTokens.WETH.address,
        balance: "0.5",
        decimals: somniaTokens.WETH.decimals,
        valueUSD: 1750.0,
      },
    };

    const totalValueUSD = Object.values(balances).reduce(
      (sum, token) => sum + token.valueUSD,
      0
    );

    console.log(`Fetched balances for ${walletAddress}`);
    
    return {
      walletAddress,
      balances,
      totalValueUSD,
      chainId: 50311,
      chainName: "Somnia",
    };
  },
});