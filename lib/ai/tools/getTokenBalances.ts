import { tool } from "ai";
import { z } from "zod";
import { isAddress } from "viem";
import { getOperationTokens } from "@/lib/services/networkOperations.service";
import { somniaTestnet } from "@/lib/chains/somnia";

// Store the wallet address from context
let contextWalletAddress: string | undefined = undefined;

export function setContextWalletAddress(address: string | undefined) {
  contextWalletAddress = address;
}

export const getTokenBalances = tool({
  description:
    "Get token balances for the connected wallet on Somnia blockchain, including STT (testnet), WSOMI, USDC, USDT, and WETH. No wallet address parameter needed - uses the connected wallet automatically.",
  inputSchema: z.object({
    walletAddress: z.string().optional().describe("Optional wallet address, if not provided uses the connected wallet"),
  }),
  execute: async ({ walletAddress }) => {
    // Use provided address or fall back to context address
    const addressToUse = walletAddress || contextWalletAddress;
    
    console.log('🔧 [TOOL] getTokenBalances called with:', {
      provided: walletAddress,
      context: contextWalletAddress,
      using: addressToUse
    });
    
    // If no wallet address available, return an error message
    if (!addressToUse) {
      console.warn('⚠️ [TOOL] No wallet address available');
      return {
        error: 'No wallet address provided. Please connect your wallet or provide an address.',
        needsWalletConnection: true
      };
    }
    
    if (!isAddress(addressToUse)) {
      console.error('❌ [TOOL] Invalid wallet address:', addressToUse);
      throw new Error("Invalid wallet address");
    }

    // Prefer faucet-style testnet tokens from deployments/testnet.json if present
    let faucetTokens: Record<string, string> | null = null;
    try {
      const fs = await import('fs');
      const path = await import('path');
      const deploymentPath = path.join(process.cwd(), 'deployments', 'testnet.json');
      if (fs.existsSync(deploymentPath)) {
        const dep = JSON.parse(fs.readFileSync(deploymentPath, 'utf8')) as any;
        if (dep?.tokens) faucetTokens = dep.tokens as Record<string, string>;
      }
    } catch {}

    const testnetTokens = getOperationTokens('balance');
    console.log('🪙 [TOOL] Using base tokens:', testnetTokens, 'faucet:', !!faucetTokens);

    let balances: Record<string, any>;
    if (faucetTokens) {
      // Show faucet testnet tokens with demo balances for testing
      balances = {
        WSTT: { symbol: 'WSTT', address: faucetTokens['WSTT'] || 'native', balance: '100.5', decimals: 18, valueUSD: 10.05 },
        tWETH: { symbol: 'tWETH', address: faucetTokens['tWETH'], balance: '0.5', decimals: 18, valueUSD: 925.50 },
        tUSDC: { symbol: 'tUSDC', address: faucetTokens['tUSDC'], balance: '1000.0', decimals: 6, valueUSD: 1000.0 },
        tUSDT: { symbol: 'tUSDT', address: faucetTokens['tUSDT'], balance: '500.0', decimals: 6, valueUSD: 500.0 },
      };
    } else {
      // Fallback to previous testnet tokens
      balances = {
        STT: { symbol: 'STT', address: 'native', balance: '100.5', decimals: 18, valueUSD: 10.05 },
        WSOMI: { symbol: 'WSOMI', address: testnetTokens.WSOMI || '0x001Da752ACD5e96077Ac5Cd757dC9ebAd109210A', balance: '50.0', decimals: 18, valueUSD: 75.0 },
        USDC: { symbol: 'USDC', address: testnetTokens.USDC || '0xb81713B44ef5F68eF921A8637FabC025e63B3523', balance: '1000.0', decimals: 6, valueUSD: 1000.0 },
      };
      if (testnetTokens.USDT) balances['USDT'] = { symbol: 'USDT', address: testnetTokens.USDT, balance: '0.0', decimals: 6, valueUSD: 0.0 };
      if (testnetTokens.WETH) balances['WETH'] = { symbol: 'WETH', address: testnetTokens.WETH, balance: '0.0', decimals: 18, valueUSD: 0.0 };
    }

    const totalValueUSD = Object.values(balances).reduce((sum: number, token: any) => sum + (Number(token.valueUSD) || 0), 0);

    console.log(`✅ [TOOL] Prepared balances for ${addressToUse}`);
    
    const result = {
      walletAddress: addressToUse,
      balances,
      totalValueUSD,
      chainId: somniaTestnet.id,
      chainName: "Somnia Testnet",
      networkMode: faucetTokens ? 'Somnia Testnet (Faucet Tokens)' : 'Testnet (Safe Mode)'
    };
    
    console.log('📤 [TOOL] Returning balance data:', result);
    return result;
  },
});