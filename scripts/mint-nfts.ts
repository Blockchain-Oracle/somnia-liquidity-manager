/**
 * NFT Minting Script
 * Deploy NFT collections and mint NFTs using the factory contract
 */

import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { DEPLOYED_ADDRESSES } from '../lib/constants/deployments';

// Contract ABIs
const FACTORY_ABI = [
  {
    "inputs": [
      { "internalType": "string", "name": "_name", "type": "string" },
      { "internalType": "string", "name": "_symbol", "type": "string" },
      { "internalType": "string", "name": "_collectionCID", "type": "string" },
      { "internalType": "uint256", "name": "_maxSupply", "type": "uint256" },
      { "internalType": "uint256", "name": "_mintPrice", "type": "uint256" }
    ],
    "name": "deployCollection",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "deploymentFee",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "collection", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "creator", "type": "address" },
      { "indexed": false, "internalType": "string", "name": "name", "type": "string" },
      { "indexed": false, "internalType": "string", "name": "symbol", "type": "string" },
      { "indexed": false, "internalType": "uint256", "name": "maxSupply", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "mintPrice", "type": "uint256" }
    ],
    "name": "CollectionDeployed",
    "type": "event"
  }
];

const NFT_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "to", "type": "address" },
      { "internalType": "string", "name": "cid", "type": "string" }
    ],
    "name": "mint",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "to", "type": "address" },
      { "internalType": "string[]", "name": "cids", "type": "string[]" }
    ],
    "name": "batchMint",
    "outputs": [{ "internalType": "uint256[]", "name": "", "type": "uint256[]" }],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "mintPrice",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "maxSupply",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "to", "type": "address" },
      { "indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256" },
      { "indexed": false, "internalType": "string", "name": "cid", "type": "string" }
    ],
    "name": "NFTMinted",
    "type": "event"
  }
];

interface CollectionDeployment {
  name: string;
  symbol: string;
  collectionCID: string;
  maxSupply: number;
  mintPrice: string; // in ETH
  nftCIDs: string[];
}

interface DeploymentResult {
  collectionAddress: string;
  transactionHash: string;
  mintedTokenIds: number[];
  totalMinted: number;
  timestamp: string;
}

export class NFTMinter {
  private provider: ethers.Provider;
  private signer: ethers.Signer;
  private factoryContract: ethers.Contract;

  constructor(privateKey?: string) {
    // Setup provider
    this.provider = new ethers.JsonRpcProvider('https://dream-rpc.somnia.network/');
    
    // Setup signer
    const pk = privateKey || process.env.PRIVATE_KEY || 'bad2ecf2b8778c5611d27706a8289f1e9bdc028c049cbac22656ed2e82bf9df1';
    const wallet = new ethers.Wallet(pk);
    this.signer = wallet.connect(this.provider);
    
    // Setup factory contract
    this.factoryContract = new ethers.Contract(
      DEPLOYED_ADDRESSES.factory,
      FACTORY_ABI,
      this.signer
    );
  }

