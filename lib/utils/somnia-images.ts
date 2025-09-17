// Somnia-themed image generator for NFTs
// Provides cosmic/space themed images appropriate for Somnia blockchain

export function getSomniaThemedImage(tokenId: bigint): string {
  const seed = tokenId.toString();
  const index = Number(tokenId % 15n);
  
  // Use abstract, space, and dream-themed images appropriate for Somnia
  const themes = [
    `https://source.unsplash.com/600x600/?cosmic,nebula,space&sig=${seed}`,
    `https://source.unsplash.com/600x600/?abstract,neon,digital&sig=${seed}`,
    `https://source.unsplash.com/600x600/?aurora,northern-lights&sig=${seed}`,
    `https://source.unsplash.com/600x600/?galaxy,stars,universe&sig=${seed}`,
    `https://source.unsplash.com/600x600/?fractal,geometric,art&sig=${seed}`,
    `https://source.unsplash.com/600x600/?crystal,prism,light&sig=${seed}`,
    `https://source.unsplash.com/600x600/?nebula,cosmos,astronomy&sig=${seed}`,
    `https://source.unsplash.com/600x600/?holographic,iridescent&sig=${seed}`,
    `https://source.unsplash.com/600x600/?ethereal,mystical,fantasy&sig=${seed}`,
    `https://source.unsplash.com/600x600/?quantum,particles,physics&sig=${seed}`,
    `https://source.unsplash.com/600x600/?dreamscape,surreal&sig=${seed}`,
    `https://source.unsplash.com/600x600/?vaporwave,retrowave&sig=${seed}`,
    `https://source.unsplash.com/600x600/?celestial,moon,planets&sig=${seed}`,
    `https://source.unsplash.com/600x600/?underwater,ocean,deep&sig=${seed}`,
    `https://source.unsplash.com/600x600/?digital,matrix,cyber&sig=${seed}`
  ];
  
  return themes[index];
}

// Somnia-themed NFT names
const somniaCollections = [
  'Dream Weavers',
  'Lucid Guardians', 
  'Astral Voyagers',
  'Ethereal Spirits',
  'Cosmic Dreamers',
  'Nebula Wanderers',
  'Starlight Seekers',
  'Void Dancers',
  'Crystal Visions',
  'Mystic Echoes'
];

const adjectives = [
  'Celestial', 'Ethereal', 'Luminous', 'Astral', 'Cosmic',
  'Radiant', 'Mystic', 'Twilight', 'Starborn', 'Moonlit',
  'Prismatic', 'Iridescent', 'Nebular', 'Crystalline', 'Auroral'
];

export function getSomniaCollectionName(tokenId: bigint): string {
  const collectionIndex = Number(tokenId % BigInt(somniaCollections.length));
  return somniaCollections[collectionIndex];
}

export function getSomniaNFTName(tokenId: bigint): string {
  const collectionIndex = Number(tokenId % BigInt(somniaCollections.length));
  const collection = somniaCollections[collectionIndex];
  const adjectiveIndex = Number(tokenId % BigInt(adjectives.length));
  const adjective = adjectives[adjectiveIndex];
  
  // Extract just the first word of the collection for the name
  const collectionPrefix = collection.split(' ')[1] || 'NFT';
  
  return `${adjective} ${collectionPrefix} #${tokenId}`;
}