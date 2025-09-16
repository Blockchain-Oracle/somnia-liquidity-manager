import { ethers } from 'ethers';
import { type MarketplaceListing } from '@/lib/constants/marketplace';
import { MarketplaceService } from './marketplace.service';

/**
 * Hybrid marketplace service that uses real contracts
 */
export class HybridMarketplaceService {
  private realService?: MarketplaceService;
  
  constructor(signer?: ethers.Signer) {
    // Initialize real service if signer is provided
    if (signer) {
      this.initializeRealService(signer);
    }
  }
  
  private async initializeRealService(signer: ethers.Signer) {
    try {
      // Check if contract is deployed
      const response = await fetch('/api/deployments');
      if (response.ok) {
        const data = await response.json();
        if (data.marketplace) {
          this.realService = new MarketplaceService(signer, data.marketplace.address);
        }
      }
    } catch (error) {
      console.error('Failed to initialize marketplace service:', error);
    }
  }
  
  async setSigner(signer: ethers.Signer) {
    await this.initializeRealService(signer);
  }
  
  // ========== Listing Management ==========
  
  async createListing(
    nftAddress: string,
    tokenId: bigint,
    price: bigint,
    cid: string
  ): Promise<ethers.TransactionResponse | { hash: string }> {
    if (!this.realService) {
      throw new Error('Marketplace service not initialized');
    }
    return this.realService.createListing(nftAddress, tokenId, price, cid);
  }
  
  async escrowAndList(
    nftAddress: string,
    tokenId: bigint,
    price: bigint,
    cid: string
  ): Promise<ethers.TransactionResponse | { hash: string }> {
    if (!this.realService) {
      throw new Error('Marketplace service not initialized');
    }
    return this.realService.escrowAndList(nftAddress, tokenId, price, cid);
  }
  
  async updateListing(
    listingId: bigint,
    newPrice: bigint,
    newCid?: string
  ): Promise<ethers.TransactionResponse | { hash: string }> {
    if (!this.realService) {
      throw new Error('Marketplace service not initialized');
    }
    return this.realService.updateListing(listingId, newPrice, newCid);
  }
  
  async cancelListing(listingId: bigint): Promise<ethers.TransactionResponse | { hash: string }> {
    if (!this.realService) {
      throw new Error('Marketplace service not initialized');
    }
    return this.realService.cancelListing(listingId);
  }
  
  async purchase(listingId: bigint, price: bigint): Promise<ethers.TransactionResponse | { hash: string }> {
    if (!this.realService) {
      throw new Error('Marketplace service not initialized');
    }
    return this.realService.purchase(listingId, price);
  }
  
  // ========== Getters ==========
  
  async getListing(listingId: bigint): Promise<MarketplaceListing | null> {
    if (!this.realService) {
      return null;
    }
    try {
      return await this.realService.getListing(listingId);
    } catch {
      return null;
    }
  }
  
  async getActiveListings(offset: number = 0, limit: number = 20): Promise<{
    listings: MarketplaceListing[];
    hasMore: boolean;
  }> {
    if (!this.realService) {
      return { listings: [], hasMore: false };
    }
    try {
      return await this.realService.getActiveListings(offset, limit);
    } catch {
      return { listings: [], hasMore: false };
    }
  }
  
  async getActiveListingsCount(): Promise<number> {
    if (!this.realService) {
      return 0;
    }
    try {
      return await this.realService.getActiveListingsCount();
    } catch {
      return 0;
    }
  }
  
  async getSellerListings(seller: string): Promise<MarketplaceListing[]> {
    if (!this.realService) {
      return [];
    }
    try {
      return await this.realService.getSellerListings(seller);
    } catch {
      return [];
    }
  }
  
  async getListingsByCollection(collectionAddress: string): Promise<MarketplaceListing[]> {
    if (!this.realService) {
      return [];
    }
    try {
      return await this.realService.getListingsByCollection(collectionAddress);
    } catch {
      return [];
    }
  }
  
  async getMarketplaceConfig() {
    if (!this.realService) {
      return {
        platformFee: 250,
        owner: '0x0000000000000000000000000000000000000000',
        escrowContract: '0x0000000000000000000000000000000000000000'
      };
    }
    try {
      return await this.realService.getMarketplaceConfig();
    } catch {
      return {
        platformFee: 250,
        owner: '0x0000000000000000000000000000000000000000',
        escrowContract: '0x0000000000000000000000000000000000000000'
      };
    }
  }
  
  // ========== User NFT Management ==========
  
  async getUserNFTs(userAddress: string) {
    if (!this.realService) {
      return [];
    }
    try {
      return await this.realService.getUserNFTs(userAddress);
    } catch {
      return [];
    }
  }
  
  async getNFTMetadata(contractAddress: string, tokenId: string | number) {
    if (!this.realService) {
      return null;
    }
    try {
      return await this.realService.getNFTMetadata(contractAddress, tokenId);
    } catch {
      return null;
    }
  }
  
  async isApprovedForAll(
    nftAddress: string,
    owner: string,
    operator: string
  ): Promise<boolean> {
    if (!this.realService) {
      return false;
    }
    try {
      return await this.realService.isApprovedForAll(nftAddress, owner, operator);
    } catch {
      return false;
    }
  }
  
  async setApprovalForAll(
    nftAddress: string,
    operator: string,
    approved: boolean
  ): Promise<ethers.TransactionResponse> {
    if (!this.realService) {
      throw new Error('Marketplace service not initialized');
    }
    return this.realService.setApprovalForAll(nftAddress, operator, approved);
  }
}