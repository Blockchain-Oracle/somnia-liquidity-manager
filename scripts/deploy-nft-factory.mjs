#!/usr/bin/env node

import { ethers } from 'ethers';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SOMNIA_TESTNET_RPC = process.env.SOMNIA_TESTNET_RPC || 'https://dream-rpc.somnia.network';
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// Contract artifacts paths
const FACTORY_ARTIFACT_PATH = path.join(__dirname, '../artifacts/contracts/SommiaNFTFactory.sol/SommiaNFTFactory.json');
const NFT_ARTIFACT_PATH = path.join(__dirname, '../artifacts/contracts/SommiaNFT.sol/SommiaNFT.json');

async function main() {
  console.log('🚀 Starting NFT Factory deployment on Somnia Testnet...\n');

  // Validate environment
  if (!PRIVATE_KEY) {
    console.error('❌ Error: PRIVATE_KEY not found in .env file');
    process.exit(1);
  }

  // Connect to network
  const provider = new ethers.JsonRpcProvider(SOMNIA_TESTNET_RPC);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  console.log('📡 Connected to Somnia Testnet');
  console.log('👛 Deployer address:', wallet.address);
  
  // Check balance
  const balance = await provider.getBalance(wallet.address);
  console.log('💰 Balance:', ethers.formatEther(balance), 'STT\n');
  
  if (balance === 0n) {
    console.error('❌ Error: Insufficient balance. Get testnet STT from: https://somnia.faucet.berachain.com/');
    process.exit(1);
  }

  try {
    // Load contract artifacts
    if (!fs.existsSync(FACTORY_ARTIFACT_PATH)) {
      console.error('❌ Error: Contract artifacts not found. Run: npx hardhat compile');
      process.exit(1);
    }

    const factoryArtifact = JSON.parse(fs.readFileSync(FACTORY_ARTIFACT_PATH, 'utf8'));
    
    // Deploy NFT Factory
    console.log('📝 Deploying SommiaNFTFactory...');
    const Factory = new ethers.ContractFactory(
      factoryArtifact.abi,
      factoryArtifact.bytecode,
      wallet
    );
    
    const factory = await Factory.deploy();
    await factory.waitForDeployment();
    
    const factoryAddress = await factory.getAddress();
    console.log('✅ NFT Factory deployed at:', factoryAddress);
    
    // Deploy a sample NFT collection through the factory
    console.log('\n📝 Deploying sample NFT collection through factory...');
    
    const sampleCollection = {
      name: 'Somnia Genesis Collection',
      symbol: 'SGC',
      collectionCID: 'QmSampleCollectionCID123', // Mock CID for demo
      maxSupply: 1000,
      mintPrice: ethers.parseEther('0.01') // 0.01 STT per mint
    };
    
    const tx = await factory.deployCollection(
      sampleCollection.name,
      sampleCollection.symbol,
      sampleCollection.collectionCID,
      sampleCollection.maxSupply,
      sampleCollection.mintPrice
    );
    
    const receipt = await tx.wait();
    console.log('⏳ Transaction confirmed:', receipt.hash);
    
    // Get the deployed collection address from events
    const deploymentEvent = receipt.logs.find(log => {
      try {
        const parsed = factory.interface.parseLog(log);
        return parsed?.name === 'CollectionDeployed';
      } catch {
        return false;
      }
    });
    
    if (deploymentEvent) {
      const parsed = factory.interface.parseLog(deploymentEvent);
      const collectionAddress = parsed.args[0];
      console.log('✅ Sample collection deployed at:', collectionAddress);
      
      // Save deployment info
      const deploymentInfo = {
        network: 'somnia-testnet',
        factoryAddress,
        sampleCollectionAddress: collectionAddress,
        deployedAt: new Date().toISOString(),
        deployer: wallet.address,
        collectionDetails: sampleCollection
      };
      
      const deploymentPath = path.join(__dirname, '../deployments/nft-factory.json');
      fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
      console.log('\n💾 Deployment info saved to:', deploymentPath);
      
      // Display summary
      console.log('\n' + '='.repeat(60));
      console.log('🎉 DEPLOYMENT SUCCESSFUL!');
      console.log('='.repeat(60));
      console.log('\n📋 Summary:');
      console.log('  NFT Factory:', factoryAddress);
      console.log('  Sample Collection:', collectionAddress);
      console.log('  Collection Name:', sampleCollection.name);
      console.log('  Max Supply:', sampleCollection.maxSupply);
      console.log('  Mint Price:', ethers.formatEther(sampleCollection.mintPrice), 'STT');
      console.log('\n🔗 View on Explorer:');
      console.log(`  Factory: https://explorer.somnia.network/address/${factoryAddress}`);
      console.log(`  Collection: https://explorer.somnia.network/address/${collectionAddress}`);
      console.log('\n📝 Next steps:');
      console.log('  1. Run: npm run mint-nft');
      console.log('  2. List NFTs on marketplace');
      console.log('  3. Update frontend to use these contracts');
    }
    
  } catch (error) {
    console.error('\n❌ Deployment failed:', error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });