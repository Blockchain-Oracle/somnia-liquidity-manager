'use client';

import { useState } from 'react';
import Link from 'next/link';
import { HeroCarousel } from '@/components/marketplace/HeroCarousel';
import { StatsBar } from '@/components/marketplace/StatsBar';
import { TrendingCollections } from '@/components/marketplace/TrendingCollections';
import { MarketplaceGridNew } from '@/components/marketplace/MarketplaceGridNew';
import { CreateListingButton } from '@/components/marketplace/CreateListingButton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Grid3x3, TrendingUp, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function MarketplacePage() {
  const [activeView, setActiveView] = useState<'items' | 'trending'>('items');

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
              <Link href="/marketplace/mint">
                <Button className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Mint NFT
                </Button>
              </Link>
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