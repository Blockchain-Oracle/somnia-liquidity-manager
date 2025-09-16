'use client';

import { useState } from 'react';
import { useChainId } from 'wagmi';
import { HeroCarousel } from '@/components/marketplace/HeroCarousel';
import { StatsBar } from '@/components/marketplace/StatsBar';
import { TrendingCollections } from '@/components/marketplace/TrendingCollections';
import { MarketplaceGridNew } from '@/components/marketplace/MarketplaceGridNew';
import { CreateListingButton } from '@/components/marketplace/CreateListingButton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Grid3x3, TrendingUp, Package } from 'lucide-react';

export default function MarketplacePage() {
  const [activeView, setActiveView] = useState<'items' | 'trending'>('items');
  const chainId = useChainId();
  const isMainnet = chainId === 5031;

  if (isMainnet) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black relative">
        {/* Blur overlay for mainnet */}
        <div className="absolute inset-0 backdrop-blur-md bg-black/40 z-10" />
        
        {/* Coming Soon Message */}
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <div className="text-center space-y-6 p-8 bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-purple-500/20 max-w-lg mx-4">
            <div className="inline-flex items-center justify-center p-3 bg-purple-500/10 rounded-xl">
              <Package className="h-8 w-8 text-purple-400" />
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Mainnet Marketplace Coming Soon
            </h2>
            <p className="text-gray-300">
              The NFT Marketplace is currently available on testnet only. 
              We're working to bring you a secure marketplace experience on mainnet.
            </p>
            <div className="pt-4">
              <p className="text-sm text-gray-400">
                Switch to <span className="text-purple-400 font-semibold">Somnia Testnet</span> to explore the marketplace
              </p>
            </div>
          </div>
        </div>

        {/* Blurred background content */}
        <div className="opacity-30">
          <div className="border-b border-gray-200 dark:border-gray-800">
            <div className="container mx-auto px-4 py-8">
              <HeroCarousel />
            </div>
          </div>
          <div className="container mx-auto px-4 py-6">
            <StatsBar />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black">
      {/* Hero Section */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 py-8">
          <HeroCarousel />
        </div>
      </div>
      
      {/* Stats Bar */}
      <div className="container mx-auto px-4 py-6">
        <StatsBar />
      </div>
      
      {/* Main Content */}
      <div className="container mx-auto px-4 pb-12">
        <Tabs value={activeView} onValueChange={(v) => setActiveView(v as any)}>
          <div className="flex items-center justify-between mb-6">
            <TabsList className="bg-gray-900/50 border border-gray-800">
              <TabsTrigger value="items" className="gap-2">
                <Grid3x3 className="h-4 w-4" />
                Items
              </TabsTrigger>
              <TabsTrigger value="trending" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                Trending
              </TabsTrigger>
            </TabsList>
            
            <div className="flex gap-2">
              <CreateListingButton />
            </div>
          </div>
          
          <TabsContent value="items" className="mt-0">
            <MarketplaceGridNew />
          </TabsContent>
          
          
          <TabsContent value="trending" className="mt-0">
            <TrendingCollections />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}