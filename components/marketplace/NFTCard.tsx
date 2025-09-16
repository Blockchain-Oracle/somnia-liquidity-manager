'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, ShoppingCart, MoreVertical, Eye, Clock } from 'lucide-react';
import { MarketplaceListing } from '@/lib/constants/marketplace';
import { formatEther } from 'viem';
import { useAccount } from 'wagmi';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NFTCardProps {
  listing: MarketplaceListing;
  onPurchase?: (listingId: bigint, price: bigint) => Promise<void>;
  onCancel?: (listingId: bigint) => Promise<void>;
  onUpdate?: (listingId: bigint, newPrice: bigint, newCid?: string) => Promise<void>;
}

export function NFTCard({ listing, onPurchase, onCancel, onUpdate }: NFTCardProps) {
  const { address } = useAccount();
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [viewCount, setViewCount] = useState(0);
  const [likeCount, setLikeCount] = useState(0);
  
  // Fetch engagement stats on mount
  useEffect(() => {
    fetchEngagementStats();
  }, [listing.listingId, address]);
  
  const fetchEngagementStats = async () => {
    try {
      const params = new URLSearchParams({
        listingId: listing.listingId.toString()
      });
      if (address) {
        params.append('userAddress', address);
      }
      
      const response = await fetch(`/api/engagement/toggle-like?${params}`);
      if (response.ok) {
        const data = await response.json();
        setViewCount(data.stats.views);
        setLikeCount(data.stats.likes);
        setIsLiked(data.stats.hasLiked);
      }
    } catch (error) {
      console.error('Failed to fetch engagement stats:', error);
    }
  };
  
  const isOwner = address && listing.seller.toLowerCase() === address.toLowerCase();
  const [imageSrc, setImageSrc] = useState(() => {
    if (listing.cid?.startsWith('http')) return listing.cid;
    if (listing.cid) return `https://ipfs.io/ipfs/${listing.cid}`;
    return '/placeholder-nft.svg';
  });
  
  const timeAgo = (timestamp: bigint) => {
    const seconds = Math.floor(Date.now() / 1000 - Number(timestamp));
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div 
      className="group relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl overflow-hidden border border-gray-700/50 transition-all duration-300 hover:shadow-2xl hover:border-purple-500/50 hover:scale-[1.02]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div 
        className="relative aspect-square overflow-hidden bg-gray-800 cursor-pointer"
        onClick={() => router.push(`/marketplace/${listing.listingId}`)}
      >
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-800 animate-pulse" />
        )}
        
        <img
          src={imageSrc}
          alt={`NFT #${listing.tokenId.toString()}`}
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            if (imageSrc !== '/placeholder-nft.svg') {
              setImageSrc('/placeholder-nft.svg');
              setImageLoaded(true);
            }
          }}
        />
        
        {/* Overlay on hover */}
        <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`} />
        
        {/* Top actions */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-start z-10">
          <div className="flex gap-2">
            {listing.sold && (
              <span className="px-2 py-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-semibold rounded-lg shadow-lg">
                SOLD
              </span>
            )}
            {!listing.sold && listing.active && (
              <span className="px-2 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-semibold rounded-lg shadow-lg animate-pulse">
                LIVE
              </span>
            )}
          </div>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsLiked(!isLiked);
            }}
            className={`p-2 rounded-lg backdrop-blur-md transition-all ${
              isLiked 
                ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg' 
                : 'bg-black/30 text-white hover:bg-black/50 border border-white/10'
            }`}
          >
            <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
          </button>
        </div>
        
        {/* Quick buy button (shows on hover) */}
        {!listing.sold && listing.active && !isOwner && (
          <div className={`absolute bottom-3 left-3 right-3 transition-all duration-300 transform ${
            isHovered ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPurchase?.(listing.listingId, listing.price);
              }}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-500 hover:to-blue-500 transition-all shadow-lg hover:shadow-purple-500/25 flex items-center justify-center gap-2"
            >
              <ShoppingCart className="h-4 w-4" />
              Buy Now
            </button>
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="p-4 bg-gradient-to-b from-transparent to-black/20">
        {/* Collection & Token ID */}
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider">
              Collection Name
            </p>
            <h3 
              className="font-semibold text-white hover:text-purple-400 cursor-pointer transition-colors"
              onClick={() => router.push(`/marketplace/${listing.listingId}`)}
            >
              Token #{listing.tokenId.toString()}
            </h3>
          </div>
          
          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger className="p-1 hover:bg-gray-700/50 rounded-lg transition-colors">
                <MoreVertical className="h-4 w-4 text-gray-400 hover:text-white" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onUpdate?.(listing.listingId, listing.price)}>
                  Edit Listing
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onCancel?.(listing.listingId)}
                  className="text-red-600"
                >
                  Cancel Listing
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        
        {/* Price */}
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider">Price</p>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                {formatEther(listing.price)} STT
              </span>
              <span className="text-xs text-gray-500">
                ($0.00)
              </span>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-700/50">
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Clock className="h-3 w-3 text-gray-500" />
            {timeAgo(listing.createdAt)}
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Eye className="h-3 w-3 text-gray-500" />
              {viewCount}
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Heart className="h-3 w-3 text-gray-500" />
              {likeCount}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}