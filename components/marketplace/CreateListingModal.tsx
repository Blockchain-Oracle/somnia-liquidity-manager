'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWalletClient, useChainId } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  ArrowRight, 
  Check, 
  AlertCircle,
  Image as ImageIcon,
  FileText,
  DollarSign,
  Rocket,
  Shield,
  ChevronRight,
  Sparkles,
  Copy,
  ExternalLink,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import { ethers } from 'ethers';
import { MarketplaceService, MARKETPLACE_ADDRESS } from '@/lib/services/marketplace.service';
import { NFTService, type NFTInfo } from '@/lib/services/nft.service';
import { IPFSService } from '@/lib/services/ipfs.service';
import { cn } from '@/lib/utils';

interface CreateListingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = 'input' | 'preview' | 'approve' | 'price' | 'confirm';

export function CreateListingModal({ open, onOpenChange }: CreateListingModalProps) {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const chainId = useChainId();
  
  // Step management
  const [currentStep, setCurrentStep] = useState<Step>('input');
  const [completedSteps, setCompletedSteps] = useState<Set<Step>>(new Set());
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  
  // Error state
  const [error, setError] = useState<string | null>(null);
  
  // Form data
  const [nftAddress, setNftAddress] = useState('');
  const [tokenId, setTokenId] = useState('');
  const [nftInfo, setNftInfo] = useState<NFTInfo | null>(null);
  const [price, setPrice] = useState('');
  const [listingMethod, setListingMethod] = useState<'combined' | 'separate'>('combined');
  
  // Reset form
  const resetForm = () => {
    setCurrentStep('input');
    setCompletedSteps(new Set());
    setNftAddress('');
    setTokenId('');
    setNftInfo(null);
    setPrice('');
    setListingMethod('combined');
    setLoading(false);
    setLoadingMessage('');
    setError(null);
  };

  // Step navigation
  const steps: Step[] = ['input', 'preview', 'approve', 'price', 'confirm'];
  
  const getStepNumber = (step: Step) => steps.indexOf(step) + 1;
  const isStepCompleted = (step: Step) => completedSteps.has(step);
  const isStepActive = (step: Step) => step === currentStep;
  
  // Handle NFT address input and fetch metadata
  const handleFetchNFT = async () => {
    // Clear any previous error
    setError(null);
    
    if (!nftAddress || !tokenId) {
      setError('Please enter both NFT address and token ID');
      return;
    }
    
    if (!walletClient || !address) {
      setError('Please connect your wallet');
      return;
    }
    
    setLoading(true);
    setLoadingMessage('Fetching NFT information...');
    
    try {
      const provider = new ethers.BrowserProvider(walletClient);
      const signer = await provider.getSigner();
      const nftService = new NFTService(signer);
      
      // Validate contract
      const isValid = await nftService.validateNFTContract(nftAddress);
      if (!isValid) {
        throw new Error('Invalid NFT contract address. Please check the address and try again.');
      }
      
      // Fetch NFT info
      const info = await nftService.getNFTInfo(nftAddress, tokenId);
      
      // Check ownership
      const isOwner = await nftService.checkOwnership(nftAddress, tokenId, address);
      if (!isOwner) {
        throw new Error('You do not own this NFT. Only the NFT owner can list it for sale.');
      }
      
      setNftInfo(info);
      
      // Mark step as completed and move to preview
      setCompletedSteps(prev => new Set([...prev, 'input']));
      setCurrentStep('preview');
      
    } catch (error: any) {
      console.error('Failed to fetch NFT:', error);
      setError(error.message || 'Failed to fetch NFT. Please check the contract address and token ID.');
      // Don't move forward if there's an error
      setNftInfo(null);
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  // Handle approval
  const handleApprove = async () => {
    if (!walletClient || !address || !nftInfo) return;
    
    setLoading(true);
    setLoadingMessage('Approving marketplace...');
    
    try {
      const provider = new ethers.BrowserProvider(walletClient);
      const signer = await provider.getSigner();
      const nftService = new NFTService(signer);
      
      // Check if already approved
      if (nftInfo.isApproved) {
        toast.info('NFT is already approved');
        setCompletedSteps(prev => new Set([...prev, 'approve']));
        setCurrentStep('price');
        return;
      }
      
      // Approve
      const tx = await nftService.approveMarketplace(
        nftInfo.contractAddress,
        nftInfo.tokenId,
        MARKETPLACE_ADDRESS
      );
      
      toast.info('Waiting for approval confirmation...');
      await tx.wait();
      
      toast.success('Marketplace approved!');
      
      // Update NFT info
      setNftInfo({ ...nftInfo, isApproved: true });
      
      // Mark step as completed and move to price
      setCompletedSteps(prev => new Set([...prev, 'approve']));
      setCurrentStep('price');
    } catch (error: any) {
      console.error('Approval failed:', error);
      toast.error(error.message || 'Failed to approve marketplace');
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  // Handle listing creation
  const handleCreateListing = async () => {
    if (!walletClient || !address || !nftInfo || !price) return;
    
    setLoading(true);
    setLoadingMessage('Creating listing...');
    
    try {
      const provider = new ethers.BrowserProvider(walletClient);
      const signer = await provider.getSigner();
      const marketplaceService = new MarketplaceService(signer);
      
      const tokenIdBigInt = BigInt(nftInfo.tokenId);
      const priceWei = ethers.parseEther(price);
      
      // Use the CID we extracted from the NFT metadata
      // If no CID, generate one from the metadata
      let cid = nftInfo.cid || '';
      
      if (!cid && nftInfo.metadata) {
        // Generate CID from metadata
        const nftService = new NFTService(signer);
        cid = await nftService.generateMetadataCID(
          nftInfo.metadata.name || `${nftInfo.name} #${nftInfo.tokenId}`,
          nftInfo.metadata.description || '',
          nftInfo.imageUrl || '',
          nftInfo.metadata.attributes
        );
      }
      
      if (!cid) {
        throw new Error('Unable to determine metadata CID');
      }
      
      if (listingMethod === 'combined') {
        // One transaction: transfer NFT with data to auto-create listing
        const tx = await marketplaceService.escrowAndList(
          nftInfo.contractAddress,
          tokenIdBigInt,
          priceWei,
          cid
        );
        
        setLoadingMessage('Processing escrow and listing creation...');
        await tx.wait();
        toast.success('NFT listed successfully!');
      } else {
        // Two transactions: first escrow, then create listing
        const escrowTx = await marketplaceService.escrowNFT(
          nftInfo.contractAddress,
          tokenIdBigInt
        );
        
        setLoadingMessage('Step 1/2: Transferring NFT to escrow...');
        await escrowTx.wait();
        
        const listTx = await marketplaceService.createListing(
          nftInfo.contractAddress,
          tokenIdBigInt,
          priceWei,
          cid
        );
        
        setLoadingMessage('Step 2/2: Creating listing...');
        await listTx.wait();
        toast.success('NFT listed successfully!');
      }
      
      // Close modal and reset
      onOpenChange(false);
      resetForm();
      
      // Reload page to show new listing
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      console.error('Listing creation failed:', error);
      toast.error(error.message || 'Failed to create listing');
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  // Step indicator component
  const StepIndicator = ({ step, label }: { step: Step; label: string }) => {
    const stepNum = getStepNumber(step);
    const isCompleted = isStepCompleted(step);
    const isActive = isStepActive(step);
    
    return (
      <div className="flex items-center">
        <div
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all",
            isCompleted && "bg-green-500 text-white",
            isActive && !isCompleted && "bg-purple-500 text-white",
            !isActive && !isCompleted && "bg-gray-700 text-gray-400"
          )}
        >
          {isCompleted ? <Check className="w-5 h-5" /> : stepNum}
        </div>
        <span
          className={cn(
            "ml-3 text-sm font-medium transition-colors",
            isActive ? "text-white" : "text-gray-400"
          )}
        >
          {label}
        </span>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) resetForm();
      onOpenChange(open);
    }}>
      <DialogContent className="max-w-4xl bg-gradient-to-b from-gray-900 to-gray-950 border-gray-800 p-0 overflow-hidden">
        <div className="flex h-[700px]">
          {/* Sidebar with steps */}
          <div className="w-64 bg-gray-900/50 p-6 border-r border-gray-800">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-2">List Your NFT</h3>
              <p className="text-sm text-gray-400">Follow these steps to list your NFT on the marketplace</p>
            </div>
            
            <div className="space-y-4">
              <StepIndicator step="input" label="Enter NFT Details" />
              <div className="ml-5 border-l-2 border-gray-700 h-6" />
              <StepIndicator step="preview" label="Preview NFT" />
              <div className="ml-5 border-l-2 border-gray-700 h-6" />
              <StepIndicator step="approve" label="Approve Transfer" />
              <div className="ml-5 border-l-2 border-gray-700 h-6" />
              <StepIndicator step="price" label="Set Price" />
              <div className="ml-5 border-l-2 border-gray-700 h-6" />
              <StepIndicator step="confirm" label="Confirm Listing" />
            </div>
          </div>

          {/* Main content area */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              {/* Step 1: Input NFT Details */}
              {currentStep === 'input' && (
                <motion.div
                  key="input"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-8"
                >
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-white mb-2">Enter NFT Details</h2>
                    <p className="text-gray-400">Provide the contract address and token ID of your NFT</p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="nftAddress" className="text-gray-300 mb-2 block">
                        NFT Contract Address
                      </Label>
                      <div className="relative">
                        <Input
                          id="nftAddress"
                          placeholder="0x..."
                          value={nftAddress}
                          onChange={(e) => setNftAddress(e.target.value)}
                          className="bg-gray-800/50 border-gray-700 text-white pr-10"
                          disabled={loading}
                        />
                        <FileText className="absolute right-3 top-3 w-5 h-5 text-gray-500" />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        The smart contract address of your NFT collection
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="tokenId" className="text-gray-300 mb-2 block">
                        Token ID
                      </Label>
                      <div className="relative">
                        <Input
                          id="tokenId"
                          type="number"
                          placeholder="e.g., 1"
                          value={tokenId}
                          onChange={(e) => setTokenId(e.target.value)}
                          className="bg-gray-800/50 border-gray-700 text-white pr-10"
                          disabled={loading}
                        />
                        <Sparkles className="absolute right-3 top-3 w-5 h-5 text-gray-500" />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        The unique identifier of your specific NFT
                      </p>
                    </div>

                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-blue-400 mt-0.5" />
                        <div className="text-sm text-gray-300">
                          <p className="font-medium mb-1">How it works:</p>
                          <ul className="space-y-1 text-gray-400">
                            <li>• We'll fetch your NFT metadata automatically</li>
                            <li>• You must be the current owner of the NFT</li>
                            <li>• The NFT will be transferred to our escrow contract</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={handleFetchNFT}
                      disabled={loading || !nftAddress || !tokenId}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {loadingMessage}
                        </>
                      ) : (
                        <>
                          Fetch NFT
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Preview NFT */}
              {currentStep === 'preview' && nftInfo && (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-8"
                >
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-white mb-2">Preview Your NFT</h2>
                    <p className="text-gray-400">Confirm this is the NFT you want to list</p>
                  </div>

                  <div className="bg-gray-800/50 rounded-xl p-6 mb-6">
                    <div className="flex gap-6">
                      {/* NFT Image */}
                      <div className="w-48 h-48 bg-gray-900 rounded-lg overflow-hidden">
                        {nftInfo.imageUrl ? (
                          <img
                            src={nftInfo.imageUrl}
                            alt={nftInfo.metadata?.name || 'NFT'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="w-16 h-16 text-gray-600" />
                          </div>
                        )}
                      </div>

                      {/* NFT Details */}
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-white mb-2">
                          {nftInfo.metadata?.name || `${nftInfo.name} #${nftInfo.tokenId}`}
                        </h3>
                        
                        <div className="flex items-center gap-2 mb-4">
                          <Badge variant="secondary">{nftInfo.symbol}</Badge>
                          <Badge variant="outline">Token ID: {nftInfo.tokenId}</Badge>
                        </div>

                        {nftInfo.metadata?.description && (
                          <p className="text-gray-400 text-sm mb-4">
                            {nftInfo.metadata.description}
                          </p>
                        )}

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Collection:</span>
                            <span className="text-white font-mono">{nftInfo.name}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Owner:</span>
                            <span className="text-white font-mono">
                              {nftInfo.owner.slice(0, 6)}...{nftInfo.owner.slice(-4)}
                            </span>
                          </div>
                          {nftInfo.cid && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-500">Metadata CID:</span>
                              <span className="text-white font-mono">
                                {nftInfo.cid.slice(0, 8)}...
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Traits */}
                    {nftInfo.metadata?.attributes && nftInfo.metadata.attributes.length > 0 && (
                      <div className="mt-6">
                        <h4 className="text-sm font-medium text-gray-400 mb-3">Traits</h4>
                        <div className="grid grid-cols-3 gap-3">
                          {nftInfo.metadata.attributes.map((attr, idx) => (
                            <div key={idx} className="bg-gray-900/50 rounded-lg p-3">
                              <div className="text-xs text-gray-500">{attr.trait_type}</div>
                              <div className="text-sm text-white font-medium">{attr.value}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep('input')}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={() => {
                        setCompletedSteps(prev => new Set([...prev, 'preview']));
                        setCurrentStep('approve');
                      }}
                      className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    >
                      Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Approve */}
              {currentStep === 'approve' && (
                <motion.div
                  key="approve"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-8"
                >
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-white mb-2">Approve Marketplace</h2>
                    <p className="text-gray-400">Allow the marketplace to transfer your NFT</p>
                  </div>

                  {!nftInfo ? (
                    <div className="bg-red-900/20 border border-red-500 rounded-xl p-6">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-2">NFT Information Not Available</h3>
                          <p className="text-gray-300 mb-4">
                            We couldn't retrieve your NFT information. Please go back and try again.
                          </p>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setCurrentStep('input');
                              setNftInfo(null);
                              setError(null);
                            }}
                            className="bg-red-500/20 hover:bg-red-500/30 text-white"
                          >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Input
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                  <div className="space-y-6">
                    <div className="bg-gray-800/50 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Shield className="w-10 h-10 text-purple-400" />
                          <div>
                            <h3 className="text-lg font-semibold text-white">Approval Required</h3>
                            <p className="text-sm text-gray-400">One-time approval for this NFT</p>
                          </div>
                        </div>
                        {nftInfo.isApproved && (
                          <Badge className="bg-green-500/20 text-green-400">
                            <Check className="w-3 h-3 mr-1" />
                            Approved
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-green-400 mt-0.5" />
                          <p className="text-sm text-gray-300">
                            This approval allows the marketplace to transfer your NFT when sold
                          </p>
                        </div>
                        <div className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-green-400 mt-0.5" />
                          <p className="text-sm text-gray-300">
                            You remain the owner until someone purchases your NFT
                          </p>
                        </div>
                        <div className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-green-400 mt-0.5" />
                          <p className="text-sm text-gray-300">
                            You can cancel the listing at any time before sale
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
                        <div className="text-sm text-gray-300">
                          <p className="font-medium mb-1">Transaction Required:</p>
                          <p className="text-gray-400">
                            You'll need to confirm a transaction in your wallet to approve the marketplace.
                            {nftInfo.isApproved && ' Your NFT is already approved, you can skip this step.'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentStep('preview')}
                        className="flex-1"
                      >
                        Back
                      </Button>
                      {nftInfo.isApproved ? (
                        <Button
                          onClick={() => {
                            setCompletedSteps(prev => new Set([...prev, 'approve']));
                            setCurrentStep('price');
                          }}
                          className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                        >
                          Continue (Already Approved)
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          onClick={handleApprove}
                          disabled={loading}
                          className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              {loadingMessage}
                            </>
                          ) : (
                            <>
                              Approve
                              <Shield className="ml-2 h-4 w-4" />
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                  )}
                </motion.div>
              )}

              {/* Step 4: Set Price */}
              {currentStep === 'price' && (
                <motion.div
                  key="price"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-8"
                >
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-white mb-2">Set Your Price</h2>
                    <p className="text-gray-400">Choose the listing price for your NFT</p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="price" className="text-gray-300 mb-2 block">
                        Listing Price (STT)
                      </Label>
                      <div className="relative">
                        <Input
                          id="price"
                          type="number"
                          step="0.001"
                          placeholder="0.00"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          className="bg-gray-800/50 border-gray-700 text-white text-2xl py-6 pr-20"
                        />
                        <div className="absolute right-3 top-3 bottom-3 flex items-center">
                          <Badge variant="secondary" className="text-lg">STT</Badge>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-800/50 rounded-xl p-6">
                      <h3 className="text-sm font-medium text-gray-400 mb-4">Price Breakdown</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Listing Price</span>
                          <span className="text-white font-medium">
                            {price || '0'} STT
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Platform Fee (2.5%)</span>
                          <span className="text-yellow-400 font-medium">
                            {price ? (parseFloat(price) * 0.025).toFixed(4) : '0'} STT
                          </span>
                        </div>
                        <div className="border-t border-gray-700 pt-3">
                          <div className="flex justify-between">
                            <span className="text-gray-300 font-medium">You'll Receive</span>
                            <span className="text-green-400 font-semibold text-lg">
                              {price ? (parseFloat(price) * 0.975).toFixed(4) : '0'} STT
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-blue-400 mt-0.5" />
                        <div className="text-sm text-gray-300">
                          <p className="font-medium mb-1">Listing Method:</p>
                          <div className="space-y-2 mt-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                value="combined"
                                checked={listingMethod === 'combined'}
                                onChange={(e) => setListingMethod(e.target.value as any)}
                                className="text-purple-500"
                              />
                              <span className="text-gray-400">
                                One-Step (Recommended) - Transfer and list in single transaction
                              </span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                value="separate"
                                checked={listingMethod === 'separate'}
                                onChange={(e) => setListingMethod(e.target.value as any)}
                                className="text-purple-500"
                              />
                              <span className="text-gray-400">
                                Two-Step - Transfer first, then create listing
                              </span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentStep('approve')}
                        className="flex-1"
                      >
                        Back
                      </Button>
                      <Button
                        onClick={() => {
                          if (!price || parseFloat(price) <= 0) {
                            toast.error('Please enter a valid price');
                            return;
                          }
                          setCompletedSteps(prev => new Set([...prev, 'price']));
                          setCurrentStep('confirm');
                        }}
                        disabled={!price || parseFloat(price) <= 0}
                        className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                      >
                        Continue
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 5: Confirm */}
              {currentStep === 'confirm' && nftInfo && (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-8"
                >
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-white mb-2">Confirm Listing</h2>
                    <p className="text-gray-400">Review your listing details before creating</p>
                  </div>

                  <div className="space-y-6">
                    {/* NFT Summary */}
                    <div className="bg-gray-800/50 rounded-xl p-6">
                      <div className="flex gap-4 mb-4">
                        <div className="w-20 h-20 bg-gray-900 rounded-lg overflow-hidden">
                          {nftInfo.imageUrl ? (
                            <img
                              src={nftInfo.imageUrl}
                              alt={nftInfo.metadata?.name || 'NFT'}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="w-8 h-8 text-gray-600" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white">
                            {nftInfo.metadata?.name || `${nftInfo.name} #${nftInfo.tokenId}`}
                          </h3>
                          <p className="text-sm text-gray-400">{nftInfo.symbol}</p>
                          <div className="mt-2">
                            <span className="text-2xl font-bold text-white">{price} STT</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-700">
                        <div>
                          <span className="text-xs text-gray-500">Contract</span>
                          <p className="text-sm text-white font-mono">
                            {nftInfo.contractAddress.slice(0, 6)}...{nftInfo.contractAddress.slice(-4)}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">Token ID</span>
                          <p className="text-sm text-white">{nftInfo.tokenId}</p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">Listing Method</span>
                          <p className="text-sm text-white">
                            {listingMethod === 'combined' ? 'One-Step' : 'Two-Step'}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">Platform Fee</span>
                          <p className="text-sm text-white">2.5%</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Rocket className="w-5 h-5 text-green-400 mt-0.5" />
                        <div className="text-sm text-gray-300">
                          <p className="font-medium mb-1">Ready to List!</p>
                          <p className="text-gray-400">
                            {listingMethod === 'combined'
                              ? 'Your NFT will be transferred and listed in a single transaction.'
                              : 'Your NFT will be transferred to escrow first, then the listing will be created.'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentStep('price')}
                        className="flex-1"
                      >
                        Back
                      </Button>
                      <Button
                        onClick={handleCreateListing}
                        disabled={loading}
                        className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {loadingMessage}
                          </>
                        ) : (
                          <>
                            Create Listing
                            <Rocket className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}