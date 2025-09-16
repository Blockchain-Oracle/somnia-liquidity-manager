import { NFTStorage, File } from 'nft.storage';
import { create } from 'ipfs-http-client';

// NFT Metadata Standard (OpenSea compatible)
export interface NFTMetadata {
  name: string;
  description: string;
  image: string; // IPFS URI
  external_url?: string;
  animation_url?: string;
  attributes: NFTAttribute[];
  properties?: {
    files?: Array<{
      uri: string;
      type: string;
    }>;
    category?: string;
    creators?: Array<{
      address: string;
      share: number;
    }>;
  };
}

export interface NFTAttribute {
  trait_type: string;
  value: string | number;
  display_type?: 'number' | 'boost_percentage' | 'boost_number' | 'date';
  max_value?: number;
}

export interface CollectionMetadata {
  name: string;
  description: string;
  image: string; // Collection banner
  external_link?: string;
  seller_fee_basis_points: number; // Royalty in basis points
  fee_recipient: string;
}

export interface PreRevealMetadata {
  name: string;
  description: string;
  image: string; // Placeholder image
}

// Collection configuration for deployment
export interface CollectionConfig {
  // Basic Info
  name: string;
  symbol: string;
  description: string;
  
  // Supply & Limits
  maxSupply: number;
  maxPerWallet: number;
  maxPerTransaction: number;
  
  // Royalties
  royaltyFeeBps: number; // Basis points (250 = 2.5%)
  royaltyReceiver: string;
  
  // Images & Metadata
  images: File[]; // Array of image files
  metadata: NFTMetadata[]; // Array of metadata for each NFT
  preRevealImage: File; // Placeholder image
  collectionImage: File; // Collection banner
  
  // Mint Phases
  phases: MintPhaseConfig[];
}

export interface MintPhaseConfig {
  name: string;
  startTime: Date;
  endTime: Date;
  price: string; // In ETH
  maxSupply: number;
  isPublic: boolean;
  whitelist?: string[]; // Array of whitelisted addresses
}

// IPFS Upload Service
export class IPFSService {
  private nftStorage: NFTStorage;
  private ipfs: any;

  constructor(nftStorageApiKey: string) {
    this.nftStorage = new NFTStorage({ token: nftStorageApiKey });
    // Alternative IPFS client for redundancy
    this.ipfs = create({
      host: 'ipfs.infura.io',
      port: 5001,
      protocol: 'https',
    });
  }

  /**
   * Upload single image to IPFS
   */
  async uploadImage(imageFile: File): Promise<string> {
    try {
      const cid = await this.nftStorage.storeBlob(imageFile);
      return `ipfs://${cid}`;
    } catch (error) {
      console.error('NFT.Storage upload failed, trying Infura:', error);
      const result = await this.ipfs.add(imageFile);
      return `ipfs://${result.path}`;
    }
  }

  /**
   * Upload collection images in batch
   */
  async uploadImages(images: File[]): Promise<string[]> {
    const uploadPromises = images.map(img => this.uploadImage(img));
    return Promise.all(uploadPromises);
  }

  /**
   * Upload metadata JSON to IPFS
   */
  async uploadMetadata(metadata: NFTMetadata): Promise<string> {
    const metadataBlob = new Blob([JSON.stringify(metadata)], {
      type: 'application/json',
    });
    const metadataFile = new File([metadataBlob], 'metadata.json');
    
    try {
      const cid = await this.nftStorage.storeBlob(metadataFile);
      return `ipfs://${cid}`;
    } catch (error) {
      console.error('Metadata upload failed:', error);
      const result = await this.ipfs.add(JSON.stringify(metadata));
      return `ipfs://${result.path}`;
    }
  }

