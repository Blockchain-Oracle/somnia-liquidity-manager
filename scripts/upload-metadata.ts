/**
 * Upload NFT Metadata to Pinata/IPFS
 * Handles the upload of NFT metadata and returns CIDs
 */

import { pinataService, CollectionMetadata } from '../lib/services/pinata.service';
import { 
  generateCollectionMetadata, 
  generateDiverseCollection,
  generatePremiumCollection 
} from './generate-nft-metadata';
import fs from 'fs';
import path from 'path';

interface UploadResult {
  collectionCID: string;
  nftCIDs: string[];
  metadata: any[];
  timestamp: string;
}

/**
 * Upload NFT collection to Pinata
 */
export async function uploadNFTCollection(
  collectionName: string,
  collectionDescription: string,
  nftMetadata: any[]
): Promise<UploadResult> {
  try {
    console.log(`\n📦 Uploading collection: ${collectionName}`);
    console.log(`📝 Total NFTs: ${nftMetadata.length}`);
    
    // Upload collection metadata
    const collectionMetadata: CollectionMetadata = {
      name: collectionName,
      description: collectionDescription,
      image: nftMetadata[0]?.image || 'https://source.unsplash.com/800x800/?abstract,art',
      banner_image: 'https://source.unsplash.com/1600x400/?abstract,banner',
      external_link: 'https://somnia-nft.art',
      seller_fee_basis_points: 250, // 2.5% royalty
      fee_recipient: process.env.WALLET_ADDRESS || '0xC6969eC3C5dFE5A8eCe77ECee940BC52883602E6'
    };
    
    console.log('\n⏳ Uploading collection metadata...');
    const collectionCID = await pinataService.uploadCollectionMetadata(collectionMetadata);
    console.log(`✅ Collection CID: ${collectionCID}`);
    console.log(`🌐 View at: ${pinataService.getGatewayUrl(collectionCID)}`);
    
    // Upload individual NFT metadata
    console.log('\n⏳ Uploading NFT metadata...');
    const nftCIDs = await pinataService.batchUploadNFTMetadata(nftMetadata);
    
    console.log(`✅ Successfully uploaded ${nftCIDs.length} NFTs`);
    
    // Display results
    nftCIDs.forEach((cid, index) => {
      console.log(`  NFT ${index + 1}: ${cid}`);
      console.log(`    View: ${pinataService.getGatewayUrl(cid)}`);
    });
    
    // Save results to file
    const result: UploadResult = {
      collectionCID,
      nftCIDs,
      metadata: nftMetadata,
      timestamp: new Date().toISOString()
    };
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    // Save to JSON file
    const filename = `${collectionName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.json`;
    const filepath = path.join(uploadsDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(result, null, 2));
    
    console.log(`\n💾 Results saved to: ${filepath}`);
    
    return result;
  } catch (error) {
    console.error('❌ Error uploading collection:', error);
    throw error;
  }
}

/**
 * Upload preset collections
 */
export async function uploadPresetCollections() {
  const results = [];
  
  // Upload Abstract Dreams collection
  console.log('\n========== Abstract Dreams Collection ==========');
  const abstractMetadata = generateCollectionMetadata('abstract', 5);
  const abstractResult = await uploadNFTCollection(
    'Abstract Dreams',
    'A mesmerizing collection of abstract digital art',
    abstractMetadata
  );
  results.push(abstractResult);
  
  // Upload Nature's Wonders collection
  console.log('\n========== Nature\'s Wonders Collection ==========');
  const natureMetadata = generateCollectionMetadata('nature', 5);
  const natureResult = await uploadNFTCollection(
    'Nature\'s Wonders',
    'Capturing the raw beauty of our natural world',
    natureMetadata
  );
  results.push(natureResult);
  
  // Upload Neon Dreams collection
  console.log('\n========== Neon Dreams Collection ==========');
  const cyberpunkMetadata = generateCollectionMetadata('cyberpunk', 5);
  const cyberpunkResult = await uploadNFTCollection(
    'Neon Dreams',
    'Step into a futuristic world of neon and chrome',
    cyberpunkMetadata
  );
  results.push(cyberpunkResult);
  
  return results;
}

/**
 * Upload a premium collection
 */
export async function uploadPremiumCollection() {
  console.log('\n========== Somnia Genesis Collection ==========');
  
  const metadata = generatePremiumCollection(
    'Somnia Genesis',
    'The first premium collection on Somnia Network. Each piece is a unique masterwork.',
    10
  );
  
  return await uploadNFTCollection(
    'Somnia Genesis',
    'Exclusive genesis collection featuring hand-curated digital masterpieces. Limited to 10 pieces.',
    metadata
  );
}

/**
 * Upload diverse collection
 */
export async function uploadDiverseCollection() {
  console.log('\n========== Somnia Diverse Collection ==========');
  
  const metadata = generateDiverseCollection(12);
  
  return await uploadNFTCollection(
    'Somnia Diverse',
    'A diverse collection showcasing various artistic styles and themes',
    metadata
  );
}

// Main execution
async function main() {
  try {
    // Check for Pinata JWT
    if (!process.env.PINATA_JWT && !process.env.NEXT_PUBLIC_PINATA_JWT) {
      console.error('❌ PINATA_JWT environment variable is required');
      console.log('Please add PINATA_JWT to your .env.local file');
      process.exit(1);
    }
    
    const args = process.argv.slice(2);
    const collectionType = args[0] || 'premium';
    
    console.log('🚀 Starting NFT metadata upload...');
    console.log(`📊 Collection type: ${collectionType}`);
    
    let result;
    
    switch (collectionType) {
      case 'all':
        result = await uploadPresetCollections();
        break;
      case 'diverse':
        result = await uploadDiverseCollection();
        break;
      case 'premium':
        result = await uploadPremiumCollection();
        break;
      default:
        // Custom collection from arguments
        const name = args[0] || 'Custom Collection';
        const description = args[1] || 'A custom NFT collection';
        const count = parseInt(args[2]) || 5;
        
        const metadata = generateCollectionMetadata('abstract', count);
        result = await uploadNFTCollection(name, description, metadata);
    }
    
    console.log('\n✨ Upload complete!');
    console.log('📄 Results:', result);
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

// Export functions for use in other scripts
export {
  main as uploadMetadata
};