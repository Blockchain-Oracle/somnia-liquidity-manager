/**
 * Deploy Individual NFTs for Marketplace
 * Each NFT is its own contract with a single token
 */

import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Factory contract ABI
const FACTORY_ABI = [
  "function deployNFT(string, string, string, string) payable returns (address)",
  "function batchDeployNFTs(string[], string[], string[], string[]) payable returns (address[])",
  "function deploymentFee() view returns (uint256)",
  "function getAllNFTs() view returns (address[])",
  "function getNFTDetails(address) view returns (string, string, string, string, address, address)"
];

// NFT contract ABI
const NFT_ABI = [
  "function tokenURI(uint256) view returns (string)",
  "function ownerOf(uint256) view returns (address)",
  "function getMetadata() view returns (string, string, string, string, address, address)",
  "function approve(address, uint256)",
  "function transferFrom(address, address, uint256)"
];

// Compile and deploy factory first
async function deployFactory(wallet: ethers.Wallet) {
  console.log('📦 Deploying NFT Factory...');
  
  // Factory bytecode (you'll need to compile this)
  // For now, we'll use a placeholder
  const factoryBytecode = "0x..."; // This would be the compiled bytecode
  
  // Deploy factory
  const factory = new ethers.ContractFactory([], factoryBytecode, wallet);
  const factoryContract = await factory.deploy();
  await factoryContract.waitForDeployment();
  
  const factoryAddress = await factoryContract.getAddress();
  console.log('   ✅ Factory deployed at:', factoryAddress);
  
  return factoryAddress;
}

