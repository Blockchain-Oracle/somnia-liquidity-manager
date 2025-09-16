import { tool } from "ai";
import { z } from "zod";
import { HybridMarketplaceService } from '@/lib/services/hybrid-marketplace.service';
import { ethers } from 'ethers';

export const getMarketplaceListings = tool({
  description: "Get active NFT listings from the marketplace with images and metadata",
  parameters: z.object({
    offset: z.number().optional().describe("Starting index for pagination"),
    limit: z.number().optional().describe("Number of listings to fetch (default: 20)"),
    sortBy: z.enum(['recent', 'price-low', 'price-high']).optional().describe("Sort order for listings"),
    priceRange: z.object({
      min: z.string().optional().describe("Minimum price in ETH"),
      max: z.string().optional().describe("Maximum price in ETH")
    }).optional().describe("Filter by price range")
  }),
  execute: async ({ offset = 0, limit = 20, sortBy = 'recent', priceRange }) => {
    try {
      // Create a read-only marketplace service
      const provider = new ethers.JsonRpcProvider(
        process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.testnet.somnia.network'
      );
      const marketplaceService = new HybridMarketplaceService();

      // Fetch listings
      const { listings, hasMore } = await marketplaceService.getActiveListings(offset, limit);
      
      // Filter by price if specified
      let filteredListings = listings;
      if (priceRange) {
        filteredListings = listings.filter(listing => {
          const priceInEth = Number(ethers.formatEther(listing.price));
          if (priceRange.min && priceInEth < Number(priceRange.min)) return false;
          if (priceRange.max && priceInEth > Number(priceRange.max)) return false;
          return true;
        });
      }

      // Sort listings
      const sortedListings = [...filteredListings].sort((a, b) => {
        switch (sortBy) {
          case 'price-low':
            return Number(a.price - b.price);
          case 'price-high':
            return Number(b.price - a.price);
          case 'recent':
          default:
            return Number(b.createdAt - a.createdAt);
        }
      });

      // Fetch metadata for each listing (including images)
      const enrichedListings = await Promise.all(
        sortedListings.map(async (listing) => {
          try {
            // Try to fetch from IPFS if CID is provided
            let metadata: any = {};
            let imageUrl = '';
            
            if (listing.cid && listing.cid.startsWith('Qm')) {
              try {
                const ipfsGateway = 'https://ipfs.io/ipfs/';
                const response = await fetch(`${ipfsGateway}${listing.cid}`);
                if (response.ok) {
                  metadata = await response.json();
                  imageUrl = metadata.image?.replace('ipfs://', ipfsGateway) || '';
                }
              } catch {}
            }

            // Fallback to placeholder if no image
            if (!imageUrl) {
              imageUrl = `https://via.placeholder.com/400x400.png?text=NFT+${listing.tokenId.toString()}`;
            }

            return {
              listingId: listing.listingId.toString(),
              seller: listing.seller,
              nftAddress: listing.nft,
              tokenId: listing.tokenId.toString(),
              price: ethers.formatEther(listing.price),
              priceWei: listing.price.toString(),
              active: listing.active,
              sold: listing.sold,
              createdAt: new Date(Number(listing.createdAt) * 1000).toISOString(),
              metadata: {
                name: metadata.name || `NFT #${listing.tokenId}`,
                description: metadata.description || 'No description available',
                image: imageUrl,
                attributes: metadata.attributes || []
              }
            };
          } catch (error) {
            console.error('Error enriching listing:', error);
            return {
              listingId: listing.listingId.toString(),
              seller: listing.seller,
              nftAddress: listing.nft,
              tokenId: listing.tokenId.toString(),
              price: ethers.formatEther(listing.price),
              priceWei: listing.price.toString(),
              active: listing.active,
              sold: listing.sold,
              createdAt: new Date(Number(listing.createdAt) * 1000).toISOString(),
              metadata: {
                name: `NFT #${listing.tokenId}`,
                description: 'No description available',
                image: `https://via.placeholder.com/400x400.png?text=NFT+${listing.tokenId.toString()}`,
                attributes: []
              }
            };
          }
        })
      );

      // Calculate marketplace stats
      const stats = {
        totalListings: await marketplaceService.getActiveListingsCount(),
        floorPrice: sortedListings.length > 0 
          ? Math.min(...sortedListings.map(l => Number(ethers.formatEther(l.price))))
          : 0,
        averagePrice: sortedListings.length > 0
          ? sortedListings.reduce((sum, l) => sum + Number(ethers.formatEther(l.price)), 0) / sortedListings.length
          : 0,
        highestPrice: sortedListings.length > 0
          ? Math.max(...sortedListings.map(l => Number(ethers.formatEther(l.price))))
          : 0
      };

      return {
        success: true,
        listings: enrichedListings,
        hasMore,
        stats,
        contractAddress: '0x90D87EFa907B3F1900608070173ceaEb0f7c9A02',
        network: 'Somnia Testnet',
        explorerUrl: 'https://shannon-explorer.somnia.network/address/0x90D87EFa907B3F1900608070173ceaEb0f7c9A02'
      };
    } catch (error) {
      console.error('Error fetching marketplace listings:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch marketplace listings',
        listings: [],
        hasMore: false
      };
    }
  }
});