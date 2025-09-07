/**
 * Deploy SimpleDEX to Somnia Testnet using Hardhat
 */

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying SimpleDEX to Somnia Testnet...\n");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📱 Deploying from address:", deployer.address);

  // Check balance
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("💰 Balance:", hre.ethers.formatEther(balance), "STT\n");

  if (balance === 0n) {
    console.log("❌ Insufficient balance. Get testnet STT from:");
    console.log("   https://somnia.faucetme.pro/");
    return;
  }

  // Deploy Mock WSOMI Token
  console.log("1️⃣  Deploying Mock WSOMI...");
  const MockERC20 = await hre.ethers.getContractFactory("MockERC20");
  const wsomi = await MockERC20.deploy("Wrapped SOMI", "WSOMI", 18);
  await wsomi.waitForDeployment();
  const wsomiAddress = await wsomi.getAddress();
  console.log("   ✅ WSOMI deployed at:", wsomiAddress);

  // Deploy Mock USDC Token
  console.log("2️⃣  Deploying Mock USDC...");
  const usdc = await MockERC20.deploy("USD Coin", "USDC", 6);
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  console.log("   ✅ USDC deployed at:", usdcAddress);

  // Deploy SimpleLiquidityPool
  console.log("3️⃣  Deploying SimpleLiquidityPool...");
  const SimpleLiquidityPool = await hre.ethers.getContractFactory("SimpleLiquidityPool");
  const pool = await SimpleLiquidityPool.deploy(wsomiAddress, usdcAddress);
  await pool.waitForDeployment();
  const poolAddress = await pool.getAddress();
  console.log("   ✅ Pool deployed at:", poolAddress);

  // Mint tokens to deployer for initial liquidity
  console.log("\n4️⃣  Minting initial tokens...");
  const mintTx1 = await wsomi.mint(deployer.address, hre.ethers.parseEther("10000"));
  await mintTx1.wait();
  console.log("   ✅ Minted 10,000 WSOMI");

  const mintTx2 = await usdc.mint(deployer.address, hre.ethers.parseUnits("10000", 6));
  await mintTx2.wait();
  console.log("   ✅ Minted 10,000 USDC");

  // Approve pool to spend tokens
  console.log("\n5️⃣  Approving token spending...");
  const approveTx1 = await wsomi.approve(poolAddress, hre.ethers.MaxUint256);
  await approveTx1.wait();
  console.log("   ✅ WSOMI approved");

  const approveTx2 = await usdc.approve(poolAddress, hre.ethers.MaxUint256);
  await approveTx2.wait();
  console.log("   ✅ USDC approved");

  // Add initial liquidity
  console.log("\n6️⃣  Adding initial liquidity...");
  const addLiquidityTx = await pool.addLiquidity(
    hre.ethers.parseEther("1000"),      // 1000 WSOMI
    hre.ethers.parseUnits("1000", 6)     // 1000 USDC
  );
  await addLiquidityTx.wait();
  console.log("   ✅ Added 1000 WSOMI / 1000 USDC liquidity");

  // Save deployment addresses
  const deployment = {
    network: "somnia-testnet",
    chainId: 50312,
    timestamp: new Date().toISOString(),
    contracts: {
      wsomi: wsomiAddress,
      usdc: usdcAddress,
      pool: poolAddress
    },
    deployer: deployer.address,
    rpc: "https://dream-rpc.somnia.network"
  };

  const deploymentPath = path.join(__dirname, "..", "deployments", "testnet.json");
  fs.mkdirSync(path.dirname(deploymentPath), { recursive: true });
  fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));

  console.log("\n✅ Deployment Complete!");
  console.log("📄 Deployment info saved to:", deploymentPath);
  console.log("\n🎯 Contract Addresses:");
  console.log("   WSOMI:", wsomiAddress);
  console.log("   USDC:", usdcAddress);
  console.log("   Pool:", poolAddress);
  
  console.log("\n🧪 Test the DEX:");
  console.log("   npm run test:dex");
  console.log("   npm run test:network");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });