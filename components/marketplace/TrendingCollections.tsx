'use client';

import { TrendingUp, TrendingDown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MockMarketplaceService } from '@/lib/services/mock-marketplace.service';
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
      const mockService = new MockMarketplaceService();
      const mockCollections = mockService.getCollections();
      
      // Map mock collections to the display format and add corresponding listing IDs
      const formattedCollections: Collection[] = mockCollections.slice(0, 5).map((col, index) => ({
        rank: index + 1,
        listingId: BigInt(index + 1), // Map to actual listing IDs from mock data
        name: col.name,
        image: col.image,
        floor: `${formatEther(col.floor)} STT`,
        volume24h: `${formatEther(col.volume24h)} STT`,
        change24h: col.change24h,
        owners: col.owners,
        items: col.items,
        verified: col.verified
      }));
      
      setCollections(formattedCollections);
    };
    
    fetchCollections();
  }, []);

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border border-gray-700/50 shadow-xl overflow-hidden">
      <div className="p-6 border-b border-gray-700/50 bg-gradient-to-r from-purple-900/20 to-blue-900/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-400 animate-pulse" />
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