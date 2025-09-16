'use client';

import { useState } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Upload, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ethers } from 'ethers';
import { MarketplaceService } from '@/lib/services/marketplace.service';

export function CreateListingButton() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'escrow' | 'list'>('escrow');
  
  // Form state
  const [nftAddress, setNftAddress] = useState('');
  const [tokenId, setTokenId] = useState('');
  const [price, setPrice] = useState('');
  const [cid, setCid] = useState('');
  const [escrowMethod, setEscrowMethod] = useState<'separate' | 'combined'>('combined');
  
  const resetForm = () => {
    setNftAddress('');
    setTokenId('');
    setPrice('');
    setCid('');
    setStep('escrow');
    setEscrowMethod('combined');
  };
  
  const handleEscrowAndList = async () => {
    if (!walletClient || !address) {
      toast.error('Please connect your wallet');
      return;
    }
    
    if (!nftAddress || !tokenId || !price || !cid) {
      toast.error('Please fill in all fields');
      return;
    }
    
    setLoading(true);
    try {
      const provider = new ethers.BrowserProvider(walletClient);
      const signer = await provider.getSigner();
      const marketplaceService = new MarketplaceService(signer);
      
      const tokenIdBigInt = BigInt(tokenId);
      const priceWei = ethers.parseEther(price);
      
      if (escrowMethod === 'combined') {
        // One transaction: transfer NFT with data to auto-create listing
        const tx = await marketplaceService.escrowAndList(
          nftAddress,
          tokenIdBigInt,
          priceWei,
          cid
        );
        
        toast.info('Processing escrow and listing creation...');
        await tx.wait();
        toast.success('NFT listed successfully!');
      } else {
        // Two transactions: first escrow, then create listing
        const escrowTx = await marketplaceService.escrowNFT(nftAddress, tokenIdBigInt);
        toast.info('Step 1/2: Transferring NFT to escrow...');
        await escrowTx.wait();
        
        const listTx = await marketplaceService.createListing(
          nftAddress,
          tokenIdBigInt,
          priceWei,
          cid
        );
        toast.info('Step 2/2: Creating listing...');
        await listTx.wait();
        toast.success('NFT listed successfully!');
      }
      
      setOpen(false);
      resetForm();
      
      // Reload the page to show new listing
      window.location.reload();
    } catch (error: any) {
      console.error('Listing creation failed:', error);
      toast.error(error.message || 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };
  
  if (!address) {
    return null;
  }
  
  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
      >
        <Plus className="mr-2 h-4 w-4" />
        List NFT
      </Button>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px] bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">List Your NFT</DialogTitle>
            <DialogDescription className="text-gray-400">
              Transfer your NFT to the marketplace escrow and create a listing
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <Tabs value={escrowMethod} onValueChange={(v) => setEscrowMethod(v as any)}>
              <TabsList className="grid w-full grid-cols-2 bg-gray-800">
                <TabsTrigger value="combined">One-Step (Recommended)</TabsTrigger>
                <TabsTrigger value="separate">Two-Step</TabsTrigger>
              </TabsList>
              
              <TabsContent value="combined" className="text-sm text-gray-400 mt-2">
                Transfer NFT and create listing in a single transaction
              </TabsContent>
              
              <TabsContent value="separate" className="text-sm text-gray-400 mt-2">
                First transfer NFT to escrow, then create the listing
              </TabsContent>
            </Tabs>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="nftAddress" className="text-gray-300">NFT Contract Address</Label>
                <Input
                  id="nftAddress"
                  placeholder="0x..."
                  value={nftAddress}
                  onChange={(e) => setNftAddress(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white"
                  disabled={loading}
                />
              </div>
              
              <div>
                <Label htmlFor="tokenId" className="text-gray-300">Token ID</Label>
                <Input
                  id="tokenId"
                  type="number"
                  placeholder="e.g., 1"
                  value={tokenId}
                  onChange={(e) => setTokenId(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white"
                  disabled={loading}
                />
              </div>
              
              <div>
                <Label htmlFor="price" className="text-gray-300">Price (ETH)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.001"
                  placeholder="e.g., 0.1"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Platform fee: 2.5% (paid by buyer)
                </p>
              </div>
              
              <div>
                <Label htmlFor="cid" className="text-gray-300">IPFS CID (Metadata)</Label>
                <Input
                  id="cid"
                  placeholder="QmXxx... or bafyxxx..."
                  value={cid}
                  onChange={(e) => setCid(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  The IPFS content identifier for your NFT metadata/image
                </p>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setOpen(false);
                  resetForm();
                }}
                disabled={loading}
              >
                Cancel
              </Button>
              
              <Button
                onClick={handleEscrowAndList}
                disabled={loading || !nftAddress || !tokenId || !price || !cid}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Create Listing
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}