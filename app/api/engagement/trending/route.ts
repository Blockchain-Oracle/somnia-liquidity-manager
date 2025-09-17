import { NextResponse } from 'next/server';
import { EngagementService } from '@/lib/services/engagement.service';
import { MarketplaceService } from '@/lib/services/marketplace.service';
import { formatEther } from 'viem';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // Get trending listings from engagement service
    const trendingStats = await EngagementService.getTrendingListings(limit);
    
    // Get marketplace service instance
    const marketplaceService = new MarketplaceService();
    
    // Fetch actual listing data for trending items
    const trendingListings = await Promise.all(
      trendingStats.map(async (stats) => {
        try {
          // Get listing details from marketplace
          const listing = await marketplaceService.getListing(BigInt(stats.listingId));
          
          // Calculate trending score (combine likes and views with weights)
          const trendingScore = (stats.likeCount * 3) + (stats.viewCount * 1);
          
          // Get metadata
          let metadata = null;
          try {
            if (listing.cid && listing.cid !== '') {
              const ipfsUrl = listing.cid.startsWith('http') 
                ? listing.cid 
                : `https://ipfs.io/ipfs/${listing.cid}`;
              
              const response = await fetch(ipfsUrl);
              if (response.ok) {
                metadata = await response.json();
              }
            }
          } catch (error) {
            console.error('Failed to fetch metadata:', error);
          }
          
          return {
            listingId: stats.listingId,
            nftAddress: listing.nft,
            tokenId: listing.tokenId.toString(),
            name: metadata?.name || `NFT #${listing.tokenId}`,
            image: metadata?.image || listing.cid || '/placeholder-nft.svg',
            description: metadata?.description || '',
            price: formatEther(listing.price),
            seller: listing.seller,
            views: stats.viewCount,
            likes: stats.likeCount,
            trendingScore,
            lastViewed: stats.lastViewed,
            active: listing.active,
            sold: listing.sold,
            createdAt: listing.createdAt ? listing.createdAt.toString() : Date.now().toString()
          };
        } catch (error) {
          console.error(`Failed to fetch listing ${stats.listingId}:`, error);
          return null;
        }
      })
    );
    
    // Filter out any failed fetches and only active listings
    const validListings = trendingListings
      .filter(listing => listing !== null && listing.active && !listing.sold)
      .sort((a, b) => b!.trendingScore - a!.trendingScore);
    
    return NextResponse.json({
      success: true,
      data: validListings,
      total: validListings.length
    });
  } catch (error: any) {
    console.error('Failed to get trending listings:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to get trending listings',
        data: []
      },
      { status: 500 }
    );
  }
}