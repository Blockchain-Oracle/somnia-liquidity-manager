#!/usr/bin/env node
/**
 * List NFT on Marketplace - Fixed version
 */

import { ethers } from 'ethers';
import { DEPLOYED_ADDRESSES } from '../lib/constants/deployments';
import { MARKETPLACE_ABI } from '../lib/constants/marketplace';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const ERC721_ABI = [
  "function approve(address to, uint256 tokenId)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function getApproved(uint256 tokenId) view returns (address)"
];

async function listNFT() {
  try {
    // Setup
    const provider = new ethers.JsonRpcProvider('https://dream-rpc.somnia.network/');
    const privateKey = process.env.PRIVATE_KEY || 'bad2ecf2b8778c5611d27706a8289f1e9bdc028c049cbac22656ed2e82bf9df1';
    const wallet = new ethers.Wallet(privateKey, provider);
    
    console.log('🔐 Wallet:', wallet.address);
    
    // Get arguments or use defaults
    const args = process.argv.slice(2);
    const nftContract = args[0] || '0xc75cc6A651710E057d798776F6fcE748546f249d'; // Our deployed collection
    const tokenId = args[1] || '1';
    const price = args[2] || '0.1'; // Price in STT
    
    console.log('\n📋 Listing Details:');
    console.log('  NFT Contract:', nftContract);
    console.log('  Token ID:', tokenId);
    console.log('  Price:', price, 'STT');
    
    // Check ownership
    const nft = new ethers.Contract(nftContract, ERC721_ABI, wallet);
    const owner = await nft.ownerOf(tokenId);
    console.log('  Owner:', owner);
    
    if (owner.toLowerCase() !== wallet.address.toLowerCase()) {
      throw new Error(`You don't own this NFT. Owner is ${owner}`);
    }
    
    // Get token URI (CID)
    const cid = await nft.tokenURI(tokenId);
    console.log('  CID:', cid);
    
    // Check current approval
    const currentApproval = await nft.getApproved(tokenId);
    console.log('  Current Approval:', currentApproval);
    
    // Approve marketplace if needed
    if (currentApproval.toLowerCase() !== DEPLOYED_ADDRESSES.marketplace.toLowerCase()) {
      console.log('\n🔓 Approving marketplace...');
      const approveTx = await nft.approve(DEPLOYED_ADDRESSES.marketplace, tokenId);
      console.log('  TX:', approveTx.hash);
      await approveTx.wait();
      console.log('  ✅ Approved!');
    } else {
      console.log('  ✅ Already approved');
    }
    
    // Create listing
    const marketplace = new ethers.Contract(
      DEPLOYED_ADDRESSES.marketplace,
      MARKETPLACE_ABI,
      wallet
    );
    
    // Get listing fee
    const listingFee = await marketplace.listingFeeWei();
    console.log('\n💰 Listing fee:', ethers.formatEther(listingFee), 'STT');
    
    // Create the listing
    console.log('\n📝 Creating listing...');
    const priceWei = ethers.parseEther(price);
    
    const tx = await marketplace.createListing(
      nftContract,
      tokenId,
      priceWei,
      cid,
      { value: listingFee }
    );
    
    console.log('  TX:', tx.hash);
    console.log('  ⏳ Waiting for confirmation...');
    
    const receipt = await tx.wait();
    console.log('  ✅ Confirmed in block', receipt.blockNumber);
    
    // Get listing ID from events
    const event = receipt.logs.find((log: any) => {
      try {
        const parsed = marketplace.interface.parseLog(log);
        return parsed?.name === 'ListingCreated';
      } catch {
        return false;
      }
    });
    
    if (event) {
      const parsed = marketplace.interface.parseLog(event);
      const listingId = parsed?.args.listingId;
      
      console.log(`
✨ Successfully Listed!
======================
🆔 Listing ID: ${listingId}
💎 NFT: ${nftContract}
🏷️  Token ID: ${tokenId}
💰 Price: ${price} STT
🌐 Explorer: https://shannon-explorer.somnia.network/tx/${tx.hash}

Your NFT is now listed on the marketplace!
      `);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run
if (import.meta.url === `file://${process.argv[1]}`) {
  listNFT();
}