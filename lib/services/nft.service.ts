import { ethers } from 'ethers';
import { IPFSService } from './ipfs.service';
import { MARKETPLACE_ADDRESS } from '@/lib/constants/marketplace';

// Standard ERC721 ABI for reading NFT data
const ERC721_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function getApproved(uint256 tokenId) view returns (address)',
  'function isApprovedForAll(address owner, address operator) view returns (bool)',
  'function balanceOf(address owner) view returns (uint256)',
  'function approve(address to, uint256 tokenId)',
  'function setApprovalForAll(address operator, bool approved)',
  'function safeTransferFrom(address from, address to, uint256 tokenId)',
  'function safeTransferFrom(address from, address to, uint256 tokenId, bytes data)',
];

export interface NFTMetadata {
  name?: string;
  description?: string;
  image?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
    display_type?: string;
  }>;
  properties?: any;
}

export interface NFTInfo {
  contractAddress: string;
  tokenId: string;
  name: string;
  symbol: string;
  owner: string;
  tokenURI: string;
  metadata?: NFTMetadata;
  imageUrl?: string;
  cid?: string;
  isApproved?: boolean;
  isApprovedForAll?: boolean;
}

export class NFTService {
  private provider: ethers.Provider;
  private signer?: ethers.Signer;

  constructor(signerOrProvider?: ethers.Signer | ethers.Provider) {
    if (!signerOrProvider) {
      // Default to read-only provider
      this.provider = new ethers.JsonRpcProvider('https://dream-rpc.somnia.network/');
    } else if ('getAddress' in signerOrProvider) {
      // It's a signer
      this.signer = signerOrProvider as ethers.Signer;
      this.provider = this.signer.provider!;
    } else {
      // It's a provider
      this.provider = signerOrProvider;
    }
  }

  /**
   * Fetch NFT information including metadata
   */
  async getNFTInfo(contractAddress: string, tokenId: string): Promise<NFTInfo> {
    try {
      // Try to use existing provider first, but create fallback if needed
      let provider = this.provider;
      let contract = new ethers.Contract(contractAddress, ERC721_ABI, provider);
      
      // Fetch basic info with fallback on circuit breaker error
      let name, symbol, owner, tokenURI;
      try {
        [name, symbol, owner, tokenURI] = await Promise.all([
          contract.name().catch(() => 'Unknown Collection'),
          contract.symbol().catch(() => 'UNKNOWN'),
          contract.ownerOf(tokenId),
          contract.tokenURI(tokenId).catch(() => ''),
        ]);
      } catch (error: any) {
        console.log('Primary provider failed, trying fallback RPC...', error.message);
        
        // If circuit breaker error, try with a fresh provider
        if (error.message?.includes('circuit breaker') || error.message?.includes('Block tracker destroyed')) {
          provider = new ethers.JsonRpcProvider('https://dream-rpc.somnia.network/');
          contract = new ethers.Contract(contractAddress, ERC721_ABI, provider);
          
          // Retry with direct RPC
          [name, symbol, owner, tokenURI] = await Promise.all([
            contract.name().catch(() => 'Unknown Collection'),
            contract.symbol().catch(() => 'UNKNOWN'),
            contract.ownerOf(tokenId),
            contract.tokenURI(tokenId).catch(() => ''),
          ]);
        } else {
          throw error;
        }
      }

      let metadata: NFTMetadata | undefined;
      let imageUrl: string | undefined;
      let cid: string | undefined;

      if (tokenURI) {
        // Extract CID from tokenURI if it's an IPFS URI
        if (tokenURI.startsWith('ipfs://')) {
          cid = IPFSService.extractCID(tokenURI);
        } else if (tokenURI.includes('/ipfs/')) {
          cid = IPFSService.extractCID(tokenURI);
        }

        // Fetch metadata
        try {
          const metadataUrl = this.convertToHttpUrl(tokenURI);
          const response = await fetch(metadataUrl);
          if (response.ok) {
            metadata = await response.json();
            
            // Get image URL
            if (metadata.image) {
              imageUrl = this.convertToHttpUrl(metadata.image);
              // Extract CID from image if we don't have one yet
              if (!cid && (metadata.image.startsWith('ipfs://') || metadata.image.includes('/ipfs/'))) {
                cid = IPFSService.extractCID(metadata.image);
              }
            }
          }
        } catch (error) {
          console.warn('Failed to fetch NFT metadata:', error);
        }
      }

      // Check approval status if we have a signer
      let isApproved = false;
      let isApprovedForAll = false;
      
      if (this.signer) {
        const signerAddress = await this.signer.getAddress();
        
        try {
          const [approved, approvedForAll] = await Promise.all([
            contract.getApproved(tokenId),
            contract.isApprovedForAll(owner, MARKETPLACE_ADDRESS),
          ]);
          
          isApproved = approved.toLowerCase() === MARKETPLACE_ADDRESS.toLowerCase();
          isApprovedForAll = approvedForAll;
        } catch (error) {
          console.warn('Failed to check approval status:', error);
        }
      }

      return {
        contractAddress,
        tokenId,
        name,
        symbol,
        owner,
        tokenURI,
        metadata,
        imageUrl,
        cid,
        isApproved: isApproved || isApprovedForAll,
        isApprovedForAll,
      };
    } catch (error) {
      console.error('Failed to fetch NFT info:', error);
      throw new Error('Failed to fetch NFT information. Please check the contract address and token ID.');
    }
  }

