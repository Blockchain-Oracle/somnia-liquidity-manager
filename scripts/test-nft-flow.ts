#!/usr/bin/env node
/**
 * Test NFT Flow - Creates a small collection with 3 NFTs
 */

import { generateCollectionMetadata } from './generate-nft-metadata.js';
import { uploadNFTCollection } from './upload-metadata.js';
import { NFTMinter } from './mint-nfts.js';
import { MarketplaceLister } from './list-on-marketplace.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testFlow() {
  try {
    console.log('🧪 Testing NFT Creation Flow with 3 NFTs\n');
    
    // Step 1: Generate metadata
    console.log('📝 Step 1: Generating metadata...');
    const metadata = generateCollectionMetadata('abstract', 3);
    console.log(`✅ Generated ${metadata.length} NFT metadata items`);
    
    // Step 2: Upload to Pinata
    console.log('\n📤 Step 2: Uploading to Pinata...');
    const uploadResult = await uploadNFTCollection(
      'Test Collection',
      'A test collection with 3 NFTs',
      metadata
    );
    console.log(`✅ Collection CID: ${uploadResult.collectionCID}`);
    console.log(`✅ NFT CIDs: ${uploadResult.nftCIDs.length} items`);
    
    // Step 3: Deploy and mint
    console.log('\n🚀 Step 3: Deploying and minting...');
    const minter = new NFTMinter();
    
    const collectionAddress = await minter.deployCollection({
      name: 'Test Collection',
      symbol: 'TEST',
      collectionCID: uploadResult.collectionCID,
      maxSupply: 10,
      mintPrice: '0.001',
      nftCIDs: uploadResult.nftCIDs
    });
    console.log(`✅ Collection deployed: ${collectionAddress}`);
    
    const signerAddress = await minter['signer'].getAddress();
    
    // Try minting one by one instead of batch
    console.log('Minting NFTs one by one...');
    const tokenIds = [];
    for (let i = 0; i < uploadResult.nftCIDs.length; i++) {
      try {
        console.log(`  Minting NFT ${i + 1}...`);
        const ids = await minter.mintNFTs(
          collectionAddress,
          signerAddress,
          [uploadResult.nftCIDs[i]] // Mint one at a time
        );
        tokenIds.push(...ids);
        console.log(`  ✅ Minted token ID: ${ids[0]}`);
      } catch (err) {
        console.error(`  ❌ Failed to mint NFT ${i + 1}:`, err.message);
      }
    }
    console.log(`✅ Minted tokens: ${tokenIds}`);
    
    // Step 4: List on marketplace
    console.log('\n🛒 Step 4: Listing on marketplace...');
    const lister = new MarketplaceLister();
    
    const listing = await lister.createListing({
      nftContract: collectionAddress,
      tokenId: tokenIds[0],
      price: '0.1',
      cid: uploadResult.nftCIDs[0]
    });
    console.log(`✅ Listed token ${tokenIds[0]} with listing ID: ${listing.listingId}`);
    
    console.log('\n✨ Test complete! Successfully created, minted, and listed NFTs.');
    console.log(`
📊 Summary:
- Collection: ${collectionAddress}
- Minted Tokens: ${tokenIds.join(', ')}
- Marketplace Listing: #${listing.listingId}
- View on Explorer: https://shannon-explorer.somnia.network/address/${collectionAddress}
    `);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run test
if (import.meta.url === `file://${process.argv[1]}`) {
  testFlow();
}