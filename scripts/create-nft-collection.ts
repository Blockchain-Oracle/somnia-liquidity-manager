#!/usr/bin/env node
/**
 * Master NFT Collection Creation Script
 * Orchestrates the complete flow: Generate → Upload → Mint → List
 */

import { generateCollectionMetadata, generatePremiumCollection, generateDiverseCollection } from './generate-nft-metadata';
import { uploadNFTCollection } from './upload-metadata';
import { NFTMinter } from './mint-nfts';
import { MarketplaceLister } from './list-on-marketplace';
import type { ListingParams } from './list-on-marketplace';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

interface CollectionConfig {
  name: string;
  symbol: string;
  description: string;
  type: 'abstract' | 'nature' | 'cyberpunk' | 'premium' | 'diverse';
  size: number;
  mintPrice: string; // in STT
  listingPrices?: string[]; // Individual prices for marketplace
  maxSupply: number;
}

interface CollectionResult {
  // Metadata generation
  metadata: any[];
  
  // IPFS upload
  collectionCID: string;
  nftCIDs: string[];
  
  // Blockchain deployment
  collectionAddress: string;
  mintedTokenIds: number[];
  
  // Marketplace listings
  listingIds: number[];
  
  // Summary
  totalNFTs: number;
  totalListings: number;
  timestamp: string;
}

export class NFTCollectionCreator {
  private minter: NFTMinter;
  private lister: MarketplaceLister;
  private results: CollectionResult | null = null;

  constructor(privateKey?: string) {
    this.minter = new NFTMinter(privateKey);
    this.lister = new MarketplaceLister(privateKey);
  }

  /**
   * Step 1: Generate metadata based on collection type
   */
  async generateMetadata(config: CollectionConfig): Promise<any[]> {
    console.log('\n📝 Step 1: Generating NFT Metadata');
    console.log(`  Collection: ${config.name}`);
    console.log(`  Type: ${config.type}`);
    console.log(`  Size: ${config.size}`);
    
    let metadata;
    
    switch (config.type) {
      case 'premium':
        metadata = generatePremiumCollection(config.name, config.description, config.size);
        break;
      case 'diverse':
        metadata = generateDiverseCollection(config.size);
        break;
      default:
        metadata = generateCollectionMetadata(config.type, config.size);
        // Update names to match collection
        metadata = metadata.map((nft, index) => ({
          ...nft,
          name: `${config.name} #${index + 1}`
        }));
    }
    
    console.log(`  ✅ Generated ${metadata.length} NFT metadata items`);
    
    return metadata;
  }

  /**
   * Step 2: Upload metadata to Pinata/IPFS
   */
  async uploadToPinata(config: CollectionConfig, metadata: any[]): Promise<{ collectionCID: string; nftCIDs: string[] }> {
    console.log('\n📤 Step 2: Uploading to Pinata/IPFS');
    
    // Check for Pinata JWT
    if (!process.env.PINATA_JWT && !process.env.NEXT_PUBLIC_PINATA_JWT) {
      throw new Error('PINATA_JWT environment variable is required');
    }
    
    const result = await uploadNFTCollection(config.name, config.description, metadata);
    
    console.log(`  ✅ Collection CID: ${result.collectionCID}`);
    console.log(`  ✅ Uploaded ${result.nftCIDs.length} NFT metadata files`);
    
    return {
      collectionCID: result.collectionCID,
      nftCIDs: result.nftCIDs
    };
  }

  /**
   * Step 3: Deploy collection and mint NFTs
   */
  async deployAndMint(
    config: CollectionConfig,
    collectionCID: string,
    nftCIDs: string[]
  ): Promise<{ collectionAddress: string; tokenIds: number[] }> {
    console.log('\n🚀 Step 3: Deploying Collection & Minting NFTs');
    
    // Deploy collection
    const collectionAddress = await this.minter.deployCollection({
      name: config.name,
      symbol: config.symbol,
      collectionCID,
      maxSupply: config.maxSupply,
      mintPrice: config.mintPrice,
      nftCIDs
    });
    
    // Mint NFTs
    const signerAddress = await this.minter['signer'].getAddress();
    const tokenIds = await this.minter.mintNFTs(
      collectionAddress,
      signerAddress,
      nftCIDs
    );
    
    console.log(`  ✅ Collection: ${collectionAddress}`);
    console.log(`  ✅ Minted ${tokenIds.length} NFTs`);
    
    return { collectionAddress, tokenIds };
  }

  /**
   * Step 4: List NFTs on marketplace
   */
  async listOnMarketplace(
    collectionAddress: string,
    tokenIds: number[],
    nftCIDs: string[],
    prices: string[]
  ): Promise<number[]> {
    console.log('\n🛒 Step 4: Listing on Marketplace');
    
    // Prepare listings
    const listings: ListingParams[] = tokenIds.map((tokenId, index) => ({
      nftContract: collectionAddress,
      tokenId,
      price: prices[index] || prices[0] || '0.1',
      cid: nftCIDs[index]
    }));
    
    // Create listings
    const results = await this.lister.batchCreateListings(listings);
    const listingIds = results.map(r => r.listingId);
    
    console.log(`  ✅ Listed ${listingIds.length} NFTs on marketplace`);
    
    return listingIds;
  }

  /**
   * Execute complete flow
   */
  async createCollection(config: CollectionConfig): Promise<CollectionResult> {
    try {
      console.log('\n' + '='.repeat(60));
      console.log(`🎨 Creating NFT Collection: ${config.name}`);
      console.log('='.repeat(60));
      
      // Step 1: Generate metadata
      const metadata = await this.generateMetadata(config);
      
      // Step 2: Upload to Pinata
      const { collectionCID, nftCIDs } = await this.uploadToPinata(config, metadata);
      
      // Step 3: Deploy and mint
      const { collectionAddress, tokenIds } = await this.deployAndMint(
        config,
        collectionCID,
        nftCIDs
      );
      
      // Step 4: List on marketplace
      const listingPrices = config.listingPrices || Array(tokenIds.length).fill('0.1');
      const listingIds = await this.listOnMarketplace(
        collectionAddress,
        tokenIds,
        nftCIDs,
        listingPrices
      );
      
      // Compile results
      this.results = {
        metadata,
        collectionCID,
        nftCIDs,
        collectionAddress,
        mintedTokenIds: tokenIds,
        listingIds,
        totalNFTs: tokenIds.length,
        totalListings: listingIds.length,
        timestamp: new Date().toISOString()
      };
      
      // Save results
      await this.saveResults(config);
      
      console.log('\n' + '='.repeat(60));
      console.log('✨ Collection Creation Complete!');
      console.log('='.repeat(60));
      console.log(`  Collection: ${config.name}`);
      console.log(`  Address: ${collectionAddress}`);
      console.log(`  NFTs Minted: ${tokenIds.length}`);
      console.log(`  Listed on Marketplace: ${listingIds.length}`);
      console.log(`  Collection CID: ${collectionCID}`);
      console.log('='.repeat(60));
      
      return this.results;
    } catch (error) {
      console.error('❌ Error creating collection:', error);
      throw error;
    }
  }

  /**
   * Save results to file
   */
  private async saveResults(config: CollectionConfig): Promise<void> {
    if (!this.results) return;
    
    const resultsDir = path.join(process.cwd(), 'nft-collections');
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }
    
    const filename = `${config.symbol.toLowerCase()}-${Date.now()}.json`;
    const filepath = path.join(resultsDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify({
      config,
      results: this.results
    }, null, 2));
    
    console.log(`\n💾 Results saved to: ${filepath}`);
  }
}

