'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ShoppingCart, 
  TrendingUp, 
  TrendingDown, 
  Eye,
  Heart,
  ExternalLink,
  Sparkles,
  Package,
  DollarSign,
  Activity,
  ChevronRight,
  Image as ImageIcon,
  Info
} from 'lucide-react'
import { formatEther } from 'viem'

interface NFTListing {
  listingId: string
  seller: string
  nftAddress: string
  tokenId: string
  price: string
  priceWei: string
  active: boolean
  sold: boolean
  createdAt: string
  metadata: {
    name: string
    description: string
    image: string
    attributes: Array<{
      trait_type: string
      value: string | number
    }>
  }
}

interface MarketplaceStats {
  totalListings: number
  floorPrice: number
  averagePrice: number
  highestPrice: number
}

interface NFTMarketplaceCardProps {
  listings?: NFTListing[]
  stats?: MarketplaceStats
  hasMore?: boolean
  network?: string
  contractAddress?: string
  explorerUrl?: string
  onPurchase?: (listingId: string, price: string) => void
  onLoadMore?: () => void
  onViewDetails?: (listing: NFTListing) => void
}

export function NFTMarketplaceCard({
  listings = [],
  stats,
  hasMore,
  network = 'Somnia Testnet',
  contractAddress,
  explorerUrl,
  onPurchase,
  onLoadMore,
  onViewDetails
}: NFTMarketplaceCardProps) {
  const [selectedListing, setSelectedListing] = useState<NFTListing | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Remove excessive logging

  return (
    <Card className="bg-gradient-to-br from-purple-950/20 via-slate-900/50 to-indigo-950/20 border-purple-500/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Package className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-lg">NFT Marketplace</CardTitle>
              <CardDescription>
                {network} • {listings.length} listings
              </CardDescription>
            </div>
          </div>
          {contractAddress && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(explorerUrl, '_blank')}
              className="text-xs"
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              Contract
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Market Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-3 h-3 text-blue-400" />
                <span className="text-xs text-muted-foreground">Total</span>
              </div>
              <p className="text-sm font-semibold">{stats.totalListings}</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="w-3 h-3 text-green-400" />
                <span className="text-xs text-muted-foreground">Floor</span>
              </div>
              <p className="text-sm font-semibold">{typeof stats.floorPrice === 'number' ? `${stats.floorPrice.toFixed(3)} STT` : stats.floorPrice}</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-3 h-3 text-yellow-400" />
                <span className="text-xs text-muted-foreground">Average</span>
              </div>
              <p className="text-sm font-semibold">{typeof stats.averagePrice === 'number' ? `${stats.averagePrice.toFixed(3)} STT` : stats.averagePrice}</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-3 h-3 text-purple-400" />
                <span className="text-xs text-muted-foreground">Highest</span>
              </div>
              <p className="text-sm font-semibold">{typeof stats.highestPrice === 'number' ? `${stats.highestPrice.toFixed(3)} STT` : stats.highestPrice}</p>
            </div>
          </div>
        )}

        {/* View Mode Tabs */}
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
          <TabsList className="bg-slate-800/50">
            <TabsTrigger value="grid">Grid View</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
          </TabsList>

          <TabsContent value="grid" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {listings.map((listing) => (
                <motion.div
                  key={listing.listingId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group cursor-pointer"
                  onClick={() => {
                    setSelectedListing(listing);
                  }}
                >
                  <div className="bg-slate-800/50 rounded-lg overflow-hidden border border-slate-700 hover:border-purple-500/50 transition-all">
                    {/* NFT Image */}
                    <div className="aspect-square relative overflow-hidden bg-slate-900">
                      {listing.metadata.image && listing.metadata.image !== '/placeholder-nft.svg' ? (
                        <img
                          src={listing.metadata.image}
                          alt={listing.metadata.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder-nft.svg';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-12 h-12 text-slate-600" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-purple-500/90 text-white">
                          #{listing.tokenId}
                        </Badge>
                      </div>
                    </div>

                    {/* NFT Info */}
                    <div className="p-3 space-y-2">
                      <h4 className="font-semibold text-sm truncate">
                        {listing.metadata.name}
                      </h4>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">Price</p>
                          <p className="text-sm font-bold text-purple-400">
                            {listing.price}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300"
                          onClick={(e) => {
                            e.stopPropagation()
                            onPurchase?.(listing.listingId, listing.price)
                          }}
                        >
                          <ShoppingCart className="w-3 h-3 mr-1" />
                          Buy
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="list" className="mt-4">
            <div className="space-y-2">
              {listings.map((listing) => (
                <motion.div
                  key={listing.listingId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-slate-800/50 rounded-lg p-3 border border-slate-700 hover:border-purple-500/50 transition-all"
                >
                  <div className="flex items-center gap-3">
                    {/* Thumbnail */}
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-900 flex-shrink-0">
                      {listing.metadata.image && listing.metadata.image !== '/placeholder-nft.svg' ? (
                        <img
                          src={listing.metadata.image}
                          alt={listing.metadata.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder-nft.svg';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-6 h-6 text-slate-600" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-sm">
                            {listing.metadata.name}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            Token #{listing.tokenId} • Listed {new Date(listing.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-purple-400">
                            {listing.price}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ${(() => {
                              const priceNum = parseFloat(listing.price.replace(' STT', ''));
                              return !isNaN(priceNum) ? (priceNum * 0.01).toFixed(2) : '0.00';
                            })()} USD
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onViewDetails?.(listing)}
                      >
                        <Eye className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300"
                        onClick={() => onPurchase?.(listing.listingId, listing.price)}
                      >
                        <ShoppingCart className="w-3 h-3 mr-1" />
                        Buy
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Load More */}
        {hasMore && (
          <div className="flex justify-center pt-4">
            <Button
              onClick={onLoadMore}
              variant="outline"
              className="border-purple-500/30 hover:bg-purple-500/10"
            >
              Load More
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}

        {/* Selected NFT Modal */}
        {selectedListing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <h3 className="text-xl font-bold">{selectedListing.metadata.name}</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedListing(null)}
                  >
                    ✕
                  </Button>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Image */}
                  <div className="aspect-square rounded-lg overflow-hidden bg-slate-800">
                    <img
                      src={selectedListing.metadata.image}
                      alt={selectedListing.metadata.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder-nft.svg'
                      }}
                    />
                  </div>

                  {/* Details */}
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Description</p>
                      <p className="text-sm">{selectedListing.metadata.description || 'No description'}</p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Price</p>
                      <p className="text-2xl font-bold text-purple-400">
                        {selectedListing.price}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ≈ ${(() => {
                          const priceNum = parseFloat(selectedListing.price.replace(' STT', ''));
                          return !isNaN(priceNum) ? (priceNum * 0.01).toFixed(2) : '0.00';
                        })()} USD
                      </p>
                    </div>

                    {selectedListing.metadata.attributes.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Attributes</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedListing.metadata.attributes.map((attr, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {attr.trait_type}: {attr.value}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="pt-4 space-y-2">
                      <Button
                        className="w-full bg-purple-500 hover:bg-purple-600"
                        onClick={() => {
                          onPurchase?.(selectedListing.listingId, selectedListing.price)
                          setSelectedListing(null)
                        }}
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Purchase NFT
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => window.open(`https://shannon-explorer.somnia.network/address/${selectedListing.nftAddress}`, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Contract
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}