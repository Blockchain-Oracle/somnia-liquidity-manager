import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const deploymentPaths = {
      marketplace: path.join(process.cwd(), 'deployments/marketplace-testnet.json'),
      nftFactory: path.join(process.cwd(), 'deployments/nft-factory.json'),
      mintedNfts: path.join(process.cwd(), 'deployments/minted-nfts.json')
    };
    
    const deployments: any = {};
    
    // Load marketplace deployment
    if (fs.existsSync(deploymentPaths.marketplace)) {
      const marketplaceData = JSON.parse(fs.readFileSync(deploymentPaths.marketplace, 'utf8'));
      deployments.marketplace = marketplaceData.contractAddress;
    }
    
    // Load NFT factory deployment
    if (fs.existsSync(deploymentPaths.nftFactory)) {
      const factoryData = JSON.parse(fs.readFileSync(deploymentPaths.nftFactory, 'utf8'));
      deployments.nftFactory = factoryData.factoryAddress;
      deployments.sampleCollection = factoryData.sampleCollectionAddress;
    }
    
    // Load minted NFTs
    if (fs.existsSync(deploymentPaths.mintedNfts)) {
      const mintedData = JSON.parse(fs.readFileSync(deploymentPaths.mintedNfts, 'utf8'));
      deployments.mintedNfts = mintedData.nfts;
    }
    
    return NextResponse.json(deployments);
  } catch (error) {
    console.error('Failed to load deployments:', error);
    return NextResponse.json({}, { status: 200 });
  }
}