const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying MarketplaceNFTFactory...\n");
  
  // Get deployer
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  
  // Get balance
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "STT\n");
  
  // Deploy factory
  const Factory = await hre.ethers.getContractFactory("MarketplaceNFTFactory");
  const factory = await Factory.deploy();
  
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  
  console.log("✅ Factory deployed to:", factoryAddress);
  console.log("🔗 Explorer:", `https://explorer.somnia.network/address/${factoryAddress}`);
  
  // Save deployment
  const fs = require("fs");
  const path = require("path");
  const deploymentPath = path.join(__dirname, "../../deployments/factory-address.json");
  
  // Create directory if it doesn't exist
  const dir = path.dirname(deploymentPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(deploymentPath, JSON.stringify({
    network: "somnia-testnet",
    factory: factoryAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString()
  }, null, 2));
  
  console.log("\n💾 Factory address saved to deployments/factory-address.json");
  
  return factoryAddress;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });