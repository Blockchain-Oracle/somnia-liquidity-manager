import { MarketplaceListing, MarketplaceConfig } from '@/lib/constants/marketplace';

export class MockMarketplaceService {
  private static mockListings: MarketplaceListing[] = [
    {
      listingId: BigInt(1),
      seller: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb8',
      nft: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
      tokenId: BigInt(1001),
      price: BigInt('2500000000000000000'), // 2.5 STT
      cid: 'QmPZvyRPiNDd2dGQpANfPcKXPYdR1tzgH9XEUjTr1Yw6Sf',
      active: true,
      sold: false,
      createdAt: BigInt(Math.floor(Date.now() / 1000) - 86400) // 1 day ago
    },
    {
      listingId: BigInt(2),
      seller: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
      nft: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
      tokenId: BigInt(2345),
      price: BigInt('1800000000000000000'), // 1.8 STT
      cid: 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG',
      active: true,
      sold: false,
      createdAt: BigInt(Math.floor(Date.now() / 1000) - 172800) // 2 days ago
    },
    {
      listingId: BigInt(3),
      seller: '0xdD2FD4581271e230360230F9337D5c0430Bf44C0',
      nft: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
      tokenId: BigInt(3456),
      price: BigInt('3200000000000000000'), // 3.2 STT
      cid: 'QmS4ustL54uo8FzR9455qaxZwuN5DXpZV7KDZZ4N46ho6X',
      active: true,
      sold: false,
      createdAt: BigInt(Math.floor(Date.now() / 1000) - 259200) // 3 days ago
    },
    {
      listingId: BigInt(4),
      seller: '0xbDA5747bFD65F08deb54cb465eB87D40e51B197E',
      nft: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
      tokenId: BigInt(4567),
      price: BigInt('900000000000000000'), // 0.9 STT
      cid: 'QmZMxNdpVaEfvVU6iLCpfyJWgMZdXNmBQ1bBgHGz3CgJkE',
      active: true,
      sold: false,
      createdAt: BigInt(Math.floor(Date.now() / 1000) - 345600) // 4 days ago
    },
    {
      listingId: BigInt(5),
      seller: '0x2546BcD3c84621e976D8185a91A922aE77ECEc30',
      nft: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
      tokenId: BigInt(5678),
      price: BigInt('1200000000000000000'), // 1.2 STT
      cid: 'QmNRCQWfADpDfvBcAzmG8rCkKHcgFnXYxZ6SHzKvvPXbXc',
      active: true,
      sold: false,
      createdAt: BigInt(Math.floor(Date.now() / 1000) - 432000) // 5 days ago
    },
    {
      listingId: BigInt(6),
      seller: '0x976EA74026E726554dB657fA54763abd0C3a0aa9',
      nft: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707',
      tokenId: BigInt(6789),
      price: BigInt('4500000000000000000'), // 4.5 STT
      cid: 'QmPKmGAcCgNBpGvLMj5Sm2LvjvjFHJZDNKqywFRUHxddyj',
      active: false,
      sold: true,
      createdAt: BigInt(Math.floor(Date.now() / 1000) - 518400) // 6 days ago
    },
    {
      listingId: BigInt(7),
      seller: '0x14dC79964da2C08b23698B3D3cc7Ca32193d9955',
      nft: '0x0165878A594ca255338adfa4d48449f69242Eb8F',
      tokenId: BigInt(7890),
      price: BigInt('750000000000000000'), // 0.75 STT
      cid: 'QmV9tSDxXEfQmNcT2MkvKDqnZfvBZBYseP3BXKwzCKDXhN',
      active: true,
      sold: false,
      createdAt: BigInt(Math.floor(Date.now() / 1000) - 604800) // 7 days ago
    },
    {
      listingId: BigInt(8),
      seller: '0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f',
      nft: '0xa513E6E4b8f2a923D98304ec87F64353C4D5C853',
      tokenId: BigInt(8901),
      price: BigInt('5000000000000000000'), // 5.0 STT
      cid: 'QmRhTTbUrBYFw7HTiPfmYKiSvxSeRw8CJgtFrG8rbtNZzb',
      active: true,
      sold: false,
      createdAt: BigInt(Math.floor(Date.now() / 1000) - 691200) // 8 days ago
    },
    {
      listingId: BigInt(9),
      seller: '0xa0Ee7A142d267C1f36714E4a8F75612F20a79720',
      nft: '0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6',
      tokenId: BigInt(9012),
      price: BigInt('1500000000000000000'), // 1.5 STT
      cid: 'QmUNLLsPgjvZiFijpWvCTEqYMRGhUGfXBTgpCvKQN5esNZ',
      active: true,
      sold: false,
      createdAt: BigInt(Math.floor(Date.now() / 1000) - 777600) // 9 days ago
    },
    {
      listingId: BigInt(10),
      seller: '0xBcd4042DE499D14e55001CcbB24a551F3b954096',
      nft: '0x8A791620dd6260079BF849Dc5567aDC3F2FdC318',
      tokenId: BigInt(10123),
      price: BigInt('2000000000000000000'), // 2.0 STT
      cid: 'QmSkDCsS32eLpcymxtn1cEn7NAGpwQNCgdDLJxAB6AFMTZ',
      active: false,
      sold: true,
      createdAt: BigInt(Math.floor(Date.now() / 1000) - 864000) // 10 days ago
    },
    {
      listingId: BigInt(11),
      seller: '0x71bE63f3384f5fb98995898A86B02Fb2426c5788',
      nft: '0x610178dA211FEF7D417bC0e6FeD39F05609AD788',
      tokenId: BigInt(11234),
      price: BigInt('3500000000000000000'), // 3.5 STT
      cid: 'QmX7G9XhZpHJPeZyL5VgW8N5yMcnT1pQbuUKJssJRdN6ZN',
      active: true,
      sold: false,
      createdAt: BigInt(Math.floor(Date.now() / 1000) - 950400) // 11 days ago
    },
    {
      listingId: BigInt(12),
      seller: '0xFABB0ac9d68B0B445fB7357272Ff202C5651694a',
      nft: '0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e',
      tokenId: BigInt(12345),
      price: BigInt('6000000000000000000'), // 6.0 STT
      cid: 'QmPPGJR1xnkAq2G3F2hBWTJYxGGTv5tKwXfZvuYsZHrbEK',
      active: true,
      sold: false,
      createdAt: BigInt(Math.floor(Date.now() / 1000) - 1036800) // 12 days ago
    }
  ];

  private static mockConfig: MarketplaceConfig = {
    listingFeeWei: BigInt('10000000000000000'), // 0.01 STT
    platformFeeBps: 250, // 2.5%
    cancelRefundBps: 5000, // 50%
    feeRecipient: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'
  };

  private static mockCollections = [
    {
      address: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
      name: 'Cyber Punks Genesis',
      symbol: 'CPG',
      totalSupply: 10000,
      verified: true,
      image: 'https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?w=400&h=400&fit=crop',
      banner: 'https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?w=1920&h=400&fit=crop',
      description: 'A collection of 10,000 unique cyberpunk-themed NFTs living on the Somnia blockchain.',
      floor: BigInt('2500000000000000000'), // 2.5 STT
      volume24h: BigInt('523000000000000000000'), // 523 STT
      change24h: 15.3,
      owners: 3421,
      items: 10000
    },
    {
      address: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
      name: 'Neon Dreams',
      symbol: 'NEON',
      totalSupply: 8888,
      verified: true,
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=400&fit=crop',
      banner: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1920&h=400&fit=crop',
      description: 'Abstract neon art pieces that illuminate the digital realm.',
      floor: BigInt('1800000000000000000'), // 1.8 STT
      volume24h: BigInt('412000000000000000000'), // 412 STT
      change24h: -5.2,
      owners: 2156,
      items: 8888
    },
    {
      address: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
      name: 'Abstract Realms',
      symbol: 'REALM',
      totalSupply: 5555,
      verified: true,
      image: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=400&h=400&fit=crop',
      banner: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=1920&h=400&fit=crop',
      description: 'Journey through abstract dimensions with this unique collection.',
      floor: BigInt('3200000000000000000'), // 3.2 STT
      volume24h: BigInt('387000000000000000000'), // 387 STT
      change24h: 8.7,
      owners: 1892,
      items: 5555
    },
    {
      address: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
      name: 'Digital Horizons',
      symbol: 'DHZ',
      totalSupply: 7777,
      verified: false,
      image: 'https://images.unsplash.com/photo-1635002962487-2c1d4d2f63c2?w=400&h=400&fit=crop',
      banner: 'https://images.unsplash.com/photo-1635002962487-2c1d4d2f63c2?w=1920&h=400&fit=crop',
      description: 'Explore the boundaries of digital art and technology.',
      floor: BigInt('900000000000000000'), // 0.9 STT
      volume24h: BigInt('298000000000000000000'), // 298 STT
      change24h: 22.1,
      owners: 4521,
      items: 7777
    },
    {
      address: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
      name: 'Quantum Art',
      symbol: 'QAT',
      totalSupply: 3333,
      verified: true,
      image: 'https://images.unsplash.com/photo-1617791160505-6f00504e3519?w=400&h=400&fit=crop',
      banner: 'https://images.unsplash.com/photo-1617791160505-6f00504e3519?w=1920&h=400&fit=crop',
      description: 'Where quantum physics meets digital artistry.',
      floor: BigInt('1200000000000000000'), // 1.2 STT
      volume24h: BigInt('256000000000000000000'), // 256 STT
      change24h: -2.8,
      owners: 1234,
      items: 3333
    }
  ];

