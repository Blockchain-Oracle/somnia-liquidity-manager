/**
 * Marketplace Listing Script
 * List NFTs on the Somnia NFT Marketplace
 */

import { ethers } from 'ethers';
import { DEPLOYED_ADDRESSES } from '../lib/constants/deployments';
import { MARKETPLACE_ABI } from '../lib/constants/marketplace';

// ERC721 ABI for approvals
const ERC721_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "to", "type": "address" },
      { "internalType": "uint256", "name": "tokenId", "type": "uint256" }
    ],
    "name": "approve",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "operator", "type": "address" },
      { "internalType": "bool", "name": "approved", "type": "bool" }
    ],
    "name": "setApprovalForAll",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "owner", "type": "address" },
      { "internalType": "address", "name": "operator", "type": "address" }
    ],
    "name": "isApprovedForAll",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
    "name": "getApproved",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
    "name": "ownerOf",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
    "name": "tokenURI",
    "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
    "stateMutability": "view",
    "type": "function"
  }
];

interface ListingParams {
  nftContract: string;
  tokenId: number;
  price: string; // in STT
  cid: string;
}

interface ListingResult {
  listingId: number;
  transactionHash: string;
  seller: string;
  nftContract: string;
  tokenId: number;
  price: string;
  cid: string;
  timestamp: string;
}

export class MarketplaceLister {
  private provider: ethers.Provider;
  private signer: ethers.Signer;
  private marketplaceContract: ethers.Contract;

  constructor(privateKey?: string) {
    // Setup provider
    this.provider = new ethers.JsonRpcProvider('https://dream-rpc.somnia.network/');
    
    // Setup signer
    const pk = privateKey || process.env.PRIVATE_KEY || 'bad2ecf2b8778c5611d27706a8289f1e9bdc028c049cbac22656ed2e82bf9df1';
    const wallet = new ethers.Wallet(pk);
    this.signer = wallet.connect(this.provider);
    
    // Setup marketplace contract
    this.marketplaceContract = new ethers.Contract(
      DEPLOYED_ADDRESSES.marketplace,
      MARKETPLACE_ABI,
      this.signer
    );
  }

  /**
   * Approve NFT for marketplace
   */
  async approveNFT(nftContract: string, tokenId: number): Promise<void> {
    try {
      console.log('\n🔓 Approving NFT for marketplace...');
      
      const nft = new ethers.Contract(nftContract, ERC721_ABI, this.signer);
      
      // Check current approval
      const currentApproval = await nft.getApproved(tokenId);
      
      if (currentApproval.toLowerCase() === DEPLOYED_ADDRESSES.marketplace.toLowerCase()) {
        console.log('  ✅ Already approved');
        return;
      }
      
      // Approve marketplace
      const tx = await nft.approve(DEPLOYED_ADDRESSES.marketplace, tokenId);
      console.log(`  Transaction: ${tx.hash}`);
      console.log('  ⏳ Waiting for confirmation...');
      
      await tx.wait();
      console.log('  ✅ NFT approved for marketplace');
    } catch (error) {
      console.error('❌ Error approving NFT:', error);
      throw error;
    }
  }

  /**
   * Approve all NFTs from a collection for marketplace
   */
  async approveAllNFTs(nftContract: string): Promise<void> {
    try {
      console.log('\n🔓 Approving all NFTs for marketplace...');
      
      const nft = new ethers.Contract(nftContract, ERC721_ABI, this.signer);
      const signerAddress = await this.signer.getAddress();
      
      // Check if already approved
      const isApproved = await nft.isApprovedForAll(signerAddress, DEPLOYED_ADDRESSES.marketplace);
      
      if (isApproved) {
        console.log('  ✅ Already approved for all');
        return;
      }
      
      // Approve all
      const tx = await nft.setApprovalForAll(DEPLOYED_ADDRESSES.marketplace, true);
      console.log(`  Transaction: ${tx.hash}`);
      console.log('  ⏳ Waiting for confirmation...');
      
      await tx.wait();
      console.log('  ✅ All NFTs approved for marketplace');
    } catch (error) {
      console.error('❌ Error approving all NFTs:', error);
      throw error;
    }
  }

