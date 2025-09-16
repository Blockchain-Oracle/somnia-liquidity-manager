import React, { useState, useEffect } from 'react';
import { useAccount, useContractRead, useContractWrite } from 'wagmi';
import { formatEther, parseEther } from 'viem';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Rocket, 
  Image, 
  Users, 
  TrendingUp, 
  Clock,
  Wallet,
  Eye,
  Grid3X3,
  BarChart3,
  Plus
} from 'lucide-react';

interface Collection {
  address: string;
  name: string;
  symbol: string;
  maxSupply: number;
  totalSupply: number;
  price: string;
  phase: string;
  imageUrl: string;
  creator: string;
  revealed: boolean;
}

interface CollectionStats {
  totalSupply: number;
  maxSupply: number;
  uniqueHolders: number;
  floorPrice: string;
  totalVolume: string;
  currentPhase: number;
}

export const LaunchpadDashboard: React.FC = () => {
  const { address } = useAccount();
  const [activeTab, setActiveTab] = useState('explore');
  const [collections, setCollections] = useState<Collection[]>([]);
  const [userCollections, setUserCollections] = useState<Collection[]>([]);
  const [featuredCollection, setFeaturedCollection] = useState<Collection | null>(null);

  // Mock data - replace with actual contract calls
  useEffect(() => {
    // Load collections from factory contract
    const mockCollections: Collection[] = [
      {
        address: '0x123...',
        name: 'Cosmic Pandas',
        symbol: 'CPND',
        maxSupply: 10000,
        totalSupply: 3421,
        price: '0.05',
        phase: 'Public',
        imageUrl: '/api/placeholder/400/400',
        creator: '0xabc...',
        revealed: false
      },
      {
        address: '0x456...',
        name: 'Digital Dreams',
        symbol: 'DDRM',
        maxSupply: 5000,
        totalSupply: 5000,
        price: '0.08',
        phase: 'Sold Out',
        imageUrl: '/api/placeholder/400/400',
        creator: '0xdef...',
        revealed: true
      }
    ];
    setCollections(mockCollections);
    setFeaturedCollection(mockCollections[0]);
  }, []);

  return (
    <div className="w-full space-y-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 p-8 text-white">
        <div className="relative z-10">
          <h1 className="text-4xl font-bold mb-4">NFT Launchpad</h1>
          <p className="text-lg mb-6">Launch your NFT collection on Somnia</p>
          <div className="flex gap-4">
            <Button 
              size="lg" 
              className="bg-white text-purple-600 hover:bg-gray-100"
              onClick={() => setActiveTab('create')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Collection
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-white border-white hover:bg-white/20"
            >
              Learn More
            </Button>
          </div>
        </div>
        <Rocket className="absolute right-8 top-8 w-32 h-32 text-white/20" />
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Collections</p>
                <p className="text-2xl font-bold">24</p>
              </div>
              <Grid3X3 className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total NFTs</p>
                <p className="text-2xl font-bold">15,234</p>
              </div>
              <Image className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Volume</p>
                <p className="text-2xl font-bold">1,245 ETH</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Mints</p>
                <p className="text-2xl font-bold">8</p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="explore">Explore</TabsTrigger>
          <TabsTrigger value="my-collections">My Collections</TabsTrigger>
          <TabsTrigger value="create">Create</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Explore Tab */}
        <TabsContent value="explore" className="space-y-6">
          {/* Featured Collection */}
          {featuredCollection && (
            <Card className="overflow-hidden">
              <div className="grid md:grid-cols-2">
                <img 
                  src={featuredCollection.imageUrl} 
                  alt={featuredCollection.name}
                  className="w-full h-64 object-cover"
                />
                <div className="p-6">
                  <Badge className="mb-2">{featuredCollection.phase}</Badge>
                  <h3 className="text-2xl font-bold mb-2">{featuredCollection.name}</h3>
                  <p className="text-gray-600 mb-4">
                    A unique collection of digital art on Somnia blockchain
                  </p>
                  
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Price</span>
                      <span className="font-semibold">{featuredCollection.price} ETH</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Supply</span>
                      <span className="font-semibold">
                        {featuredCollection.totalSupply} / {featuredCollection.maxSupply}
                      </span>
                    </div>
                    <Progress 
                      value={(featuredCollection.totalSupply / featuredCollection.maxSupply) * 100} 
                      className="h-2"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button className="flex-1">
                      <Wallet className="w-4 h-4 mr-2" />
                      Mint Now
                    </Button>
                    <Button variant="outline">
                      <Eye className="w-4 h-4 mr-2" />
                      View Collection
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Collection Grid */}
          <div>
            <h2 className="text-xl font-bold mb-4">Active Collections</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {collections.map((collection) => (
                <CollectionCard key={collection.address} collection={collection} />
              ))}
            </div>
          </div>
        </TabsContent>

        {/* My Collections Tab */}
        <TabsContent value="my-collections" className="space-y-6">
          {address ? (
            userCollections.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {userCollections.map((collection) => (
                  <CollectionCard key={collection.address} collection={collection} isOwner />
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <Rocket className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold mb-2">No Collections Yet</h3>
                <p className="text-gray-500 mb-4">Create your first NFT collection</p>
                <Button onClick={() => setActiveTab('create')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Collection
                </Button>
              </Card>
            )
          ) : (
            <Card className="p-12 text-center">
              <Wallet className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold mb-2">Connect Wallet</h3>
              <p className="text-gray-500">Connect your wallet to view your collections</p>
            </Card>
          )}
        </TabsContent>

        {/* Create Tab - Will be replaced with CreateCollectionWizard */}
        <TabsContent value="create">
          <Card className="p-6">
            <CardHeader>
              <CardTitle>Create New Collection</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">Collection creation wizard coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <Card className="p-6">
            <CardHeader>
              <CardTitle>Collection Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">Analytics dashboard coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Collection Card Component
const CollectionCard: React.FC<{ 
  collection: Collection; 
  isOwner?: boolean;
}> = ({ collection, isOwner }) => {
  const mintProgress = (collection.totalSupply / collection.maxSupply) * 100;
  
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-square relative">
        <img 
          src={collection.imageUrl} 
          alt={collection.name}
          className="w-full h-full object-cover"
        />
        {!collection.revealed && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Badge className="bg-purple-600">Unrevealed</Badge>
          </div>
        )}
      </div>
      
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold truncate">{collection.name}</h3>
          <Badge variant="outline" className="text-xs">
            {collection.phase}
          </Badge>
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Price</span>
            <span className="font-medium">{collection.price} ETH</span>
          </div>
          
          <div className="flex justify-between text-gray-600">
            <span>Minted</span>
            <span className="font-medium">
              {collection.totalSupply}/{collection.maxSupply}
            </span>
          </div>
          
          <Progress value={mintProgress} className="h-1.5" />
        </div>
        
        <div className="mt-4 flex gap-2">
          {isOwner ? (
            <>
              <Button size="sm" className="flex-1">Manage</Button>
              <Button size="sm" variant="outline" className="flex-1">Analytics</Button>
            </>
          ) : (
            <>
              <Button size="sm" className="flex-1">Mint</Button>
              <Button size="sm" variant="outline" className="flex-1">View</Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LaunchpadDashboard;