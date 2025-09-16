'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { HybridMarketplaceService } from '@/lib/services/hybrid-marketplace.service';
import { NFTCard } from './NFTCard';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, Package, Grid3x3, List } from 'lucide-react';
import { MarketplaceListing } from '@/lib/constants/marketplace';
import { toast } from 'sonner';
import { ethers } from 'ethers';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function MarketplaceGridNew() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [sortBy, setSortBy] = useState('recent');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const limit = 12;
  
  const fetchListings = async (reset = false) => {
    setLoading(true);
    try {
      let newListings: MarketplaceListing[] = [];
      let more = false;
      let count = 0;
      
      const currentOffset = reset ? 0 : offset;
      
      // Use hybrid service that automatically falls back to mock data
      const signer = walletClient ? await (new ethers.BrowserProvider(walletClient)).getSigner() : undefined;
      const marketplaceService = new HybridMarketplaceService(signer);
      
      const [result, activeCount] = await Promise.all([
        marketplaceService.getActiveListings(currentOffset, limit),
        marketplaceService.getActiveListingsCount()
      ]);
      newListings = result.listings;
      more = result.hasMore;
      count = activeCount;
      
      // Log if using real contract
      if (marketplaceService.isUsingRealContract()) {
        console.log('Using real marketplace contract');
      } else {
        console.log('Using mock marketplace data');
      }
      
      // Sort listings based on selected option
      const sortedListings = [...newListings].sort((a, b) => {
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
      
      if (reset) {
        setListings(sortedListings);
        setOffset(limit);
      } else {
        setListings(prev => [...prev, ...sortedListings]);
        setOffset(prev => prev + limit);
      }
      
      setHasMore(more);
      setTotalCount(count);
      
      // Show info if contract not deployed
      if (count === 0 && newListings.length === 0) {
        console.info('Marketplace contract may not be deployed or has no listings');
      }
    } catch (error: any) {
      console.error('Failed to fetch listings:', error);
      // Only show error toast for non-contract errors
      if (!error.message?.includes('could not decode result data')) {
        toast.error('Failed to load marketplace listings');
      }
      // Set empty state
      if (reset) {
        setListings([]);
        setOffset(0);
      }
      setHasMore(false);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchListings(true);
  }, [walletClient, sortBy]);
  
  const handlePurchase = async (listingId: bigint, price: bigint) => {
    try {
      const signer = walletClient ? await (new ethers.BrowserProvider(walletClient)).getSigner() : undefined;
      const marketplaceService = new HybridMarketplaceService(signer);
      
      const tx = await marketplaceService.purchase(listingId, price);
      toast.info('Transaction submitted. Waiting for confirmation...');
      
      if ('wait' in tx) {
        await tx.wait();
      }
      toast.success('NFT purchased successfully!');
      
      // Refresh listings
      await fetchListings(true);
    } catch (error: any) {
      console.error('Purchase failed:', error);
      toast.error(error.message || 'Failed to purchase NFT');
    }
  };
  
  const handleCancel = async (listingId: bigint) => {
    try {
      const signer = walletClient ? await (new ethers.BrowserProvider(walletClient)).getSigner() : undefined;
      const marketplaceService = new HybridMarketplaceService(signer);
      
      const tx = await marketplaceService.cancelListing(listingId);
      toast.info('Canceling listing...');
      
      if ('wait' in tx) {
        await tx.wait();
      }
      toast.success('Listing canceled successfully!');
      
      // Refresh listings
      await fetchListings(true);
    } catch (error: any) {
      console.error('Cancel failed:', error);
      toast.error(error.message || 'Failed to cancel listing');
    }
  };
  
  const handleUpdate = async (listingId: bigint, newPrice: bigint, newCid?: string) => {
    try {
      const signer = walletClient ? await (new ethers.BrowserProvider(walletClient)).getSigner() : undefined;
      const marketplaceService = new HybridMarketplaceService(signer);
      
      const tx = await marketplaceService.updateListing(listingId, newPrice, newCid);
      toast.info('Updating listing...');
      
      if ('wait' in tx) {
        await tx.wait();
      }
      toast.success('Listing updated successfully!');
      
      // Refresh listings
      await fetchListings(true);
    } catch (error: any) {
      console.error('Update failed:', error);
      toast.error(error.message || 'Failed to update listing');
    }
  };
  
  // Remove wallet requirement for viewing - show mock data when not connected
  // if (!walletClient) {
  //   return (
  //     <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border border-gray-700/50 p-12 shadow-xl">
  //       <div className="flex flex-col items-center justify-center">
  //         <Package className="h-16 w-16 text-purple-400 mb-4 animate-pulse" />
  //         <p className="text-xl text-gray-300">Connect your wallet to view the marketplace</p>
  //       </div>
  //     </div>
  //   );
  // }
  
  if (loading && listings.length === 0) {
    return (
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border border-gray-700/50 p-12 shadow-xl">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border border-gray-700/50 p-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-300 font-medium">
              <span className="text-purple-400">{totalCount}</span> {totalCount === 1 ? 'item' : 'items'}
            </span>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px] bg-black/30 border-gray-700/50 text-white hover:border-purple-500/50 transition-colors">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Recently Listed</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode('grid')}
              className={`transition-all ${viewMode === 'grid' ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30' : 'text-gray-400 hover:text-white'}`}
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode('list')}
              className={`transition-all ${viewMode === 'list' ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30' : 'text-gray-400 hover:text-white'}`}
            >
              <List className="h-4 w-4" />
            </Button>
            
            <div className="w-px h-6 bg-gray-700 mx-2" />
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fetchListings(true)}
              disabled={loading}
              className="text-gray-400 hover:text-purple-400 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-purple-400' : ''}`} />
            </Button>
          </div>
        </div>
      </div>
      
      {/* NFT Grid/List */}
      {listings.length === 0 ? (
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border border-gray-700/50 p-12 shadow-xl">
          <div className="flex flex-col items-center justify-center">
            <Package className="h-16 w-16 text-purple-400 mb-4" />
            <p className="text-xl text-gray-300">No listings available</p>
            <p className="text-sm text-gray-400 mt-2">
              {!loading ? 'Be the first to list an NFT on the marketplace!' : 'Loading marketplace...'}
            </p>
            {!loading && (
              <p className="text-xs text-gray-500 mt-4">
                Note: The marketplace contract may need to be deployed or populated with listings.
              </p>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className={`grid ${
            viewMode === 'grid' 
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
              : 'grid-cols-1'
          } gap-6`}>
            {listings.map((listing) => (
              <NFTCard
                key={listing.listingId.toString()}
                listing={listing}
                onPurchase={handlePurchase}
                onCancel={handleCancel}
                onUpdate={handleUpdate}
              />
            ))}
          </div>
          
          {hasMore && (
            <div className="flex justify-center pt-6">
              <Button
                onClick={() => fetchListings(false)}
                disabled={loading}
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold shadow-lg hover:shadow-purple-500/25 transition-all border-0"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load More'
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}