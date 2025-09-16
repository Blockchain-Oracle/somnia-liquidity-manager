'use client';

import { useState } from 'react';
import { ethers } from 'ethers';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, ShoppingCart, X, Edit } from 'lucide-react';
import { useAccount } from 'wagmi';
import { MarketplaceListing } from '@/lib/constants/marketplace';
import { formatEther } from 'viem';

interface MarketplaceListingCardProps {
  listing: MarketplaceListing;
  onPurchase?: (listingId: bigint, price: bigint) => Promise<void>;
  onCancel?: (listingId: bigint) => Promise<void>;
  onUpdate?: (listingId: bigint, newPrice: bigint, newCid?: string) => Promise<void>;
}

export function MarketplaceListingCard({
  listing,
  onPurchase,
  onCancel,
  onUpdate
}: MarketplaceListingCardProps) {
  const { address } = useAccount();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [newPrice, setNewPrice] = useState(formatEther(listing.price));
  
  const isOwner = address && listing.seller.toLowerCase() === address.toLowerCase();
  const ipfsGateway = 'https://ipfs.io/ipfs/';
  const imageUrl = listing.cid ? `${ipfsGateway}${listing.cid}` : '/placeholder-nft.png';
  
  const handlePurchase = async () => {
    if (!onPurchase) return;
    setLoading(true);
    try {
      await onPurchase(listing.listingId, listing.price);
    } catch (error) {
      console.error('Purchase failed:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCancel = async () => {
    if (!onCancel) return;
    setLoading(true);
    try {
      await onCancel(listing.listingId);
    } catch (error) {
      console.error('Cancel failed:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleUpdate = async () => {
    if (!onUpdate) return;
    setLoading(true);
    try {
      const priceInWei = ethers.parseEther(newPrice);
      await onUpdate(listing.listingId, priceInWei);
      setEditing(false);
    } catch (error) {
      console.error('Update failed:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Card className="overflow-hidden bg-gray-900/50 border-gray-800 hover:border-purple-500/50 transition-all">
      <div className="aspect-square relative bg-gradient-to-br from-purple-900/20 to-blue-900/20">
        <img
          src={imageUrl}
          alt={`NFT #${listing.tokenId.toString()}`}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/placeholder-nft.png';
          }}
        />
        {listing.sold && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <Badge variant="destructive" className="text-lg px-4 py-2">SOLD</Badge>
          </div>
        )}
      </div>
      
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-gray-500">Token #{listing.tokenId.toString()}</p>
            <p className="text-xs text-gray-500 truncate">
              {listing.nft.slice(0, 6)}...{listing.nft.slice(-4)}
            </p>
          </div>
          <Badge variant={listing.active ? "default" : "secondary"}>
            {listing.sold ? 'Sold' : listing.active ? 'Active' : 'Inactive'}
          </Badge>
        </div>
        
        {editing ? (
          <div className="space-y-2">
            <input
              type="number"
              step="0.01"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
              placeholder="New price in ETH"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleUpdate}
                disabled={loading}
                className="flex-1"
              >
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditing(false)}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-gray-500">Price</p>
              <p className="text-xl font-bold text-white">
                {formatEther(listing.price)} ETH
              </p>
            </div>
            {isOwner && listing.active && !listing.sold && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setEditing(true)}
                className="p-1"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
        
        <div className="pt-2 border-t border-gray-800">
          <p className="text-xs text-gray-500">
            Seller: {listing.seller.slice(0, 6)}...{listing.seller.slice(-4)}
          </p>
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0">
        {!listing.sold && listing.active && (
          <>
            {isOwner ? (
              <Button
                variant="destructive"
                className="w-full"
                onClick={handleCancel}
                disabled={loading}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel Listing
              </Button>
            ) : (
              <Button
                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                onClick={handlePurchase}
                disabled={loading || !onPurchase}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Purchase
              </Button>
            )}
          </>
        )}
        
        {listing.cid && (
          <a
            href={`${ipfsGateway}${listing.cid}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full"
          >
            <Button variant="outline" className="w-full mt-2">
              <ExternalLink className="mr-2 h-4 w-4" />
              View on IPFS
            </Button>
          </a>
        )}
      </CardFooter>
    </Card>
  );
}