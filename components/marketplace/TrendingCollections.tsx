'use client';

import { TrendingUp, TrendingDown, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MarketplaceService } from '@/lib/services/marketplace.service';
import { formatEther } from 'viem';

interface Collection {
  rank: number;
  listingId: bigint;
  name: string;
  image: string;
  floor: string;
  volume24h: string;
  change24h: number;
  owners: number;
  items: number;
  verified: boolean;
}

export function TrendingCollections() {
  const router = useRouter();
  const [collections, setCollections] = useState<Collection[]>([]);
  
  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const marketplaceService = new MarketplaceService();
        const { listings } = await marketplaceService.getActiveListings(0, 10);
        
        // Group listings by seller to create "collections"
        const collectionMap = new Map<string, any[]>();
        
        listings.forEach(listing => {
          const seller = listing.seller.toLowerCase();
          if (!collectionMap.has(seller)) {
            collectionMap.set(seller, []);
          }
          collectionMap.get(seller)?.push(listing);
        });
        
        // Convert to trending collections format
        const formattedCollections: Collection[] = Array.from(collectionMap.entries())
          .slice(0, 5) // Show top 5
          .map(([seller, sellerListings], index) => {
            const totalVolume = sellerListings.reduce((sum, l) => sum + Number(formatEther(l.price)), 0);
            const floorPrice = Math.min(...sellerListings.map(l => Number(formatEther(l.price))));
            
            // Generate collection name from seller address
            const collectionName = `Collection ${seller.slice(0, 6)}...${seller.slice(-4)}`;
            
            // Use token ID for deterministic image
            const imageUrl = `https://picsum.photos/seed/${sellerListings[0].tokenId.toString()}/400/400`;
            
            return {
              rank: index + 1,
              listingId: sellerListings[0].listingId,
              name: collectionName,
              image: imageUrl,
              floor: `${floorPrice.toFixed(4)} ETH`,
              volume24h: `${totalVolume.toFixed(2)} ETH`,
              change24h: Math.random() * 40 - 20, // Random change for demo
              owners: Math.floor(Math.random() * 1000) + 100,
              items: sellerListings.length,
              verified: Math.random() > 0.5
            };
          });
        
        setCollections(formattedCollections);
      } catch (error) {
        console.error('Failed to fetch trending collections:', error);
        setCollections([]);
      }
    };
    
    fetchCollections();
  }, []);

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border border-gray-700/50 shadow-xl overflow-hidden">
      <div className="p-6 border-b border-gray-700/50 bg-gradient-to-r from-purple-900/20 to-blue-900/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-400" />
            <h2 className="text-xl font-bold text-white">Trending Collections</h2>
          </div>
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-purple-400 transition-colors">
            View All →
          </Button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700/50 bg-black/20">
              <th className="text-left p-4 text-xs font-medium text-gray-400 uppercase tracking-wider">RANK</th>
              <th className="text-left p-4 text-xs font-medium text-gray-400 uppercase tracking-wider">COLLECTION</th>
              <th className="text-right p-4 text-xs font-medium text-gray-400 uppercase tracking-wider">FLOOR</th>
              <th className="text-right p-4 text-xs font-medium text-gray-400 uppercase tracking-wider">24H VOLUME</th>
              <th className="text-right p-4 text-xs font-medium text-gray-400 uppercase tracking-wider">24H %</th>
              <th className="text-right p-4 text-xs font-medium text-gray-400 uppercase tracking-wider">OWNERS</th>
              <th className="text-right p-4 text-xs font-medium text-gray-400 uppercase tracking-wider">ITEMS</th>
            </tr>
          </thead>
          <tbody>
            {collections.map((collection) => (
              <tr 
                key={collection.rank}
                className="border-b border-gray-700/50 hover:bg-black/20 cursor-pointer transition-all hover:scale-[1.01]"
                onClick={() => router.push(`/marketplace/${collection.listingId}`)}
              >
                <td className="p-4">
                  <span className="font-bold text-2xl bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                    #{collection.rank}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={collection.image}
                      alt={collection.name}
                      className="w-10 h-10 rounded-lg object-cover ring-2 ring-gray-700"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white hover:text-purple-400 transition-colors">
                          {collection.name}
                        </span>
                        {collection.verified && (
                          <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-right font-semibold text-white">
                  {collection.floor}
                </td>
                <td className="p-4 text-right font-medium text-gray-300">
                  {collection.volume24h}
                </td>
                <td className="p-4 text-right">
                  <div className={`flex items-center justify-end gap-1 font-semibold ${
                    collection.change24h > 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {collection.change24h > 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    {Math.abs(collection.change24h)}%
                  </div>
                </td>
                <td className="p-4 text-right text-gray-400">
                  {collection.owners.toLocaleString()}
                </td>
                <td className="p-4 text-right text-gray-400">
                  {collection.items.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}