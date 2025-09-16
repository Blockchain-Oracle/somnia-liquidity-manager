#!/usr/bin/env node
/**
 * Simple NFT Test - Just mint without marketplace
 */

import { generateCollectionMetadata } from './generate-nft-metadata.js';
import { uploadNFTCollection } from './upload-metadata.js';
import { NFTMinter } from './mint-nfts.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function simpleTest() {
  try {
    console.log('🚀 Simple NFT Test - Creating 2 NFTs\n');
    
    // Step 1: Generate metadata
    console.log('📝 Generating metadata...');
    const metadata = generateCollectionMetadata('nature', 2);
    metadata[0].name = 'Nature Test #1';
    metadata[1].name = 'Nature Test #2';
    console.log(`✅ Generated ${metadata.length} NFTs`);
    
    // Step 2: Upload to Pinata
    console.log('\n📤 Uploading to IPFS...');
    const uploadResult = await uploadNFTCollection(
      'Nature Test',
      'A beautiful nature collection',
      metadata
    );
    console.log(`✅ Collection CID: ${uploadResult.collectionCID}`);
    console.log(`✅ NFT CIDs: ${uploadResult.nftCIDs.join(', ')}`);
    
    // Step 3: Deploy and mint
    console.log('\n🎨 Deploying collection...');
    const minter = new NFTMinter();
    
    const collectionAddress = await minter.deployCollection({
      name: 'Nature Test',
      symbol: 'NAT',
      collectionCID: uploadResult.collectionCID,
      maxSupply: 10,
      mintPrice: '0.001',
      nftCIDs: uploadResult.nftCIDs
    });
    console.log(`✅ Collection: ${collectionAddress}`);
    
    console.log('\n🎨 Minting NFTs...');
    const signerAddress = await minter['signer'].getAddress();
    
    for (let i = 0; i < uploadResult.nftCIDs.length; i++) {
      console.log(`  Minting NFT ${i + 1}...`);
      const ids = await minter.mintNFTs(
        collectionAddress,
        signerAddress,
        [uploadResult.nftCIDs[i]]
      );
      console.log(`  ✅ Token ID ${ids[0]} minted!`);
    }
    
    console.log(`
✨ Success! NFT Collection Created:
====================================
📍 Collection: ${collectionAddress}
🌐 View on Explorer: https://shannon-explorer.somnia.network/address/${collectionAddress}
🖼️  View NFT 1: https://cyan-faithful-peafowl-351.mypinata.cloud/ipfs/${uploadResult.nftCIDs[0]}
🖼️  View NFT 2: https://cyan-faithful-peafowl-351.mypinata.cloud/ipfs/${uploadResult.nftCIDs[1]}

You now own 2 NFTs in this collection!
    `);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run test
if (import.meta.url === `file://${process.argv[1]}`) {
  simpleTest();
}