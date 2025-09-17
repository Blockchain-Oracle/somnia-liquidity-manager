# NFT Marketplace Deployment - Somnia Testnet

## Overview
This document contains the deployed contract addresses and deployment information for the NFT Marketplace system on Somnia Testnet.

## Network Information
- **Network**: Somnia Testnet
- **Chain ID**: 50312
- **RPC URL**: https://dream-rpc.somnia.network/
- **Explorer**: https://explorer.somnia.network/

## Deployed Contracts

### Core Infrastructure

#### NFT Factory
- **Address**: `0x4bc9106160414c2579F5b7eac06976D9E65730D9`
- **Purpose**: Factory contract for deploying individual NFT contracts
- **Features**: 
  - Deploys MarketplaceNFT contracts
  - Batch deployment support
  - Deployment fee management

#### NFT Marketplace
- **Address**: `0x01Fa8BeB205b428184445e238ecbB8036C90ED01`
- **Purpose**: Escrow-based NFT marketplace
- **Features**:
  - Escrow-based listing system
  - 2.5% platform fee
  - IPFS CID support for metadata
  - Paginated listing queries

### Individual NFT Contracts

All NFTs are part of the "Ethereal Visions" collection, each deployed as a separate contract:

1. **Cosmic Nebula**
   - **Address**: `0x1eE286d1040389B73b028394bD2e9ccCADCe4641`
   - **Symbol**: COSMIC
   - **Artist**: Aurora Chen
   - **Price**: 0.5 STT

2. **Neon Genesis**
   - **Address**: `0x8dEe9DdCe4AF2d6E3f527742d13a6c99259d2202`
   - **Symbol**: NEON
   - **Artist**: Marcus Rivera
   - **Price**: 0.4 STT

3. **Quantum Entanglement**
   - **Address**: `0x583A5CC05324980CD0120a04cf392Cb2309166b7`
   - **Symbol**: QUANTUM
   - **Artist**: Zara Nakamura
   - **Price**: 0.6 STT

4. **Digital Aurora**
   - **Address**: `0x4c3078226F8d97cb320dB76013bAf128a7eC9822`
   - **Symbol**: AURORA
   - **Artist**: Elena Volkov
   - **Price**: 0.45 STT

5. **Liquid Dreams**
   - **Address**: `0x0Cacf56D99994A4ABBaBE24507bf670D6071584B`
   - **Symbol**: DREAM
   - **Artist**: Kai Thompson
   - **Price**: 0.55 STT

## Deployment Process

### 1. Deploy Factory
```bash
npx hardhat run scripts/deploy-factory.js --network somnia
```

### 2. Deploy NFTs
```bash
npx hardhat run scripts/deploy-nfts.js --network somnia
```

### 3. Deploy Marketplace
```bash
npx hardhat run scripts/deploy-marketplace.js --network somnia
```

### 4. List NFTs
```bash
npx hardhat run scripts/list-nfts.js --network somnia
```

## Contract Architecture

### MarketplaceNFT.sol
Individual NFT contracts with:
- Single token per contract
- IPFS CID storage
- Creator attribution
- Automatic token minting on deployment

### MarketplaceNFTFactory.sol
Factory pattern for deploying NFTs:
- Batch deployment capability
- Deployment fee collection
- NFT registry maintenance

### SommiaNFTMarketplace.sol
Escrow-based marketplace with:
- NFT escrow requirement before listing
- Configurable platform fees (currently 2.5%)
- Listing management (create, update, cancel)
- Purchase with automatic escrow release

## Key Features

1. **Escrow Model**: NFTs must be transferred to the marketplace before listing
2. **Individual Contracts**: Each NFT is its own contract with unique address
3. **IPFS Integration**: Metadata stored on IPFS with CIDs
4. **Gas Optimization**: Paginated queries and efficient storage patterns

## Verification Commands

To verify contracts on Somnia Explorer:

```bash
# Verify Factory
npx hardhat verify --network somnia 0x4bc9106160414c2579F5b7eac06976D9E65730D9

# Verify Marketplace
npx hardhat verify --network somnia 0x01Fa8BeB205b428184445e238ecbB8036C90ED01 "0xC6969eC3C5dFE5A8eCe77ECee940BC52883602E6"

# Verify NFTs (example for Cosmic Nebula)
npx hardhat verify --network somnia 0x1eE286d1040389B73b028394bD2e9ccCADCe4641
```

## Deployment Files

All deployment data is stored in:
- `/deployments/factory-address.json` - Factory contract address
- `/deployments/nft-addresses.json` - Individual NFT contract addresses
- `/deployments/marketplace-address.json` - Marketplace contract address
- `/deployments/listings.json` - Active NFT listings

## Updated Configurations

The following configuration files have been updated with the new addresses:

1. **Frontend**:
   - `/app/contracts/page.tsx` - Contract addresses display page
   - `/lib/constants/contracts.ts` - Contract constants for frontend
   - `/lib/constants/marketplace.ts` - Marketplace address constant

2. **Backend**:
   - `/lib/services/marketplace.service.ts` - Marketplace service configuration
   - `/lib/services/nft.service.ts` - NFT service configuration

## Testing

To interact with the deployed contracts:

1. **View Marketplace**: https://explorer.somnia.network/address/0x01Fa8BeB205b428184445e238ecbB8036C90ED01
2. **View NFTs**: Check individual NFT addresses on the explorer
3. **Frontend**: Access the marketplace UI to browse and purchase NFTs

## Notes

- All NFTs are currently listed on the marketplace
- Platform fee is set to 2.5% (250 basis points)
- Deployment account: `0xC6969eC3C5dFE5A8eCe77ECee940BC52883602E6`
- Deployment timestamp: 2025-01-17