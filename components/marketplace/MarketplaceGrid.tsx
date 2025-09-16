'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { MarketplaceService } from '@/lib/services/marketplace.service';
import { MarketplaceListingCard } from './MarketplaceListing';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, Package } from 'lucide-react';
import { MarketplaceListing } from '@/lib/constants/marketplace';
import { toast } from 'sonner';
import { ethers } from 'ethers';

export function MarketplaceGrid() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  
  const limit = 12;
  
  const fetchListings = async (reset = false) => {
    if (!walletClient) return;
    
    setLoading(true);
    try {
      const provider = new ethers.BrowserProvider(walletClient);
      const signer = await provider.getSigner();
      const marketplaceService = new MarketplaceService(signer);
      
      const currentOffset = reset ? 0 : offset;
      const [{ listings: newListings, hasMore: more }, count] = await Promise.all([
        marketplaceService.getActiveListings(currentOffset, limit),
        marketplaceService.getActiveListingsCount()
      ]);
      
      if (reset) {
        setListings(newListings);
        setOffset(limit);
      } else {
        setListings(prev => [...prev, ...newListings]);
        setOffset(prev => prev + limit);
      }
      
      setHasMore(more);
      setTotalCount(count);
    } catch (error) {
      console.error('Failed to fetch listings:', error);
      toast.error('Failed to load marketplace listings');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (walletClient) {
      fetchListings(true);
    }
  }, [walletClient]);
  
  const handlePurchase = async (listingId: bigint, price: bigint) => {
    if (!walletClient) return;
    
    try {
      const provider = new ethers.BrowserProvider(walletClient);
      const signer = await provider.getSigner();
      const marketplaceService = new MarketplaceService(signer);
      
      const tx = await marketplaceService.purchase(listingId, price);
      toast.info('Transaction submitted. Waiting for confirmation...');
      
      await tx.wait();
      toast.success('NFT purchased successfully!');
      
      // Refresh listings
      await fetchListings(true);
    } catch (error: any) {
      console.error('Purchase failed:', error);
      toast.error(error.message || 'Failed to purchase NFT');
    }
  };
  
  const handleCancel = async (listingId: bigint) => {
    if (!walletClient) return;
    
    try {
      const provider = new ethers.BrowserProvider(walletClient);
      const signer = await provider.getSigner();
      const marketplaceService = new MarketplaceService(signer);
      
      const tx = await marketplaceService.cancelListing(listingId);
      toast.info('Canceling listing...');
      
      await tx.wait();
      toast.success('Listing canceled successfully!');
      
      // Refresh listings
      await fetchListings(true);
    } catch (error: any) {
      console.error('Cancel failed:', error);
      toast.error(error.message || 'Failed to cancel listing');
    }
  };
  
  const handleUpdate = async (listingId: bigint, newPrice: bigint, newCid?: string) => {
    if (!walletClient) return;
    
    try {
      const provider = new ethers.BrowserProvider(walletClient);
      const signer = await provider.getSigner();
      const marketplaceService = new MarketplaceService(signer);
      
      const tx = await marketplaceService.updateListing(listingId, newPrice, newCid);
      toast.info('Updating listing...');
      
      await tx.wait();
      toast.success('Listing updated successfully!');
      
      // Refresh listings
      await fetchListings(true);
    } catch (error: any) {
      console.error('Update failed:', error);
      toast.error(error.message || 'Failed to update listing');
    }
  };
  
  if (!walletClient) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Package className="h-16 w-16 text-gray-600 mb-4" />
        <p className="text-xl text-gray-400">Connect your wallet to view the marketplace</p>
      </div>
    );
  }
  
  if (loading && listings.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">NFT Marketplace</h2>
          <p className="text-gray-400">
            {totalCount} {totalCount === 1 ? 'listing' : 'listings'} available
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => fetchListings(true)}
          disabled={loading}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      {listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-gray-900/50 rounded-lg border border-gray-800">
          <Package className="h-16 w-16 text-gray-600 mb-4" />
          <p className="text-xl text-gray-400">No listings available</p>
          <p className="text-sm text-gray-500 mt-2">
            Be the first to list an NFT on the marketplace!
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {listings.map((listing) => (
              <MarketplaceListingCard
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