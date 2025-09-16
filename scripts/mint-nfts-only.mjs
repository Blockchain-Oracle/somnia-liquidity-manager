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

// NFT Contract ABI
const NFT_ABI = [
  'function mint(address to, string memory cid) public payable returns (uint256)',
  'function mintPrice() public view returns (uint256)',
  'function totalSupply() public view returns (uint256)',
  'function maxSupply() public view returns (uint256)',
  'function name() public view returns (string)',
  'function symbol() public view returns (string)'
];

async function main() {
  console.log('🎨 Minting NFTs with Real Pinata CIDs\n');
  console.log('=' .repeat(60));

  // Validate environment
  if (!PRIVATE_KEY) {
    console.error('❌ Error: PRIVATE_KEY not found in .env file');
    process.exit(1);
  }

  // Load metadata with real Pinata CIDs
  const metadataPath = path.join(__dirname, '../deployments/nft-metadata.json');
  if (!fs.existsSync(metadataPath)) {
    console.error('❌ Error: Metadata not found. Run: npm run create:metadata');
    process.exit(1);
  }

  const metadataInfo = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  const nfts = metadataInfo.nfts;

  // Load NFT collection address
  const factoryDeployment = path.join(__dirname, '../deployments/nft-factory.json');
  if (!fs.existsSync(factoryDeployment)) {
    console.error('❌ Error: NFT Factory not deployed');
    process.exit(1);
  }

  const factoryInfo = JSON.parse(fs.readFileSync(factoryDeployment, 'utf8'));
  const collectionAddress = factoryInfo.sampleCollectionAddress;

  if (!collectionAddress) {
    console.error('❌ Error: No collection address found');
    process.exit(1);
  }

  // Connect to network
  const provider = new ethers.JsonRpcProvider(SOMNIA_TESTNET_RPC);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  console.log('📡 Connected to Somnia Testnet');
  console.log('👛 Wallet address:', wallet.address);
  
  // Check balance
  const balance = await provider.getBalance(wallet.address);
  console.log('💰 Balance:', ethers.formatEther(balance), 'STT');

  // Connect to NFT collection
  const nftContract = new ethers.Contract(collectionAddress, NFT_ABI, wallet);

  try {
    // Get collection info
    const [name, symbol, totalSupply, maxSupply, mintPrice] = await Promise.all([
      nftContract.name(),
      nftContract.symbol(),
      nftContract.totalSupply(),
      nftContract.maxSupply(),
      nftContract.mintPrice()
    ]);

    console.log('\n📝 Collection Info:');
    console.log('  Address:', collectionAddress);
    console.log('  Name:', name);
    console.log('  Symbol:', symbol);
    console.log('  Current Supply:', totalSupply.toString(), '/', maxSupply.toString());
    console.log('  Mint Price:', ethers.formatEther(mintPrice), 'STT');
    
    console.log('\n' + '='.repeat(60) + '\n');
    console.log('🎨 Minting NFTs with Beautiful Metadata...\n');
    
    const mintedNFTs = [];
    
    for (let i = 0; i < nfts.length; i++) {
      const nft = nfts[i];
      console.log(`[${i + 1}/${nfts.length}] Minting: ${nft.name}`);
      console.log(`  📦 Metadata CID: ${nft.metadataCID}`);
      console.log(`  🖼️  Image URL: ${nft.image}`);
      console.log(`  💎 Rarity: ${nft.attributes.find(a => a.trait_type === 'Rarity')?.value}`);
      
      try {
        const mintTx = await nftContract.mint(
          wallet.address,
          nft.metadataCID,  // Using real Pinata CID
          { value: mintPrice }
        );
        
        console.log(`  ⏳ TX: ${mintTx.hash}`);
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
            txHash: mintReceipt.hash,
            owner: wallet.address,
            collection: collectionAddress
          });
          
          console.log(`  ✅ Minted token #${tokenId}\n`);
        }
      } catch (error) {
        console.error(`  ❌ Failed to mint: ${error.message}\n`);
      }
    }
    
    // Save minted NFTs
    const resultsPath = path.join(__dirname, '../deployments/minted-nfts.json');
    fs.writeFileSync(resultsPath, JSON.stringify({
      network: 'somnia-testnet',
      collectionAddress,
      mintedAt: new Date().toISOString(),
      minter: wallet.address,
      totalMinted: mintedNFTs.length,
      nfts: mintedNFTs
    }, null, 2));
    
    // Display summary
    console.log('\n' + '='.repeat(60));
    console.log('🎉 SUCCESS! NFTs MINTED WITH REAL PINATA CIDs');
    console.log('='.repeat(60));
    console.log('\n📋 Summary:');
    console.log(`  Collection: ${collectionAddress}`);
    console.log(`  Total Minted: ${mintedNFTs.length}/${nfts.length} NFTs`);
    console.log(`  Explorer: https://shannon-explorer.somnia.network/address/${collectionAddress}`);
    
    console.log('\n🎨 Minted NFTs:');
    mintedNFTs.forEach((nft, index) => {
      console.log(`\n  ${index + 1}. ${nft.name}`);
      console.log(`     Token ID: #${nft.tokenId}`);
      console.log(`     Metadata: ipfs://${nft.metadataCID}`);
      console.log(`     Gateway: https://gateway.pinata.cloud/ipfs/${nft.metadataCID}`);
      console.log(`     TX: https://shannon-explorer.somnia.network/tx/${nft.txHash}`);
    });
    
    console.log('\n✨ NFTs are now minted with real IPFS metadata!');
    console.log('   The metadata contains the beautiful Unsplash image URLs.');
    console.log('   You can now list these on the marketplace.');
    
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