  /**
   * Get listing fee
   */
  async getListingFee(): Promise<bigint> {
    try {
      const fee = await this.marketplaceContract.listingFeeWei();
      return fee;
    } catch (error) {
      console.error('Error getting listing fee:', error);
      return BigInt(0);
    }
  }

  /**
   * Get platform fee percentage
   */
  async getPlatformFee(): Promise<number> {
    try {
      const feeBps = await this.marketplaceContract.platformFeeBps();
      return Number(feeBps) / 100; // Convert basis points to percentage
    } catch (error) {
      console.error('Error getting platform fee:', error);
      return 2.5; // Default 2.5%
    }
  }

  /**
   * Create listing on marketplace
   */
  async createListing(params: ListingParams): Promise<ListingResult> {
    try {
      console.log('\n📋 Creating marketplace listing...');
      console.log(`  NFT Contract: ${params.nftContract}`);
      console.log(`  Token ID: ${params.tokenId}`);
      console.log(`  Price: ${params.price} STT`);
      console.log(`  CID: ${params.cid}`);
      
      // Get listing fee
      const listingFee = await this.getListingFee();
      console.log(`  Listing Fee: ${ethers.formatEther(listingFee)} STT`);
      
      // Get platform fee percentage
      const platformFee = await this.getPlatformFee();
      console.log(`  Platform Fee: ${platformFee}%`);
      
      // Approve NFT
      await this.approveNFT(params.nftContract, params.tokenId);
      
      // Convert price to wei
      const priceWei = ethers.parseEther(params.price);
      
      // Create listing
      console.log('\n📝 Creating listing...');
      const tx = await this.marketplaceContract.createListing(
        params.nftContract,
        params.tokenId,
        priceWei,
        params.cid,
        { value: listingFee }
      );
      
      console.log(`  Transaction: ${tx.hash}`);
      console.log('  ⏳ Waiting for confirmation...');
      
      const receipt = await tx.wait();
      console.log(`  ✅ Confirmed in block ${receipt.blockNumber}`);
      
      // Get listing ID from event
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = this.marketplaceContract.interface.parseLog(log);
          return parsed?.name === 'ListingCreated';
        } catch {
          return false;
        }
      });
      
      if (!event) {
        throw new Error('ListingCreated event not found');
      }
      
      const parsedEvent = this.marketplaceContract.interface.parseLog(event);
      const listingId = Number(parsedEvent?.args.listingId);
      
      console.log(`  🎉 Listing created with ID: ${listingId}`);
      console.log(`  🌐 View listing: https://shannon-explorer.somnia.network/tx/${tx.hash}`);
      
      const result: ListingResult = {
        listingId,
        transactionHash: tx.hash,
        seller: await this.signer.getAddress(),
        nftContract: params.nftContract,
        tokenId: params.tokenId,
        price: params.price,
        cid: params.cid,
        timestamp: new Date().toISOString()
      };
      
      return result;
    } catch (error) {
      console.error('❌ Error creating listing:', error);
      throw error;
    }
  }

  /**
   * Batch list multiple NFTs
   */
  async batchCreateListings(listings: ListingParams[]): Promise<ListingResult[]> {
    try {
      console.log(`\n📋 Creating ${listings.length} marketplace listings...`);
      
      // Approve all NFTs first
      const uniqueContracts = [...new Set(listings.map(l => l.nftContract))];
      for (const contract of uniqueContracts) {
        await this.approveAllNFTs(contract);
      }
      
      // Create listings
      const results: ListingResult[] = [];
      
      for (const listing of listings) {
        const result = await this.createListing(listing);
        results.push(result);
      }
      
      console.log(`\n✅ Successfully listed ${results.length} NFTs`);
      
      return results;
    } catch (error) {
      console.error('❌ Error in batch listing:', error);
      throw error;
    }
  }

  /**
   * Get active listings for a seller
   */
  async getSellerListings(sellerAddress?: string): Promise<any[]> {
    try {
      const seller = sellerAddress || await this.signer.getAddress();
      console.log(`\n📊 Getting listings for seller: ${seller}`);
      
      const listingIds = await this.marketplaceContract.getSellerListings(seller);
      console.log(`  Found ${listingIds.length} listings`);
      
      const listings = [];
      for (const id of listingIds) {
        const listing = await this.marketplaceContract.getListing(id);
        listings.push({
          id: Number(id),
          seller: listing[0],
          nft: listing[1],
          tokenId: Number(listing[2]),
          price: ethers.formatEther(listing[3]),
          cid: listing[4],
          active: listing[5],
          sold: listing[6],
          createdAt: new Date(Number(listing[7]) * 1000).toISOString()
        });
      }
      
      return listings;
    } catch (error) {
      console.error('Error getting seller listings:', error);
      return [];
    }
  }

  /**
   * Cancel a listing
   */
  async cancelListing(listingId: number): Promise<void> {
    try {
      console.log(`\n❌ Canceling listing #${listingId}...`);
      
      const tx = await this.marketplaceContract.cancelListing(listingId);
      console.log(`  Transaction: ${tx.hash}`);
      console.log('  ⏳ Waiting for confirmation...');
      
      await tx.wait();
      console.log('  ✅ Listing canceled');
    } catch (error) {
      console.error('❌ Error canceling listing:', error);
      throw error;
    }
  }

  /**
   * Update listing price
   */
  async updateListing(listingId: number, newPrice: string, newCid?: string): Promise<void> {
    try {
      console.log(`\n✏️ Updating listing #${listingId}...`);
      console.log(`  New price: ${newPrice} STT`);
      
      // Get current listing to preserve CID if not provided
      const listing = await this.marketplaceContract.getListing(listingId);
      const cid = newCid || listing[4];
      
      const priceWei = ethers.parseEther(newPrice);
      
      const tx = await this.marketplaceContract.updateListing(listingId, priceWei, cid);
      console.log(`  Transaction: ${tx.hash}`);
      console.log('  ⏳ Waiting for confirmation...');
      
      await tx.wait();
      console.log('  ✅ Listing updated');
    } catch (error) {
      console.error('❌ Error updating listing:', error);
      throw error;
    }
  }
}

