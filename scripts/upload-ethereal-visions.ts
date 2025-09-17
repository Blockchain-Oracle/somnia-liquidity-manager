/**
 * Upload Ethereal Visions NFT Collection to IPFS
 * Uses the existing IPFS service for proper integration
 */

import fs from 'fs';
import path from 'path';
import { IPFSService } from '../lib/services/ipfs.service';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function uploadEtherealVisions() {
  console.log('🎨 Uploading Ethereal Visions Collection to IPFS\n');
  console.log('=' .repeat(60));
  
  try {
    const metadataDir = path.join(process.cwd(), 'uploads', 'ethereal-visions');
    
    // Check if directory exists
    if (!fs.existsSync(metadataDir)) {
      console.error(`❌ Directory not found: ${metadataDir}`);
      console.log('Please ensure the metadata files are in uploads/ethereal-visions/');
      process.exit(1);
    }
    
    // Get all JSON files from the directory
    const metadataFiles = fs.readdirSync(metadataDir)
      .filter(file => file.endsWith('.json'))
      .sort();
    
    if (metadataFiles.length === 0) {
      console.error('❌ No JSON files found in uploads/ethereal-visions/');
      process.exit(1);
    }
    
    console.log(`📁 Found ${metadataFiles.length} NFT metadata files\n`);
    
    const uploadedNFTs = [];
    
    // Upload each metadata file
    for (const fileName of metadataFiles) {
      const filePath = path.join(metadataDir, fileName);
      
      try {
        console.log(`\n📤 Uploading: ${fileName}`);
        
        // Read the metadata
        const metadata = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        
        // Display NFT info
        console.log(`   🎨 Name: ${metadata.name}`);
        console.log(`   📝 Description: ${metadata.description.substring(0, 60)}...`);
        
        const artist = metadata.attributes.find(a => a.trait_type === 'Artist');
        if (artist) {
          console.log(`   👨‍🎨 Artist: ${artist.value}`);
        }
        
        // Upload using the IPFS service
        const metadataCID = await IPFSService.uploadJSON(metadata);
        
        console.log(`   ✅ Uploaded successfully!`);
        console.log(`   📎 CID: ${metadataCID}`);
        console.log(`   🔗 IPFS URL: ipfs://${metadataCID}`);
        console.log(`   🌐 Gateway: ${IPFSService.getGatewayURL(metadataCID)}`);
        
        // Extract token ID from filename (e.g., "1-cosmic-nebula.json" -> 1)
        const tokenId = parseInt(fileName.split('-')[0]) || uploadedNFTs.length + 1;
        
        uploadedNFTs.push({
          tokenId,
          name: metadata.name,
          description: metadata.description,
          cid: metadataCID,
          ipfsUrl: `ipfs://${metadataCID}`,
          gatewayUrl: IPFSService.getGatewayURL(metadataCID),
          metadata
        });
        
      } catch (error: any) {
        console.error(`   ❌ Failed to upload ${fileName}:`, error.message);
        continue;
      }
    }
    
    // Save the results
    if (uploadedNFTs.length > 0) {
      const outputFile = path.join(process.cwd(), 'ethereal-visions-ipfs-cids.json');
      const output = {
        collection: 'Ethereal Visions',
        timestamp: new Date().toISOString(),
        network: 'Somnia Testnet',
        uploaderService: 'IPFSService',
        nfts: uploadedNFTs.map(({ tokenId, name, cid, ipfsUrl, gatewayUrl }) => ({
          tokenId,
          name,
          cid,
          ipfsUrl,
          gatewayUrl
        }))
      };
      
      fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));
      
      console.log('\n' + '='.repeat(60));
      console.log('✅ Upload Complete!');
      console.log(`   📊 Successfully uploaded: ${uploadedNFTs.length}/${metadataFiles.length} NFTs`);
      console.log(`   💾 CIDs saved to: ethereal-visions-ipfs-cids.json`);
      
      // Display summary for smart contract use
      console.log('\n📝 Token URIs for Smart Contract:');
      console.log('-'.repeat(60));
      uploadedNFTs.forEach(nft => {
        console.log(`Token #${nft.tokenId} (${nft.name}):`);
        console.log(`   ipfs://${nft.cid}`);
      });
      
      console.log('\n🔍 Verify uploads at:');
      uploadedNFTs.forEach(nft => {
        console.log(`   ${nft.name}: ${nft.gatewayUrl}`);
      });
      
    } else {
      console.error('\n❌ No files were uploaded successfully');
      process.exit(1);
    }
    
  } catch (error: any) {
    console.error('\n❌ Upload failed:', error.message);
    process.exit(1);
  }
}

// Run the upload
uploadEtherealVisions().catch(console.error);