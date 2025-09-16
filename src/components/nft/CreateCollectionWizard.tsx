import React, { useState, useCallback } from 'react';
import { useAccount, useContractWrite, useWaitForTransaction } from 'wagmi';
import { parseEther, keccak256, toBytes } from 'viem';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  Image as ImageIcon, 
  FileText, 
  Settings, 
  Rocket,
  ChevronLeft,
  ChevronRight,
  Check,
  AlertCircle,
  Loader2,
  Calendar,
  Users,
  DollarSign
} from 'lucide-react';
import { IPFSService, CollectionConfig, MintPhaseConfig } from '@/services/nft/metadata';

const STEPS = [
  { id: 'basic', title: 'Basic Info', icon: FileText },
  { id: 'artwork', title: 'Artwork', icon: ImageIcon },
  { id: 'phases', title: 'Mint Phases', icon: Calendar },
  { id: 'advanced', title: 'Advanced', icon: Settings },
  { id: 'review', title: 'Review & Deploy', icon: Rocket }
];

export const CreateCollectionWizard: React.FC = () => {
  const { address } = useAccount();
  const [currentStep, setCurrentStep] = useState(0);
  const [isDeploying, setIsDeploying] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Form state
  const [formData, setFormData] = useState<Partial<CollectionConfig>>({
    name: '',
    symbol: '',
    description: '',
    maxSupply: 10000,
    maxPerWallet: 5,
    maxPerTransaction: 5,
    royaltyFeeBps: 250, // 2.5%
    royaltyReceiver: address || '',
    phases: []
  });

  const [files, setFiles] = useState<{
    images: File[];
    preRevealImage: File | null;
    collectionImage: File | null;
  }>({
    images: [],
    preRevealImage: null,
    collectionImage: null
  });

  const [phases, setPhases] = useState<MintPhaseConfig[]>([
    {
      name: 'Whitelist',
      startTime: new Date(),
      endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      price: '0.05',
      maxSupply: 1000,
      isPublic: false,
      whitelist: []
    }
  ]);

  const handleFileUpload = useCallback((
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'images' | 'preReveal' | 'collection'
  ) => {
    const uploadedFiles = Array.from(e.target.files || []);
    
    if (type === 'images') {
      setFiles(prev => ({ ...prev, images: [...prev.images, ...uploadedFiles] }));
    } else if (type === 'preReveal') {
      setFiles(prev => ({ ...prev, preRevealImage: uploadedFiles[0] }));
    } else {
      setFiles(prev => ({ ...prev, collectionImage: uploadedFiles[0] }));
    }
  }, []);

  const handleWhitelistUpload = useCallback((
    e: React.ChangeEvent<HTMLTextAreaElement>,
    phaseIndex: number
  ) => {
    const addresses = e.target.value.split('\n').filter(addr => addr.trim());
    setPhases(prev => {
      const updated = [...prev];
      updated[phaseIndex].whitelist = addresses;
      return updated;
    });
  }, []);

  const deployCollection = async () => {
    if (!address) return;
    
    setIsDeploying(true);
    setUploadProgress(10);
    
    try {
      // Initialize IPFS service
      const ipfsService = new IPFSService(process.env.NEXT_PUBLIC_NFT_STORAGE_KEY!);
      
      // Generate metadata for each NFT
      setUploadProgress(20);
      const metadata = files.images.map((_, index) => ({
        name: `${formData.name} #${index + 1}`,
        description: formData.description || '',
        image: '', // Will be filled by IPFS service
        attributes: []
      }));
      
      // Upload to IPFS
      setUploadProgress(40);
      const collectionData: CollectionConfig = {
        ...formData as CollectionConfig,
        images: files.images,
        metadata,
        preRevealImage: files.preRevealImage!,
        collectionImage: files.collectionImage!,
        phases
      };
      
      const { baseURI, preRevealURI, contractURI } = await ipfsService.uploadCollection(
        collectionData
      );
      
      setUploadProgress(60);
      
      // Generate merkle roots for whitelist phases
      const merkleRoots = phases.map(phase => {
        if (phase.isPublic) return '0x' + '0'.repeat(64);
        // In production, use merkletreejs
        return keccak256(toBytes(phase.whitelist?.join('') || ''));
      });
      
      setUploadProgress(80);
      
      // Deploy contract via factory
      // This would be the actual contract call
      console.log('Deploying with:', {
        baseURI,
        preRevealURI,
        contractURI,
        merkleRoots
      });
      
      setUploadProgress(100);
      
      // Success!
      alert('Collection deployed successfully!');
      
    } catch (error) {
      console.error('Deployment failed:', error);
      alert('Deployment failed. Please try again.');
    } finally {
      setIsDeploying(false);
      setUploadProgress(0);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Basic Info
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Collection Name</Label>
              <Input
                id="name"
                placeholder="My Awesome NFTs"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="symbol">Symbol</Label>
              <Input
                id="symbol"
                placeholder="AWESOME"
                value={formData.symbol}
                onChange={(e) => setFormData(prev => ({ ...prev, symbol: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your collection..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="maxSupply">Max Supply</Label>
                <Input
                  id="maxSupply"
                  type="number"
                  value={formData.maxSupply}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    maxSupply: parseInt(e.target.value) 
                  }))}
                />
              </div>
              
              <div>
                <Label htmlFor="maxPerWallet">Max Per Wallet</Label>
                <Input
                  id="maxPerWallet"
                  type="number"
                  value={formData.maxPerWallet}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    maxPerWallet: parseInt(e.target.value) 
                  }))}
                />
              </div>
              
              <div>
                <Label htmlFor="maxPerTx">Max Per Transaction</Label>
                <Input
                  id="maxPerTx"
                  type="number"
                  value={formData.maxPerTransaction}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    maxPerTransaction: parseInt(e.target.value) 
                  }))}
                />
              </div>
            </div>
          </div>
        );

      case 1: // Artwork
        return (
          <div className="space-y-6">
            {/* NFT Images */}
            <div>
              <Label>NFT Artwork</Label>
              <p className="text-sm text-gray-500 mb-2">
                Upload all NFT images (PNG, JPG, GIF)
              </p>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'images')}
                  className="hidden"
                  id="nft-images"
                />
                <label
                  htmlFor="nft-images"
                  className="flex flex-col items-center cursor-pointer"
                >
                  <Upload className="w-12 h-12 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">
                    Click to upload or drag and drop
                  </span>
                  {files.images.length > 0 && (
                    <span className="text-sm text-green-600 mt-2">
                      {files.images.length} images uploaded
                    </span>
                  )}
                </label>
              </div>
            </div>

            {/* Pre-reveal Image */}
            <div>
              <Label>Pre-Reveal Image</Label>
              <p className="text-sm text-gray-500 mb-2">
                Placeholder image shown before reveal
              </p>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'preReveal')}
                  className="hidden"
                  id="pre-reveal"
                />
                <label
                  htmlFor="pre-reveal"
                  className="flex items-center justify-center cursor-pointer"
                >
                  {files.preRevealImage ? (
                    <span className="text-sm text-green-600">
                      ✓ {files.preRevealImage.name}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-600">
                      Choose file...
                    </span>
                  )}
                </label>
              </div>
            </div>

            {/* Collection Banner */}
            <div>
              <Label>Collection Banner</Label>
              <p className="text-sm text-gray-500 mb-2">
                Banner image for marketplaces
              </p>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'collection')}
                  className="hidden"
                  id="collection-banner"
                />
                <label
                  htmlFor="collection-banner"
                  className="flex items-center justify-center cursor-pointer"
                >
                  {files.collectionImage ? (
                    <span className="text-sm text-green-600">
                      ✓ {files.collectionImage.name}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-600">
                      Choose file...
                    </span>
                  )}
                </label>
              </div>
            </div>
          </div>
        );

      case 2: // Mint Phases
        return (
          <div className="space-y-6">
            {phases.map((phase, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">Phase {index + 1}: {phase.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Start Date</Label>
                      <Input
                        type="datetime-local"
                        value={phase.startTime.toISOString().slice(0, 16)}
                        onChange={(e) => {
                          const updated = [...phases];
                          updated[index].startTime = new Date(e.target.value);
                          setPhases(updated);
                        }}
                      />
                    </div>
                    
                    <div>
                      <Label>End Date</Label>
                      <Input
                        type="datetime-local"
                        value={phase.endTime.toISOString().slice(0, 16)}
                        onChange={(e) => {
                          const updated = [...phases];
                          updated[index].endTime = new Date(e.target.value);
                          setPhases(updated);
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Price (ETH)</Label>
                      <Input
                        type="number"
                        step="0.001"
                        value={phase.price}
                        onChange={(e) => {
                          const updated = [...phases];
                          updated[index].price = e.target.value;
                          setPhases(updated);
                        }}
                      />
                    </div>
                    
                    <div>
                      <Label>Max Supply</Label>
                      <Input
                        type="number"
                        value={phase.maxSupply}
                        onChange={(e) => {
                          const updated = [...phases];
                          updated[index].maxSupply = parseInt(e.target.value);
                          setPhases(updated);
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={phase.isPublic}
                      onCheckedChange={(checked) => {
                        const updated = [...phases];
                        updated[index].isPublic = checked;
                        setPhases(updated);
                      }}
                    />
                    <Label>Public Sale (No Whitelist)</Label>
                  </div>
                  
                  {!phase.isPublic && (
                    <div>
                      <Label>Whitelist Addresses</Label>
                      <Textarea
                        placeholder="Enter addresses, one per line"
                        rows={4}
                        onChange={(e) => handleWhitelistUpload(e, index)}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {phase.whitelist?.length || 0} addresses added
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setPhases(prev => [...prev, {
                name: `Phase ${prev.length + 1}`,
                startTime: new Date(),
                endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                price: '0.05',
                maxSupply: 1000,
                isPublic: false,
                whitelist: []
              }])}
            >
              Add Phase
            </Button>
          </div>
        );

      case 3: // Advanced Settings
        return (
          <div className="space-y-4">
            <div>
              <Label>Royalty Percentage</Label>
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={formData.royaltyFeeBps / 100}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    royaltyFeeBps: parseFloat(e.target.value) * 100 
                  }))}
                />
                <span className="text-gray-500">%</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Royalty on secondary sales (max 10%)
              </p>
            </div>
            
            <div>
              <Label>Royalty Receiver</Label>
              <Input
                placeholder="0x..."
                value={formData.royaltyReceiver}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  royaltyReceiver: e.target.value 
                }))}
              />
            </div>
            
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Advanced settings cannot be changed after deployment
              </AlertDescription>
            </Alert>
          </div>
        );

      case 4: // Review & Deploy
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold">Collection Summary</h3>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Name:</span>
                  <p className="font-medium">{formData.name}</p>
                </div>
                <div>
                  <span className="text-gray-500">Symbol:</span>
                  <p className="font-medium">{formData.symbol}</p>
                </div>
                <div>
                  <span className="text-gray-500">Max Supply:</span>
                  <p className="font-medium">{formData.maxSupply}</p>
                </div>
                <div>
                  <span className="text-gray-500">Royalty:</span>
                  <p className="font-medium">{formData.royaltyFeeBps / 100}%</p>
                </div>
                <div>
                  <span className="text-gray-500">NFT Images:</span>
                  <p className="font-medium">{files.images.length} uploaded</p>
                </div>
                <div>
                  <span className="text-gray-500">Mint Phases:</span>
                  <p className="font-medium">{phases.length} configured</p>
                </div>
              </div>
            </div>
            
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Deployment fee: 0.01 ETH. Make sure you have enough balance.
              </AlertDescription>
            </Alert>
            
            {isDeploying && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Uploading to IPFS...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            )}
            
            <Button
              className="w-full"
              size="lg"
              onClick={deployCollection}
              disabled={isDeploying || !address}
            >
              {isDeploying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deploying...
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4 mr-2" />
                  Deploy Collection
                </>
              )}
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Create NFT Collection</CardTitle>
        
        {/* Progress Steps */}
        <div className="flex items-center justify-between mt-6">
          {STEPS.map((step, index) => (
            <div
              key={step.id}
              className={`flex flex-col items-center ${
                index <= currentStep ? 'text-purple-600' : 'text-gray-400'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                  index < currentStep
                    ? 'bg-purple-600 border-purple-600 text-white'
                    : index === currentStep
                    ? 'border-purple-600'
                    : 'border-gray-300'
                }`}
              >
                {index < currentStep ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <step.icon className="w-5 h-5" />
                )}
              </div>
              <span className="text-xs mt-1">{step.title}</span>
            </div>
          ))}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="min-h-[400px]">
          {renderStepContent()}
        </div>
        
        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
            disabled={currentStep === 0 || isDeploying}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          
          {currentStep < STEPS.length - 1 && (
            <Button
              onClick={() => setCurrentStep(prev => Math.min(STEPS.length - 1, prev + 1))}
              disabled={isDeploying}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CreateCollectionWizard;