// Main execution
async function main() {
  try {
    const args = process.argv.slice(2);
    const command = args[0] || 'list';
    
    const lister = new MarketplaceLister();
    
    switch (command) {
      case 'list': {
        // Create a sample listing
        const nftContract = args[1] || DEPLOYED_ADDRESSES.sampleNFT;
        const tokenId = parseInt(args[2]) || 1;
        const price = args[3] || '0.1';
        const cid = args[4] || 'QmSampleCID';
        
        await lister.createListing({
          nftContract,
          tokenId,
          price,
          cid
        });
        break;
      }
      
      case 'batch': {
        // Batch list multiple NFTs
        const nftContract = args[1] || DEPLOYED_ADDRESSES.sampleNFT;
        const startTokenId = parseInt(args[2]) || 1;
        const count = parseInt(args[3]) || 3;
        const basePrice = parseFloat(args[4]) || 0.1;
        
        const listings: ListingParams[] = [];
        for (let i = 0; i < count; i++) {
          listings.push({
            nftContract,
            tokenId: startTokenId + i,
            price: (basePrice + i * 0.05).toString(),
            cid: `QmSampleCID${i + 1}`
          });
        }
        
        await lister.batchCreateListings(listings);
        break;
      }
      
      case 'view': {
        // View seller's listings
        const seller = args[1];
        const listings = await lister.getSellerListings(seller);
        console.log('\n📃 Active Listings:');
        listings.forEach(l => {
          if (l.active && !l.sold) {
            console.log(`  #${l.id}: Token ${l.tokenId} - ${l.price} STT`);
          }
        });
        break;
      }
      
      case 'cancel': {
        // Cancel a listing
        const listingId = parseInt(args[1]);
        if (!listingId) {
          console.error('❌ Please provide listing ID');
          process.exit(1);
        }
        await lister.cancelListing(listingId);
        break;
      }
      
      case 'update': {
        // Update listing price
        const listingId = parseInt(args[1]);
        const newPrice = args[2];
        if (!listingId || !newPrice) {
          console.error('❌ Please provide listing ID and new price');
          process.exit(1);
        }
        await lister.updateListing(listingId, newPrice);
        break;
      }
      
      default:
        console.log('Available commands:');
        console.log('  list [nftContract] [tokenId] [price] [cid]');
        console.log('  batch [nftContract] [startTokenId] [count] [basePrice]');
        console.log('  view [sellerAddress]');
        console.log('  cancel <listingId>');
        console.log('  update <listingId> <newPrice>');
    }
    
    console.log('\n✨ Process complete!');
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}