  async getListing(listingId: bigint): Promise<MarketplaceListing | null> {
    const listing = MockMarketplaceService.mockListings.find(l => l.listingId === listingId);
    if (!listing) return null;
    
    // Generate dynamic image URLs based on listing ID
    const imageIndex = Number(listingId) % 20;
    const images = [
      'https://images.unsplash.com/photo-1620321023374-d1a68fbc720d',
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe',
      'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4',
      'https://images.unsplash.com/photo-1635002962487-2c1d4d2f63c2',
      'https://images.unsplash.com/photo-1617791160505-6f00504e3519',
      'https://images.unsplash.com/photo-1569163139394-de4798aa62b6',
      'https://images.unsplash.com/photo-1557672172-298e090bd0f1',
      'https://images.unsplash.com/photo-1549490349-8643362247b5',
      'https://images.unsplash.com/photo-1618336753974-aae8e04506aa',
      'https://images.unsplash.com/photo-1563089145-599997674d42',
      'https://images.unsplash.com/photo-1620121684840-edffcfc4b878',
      'https://images.unsplash.com/photo-1614732414444-096e5f1122d5',
      'https://images.unsplash.com/photo-1604076913837-52ab5629fba9',
      'https://images.unsplash.com/photo-1579762715118-a6f1d4b934f1',
      'https://images.unsplash.com/photo-1552250575-e508473b090f',
      'https://images.unsplash.com/photo-1567095761054-7a02e69e5c43',
      'https://images.unsplash.com/photo-1618172193763-c511deb635ca',
      'https://images.unsplash.com/photo-1569003339405-ea396a5a8a90',
      'https://images.unsplash.com/photo-1634926878768-2a5b3c42f139',
      'https://images.unsplash.com/photo-1634193295627-1cdddf751ebf'
    ];
    
    // Override CID with a proper image URL for display
    return {
      ...listing,
      cid: `${images[imageIndex]}?w=800&h=800&fit=crop`
    };
  }

  async getActiveListings(offset: number = 0, limit: number = 20): Promise<{
    listings: MarketplaceListing[];
    hasMore: boolean;
  }> {
    const activeListings = MockMarketplaceService.mockListings.filter(l => l.active && !l.sold);
    const end = Math.min(offset + limit, activeListings.length);
    const listings = activeListings.slice(offset, end);
    
    // Add dynamic images to listings
    const listingsWithImages = listings.map((listing, index) => {
      const imageIndex = (offset + index) % 20;
      const images = [
        'https://images.unsplash.com/photo-1620321023374-d1a68fbc720d',
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe',
        'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4',
        'https://images.unsplash.com/photo-1635002962487-2c1d4d2f63c2',
        'https://images.unsplash.com/photo-1617791160505-6f00504e3519',
        'https://images.unsplash.com/photo-1569163139394-de4798aa62b6',
        'https://images.unsplash.com/photo-1557672172-298e090bd0f1',
        'https://images.unsplash.com/photo-1549490349-8643362247b5',
        'https://images.unsplash.com/photo-1618336753974-aae8e04506aa',
        'https://images.unsplash.com/photo-1563089145-599997674d42',
        'https://images.unsplash.com/photo-1620121684840-edffcfc4b878',
        'https://images.unsplash.com/photo-1614732414444-096e5f1122d5',
        'https://images.unsplash.com/photo-1604076913837-52ab5629fba9',
        'https://images.unsplash.com/photo-1579762715118-a6f1d4b934f1',
        'https://images.unsplash.com/photo-1552250575-e508473b090f',
        'https://images.unsplash.com/photo-1567095761054-7a02e69e5c43',
        'https://images.unsplash.com/photo-1618172193763-c511deb635ca',
        'https://images.unsplash.com/photo-1569003339405-ea396a5a8a90',
        'https://images.unsplash.com/photo-1634926878768-2a5b3c42f139',
        'https://images.unsplash.com/photo-1634193295627-1cdddf751ebf'
      ];
      
      return {
        ...listing,
        cid: `${images[imageIndex]}?w=800&h=800&fit=crop`
      };
    });
    
    return {
      listings: listingsWithImages,
      hasMore: end < activeListings.length
    };
  }

