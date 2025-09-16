# NFT Collection Creation Guide

Complete guide for creating, minting, and listing NFT collections on Somnia Network.

## Prerequisites

1. **Pinata Account**: Sign up at [Pinata](https://app.pinata.cloud) and get your JWT token
2. **Somnia Testnet STT**: Get test tokens from the faucet
3. **Environment Setup**: Configure your `.env.local` file

## Environment Configuration

Add these to your `.env.local` file:

```env
# Pinata Configuration (Required)
PINATA_JWT=your_pinata_jwt_token_here
PINATA_GATEWAY=your-gateway.mypinata.cloud

# Private Key (Optional - uses default test key if not provided)
PRIVATE_KEY=your_private_key_here

# Optional
WALLET_ADDRESS=your_wallet_address
```

## Quick Start

### One-Command Collection Creation

Create a complete NFT collection with a single command:

```bash
# Create a premium collection (10 NFTs)
pnpm nft:create premium

# Create an abstract art collection (5 NFTs)
pnpm nft:create abstract

# Create a nature collection (5 NFTs)
pnpm nft:create nature

# Create a cyberpunk collection (5 NFTs)
pnpm nft:create cyberpunk

# Create a diverse collection (12 NFTs)
pnpm nft:create diverse
```

### Custom Collection

```bash
pnpm nft:create custom "My Collection" "MYC" "Description" 10 0.001 100
# Parameters: name, symbol, description, size, mintPrice, maxSupply
```

## Step-by-Step Process

If you want to run each step individually:

### 1. Generate NFT Metadata

```bash
# Generate metadata with Unsplash images
pnpm nft:generate
```

This creates NFT metadata with:
- High-quality images from Unsplash
- Random attributes and traits
- Rarity scores

### 2. Upload to IPFS

```bash
# Upload metadata to Pinata/IPFS
pnpm nft:upload premium  # or 'all', 'diverse', 'custom'
```

Returns:
- Collection CID
- Individual NFT CIDs
- Saves results to `uploads/` directory

### 3. Mint NFTs

```bash
# Deploy collection and mint NFTs
pnpm nft:mint deploy-from-file uploads/your-file.json

# Or mint to existing collection
pnpm nft:mint
```

This will:
- Deploy a new NFT collection contract via the factory
- Mint all NFTs to your wallet
- Save deployment info to `deployments/` directory

### 4. List on Marketplace

```bash
# List a single NFT
pnpm nft:list list [nftContract] [tokenId] [price] [cid]

# Batch list multiple NFTs
pnpm nft:list batch [nftContract] [startTokenId] [count] [basePrice]

# View your listings
pnpm nft:list view [sellerAddress]

# Cancel a listing
pnpm nft:list cancel [listingId]

# Update listing price
pnpm nft:list update [listingId] [newPrice]
```

## Collection Types

### Premium Collection
- **Name**: Somnia Genesis
- **Size**: 10 NFTs
- **Type**: Curated luxury artwork
- **Price Range**: 1-10 STT

### Abstract Collection
- **Name**: Abstract Dreams
- **Size**: 5 NFTs
- **Type**: Geometric and fluid abstract art
- **Price Range**: 0.1-0.3 STT

### Nature Collection
- **Name**: Nature's Wonders
- **Size**: 5 NFTs
- **Type**: Landscapes and natural beauty
- **Price Range**: 0.08-0.22 STT

### Cyberpunk Collection
- **Name**: Neon Dreams
- **Size**: 5 NFTs
- **Type**: Futuristic neon cityscapes
- **Price Range**: 0.15-0.35 STT

### Diverse Collection
- **Name**: Somnia Showcase
- **Size**: 12 NFTs
- **Type**: Mixed themes and styles
- **Price**: Dynamic pricing

## Contract Addresses

```typescript
// Deployed on Somnia Testnet
const CONTRACTS = {
  factory: "0x4bc9106160414c2579F5b7eac06976D9E65730D9",
  marketplace: "0xF308d971F3dbCd32135Cd3e823603aeE010A6b53",
  sampleNFT: "0xe494Fd4B0A34c2824F09BC01a8Ae3bA50F52b922"
}
```

## File Structure

```
project/
├── scripts/
│   ├── generate-nft-metadata.ts    # Metadata generation
│   ├── upload-metadata.ts          # IPFS upload
│   ├── mint-nfts.ts                # NFT minting
│   ├── list-on-marketplace.ts      # Marketplace listing
│   └── create-nft-collection.ts    # Master orchestrator
├── lib/services/
│   └── pinata.service.ts           # Pinata/IPFS service
├── uploads/                        # Upload results (auto-created)
├── deployments/                    # Deployment results (auto-created)
└── nft-collections/               # Collection results (auto-created)
```

## Features

### Metadata Generation
- ✅ Unsplash integration for high-quality images
- ✅ Automatic attribute generation
- ✅ Rarity scoring system
- ✅ Multiple collection themes

### IPFS Upload
- ✅ Batch upload support
- ✅ Collection metadata
- ✅ Individual NFT metadata
- ✅ Gateway URL generation

### Smart Contract Integration
- ✅ Factory pattern deployment
- ✅ Batch minting
- ✅ Ownership management
- ✅ ERC721 compliant

### Marketplace Features
- ✅ Batch listing
- ✅ Price updates
- ✅ Listing cancellation
- ✅ Fee management

## Troubleshooting

### Common Issues

1. **Missing Pinata JWT**
   - Sign up at [Pinata](https://app.pinata.cloud)
   - Create an API key with Admin privileges
   - Add JWT to `.env.local`

2. **Insufficient STT Balance**
   - Get test STT from Somnia faucet
   - Ensure wallet has enough for gas fees

3. **Transaction Failures**
   - Check network connection
   - Verify contract addresses
   - Ensure proper approvals

4. **Image Loading Issues**
   - Unsplash API is free but rate-limited
   - Images are loaded directly from URLs
   - No need to upload images to Pinata

## Example Workflow

```bash
# 1. Set up environment
echo "PINATA_JWT=your_jwt_here" >> .env.local

# 2. Create a premium collection (all-in-one)
pnpm nft:create premium

# Output:
# - Generates 10 premium NFTs with metadata
# - Uploads to IPFS via Pinata
# - Deploys collection contract
# - Mints all NFTs
# - Lists on marketplace
# - Saves all results
```

## Advanced Usage

### Custom Metadata Generation

```typescript
import { generateSingleNFTMetadata } from './scripts/generate-nft-metadata';

const metadata = generateSingleNFTMetadata('abstract', 0, 'Custom Name');
```

### Direct Service Usage

```typescript
import { pinataService } from './lib/services/pinata.service';
import { NFTMinter } from './scripts/mint-nfts';

// Upload custom metadata
const cid = await pinataService.uploadNFTMetadata({
  name: 'My NFT',
  description: 'Custom NFT',
  image: 'https://example.com/image.jpg',
  attributes: []
});

// Mint directly
const minter = new NFTMinter();
await minter.mintNFTs(collectionAddress, recipientAddress, [cid]);
```

## Support

For issues or questions:
- Check deployed contracts on [Somnia Explorer](https://shannon-explorer.somnia.network)
- Review transaction history
- Check Pinata dashboard for uploaded content

## Next Steps

After creating your collection:
1. View on marketplace UI
2. Share collection link
3. Monitor sales activity
4. Collect royalties
5. Create additional collections

Happy minting! 🎨