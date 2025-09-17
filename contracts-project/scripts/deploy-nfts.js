const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🎨 Deploying Ethereal Visions NFTs...\n");
  console.log("=" .repeat(60));
  
  // Get deployer
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);
  
  // Get factory address
  const factoryPath = path.join(__dirname, "../../deployments/factory-address.json");
  const factoryData = JSON.parse(fs.readFileSync(factoryPath, 'utf-8'));
  const factoryAddress = factoryData.factory;
  console.log("Factory:", factoryAddress);
  
  // Load IPFS CIDs
  const cidPath = path.join(__dirname, "../../../somnia-liquidity-manager/ethereal-visions-ipfs-cids.json");
  const cidData = JSON.parse(fs.readFileSync(cidPath, 'utf-8'));
  console.log(`\n📦 Found ${cidData.nfts.length} NFTs to deploy\n`);
  
  // Connect to factory
  const factory = await hre.ethers.getContractAt("MarketplaceNFTFactory", factoryAddress);
  
  // Check deployment fee
  const deploymentFee = await factory.deploymentFee();
  console.log("Deployment fee per NFT:", hre.ethers.formatEther(deploymentFee), "STT");
  
  // Prepare NFT data
  const nftDetails = [
    { 
      symbol: "COSMIC", 
      desc: "A breathtaking visualization of cosmic nebulae, where vibrant purples and blues dance across the digital canvas.",
      artist: "Aurora Chen"
    },
    { 
      symbol: "NEON", 
      desc: "An electrifying fusion of neon colors that pulse with digital energy, exploring the intersection of technology and art.",
      artist: "Marcus Rivera"
    },
    { 
      symbol: "QUANTUM", 
      desc: "A mesmerizing abstract piece that visualizes the mysterious phenomena of quantum entanglement.",
      artist: "Zara Nakamura"
    },
    { 
      symbol: "AURORA", 
      desc: "Inspired by the Northern Lights, this digital masterpiece recreates nature's most spectacular light show.",
      artist: "Elena Volkov"
    },
    { 
      symbol: "DREAM", 
      desc: "A hypnotic exploration of fluid dynamics in digital space, capturing the ephemeral nature of dreams.",
      artist: "Kai Thompson"
    }
  ];
  
  const names = [];
  const symbols = [];
  const cids = [];
  const descriptions = [];
  
  cidData.nfts.forEach((nft, index) => {
    names.push(nft.name);
    symbols.push(nftDetails[index].symbol);
    cids.push(nft.cid);
    descriptions.push(nftDetails[index].desc);
  });
  
  // Display what will be deployed
  console.log("📋 NFTs to Deploy:");
  console.log("-".repeat(60));
  names.forEach((name, i) => {
    console.log(`\n${i + 1}. ${name} (${symbols[i]})`);
    console.log(`   Artist: ${nftDetails[i].artist}`);
    console.log(`   CID: ${cids[i].substring(0, 20)}...`);
  });
  
  // Calculate total cost
  const totalCost = deploymentFee * BigInt(names.length);
  console.log(`\n💵 Total Cost: ${hre.ethers.formatEther(totalCost)} STT\n`);
  
  // Deploy all NFTs
  console.log("🚀 Deploying NFTs...");
  console.log("-".repeat(60));
  
  const tx = await factory.batchDeployNFTs(
    names,
    symbols,
    cids,
    descriptions,
    { value: totalCost }
  );
  
  console.log("📤 Transaction:", tx.hash);
  console.log("⏳ Waiting for confirmation...");
  
  const receipt = await tx.wait();
  console.log("✅ Confirmed in block:", receipt.blockNumber);
  
  // Get deployed NFT addresses
  const allNFTs = await factory.getAllNFTs();
  const deployedNFTs = allNFTs.slice(-names.length);
  
  console.log("\n📍 Deployed NFT Contracts:");
  console.log("-".repeat(60));
  
  const nftContracts = [];
  for (let i = 0; i < deployedNFTs.length; i++) {
    console.log(`\n${names[i]}:`);
    console.log(`   Contract: ${deployedNFTs[i]}`);
    console.log(`   Symbol: ${symbols[i]}`);
    console.log(`   Artist: ${nftDetails[i].artist}`);
    
    nftContracts.push({
      name: names[i],
      symbol: symbols[i],
      address: deployedNFTs[i],
      cid: cids[i],
      artist: nftDetails[i].artist,
      description: descriptions[i]
    });
  }
  
  // Save deployment info
  const deploymentPath = path.join(__dirname, "../../deployments/nft-addresses.json");
  fs.writeFileSync(deploymentPath, JSON.stringify({
    network: "somnia-testnet",
    factory: factoryAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    nfts: nftContracts
  }, null, 2));
  
  console.log("\n" + "=".repeat(60));
  console.log("✅ Deployment Complete!");
  console.log(`\n💾 Addresses saved to deployments/nft-addresses.json`);
  console.log("\n🔗 View on Explorer:");
  deployedNFTs.forEach((addr, i) => {
    console.log(`   ${names[i]}: https://explorer.somnia.network/address/${addr}`);
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });