/**
 * Pinata Service for IPFS Operations
 * Handles uploading and retrieving content from Pinata/IPFS
 */

import { PinataSDK } from 'pinata';

export interface NFTMetadata {
  name: string;
  description: string;
  image: string; // Can be URL or IPFS CID
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
  external_url?: string;
}

export interface CollectionMetadata {
  name: string;
  description: string;
  image: string;
  banner_image?: string;
  external_link?: string;
  seller_fee_basis_points?: number;
  fee_recipient?: string;
}

export class PinataService {
  private pinata: PinataSDK;
  private gateway: string;

  constructor() {
    const jwt = process.env.PINATA_JWT || process.env.NEXT_PUBLIC_PINATA_JWT;
    const gateway = process.env.PINATA_GATEWAY || process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'cyan-faithful-peafowl-351.mypinata.cloud';

    if (!jwt) {
      throw new Error('PINATA_JWT environment variable is required');
    }

    this.pinata = new PinataSDK({
      pinataJwt: jwt,
      pinataGateway: gateway,
    });
    
    this.gateway = gateway;
  }

  /**
   * Upload NFT metadata to IPFS
   */
  async uploadNFTMetadata(metadata: NFTMetadata): Promise<string> {
    try {
      // Create JSON blob
      const blob = new Blob([JSON.stringify(metadata, null, 2)], {
        type: 'application/json',
      });
      
      // Create file from blob
      const file = new File([blob], `${metadata.name}.json`, {
        type: 'application/json',
      });

      // Upload to Pinata (use the correct API method)
      const upload = await this.pinata.upload.public.file(file);
      
      console.log('NFT Metadata uploaded:', {
        name: metadata.name,
        cid: upload.cid,
      });

      return upload.cid;
    } catch (error) {
      console.error('Error uploading NFT metadata:', error);
      throw error;
    }
  }

  /**
   * Upload collection metadata to IPFS
   */
  async uploadCollectionMetadata(metadata: CollectionMetadata): Promise<string> {
    try {
      const blob = new Blob([JSON.stringify(metadata, null, 2)], {
        type: 'application/json',
      });
      
      const file = new File([blob], 'collection.json', {
        type: 'application/json',
      });

      const upload = await this.pinata.upload.public.file(file);
      
      console.log('Collection metadata uploaded:', {
        name: metadata.name,
        cid: upload.cid,
      });

      return upload.cid;
    } catch (error) {
      console.error('Error uploading collection metadata:', error);
      throw error;
    }
  }

  /**
   * Batch upload NFT metadata
   */
  async batchUploadNFTMetadata(metadataArray: NFTMetadata[]): Promise<string[]> {
    try {
      const cids: string[] = [];

      for (const metadata of metadataArray) {
        const cid = await this.uploadNFTMetadata(metadata);
        cids.push(cid);
      }

      return cids;
    } catch (error) {
      console.error('Error in batch upload:', error);
      throw error;
    }
  }

  /**
   * Get gateway URL for CID
   */
  getGatewayUrl(cid: string): string {
    return `https://${this.gateway}/ipfs/${cid}`;
  }

  /**
   * Get metadata from IPFS
   */
  async getMetadata(cid: string): Promise<any> {
    try {
      const data = await this.pinata.gateways.public.get(cid);
      return data;
    } catch (error) {
      console.error('Error fetching metadata:', error);
      throw error;
    }
  }

  /**
   * Upload image file to IPFS
   */
  async uploadImage(imageFile: File): Promise<string> {
    try {
      const upload = await this.pinata.upload.public.file(imageFile);
      
      console.log('Image uploaded:', {
        name: imageFile.name,
        cid: upload.cid,
      });

      return upload.cid;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  /**
   * Upload image from URL (downloads and uploads)
   */
  async uploadImageFromUrl(url: string, filename: string): Promise<string> {
    try {
      // Fetch image from URL
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);
      
      const blob = await response.blob();
      const file = new File([blob], filename, { type: blob.type });
      
      return await this.uploadImage(file);
    } catch (error) {
      console.error('Error uploading image from URL:', error);
      throw error;
    }
  }
}

// Export singleton instance (create on first use)
let _pinataService: PinataService | null = null;

export const getPinataService = () => {
  if (!_pinataService) {
    _pinataService = new PinataService();
  }
  return _pinataService;
};

// For backward compatibility
export const pinataService = {
  uploadNFTMetadata: (metadata: NFTMetadata) => getPinataService().uploadNFTMetadata(metadata),
  uploadCollectionMetadata: (metadata: CollectionMetadata) => getPinataService().uploadCollectionMetadata(metadata),
  batchUploadNFTMetadata: (metadataArray: NFTMetadata[]) => getPinataService().batchUploadNFTMetadata(metadataArray),
  getGatewayUrl: (cid: string) => getPinataService().getGatewayUrl(cid),
  getMetadata: (cid: string) => getPinataService().getMetadata(cid),
  uploadImage: (imageFile: File) => getPinataService().uploadImage(imageFile),
  uploadImageFromUrl: (url: string, filename: string) => getPinataService().uploadImageFromUrl(url, filename),
};