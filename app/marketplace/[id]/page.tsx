'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAccount, useWalletClient, useSignMessage } from 'wagmi';
import { MarketplaceService } from '@/lib/services/marketplace.service';
import { MarketplaceListing, MarketplaceConfig } from '@/lib/constants/marketplace';
import { EngagementService } from '@/lib/services/engagement.service';
import { formatEther } from 'viem';
import { ethers } from 'ethers';
import Image from 'next/image';
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
  const [nftMetadata, setNftMetadata] = useState<{
    name?: string;
    description?: string;
    image?: string;
    attributes?: Array<{ trait_type: string; value: string | number }>;
    external_url?: string;
  } | null>(null);
  
  useEffect(() => {
    if (!listing) return;
    
    console.log('🎨 Detail page - Listing data:', {
      listingId: listing.listingId,
      tokenId: listing.tokenId?.toString(),
      cid: listing.cid,
      hasCid: !!listing.cid,
      cidLength: listing.cid?.length
    });
    
    // If we have a CID, it's likely NFT metadata JSON, not an image
    if (listing.cid?.startsWith('http')) {
      console.log('✅ Using HTTP URL:', listing.cid);
      setImageSrc(listing.cid);
    } else if (listing.cid && listing.cid !== '') {
      const metadataUrl = `https://ipfs.io/ipfs/${listing.cid}`;
      console.log('📋 Fetching NFT metadata from:', metadataUrl);
      
      // Fetch the metadata JSON
      fetch(metadataUrl)
        .then(res => res.json())
        .then(metadata => {
          console.log('📦 NFT Metadata:', metadata);
          
          // Store the metadata
          setNftMetadata(metadata);
          
          // Get the image from metadata
          if (metadata.image) {
            let imageUrl = metadata.image;
            // If image is an IPFS hash, convert to URL
            if (imageUrl.startsWith('ipfs://')) {
              imageUrl = imageUrl.replace('ipfs://', 'https://ipfs.io/ipfs/');
            } else if (!imageUrl.startsWith('http')) {
              imageUrl = `https://ipfs.io/ipfs/${imageUrl}`;
            }
            console.log('🖼️ Image from metadata:', imageUrl);
            setImageSrc(imageUrl);
          } else {
            // No image in metadata, use placeholder
            console.log('⚠️ No image in metadata, using placeholder');
            setImageSrc('/placeholder-nft.svg');
          }
        })
        .catch(err => {
          console.error('❌ Failed to fetch metadata:', err);
          // If it's not JSON metadata, maybe it's a direct image?
          console.log('🔄 Trying as direct image...');
          setImageSrc(metadataUrl);
        });
    } else {
      console.log('❌ No CID found, using placeholder');
      setImageSrc('/placeholder-nft.svg');
    }
  }, [listing]);
  
  useEffect(() => {
    fetchListing();
  }, [walletClient, listingId]);
  
  // Track view when page loads (only if user is connected)
  useEffect(() => {
    if (listingId && address) {
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
      // Create marketplace service with or without wallet
      let marketplaceService: MarketplaceService;
      
      if (walletClient) {
        const provider = new ethers.BrowserProvider(walletClient);
        const signer = await provider.getSigner();
        marketplaceService = new MarketplaceService(signer);
      } else {
        // Use read-only provider for non-connected users
        marketplaceService = new MarketplaceService();
      }
      
      const listingData = await marketplaceService.getListing(BigInt(listingId));
      setListing(listingData);
      
      const marketplaceConfig = await marketplaceService.getMarketplaceConfig();
      setConfig(marketplaceConfig);
      
      if (listingData) {
        const calculatedFees = marketplaceService.calculateFees(listingData.price);
        setFees(calculatedFees);
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
    
    if (!walletClient) {
      toast.error('Please connect your wallet to purchase');
      return;
    }
    
    setPurchasing(true);
    try {
      const provider = new ethers.BrowserProvider(walletClient);
      const signer = await provider.getSigner();
      const marketplaceService = new MarketplaceService(signer);
      
      const tx = await marketplaceService.purchase(listing.listingId, listing.price);
      toast.info('Transaction submitted. Waiting for confirmation...');
      
      await tx.wait();
      toast.success('NFT purchased successfully!');
      
      // Redirect to marketplace
      router.push('/marketplace');
    } catch (error: any) {
      console.error('Purchase failed:', error);
      toast.error(error.message || 'Failed to purchase NFT');
    } finally {
      setPurchasing(false);
    }
  };
  
  const handleCancel = async () => {
    if (!listing) return;
    
    if (!walletClient) {
      toast.error('Please connect your wallet to cancel');
      return;
    }
    
    try {
      const provider = new ethers.BrowserProvider(walletClient);
      const signer = await provider.getSigner();
      const marketplaceService = new MarketplaceService(signer);
      
      const tx = await marketplaceService.cancelListing(listing.listingId);
      toast.info('Canceling listing...');
      
      await tx.wait();
      toast.success('Listing canceled successfully!');
      
      // Redirect to marketplace
      router.push('/marketplace');
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
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="h-5 w-5" />
            Back
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Left: Image Skeleton */}
            <div className="space-y-4">
              <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-800 animate-pulse" />
              
              {/* Details Card Skeleton */}
              <div className="bg-gray-800/50 rounded-xl p-6 animate-pulse">
                <div className="h-6 bg-gray-700 rounded w-24 mb-4" />
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <div className="h-4 bg-gray-700 rounded w-32" />
                    <div className="h-4 bg-gray-700 rounded w-20" />
                  </div>
                  <div className="flex justify-between">
                    <div className="h-4 bg-gray-700 rounded w-28" />
                    <div className="h-4 bg-gray-700 rounded w-16" />
                  </div>
                  <div className="flex justify-between">
                    <div className="h-4 bg-gray-700 rounded w-36" />
                    <div className="h-4 bg-gray-700 rounded w-24" />
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Info Skeleton */}
            <div className="space-y-6">
              {/* Title Skeleton */}
              <div>
                <div className="h-4 bg-gray-700 rounded w-32 mb-2 animate-pulse" />
                <div className="h-10 bg-gray-700 rounded w-3/4 mb-2 animate-pulse" />
                <div className="h-20 bg-gray-700 rounded w-full mb-4 animate-pulse" />
                <div className="flex items-center gap-2">
                  <div className="h-4 bg-gray-700 rounded w-20 animate-pulse" />
                  <div className="h-4 bg-gray-700 rounded w-32 animate-pulse" />
                </div>
              </div>

              {/* Price Card Skeleton */}
              <div className="bg-gray-800/50 rounded-xl p-6 animate-pulse">
                <div className="h-4 bg-gray-700 rounded w-28 mb-4" />
                <div className="h-12 bg-gray-700 rounded w-48 mb-2" />
                <div className="h-4 bg-gray-700 rounded w-24" />
              </div>

              {/* Actions Skeleton */}
              <div className="space-y-3">
                <div className="h-14 bg-gray-700 rounded-xl animate-pulse" />
                <div className="h-14 bg-gray-700 rounded-xl animate-pulse" />
              </div>

              {/* Stats Skeleton */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-800/50 rounded-lg p-4 animate-pulse">
                  <div className="h-5 bg-gray-700 rounded w-5 mx-auto mb-2" />
                  <div className="h-8 bg-gray-700 rounded w-12 mx-auto mb-1" />
                  <div className="h-3 bg-gray-700 rounded w-16 mx-auto" />
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4 animate-pulse">
                  <div className="h-5 bg-gray-700 rounded w-5 mx-auto mb-2" />
                  <div className="h-8 bg-gray-700 rounded w-12 mx-auto mb-1" />
                  <div className="h-3 bg-gray-700 rounded w-16 mx-auto" />
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4 animate-pulse">
                  <div className="h-5 bg-gray-700 rounded w-5 mx-auto mb-2" />
                  <div className="h-6 bg-gray-700 rounded w-20 mx-auto mb-1" />
                  <div className="h-3 bg-gray-700 rounded w-16 mx-auto" />
                </div>
              </div>
            </div>
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
              
              {imageSrc && imageSrc !== '/placeholder-nft.svg' ? (
                <Image
                  src={imageSrc}
                  alt={`NFT #${listing.tokenId.toString()}`}
                  fill
                  sizes="600px"
                  className={`object-cover ${
                    imageLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                  onLoad={() => setImageLoaded(true)}
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-800">
                  <Package className="w-24 h-24 text-gray-600" />
                </div>
              )}
              
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
            
            {/* Details - Compact Design */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border border-gray-700/50 p-4 shadow-xl">
              <h3 className="text-white font-semibold mb-3 text-sm flex items-center gap-2">
                <Shield className="h-4 w-4 text-purple-400" />
                Details
              </h3>
              <div className="flex flex-wrap gap-2">
                {/* Contract Address */}
                <a
                  href={`https://shannon-explorer.somnia.network/address/${listing.nft}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-black/30 border border-gray-700/50 rounded-full hover:border-purple-400/50 transition-all group"
                >
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider">Contract</span>
                  <span className="text-xs text-purple-400 group-hover:text-purple-300 font-mono">
                    {listing.nft.slice(0, 4)}...{listing.nft.slice(-4)}
                  </span>
                  <ExternalLink className="h-2.5 w-2.5 text-purple-400 group-hover:text-purple-300" />
                </a>
                
                {/* Token ID */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-black/30 border border-gray-700/50 rounded-full">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider">ID</span>
                  <span className="text-xs text-white font-medium">#{listing.tokenId.toString()}</span>
                </div>
                
                {/* Token Standard */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-black/30 border border-gray-700/50 rounded-full">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider">Standard</span>
                  <span className="text-xs text-white font-medium">ERC-721</span>
                </div>
                
                {/* Blockchain */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-black/30 border border-purple-700/30 rounded-full bg-purple-500/5">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider">Chain</span>
                  <span className="text-xs text-purple-400 font-medium">Somnia</span>
                </div>
              </div>
            </div>
            
          </div>
          
          {/* Right: Info & Actions */}
          <div className="space-y-6">
            {/* Collection & Name */}
            <div>
              <p className="text-sm text-gray-400 mb-2 uppercase tracking-wider">
                {nftMetadata?.attributes?.find(a => a.trait_type === 'Collection')?.value || 'NFT Collection'}
              </p>
              <h1 className="text-4xl font-bold text-white mb-2">
                {nftMetadata?.name || listing.name || `Token #${listing.tokenId.toString()}`}
              </h1>
              {nftMetadata?.description && (
                <p className="text-gray-300 text-lg leading-relaxed mb-4">
                  {nftMetadata.description}
                </p>
              )}
              
              {/* Seller Info */}
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Owned by</span>
                <a
                  href={`https://shannon-explorer.somnia.network/address/${listing.seller}`}
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
              <div className="mb-4">
                <p className="text-sm text-gray-400 uppercase tracking-wider">Current Price</p>
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
            
            {/* Attributes - Compact Design */}
            {nftMetadata?.attributes && nftMetadata.attributes.length > 0 && (
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border border-gray-700/50 p-4 shadow-xl mt-4">
                <h3 className="text-white font-semibold mb-3 text-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-400" />
                  Attributes
                </h3>
                <div className="flex flex-wrap gap-2">
                  {nftMetadata.attributes.map((attr, index) => {
                    const isRarityScore = attr.trait_type === 'Rarity Score';
                    const isRarity = attr.trait_type === 'Rarity';
                    
                    // Color coding for rarity
                    const getRarityColor = () => {
                      if (!isRarity) return 'border-gray-700/50';
                      const value = String(attr.value).toLowerCase();
                      if (value === 'legendary') return 'border-orange-500/50 bg-orange-500/10';
                      if (value === 'epic') return 'border-purple-500/50 bg-purple-500/10';
                      if (value === 'rare') return 'border-blue-500/50 bg-blue-500/10';
                      if (value === 'uncommon') return 'border-green-500/50 bg-green-500/10';
                      return 'border-gray-600/50 bg-gray-600/10';
                    };
                    
                    return (
                      <div 
                        key={index}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 bg-black/30 border rounded-full hover:border-purple-400/50 transition-all ${getRarityColor()}`}
                      >
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider">
                          {attr.trait_type}
                        </span>
                        <span className="text-xs text-white font-medium">
                          {attr.value}
                        </span>
                        {isRarityScore && typeof attr.value === 'number' && (
                          <div className="flex items-center gap-1">
                            <div className="h-1 w-12 bg-gray-700 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                                style={{ width: `${Math.min(attr.value * 2, 100)}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
}