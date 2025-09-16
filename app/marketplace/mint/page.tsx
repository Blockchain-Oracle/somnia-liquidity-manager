'use client';

import { useState } from 'react';
import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Upload, Sparkles, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { parseEther, formatEther } from 'viem';
import IPFSService from '@/lib/services/ipfs.service';

// Contract ABIs
const NFT_FACTORY_ABI = [
  {
    inputs: [
      { name: '_name', type: 'string' },
      { name: '_symbol', type: 'string' },
      { name: '_collectionCID', type: 'string' },
      { name: '_maxSupply', type: 'uint256' },
      { name: '_mintPrice', type: 'uint256' }
    ],
    name: 'deployCollection',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'payable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getDeployedCollections',
    outputs: [{ name: '', type: 'address[]' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const;

const NFT_ABI = [
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'cid', type: 'string' }
    ],
    name: 'mint',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'payable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'mintPrice',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'maxSupply',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const;

export default function MintPage() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  
  const [activeTab, setActiveTab] = useState<'mint' | 'deploy'>('mint');
  const [loading, setLoading] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState('');
  const [collections, setCollections] = useState<string[]>([]);
  
  // Mint form state
  const [nftName, setNftName] = useState('');
  const [nftDescription, setNftDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  
  // Deploy form state
  const [collectionName, setCollectionName] = useState('');
  const [collectionSymbol, setCollectionSymbol] = useState('');
  const [maxSupply, setMaxSupply] = useState('100');
  const [mintPrice, setMintPrice] = useState('0.01');
  
  // Load deployed collections
  const loadCollections = async () => {
    try {
      // Check if deployment file exists
      const response = await fetch('/api/deployments');
      if (response.ok) {
        const data = await response.json();
        if (data.nftFactory) {
          const result = await publicClient?.readContract({
            address: data.nftFactory as `0x${string}`,
            abi: NFT_FACTORY_ABI,
            functionName: 'getDeployedCollections'
          });
          if (result) {
            setCollections(result as string[]);
            if (result.length > 0 && !selectedCollection) {
              setSelectedCollection(result[0]);
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to load collections:', error);
    }
  };
  
  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Mint NFT
  const handleMint = async () => {
    if (!walletClient || !publicClient || !address) {
      toast.error('Please connect your wallet');
      return;
    }
    
    if (!selectedCollection) {
      toast.error('Please select a collection');
      return;
    }
    
    if (!imageFile) {
      toast.error('Please select an image');
      return;
    }
    
    setLoading(true);
    try {
      // Upload image to IPFS
      toast.info('Uploading image to IPFS...');
      const imageCID = await IPFSService.uploadImage(imageFile);
      
      // Create metadata
      const metadata = {
        name: nftName,
        description: nftDescription,
        image: `ipfs://${imageCID}`,
        attributes: []
      };
      
      // Upload metadata to IPFS
      toast.info('Uploading metadata to IPFS...');
      const metadataCID = await IPFSService.uploadJSON(metadata);
      
      // Get mint price
      const mintPriceWei = await publicClient.readContract({
        address: selectedCollection as `0x${string}`,
        abi: NFT_ABI,
        functionName: 'mintPrice'
      });
      
      // Mint NFT
      toast.info('Minting NFT...');
      const { request } = await publicClient.simulateContract({
        address: selectedCollection as `0x${string}`,
        abi: NFT_ABI,
        functionName: 'mint',
        args: [address, metadataCID],
        value: mintPriceWei as bigint,
        account: address
      });
      
      const hash = await walletClient.writeContract(request);
      
      toast.info('Transaction submitted, waiting for confirmation...');
      await publicClient.waitForTransactionReceipt({ hash });
      
      toast.success('NFT minted successfully!');
      
      // Reset form
      setNftName('');
      setNftDescription('');
      setImageFile(null);
      setImagePreview('');
      
    } catch (error: any) {
      console.error('Mint error:', error);
      toast.error(error.message || 'Failed to mint NFT');
    } finally {
      setLoading(false);
    }
  };
  
  // Deploy new collection
  const handleDeploy = async () => {
    if (!walletClient || !publicClient || !address) {
      toast.error('Please connect your wallet');
      return;
    }
    
    setLoading(true);
    try {
      // Get factory address
      const response = await fetch('/api/deployments');
      if (!response.ok) {
        throw new Error('NFT Factory not deployed');
      }
      
      const data = await response.json();
      if (!data.nftFactory) {
        throw new Error('NFT Factory address not found');
      }
      
      // Deploy collection
      toast.info('Deploying NFT collection...');
      const { request } = await publicClient.simulateContract({
        address: data.nftFactory as `0x${string}`,
        abi: NFT_FACTORY_ABI,
        functionName: 'deployCollection',
        args: [
          collectionName,
          collectionSymbol,
          'QmCollectionCID', // Mock CID for demo
          BigInt(maxSupply),
          parseEther(mintPrice)
        ],
        account: address
      });
      
      const hash = await walletClient.writeContract(request);
      
      toast.info('Transaction submitted, waiting for confirmation...');
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      
      toast.success('Collection deployed successfully!');
      
      // Reload collections
      await loadCollections();
      
      // Reset form
      setCollectionName('');
      setCollectionSymbol('');
      setMaxSupply('100');
      setMintPrice('0.01');
      setActiveTab('mint');
      
    } catch (error: any) {
      console.error('Deploy error:', error);
      toast.error(error.message || 'Failed to deploy collection');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Create NFT</h1>
          <p className="text-muted-foreground">
            Deploy your own collection or mint NFTs
          </p>
        </div>
        
        {!isConnected ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please connect your wallet to create NFTs
            </AlertDescription>
          </Alert>
        ) : (
          <Card>
            <CardHeader>
              <div className="flex gap-4 mb-4">
                <Button
                  variant={activeTab === 'mint' ? 'default' : 'outline'}
                  onClick={() => setActiveTab('mint')}
                >
                  Mint NFT
                </Button>
                <Button
                  variant={activeTab === 'deploy' ? 'default' : 'outline'}
                  onClick={() => setActiveTab('deploy')}
                >
                  Deploy Collection
                </Button>
              </div>
            </CardHeader>
            
            <CardContent>
              {activeTab === 'mint' ? (
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="collection">Collection</Label>
                    <select
                      id="collection"
                      className="w-full mt-2 p-2 border rounded-md"
                      value={selectedCollection}
                      onChange={(e) => setSelectedCollection(e.target.value)}
                      onFocus={loadCollections}
                    >
                      <option value="">Select a collection</option>
                      {collections.map((addr) => (
                        <option key={addr} value={addr}>
                          {addr.slice(0, 6)}...{addr.slice(-4)}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="name">NFT Name</Label>
                    <Input
                      id="name"
                      value={nftName}
                      onChange={(e) => setNftName(e.target.value)}
                      placeholder="My Amazing NFT"
                      className="mt-2"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={nftDescription}
                      onChange={(e) => setNftDescription(e.target.value)}
                      placeholder="Describe your NFT..."
                      className="mt-2"
                      rows={4}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="image">Image</Label>
                    <div className="mt-2">
                      {imagePreview ? (
                        <div className="relative">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full h-64 object-cover rounded-lg"
                          />
                          <Button
                            size="sm"
                            variant="secondary"
                            className="absolute top-2 right-2"
                            onClick={() => {
                              setImageFile(null);
                              setImagePreview('');
                            }}
                          >
                            Change
                          </Button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50">
                          <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            Click to upload image
                          </span>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageSelect}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    className="w-full"
                    onClick={handleMint}
                    disabled={loading || !selectedCollection || !imageFile}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Minting...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Mint NFT
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="collectionName">Collection Name</Label>
                    <Input
                      id="collectionName"
                      value={collectionName}
                      onChange={(e) => setCollectionName(e.target.value)}
                      placeholder="My NFT Collection"
                      className="mt-2"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="symbol">Symbol</Label>
                    <Input
                      id="symbol"
                      value={collectionSymbol}
                      onChange={(e) => setCollectionSymbol(e.target.value)}
                      placeholder="MNC"
                      className="mt-2"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="maxSupply">Max Supply</Label>
                    <Input
                      id="maxSupply"
                      type="number"
                      value={maxSupply}
                      onChange={(e) => setMaxSupply(e.target.value)}
                      placeholder="100"
                      className="mt-2"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="mintPrice">Mint Price (STT)</Label>
                    <Input
                      id="mintPrice"
                      type="number"
                      step="0.001"
                      value={mintPrice}
                      onChange={(e) => setMintPrice(e.target.value)}
                      placeholder="0.01"
                      className="mt-2"
                    />
                  </div>
                  
                  <Button
                    className="w-full"
                    onClick={handleDeploy}
                    disabled={loading || !collectionName || !collectionSymbol}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deploying...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Deploy Collection
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}