  /**
   * Deploy a new NFT collection
   */
  async deployCollection(collection: CollectionDeployment): Promise<string> {
    try {
      console.log('\n📝 Deploying NFT Collection...');
      console.log(`  Name: ${collection.name}`);
      console.log(`  Symbol: ${collection.symbol}`);
      console.log(`  Max Supply: ${collection.maxSupply}`);
      console.log(`  Mint Price: ${collection.mintPrice} STT`);
      
      // Get deployment fee
      const deploymentFee = await this.factoryContract.deploymentFee();
      console.log(`  Deployment Fee: ${ethers.formatEther(deploymentFee)} STT`);
      
      // Convert mint price to wei
      const mintPriceWei = ethers.parseEther(collection.mintPrice);
      
      // Deploy collection
      const tx = await this.factoryContract.deployCollection(
        collection.name,
        collection.symbol,
        collection.collectionCID,
        collection.maxSupply,
        mintPriceWei,
        { value: deploymentFee }
      );
      
      console.log(`  Transaction: ${tx.hash}`);
      console.log('  ⏳ Waiting for confirmation...');
      
      const receipt = await tx.wait();
      console.log(`  ✅ Confirmed in block ${receipt.blockNumber}`);
      
      // Get collection address from events
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = this.factoryContract.interface.parseLog(log);
          return parsed?.name === 'CollectionDeployed';
        } catch {
          return false;
        }
      });
      
      if (!event) {
        throw new Error('CollectionDeployed event not found');
      }
      
      const parsedEvent = this.factoryContract.interface.parseLog(event);
      const collectionAddress = parsedEvent?.args.collection;
      
      console.log(`  🎨 Collection deployed at: ${collectionAddress}`);
      console.log(`  🌐 View on explorer: ${DEPLOYED_ADDRESSES.deploymentTime ? 'https://shannon-explorer.somnia.network/address/' : ''}${collectionAddress}`);
      
      return collectionAddress;
    } catch (error) {
      console.error('❌ Error deploying collection:', error);
      throw error;
    }
  }

  /**
   * Mint NFTs to a collection
   */
  async mintNFTs(
    collectionAddress: string,
    recipientAddress: string,
    cids: string[]
  ): Promise<number[]> {
    try {
      console.log('\n🎨 Minting NFTs...');
      console.log(`  Collection: ${collectionAddress}`);
      console.log(`  Recipient: ${recipientAddress}`);
      console.log(`  NFTs to mint: ${cids.length}`);
      
      // Create NFT contract instance
      const nftContract = new ethers.Contract(
        collectionAddress,
        NFT_ABI,
        this.signer
      );
      
      // Get mint price
      const mintPrice = await nftContract.mintPrice();
      console.log(`  Mint price per NFT: ${ethers.formatEther(mintPrice)} STT`);
      
      const tokenIds: number[] = [];
      
      if (cids.length === 1) {
        // Single mint
        const totalCost = mintPrice;
        console.log(`  Total cost: ${ethers.formatEther(totalCost)} STT`);
        
        const tx = await nftContract.mint(recipientAddress, cids[0], { value: totalCost });
        console.log(`  Transaction: ${tx.hash}`);
        console.log('  ⏳ Waiting for confirmation...');
        
        const receipt = await tx.wait();
        console.log(`  ✅ Confirmed in block ${receipt.blockNumber}`);
        
        // Get token ID from event
        const mintEvent = receipt.logs.find((log: any) => {
          try {
            const parsed = nftContract.interface.parseLog(log);
            return parsed?.name === 'NFTMinted';
          } catch {
            return false;
          }
        });
        
        if (mintEvent) {
          const parsed = nftContract.interface.parseLog(mintEvent);
          tokenIds.push(Number(parsed?.args.tokenId));
        }
      } else {
        // Batch mint
        const totalCost = mintPrice * BigInt(cids.length);
        console.log(`  Total cost: ${ethers.formatEther(totalCost)} STT`);
        
        const tx = await nftContract.batchMint(recipientAddress, cids, { value: totalCost });
        console.log(`  Transaction: ${tx.hash}`);
        console.log('  ⏳ Waiting for confirmation...');
        
        const receipt = await tx.wait();
        console.log(`  ✅ Confirmed in block ${receipt.blockNumber}`);
        
        // Get token IDs from events
        receipt.logs.forEach((log: any) => {
          try {
            const parsed = nftContract.interface.parseLog(log);
            if (parsed?.name === 'NFTMinted') {
              tokenIds.push(Number(parsed.args.tokenId));
            }
          } catch {
            // Ignore non-NFTMinted events
          }
        });
      }
      
      console.log(`  🎉 Minted ${tokenIds.length} NFTs`);
      tokenIds.forEach((id, index) => {
        console.log(`    Token #${id}: ipfs://${cids[index]}`);
      });
      
      // Get total supply
      const totalSupply = await nftContract.totalSupply();
      console.log(`  📊 Total supply: ${totalSupply.toString()}`);
      
      return tokenIds;
    } catch (error) {
      console.error('❌ Error minting NFTs:', error);
      throw error;
    }
  }

  /**
   * Deploy and mint complete collection
   */
  async deployAndMintCollection(
    collection: CollectionDeployment,
    recipientAddress?: string
  ): Promise<DeploymentResult> {
    try {
      const recipient = recipientAddress || await this.signer.getAddress();
      
      console.log('\n🚀 Starting full deployment and minting process...');
      console.log(`  Deployer: ${await this.signer.getAddress()}`);
      console.log(`  Recipient: ${recipient}`);
      
      // Deploy collection
      const collectionAddress = await this.deployCollection(collection);
      
      // Mint NFTs
      const tokenIds = await this.mintNFTs(
        collectionAddress,
        recipient,
        collection.nftCIDs
      );
      
      // Save result
      const result: DeploymentResult = {
        collectionAddress,
        transactionHash: '', // Would need to track this
        mintedTokenIds: tokenIds,
        totalMinted: tokenIds.length,
        timestamp: new Date().toISOString()
      };
      
      // Save to file
      const deploymentsDir = path.join(process.cwd(), 'deployments');
      if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir, { recursive: true });
      }
      
      const filename = `${collection.symbol.toLowerCase()}-${Date.now()}.json`;
      const filepath = path.join(deploymentsDir, filename);
      fs.writeFileSync(filepath, JSON.stringify({
        collection,
        result
      }, null, 2));
      
      console.log(`\n💾 Deployment saved to: ${filepath}`);
      
      return result;
    } catch (error) {
      console.error('❌ Error in deployment process:', error);
      throw error;
    }
  }
}