  /**
   * Check if user owns the NFT
   */
  async checkOwnership(contractAddress: string, tokenId: string, userAddress: string): Promise<boolean> {
    try {
      let provider = this.provider;
      let contract = new ethers.Contract(contractAddress, ERC721_ABI, provider);
      
      try {
        const owner = await contract.ownerOf(tokenId);
        return owner.toLowerCase() === userAddress.toLowerCase();
      } catch (error: any) {
        // If circuit breaker error, try with a fresh provider
        if (error.message?.includes('circuit breaker') || error.message?.includes('Block tracker destroyed')) {
          console.log('Ownership check failed with wallet provider, trying direct RPC...');
          provider = new ethers.JsonRpcProvider('https://dream-rpc.somnia.network/');
          contract = new ethers.Contract(contractAddress, ERC721_ABI, provider);
          const owner = await contract.ownerOf(tokenId);
          return owner.toLowerCase() === userAddress.toLowerCase();
        }
        throw error;
      }
    } catch (error) {
      console.error('Failed to check NFT ownership:', error);
      return false;
    }
  }

  /**
   * Approve marketplace to transfer NFT
   */
  async approveMarketplace(contractAddress: string, tokenId: string, marketplaceAddress: string): Promise<ethers.TransactionResponse> {
    if (!this.signer) {
      throw new Error('Signer required for approval');
    }

    const contract = new ethers.Contract(contractAddress, ERC721_ABI, this.signer);
    return contract.approve(marketplaceAddress, tokenId);
  }

  /**
   * Set approval for all NFTs from a collection
   */
  async setApprovalForAll(contractAddress: string, marketplaceAddress: string, approved: boolean): Promise<ethers.TransactionResponse> {
    if (!this.signer) {
      throw new Error('Signer required for approval');
    }

    const contract = new ethers.Contract(contractAddress, ERC721_ABI, this.signer);
    return contract.setApprovalForAll(marketplaceAddress, approved);
  }

  /**
   * Get user's NFT balance for a collection
   */
  async getBalance(contractAddress: string, userAddress: string): Promise<bigint> {
    const contract = new ethers.Contract(contractAddress, ERC721_ABI, this.provider);
    return contract.balanceOf(userAddress);
  }

  /**
   * Convert IPFS or other URIs to HTTP URLs
   */
  private convertToHttpUrl(uri: string): string {
    if (uri.startsWith('ipfs://')) {
      return IPFSService.getGatewayURL(uri.replace('ipfs://', ''));
    }
    if (uri.startsWith('ar://')) {
      return `https://arweave.net/${uri.replace('ar://', '')}`;
    }
    if (uri.startsWith('http://') || uri.startsWith('https://')) {
      return uri;
    }
    // Assume it's an IPFS CID if no protocol
    if (uri.startsWith('Qm') || uri.startsWith('bafy')) {
      return IPFSService.getGatewayURL(uri);
    }
    return uri;
  }

  /**
   * Validate NFT contract
   */
  async validateNFTContract(contractAddress: string): Promise<boolean> {
    try {
      const contract = new ethers.Contract(contractAddress, ERC721_ABI, this.provider);
      // Try to call a standard ERC721 function
      await contract.name();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate metadata CID for an NFT
   * Used when the NFT doesn't have metadata but we want to list it
   */
  async generateMetadataCID(
    name: string,
    description: string,
    imageUrl: string,
    attributes?: Array<{ trait_type: string; value: string | number }>
  ): Promise<string> {
    // If imageUrl is already an IPFS URL, extract the CID
    let imageCID = '';
    if (imageUrl.includes('ipfs')) {
      imageCID = IPFSService.extractCID(imageUrl);
    } else {
      // For non-IPFS images, we'll store the URL directly
      // In production, you might want to upload the image to IPFS first
      imageCID = imageUrl;
    }

    const metadata = {
      name,
      description,
      image: imageCID.startsWith('http') ? imageCID : `ipfs://${imageCID}`,
      attributes: attributes || [],
    };

    // In production, upload to IPFS and return the CID
    // For now, return a placeholder
    try {
      return await IPFSService.uploadJSON(metadata);
    } catch (error) {
      // Fallback: encode metadata as base64
      const encoded = btoa(JSON.stringify(metadata));
      return `data:application/json;base64,${encoded}`;
    }
  }
}

export default NFTService;