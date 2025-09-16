#!/usr/bin/env node

import fetch from 'node-fetch';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Beautiful images from our mock data - using the actual URLs
const BEAUTIFUL_NFTS = [
  {
    name: 'Cosmic Dreams #1',
    description: 'A mesmerizing journey through cosmic landscapes, featuring vibrant nebulas and stellar formations',
    image: 'https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?w=1200&h=1200&fit=crop',
    attributes: [
      { trait_type: 'Collection', value: 'Cosmic Dreams' },
      { trait_type: 'Rarity', value: 'Rare' },
      { trait_type: 'Theme', value: 'Space' },
      { trait_type: 'Color Palette', value: 'Purple & Blue' }
    ]
  },
  {
    name: 'Neon Nights #2',
    description: 'Abstract neon art that captures the essence of futuristic city nights',
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&h=1200&fit=crop',
    attributes: [
      { trait_type: 'Collection', value: 'Neon Nights' },
      { trait_type: 'Rarity', value: 'Epic' },
      { trait_type: 'Theme', value: 'Abstract' },
      { trait_type: 'Color Palette', value: 'Pink & Purple' }
    ]
  },
  {
    name: 'Digital Genesis #3',
    description: 'The birth of digital consciousness, represented through flowing abstract forms',
    image: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=1200&h=1200&fit=crop',
    attributes: [
      { trait_type: 'Collection', value: 'Digital Genesis' },
      { trait_type: 'Rarity', value: 'Legendary' },
      { trait_type: 'Theme', value: 'Technology' },
      { trait_type: 'Color Palette', value: 'Blue & White' }
    ]
  },
  {
    name: 'Ethereal Waves #4',
    description: 'Flowing patterns that capture the essence of digital energy and movement',
    image: 'https://images.unsplash.com/photo-1635002962487-2c1d4d2f63c2?w=1200&h=1200&fit=crop',
    attributes: [
      { trait_type: 'Collection', value: 'Ethereal Waves' },
      { trait_type: 'Rarity', value: 'Epic' },
      { trait_type: 'Theme', value: 'Energy' },
      { trait_type: 'Color Palette', value: 'Red & Orange' }
    ]
  },
  {
    name: 'Quantum Dreams #5',
    description: 'A visualization of quantum mechanics and parallel dimensions',
    image: 'https://images.unsplash.com/photo-1617791160505-6f00504e3519?w=1200&h=1200&fit=crop',
    attributes: [
      { trait_type: 'Collection', value: 'Quantum Dreams' },
      { trait_type: 'Rarity', value: 'Mythic' },
      { trait_type: 'Theme', value: 'Science' },
      { trait_type: 'Color Palette', value: 'Multi-color' }
    ]
  },
  {
    name: 'Aurora Borealis #6',
    description: 'Captured essence of the northern lights in digital form',
    image: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&h=1200&fit=crop',
    attributes: [
      { trait_type: 'Collection', value: 'Natural Wonders' },
      { trait_type: 'Rarity', value: 'Rare' },
      { trait_type: 'Theme', value: 'Nature' },
      { trait_type: 'Color Palette', value: 'Green & Blue' }
    ]
  },
  {
    name: 'Fractal Universe #7',
    description: 'Infinite patterns that reveal the mathematical beauty of nature',
    image: 'https://images.unsplash.com/photo-1574482620811-1aa16ffe3c82?w=1200&h=1200&fit=crop',
    attributes: [
      { trait_type: 'Collection', value: 'Fractal Universe' },
      { trait_type: 'Rarity', value: 'Epic' },
      { trait_type: 'Theme', value: 'Mathematics' },
      { trait_type: 'Color Palette', value: 'Purple & Gold' }
    ]
  },
  {
    name: 'Cyber Dreams #8',
    description: 'A glimpse into the digital future where reality and virtuality merge',
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&h=1200&fit=crop',
    attributes: [
      { trait_type: 'Collection', value: 'Cyber Dreams' },
      { trait_type: 'Rarity', value: 'Legendary' },
      { trait_type: 'Theme', value: 'Cyberpunk' },
      { trait_type: 'Color Palette', value: 'Neon' }
    ]
  }
];

