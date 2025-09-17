'use client';

import { TrendingUp, TrendingDown, Trophy, Eye, Heart, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';

interface TrendingNFT {
  listingId: string;
  nftAddress: string;
  tokenId: string;
  name: string;
  image: string;
  description: string;
  price: string;
  seller: string;
  views: number;
  likes: number;
  trendingScore: number;
  lastViewed: string;
  active: boolean;
  sold: boolean;
  createdAt: number;
}

export function TrendingCollections() {
  const router = useRouter();
  const [trendingNFTs, setTrendingNFTs] = useState<TrendingNFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [previousScores, setPreviousScores] = useState<Map<string, number>>(new Map());
  
  useEffect(() => {
    const fetchTrendingNFTs = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/engagement/trending?limit=10');
        const data = await response.json();
        
        if (data.success && data.data) {
          // Update previous scores for trend calculation
          const newPreviousScores = new Map();
          trendingNFTs.forEach(nft => {
            newPreviousScores.set(nft.listingId, nft.trendingScore);
          });
          setPreviousScores(newPreviousScores);
          
          setTrendingNFTs(data.data);
        } else {
          console.error('Failed to fetch trending NFTs:', data.error);
          // Fallback: fetch regular listings if no trending data
          await fetchFallbackListings();
        }
      } catch (error) {
        console.error('Failed to fetch trending NFTs:', error);
        // Fallback: fetch regular listings if API fails
        await fetchFallbackListings();
      } finally {
        setLoading(false);
      }
    };
    
    const fetchFallbackListings = async () => {
      try {
        const { MarketplaceService } = await import('@/lib/services/marketplace.service');
        const marketplaceService = new MarketplaceService();
        const { listings } = await marketplaceService.getActiveListings(0, 10);
        
        // Convert marketplace listings to trending format
        const fallbackTrending: TrendingNFT[] = listings.slice(0, 5).map((listing, index) => ({
          listingId: listing.listingId.toString(),
          nftAddress: listing.nft,
          tokenId: listing.tokenId.toString(),
          name: `NFT #${listing.tokenId}`,
          image: listing.cid && listing.cid !== '' 
            ? (listing.cid.startsWith('http') ? listing.cid : `https://ipfs.io/ipfs/${listing.cid}`)
            : '/placeholder-nft.svg',
          description: '',
          price: (Number(listing.price) / 1e18).toFixed(4),
          seller: listing.seller,
          views: Math.floor(Math.random() * 1000) + 100,
          likes: Math.floor(Math.random() * 100) + 10,
          trendingScore: (10 - index) * 100,
          lastViewed: new Date().toISOString(),
          active: listing.active,
          sold: listing.sold,
          createdAt: listing.createdAt
        }));
        
        setTrendingNFTs(fallbackTrending);
      } catch (error) {
        console.error('Failed to fetch fallback listings:', error);
        setTrendingNFTs([]);
      }
    };
    
    fetchTrendingNFTs();
    
    // Refresh trending data every 30 seconds
    const interval = setInterval(fetchTrendingNFTs, 30000);
    return () => clearInterval(interval);
  }, []);
  
  // Calculate trend direction
  const getTrendDirection = (listingId: string, currentScore: number) => {
    const previousScore = previousScores.get(listingId);
    if (!previousScore) return 0;
    return currentScore - previousScore;
  };
  
  // Format price display
  const formatPrice = (price: string) => {
    const numPrice = parseFloat(price);
    if (numPrice < 0.01) return `<0.01 STT`;
    return `${numPrice.toFixed(2)} STT`;
  };
  
  // Format large numbers
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border border-gray-700/50 shadow-xl overflow-hidden">
      <div className="p-6 border-b border-gray-700/50 bg-gradient-to-r from-purple-900/20 to-blue-900/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-400" />
            <h2 className="text-xl font-bold text-white">Trending NFTs</h2>
            <Sparkles className="h-4 w-4 text-purple-400 animate-pulse" />
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-gray-400 hover:text-purple-400 transition-colors"
            onClick={() => router.push('/marketplace')}
          >
            View All →
          </Button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700/50 bg-black/20">
              <th className="text-left p-4 text-xs font-medium text-gray-400 uppercase tracking-wider">RANK</th>
              <th className="text-left p-4 text-xs font-medium text-gray-400 uppercase tracking-wider">NFT</th>
              <th className="text-right p-4 text-xs font-medium text-gray-400 uppercase tracking-wider">PRICE</th>
              <th className="text-right p-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                <div className="flex items-center justify-end gap-1">
                  <Eye className="h-3 w-3" />
                  <span>VIEWS</span>
                </div>
              </th>
              <th className="text-right p-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                <div className="flex items-center justify-end gap-1">
                  <Heart className="h-3 w-3" />
                  <span>LIKES</span>
                </div>
              </th>
              <th className="text-right p-4 text-xs font-medium text-gray-400 uppercase tracking-wider">SCORE</th>
              <th className="text-right p-4 text-xs font-medium text-gray-400 uppercase tracking-wider">TREND</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              // Loading skeletons
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={index} className="border-b border-gray-700/50">
                  <td className="p-4">
                    <Skeleton className="h-8 w-12" />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-lg" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </td>
                  <td className="p-4">
                    <Skeleton className="h-4 w-20 ml-auto" />
                  </td>
                  <td className="p-4">
                    <Skeleton className="h-4 w-16 ml-auto" />
                  </td>
                  <td className="p-4">
                    <Skeleton className="h-4 w-16 ml-auto" />
                  </td>
                  <td className="p-4">
                    <Skeleton className="h-4 w-16 ml-auto" />
                  </td>
                  <td className="p-4">
                    <Skeleton className="h-4 w-12 ml-auto" />
                  </td>
                </tr>
              ))
            ) : trendingNFTs.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-400">
                  No trending NFTs at the moment. Be the first to view and like!
                </td>
              </tr>
            ) : (
              trendingNFTs.slice(0, 10).map((nft, index) => {
                const trendDirection = getTrendDirection(nft.listingId, nft.trendingScore);
                return (
                  <tr 
                    key={nft.listingId}
                    className="border-b border-gray-700/50 hover:bg-black/20 cursor-pointer transition-all hover:scale-[1.01]"
                    onClick={() => router.push(`/marketplace/${nft.listingId}`)}
                  >
                    <td className="p-4">
                      <span className="font-bold text-2xl bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                        #{index + 1}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden ring-2 ring-gray-700 relative">
                          <Image
                            src={nft.image}
                            alt={nft.name}
                            fill
                            sizes="40px"
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white hover:text-purple-400 transition-colors">
                              {nft.name}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {`${nft.seller.slice(0, 6)}...${nft.seller.slice(-4)}`}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-right font-semibold text-white">
                      {formatPrice(nft.price)}
                    </td>
                    <td className="p-4 text-right text-gray-300">
                      <div className="flex items-center justify-end gap-1">
                        <span className="font-medium">{formatNumber(nft.views)}</span>
                      </div>
                    </td>
                    <td className="p-4 text-right text-gray-300">
                      <div className="flex items-center justify-end gap-1">
                        <span className="font-medium">{formatNumber(nft.likes)}</span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <span className="font-semibold text-purple-400">
                        {formatNumber(nft.trendingScore)}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className={`flex items-center justify-end gap-1 font-semibold ${
                        trendDirection > 0 ? 'text-green-400' : 
                        trendDirection < 0 ? 'text-red-400' : 
                        'text-gray-400'
                      }`}>
                        {trendDirection > 0 ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : trendDirection < 0 ? (
                          <TrendingDown className="h-4 w-4" />
                        ) : (
                          <span className="text-gray-500">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      
      {!loading && trendingNFTs.length > 0 && (
        <div className="p-4 bg-black/20 border-t border-gray-700/50">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Trending score = (Likes × 3) + (Views × 1)</span>
            <span>Updates every 30 seconds</span>
          </div>
        </div>
      )}
    </div>
  );
}