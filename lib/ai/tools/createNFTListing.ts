import { tool } from "ai";
import { z } from "zod";
import { ethers } from 'ethers';

export const createNFTListing = tool({
  description: "Create a new NFT listing on the marketplace",
  inputSchema: z.object({
    sellerAddress: z.string().describe("The seller's wallet address"),
    nftAddress: z.string().describe("The NFT contract address"),
    tokenId: z.string().describe("The token ID of the NFT"),
    price: z.string().describe("The listing price in ETH"),
    name: z.string().optional().describe("Name of the NFT"),
    description: z.string().optional().describe("Description of the NFT"),
    imageUrl: z.string().optional().describe("Image URL of the NFT")
  }),
  execute: async ({ sellerAddress, nftAddress, tokenId, price, name, description, imageUrl }) => {
    try {
      // Validate addresses
      if (!ethers.isAddress(sellerAddress)) {
        return {
          success: false,
          error: "Invalid seller address"
        };
      }

      if (!ethers.isAddress(nftAddress)) {
        return {
          success: false,
          error: "Invalid NFT contract address"
        };
      }

      // Convert price to wei
      const priceWei = ethers.parseEther(price);

      // Create metadata for IPFS (in production, this would be uploaded to IPFS)
      const metadata = {
        name: name || `NFT #${tokenId}`,
        description: description || '',
        image: imageUrl || `https://via.placeholder.com/400x400.png?text=NFT+${tokenId}`,
        attributes: []
      };

      // For now, use a placeholder CID (in production, upload to IPFS first)
      const cid = 'QmPlaceholder' + Date.now();

      // Return transaction data for the frontend to execute
      return {
        success: true,
        type: 'marketplace_listing',
        steps: [
          {
            step: 1,
            action: 'Approve NFT Transfer',
            description: 'First, approve the marketplace to transfer your NFT',
            transaction: {
              to: nftAddress,
              from: sellerAddress,
              data: {
                functionName: 'approve',
                args: ['0x90D87EFa907B3F1900608070173ceaEb0f7c9A02', BigInt(tokenId)]
              }
            }
          },
          {
            step: 2,
            action: 'Transfer NFT to Escrow',
            description: 'Transfer your NFT to the marketplace escrow',
            transaction: {
              to: nftAddress,
              from: sellerAddress,
              data: {
                functionName: 'safeTransferFrom',
                args: [sellerAddress, '0x90D87EFa907B3F1900608070173ceaEb0f7c9A02', BigInt(tokenId)]
              }
            }
          },
          {
            step: 3,
            action: 'Create Listing',
            description: 'Create the listing on the marketplace',
            transaction: {
              to: '0x90D87EFa907B3F1900608070173ceaEb0f7c9A02',
              from: sellerAddress,
              value: '0', // No listing fee
              data: {
                functionName: 'createListing',
                args: [nftAddress, BigInt(tokenId), priceWei, cid]
              }
            }
          }
        ],
        preview: {
          action: 'Create NFT Listing',
          nftAddress: nftAddress,
          tokenId: tokenId,
          price: price,
          priceWei: priceWei.toString(),
          seller: sellerAddress,
          listingFee: '0 STT', // Free to list
          platformFee: '2.5% (on sale)',
          metadata: metadata,
          marketplaceContract: '0x90D87EFa907B3F1900608070173ceaEb0f7c9A02',
          network: 'Somnia Testnet'
        }
      };
    } catch (error) {
      console.error('Error preparing NFT listing:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to prepare NFT listing'
      };
    }
  }
});