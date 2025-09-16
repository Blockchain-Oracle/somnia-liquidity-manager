#!/usr/bin/env node

import fetch from 'node-fetch';
import FormData from 'form-data';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Beautiful images from our mock data
const BEAUTIFUL_IMAGES = [
  {
    name: 'Cosmic Dreams #1',
    description: 'A mesmerizing journey through cosmic landscapes',
    imageUrl: 'https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?w=1200&h=1200&fit=crop',
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
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&h=1200&fit=crop',
    attributes: [
      { trait_type: 'Collection', value: 'Neon Nights' },
      { trait_type: 'Rarity', value: 'Epic' },
      { trait_type: 'Theme', value: 'Abstract' },
      { trait_type: 'Color Palette', value: 'Pink & Purple' }
    ]
  },
  {
    name: 'Digital Genesis #3',
    description: 'The birth of digital consciousness',
    imageUrl: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=1200&h=1200&fit=crop',
    attributes: [
      { trait_type: 'Collection', value: 'Digital Genesis' },
      { trait_type: 'Rarity', value: 'Legendary' },
      { trait_type: 'Theme', value: 'Technology' },
      { trait_type: 'Color Palette', value: 'Blue & White' }
    ]
  },
  {
    name: 'Ethereal Waves #4',
    description: 'Flowing patterns of digital energy',
    imageUrl: 'https://images.unsplash.com/photo-1635002962487-2c1d4d2f63c2?w=1200&h=1200&fit=crop',
    attributes: [
      { trait_type: 'Collection', value: 'Ethereal Waves' },
      { trait_type: 'Rarity', value: 'Epic' },
      { trait_type: 'Theme', value: 'Energy' },
      { trait_type: 'Color Palette', value: 'Red & Orange' }
    ]
  },
  {
    name: 'Quantum Dreams #5',
    description: 'Visualization of quantum mechanics',
    imageUrl: 'https://images.unsplash.com/photo-1617791160505-6f00504e3519?w=1200&h=1200&fit=crop',
    attributes: [
      { trait_type: 'Collection', value: 'Quantum Dreams' },
      { trait_type: 'Rarity', value: 'Mythic' },
      { trait_type: 'Theme', value: 'Science' },
      { trait_type: 'Color Palette', value: 'Multi-color' }
    ]
  }
];

/**
 * Download image from URL
 */
async function downloadImage(url, filepath) {
  const response = await fetch(url);
  const buffer = await response.buffer();
  fs.writeFileSync(filepath, buffer);
  return filepath;
}

/**
 * Upload to Pinata
 */
async function uploadToPinata(filepath, name) {
  const PINATA_JWT = process.env.PINATA_JWT;
  
  if (!PINATA_JWT) {
    console.error('❌ PINATA_JWT not found in .env file');
    console.log('📝 Get your API key from: https://app.pinata.cloud/developers/api-keys');
    console.log('   Add to .env: PINATA_JWT=your_jwt_token_here');
    process.exit(1);
  }

  const formData = new FormData();
  const file = fs.createReadStream(filepath);
  formData.append('file', file);
  
  const metadata = JSON.stringify({
    name: name,
  });
  formData.append('pinataMetadata', metadata);

  try {
    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PINATA_JWT}`
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Pinata API error: ${error}`);
    }

    const data = await response.json();
    return data.IpfsHash;
  } catch (error) {
    console.error('Failed to upload to Pinata:', error);
    throw error;
  }
}

/**
 * Upload JSON metadata to Pinata
 */
async function uploadJSONToPinata(jsonData, name) {
  const PINATA_JWT = process.env.PINATA_JWT;
  
  if (!PINATA_JWT) {
    console.error('❌ PINATA_JWT not found');
    return null;
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
  console.log('🎨 Uploading Beautiful NFT Images to IPFS via Pinata\n');
  console.log('=' .repeat(60));
  
  // Create temp directory for downloads
  const tempDir = path.join(__dirname, '../temp-images');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const results = [];

  for (let i = 0; i < BEAUTIFUL_IMAGES.length; i++) {
    const nft = BEAUTIFUL_IMAGES[i];
    console.log(`\n[${i + 1}/${BEAUTIFUL_IMAGES.length}] Processing: ${nft.name}`);
    
    try {
      // Step 1: Download image
      console.log('  📥 Downloading image...');
      const filename = `nft-${i + 1}.jpg`;
      const filepath = path.join(tempDir, filename);
      await downloadImage(nft.imageUrl, filepath);
      console.log('  ✅ Image downloaded');
      
      // Step 2: Upload image to Pinata
      console.log('  📤 Uploading image to IPFS...');
      const imageCID = await uploadToPinata(filepath, nft.name);
      console.log(`  ✅ Image CID: ${imageCID}`);
      
      // Step 3: Create and upload metadata
      const metadata = {
        name: nft.name,
        description: nft.description,
        image: `ipfs://${imageCID}`,
        attributes: nft.attributes,
        properties: {
          category: 'image',
          files: [{
            uri: `ipfs://${imageCID}`,
            type: 'image/jpeg'
          }]
        }
      };
      
      console.log('  📤 Uploading metadata to IPFS...');
      const metadataCID = await uploadJSONToPinata(metadata, `${nft.name} Metadata`);
      console.log(`  ✅ Metadata CID: ${metadataCID}`);
      
      results.push({
        ...nft,
        imageCID,
        metadataCID,
        imageIPFS: `ipfs://${imageCID}`,
        metadataIPFS: `ipfs://${metadataCID}`,
        gatewayUrl: `https://gateway.pinata.cloud/ipfs/${imageCID}`
      });
      
      // Clean up downloaded file
      fs.unlinkSync(filepath);
      
    } catch (error) {
      console.error(`  ❌ Failed to process ${nft.name}:`, error.message);
    }
  }
  
  // Save results
  const outputPath = path.join(__dirname, '../deployments/uploaded-nfts.json');
  fs.writeFileSync(outputPath, JSON.stringify({
    uploadedAt: new Date().toISOString(),
    totalUploaded: results.length,
    nfts: results
  }, null, 2));
  
  // Clean up temp directory
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true });
  }
  
  // Display summary
  console.log('\n' + '='.repeat(60));
  console.log('🎉 UPLOAD COMPLETE!');
  console.log('='.repeat(60));
  console.log(`\n✅ Successfully uploaded: ${results.length}/${BEAUTIFUL_IMAGES.length} NFTs`);
  
  if (results.length > 0) {
    console.log('\n📝 Real IPFS CIDs:');
    results.forEach((nft, index) => {
      console.log(`\n${index + 1}. ${nft.name}`);
      console.log(`   Image CID: ${nft.imageCID}`);
      console.log(`   Metadata CID: ${nft.metadataCID}`);
      console.log(`   Gateway: ${nft.gatewayUrl}`);
    });
    
    console.log('\n💾 Results saved to: deployments/uploaded-nfts.json');
    console.log('\n🚀 You can now use these real CIDs to mint NFTs on-chain!');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });