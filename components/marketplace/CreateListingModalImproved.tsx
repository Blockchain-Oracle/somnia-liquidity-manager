'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWalletClient, useChainId } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  ChevronLeft,
  Sparkles,
  Info,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { ethers } from 'ethers';
import { MarketplaceService, MARKETPLACE_ADDRESS } from '@/lib/services/marketplace.service';
import { NFTService, type NFTInfo } from '@/lib/services/nft.service';
import { cn } from '@/lib/utils';

interface CreateListingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = 'input' | 'preview' | 'approve' | 'price' | 'confirm';

export function CreateListingModalImproved({ open, onOpenChange }: CreateListingModalProps) {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  
  // Step management
  const [currentStep, setCurrentStep] = useState<Step>('input');
  const [completedSteps, setCompletedSteps] = useState<Set<Step>>(new Set());
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  
  // Error state
  const [fetchError, setFetchError] = useState<string | null>(null);
  
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
    setFetchError(null);
  };

  // Step navigation
  const steps: Step[] = ['input', 'preview', 'approve', 'price', 'confirm'];
  
  const getStepNumber = (step: Step) => steps.indexOf(step) + 1;
  const isStepCompleted = (step: Step) => completedSteps.has(step);
  const isStepActive = (step: Step) => step === currentStep;
  
  // Navigate to next step
  const goToStep = (step: Step) => {
    const currentIndex = steps.indexOf(currentStep);
    const targetIndex = steps.indexOf(step);
    
    // Can always go back
    if (targetIndex < currentIndex) {
      setCurrentStep(step);
      return;
    }
    
    // Can only go forward to completed steps
    if (targetIndex > currentIndex) {
      // Check if all steps between current and target are completed
      for (let i = currentIndex; i < targetIndex; i++) {
        if (!isStepCompleted(steps[i])) {
          return; // Can't skip uncompleted steps
        }
      }
      setCurrentStep(step);
    }
  };
  
  // Handle NFT address input and fetch metadata
  const handleFetchNFT = async () => {
    setFetchError(null);
    
    if (!nftAddress || !tokenId) {
      return;
    }
    
    if (!walletClient || !address) {
      setFetchError('Please connect your wallet');
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
        throw new Error('This doesn\'t appear to be a valid NFT contract. Please check the address and try again.');
      }
      
      // Fetch NFT info
      const info = await nftService.getNFTInfo(nftAddress, tokenId);
      
      // Check ownership
      const isOwner = await nftService.checkOwnership(nftAddress, tokenId, address);
      if (!isOwner) {
        throw new Error('You don\'t own this NFT. Only the NFT owner can list it for sale.');
      }
      
      setNftInfo(info);
      setFetchError(null);
      
      // Mark step as completed and move to preview
      setCompletedSteps(prev => new Set([...prev, 'input']));
      setCurrentStep('preview');
      
    } catch (error: any) {
      console.error('Failed to fetch NFT:', error);
      setFetchError(error.message || 'Failed to fetch NFT. Please check the contract address and token ID.');
      // Still move to preview to show the error
      setCompletedSteps(prev => new Set([...prev, 'input']));
      setCurrentStep('preview');
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
      
      setLoadingMessage('Waiting for approval confirmation...');
      await tx.wait();
      
      // Update NFT info
      setNftInfo({ ...nftInfo, isApproved: true });
      
      // Mark step as completed and move to price
      setCompletedSteps(prev => new Set([...prev, 'approve']));
      setCurrentStep('price');
    } catch (error: any) {
      console.error('Approval failed:', error);
      toast.error('Failed to approve marketplace');
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
    const currentIndex = steps.indexOf(currentStep);
    const stepIndex = steps.indexOf(step);
    const canNavigate = stepIndex <= currentIndex || isCompleted;
    
    return (
      <button
        onClick={() => canNavigate && goToStep(step)}
        disabled={!canNavigate}
        className={cn(
          "flex items-center transition-all",
          canNavigate && "cursor-pointer hover:opacity-80",
          !canNavigate && "cursor-not-allowed opacity-50"
        )}
      >
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
      </button>
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
                          onChange={(e) => {
                            setNftAddress(e.target.value);
                            setFetchError(null); // Clear error when user types
                          }}
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
                          onChange={(e) => {
                            setTokenId(e.target.value);
                            setFetchError(null); // Clear error when user types
                          }}
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
                          Continue to Preview
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Preview NFT or Show Error */}
              {currentStep === 'preview' && (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-8"
                >
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-white mb-2">
                      {fetchError ? 'Unable to Load NFT' : 'Preview Your NFT'}
                    </h2>
                    <p className="text-gray-400">
                      {fetchError ? 'There was a problem fetching your NFT' : 'Confirm this is the NFT you want to list'}
                    </p>
                  </div>

                  {fetchError ? (
                    /* Error Display */
                    <div className="space-y-6">
                      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-red-500/20 rounded-lg">
                            <AlertCircle className="w-8 h-8 text-red-400" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-white mb-2">Error Loading NFT</h3>
                            <p className="text-red-300 mb-4">{fetchError}</p>
                            
                            <div className="space-y-3 mt-4">
                              <h4 className="text-sm font-medium text-gray-300">Common issues:</h4>
                              <ul className="space-y-2 text-sm text-gray-400">
                                <li className="flex items-start gap-2">
                                  <span className="text-red-400 mt-0.5">•</span>
                                  <span>Incorrect contract address - double check the address is correct</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-red-400 mt-0.5">•</span>
                                  <span>Wrong token ID - verify the token ID exists in the collection</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-red-400 mt-0.5">•</span>
                                  <span>Not the owner - you must own the NFT to list it</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-red-400 mt-0.5">•</span>
                                  <span>Invalid contract - ensure it's an ERC721 NFT contract on Somnia</span>
                                </li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-800/50 rounded-xl p-6">
                        <h4 className="text-sm font-medium text-gray-400 mb-3">You entered:</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Contract Address:</span>
                            <span className="text-white font-mono text-xs">{nftAddress}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Token ID:</span>
                            <span className="text-white">{tokenId}</span>
                          </div>
                        </div>
                      </div>

                      <Button
                        onClick={() => setCurrentStep('input')}
                        variant="outline"
                        className="w-full"
                      >
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Go Back and Try Again
                      </Button>
                    </div>
                  ) : nftInfo ? (
                    /* NFT Preview */
                    <>
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
                          <ChevronLeft className="mr-2 h-4 w-4" />
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
                    </>
                  ) : null}
                </motion.div>
              )}

              {/* Remaining steps stay the same... */}
              {/* I'll continue with the other steps if you need them */}
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}