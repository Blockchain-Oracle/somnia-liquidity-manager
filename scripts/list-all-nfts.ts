#!/usr/bin/env node
/**
 * List All Available NFTs on Marketplace
 */

import { ethers } from 'ethers';
import { DEPLOYED_ADDRESSES } from '../lib/constants/deployments';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const ERC721_ABI = [
  "function safeTransferFrom(address from, address to, uint256 tokenId, bytes data)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function tokenURI(uint256 tokenId) view returns (string)"
];

interface NFTToList {
  collection: string;
  tokenId: number;
  price: string; // in STT
  name: string;
}

async function listAllNFTs() {
  try {
    // Setup
    const provider = new ethers.JsonRpcProvider('https://dream-rpc.somnia.network/');
    const privateKey = process.env.PRIVATE_KEY || 'bad2ecf2b8778c5611d27706a8289f1e9bdc028c049cbac22656ed2e82bf9df1';
    const wallet = new ethers.Wallet(privateKey, provider);
    
    console.log('🔐 Wallet:', wallet.address);
    console.log('🏪 Marketplace:', DEPLOYED_ADDRESSES.marketplace);
    
    // NFTs to list with different prices
    const nftsToList: NFTToList[] = [
      // Collection 3 (0xE49A15d22Afc7E6E449C492673915966aB8A24d0)
      { collection: '0xE49A15d22Afc7E6E449C492673915966aB8A24d0', tokenId: 1, price: '0.2', name: 'Collection 3 #1' },
      { collection: '0xE49A15d22Afc7E6E449C492673915966aB8A24d0', tokenId: 2, price: '0.25', name: 'Collection 3 #2' },
      { collection: '0xE49A15d22Afc7E6E449C492673915966aB8A24d0', tokenId: 3, price: '0.3', name: 'Collection 3 #3' },
      
      // Collection 4 (0xc21Fc4eF3CaFc0F27fd56a12AE67e25fE2354246)
      { collection: '0xc21Fc4eF3CaFc0F27fd56a12AE67e25fE2354246', tokenId: 1, price: '0.15', name: 'Collection 4 #1' },
      { collection: '0xc21Fc4eF3CaFc0F27fd56a12AE67e25fE2354246', tokenId: 2, price: '0.18', name: 'Collection 4 #2' },
      { collection: '0xc21Fc4eF3CaFc0F27fd56a12AE67e25fE2354246', tokenId: 3, price: '0.22', name: 'Collection 4 #3' },
      
      // Collection 5 - Token 1 only (token 2 already listed)
      { collection: '0xc75cc6A651710E057d798776F6fcE748546f249d', tokenId: 1, price: '0.1', name: 'Nature Test #1' },
    ];
    
    console.log(`\n📋 Listing ${nftsToList.length} NFTs...`);
    console.log('=' .repeat(50));
    
    let successCount = 0;
    let failCount = 0;
    
    for (const nftData of nftsToList) {
      try {
        console.log(`\n🎨 Listing ${nftData.name}:`);
        console.log(`  Collection: ${nftData.collection}`);
        console.log(`  Token ID: ${nftData.tokenId}`);
        console.log(`  Price: ${nftData.price} STT`);
        
        const nft = new ethers.Contract(nftData.collection, ERC721_ABI, wallet);
        
        // Check ownership
        const owner = await nft.ownerOf(nftData.tokenId);
        if (owner.toLowerCase() !== wallet.address.toLowerCase()) {
          console.log(`  ⚠️  Skipping - Not owned by us (owner: ${owner})`);
          continue;
        }
        
        // Get CID
        const cid = await nft.tokenURI(nftData.tokenId);
        console.log(`  CID: ${cid}`);
        
        // Encode listing data
        const priceWei = ethers.parseEther(nftData.price);
        const abiCoder = new ethers.AbiCoder();
        const encodedData = abiCoder.encode(
          ['uint256', 'string'],
          [priceWei, cid]
        );
        
        // Transfer to marketplace with encoded data
        console.log(`  📦 Transferring to marketplace...`);
        const tx = await nft['safeTransferFrom(address,address,uint256,bytes)'](
          wallet.address,
          DEPLOYED_ADDRESSES.marketplace,
          nftData.tokenId,
          encodedData
        );
        
        console.log(`  TX: ${tx.hash}`);
        console.log(`  ⏳ Waiting for confirmation...`);
        
        const receipt = await tx.wait();
        console.log(`  ✅ Listed in block ${receipt.blockNumber}!`);
        
        successCount++;
        
      } catch (error) {
        console.error(`  ❌ Failed: ${error.message}`);
        failCount++;
      }
    }
    
    console.log('\n' + '=' .repeat(50));
    console.log(`✨ Listing Complete!`);
    console.log(`  ✅ Successfully listed: ${successCount} NFTs`);
    if (failCount > 0) {
      console.log(`  ❌ Failed: ${failCount} NFTs`);
    }
    console.log(`\n🌐 View marketplace: https://shannon-explorer.somnia.network/address/${DEPLOYED_ADDRESSES.marketplace}`);
    console.log(`💡 Run 'tsx scripts/check-marketplace.ts' to see all listings`);
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run
if (import.meta.url === `file://${process.argv[1]}`) {
  listAllNFTs();
}