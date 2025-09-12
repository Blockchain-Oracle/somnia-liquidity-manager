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
    
    // Deploy Mock ERC20 Tokens
    console.log('1️⃣  Deploying Mock Tokens...');
    const MockERC20Factory = new ethers.ContractFactory(MockERC20.abi, MockERC20.bytecode, wallet);
    
    // Deploy Test WETH
    const tWETH = await MockERC20Factory.deploy("Test Wrapped Ether", "tWETH", 18);
    await tWETH.waitForDeployment();
    const tWETHAddress = await tWETH.getAddress();
    console.log('   ✅ tWETH deployed at:', tWETHAddress);
    
    // Deploy Test USDC
    const tUSDC = await MockERC20Factory.deploy("Test USD Coin", "tUSDC", 6);
    await tUSDC.waitForDeployment();
    const tUSDCAddress = await tUSDC.getAddress();
    console.log('   ✅ tUSDC deployed at:', tUSDCAddress);
    
    // Deploy Test USDT
    const tUSDT = await MockERC20Factory.deploy("Test Tether USD", "tUSDT", 6);
    await tUSDT.waitForDeployment();
    const tUSDTAddress = await tUSDT.getAddress();
    console.log('   ✅ tUSDT deployed at:', tUSDTAddress);
    
    // Use existing WSOMI on testnet as STT
    const STT_ADDRESS = "0x001Da752ACD5e96077Ac5Cd757dC9ebAd109210A"; // WSOMI on testnet
    console.log('   ℹ️  Using STT (WSOMI) at:', STT_ADDRESS);
    
    // Deploy Liquidity Pools
    console.log('\n2️⃣  Deploying Liquidity Pools...');
    const SimplePoolFactory = new ethers.ContractFactory(SimpleLiquidityPool.abi, SimpleLiquidityPool.bytecode, wallet);
    
    // STT/tWETH Pool
    const sttWethPool = await SimplePoolFactory.deploy(STT_ADDRESS, tWETHAddress);
    await sttWethPool.waitForDeployment();
    const sttWethPoolAddress = await sttWethPool.getAddress();
    console.log('   ✅ STT/tWETH Pool at:', sttWethPoolAddress);
    
    // STT/tUSDC Pool
    const sttUsdcPool = await SimplePoolFactory.deploy(STT_ADDRESS, tUSDCAddress);
    await sttUsdcPool.waitForDeployment();
    const sttUsdcPoolAddress = await sttUsdcPool.getAddress();
    console.log('   ✅ STT/tUSDC Pool at:', sttUsdcPoolAddress);
    
    // STT/tUSDT Pool
    const sttUsdtPool = await SimplePoolFactory.deploy(STT_ADDRESS, tUSDTAddress);
    await sttUsdtPool.waitForDeployment();
    const sttUsdtPoolAddress = await sttUsdtPool.getAddress();
    console.log('   ✅ STT/tUSDT Pool at:', sttUsdtPoolAddress);
    
    // tWETH/tUSDC Pool
    const wethUsdcPool = await SimplePoolFactory.deploy(tWETHAddress, tUSDCAddress);
    await wethUsdcPool.waitForDeployment();
    const wethUsdcPoolAddress = await wethUsdcPool.getAddress();
    console.log('   ✅ tWETH/tUSDC Pool at:', wethUsdcPoolAddress);
    
    // tWETH/tUSDT Pool
    const wethUsdtPool = await SimplePoolFactory.deploy(tWETHAddress, tUSDTAddress);
    await wethUsdtPool.waitForDeployment();
    const wethUsdtPoolAddress = await wethUsdtPool.getAddress();
    console.log('   ✅ tWETH/tUSDT Pool at:', wethUsdtPoolAddress);
    
    // tUSDC/tUSDT Pool
    const usdcUsdtPool = await SimplePoolFactory.deploy(tUSDCAddress, tUSDTAddress);
    await usdcUsdtPool.waitForDeployment();
    const usdcUsdtPoolAddress = await usdcUsdtPool.getAddress();
    console.log('   ✅ tUSDC/tUSDT Pool at:', usdcUsdtPoolAddress);
    
    // Mint tokens to deployer for initial liquidity
    console.log('\n3️⃣  Minting initial tokens...');
    await tWETH.mint(wallet.address, ethers.parseEther("10000"));
    console.log('   ✅ Minted 10,000 tWETH');
    
    await tUSDC.mint(wallet.address, ethers.parseUnits("100000", 6));
    console.log('   ✅ Minted 100,000 tUSDC');
    
    await tUSDT.mint(wallet.address, ethers.parseUnits("100000", 6));
    console.log('   ✅ Minted 100,000 tUSDT');
    
    // Note: For STT, users need to get it from faucet or wrap native STT
    console.log('   ℹ️  Get STT from: https://somnia.faucetme.pro/');
    
    // Optional: Add initial liquidity if you have STT
    console.log('\n📝 Note: To add initial liquidity, run:');
    console.log('   pnpm run init-pools');
    
    // Save deployment addresses
    const deployment = {
      network: 'somnia-testnet',
      chainId: CHAIN_ID,
      timestamp: new Date().toISOString(),
      tokens: {
        STT: STT_ADDRESS,
        tWETH: tWETHAddress,
        tUSDC: tUSDCAddress,
        tUSDT: tUSDTAddress
      },
      pools: {
        'STT/tWETH': sttWethPoolAddress,
        'STT/tUSDC': sttUsdcPoolAddress,
        'STT/tUSDT': sttUsdtPoolAddress,
        'tWETH/tUSDC': wethUsdcPoolAddress,
        'tWETH/tUSDT': wethUsdtPoolAddress,
        'tUSDC/tUSDT': usdcUsdtPoolAddress
      },
      deployer: wallet.address
    };
    
    const deploymentPath = path.join(__dirname, '..', 'deployments', 'testnet.json');
    fs.mkdirSync(path.dirname(deploymentPath), { recursive: true });
    fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
    
    console.log('\n✅ Deployment Complete!');
    console.log('📄 Deployment info saved to:', deploymentPath);
    console.log('\n🎯 Tokens:');
    Object.entries(deployment.tokens).forEach(([name, addr]) => {
      console.log(`   ${name}: ${addr}`);
    });
    console.log('\n🏊 Pools:');
    Object.entries(deployment.pools).forEach(([name, addr]) => {
      console.log(`   ${name}: ${addr}`);
    });
    
    console.log('\n🧪 Next Steps:');
    console.log('   1. Get STT from faucet: https://somnia.faucetme.pro/');
    console.log('   2. Call faucet() on token contracts to get test tokens');
    console.log('   3. Test the DEX in the UI');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  }
}

// Run deployment
deployContracts();