/**
 * Upload JSON metadata to Pinata
 */
async function uploadJSONToPinata(jsonData, name) {
  const PINATA_JWT = process.env.PINATA_JWT;
  
  if (!PINATA_JWT) {
    throw new Error('PINATA_JWT not configured. Set PINATA_JWT in your .env to upload metadata to Pinata.');
  }

  try {
    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PINATA_JWT}`
      },
      body: JSON.stringify({
        pinataContent: jsonData,
        pinataMetadata: {
          name: name
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Pinata API error: ${error}`);
    }

    const data = await response.json();
    return data.IpfsHash;
  } catch (error) {
    console.error('Failed to upload JSON to Pinata:', error);
    throw error;
  }
}

async function main() {
  console.log('🎨 Creating NFT Metadata with Beautiful Unsplash Images\n');
  console.log('=' .repeat(60));
  
  const results = [];
  const isPinataConfigured = !!process.env.PINATA_JWT;
  if (!isPinataConfigured) {
    throw new Error('PINATA_JWT not configured. Aborting metadata creation.');
  }

  for (let i = 0; i < BEAUTIFUL_NFTS.length; i++) {
    const nft = BEAUTIFUL_NFTS[i];
    console.log(`\n[${i + 1}/${BEAUTIFUL_NFTS.length}] Processing: ${nft.name}`);
    
    try {
      // Create metadata with direct image URL
      const metadata = {
        name: nft.name,
        description: nft.description,
        image: nft.image, // Using direct Unsplash URL
        external_url: `https://somnia-nft.art/${i + 1}`,
        attributes: nft.attributes,
        properties: {
          category: 'image',
          files: [{
            uri: nft.image,
            type: 'image/jpeg'
          }]
        }
      };
      
      console.log('  📤 Uploading metadata to IPFS...');
      const metadataCID = await uploadJSONToPinata(metadata, nft.name);
      console.log(`  ✅ Metadata CID: ${metadataCID}`);
      
      results.push({
        ...nft,
        metadataCID,
        metadataIPFS: `ipfs://${metadataCID}`,
        gatewayUrl: isPinataConfigured 
          ? `https://gateway.pinata.cloud/ipfs/${metadataCID}`
          : nft.image // Use direct image URL if no Pinata
      });
      
    } catch (error) {
      console.error(`  ❌ Failed to process ${nft.name}:`, error.message);
    }
  }
  
  // Save results
  const outputPath = path.join(__dirname, '../deployments/nft-metadata.json');
  fs.writeFileSync(outputPath, JSON.stringify({
    createdAt: new Date().toISOString(),
    isPinataConfigured,
    totalCreated: results.length,
    nfts: results
  }, null, 2));
  
  // Display summary
  console.log('\n' + '='.repeat(60));
  console.log('🎉 METADATA CREATION COMPLETE!');
  console.log('='.repeat(60));
  console.log(`\n✅ Successfully created: ${results.length}/${BEAUTIFUL_NFTS.length} NFT metadata`);
  
  if (results.length > 0) {
    console.log('\n📝 NFT Metadata CIDs:');
    results.forEach((nft, index) => {
      console.log(`\n${index + 1}. ${nft.name}`);
      console.log(`   Image URL: ${nft.image}`);
      console.log(`   Metadata CID: ${nft.metadataCID}`);
      console.log(`   Rarity: ${nft.attributes.find(a => a.trait_type === 'Rarity')?.value}`);
    });
    
    console.log('\n💾 Results saved to: deployments/nft-metadata.json');
    console.log('\n🚀 These metadata CIDs can be used to mint NFTs on-chain!');
    console.log('   The NFTs will display the beautiful Unsplash images directly.');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });