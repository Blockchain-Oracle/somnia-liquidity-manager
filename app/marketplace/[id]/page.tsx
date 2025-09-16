'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAccount, useWalletClient, useSignMessage } from 'wagmi';
import { MarketplaceService } from '@/lib/services/marketplace.service';
import { HybridMarketplaceService } from '@/lib/services/hybrid-marketplace.service';
import { MarketplaceListing, MarketplaceConfig } from '@/lib/constants/marketplace';
import { EngagementService } from '@/lib/services/engagement.service';
import { formatEther } from 'viem';
import { ethers } from 'ethers';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Heart, 
  Share2, 
  ExternalLink, 
  ShoppingCart,
  Eye,
  Clock,
  Shield,
  Sparkles,
  TrendingUp,
  MoreVertical,
  Edit,
  X,
  ChevronRight,
  Zap
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function NFTDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  
  const [listing, setListing] = useState<MarketplaceListing | null>(null);
  const [config, setConfig] = useState<MarketplaceConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [fees, setFees] = useState<{ platformFee: bigint; sellerProceeds: bigint } | null>(null);
  const [viewCount, setViewCount] = useState(0);
  const [likeCount, setLikeCount] = useState(0);
  const [likePending, setLikePending] = useState(false);
  
  const listingId = params.id as string;
  const isOwner = address && listing?.seller.toLowerCase() === address.toLowerCase();
  const [imageSrc, setImageSrc] = useState('/placeholder-nft.svg');
  
  useEffect(() => {
    if (listing?.cid) {
      if (listing.cid.startsWith('http')) {
        setImageSrc(listing.cid);
      } else {
        setImageSrc(`https://ipfs.io/ipfs/${listing.cid}`);
      }
    }
  }, [listing]);
  
  useEffect(() => {
    fetchListing();
  }, [walletClient, listingId]);
  
  // Track view when page loads
  useEffect(() => {
    if (listingId) {
      trackView();
    }
  }, [listingId, address]);
  
  // Track view
  const trackView = async () => {
    try {
      const response = await fetch('/api/engagement/track-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId,
          viewerAddress: address
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setViewCount(data.stats.views);
        setLikeCount(data.stats.likes);
        setIsLiked(data.stats.hasLiked);
      }
    } catch (error) {
      console.error('Failed to track view:', error);
    }
  };
  
  // Handle like with signature
  const handleLike = async () => {
    if (!walletClient || !address || likePending) return;
    
    setLikePending(true);
    try {
      const provider = new ethers.BrowserProvider(walletClient);
      const signer = await provider.getSigner();
      
      // Generate message for signing
      const message = EngagementService.generateLikeMessage(listingId);
      
      // Sign the message (user will see MetaMask popup, but NO gas)
      const signature = await signer.signMessage(message);
      
      // Send to backend
      const response = await fetch('/api/engagement/toggle-like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId,
          address,
          message,
          signature
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsLiked(data.liked);
        setLikeCount(data.stats.likes);
        toast.success(data.liked ? 'Added to favorites!' : 'Removed from favorites');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update like');
      }
    } catch (error: any) {
      if (error.code === 'ACTION_REJECTED') {
        toast.info('Signature cancelled');
      } else {
        console.error('Failed to toggle like:', error);
        toast.error('Failed to update like');
      }
    } finally {
      setLikePending(false);
    }
  };
  
  const fetchListing = async () => {
    if (!listingId) return;
    
    setLoading(true);
    try {
      // Use mock service if wallet not connected or in development
      if (!walletClient || process.env.NODE_ENV === 'development') {
        const hybridService = new HybridMarketplaceService();
        const listingData = await hybridService.getListing(BigInt(listingId));
        
        if (listingData) {
          setListing(listingData);
          const marketplaceConfig = await hybridService.getMarketplaceConfig();
          setConfig(marketplaceConfig);
          const calculatedFees = mockService.calculateFees(listingData.price);
          setFees(calculatedFees);
        }
      } else {
        const provider = new ethers.BrowserProvider(walletClient);
        const signer = await provider.getSigner();
        const marketplaceService = new MarketplaceService(signer);
        
        const listingData = await marketplaceService.getListing(BigInt(listingId));
        setListing(listingData);
        
        const marketplaceConfig = await marketplaceService.getMarketplaceConfig();
        setConfig(marketplaceConfig);
        
        if (listingData) {
          const calculatedFees = marketplaceService.calculateFees(listingData.price);
          setFees(calculatedFees);
        }
      }
    } catch (error) {
      console.error('Failed to fetch listing:', error);
      toast.error('Failed to load NFT details');
    } finally {
      setLoading(false);
    }
  };
  
  const handlePurchase = async () => {
    if (!listing) return;
    
    setPurchasing(true);
    try {
      if (!walletClient || process.env.NODE_ENV === 'development') {
        // Mock purchase for development
        const hybridService = new HybridMarketplaceService();
        const tx = await hybridService.purchase(listing.listingId, listing.price);
        toast.info('Transaction submitted. Waiting for confirmation...');
        
        await tx.wait();
        toast.success('NFT purchased successfully!');
        
        // Redirect to marketplace
        router.push('/marketplace');
      } else {
        const provider = new ethers.BrowserProvider(walletClient);
        const signer = await provider.getSigner();
        const marketplaceService = new MarketplaceService(signer);
        
        const tx = await marketplaceService.purchase(listing.listingId, listing.price);
        toast.info('Transaction submitted. Waiting for confirmation...');
        
        await tx.wait();
        toast.success('NFT purchased successfully!');
        
        // Redirect to marketplace
        router.push('/marketplace');
      }
    } catch (error: any) {
      console.error('Purchase failed:', error);
      toast.error(error.message || 'Failed to purchase NFT');
    } finally {
      setPurchasing(false);
    }
  };
  
  const handleCancel = async () => {
    if (!listing) return;
    
    try {
      if (!walletClient || process.env.NODE_ENV === 'development') {
        // Mock cancel for development
        const hybridService = new HybridMarketplaceService();
        const tx = await hybridService.cancelListing(listing.listingId);
        toast.info('Canceling listing...');
        
        await tx.wait();
        toast.success('Listing canceled successfully!');
        
        // Redirect to marketplace
        router.push('/marketplace');
      } else {
        const provider = new ethers.BrowserProvider(walletClient);
        const signer = await provider.getSigner();
        const marketplaceService = new MarketplaceService(signer);
        
        const tx = await marketplaceService.cancelListing(listing.listingId);
        toast.info('Canceling listing...');
        
        await tx.wait();
        toast.success('Listing canceled successfully!');
        
        // Redirect to marketplace
        router.push('/marketplace');
      }
    } catch (error: any) {
      console.error('Cancel failed:', error);
      toast.error(error.message || 'Failed to cancel listing');
    }
  };
  
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
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black flex items-center justify-center">
        <div className="animate-pulse">
          <Sparkles className="h-12 w-12 text-purple-400" />
        </div>
      </div>
    );
  }
  
  if (!listing) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">NFT Not Found</h1>
            <p className="text-gray-400 mb-8">This listing may have been removed or sold.</p>
            <Button onClick={() => router.push('/marketplace')} variant="outline">
              Back to Marketplace
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black">
      {/* Header */}
      <div className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => router.push('/marketplace')}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Marketplace
            </Button>
            
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLike}
                disabled={!address || likePending}
                className={`${isLiked ? 'text-red-500' : 'text-gray-400'} ${likePending ? 'animate-pulse' : ''}`}
                title={!address ? 'Connect wallet to like' : isLiked ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
              </Button>
              <Button variant="ghost" size="icon" className="text-gray-400">
                <Share2 className="h-5 w-5" />
              </Button>
              {isOwner && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-gray-400">
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Listing
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={handleCancel}
                      className="text-red-600"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel Listing
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Image */}
          <div className="space-y-4">
            <div className="relative aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700/50 shadow-2xl">
              {!imageLoaded && (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-800 animate-pulse" />
              )}
              
              <img
                src={imageSrc}
                alt={`NFT #${listing.tokenId.toString()}`}
                className={`w-full h-full object-cover ${
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
              
              {/* Status Badge */}
              <div className="absolute top-4 left-4">
                {listing.sold ? (
                  <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white">
                    SOLD
                  </Badge>
                ) : listing.active ? (
                  <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white animate-pulse">
                    LIVE
                  </Badge>
                ) : null}
              </div>
            </div>
            
            {/* Details Card */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border border-gray-700/50 p-6 shadow-xl">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-400" />
                Details
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Contract Address</span>
                  <a
                    href={`https://explorer.somnia.network/address/${listing.nft}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300 flex items-center gap-1"
                  >
                    {listing.nft.slice(0, 6)}...{listing.nft.slice(-4)}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Token ID</span>
                  <span className="text-white font-mono">#{listing.tokenId.toString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Token Standard</span>
                  <span className="text-white">ERC-721</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Blockchain</span>
                  <span className="text-white">Somnia</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right: Info & Actions */}
          <div className="space-y-6">
            {/* Collection & Name */}
            <div>
              <p className="text-sm text-gray-400 mb-2 uppercase tracking-wider">
                Collection Name
              </p>
              <h1 className="text-4xl font-bold text-white mb-4">
                Token #{listing.tokenId.toString()}
              </h1>
              
              {/* Seller Info */}
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Owned by</span>
                <a
                  href={`https://explorer.somnia.network/address/${listing.seller}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-300 font-mono flex items-center gap-1"
                >
                  {listing.seller.slice(0, 6)}...{listing.seller.slice(-4)}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
            
            {/* Price Card */}
            <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-xl border border-purple-500/30 p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-400 uppercase tracking-wider">Current Price</p>
                <Badge variant="outline" className="text-green-400 border-green-400/30">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +12.5%
                </Badge>
              </div>
              
              <div className="mb-4">
                <p className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  {formatEther(listing.price)} STT
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  ≈ $0.00 USD
                </p>
              </div>
              
              {/* Fee Information */}
              {fees && (
                <div className="mb-6 p-3 bg-black/20 rounded-lg border border-gray-700/50">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Platform Fee ({config?.platformFeeBps ? config.platformFeeBps / 100 : 2.5}%)</span>
                      <span className="text-gray-300">{formatEther(fees.platformFee)} STT</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Seller Receives</span>
                      <span className="text-white font-semibold">{formatEther(fees.sellerProceeds)} STT</span>
                    </div>
                    {config?.listingFeeWei && BigInt(config.listingFeeWei) > 0n && (
                      <div className="flex justify-between pt-2 border-t border-gray-700/50">
                        <span className="text-gray-400">Listing Fee</span>
                        <span className="text-gray-300">{formatEther(config.listingFeeWei)} STT</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {!isOwner && !listing.sold && listing.active && (
                <Button
                  onClick={handlePurchase}
                  disabled={purchasing}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold shadow-lg hover:shadow-purple-500/25 transition-all py-6 text-lg"
                >
                  {purchasing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      Buy Now
                    </>
                  )}
                </Button>
              )}
              
              {isOwner && (
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="border-gray-700 text-gray-300">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Price
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleCancel}
                    className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              )}
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg border border-gray-700/50 p-4 text-center">
                <Eye className="h-5 w-5 text-gray-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{viewCount}</p>
                <p className="text-xs text-gray-400">Views</p>
              </div>
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg border border-gray-700/50 p-4 text-center">
                <Heart className="h-5 w-5 text-gray-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{likeCount}</p>
                <p className="text-xs text-gray-400">Likes</p>
              </div>
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg border border-gray-700/50 p-4 text-center">
                <Clock className="h-5 w-5 text-gray-400 mx-auto mb-2" />
                <p className="text-lg font-bold text-white">{timeAgo(listing.createdAt)}</p>
                <p className="text-xs text-gray-400">Listed</p>
              </div>
            </div>
            
            {/* Features */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border border-gray-700/50 p-6 shadow-xl">
              <h3 className="text-white font-semibold mb-4">Features</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Zap className="h-4 w-4 text-yellow-400" />
                  Instant Transfer
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Shield className="h-4 w-4 text-green-400" />
                  Verified Contract
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Sparkles className="h-4 w-4 text-purple-400" />
                  Unique Asset
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <TrendingUp className="h-4 w-4 text-blue-400" />
                  Trending
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}