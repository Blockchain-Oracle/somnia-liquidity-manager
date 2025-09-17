const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🛒 Listing NFTs on Marketplace...\n");
  console.log("=" .repeat(60));
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Account:", deployer.address);
  
  // Load addresses
  const nftPath = path.join(__dirname, "../../deployments/nft-addresses.json");
  const marketPath = path.join(__dirname, "../../deployments/marketplace-address.json");
  
  const nftData = JSON.parse(fs.readFileSync(nftPath, 'utf-8'));
  const marketData = JSON.parse(fs.readFileSync(marketPath, 'utf-8'));
  
  const marketplaceAddress = marketData.marketplace;
  console.log("🏪 Marketplace:", marketplaceAddress);
  console.log("📦 NFTs to list:", nftData.nfts.length, "\n");
  
  // Connect to marketplace
  const marketplace = await hre.ethers.getContractAt("SommiaNFTMarketplace", marketplaceAddress);
  
  // Prices for each NFT (in STT)
  const prices = [
    "0.5",   // Cosmic Nebula
    "0.4",   // Neon Genesis
    "0.6",   // Quantum Entanglement
    "0.45",  // Digital Aurora
    "0.55"   // Liquid Dreams
  ];
  
  console.log("📋 NFTs to List:");
  console.log("-".repeat(60));
  
  const listings = [];
  
  for (let i = 0; i < nftData.nfts.length; i++) {
    const nft = nftData.nfts[i];
    const price = hre.ethers.parseEther(prices[i]);
    
    console.log(`\n${i + 1}. ${nft.name} (${nft.symbol})`);
    console.log(`   Contract: ${nft.address}`);
    console.log(`   Price: ${prices[i]} STT`);
    console.log(`   Artist: ${nft.artist}`);
    
    // Connect to NFT contract
    const nftContract = await hre.ethers.getContractAt("MarketplaceNFT", nft.address);
    
    // Get tokenId from NFT contract
    const tokenId = await nftContract.tokenId();
    
    // Transfer NFT to marketplace (escrow)
    console.log("   📤 Transferring NFT to marketplace (escrow)...");
    const transferTx = await nftContract["safeTransferFrom(address,address,uint256)"](
      deployer.address,
      marketplaceAddress,
      tokenId
    );
    await transferTx.wait();
    
    // Create listing
    console.log("   📋 Creating listing...");
    const listTx = await marketplace.createListing(
      nft.address,
      tokenId,
      price,
      nft.cid || "QmDefault" // Use CID from deployment data
    );
    await listTx.wait();
    console.log("   ✅ Listed successfully!");
    
    listings.push({
      name: nft.name,
      symbol: nft.symbol,
      nftContract: nft.address,
      tokenId: tokenId.toString(),
      price: prices[i] + " STT",
      artist: nft.artist,
      listed: true
    });
  }
  
  // Save listing info
  const listingPath = path.join(__dirname, "../../deployments/listings.json");
  fs.writeFileSync(listingPath, JSON.stringify({
    marketplace: marketplaceAddress,
    timestamp: new Date().toISOString(),
    listings: listings
  }, null, 2));
  
  console.log("\n" + "=".repeat(60));
  console.log("✅ All NFTs Listed Successfully!");
  console.log("\n💾 Listing info saved to deployments/listings.json");
  console.log("\n🎯 Summary:");
  console.log(`   Marketplace: ${marketplaceAddress}`);
  console.log(`   Total Listed: ${listings.length} NFTs`);
  console.log("\n💰 Prices:");
  listings.forEach(l => {
    console.log(`   ${l.name}: ${l.price}`);
  });
  console.log("\n🔗 View Marketplace:");
  console.log(`   https://explorer.somnia.network/address/${marketplaceAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });