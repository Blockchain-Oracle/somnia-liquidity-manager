const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying NFT Marketplace...\n");
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deployer:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Balance:", hre.ethers.formatEther(balance), "STT\n");

  // Deploy NFT Marketplace
  console.log("📦 Deploying SommiaNFTMarketplace...");
  const Marketplace = await hre.ethers.getContractFactory("SommiaNFTMarketplace");
  const marketplace = await Marketplace.deploy(deployer.address);
  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();
  console.log("✅ Marketplace deployed to:", marketplaceAddress);

  // Configure marketplace
  console.log("\n⚙️  Configuring marketplace...");
  const tx = await marketplace.setPlatformFeeBps(250); // 2.5% fee
  await tx.wait();
  console.log("✅ Platform fee set to 2.5%");

  // Save deployment
  const deploymentPath = path.join(__dirname, "../../deployments/marketplace-address.json");
  fs.writeFileSync(deploymentPath, JSON.stringify({
    network: "somnia-testnet",
    marketplace: marketplaceAddress,
    deployer: deployer.address,
    platformFee: "2.5%",
    timestamp: new Date().toISOString()
  }, null, 2));

  console.log("\n💾 Marketplace address saved");
  console.log("🔗 Explorer: https://explorer.somnia.network/address/" + marketplaceAddress);
  
  return marketplaceAddress;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });