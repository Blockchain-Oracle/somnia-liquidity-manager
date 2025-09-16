/**
 * Generate NFT Metadata with Unsplash Images
 * Creates metadata for NFTs using high-quality images from Unsplash
 */

import { NFTMetadata } from '../lib/services/pinata.service';

// Collection themes and configurations
const COLLECTIONS = {
  abstract: {
    name: 'Abstract Dreams',
    description: 'A collection of abstract art exploring the boundaries of digital creativity',
    searchTerms: ['abstract art', 'geometric', 'colorful abstract', 'digital art'],
    attributes: [
      { trait_type: 'Style', values: ['Geometric', 'Fluid', 'Minimal', 'Complex'] },
      { trait_type: 'Mood', values: ['Energetic', 'Calm', 'Mysterious', 'Vibrant'] },
      { trait_type: 'Rarity', values: ['Common', 'Uncommon', 'Rare', 'Legendary'] },
    ]
  },
  nature: {
    name: 'Nature\'s Wonders',
    description: 'Capturing the breathtaking beauty of the natural world',
    searchTerms: ['landscape', 'mountains', 'ocean', 'forest', 'sunset'],
    attributes: [
      { trait_type: 'Landscape', values: ['Mountain', 'Ocean', 'Forest', 'Desert'] },
      { trait_type: 'Time', values: ['Dawn', 'Day', 'Sunset', 'Night'] },
      { trait_type: 'Season', values: ['Spring', 'Summer', 'Autumn', 'Winter'] },
    ]
  },
  cyberpunk: {
    name: 'Neon Dreams',
    description: 'Futuristic visions of a cyberpunk metropolis',
    searchTerms: ['cyberpunk', 'neon lights', 'futuristic city', 'tech'],
    attributes: [
      { trait_type: 'Location', values: ['Downtown', 'Outskirts', 'Underground', 'Skyline'] },
      { trait_type: 'Atmosphere', values: ['Rainy', 'Foggy', 'Clear', 'Stormy'] },
      { trait_type: 'Tech Level', values: ['Basic', 'Advanced', 'Experimental', 'Alien'] },
    ]
  }
};

/**
 * Get random element from array
 */
function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Generate Unsplash image URL with specific parameters
 */
function generateUnsplashUrl(searchTerm: string, index: number): string {
  // Using Unsplash Source API for random images based on search terms
  // Adding index to get different images for same search term
  const width = 800;
  const height = 800;
  const seed = Date.now() + index;
  
  // Use Unsplash Source API (free, no API key needed)
  return `https://source.unsplash.com/${width}x${height}/?${encodeURIComponent(searchTerm)}&sig=${seed}`;
}

/**
 * Generate attributes for NFT
 */
function generateAttributes(collection: typeof COLLECTIONS.abstract): Array<{ trait_type: string; value: string }> {
  return collection.attributes.map(attr => ({
    trait_type: attr.trait_type,
    value: getRandomElement(attr.values)
  }));
}

/**
 * Calculate rarity score
 */
function calculateRarityScore(attributes: Array<{ trait_type: string; value: string }>): number {
  let score = 0;
  attributes.forEach(attr => {
    if (attr.value.includes('Legendary') || attr.value.includes('Alien')) score += 40;
    else if (attr.value.includes('Rare') || attr.value.includes('Experimental')) score += 25;
    else if (attr.value.includes('Uncommon') || attr.value.includes('Advanced')) score += 15;
    else score += 5;
  });
  return Math.min(100, score);
}

/**
 * Generate metadata for a single NFT
 */
export function generateSingleNFTMetadata(
  collectionType: keyof typeof COLLECTIONS,
  index: number,
  customName?: string
): NFTMetadata {
  const collection = COLLECTIONS[collectionType];
  const searchTerm = getRandomElement(collection.searchTerms);
  const attributes = generateAttributes(collection);
  const rarityScore = calculateRarityScore(attributes);
  
  // Add rarity score as attribute
  attributes.push({
    trait_type: 'Rarity Score',
    value: rarityScore
  });

  const name = customName || `${collection.name} #${index + 1}`;
  
  return {
    name,
    description: `${collection.description}. This unique piece is part of an exclusive collection on Somnia Network.`,
    image: generateUnsplashUrl(searchTerm, index),
    attributes,
    external_url: `https://somnia-nft.art/${collectionType}/${index + 1}`
  };
}

/**
 * Generate metadata for a collection of NFTs
 */
export function generateCollectionMetadata(
  collectionType: keyof typeof COLLECTIONS,
  count: number = 10,
  startIndex: number = 0
): NFTMetadata[] {
  const metadata: NFTMetadata[] = [];
  
  for (let i = 0; i < count; i++) {
    metadata.push(generateSingleNFTMetadata(collectionType, startIndex + i));
  }
  
  return metadata;
}

/**
 * Generate diverse collection with multiple themes
 */
export function generateDiverseCollection(count: number = 12): NFTMetadata[] {
  const metadata: NFTMetadata[] = [];
  const collectionTypes = Object.keys(COLLECTIONS) as (keyof typeof COLLECTIONS)[];
  
  for (let i = 0; i < count; i++) {
    const collectionType = collectionTypes[i % collectionTypes.length];
    const nft = generateSingleNFTMetadata(collectionType, i);
    nft.name = `Somnia Collection #${i + 1}`;
    metadata.push(nft);
  }
  
  return metadata;
}

/**
 * Generate premium collection with curated attributes
 */
export function generatePremiumCollection(
  name: string,
  description: string,
  count: number = 5
): NFTMetadata[] {
  const premiumSearchTerms = [
    'luxury art',
    'gold abstract',
    'premium design',
    'exclusive artwork',
    'masterpiece'
  ];
  
  const metadata: NFTMetadata[] = [];
  
  for (let i = 0; i < count; i++) {
    const searchTerm = premiumSearchTerms[i % premiumSearchTerms.length];
    
    metadata.push({
      name: `${name} #${i + 1}`,
      description: `${description} Limited edition ${i + 1} of ${count}.`,
      image: generateUnsplashUrl(searchTerm, i),
      attributes: [
        { trait_type: 'Edition', value: `${i + 1}/${count}` },
        { trait_type: 'Collection', value: name },
        { trait_type: 'Tier', value: 'Premium' },
        { trait_type: 'Artist', value: 'Somnia Creator' },
        { trait_type: 'Year', value: '2025' },
        { trait_type: 'Blockchain', value: 'Somnia' }
      ],
      external_url: `https://somnia-nft.art/premium/${i + 1}`
    });
  }
  
  return metadata;
}

// Example usage
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Generating sample NFT metadata...\n');
  
  // Generate single NFT
  const singleNFT = generateSingleNFTMetadata('abstract', 0);
  console.log('Single NFT:', JSON.stringify(singleNFT, null, 2));
  
  // Generate collection
  const collection = generateCollectionMetadata('nature', 3);
  console.log('\n\nCollection:', JSON.stringify(collection, null, 2));
  
  // Generate diverse collection
  const diverse = generateDiverseCollection(3);
  console.log('\n\nDiverse Collection:', JSON.stringify(diverse, null, 2));
}