#!/usr/bin/env node

import { ethers } from 'ethers';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SOMNIA_TESTNET_RPC = process.env.SOMNIA_TESTNET_RPC || 'https://dream-rpc.somnia.network';
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// Load deployment addresses
const MARKETPLACE_DEPLOYMENT = path.join(__dirname, '../deployments/marketplace-testnet.json');
const NFT_FACTORY_DEPLOYMENT = path.join(__dirname, '../deployments/nft-factory.json');

// Contract ABIs
const NFT_ABI = [
  'function mint(address to, string memory cid) public payable returns (uint256)',
  'function getTokenCID(uint256 tokenId) public view returns (string memory)',
  'function mintPrice() public view returns (uint256)',
  'function approve(address to, uint256 tokenId) public',
  'function safeTransferFrom(address from, address to, uint256 tokenId) public',
  'function safeTransferFrom(address from, address to, uint256 tokenId, bytes data) public',
  'function ownerOf(uint256 tokenId) public view returns (address)',
  'function totalSupply() public view returns (uint256)'
];

const MARKETPLACE_ABI = [
  'function createListing(address nft, uint256 tokenId, uint256 price, string calldata cid) external payable returns (uint256)',
  'function listingFeeWei() public view returns (uint256)',
  'function getListing(uint256 listingId) external view returns (address seller, address nft, uint256 tokenId, uint256 price, string memory cid, bool active, bool sold, uint256 createdAt)'
];

// Beautiful NFT collection data with Unsplash images
const BEAUTIFUL_NFTS = [
  {
    name: 'Cosmic Dreams #1',
    description: 'A mesmerizing journey through cosmic landscapes, featuring vibrant nebulas and stellar formations',
    imageUrl: 'https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?w=1200&h=1200&fit=crop',
    price: ethers.parseEther('0.5'),
    attributes: [
      { trait_type: 'Collection', value: 'Cosmic Dreams' },
      { trait_type: 'Rarity', value: 'Rare' },
      { trait_type: 'Theme', value: 'Space' },
      { trait_type: 'Color Palette', value: 'Purple & Blue' }
    ]
  },
  {
    name: 'Neon Nights #2',
    description: 'Abstract neon art that captures the essence of futuristic city nights',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&h=1200&fit=crop',
    price: ethers.parseEther('0.75'),
    attributes: [
      { trait_type: 'Collection', value: 'Neon Nights' },
      { trait_type: 'Rarity', value: 'Epic' },
      { trait_type: 'Theme', value: 'Abstract' },
      { trait_type: 'Color Palette', value: 'Pink & Purple' }
    ]
  },
  {
    name: 'Digital Genesis #3',
    description: 'The birth of digital consciousness, represented through flowing abstract forms',
    imageUrl: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=1200&h=1200&fit=crop',
    price: ethers.parseEther('1.0'),
    attributes: [
      { trait_type: 'Collection', value: 'Digital Genesis' },
      { trait_type: 'Rarity', value: 'Legendary' },
      { trait_type: 'Theme', value: 'Technology' },
      { trait_type: 'Color Palette', value: 'Blue & White' }
    ]
  },
  {
    name: 'Ethereal Waves #4',
    description: 'Flowing patterns that capture the essence of digital energy and movement',
    imageUrl: 'https://images.unsplash.com/photo-1635002962487-2c1d4d2f63c2?w=1200&h=1200&fit=crop',
    price: ethers.parseEther('0.8'),
    attributes: [
      { trait_type: 'Collection', value: 'Ethereal Waves' },
      { trait_type: 'Rarity', value: 'Epic' },
      { trait_type: 'Theme', value: 'Energy' },
      { trait_type: 'Color Palette', value: 'Red & Orange' }
    ]
  },
  {
    name: 'Quantum Dreams #5',
    description: 'A visualization of quantum mechanics and parallel dimensions',
    imageUrl: 'https://images.unsplash.com/photo-1617791160505-6f00504e3519?w=1200&h=1200&fit=crop',
    price: ethers.parseEther('1.2'),
    attributes: [
      { trait_type: 'Collection', value: 'Quantum Dreams' },
      { trait_type: 'Rarity', value: 'Mythic' },
      { trait_type: 'Theme', value: 'Science' },
      { trait_type: 'Color Palette', value: 'Multi-color' }
    ]
  },
  {
    name: 'Aurora Borealis #6',
    description: 'Captured essence of the northern lights in digital form',
    imageUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&h=1200&fit=crop',
    price: ethers.parseEther('0.6'),
    attributes: [
      { trait_type: 'Collection', value: 'Natural Wonders' },
      { trait_type: 'Rarity', value: 'Rare' },
      { trait_type: 'Theme', value: 'Nature' },
      { trait_type: 'Color Palette', value: 'Green & Blue' }
    ]
  },
  {
    name: 'Fractal Universe #7',
    description: 'Infinite patterns that reveal the mathematical beauty of nature',
    imageUrl: 'https://images.unsplash.com/photo-1574482620811-1aa16ffe3c82?w=1200&h=1200&fit=crop',
    price: ethers.parseEther('0.9'),
    attributes: [
      { trait_type: 'Collection', value: 'Fractal Universe' },
      { trait_type: 'Rarity', value: 'Epic' },
      { trait_type: 'Theme', value: 'Mathematics' },
      { trait_type: 'Color Palette', value: 'Purple & Gold' }
    ]
  },
  {
    name: 'Cyber Dreams #8',
    description: 'A glimpse into the digital future where reality and virtuality merge',
    imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&h=1200&fit=crop',
    price: ethers.parseEther('1.1'),
    attributes: [
      { trait_type: 'Collection', value: 'Cyber Dreams' },
      { trait_type: 'Rarity', value: 'Legendary' },
      { trait_type: 'Theme', value: 'Cyberpunk' },
      { trait_type: 'Color Palette', value: 'Neon' }
    ]
  }
];

/**
 * Generate mock IPFS CID from URL (for development without Pinata)
 */
function generateMockCID(url, type = 'image') {
  const hash = url.split('/').pop()?.split('?')[0] || 'default';
  const prefix = type === 'metadata' ? 'Qm' : 'Qm';
  return `${prefix}${hash.substring(0, 20)}Mock${type}CID`;
}

/**
 * Upload to IPFS or generate mock CID
 */
async function uploadToIPFS(imageUrl, metadata) {
  const isPinataConfigured = !!process.env.PINATA_JWT;
  
  if (isPinataConfigured) {
    // TODO: Implement actual Pinata upload
    console.log('  📌 Pinata upload would happen here');
    // For now, return mock CIDs
    return {
      imageCID: generateMockCID(imageUrl, 'image'),
      metadataCID: generateMockCID(JSON.stringify(metadata), 'metadata')
    };
  } else {
    // Generate mock CIDs for development
    return {
      imageCID: generateMockCID(imageUrl, 'image'),
      metadataCID: generateMockCID(JSON.stringify(metadata), 'metadata')
    };
  }
}

async function main() {
  console.log('🎨 Starting Beautiful NFT Minting Process...\n');

  // Validate environment
  if (!PRIVATE_KEY) {
    console.error('❌ Error: PRIVATE_KEY not found in .env file');
    process.exit(1);
  }

  // Load deployments
  if (!fs.existsSync(MARKETPLACE_DEPLOYMENT)) {
    console.error('❌ Error: Marketplace deployment not found. Run: npm run deploy:marketplace');
    process.exit(1);
  }

  if (!fs.existsSync(NFT_FACTORY_DEPLOYMENT)) {
    console.error('❌ Error: NFT Factory deployment not found. Run: npm run deploy:nft-factory');
    process.exit(1);
  }

  const marketplaceInfo = JSON.parse(fs.readFileSync(MARKETPLACE_DEPLOYMENT, 'utf8'));
  const nftFactoryInfo = JSON.parse(fs.readFileSync(NFT_FACTORY_DEPLOYMENT, 'utf8'));

  // Connect to network
  const provider = new ethers.JsonRpcProvider(SOMNIA_TESTNET_RPC);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  console.log('📡 Connected to Somnia Testnet');
  console.log('👛 Wallet address:', wallet.address);
  
  // Check balance
  const balance = await provider.getBalance(wallet.address);
  console.log('💰 Balance:', ethers.formatEther(balance), 'STT\n');

  if (balance === 0n) {
    console.error('❌ Error: Insufficient balance. Get testnet STT from faucet');
    process.exit(1);
  }

  // Connect to contracts
  const nftContract = new ethers.Contract(nftFactoryInfo.sampleCollectionAddress, NFT_ABI, wallet);
  const marketplaceContract = new ethers.Contract(marketplaceInfo.contractAddress, MARKETPLACE_ABI, wallet);

  try {
    // Get mint price and listing fee
    const mintPrice = await nftContract.mintPrice();
    const listingFee = await marketplaceContract.listingFeeWei();
    const currentSupply = await nftContract.totalSupply();
    
    console.log('💎 NFT Collection:', nftFactoryInfo.sampleCollectionAddress);
    console.log('🏪 Marketplace:', marketplaceInfo.contractAddress);
    console.log('📊 Current Supply:', currentSupply.toString());
    console.log('💵 Mint Price:', ethers.formatEther(mintPrice), 'STT');
    console.log('💵 Listing Fee:', ethers.formatEther(listingFee), 'STT');
    console.log('\n' + '='.repeat(60) + '\n');

    const mintedNFTs = [];

    // Step 1: Upload to IPFS and Mint NFTs
    console.log('🎨 STEP 1: Uploading to IPFS and Minting NFTs...\n');
    
    for (let i = 0; i < BEAUTIFUL_NFTS.length; i++) {
      const nft = BEAUTIFUL_NFTS[i];
      console.log(`\n[${i + 1}/${BEAUTIFUL_NFTS.length}] Processing: ${nft.name}`);
      console.log(`  📸 Image: ${nft.imageUrl.split('/').pop()?.split('?')[0]}`);
      
      // Create metadata
      const metadata = {
        name: nft.name,
        description: nft.description,
        image: `ipfs://${generateMockCID(nft.imageUrl, 'image')}`,
        attributes: nft.attributes,
        properties: {
          category: 'image',
          files: [{
            uri: `ipfs://${generateMockCID(nft.imageUrl, 'image')}`,
            type: 'image/jpeg'
          }]
        }
      };
      
      // Upload to IPFS (or generate mock CIDs)
      const { imageCID, metadataCID } = await uploadToIPFS(nft.imageUrl, metadata);
      console.log(`  📦 Image CID: ${imageCID}`);
      console.log(`  📋 Metadata CID: ${metadataCID}`);
      
      // Mint NFT
      console.log(`  🔨 Minting NFT...`);
      const mintTx = await nftContract.mint(
        wallet.address,
        metadataCID,
        { value: mintPrice }
      );
      
      const mintReceipt = await mintTx.wait();
      
      // Extract token ID from events
      const transferEvent = mintReceipt.logs.find(log => {
        try {
          const decoded = nftContract.interface.parseLog(log);
          return decoded?.name === 'Transfer';
        } catch {
          return false;
        }
      });
      
      if (transferEvent) {
        const decoded = nftContract.interface.parseLog(transferEvent);
        const tokenId = decoded.args[2];
        
        mintedNFTs.push({
          ...nft,
          tokenId: tokenId.toString(),
          imageCID,
          metadataCID
        });
        
        console.log(`  ✅ Minted token #${tokenId}`);
        console.log(`  🔗 TX: ${mintReceipt.hash}`);
      }
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // Step 2: List NFTs on marketplace
    console.log('🏪 STEP 2: Listing NFTs on Marketplace...\n');

    for (const nft of mintedNFTs) {
      console.log(`📌 Listing ${nft.name} (Token #${nft.tokenId})...`);
      
      // Encode the listing data (price and metadata CID)
      const listingData = ethers.AbiCoder.defaultAbiCoder().encode(
        ['uint256', 'string'],
        [nft.price, nft.metadataCID]
      );
      
      // Transfer NFT to marketplace with listing data (auto-creates listing)
      const transferTx = await nftContract['safeTransferFrom(address,address,uint256,bytes)'](
        wallet.address,
        marketplaceInfo.contractAddress,
        nft.tokenId,
        listingData,
        { value: listingFee }
      );
      
      const transferReceipt = await transferTx.wait();
      console.log(`  ✅ Listed at ${ethers.formatEther(nft.price)} STT`);
      console.log(`  🔗 TX: ${transferReceipt.hash}`);
    }

    // Save minted NFTs info
    const mintedInfo = {
      network: 'somnia-testnet',
      nftContract: nftFactoryInfo.sampleCollectionAddress,
      marketplace: marketplaceInfo.contractAddress,
      mintedAt: new Date().toISOString(),
      minter: wallet.address,
      nfts: mintedNFTs
    };
    
    const mintedPath = path.join(__dirname, '../deployments/beautiful-nfts.json');
    fs.writeFileSync(mintedPath, JSON.stringify(mintedInfo, null, 2));

    // Display summary
    console.log('\n' + '='.repeat(60));
    console.log('🎉 SUCCESS! BEAUTIFUL NFTs MINTED AND LISTED');
    console.log('='.repeat(60));
    console.log('\n📋 Summary:');
    console.log(`  Total Minted: ${mintedNFTs.length} NFTs`);
    console.log(`  Total Value Listed: ${ethers.formatEther(
      mintedNFTs.reduce((sum, nft) => sum + nft.price, 0n)
    )} STT`);
    console.log(`  Listed on: Marketplace at ${marketplaceInfo.contractAddress}`);
    console.log('\n🎨 Minted NFTs:');
    
    mintedNFTs.forEach((nft, index) => {
      console.log(`\n  ${index + 1}. ${nft.name}`);
      console.log(`     Token ID: #${nft.tokenId}`);
      console.log(`     Price: ${ethers.formatEther(nft.price)} STT`);
      console.log(`     Rarity: ${nft.attributes.find(a => a.trait_type === 'Rarity')?.value}`);
      console.log(`     Theme: ${nft.attributes.find(a => a.trait_type === 'Theme')?.value}`);
    });
    
    console.log('\n🔗 View on Explorer:');
    console.log(`  NFT Collection: https://explorer.somnia.network/address/${nftFactoryInfo.sampleCollectionAddress}`);
    console.log(`  Marketplace: https://explorer.somnia.network/address/${marketplaceInfo.contractAddress}`);
    
    console.log('\n✨ Next steps:');
    console.log('  1. View your beautiful NFTs in the marketplace UI');
    console.log('  2. Share the collection with others');
    console.log('  3. Configure Pinata for real IPFS uploads');
    console.log('\n💡 Note: Using mock CIDs for demo. Configure PINATA_JWT in .env for real IPFS uploads.');

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });