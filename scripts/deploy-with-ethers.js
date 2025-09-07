#!/usr/bin/env node
/**
 * Deploy SimpleDEX using ethers directly (no Hardhat)
 */

import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const PRIVATE_KEY = "dfe9a1d1c29b40417ee15201f33240236c1750f4ce60fe32ba809a673ab24f99";
const RPC_URL = "https://dream-rpc.somnia.network";

// Load contract artifacts
const artifactsDir = path.join(__dirname, '..', 'artifacts');
const MockERC20 = JSON.parse(fs.readFileSync(path.join(artifactsDir, 'MockERC20.json'), 'utf8'));
const SimpleLiquidityPool = JSON.parse(fs.readFileSync(path.join(artifactsDir, 'SimpleLiquidityPool.json'), 'utf8'));

async function main() {
  console.log("🚀 Deploying SimpleDEX to Somnia Testnet...\n");

  // Connect to network
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  console.log("📱 Deploying from address:", wallet.address);

  // Check balance
  const balance = await provider.getBalance(wallet.address);
  console.log("💰 Balance:", ethers.formatEther(balance), "STT\n");

  if (balance === 0n) {
    console.log("❌ Insufficient balance. Get testnet STT from:");
    console.log("   https://somnia.faucetme.pro/");
    return;
  }

  try {
    // Deploy Mock WSOMI Token
    console.log("1️⃣  Deploying Mock WSOMI...");
    const MockERC20Factory = new ethers.ContractFactory(MockERC20.abi, MockERC20.bytecode, wallet);
    const wsomi = await MockERC20Factory.deploy("Wrapped SOMI", "WSOMI", 18);
    await wsomi.waitForDeployment();
    const wsomiAddress = await wsomi.getAddress();
    console.log("   ✅ WSOMI deployed at:", wsomiAddress);

    // Deploy Mock USDC Token
    console.log("2️⃣  Deploying Mock USDC...");
    const usdc = await MockERC20Factory.deploy("USD Coin", "USDC", 6);
    await usdc.waitForDeployment();
    const usdcAddress = await usdc.getAddress();
    console.log("   ✅ USDC deployed at:", usdcAddress);

    // Deploy SimpleLiquidityPool
    console.log("3️⃣  Deploying SimpleLiquidityPool...");
    const PoolFactory = new ethers.ContractFactory(SimpleLiquidityPool.abi, SimpleLiquidityPool.bytecode, wallet);
    const pool = await PoolFactory.deploy(wsomiAddress, usdcAddress);
    await pool.waitForDeployment();
    const poolAddress = await pool.getAddress();
    console.log("   ✅ Pool deployed at:", poolAddress);

    // Mint tokens to deployer for initial liquidity
    console.log("\n4️⃣  Minting initial tokens...");
    const mintTx1 = await wsomi.mint(wallet.address, ethers.parseEther("10000"));
    await mintTx1.wait();
    console.log("   ✅ Minted 10,000 WSOMI");

    const mintTx2 = await usdc.mint(wallet.address, ethers.parseUnits("10000", 6));
    await mintTx2.wait();
    console.log("   ✅ Minted 10,000 USDC");

    // Approve pool to spend tokens
    console.log("\n5️⃣  Approving token spending...");
    const approveTx1 = await wsomi.approve(poolAddress, ethers.MaxUint256);
    await approveTx1.wait();
    console.log("   ✅ WSOMI approved");

    const approveTx2 = await usdc.approve(poolAddress, ethers.MaxUint256);
    await approveTx2.wait();
    console.log("   ✅ USDC approved");

    // Add initial liquidity
    console.log("\n6️⃣  Adding initial liquidity...");
    const addLiquidityTx = await pool.addLiquidity(
      ethers.parseEther("1000"),      // 1000 WSOMI
      ethers.parseUnits("1000", 6)     // 1000 USDC
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
      deployer: wallet.address,
      rpc: RPC_URL
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
    
    console.log("\n🧪 Now test the DEX:");
    console.log("   npm run test:network");
    
    // Update the network config
    console.log("\n📝 Updating network configuration...");
    await updateNetworkConfig(wsomiAddress, usdcAddress, poolAddress);
    console.log("   ✅ Network config updated!");

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
}

async function updateNetworkConfig(wsomi, usdc, pool) {
  // Update the testnet config in memory
  const configPath = path.join(__dirname, '..', 'lib', 'config', 'networks.config.ts');
  let configContent = fs.readFileSync(configPath, 'utf8');
  
  // Update SimpleDEX addresses
  configContent = configContent.replace(
    /pool: '[^']*'/,
    `pool: '${pool}'`
  );
  configContent = configContent.replace(
    /wsomi: '[^']*'/,
    `wsomi: '${wsomi}'`
  );
  configContent = configContent.replace(
    /usdc: '[^']*'/,
    `usdc: '${usdc}'`
  );
  
  fs.writeFileSync(configPath, configContent);
}

main().catch(console.error);