  async getActiveListingsCount(): Promise<number> {
    return MockMarketplaceService.mockListings.filter(l => l.active && !l.sold).length;
  }

  async getSellerListings(seller: string): Promise<MarketplaceListing[]> {
    return MockMarketplaceService.mockListings.filter(l => 
      l.seller.toLowerCase() === seller.toLowerCase()
    );
  }

  async getMarketplaceConfig(): Promise<MarketplaceConfig> {
    return MockMarketplaceService.mockConfig;
  }

  calculateFees(price: bigint): { platformFee: bigint; sellerProceeds: bigint } {
    const platformFeeBps = MockMarketplaceService.mockConfig.platformFeeBps;
    const platformFee = (price * BigInt(platformFeeBps)) / BigInt(10000);
    const sellerProceeds = price - platformFee;
    return { platformFee, sellerProceeds };
  }

  async purchase(listingId: bigint, price: bigint): Promise<{ wait: () => Promise<void> }> {
    const listing = MockMarketplaceService.mockListings.find(l => l.listingId === listingId);
    if (listing) {
      listing.active = false;
      listing.sold = true;
    }
    
    // Mock transaction
    return {
      wait: async () => {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    };
  }

  async cancelListing(listingId: bigint): Promise<{ wait: () => Promise<void> }> {
    const listing = MockMarketplaceService.mockListings.find(l => l.listingId === listingId);
    if (listing) {
      listing.active = false;
    }
    
    // Mock transaction
    return {
      wait: async () => {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    };
  }

  getCollections() {
    return MockMarketplaceService.mockCollections;
  }

  getCollectionByAddress(address: string) {
    return MockMarketplaceService.mockCollections.find(
      c => c.address.toLowerCase() === address.toLowerCase()
    );
  }

  async getListingsByCollection(collectionAddress: string): Promise<MarketplaceListing[]> {
    const listings = MockMarketplaceService.mockListings.filter(l => 
      l.nft.toLowerCase() === collectionAddress.toLowerCase() && l.active && !l.sold
    );
    
    // Add dynamic images
    return listings.map((listing, index) => {
      const imageIndex = index % 20;
      const images = [
        'https://images.unsplash.com/photo-1620321023374-d1a68fbc720d',
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe',
        'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4',
        'https://images.unsplash.com/photo-1635002962487-2c1d4d2f63c2',
        'https://images.unsplash.com/photo-1617791160505-6f00504e3519',
        'https://images.unsplash.com/photo-1569163139394-de4798aa62b6',
        'https://images.unsplash.com/photo-1557672172-298e090bd0f1',
        'https://images.unsplash.com/photo-1549490349-8643362247b5',
        'https://images.unsplash.com/photo-1618336753974-aae8e04506aa',
        'https://images.unsplash.com/photo-1563089145-599997674d42',
        'https://images.unsplash.com/photo-1620121684840-edffcfc4b878',
        'https://images.unsplash.com/photo-1614732414444-096e5f1122d5',
        'https://images.unsplash.com/photo-1604076913837-52ab5629fba9',
        'https://images.unsplash.com/photo-1579762715118-a6f1d4b934f1',
        'https://images.unsplash.com/photo-1552250575-e508473b090f',
        'https://images.unsplash.com/photo-1567095761054-7a02e69e5c43',
        'https://images.unsplash.com/photo-1618172193763-c511deb635ca',
        'https://images.unsplash.com/photo-1569003339405-ea396a5a8a90',
        'https://images.unsplash.com/photo-1634926878768-2a5b3c42f139',
        'https://images.unsplash.com/photo-1634193295627-1cdddf751ebf'
      ];
      
      return {
        ...listing,
        cid: `${images[imageIndex]}?w=800&h=800&fit=crop`
      };
    });
  }
}