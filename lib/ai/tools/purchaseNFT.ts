import { tool } from "ai";
import { z } from "zod";
import { ethers } from 'ethers';

export const purchaseNFT = tool({
  description: "Purchase an NFT from the marketplace",
  parameters: z.object({
    listingId: z.string().describe("The listing ID of the NFT to purchase"),
    buyerAddress: z.string().describe("The buyer's wallet address"),
    price: z.string().describe("The price of the NFT in ETH")
  }),
  execute: async ({ listingId, buyerAddress, price }) => {
    try {
      // Validate buyer address
      if (!ethers.isAddress(buyerAddress)) {
        return {
          success: false,
          error: "Invalid buyer address"
        };
      }

      // Convert price to wei
      const priceWei = ethers.parseEther(price);

      // Return transaction data for the frontend to execute
      return {
        success: true,
        type: 'marketplace_purchase',
        transaction: {
          to: '0x90D87EFa907B3F1900608070173ceaEb0f7c9A02', // Marketplace contract
          from: buyerAddress,
          value: priceWei.toString(),
          data: {
            functionName: 'purchase',
            args: [BigInt(listingId)]
          }
        },
        preview: {
          action: 'Purchase NFT',
          listingId: listingId,
          price: price,
          priceWei: priceWei.toString(),
          buyer: buyerAddress,
          marketplaceContract: '0x90D87EFa907B3F1900608070173ceaEb0f7c9A02',
          platformFee: (Number(price) * 0.025).toFixed(4), // 2.5% fee
          sellerProceeds: (Number(price) * 0.975).toFixed(4), // 97.5% to seller
          estimatedGas: '0.001 STT',
          network: 'Somnia Testnet'
        }
      };
    } catch (error) {
      console.error('Error preparing NFT purchase:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to prepare NFT purchase'
      };
    }
  }
});