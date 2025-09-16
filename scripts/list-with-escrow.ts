#!/usr/bin/env node
/**
 * List NFT on Marketplace using Escrow Pattern
 * The NFT is transferred to the marketplace which holds it in escrow
 */

import { ethers } from 'ethers';
import { DEPLOYED_ADDRESSES } from '../lib/constants/deployments';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const ERC721_ABI = [
  "function safeTransferFrom(address from, address to, uint256 tokenId, bytes data)",
  "function safeTransferFrom(address from, address to, uint256 tokenId)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function tokenURI(uint256 tokenId) view returns (string)"
];

async function listWithEscrow() {
  try {
    // Setup
    const provider = new ethers.JsonRpcProvider('https://dream-rpc.somnia.network/');
    const privateKey = process.env.PRIVATE_KEY || 'bad2ecf2b8778c5611d27706a8289f1e9bdc028c049cbac22656ed2e82bf9df1';
    const wallet = new ethers.Wallet(privateKey, provider);
    
    console.log('🔐 Wallet:', wallet.address);
    
    // Get arguments or use defaults
    const args = process.argv.slice(2);
    const nftContract = args[0] || '0xc75cc6A651710E057d798776F6fcE748546f249d'; // Our deployed collection
    const tokenId = args[1] || '2'; // Let's use token 2
    const price = args[2] || '0.15'; // Price in STT
    
    console.log('\n📋 Listing Details:');
    console.log('  NFT Contract:', nftContract);
    console.log('  Token ID:', tokenId);
    console.log('  Price:', price, 'STT');
    
    // Check ownership
    const nft = new ethers.Contract(nftContract, ERC721_ABI, wallet);
    const owner = await nft.ownerOf(tokenId);
    console.log('  Current Owner:', owner);
    
    if (owner.toLowerCase() !== wallet.address.toLowerCase()) {
      throw new Error(`You don't own this NFT. Owner is ${owner}`);
    }
    
    // Get token URI (CID)
    const cid = await nft.tokenURI(tokenId);
    console.log('  CID:', cid);
    
    // Encode the listing data for safeTransferFrom
    // The data should contain price and CID
    const priceWei = ethers.parseEther(price);
    
    // Encode the data: price (uint256) + cid (string)
    const abiCoder = new ethers.AbiCoder();
    const encodedData = abiCoder.encode(
      ['uint256', 'string'],
      [priceWei, cid]
    );
    
    console.log('\n📦 Transferring NFT to marketplace (this will create the listing)...');
    console.log('  Marketplace:', DEPLOYED_ADDRESSES.marketplace);
    console.log('  Encoded price:', ethers.formatEther(priceWei), 'STT');
    
    // Transfer NFT to marketplace with encoded data
    // This will trigger onERC721Received which creates the listing
    const tx = await nft['safeTransferFrom(address,address,uint256,bytes)'](
      wallet.address,
      DEPLOYED_ADDRESSES.marketplace,
      tokenId,
      encodedData
    );
    
    console.log('  TX:', tx.hash);
    console.log('  ⏳ Waiting for confirmation...');
    
    const receipt = await tx.wait();
    console.log('  ✅ Confirmed in block', receipt.blockNumber);
    
    // Check new owner
    const newOwner = await nft.ownerOf(tokenId);
    console.log('  New Owner (Marketplace):', newOwner);
    
    console.log(`
✨ Successfully Listed with Escrow!
====================================
💎 NFT: ${nftContract}
🏷️  Token ID: ${tokenId}
💰 Price: ${price} STT
📦 Status: In Escrow (held by marketplace)
🌐 Explorer: https://shannon-explorer.somnia.network/tx/${tx.hash}

Your NFT is now listed on the marketplace and held in escrow!
The marketplace will transfer it to the buyer when purchased.
    `);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.data) {
      console.error('Error data:', error.data);
    }
    process.exit(1);
  }
}

// Run
if (import.meta.url === `file://${process.argv[1]}`) {
  listWithEscrow();
}