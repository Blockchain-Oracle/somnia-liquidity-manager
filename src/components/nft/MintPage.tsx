import React, { useState, useEffect } from 'react';
import { useAccount, useContractRead, useContractWrite, useWaitForTransaction } from 'wagmi';
import { formatEther, parseEther } from 'viem';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Wallet,
  Plus,
  Minus,
  Clock,
  Users,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Zap,
  TrendingUp
} from 'lucide-react';

interface MintPageProps {
  contractAddress: string;
}

interface PhaseInfo {
  startTime: bigint;
  endTime: bigint;
  price: bigint;
  maxSupply: number;
  minted: number;
  isPublic: boolean;
  merkleRoot: string;
}

interface CollectionInfo {
  name: string;
  symbol: string;
  maxSupply: number;
  totalSupply: number;
  maxPerWallet: number;
  maxPerTransaction: number;
  revealed: boolean;
  paused: boolean;
}

export const MintPage: React.FC<MintPageProps> = ({ contractAddress }) => {
  const { address, isConnected } = useAccount();
  const [quantity, setQuantity] = useState(1);
  const [isWhitelisted, setIsWhitelisted] = useState(false);
  const [merkleProof, setMerkleProof] = useState<string[]>([]);
  const [timeRemaining, setTimeRemaining] = useState('');
  
  // Mock data - replace with actual contract reads
  const [collectionInfo] = useState<CollectionInfo>({
    name: 'Cosmic Pandas',
    symbol: 'CPND',
    maxSupply: 10000,
    totalSupply: 3421,
    maxPerWallet: 5,
    maxPerTransaction: 5,
    revealed: false,
    paused: false
  });

  const [currentPhase] = useState<PhaseInfo>({
    startTime: BigInt(Date.now() / 1000),
    endTime: BigInt((Date.now() / 1000) + 86400),
    price: parseEther('0.05'),
    maxSupply: 5000,
    minted: 3421,
    isPublic: false,
    merkleRoot: '0x...'
  });

  const [userMintInfo] = useState({
    balance: 2,
    canMint: true,
    maxMintable: 3,
    totalSpent: parseEther('0.1')
  });

  // Calculate time remaining
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now() / 1000;
      const end = Number(currentPhase.endTime);
      const remaining = end - now;
      
      if (remaining <= 0) {
        setTimeRemaining('Phase Ended');
      } else {
        const hours = Math.floor(remaining / 3600);
        const minutes = Math.floor((remaining % 3600) / 60);
        const seconds = Math.floor(remaining % 60);
        setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [currentPhase.endTime]);

  const handleMint = async () => {
    // Mint logic here
    console.log('Minting', quantity, 'NFTs');
  };

  const totalPrice = Number(formatEther(currentPhase.price)) * quantity;
  const mintProgress = (currentPhase.minted / currentPhase.maxSupply) * 100;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Collection Header */}
      <Card className="overflow-hidden">
        <div className="grid md:grid-cols-2">
          {/* Collection Image */}
          <div className="relative aspect-square bg-gradient-to-br from-purple-500 to-pink-500">
            <img 
              src="/api/placeholder/600/600" 
              alt={collectionInfo.name}
              className="w-full h-full object-cover"
            />
            {!collectionInfo.revealed && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                <div className="text-center text-white">
                  <EyeOff className="w-12 h-12 mx-auto mb-2" />
                  <p className="font-semibold">Unrevealed</p>
                  <p className="text-sm">Artwork will be revealed after mint</p>
                </div>
              </div>
            )}
          </div>

          {/* Mint Interface */}
          <div className="p-8 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-3xl font-bold">{collectionInfo.name}</h1>
                <Badge variant="outline">{collectionInfo.symbol}</Badge>
              </div>
              <p className="text-gray-600">
                A unique collection of digital art on Somnia blockchain
              </p>
            </div>

            {/* Phase Info */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium">
                    {currentPhase.isPublic ? 'Public Sale' : 'Whitelist Sale'}
                  </span>
                </div>
                <span className="text-sm font-semibold text-purple-600">
                  {timeRemaining}
                </span>
              </div>

              {/* Progress */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Minted</span>
                  <span className="font-semibold">
                    {currentPhase.minted} / {currentPhase.maxSupply}
                  </span>
                </div>
                <Progress value={mintProgress} className="h-2" />
              </div>

              {/* Price */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Price per NFT</p>
                  <p className="text-2xl font-bold">
                    {formatEther(currentPhase.price)} ETH
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-gray-400" />
              </div>
            </div>

            {/* Quantity Selector */}
            <div>
              <label className="text-sm font-medium mb-2 block">Quantity</label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="w-20 text-center"
                  min={1}
                  max={userMintInfo.maxMintable}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.min(userMintInfo.maxMintable, quantity + 1))}
                  disabled={quantity >= userMintInfo.maxMintable}
                >
                  <Plus className="w-4 h-4" />
                </Button>
                <span className="text-sm text-gray-500">
                  Max: {userMintInfo.maxMintable}
                </span>
              </div>
            </div>

            {/* Total Price */}
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Price</span>
                <span className="text-2xl font-bold text-purple-600">
                  {totalPrice.toFixed(3)} ETH
                </span>
              </div>
            </div>

            {/* Mint Button */}
            {isConnected ? (
              <Button 
                className="w-full" 
                size="lg"
                onClick={handleMint}
                disabled={collectionInfo.paused || !userMintInfo.canMint}
              >
                {collectionInfo.paused ? (
                  'Minting Paused'
                ) : !userMintInfo.canMint ? (
                  'Not Eligible'
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Mint {quantity} NFT{quantity > 1 ? 's' : ''}
                  </>
                )}
              </Button>
            ) : (
              <Button className="w-full" size="lg" disabled>
                <Wallet className="w-4 h-4 mr-2" />
                Connect Wallet to Mint
              </Button>
            )}

            {/* User Info */}
            {isConnected && (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-600">Your Balance</p>
                  <p className="font-semibold">{userMintInfo.balance} NFTs</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-600">Total Spent</p>
                  <p className="font-semibold">{formatEther(userMintInfo.totalSpent)} ETH</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Additional Info */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Collection Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Collection Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Supply</span>
              <span className="font-semibold">{collectionInfo.maxSupply}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Minted</span>
              <span className="font-semibold">{collectionInfo.totalSupply}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Unique Holders</span>
              <span className="font-semibold">1,234</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Floor Price</span>
              <span className="font-semibold">0.08 ETH</span>
            </div>
          </CardContent>
        </Card>

        {/* Mint Rules */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Mint Rules</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Max {collectionInfo.maxPerWallet} per wallet</p>
                <p className="text-xs text-gray-500">Prevent whales</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Max {collectionInfo.maxPerTransaction} per transaction</p>
                <p className="text-xs text-gray-500">Fair distribution</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">
                  {currentPhase.isPublic ? 'Public sale' : 'Whitelist only'}
                </p>
                <p className="text-xs text-gray-500">
                  {currentPhase.isPublic ? 'Open to everyone' : 'Pre-approved addresses'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="font-medium">0x1a2b...3c4d</span>
              </div>
              <p className="text-gray-600">Minted 2 NFTs</p>
              <p className="text-xs text-gray-400">2 minutes ago</p>
            </div>
            <div className="text-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="font-medium">0x5e6f...7g8h</span>
              </div>
              <p className="text-gray-600">Minted 5 NFTs</p>
              <p className="text-xs text-gray-400">5 minutes ago</p>
            </div>
            <div className="text-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="font-medium">0x9i0j...1k2l</span>
              </div>
              <p className="text-gray-600">Minted 1 NFT</p>
              <p className="text-xs text-gray-400">8 minutes ago</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {!currentPhase.isPublic && !isWhitelisted && isConnected && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This is a whitelist-only phase. You are not whitelisted for this collection.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default MintPage;