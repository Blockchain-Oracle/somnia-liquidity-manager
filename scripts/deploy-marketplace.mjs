import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("🚀 Deploying Sommia NFT Marketplace...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Deploy Marketplace
  console.log("📦 Deploying SommiaNFTMarketplace...");
  const Marketplace = await hre.ethers.getContractFactory("SommiaNFTMarketplace");
  const marketplace = await Marketplace.deploy(deployer.address);
  await marketplace.waitForDeployment();
  
  const marketplaceAddress = await marketplace.getAddress();
  console.log("✅ Marketplace deployed to:", marketplaceAddress);

  // Configure marketplace
  console.log("\n⚙️  Configuring marketplace...");
  
  // Set platform fee to 2.5% (250 basis points)
  const setPlatformFeeTx = await marketplace.setPlatformFeeBps(250);
  await setPlatformFeeTx.wait();
  console.log("✅ Platform fee set to 2.5%");
  
  // Keep listing fee at 0 for hackathon
  // Keep cancel refund at 0 (no refunds on cancel)
  console.log("✅ Listing fee: 0 (free listings)");
  console.log("✅ Cancel refund: 0% (no refunds)");

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    marketplace: {
      address: marketplaceAddress,
      deployer: deployer.address,
      deployedAt: new Date().toISOString(),
      config: {
        platformFeeBps: 250,
        listingFeeWei: "0",
        cancelRefundBps: 0,
        feeRecipient: deployer.address
      }
    }
  };

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentPath = path.join(deploymentsDir, `marketplace-${hre.network.name}.json`);
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  
  console.log("\n📝 Deployment info saved to:", deploymentPath);
  console.log("\n🎉 Marketplace deployment complete!");
  console.log("\n📍 Contract Addresses:");
  console.log("   Marketplace:", marketplaceAddress);
  
  // Verify on explorer if not local
  if (hre.network.name !== "localhost" && hre.network.name !== "hardhat") {
    console.log("\n🔍 Waiting for block confirmations before verification...");
    await marketplace.deploymentTransaction().wait(5);
    
    console.log("Verifying contract on explorer...");
    try {
      await hre.run("verify:verify", {
        address: marketplaceAddress,
        constructorArguments: [deployer.address],
      });
      console.log("✅ Contract verified on explorer");
    } catch (error) {
      console.log("⚠️  Verification failed:", error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });