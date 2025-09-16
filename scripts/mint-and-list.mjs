#!/usr/bin/env node

import { ethers } from 'ethers';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SOMNIA_TESTNET_RPC = process.env.SOMNIA_TESTNET_RPC || 'https://rpc.testnet.somnia.network';
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
  'function ownerOf(uint256 tokenId) public view returns (address)'
];

const MARKETPLACE_ABI = [
  'function createListing(address nft, uint256 tokenId, uint256 price, string calldata cid) external payable returns (uint256)',
  'function listingFeeWei() public view returns (uint256)',
  'function getListing(uint256 listingId) external view returns (address seller, address nft, uint256 tokenId, uint256 price, string memory cid, bool active, bool sold, uint256 createdAt)'
];

// Sample NFT data (using Unsplash images)
const SAMPLE_NFTS = [
  {
    name: 'Cosmic Dreams #1',
    description: 'A journey through the cosmic void',
    imageCID: 'QmCosmic1MockCID', // Mock CID - in production, upload to IPFS first
    price: ethers.parseEther('0.5') // List for 0.5 STT
  },
  {
    name: 'Neon Nights #2',
    description: 'Vibrant neon art from the future',
    imageCID: 'QmNeon2MockCID',
    price: ethers.parseEther('0.75')
  },
  {
    name: 'Digital Genesis #3',
    description: 'The beginning of a new digital era',
    imageCID: 'QmGenesis3MockCID',
    price: ethers.parseEther('1.0')
  }
];

async function main() {
  console.log('🎨 Starting NFT minting and marketplace listing...\n');

  // Validate environment
  if (!PRIVATE_KEY) {
    console.error('❌ Error: PRIVATE_KEY not found in .env file');
    process.exit(1);
  }

  // Load deployments
  if (!fs.existsSync(MARKETPLACE_DEPLOYMENT)) {
    console.error('❌ Error: Marketplace deployment not found. Run: npm run deploy-marketplace');
    process.exit(1);
  }

  if (!fs.existsSync(NFT_FACTORY_DEPLOYMENT)) {
    console.error('❌ Error: NFT Factory deployment not found. Run: npm run deploy-nft-factory');
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

  // Connect to contracts
  const nftContract = new ethers.Contract(nftFactoryInfo.sampleCollectionAddress, NFT_ABI, wallet);
  const marketplaceContract = new ethers.Contract(marketplaceInfo.contractAddress, MARKETPLACE_ABI, wallet);

  try {
    // Get mint price and listing fee
    const mintPrice = await nftContract.mintPrice();
    const listingFee = await marketplaceContract.listingFeeWei();
    
    console.log('💎 NFT Collection:', nftFactoryInfo.sampleCollectionAddress);
    console.log('🏪 Marketplace:', marketplaceInfo.contractAddress);
    console.log('💵 Mint Price:', ethers.formatEther(mintPrice), 'STT');
    console.log('💵 Listing Fee:', ethers.formatEther(listingFee), 'STT');
    console.log('\n' + '='.repeat(60) + '\n');

    const mintedNFTs = [];

    // Step 1: Mint NFTs
    console.log('🎨 STEP 1: Minting NFTs...\n');
    
    for (let i = 0; i < SAMPLE_NFTS.length; i++) {
      const nft = SAMPLE_NFTS[i];
      console.log(`  Minting ${nft.name}...`);
      
      const mintTx = await nftContract.mint(
        wallet.address,
        nft.imageCID,
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
        const tokenId = decoded.args[2]; // tokenId is the third argument in Transfer event
        
        mintedNFTs.push({
          ...nft,
          tokenId: tokenId.toString()
        });
        
        console.log(`  ✅ Minted token #${tokenId}`);
      }
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // Step 2: List NFTs on marketplace
    console.log('🏪 STEP 2: Listing NFTs on Marketplace...\n');
    console.log('  Using escrow + auto-list pattern (safeTransferFrom with data)\n');

    for (const nft of mintedNFTs) {
      console.log(`  Listing ${nft.name} (Token #${nft.tokenId})...`);
      
      // Encode the listing data (price and CID)
      const listingData = ethers.AbiCoder.defaultAbiCoder().encode(
        ['uint256', 'string'],
        [nft.price, nft.imageCID]
      );
      
      // Transfer NFT to marketplace with listing data (auto-creates listing)
      const transferTx = await nftContract['safeTransferFrom(address,address,uint256,bytes)'](
        wallet.address,
        marketplaceInfo.contractAddress,
        nft.tokenId,
        listingData,
        { value: listingFee } // Include listing fee
      );
      
      const transferReceipt = await transferTx.wait();
      console.log(`  ✅ Listed at ${ethers.formatEther(nft.price)} STT`);
      console.log(`     TX: ${transferReceipt.hash}`);
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
    
    const mintedPath = path.join(__dirname, '../deployments/minted-nfts.json');
    fs.writeFileSync(mintedPath, JSON.stringify(mintedInfo, null, 2));

    // Display summary
    console.log('\n' + '='.repeat(60));
    console.log('🎉 SUCCESS! NFTs MINTED AND LISTED');
    console.log('='.repeat(60));
    console.log('\n📋 Summary:');
    console.log(`  Minted: ${mintedNFTs.length} NFTs`);
    console.log(`  Listed on: Marketplace at ${marketplaceInfo.contractAddress}`);
    console.log('\n🎨 Minted NFTs:');
    
    mintedNFTs.forEach((nft, index) => {
      console.log(`  ${index + 1}. ${nft.name}`);
      console.log(`     Token ID: #${nft.tokenId}`);
      console.log(`     Price: ${ethers.formatEther(nft.price)} STT`);
      console.log(`     CID: ${nft.imageCID}`);
    });
    
    console.log('\n🔗 View on Explorer:');
    console.log(`  NFT Collection: https://explorer.somnia.network/address/${nftFactoryInfo.sampleCollectionAddress}`);
    console.log(`  Marketplace: https://explorer.somnia.network/address/${marketplaceInfo.contractAddress}`);
    
    console.log('\n✨ Next steps:');
    console.log('  1. View your NFTs in the marketplace UI');
    console.log('  2. Test purchasing from another wallet');
    console.log('  3. Update frontend to display real contract data');

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