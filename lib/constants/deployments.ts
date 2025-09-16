/**
 * Deployed Contract Addresses
 * Last Updated: 2025-09-16
 */

// NFT Marketplace and Factory Contracts (Deployed on Somnia Testnet)
export const NFT_CONTRACTS = {
  marketplace: "0xF308d971F3dbCd32135Cd3e823603aeE010A6b53",
  factory: "0x4bc9106160414c2579F5b7eac06976D9E65730D9",
  sampleNFT: "0xe494Fd4B0A34c2824F09BC01a8Ae3bA50F52b922"
} as const;

// Network Configuration
export const SOMNIA_TESTNET = {
  chainId: 50312,
  name: "Somnia Testnet",
  rpcUrl: "https://dream-rpc.somnia.network/",
  explorer: "https://shannon-explorer.somnia.network/",
  currency: {
    name: "Somnia Test Token",
    symbol: "STT",
    decimals: 18
  }
} as const;

// Helper function to get explorer URLs
export function getExplorerUrl(addressOrTx: string, type: 'address' | 'tx' = 'address'): string {
  return `${SOMNIA_TESTNET.explorer}${type}/${addressOrTx}`;
}

// Export all contract addresses for easy access
export const DEPLOYED_ADDRESSES = {
  ...NFT_CONTRACTS,
  deployer: "0xC6969eC3C5dFE5A8eCe77ECee940BC52883602E6",
  deploymentTime: "2025-09-16T15:07:17.831Z"
} as const;