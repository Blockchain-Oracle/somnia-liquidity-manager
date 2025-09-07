/**
 * Deploy SimpleDEX and Mock Tokens to Somnia Testnet
 * For Hackathon Demo
 */

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Somnia Testnet Configuration
const TESTNET_RPC = 'https://dream-rpc.somnia.network';
const CHAIN_ID = 50312;

// Load compiled contracts
function loadContract(name) {
  const artifactPath = path.join(__dirname, '..', 'artifacts', `${name}.json`);
  if (!fs.existsSync(artifactPath)) {
    throw new Error(`Contract ${name} not compiled. Run: npm run compile`);
  }
  return JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
}

const MockERC20 = loadContract('MockERC20');
const SimpleLiquidityPool = loadContract('SimpleLiquidityPool');

async function deployContracts() {
  try {
    console.log('🚀 Deploying to Somnia Testnet...\n');
    
    // Setup provider and signer
    const provider = new ethers.JsonRpcProvider(TESTNET_RPC);
    
    // Check if we have a private key
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      console.log('⚠️  No PRIVATE_KEY found in environment');
      console.log('Please set PRIVATE_KEY in .env file');
      console.log('You can get testnet STT from: https://somnia.faucetme.pro/');
      return;
    }
    
    const wallet = new ethers.Wallet(privateKey, provider);
    console.log('📱 Deploying from address:', wallet.address);
    
    // Check balance
    const balance = await provider.getBalance(wallet.address);
    console.log('💰 Balance:', ethers.formatEther(balance), 'STT\n');
    
    if (balance === 0n) {
      console.log('❌ Insufficient balance. Get testnet STT from:');
      console.log('   https://somnia.faucetme.pro/');
      return;
    }
    
    // Deploy Mock WSOMI Token
    console.log('1️⃣  Deploying Mock WSOMI...');
    const MockERC20Factory = new ethers.ContractFactory(MockERC20.abi, MockERC20.bytecode, wallet);
    const wsomi = await MockERC20Factory.deploy("Wrapped SOMI", "WSOMI", 18);
    await wsomi.waitForDeployment();
    const wsomiAddress = await wsomi.getAddress();
    console.log('   ✅ WSOMI deployed at:', wsomiAddress);
    
    // Deploy Mock USDC Token
    console.log('2️⃣  Deploying Mock USDC...');
    const usdc = await MockERC20Factory.deploy("USD Coin", "USDC", 6);
    await usdc.waitForDeployment();
    const usdcAddress = await usdc.getAddress();
    console.log('   ✅ USDC deployed at:', usdcAddress);
    
    // Deploy SimpleLiquidityPool
    console.log('3️⃣  Deploying SimpleLiquidityPool...');
    const SimplePoolFactory = new ethers.ContractFactory(SimpleLiquidityPool.abi, SimpleLiquidityPool.bytecode, wallet);
    const pool = await SimplePoolFactory.deploy(wsomiAddress, usdcAddress);
    await pool.waitForDeployment();
    const poolAddress = await pool.getAddress();
    console.log('   ✅ Pool deployed at:', poolAddress);
    
    // Mint tokens to deployer for initial liquidity
    console.log('\n4️⃣  Minting initial tokens...');
    await wsomi.mint(wallet.address, ethers.parseEther("10000"));
    console.log('   ✅ Minted 10,000 WSOMI');
    
    await usdc.mint(wallet.address, ethers.parseUnits("10000", 6));
    console.log('   ✅ Minted 10,000 USDC');
    
    // Approve pool to spend tokens
    console.log('\n5️⃣  Approving token spending...');
    await wsomi.approve(poolAddress, ethers.MaxUint256);
    console.log('   ✅ WSOMI approved');
    
    await usdc.approve(poolAddress, ethers.MaxUint256);
    console.log('   ✅ USDC approved');
    
    // Add initial liquidity
    console.log('\n6️⃣  Adding initial liquidity...');
    await pool.addLiquidity(
      ethers.parseEther("1000"),      // 1000 WSOMI
      ethers.parseUnits("1000", 6)    // 1000 USDC
    );
    console.log('   ✅ Added 1000 WSOMI / 1000 USDC liquidity');
    
    // Save deployment addresses
    const deployment = {
      network: 'somnia-testnet',
      chainId: CHAIN_ID,
      timestamp: new Date().toISOString(),
      contracts: {
        wsomi: wsomiAddress,
        usdc: usdcAddress,
        pool: poolAddress
      },
      deployer: wallet.address
    };
    
    const deploymentPath = path.join(__dirname, '..', 'deployments', 'testnet.json');
    fs.mkdirSync(path.dirname(deploymentPath), { recursive: true });
    fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
    
    console.log('\n✅ Deployment Complete!');
    console.log('📄 Deployment info saved to:', deploymentPath);
    console.log('\n🎯 Contract Addresses:');
    console.log('   WSOMI:', wsomiAddress);
    console.log('   USDC:', usdcAddress);
    console.log('   Pool:', poolAddress);
    
    console.log('\n🧪 Test the DEX:');
    console.log('   npm run test:dex');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  }
}

// Run deployment
deployContracts();