async function deployMarketplaceNFTs() {
  console.log('🎨 Deploying Ethereal Visions NFTs for Marketplace\n');
  console.log('=' .repeat(60));
  
  try {
    // Load IPFS CIDs
    const cidPath = path.join(process.cwd(), 'ethereal-visions-ipfs-cids.json');
    if (!fs.existsSync(cidPath)) {
      console.error('❌ IPFS CIDs file not found!');
      console.log('Please run: npx tsx scripts/upload-ethereal-visions.ts first');
      process.exit(1);
    }
    
    const cidData = JSON.parse(fs.readFileSync(cidPath, 'utf-8'));
    if (!cidData.nfts || cidData.nfts.length === 0) {
      console.error('❌ No NFT CIDs found!');
      process.exit(1);
    }
    
    console.log(`📦 Found ${cidData.nfts.length} NFTs to deploy\n`);
    
    // Setup provider and wallet
    const provider = new ethers.JsonRpcProvider('https://dream-rpc.somnia.network');
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
    
    console.log('🔑 Deployer:', wallet.address);
    
    // Check balance
    const balance = await provider.getBalance(wallet.address);
    console.log('💰 Balance:', ethers.formatEther(balance), 'STT\n');
    
    // Use existing factory or deploy new one
    let factoryAddress = process.env.NFT_FACTORY_ADDRESS;
    
    if (!factoryAddress) {
      // Note: You'll need to compile and deploy the factory contract first
      console.log('⚠️  No factory address found. Please deploy the factory contract first.');
      console.log('   Run: npx hardhat run scripts/deploy-factory.ts --network somnia');
      process.exit(1);
    }
    
    const factory = new ethers.Contract(factoryAddress, FACTORY_ABI, wallet);
    
    // Get deployment fee
    const deploymentFee = await factory.deploymentFee();
    console.log('💸 Deployment Fee per NFT:', ethers.formatEther(deploymentFee), 'STT');
    
    // Prepare data for batch deployment
    const names: string[] = [];
    const symbols: string[] = [];
    const cids: string[] = [];
    const descriptions: string[] = [];
    
    // Professional details for each NFT including creator info
    const nftDetails = [
      { 
        symbol: "COSMIC", 
        desc: "A breathtaking visualization of cosmic nebulae, where vibrant purples and blues dance across the digital canvas. This piece captures the raw beauty of stellar nurseries.",
        creator: "Aurora Chen"
      },
      { 
        symbol: "NEON", 
        desc: "An electrifying fusion of neon colors that pulse with digital energy. This artwork explores the intersection of technology and art through vibrant light patterns.",
        creator: "Marcus Rivera"
      },
      { 
        symbol: "QUANTUM", 
        desc: "A mesmerizing abstract piece that visualizes the mysterious phenomena of quantum entanglement. Particles dance in impossible patterns across dimensional boundaries.",
        creator: "Zara Nakamura"
      },
      { 
        symbol: "AURORA", 
        desc: "Inspired by the Northern Lights, this digital masterpiece recreates nature's most spectacular light show with ethereal greens and mystical blues.",
        creator: "Elena Volkov"
      },
      { 
        symbol: "DREAM", 
        desc: "A hypnotic exploration of fluid dynamics in digital space. This piece captures the ephemeral nature of dreams through flowing, liquid forms.",
        creator: "Kai Thompson"
      }
    ];
    
    cidData.nfts.forEach((nft: any, index: number) => {
      names.push(nft.name);
      symbols.push(nftDetails[index].symbol);
      cids.push(nft.cid); // Just the CID, not the full IPFS URL
      descriptions.push(nftDetails[index].desc);
    });
    
    // Calculate total cost
    const totalCost = deploymentFee * BigInt(names.length);
    console.log('💵 Total Cost:', ethers.formatEther(totalCost), 'STT\n');
    
    // Display what will be deployed
    console.log('📋 NFTs to Deploy:');
    console.log('-'.repeat(60));
    names.forEach((name, i) => {
      console.log(`\n${i + 1}. ${name}`);
      console.log(`   Symbol: ${symbols[i]}`);
      console.log(`   Creator: ${wallet.address} (deployer)`);
      console.log(`   Artist: ${nftDetails[i].creator}`);
      console.log(`   Description: ${descriptions[i].substring(0, 80)}...`);
      console.log(`   CID: ${cids[i]}`);
    });
    
    // Deploy all NFTs at once
    console.log('\n🚀 Deploying NFTs...');
    console.log('-'.repeat(60));
    
    const tx = await factory.batchDeployNFTs(
      names,
      symbols,
      cids,
      descriptions,
      { value: totalCost }
    );
    
    console.log('📤 Transaction:', tx.hash);
    console.log('⏳ Waiting for confirmation...');
    
    const receipt = await tx.wait();
    console.log('✅ Confirmed in block:', receipt?.blockNumber);
    
    // Get deployed NFT addresses
    const allNFTs = await factory.getAllNFTs();
    const deployedNFTs = allNFTs.slice(-names.length); // Get the last N NFTs (our newly deployed ones)
    
    console.log('\n📍 Deployed NFT Contracts:');
    console.log('-'.repeat(60));
    
    const nftDetails = [];
    
    for (let i = 0; i < deployedNFTs.length; i++) {
      const nftAddress = deployedNFTs[i];
      const nftData = cidData.nfts[i];
      
      console.log(`\n${nftData.name}:`);
      console.log(`   Contract: ${nftAddress}`);
      console.log(`   CID: ${nftData.cid}`);
      console.log(`   IPFS: ${nftData.ipfsUrl}`);
      console.log(`   Gateway: ${nftData.gatewayUrl}`);
      
      nftDetails.push({
        ...nftData,
        contractAddress: nftAddress,
        deployTx: tx.hash,
        owner: wallet.address
      });
    }
    
    // Save deployment info
    const deploymentInfo = {
      timestamp: new Date().toISOString(),
      network: "Somnia Testnet",
      type: "marketplace-nfts",
      factoryAddress,
      deployTx: tx.hash,
      deployer: wallet.address,
      nfts: nftDetails
    };
    
    const deploymentPath = path.join(process.cwd(), 'ethereal-visions-deployment.json');
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    
    // Update deployment addresses
    const addressesPath = path.join(process.cwd(), 'deployment-addresses.json');
    const addresses = JSON.parse(fs.readFileSync(addressesPath, 'utf-8'));
    
    addresses.contracts.nftFactory = factoryAddress;
    addresses.contracts.etherealVisions = {};
    nftDetails.forEach((nft, index) => {
      addresses.contracts.etherealVisions[`nft${index + 1}`] = nft.contractAddress;
    });
    
    fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ Deployment Complete!');
    console.log(`\n📊 Summary:`);
    console.log(`   Factory: ${factoryAddress}`);
    console.log(`   Deployed: ${nftDetails.length} NFTs`);
    console.log(`   Transaction: ${tx.hash}`);
    console.log(`\n💾 Files Saved:`);
    console.log(`   Deployment: ethereal-visions-deployment.json`);
    console.log(`   Addresses: deployment-addresses.json`);
    console.log(`\n🎯 Next Steps:`);
    console.log('   1. Verify contracts on explorer');
    console.log('   2. List NFTs on marketplace');
    console.log('   3. Update frontend with new addresses');
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Run
deployMarketplaceNFTs().catch(console.error);