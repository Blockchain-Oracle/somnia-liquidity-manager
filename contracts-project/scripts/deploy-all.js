const hre = require("hardhat");

async function main() {
  console.log("🚀 Starting deployment to Somnia Testnet...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "STT\n");

  // 1. Deploy NFT Marketplace
  console.log("1️⃣ Deploying SommiaNFTMarketplace...");
  const Marketplace = await hre.ethers.getContractFactory("SommiaNFTMarketplace");
  const marketplace = await Marketplace.deploy(deployer.address);
  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();
  console.log("✅ Marketplace deployed to:", marketplaceAddress);

  // Configure marketplace
  console.log("   ⚙️  Setting platform fee to 2.5%...");
  const tx1 = await marketplace.setPlatformFeeBps(250);
  await tx1.wait();
  console.log("   ✅ Platform fee configured\n");

  // 2. Deploy NFT Factory
  console.log("2️⃣ Deploying SommiaNFTFactory...");
  const Factory = await hre.ethers.getContractFactory("SommiaNFTFactory");
  const factory = await Factory.deploy();
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("✅ Factory deployed to:", factoryAddress, "\n");

  // 3. Deploy a sample NFT collection
  console.log("3️⃣ Creating sample NFT collection...");
  const tx2 = await factory.deployCollection(
    "Somnia Dreams",
    "DREAM",
    "QmSampleCollectionCID",
    100,
    hre.ethers.parseEther("0.001")
  );
  const receipt = await tx2.wait();
  
  // Get the deployed collection address from events
  const event = receipt.logs.find(log => {
    try {
      const parsed = factory.interface.parseLog(log);
      return parsed?.name === 'CollectionDeployed';
    } catch { return false; }
  });
  
  let sampleNFTAddress = "Not found";
  if (event) {
    const parsed = factory.interface.parseLog(event);
    sampleNFTAddress = parsed.args[0];
    console.log("✅ Sample NFT collection deployed to:", sampleNFTAddress);
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📋 DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));
  console.log("🏪 Marketplace Address:", marketplaceAddress);
  console.log("🏭 Factory Address:", factoryAddress);
  console.log("🎨 Sample NFT Address:", sampleNFTAddress);
  console.log("🌐 Network: Somnia Testnet (Chain ID: 50312)");
  console.log("🔍 Explorer: https://shannon-explorer.somnia.network/");
  console.log("=".repeat(60));
  
  // Save deployment addresses
  const fs = require('fs');
  const deploymentInfo = {
    network: "somnia-testnet",
    chainId: 50312,
    timestamp: new Date().toISOString(),
    contracts: {
      marketplace: marketplaceAddress,
      factory: factoryAddress,
      sampleNFT: sampleNFTAddress
    },
    deployer: deployer.address,
    explorer: "https://shannon-explorer.somnia.network/"
  };
  
  fs.writeFileSync(
    './deployment-addresses.json',
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("\n💾 Deployment addresses saved to deployment-addresses.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });