import { ethers } from 'ethers';
import { type MarketplaceListing } from '@/lib/constants/marketplace';
import { MarketplaceService } from './marketplace.service';
import { MockMarketplaceService } from './mock-marketplace.service';

/**
 * Hybrid marketplace service that uses real contracts when available, 
 * falls back to mock data otherwise
 */
export class HybridMarketplaceService {
  private realService?: MarketplaceService;
  private mockService: MockMarketplaceService;
  private useRealContract: boolean = false;
  
  constructor(signer?: ethers.Signer) {
    this.mockService = new MockMarketplaceService();
    
    // Try to initialize real service if signer is provided
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
          // Create real service with deployed contract address
          const { MARKETPLACE_ABI } = await import('@/lib/constants/marketplace');
          const contract = new ethers.Contract(
            data.marketplace,
            MARKETPLACE_ABI,
            signer
          );
          
          // Test contract connection
          try {
            await contract.listingCounter();
            this.realService = new MarketplaceService(signer);
            this.useRealContract = true;
            console.log('Connected to real marketplace contract');
          } catch {
            console.log('Contract not accessible, using mock data');
          }
        }
      }
    } catch (error) {
      console.log('Using mock marketplace data');
    }
  }
  
  // ========== Listing Management ==========
  
  async createListing(
    nftAddress: string,
    tokenId: bigint,
    price: bigint,
    cid: string
  ): Promise<ethers.TransactionResponse | { hash: string }> {
    if (this.realService && this.useRealContract) {
      return this.realService.createListing(nftAddress, tokenId, price, cid);
    }
    return this.mockService.createListing(nftAddress, tokenId, price, cid);
  }
  
  async escrowAndList(
    nftAddress: string,
    tokenId: bigint,
    price: bigint,
    cid: string
  ): Promise<ethers.TransactionResponse | { hash: string }> {
    if (this.realService && this.useRealContract) {
      return this.realService.escrowAndList(nftAddress, tokenId, price, cid);
    }
    return this.mockService.createListing(nftAddress, tokenId, price, cid);
  }
  
  async updateListing(
    listingId: bigint,
    newPrice: bigint,
    newCid?: string
  ): Promise<ethers.TransactionResponse | { hash: string }> {
    if (this.realService && this.useRealContract) {
      return this.realService.updateListing(listingId, newPrice, newCid);
    }
    return this.mockService.updateListing(listingId, newPrice, newCid);
  }
  
  async cancelListing(listingId: bigint): Promise<ethers.TransactionResponse | { hash: string }> {
    if (this.realService && this.useRealContract) {
      return this.realService.cancelListing(listingId);
    }
    return this.mockService.cancelListing(listingId);
  }
  
  async purchase(listingId: bigint, price: bigint): Promise<ethers.TransactionResponse | { hash: string }> {
    if (this.realService && this.useRealContract) {
      return this.realService.purchase(listingId, price);
    }
    return this.mockService.purchase(listingId, price);
  }
  
  // ========== Getters ==========
  
  async getListing(listingId: bigint): Promise<MarketplaceListing> {
    if (this.realService && this.useRealContract) {
      try {
        return await this.realService.getListing(listingId);
      } catch {
        // Fall back to mock if real contract fails
      }
    }
    return this.mockService.getListing(listingId);
  }
  
  async getActiveListings(offset: number = 0, limit: number = 20): Promise<{
    listings: MarketplaceListing[];
    hasMore: boolean;
  }> {
    if (this.realService && this.useRealContract) {
      try {
        const result = await this.realService.getActiveListings(offset, limit);
        if (result.listings.length > 0) {
          return result;
        }
      } catch {
        // Fall back to mock if real contract fails
      }
    }
    return this.mockService.getActiveListings(offset, limit);
  }
  
  async getActiveListingsCount(): Promise<number> {
    if (this.realService && this.useRealContract) {
      try {
        return await this.realService.getActiveListingsCount();
      } catch {
        // Fall back to mock if real contract fails
      }
    }
    return this.mockService.getActiveListingsCount();
  }
  
  async getSellerListings(seller: string): Promise<MarketplaceListing[]> {
    if (this.realService && this.useRealContract) {
      try {
        return await this.realService.getSellerListings(seller);
      } catch {
        // Fall back to mock if real contract fails
      }
    }
    return this.mockService.getSellerListings(seller);
  }
  
  async getMarketplaceConfig() {
    if (this.realService && this.useRealContract) {
      try {
        return await this.realService.getMarketplaceConfig();
      } catch {
        // Fall back to mock if real contract fails
      }
    }
    return {
      listingFeeWei: ethers.parseEther('0.01'),
      platformFeeBps: 250,
      cancelRefundBps: 5000,
      feeRecipient: '0x0000000000000000000000000000000000000000'
    };
  }
  
  calculateFees(price: bigint): { platformFee: bigint; sellerProceeds: bigint } {
    const platformFeeBps = 250; // 2.5%
    const platformFee = (price * BigInt(platformFeeBps)) / BigInt(10000);
    const sellerProceeds = price - platformFee;
    return { platformFee, sellerProceeds };
  }
  
  // Helper to check if using real contract
  isUsingRealContract(): boolean {
    return this.useRealContract;
  }
}