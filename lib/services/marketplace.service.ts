import { ethers } from 'ethers';
import { MARKETPLACE_ABI, MARKETPLACE_ADDRESS, type MarketplaceListing } from '@/lib/constants/marketplace';

export { MARKETPLACE_ADDRESS };

export class MarketplaceService {
  private contract: ethers.Contract;
  private signer?: ethers.Signer;
  private provider: ethers.Provider;

  constructor(signerOrProvider?: ethers.Signer | ethers.Provider) {
    if (!signerOrProvider) {
      // Default to read-only provider
      this.provider = new ethers.JsonRpcProvider('https://dream-rpc.somnia.network/');
      this.contract = new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, this.provider);
    } else if ('getAddress' in signerOrProvider) {
      // It's a signer
      this.signer = signerOrProvider as ethers.Signer;
      this.provider = this.signer.provider!;
      this.contract = new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, this.signer);
    } else {
      // It's a provider
      this.provider = signerOrProvider;
      this.contract = new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, this.provider);
    }
  }

  private requireSigner(): ethers.Signer {
    if (!this.signer) {
      throw new Error('Signer required for this operation. Please connect your wallet.');
    }
    return this.signer;
  }

  // ========== Escrow Management ==========
  
  /**
   * Transfer NFT to marketplace escrow
   */
  async escrowNFT(nftAddress: string, tokenId: bigint): Promise<ethers.TransactionResponse> {
    const signer = this.requireSigner();
    const nftContract = new ethers.Contract(
      nftAddress,
      ['function safeTransferFrom(address from, address to, uint256 tokenId) external'],
      signer
    );
    
    const signerAddress = await signer.getAddress();
    return nftContract.safeTransferFrom(signerAddress, MARKETPLACE_ADDRESS, tokenId);
  }

  /**
   * Transfer NFT to marketplace and auto-create listing (one transaction)
   */
  async escrowAndList(
    nftAddress: string,
    tokenId: bigint,
    price: bigint,
    cid: string
  ): Promise<ethers.TransactionResponse> {
    const signer = this.requireSigner();
    const nftContract = new ethers.Contract(
      nftAddress,
      ['function safeTransferFrom(address from, address to, uint256 tokenId, bytes data) external'],
      signer
    );
    
    const signerAddress = await signer.getAddress();
    const data = ethers.AbiCoder.defaultAbiCoder().encode(
      ['uint256', 'string'],
      [price, cid]
    );
    
    return nftContract['safeTransferFrom(address,address,uint256,bytes)'](
      signerAddress,
      MARKETPLACE_ADDRESS,
      tokenId,
      data
    );
  }

  /**
   * Withdraw escrowed NFT (if not listed)
   */
  async withdrawEscrow(nftAddress: string, tokenId: bigint): Promise<ethers.TransactionResponse> {
    this.requireSigner();
    return this.contract.withdrawEscrow(nftAddress, tokenId);
  }

  // ========== Listing Management ==========

  /**
   * Create listing for already escrowed NFT
   */
  async createListing(
    nftAddress: string,
    tokenId: bigint,
    price: bigint,
    cid: string
  ): Promise<ethers.TransactionResponse> {
    this.requireSigner();
    const listingFee = await this.contract.listingFeeWei();
    return this.contract.createListing(nftAddress, tokenId, price, cid, {
      value: listingFee
    });
  }

  /**
   * Update listing price and/or CID
   */
  async updateListing(
    listingId: bigint,
    newPrice: bigint,
    newCid?: string
  ): Promise<ethers.TransactionResponse> {
    this.requireSigner();
    return this.contract.updateListing(listingId, newPrice, newCid || '');
  }

  /**
   * Cancel listing and return NFT to seller
   */
  async cancelListing(listingId: bigint): Promise<ethers.TransactionResponse> {
    this.requireSigner();
    return this.contract.cancelListing(listingId);
  }

  // ========== Purchase ==========

  /**
   * Purchase an NFT listing
   */
  async purchase(listingId: bigint, price: bigint): Promise<ethers.TransactionResponse> {
    this.requireSigner();
    return this.contract.purchase(listingId, { value: price });
  }

  // ========== Getters ==========

  /**
   * Get single listing details
   */
  async getListing(listingId: bigint): Promise<MarketplaceListing> {
    const result = await this.contract.getListing(listingId);
    return {
      listingId,
      seller: result[0],
      nft: result[1],
      tokenId: result[2],
      price: result[3],
      cid: result[4],
      active: result[5],
      sold: result[6],
      createdAt: result[7]
    };
  }

  /**
   * Get paginated active listings
   */
  async getActiveListings(offset: number = 0, limit: number = 20): Promise<{
    listings: MarketplaceListing[];
    hasMore: boolean;
  }> {
    try {
      const [listingIds, hasMore] = await this.contract.getActiveListingsPaginated(offset, limit);
      
      const listings = await Promise.all(
        listingIds.map((id: bigint) => this.getListing(id))
      );
      
      return { listings, hasMore };
    } catch (error) {
      console.warn('Failed to get active listings:', error);
      // Return empty array for now
      return {
        listings: [],
        hasMore: false
      };
    }
  }

  /**
   * Get total count of active listings
   */
  async getActiveListingsCount(): Promise<number> {
    try {
      const count = await this.contract.getActiveListingsCount();
      return Number(count);
    } catch (error) {
      console.warn('Failed to get active listings count:', error);
      return 0;
    }
  }

  /**
   * Get all listings by seller
   */
  async getSellerListings(seller: string): Promise<MarketplaceListing[]> {
    const listingIds = await this.contract.getSellerListings(seller);
    return Promise.all(listingIds.map((id: bigint) => this.getListing(id)));
  }

  /**
   * Check escrow status of an NFT
   */
  async getEscrowInfo(nftAddress: string, tokenId: bigint): Promise<{
    originalOwner: string;
    isListed: boolean;
    listingId?: bigint;
  }> {
    const [originalOwner, isListed, listingId] = await this.contract.getEscrowInfo(nftAddress, tokenId);
    return {
      originalOwner,
      isListed,
      listingId: isListed ? listingId : undefined
    };
  }

  /**
   * Get marketplace configuration
   */
  async getMarketplaceConfig() {
    const [listingFeeWei, platformFeeBps, cancelRefundBps, feeRecipient] = await Promise.all([
      this.contract.listingFeeWei(),
      this.contract.platformFeeBps(),
      this.contract.cancelRefundBps(),
      this.contract.feeRecipient()
    ]);
    
    return {
      listingFeeWei,
      platformFeeBps: Number(platformFeeBps),
      cancelRefundBps: Number(cancelRefundBps),
      feeRecipient
    };
  }

  /**
   * Calculate fees for a sale
   */
  calculateFees(price: bigint): { platformFee: bigint; sellerProceeds: bigint } {
    const platformFeeBps = 250; // 2.5%
    const platformFee = (price * BigInt(platformFeeBps)) / BigInt(10000);
    const sellerProceeds = price - platformFee;
    return { platformFee, sellerProceeds };
  }
}