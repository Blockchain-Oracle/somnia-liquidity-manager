#!/usr/bin/env node
/**
 * Check Marketplace Status
 * Shows all active listings and marketplace statistics
 */

import { ethers } from 'ethers';
import { DEPLOYED_ADDRESSES } from '../lib/constants/deployments';
import { MARKETPLACE_ABI } from '../lib/constants/marketplace';

async function checkMarketplace() {
  try {
    const provider = new ethers.JsonRpcProvider('https://dream-rpc.somnia.network/');
    const marketplace = new ethers.Contract(
      DEPLOYED_ADDRESSES.marketplace,
      MARKETPLACE_ABI,
      provider
    );
    
    console.log('🏪 SOMNIA NFT MARKETPLACE STATUS');
    console.log('=' .repeat(50));
    console.log('📍 Address:', DEPLOYED_ADDRESSES.marketplace);
    
    // Get marketplace settings
    const listingFee = await marketplace.listingFeeWei();
    const platformFee = await marketplace.platformFeeBps();
    const cancelRefund = await marketplace.cancelRefundBps();
    const feeRecipient = await marketplace.feeRecipient();
    
    console.log('\n⚙️  Settings:');
    console.log('  Listing Fee:', ethers.formatEther(listingFee), 'STT');
    console.log('  Platform Fee:', Number(platformFee) / 100, '%');
    console.log('  Cancel Refund:', Number(cancelRefund) / 100, '%');
    console.log('  Fee Recipient:', feeRecipient);
    
    // Get active listings
    const activeCount = await marketplace.getActiveListingsCount();
    console.log('\n📊 Statistics:');
    console.log('  Active Listings:', activeCount.toString());
    
    if (activeCount > 0) {
      console.log('\n📋 Active Listings:');
      console.log('-'.repeat(50));
      
      const [listingIds] = await marketplace.getActiveListingsPaginated(0, 100);
      
      for (const id of listingIds) {
        const [seller, nft, tokenId, price, cid, active, sold, createdAt] = 
          await marketplace.getListing(id);
        
        if (active && !sold) {
          console.log(`\n  Listing #${id}:`);
          console.log('    Seller:', seller);
          console.log('    NFT:', nft);
          console.log('    Token ID:', tokenId.toString());
          console.log('    Price:', ethers.formatEther(price), 'STT');
          console.log('    CID:', cid);
          console.log('    Created:', new Date(Number(createdAt) * 1000).toLocaleString());
          console.log('    View Metadata: https://cyan-faithful-peafowl-351.mypinata.cloud/ipfs/' + cid);
        }
      }
    } else {
      console.log('\n  No active listings');
    }
    
    // Check factory collections
    const factory = new ethers.Contract(
      DEPLOYED_ADDRESSES.factory,
      ['function getTotalCollections() view returns (uint256)'],
      provider
    );
    
    const totalCollections = await factory.getTotalCollections();
    console.log('\n🎨 NFT Factory:');
    console.log('  Total Collections:', totalCollections.toString());
    
    console.log('\n✅ Marketplace is operational and ready for trading!');
    console.log('\n💡 To buy an NFT, use: cast send ' + DEPLOYED_ADDRESSES.marketplace + ' "purchase(uint256)" <listingId> --value <price> --private-key <key>');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run
if (import.meta.url === `file://${process.argv[1]}`) {
  checkMarketplace();
}