/**
 * Load upload results and deploy collection
 */
export async function deployFromUploadResults(uploadFilePath: string): Promise<DeploymentResult> {
  try {
    // Load upload results
    const uploadData = JSON.parse(fs.readFileSync(uploadFilePath, 'utf-8'));
    
    if (!uploadData.collectionCID || !uploadData.nftCIDs) {
      throw new Error('Invalid upload file format');
    }
    
    // Extract collection name from metadata
    const collectionName = uploadData.metadata[0]?.name?.split('#')[0]?.trim() || 'NFT Collection';
    
    // Create collection deployment config
    const collection: CollectionDeployment = {
      name: collectionName,
      symbol: collectionName.split(' ').map((w: string) => w[0]).join('').toUpperCase(),
      collectionCID: uploadData.collectionCID,
      maxSupply: 100,
      mintPrice: '0.01', // 0.01 STT
      nftCIDs: uploadData.nftCIDs
    };
    
    // Deploy and mint
    const minter = new NFTMinter();
    return await minter.deployAndMintCollection(collection);
  } catch (error) {
    console.error('❌ Error deploying from upload results:', error);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    const args = process.argv.slice(2);
    const command = args[0];
    
    const minter = new NFTMinter();
    
    if (command === 'deploy-from-file') {
      // Deploy from upload results file
      const filePath = args[1];
      if (!filePath) {
        console.error('❌ Please provide path to upload results file');
        process.exit(1);
      }
      
      await deployFromUploadResults(filePath);
    } else {
      // Deploy sample collection
      console.log('🎨 Deploying sample NFT collection...');
      
      const collection: CollectionDeployment = {
        name: 'Somnia Sample Collection',
        symbol: 'SSC',
        collectionCID: 'QmSampleCollectionCID',
        maxSupply: 100,
        mintPrice: '0.001',
        nftCIDs: [
          'QmSampleNFT1',
          'QmSampleNFT2',
          'QmSampleNFT3'
        ]
      };
      
      await minter.deployAndMintCollection(collection);
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

export { deployFromUploadResults as deployNFTCollection };