// Preset collection configurations
const PRESET_COLLECTIONS: { [key: string]: CollectionConfig } = {
  abstract: {
    name: 'Abstract Dreams',
    symbol: 'ABS',
    description: 'A mesmerizing collection of abstract digital art exploring the boundaries of creativity',
    type: 'abstract',
    size: 5,
    mintPrice: '0.001',
    listingPrices: ['0.1', '0.15', '0.2', '0.25', '0.3'],
    maxSupply: 100
  },
  nature: {
    name: 'Nature\'s Wonders',
    symbol: 'NTR',
    description: 'Capturing the breathtaking beauty of the natural world in digital form',
    type: 'nature',
    size: 5,
    mintPrice: '0.001',
    listingPrices: ['0.08', '0.12', '0.15', '0.18', '0.22'],
    maxSupply: 100
  },
  cyberpunk: {
    name: 'Neon Dreams',
    symbol: 'NEON',
    description: 'Step into a futuristic world of neon lights and cyberpunk aesthetics',
    type: 'cyberpunk',
    size: 5,
    mintPrice: '0.001',
    listingPrices: ['0.15', '0.2', '0.25', '0.3', '0.35'],
    maxSupply: 100
  },
  premium: {
    name: 'Somnia Genesis',
    symbol: 'GEN',
    description: 'The first premium collection on Somnia Network. Each piece is a unique masterwork.',
    type: 'premium',
    size: 10,
    mintPrice: '0.01',
    listingPrices: ['1.0', '1.5', '2.0', '2.5', '3.0', '3.5', '4.0', '4.5', '5.0', '10.0'],
    maxSupply: 10
  },
  diverse: {
    name: 'Somnia Showcase',
    symbol: 'SHOW',
    description: 'A diverse collection showcasing various artistic styles and themes',
    type: 'diverse',
    size: 12,
    mintPrice: '0.001',
    maxSupply: 100
  }
};

// Main execution
async function main() {
  try {
    const args = process.argv.slice(2);
    const collectionType = args[0] || 'premium';
    const privateKey = process.env.PRIVATE_KEY;
    
    console.log('🎨 Somnia NFT Collection Creator');
    console.log('=================================');
    
    // Check requirements
    if (!process.env.PINATA_JWT && !process.env.NEXT_PUBLIC_PINATA_JWT) {
      console.error('\n❌ Missing PINATA_JWT environment variable');
      console.log('Please add the following to your .env.local file:');
      console.log('PINATA_JWT=your_pinata_jwt_token');
      console.log('\nGet your JWT from: https://app.pinata.cloud/developers/api-keys');
      process.exit(1);
    }
    
    const creator = new NFTCollectionCreator(privateKey);
    
    if (collectionType === 'custom') {
      // Custom collection from arguments
      const config: CollectionConfig = {
        name: args[1] || 'Custom Collection',
        symbol: args[2] || 'CUST',
        description: args[3] || 'A custom NFT collection',
        type: 'abstract',
        size: parseInt(args[4]) || 5,
        mintPrice: args[5] || '0.001',
        maxSupply: parseInt(args[6]) || 100
      };
      
      await creator.createCollection(config);
    } else if (PRESET_COLLECTIONS[collectionType]) {
      // Use preset configuration
      await creator.createCollection(PRESET_COLLECTIONS[collectionType]);
    } else {
      console.log('\n📚 Available collection types:');
      Object.keys(PRESET_COLLECTIONS).forEach(key => {
        const config = PRESET_COLLECTIONS[key];
        console.log(`  ${key}: ${config.name} (${config.size} NFTs)`);
      });
      console.log('\n💡 Usage:');
      console.log('  npm run create-nft-collection [type]');
      console.log('  npm run create-nft-collection custom [name] [symbol] [description] [size] [mintPrice] [maxSupply]');
      console.log('\nExample:');
      console.log('  npm run create-nft-collection premium');
      console.log('  npm run create-nft-collection custom "My Collection" "MYC" "Description" 10 0.001 100');
    }
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { PRESET_COLLECTIONS };