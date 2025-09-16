import { tool } from "ai";
import { z } from "zod";
import { HybridMarketplaceService } from '@/lib/services/hybrid-marketplace.service';
import { ethers } from 'ethers';

export const analyzeNFTPrices = tool({
  description: "Analyze NFT prices and provide market insights and recommendations",
  parameters: z.object({
    collectionAddress: z.string().optional().describe("NFT collection address to analyze"),
    currentPrice: z.string().optional().describe("Current price to analyze in ETH"),
    action: z.enum(['buy', 'sell', 'general']).describe("Type of analysis needed")
  }),
  execute: async ({ collectionAddress, currentPrice, action }) => {
    try {
      // Create a read-only marketplace service
      const marketplaceService = new HybridMarketplaceService();

      // Fetch all active listings for analysis
      const { listings } = await marketplaceService.getActiveListings(0, 100);
      
      // Filter by collection if specified
      let relevantListings = listings;
      if (collectionAddress && ethers.isAddress(collectionAddress)) {
        relevantListings = listings.filter(l => 
          l.nft.toLowerCase() === collectionAddress.toLowerCase()
        );
      }

      // Calculate statistics
      const prices = relevantListings.map(l => Number(ethers.formatEther(l.price)));
      const stats = {
        totalListings: relevantListings.length,
        floorPrice: prices.length > 0 ? Math.min(...prices) : 0,
        ceilingPrice: prices.length > 0 ? Math.max(...prices) : 0,
        averagePrice: prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0,
        medianPrice: prices.length > 0 ? prices.sort((a, b) => a - b)[Math.floor(prices.length / 2)] : 0,
        priceRange: {
          min: prices.length > 0 ? Math.min(...prices) : 0,
          max: prices.length > 0 ? Math.max(...prices) : 0
        }
      };

      // Price distribution analysis
      const priceDistribution = {
        under1ETH: prices.filter(p => p < 1).length,
        between1and5ETH: prices.filter(p => p >= 1 && p < 5).length,
        between5and10ETH: prices.filter(p => p >= 5 && p < 10).length,
        above10ETH: prices.filter(p => p >= 10).length
      };

      // Recent sales trend (mock data for demo)
      const trend = {
        direction: stats.averagePrice > stats.medianPrice ? 'upward' : 'downward',
        strength: Math.abs(stats.averagePrice - stats.medianPrice) / stats.averagePrice * 100,
        volume24h: Math.floor(Math.random() * 50) + 10, // Mock volume
        change24h: (Math.random() - 0.5) * 20 // Mock price change
      };

      // Generate recommendations
      let recommendations: any = {};
      const priceNum = currentPrice ? Number(currentPrice) : 0;

      if (action === 'buy') {
        recommendations = {
          action: 'Buy Analysis',
          isGoodDeal: priceNum > 0 && priceNum < stats.averagePrice,
          suggestedMaxPrice: stats.averagePrice * 0.9, // 10% below average
          reasoning: priceNum > 0 ? 
            (priceNum < stats.floorPrice ? 
              'This is below floor price - excellent opportunity!' :
              priceNum < stats.averagePrice ?
                'This is below average market price - good deal!' :
                'This is above average - consider negotiating or waiting')
            : 'Set a maximum price based on floor and average prices',
          riskLevel: priceNum > stats.averagePrice ? 'High' : priceNum > stats.floorPrice ? 'Medium' : 'Low'
        };
      } else if (action === 'sell') {
        recommendations = {
          action: 'Sell Analysis',
          suggestedPrice: stats.averagePrice * 1.05, // 5% above average
          quickSellPrice: stats.floorPrice * 1.1, // 10% above floor for quick sale
          premiumPrice: stats.ceilingPrice * 0.9, // 10% below ceiling for premium listing
          reasoning: priceNum > 0 ?
            (priceNum < stats.floorPrice ?
              'Price is too low - you can get better value!' :
              priceNum > stats.ceilingPrice ?
                'Price might be too high - consider market conditions' :
                'Price is within market range')
            : 'Price strategically based on current market conditions',
          competitiveness: priceNum > 0 ? 
            (priceNum < stats.averagePrice ? 'Very Competitive' : 
             priceNum < stats.ceilingPrice ? 'Moderate' : 'Low') : 'N/A'
        };
      } else {
        recommendations = {
          action: 'Market Overview',
          marketHealth: stats.totalListings > 20 ? 'Active' : stats.totalListings > 5 ? 'Moderate' : 'Low Activity',
          bestTimeToSell: trend.direction === 'upward' ? 'Now (rising market)' : 'Wait (declining market)',
          bestTimeToBuy: trend.direction === 'downward' ? 'Now (buyer\'s market)' : 'Wait for dip',
          priceTarget: {
            conservative: stats.floorPrice * 1.2,
            moderate: stats.averagePrice,
            aggressive: stats.ceilingPrice * 0.8
          }
        };
      }

      // Similar listings (top 3 closest in price)
      let similarListings: any[] = [];
      if (priceNum > 0 && relevantListings.length > 0) {
        similarListings = relevantListings
          .map(l => ({
            listingId: l.listingId.toString(),
            price: ethers.formatEther(l.price),
            tokenId: l.tokenId.toString(),
            priceDifference: Math.abs(Number(ethers.formatEther(l.price)) - priceNum)
          }))
          .sort((a, b) => a.priceDifference - b.priceDifference)
          .slice(0, 3);
      }

      return {
        success: true,
        analysis: {
          stats,
          priceDistribution,
          trend,
          recommendations,
          similarListings,
          marketSummary: `The marketplace currently has ${stats.totalListings} active listings with a floor price of ${stats.floorPrice.toFixed(3)} ETH and average price of ${stats.averagePrice.toFixed(3)} ETH. Market trend is ${trend.direction} with ${trend.strength.toFixed(1)}% strength.`
        },
        network: 'Somnia Testnet',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error analyzing NFT prices:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to analyze NFT prices'
      };
    }
  }
});