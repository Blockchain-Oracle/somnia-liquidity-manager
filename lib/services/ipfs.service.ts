import { pinata } from '@/utils/pinata-config';

/**
 * IPFS Service for NFT marketplace
 * Returns just the CID (not full URL) for contract storage
 */
export class IPFSService {
  /**
   * Upload image to IPFS and return just the CID
   * @param file Image file to upload
   * @returns IPFS CID (e.g., "QmXxx...")
   */
  static async uploadImage(file: File): Promise<string> {
    try {
      // Check if Pinata is configured
      if (!process.env.PINATA_JWT) {
        throw new Error('PINATA_JWT is required for IPFS uploads');
      }

      // Upload to Pinata
      const result = await pinata.upload.public.file(file);
      
      // Return just the CID (not ipfs:// or https://)
      return result.cid;
    } catch (error) {
      console.error('Failed to upload to IPFS:', error);
      throw new Error('IPFS upload failed');
    }
  }

  /**
   * Upload JSON metadata to IPFS
   * @param metadata Object to upload as JSON
   * @returns IPFS CID
   */
  static async uploadJSON(metadata: any): Promise<string> {
    try {
      if (!process.env.PINATA_JWT) {
        throw new Error('PINATA_JWT is required for IPFS uploads');
      }

      const result = await pinata.upload.public.json(metadata);
      return result.cid;
    } catch (error) {
      console.error('Failed to upload JSON to IPFS:', error);
      throw new Error('IPFS upload failed');
    }
  }

  /**
   * Upload image from URL (for demo/testing)
   * @param url Image URL
   * @returns IPFS CID
   */
  static async uploadFromURL(url: string): Promise<string> {
    try {
      if (!process.env.PINATA_JWT) {
        throw new Error('PINATA_JWT is required for IPFS uploads');
      }

      // Fetch image from URL
      const response = await fetch(url);
      const blob = await response.blob();
      const file = new File([blob], 'image.jpg', { type: blob.type });
      
      return this.uploadImage(file);
    } catch (error) {
      console.error('Failed to upload from URL:', error);
      throw new Error('Failed to upload image from URL');
    }
  }

  /**
   * Convert CID to gateway URL for display
   * @param cid IPFS CID
   * @returns Full gateway URL
   */
  static getGatewayURL(cid: string): string {
    // Handle different CID formats
    if (cid.startsWith('http')) {
      return cid; // Already a URL
    }
    if (cid.startsWith('ipfs://')) {
      cid = cid.replace('ipfs://', '');
    }
    
    // Use Pinata gateway if configured, otherwise use public gateway
    const gateway = process.env.NEXT_PUBLIC_GATEWAY_URL || 'https://ipfs.io/ipfs';
    return `${gateway}/${cid}`;
  }

  /**
   * Extract just the CID from various formats
   * @param input IPFS URL or CID
   * @returns Just the CID
   */
  static extractCID(input: string): string {
    // Already just a CID
    if (input.startsWith('Qm') || input.startsWith('bafy')) {
      return input;
    }
    
    // Extract from ipfs:// URL
    if (input.startsWith('ipfs://')) {
      return input.replace('ipfs://', '');
    }
    
    // Extract from HTTP gateway URL
    const match = input.match(/\/ipfs\/([A-Za-z0-9]+)/);
    if (match) {
      return match[1];
    }
    
    // If all else fails, return as is
    return input;
  }

  /**
   * Create NFT metadata object
   * @param name NFT name
   * @param description NFT description
   * @param imageCID Image CID (just the CID, not URL)
   * @param attributes NFT attributes
   * @returns Metadata object
   */
  static createMetadata(
    name: string,
    description: string,
    imageCID: string,
    attributes: Array<{ trait_type: string; value: string | number }> = []
  ) {
    return {
      name,
      description,
      image: `ipfs://${imageCID}`, // OpenSea standard format
      attributes,
      properties: {
        category: 'image',
        files: [{
          uri: `ipfs://${imageCID}`,
          type: 'image/*'
        }]
      }
    };
  }

  /**
   * Upload complete NFT (image + metadata)
   * @param name NFT name
   * @param description NFT description
   * @param imageFile Image file
   * @param attributes NFT attributes
   * @returns Object with imageCID and metadataCID
   */
  static async uploadNFT(
    name: string,
    description: string,
    imageFile: File,
    attributes: Array<{ trait_type: string; value: string | number }> = []
  ): Promise<{ imageCID: string; metadataCID: string }> {
    try {
      // Upload image first
      const imageCID = await this.uploadImage(imageFile);
      
      // Create and upload metadata
      const metadata = this.createMetadata(name, description, imageCID, attributes);
      const metadataCID = await this.uploadJSON(metadata);
      
      return {
        imageCID,
        metadataCID
      };
    } catch (error) {
      console.error('Failed to upload NFT:', error);
      throw new Error('Failed to upload NFT');
    }
  }
}

export default IPFSService;