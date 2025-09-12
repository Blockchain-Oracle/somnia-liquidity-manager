/**
 * Initialize Liquidity for Testnet Pools
 * This script adds initial liquidity to all deployed pools
 */

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Load deployment data
const deploymentPath = path.join(__dirname, '..', 'deployments', 'testnet.json');
if (!fs.existsSync(deploymentPath)) {
  console.error('❌ No deployment found. Run: pnpm run deploy:testnet first');
  process.exit(1);
}

const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));

// Somnia Testnet Configuration
const TESTNET_RPC = 'https://dream-rpc.somnia.network';

// SimpleLiquidityPool ABI
const POOL_ABI = [
  {
    "inputs": [
      { "internalType": "uint256", "name": "amount0", "type": "uint256" },
      { "internalType": "uint256", "name": "amount1", "type": "uint256" }
    ],
    "name": "addLiquidity",
    "outputs": [
      { "internalType": "uint256", "name": "liquidity", "type": "uint256" }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "reserve0",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "reserve1",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
];

// ERC20 ABI for approvals and minting
const ERC20_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "spender", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "approve",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "to", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "mint",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }],
    "stateMutability": "view",
    "type": "function"
  }
];

// Initial liquidity amounts (in human readable format)
const INITIAL_LIQUIDITY = {
  'STT/tWETH': { token0: '1000', token1: '0.5' },      // 1000 STT : 0.5 WETH (~$2000 ratio)
  'STT/tUSDC': { token0: '1000', token1: '2000' },     // 1000 STT : 2000 USDC ($2 per STT)
  'STT/tUSDT': { token0: '1000', token1: '2000' },     // 1000 STT : 2000 USDT ($2 per STT)
  'tWETH/tUSDC': { token0: '1', token1: '4000' },      // 1 WETH : 4000 USDC ($4000 per ETH)
  'tWETH/tUSDT': { token0: '1', token1: '4000' },      // 1 WETH : 4000 USDT ($4000 per ETH)
  'tUSDC/tUSDT': { token0: '10000', token1: '10000' }  // 10000 USDC : 10000 USDT (1:1 stable)
};

async function initializeLiquidity() {
  try {
    console.log('🚀 Initializing Liquidity for Testnet Pools...\n');
    
    // Setup provider and signer
    const provider = new ethers.JsonRpcProvider(TESTNET_RPC);
    
    // Check if we have a private key
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      console.log('⚠️  No PRIVATE_KEY found in environment');
      console.log('Please set PRIVATE_KEY in .env file');
      return;
    }
    
    const wallet = new ethers.Wallet(privateKey, provider);
    console.log('📱 Adding liquidity from address:', wallet.address);
    
    // Check balance
    const balance = await provider.getBalance(wallet.address);
    console.log('💰 Balance:', ethers.formatEther(balance), 'STT\n');
    
    // Process each pool
    for (const [pairName, poolAddress] of Object.entries(deployment.pools)) {
      console.log(`\n📊 Processing ${pairName} Pool...`);
      
      // Get token addresses
      const [token0Symbol, token1Symbol] = pairName.split('/');
      const token0Address = deployment.tokens[token0Symbol];
      const token1Address = deployment.tokens[token1Symbol];
      
      if (!token0Address || !token1Address) {
        console.log(`   ❌ Token addresses not found for ${pairName}`);
        continue;
      }
      
      // Get pool contract
      const poolContract = new ethers.Contract(poolAddress, POOL_ABI, wallet);
      
      // Check current reserves
      const reserve0 = await poolContract.reserve0();
      const reserve1 = await poolContract.reserve1();
      
      if (reserve0 > 0n || reserve1 > 0n) {
        console.log(`   ℹ️  Pool already has liquidity:`);
        console.log(`      Reserve0: ${ethers.formatUnits(reserve0, 18)}`);
        console.log(`      Reserve1: ${ethers.formatUnits(reserve1, 18)}`);
        continue;
      }
      
      // Get liquidity amounts
      const liquidityConfig = INITIAL_LIQUIDITY[pairName];
      if (!liquidityConfig) {
        console.log(`   ⚠️  No liquidity config for ${pairName}`);
        continue;
      }
      
      // Get token contracts
      const token0Contract = new ethers.Contract(token0Address, ERC20_ABI, wallet);
      const token1Contract = new ethers.Contract(token1Address, ERC20_ABI, wallet);
      
      // Get decimals
      const decimals0 = token0Symbol === 'STT' ? 18 : await token0Contract.decimals();
      const decimals1 = token1Symbol === 'STT' ? 18 : await token1Contract.decimals();
      
      // Convert amounts to wei
      const amount0 = ethers.parseUnits(liquidityConfig.token0, decimals0);
      const amount1 = ethers.parseUnits(liquidityConfig.token1, decimals1);
      
      console.log(`   💧 Adding liquidity: ${liquidityConfig.token0} ${token0Symbol} + ${liquidityConfig.token1} ${token1Symbol}`);
      
      // Mint tokens if needed (for test tokens)
      if (token0Symbol !== 'STT') {
        const balance0 = await token0Contract.balanceOf(wallet.address);
        if (balance0 < amount0) {
          console.log(`   🪙  Minting ${liquidityConfig.token0} ${token0Symbol}...`);
          const mintTx = await token0Contract.mint(wallet.address, amount0);
          await mintTx.wait();
        }
      }
      
      if (token1Symbol !== 'STT') {
        const balance1 = await token1Contract.balanceOf(wallet.address);
        if (balance1 < amount1) {
          console.log(`   🪙  Minting ${liquidityConfig.token1} ${token1Symbol}...`);
          const mintTx = await token1Contract.mint(wallet.address, amount1);
          await mintTx.wait();
        }
      }
      
      // Approve tokens (both tokens need approval regardless of type)
      console.log(`   ✅ Approving tokens...`);
      
      // Token0 approval
      console.log(`      Approving ${token0Symbol}...`);
      const approveTx0 = await token0Contract.approve(poolAddress, ethers.MaxUint256);
      await approveTx0.wait();
      console.log(`      ✓ ${token0Symbol} approved`);
      
      // Token1 approval  
      console.log(`      Approving ${token1Symbol}...`);
      const approveTx1 = await token1Contract.approve(poolAddress, ethers.MaxUint256);
      await approveTx1.wait();
      console.log(`      ✓ ${token1Symbol} approved`);
      
      // Add liquidity
      console.log(`   💉 Adding liquidity to pool...`);
      const addLiquidityTx = await poolContract.addLiquidity(amount0, amount1);
      const receipt = await addLiquidityTx.wait();
      
      console.log(`   ✅ Liquidity added! Tx: ${receipt.hash}`);
      
      // Verify new reserves
      const newReserve0 = await poolContract.reserve0();
      const newReserve1 = await poolContract.reserve1();
      console.log(`   📊 New reserves:`);
      console.log(`      ${token0Symbol}: ${ethers.formatUnits(newReserve0, decimals0)}`);
      console.log(`      ${token1Symbol}: ${ethers.formatUnits(newReserve1, decimals1)}`);
    }
    
    console.log('\n✅ Liquidity initialization complete!');
    console.log('\n🎯 Next steps:');
    console.log('   1. Users can now trade on these pools');
    console.log('   2. Users can add/remove liquidity');
    console.log('   3. Test the DEX in the UI');
    
  } catch (error) {
    console.error('❌ Initialization failed:', error);
    process.exit(1);
  }
}

// Run initialization
initializeLiquidity();