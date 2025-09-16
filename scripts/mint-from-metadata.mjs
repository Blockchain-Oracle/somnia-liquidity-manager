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
const SOMNIA_TESTNET_RPC = process.env.SOMNIA_TESTNET_RPC || 'https://dream-rpc.somnia.network';
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// Contract ABIs
const FACTORY_ABI = [
  'function deployCollection(string memory _name, string memory _symbol, string memory _collectionCID, uint256 _maxSupply, uint256 _mintPrice) public payable returns (address)',
  'function collections(uint256) public view returns (address)',
  'function getDeployedCollections() public view returns (address[] memory)',
  'event CollectionDeployed(address indexed collection, address indexed creator, string name, string symbol)'
];

const NFT_ABI = [
  'function mint(address to, string memory cid) public payable returns (uint256)',
  'function mintPrice() public view returns (uint256)',
  'function totalSupply() public view returns (uint256)',
  'function safeTransferFrom(address from, address to, uint256 tokenId, bytes data) public'
];

const MARKETPLACE_ABI = [
  'function listingFeeWei() public view returns (uint256)'
];

async function main() {
  console.log('🎨 Minting Beautiful NFTs from Metadata\n');
  console.log('=' .repeat(60));

  // Validate environment
  if (!PRIVATE_KEY) {
    console.error('❌ Error: PRIVATE_KEY not found in .env file');
    process.exit(1);
  }

  // Load metadata
  const metadataPath = path.join(__dirname, '../deployments/nft-metadata.json');
  if (!fs.existsSync(metadataPath)) {
    console.error('❌ Error: Metadata not found. Run: npm run create:metadata');
    process.exit(1);
  }

  const metadataInfo = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  const nfts = metadataInfo.nfts;

  // Load deployments
  const factoryDeployment = path.join(__dirname, '../deployments/nft-factory.json');
  const marketplaceDeployment = path.join(__dirname, '../deployments/marketplace-testnet.json');

  if (!fs.existsSync(factoryDeployment)) {
    console.error('❌ Error: NFT Factory not deployed. Run: npm run deploy:nft-factory');
    process.exit(1);
  }

  const factoryInfo = JSON.parse(fs.readFileSync(factoryDeployment, 'utf8'));
  const marketplaceInfo = JSON.parse(fs.readFileSync(marketplaceDeployment, 'utf8'));

  // Connect to network
  const provider = new ethers.JsonRpcProvider(SOMNIA_TESTNET_RPC);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  console.log('📡 Connected to Somnia Testnet');
  console.log('👛 Wallet address:', wallet.address);
  
  // Check balance
  const balance = await provider.getBalance(wallet.address);
  console.log('💰 Balance:', ethers.formatEther(balance), 'STT\n');

  // Connect to marketplace and use existing deployed collection from deployments file
  const marketplace = new ethers.Contract(marketplaceInfo.contractAddress || marketplaceInfo.marketplace.address, MARKETPLACE_ABI, wallet);

  try {
    // Step 1: Use existing deployed collection from deployments file
    console.log('📝 STEP 1: Using existing NFT Collection from deployments...\n');
    const collectionAddress = factoryInfo.sampleCollectionAddress;
    if (!collectionAddress) {
      throw new Error('sampleCollectionAddress not found in deployments/nft-factory.json');
    }

    // Connect to NFT collection
    const nftContract = new ethers.Contract(collectionAddress, NFT_ABI, wallet);
    const mintPriceOnChain = await nftContract.mintPrice();
    const listingFee = await marketplace.listingFeeWei();
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    // Step 2: Mint NFTs with metadata CIDs
    console.log('🎨 STEP 2: Minting NFTs with Beautiful Metadata...\n');
    
    const mintedNFTs = [];
    
    for (let i = 0; i < nfts.length; i++) {
      const nft = nfts[i];
      console.log(`[${i + 1}/${nfts.length}] Minting: ${nft.name}`);
      console.log(`  Metadata CID: ${nft.metadataCID}`);
      console.log(`  Image URL: ${nft.image}`);
      
      try {
        const mintTx = await nftContract.mint(
          wallet.address,
          nft.metadataCID,
          { value: mintPriceOnChain }
        );
        
        const mintReceipt = await mintTx.wait();
        
        // Get token ID from logs
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
            txHash: mintReceipt.hash
          });
          
          console.log(`  ✅ Minted token #${tokenId}`);
        }
      } catch (error) {
        console.error(`  ❌ Failed to mint: ${error.message}`);
      }
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    // Step 3: List NFTs on marketplace
    console.log('🏪 STEP 3: Listing NFTs on Marketplace...\n');
    
    const listingPrices = [
      ethers.parseEther('0.5'),   // Cosmic Dreams
      ethers.parseEther('0.75'),  // Neon Nights
      ethers.parseEther('1.0'),   // Digital Genesis
      ethers.parseEther('0.8'),   // Ethereal Waves
      ethers.parseEther('1.2'),   // Quantum Dreams
      ethers.parseEther('0.6'),   // Aurora Borealis
      ethers.parseEther('0.9'),   // Fractal Universe
      ethers.parseEther('1.1')    // Cyber Dreams
    ];
    
    for (let i = 0; i < mintedNFTs.length; i++) {
      const nft = mintedNFTs[i];
      const price = listingPrices[i] || ethers.parseEther('0.5');
      
      console.log(`Listing ${nft.name} for ${ethers.formatEther(price)} STT`);
      
      try {
        // Encode listing data
        const listingData = ethers.AbiCoder.defaultAbiCoder().encode(
          ['uint256', 'string'],
          [price, nft.metadataCID]
        );
        
        // Transfer to marketplace with listing data
        const listTx = await nftContract['safeTransferFrom(address,address,uint256,bytes)'](
          wallet.address,
          marketplaceInfo.contractAddress || marketplaceInfo.marketplace.address,
          nft.tokenId,
          listingData,
          { value: listingFee }
        );
        
        await listTx.wait();
        console.log(`  ✅ Listed successfully`);
      } catch (error) {
        console.error(`  ❌ Failed to list: ${error.message}`);
      }
    }
    
    // Save results
    const resultsPath = path.join(__dirname, '../deployments/minted-beautiful-nfts.json');
    fs.writeFileSync(resultsPath, JSON.stringify({
      network: 'somnia-testnet',
      collectionAddress,
      marketplaceAddress: marketplaceInfo.contractAddress || marketplaceInfo.marketplace.address,
      mintedAt: new Date().toISOString(),
      minter: wallet.address,
      nfts: mintedNFTs
    }, null, 2));
    
    // Display summary
    console.log('\n' + '='.repeat(60));
    console.log('🎉 SUCCESS! BEAUTIFUL NFTs MINTED AND LISTED');
    console.log('='.repeat(60));
    console.log('\n📋 Summary:');
    console.log(`  Collection: ${collectionAddress}`);
    console.log(`  Total Minted: ${mintedNFTs.length} NFTs`);
    console.log(`  Marketplace: ${marketplaceInfo.contractAddress || marketplaceInfo.marketplace.address}`);
    
    console.log('\n🎨 Minted NFTs:');
    mintedNFTs.forEach((nft, index) => {
      console.log(`\n  ${index + 1}. ${nft.name}`);
      console.log(`     Token ID: #${nft.tokenId}`);
      console.log(`     Image: ${nft.image}`);
      console.log(`     Rarity: ${nft.attributes.find(a => a.trait_type === 'Rarity')?.value}`);
    });
    
    console.log('\n✨ View your NFTs in the marketplace UI!');
    console.log('   The beautiful Unsplash images will display directly.');
    
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