  /**
   * Upload entire collection (images + metadata)
   */
  async uploadCollection(config: CollectionConfig): Promise<{
    baseURI: string;
    preRevealURI: string;
    contractURI: string;
  }> {
    console.log('Uploading collection to IPFS...');
    
    // 1. Upload all NFT images
    const imageURIs = await this.uploadImages(config.images);
    
    // 2. Create and upload metadata for each NFT
    const metadataFiles: File[] = [];
    
    for (let i = 0; i < config.metadata.length; i++) {
      const metadata = {
        ...config.metadata[i],
        image: imageURIs[i],
      };
      
      const metadataBlob = new Blob([JSON.stringify(metadata)], {
        type: 'application/json',
      });
      metadataFiles.push(
        new File([metadataBlob], `${i}.json`, { type: 'application/json' })
      );
    }
    
    // 3. Upload all metadata files as a directory
    const metadataCID = await this.nftStorage.storeDirectory(metadataFiles);
    const baseURI = `ipfs://${metadataCID}/`;
    
    // 4. Upload pre-reveal image and metadata
    const preRevealImageURI = await this.uploadImage(config.preRevealImage);
    const preRevealMetadata: PreRevealMetadata = {
      name: 'Unrevealed',
      description: 'This NFT has not been revealed yet',
      image: preRevealImageURI,
    };
    const preRevealURI = await this.uploadMetadata(preRevealMetadata as any);
    
    // 5. Upload collection metadata (for marketplaces)
    const collectionImageURI = await this.uploadImage(config.collectionImage);
    const collectionMetadata: CollectionMetadata = {
      name: config.name,
      description: config.description,
      image: collectionImageURI,
      seller_fee_basis_points: config.royaltyFeeBps,
      fee_recipient: config.royaltyReceiver,
    };
    const contractURI = await this.uploadMetadata(collectionMetadata as any);
    
    console.log('Collection uploaded successfully!');
    console.log('Base URI:', baseURI);
    console.log('Pre-reveal URI:', preRevealURI);
    console.log('Contract URI:', contractURI);
    
    return {
      baseURI,
      preRevealURI,
      contractURI,
    };
  }

  /**
   * Generate provenance hash for collection
   */
  async generateProvenanceHash(images: File[]): Promise<string> {
    const imageBuffers = await Promise.all(
      images.map(img => img.arrayBuffer())
    );
    
    const concatenated = imageBuffers.reduce((acc, buffer) => {
      const tmp = new Uint8Array(acc.length + buffer.byteLength);
      tmp.set(acc, 0);
      tmp.set(new Uint8Array(buffer), acc.length);
      return tmp;
    }, new Uint8Array(0));
    
    const hashBuffer = await crypto.subtle.digest('SHA-256', concatenated);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex;
  }
}

// Merkle Tree for Whitelist
export class WhitelistService {
  /**
   * Generate merkle root from whitelist addresses
   */
  static generateMerkleRoot(addresses: string[]): string {
    // This is a simplified version - in production use merkletreejs
    const leaves = addresses.map(addr => 
      this.keccak256(addr.toLowerCase())
    );
    
    if (leaves.length === 0) return '0x' + '0'.repeat(64);
    
    // Simple merkle tree implementation
    let layer = leaves;
    while (layer.length > 1) {
      const nextLayer = [];
      for (let i = 0; i < layer.length; i += 2) {
        if (i + 1 < layer.length) {
          nextLayer.push(this.keccak256(layer[i] + layer[i + 1].slice(2)));
        } else {
          nextLayer.push(layer[i]);
        }
      }
      layer = nextLayer;
    }
    
    return layer[0];
  }

  /**
   * Generate merkle proof for an address
   */
  static generateMerkleProof(address: string, addresses: string[]): string[] {
    // This would be implemented with merkletreejs in production
    // Returning empty array for now
    return [];
  }

  private static keccak256(data: string): string {
    // In production, use ethers.js keccak256
    // This is a placeholder
    return '0x' + data;
  }
}

// Attribute generator for generative collections
export class AttributeGenerator {
  /**
   * Generate random attributes based on rarity weights
   */
  static generateAttributes(
    traitCategories: TraitCategory[]
  ): NFTAttribute[] {
    const attributes: NFTAttribute[] = [];
    
    for (const category of traitCategories) {
      const trait = this.selectWeightedRandom(category.traits);
      attributes.push({
        trait_type: category.name,
        value: trait.value,
      });
    }
    
    return attributes;
  }

  private static selectWeightedRandom(traits: Trait[]): Trait {
    const totalWeight = traits.reduce((sum, t) => sum + t.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const trait of traits) {
      random -= trait.weight;
      if (random <= 0) return trait;
    }
    
    return traits[traits.length - 1];
  }
}

interface TraitCategory {
  name: string;
  traits: Trait[];
}

interface Trait {
  value: string;
  weight: number; // Higher weight = more common
}

// Price curve calculators
export class PricingStrategy {
  /**
   * Calculate dutch auction price
   */
  static calculateDutchAuctionPrice(
    startPrice: number,
    endPrice: number,
    startTime: number,
    endTime: number,
    currentTime: number
  ): number {
    if (currentTime <= startTime) return startPrice;
    if (currentTime >= endTime) return endPrice;
    
    const elapsed = currentTime - startTime;
    const duration = endTime - startTime;
    const priceDrop = startPrice - endPrice;
    
    return startPrice - (priceDrop * elapsed / duration);
  }

  /**
   * Calculate bonding curve price
   */
  static calculateBondingCurvePrice(
    basePrice: number,
    priceIncrement: number,
    currentSupply: number
  ): number {
    return basePrice + (priceIncrement * currentSupply);
  }
}