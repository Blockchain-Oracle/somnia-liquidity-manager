import { tool } from "ai";
import { z } from "zod";
import { MarketplaceService } from '@/lib/services/marketplace.service';
import { ethers } from 'ethers';
import { MARKETPLACE_ADDRESS } from '@/lib/constants/marketplace';

export const getMarketplaceListings = tool({
  description: "Get active NFT listings from the marketplace with images and metadata",
  inputSchema: z.object({
    offset: z.number().optional().default(0).describe("Starting index for pagination"),
    limit: z.number().optional().default(20).describe("Number of listings to fetch"),
    sortBy: z.enum(['recent', 'price-low', 'price-high']).optional().default('recent').describe("Sort order for listings"),
    minPrice: z.string().optional().describe("Minimum price in ETH"),
    maxPrice: z.string().optional().describe("Maximum price in ETH")
  }),
  execute: async ({ offset = 0, limit = 20, sortBy = 'recent', minPrice, maxPrice }) => {
    try {
      // Create a read-only marketplace service (no signer needed for reading)
      const marketplaceService = new MarketplaceService();

      // Fetch listings
      const { listings, hasMore } = await marketplaceService.getActiveListings(offset, limit);
      
      // Filter by price if specified
      let filteredListings = listings;
      if (minPrice || maxPrice) {
        filteredListings = listings.filter(listing => {
          const priceInEth = Number(ethers.formatEther(listing.price));
          if (minPrice && priceInEth < Number(minPrice)) return false;
          if (maxPrice && priceInEth > Number(maxPrice)) return false;
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
        contractAddress: MARKETPLACE_ADDRESS,
        network: 'Somnia Testnet',
        explorerUrl: `https://shannon-explorer.somnia.network/address/${MARKETPLACE_ADDRESS}`
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