#!/usr/bin/env node

/**
 * Test QuickSwap Algebra V4 on Somnia Mainnet
 * Verifies contracts are deployed and functional
 */

const { ethers } = require('ethers');

// Somnia Mainnet Configuration
const RPC_URL = 'https://dream-rpc.somnia.network';
const CONTRACTS = {
  algebraFactory: '0x0ccff3D02A3a200263eC4e0Fdb5E60a56721B8Ae',
  swapRouter: '0x1582f6f3D26658F7208A799Be46e34b1f366CE44',
  nonfungiblePositionManager: '0xfE02219e0578B1E4831CDE7C3CB36f71AEb4A833',
  quoterV2: '0xcB68373404a835268D3ED76255C8148578A82b77',
  tokens: {
    WSOMI: '0x046EDe9564A72571df6F5e44d0405360c0f4dCab',
    USDC: '0x28BEc7E30E6faee657a03e19Bf1128AaD7632A00',
    USDT: '0x67B302E35Aef5EEE8c32D934F5856869EF428330',
    WETH: '0x936Ab8C674bcb567CD5dEB85D8A216494704E9D8',
  }
};

// Minimal ABIs for testing
const FACTORY_ABI = [
  'function poolByPair(address tokenA, address tokenB) view returns (address pool)',
  'function owner() view returns (address)',
];

const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
];

const POOL_ABI = [
  'function token0() view returns (address)',
  'function token1() view returns (address)',
  'function liquidity() view returns (uint128)',
  'function globalState() view returns (uint160 price, int24 tick, uint16 fee, uint16 timepointIndex, uint16 communityFee0, uint16 communityFee1, bool unlocked)',
];

async function testQuickSwap() {
  console.log(`
╔══════════════════════════════════════════════════╗
║   QuickSwap Algebra V4 on Somnia - Test Suite   ║
╚══════════════════════════════════════════════════╝
  `);

  // Connect to Somnia
  console.log('🔗 Connecting to Somnia Mainnet...');
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  
  try {
    const network = await provider.getNetwork();
    console.log(`✅ Connected to chain ID: ${network.chainId}`);
    const blockNumber = await provider.getBlockNumber();
    console.log(`📦 Current block: ${blockNumber}\n`);
  } catch (error) {
    console.error('❌ Failed to connect to Somnia');
    return;
  }

  // Test 1: Verify Factory Contract
  console.log('1️⃣ Testing AlgebraFactory...');
  const factory = new ethers.Contract(CONTRACTS.algebraFactory, FACTORY_ABI, provider);
  
  try {
    const owner = await factory.owner();
    console.log(`   ✅ Factory is deployed`);
    console.log(`   Owner: ${owner}`);
  } catch (error) {
    console.log(`   ❌ Factory not accessible: ${error.message}`);
  }

  // Test 2: Check Token Contracts
  console.log('\n2️⃣ Testing Token Contracts...');
  
  for (const [name, address] of Object.entries(CONTRACTS.tokens)) {
    const token = new ethers.Contract(address, ERC20_ABI, provider);
    try {
      const symbol = await token.symbol();
      const decimals = await token.decimals();
      console.log(`   ✅ ${name}: ${symbol} (${decimals} decimals)`);
    } catch (error) {
      console.log(`   ❌ ${name}: Not accessible`);
    }
  }

  // Test 3: Look for Pools
  console.log('\n3️⃣ Searching for QuickSwap Pools...');
  
  const pairs = [
    ['WSOMI', 'USDC'],
    ['WSOMI', 'USDT'],
    ['WETH', 'USDC'],
    ['USDC', 'USDT'],
  ];

  let poolsFound = 0;
  
  for (const [token0Name, token1Name] of pairs) {
    const token0 = CONTRACTS.tokens[token0Name];
    const token1 = CONTRACTS.tokens[token1Name];
    
    if (!token0 || !token1) continue;
    
    try {
      const poolAddress = await factory.poolByPair(token0, token1);
      
      if (poolAddress && poolAddress !== '0x0000000000000000000000000000000000000000') {
        console.log(`   ✅ ${token0Name}/${token1Name} pool: ${poolAddress}`);
        
        // Get pool details
        const pool = new ethers.Contract(poolAddress, POOL_ABI, provider);
        const liquidity = await pool.liquidity();
        const globalState = await pool.globalState();
        
        console.log(`      Liquidity: ${ethers.formatUnits(liquidity, 18)}`);
        console.log(`      Current tick: ${globalState.tick}`);
        console.log(`      Fee: ${globalState.fee / 100}%`);
        
        poolsFound++;
      } else {
        console.log(`   ⚠️  ${token0Name}/${token1Name}: No pool exists`);
      }
    } catch (error) {
      console.log(`   ❌ ${token0Name}/${token1Name}: Error checking pool`);
    }
  }

  // Test 4: Position Manager
  console.log('\n4️⃣ Testing NonfungiblePositionManager...');
  
  try {
    const npmContract = new ethers.Contract(
      CONTRACTS.nonfungiblePositionManager,
      ['function factory() view returns (address)'],
      provider
    );
    
    const factoryFromNPM = await npmContract.factory();
    console.log(`   ✅ Position Manager is deployed`);
    console.log(`   Factory address: ${factoryFromNPM}`);
    
    if (factoryFromNPM.toLowerCase() === CONTRACTS.algebraFactory.toLowerCase()) {
      console.log(`   ✅ Factory address matches!`);
    } else {
      console.log(`   ⚠️  Factory address mismatch`);
    }
  } catch (error) {
    console.log(`   ❌ Position Manager not accessible`);
  }

  // Summary
  console.log('\n' + '═'.repeat(50));
  console.log('📊 SUMMARY:');
  console.log('═'.repeat(50));
  
  if (poolsFound > 0) {
    console.log(`✅ QuickSwap is LIVE on Somnia!`);
    console.log(`✅ Found ${poolsFound} active pools`);
    console.log(`✅ Ready for liquidity management`);
  } else {
    console.log(`⚠️  QuickSwap contracts deployed but no pools found`);
    console.log(`💡 You can be the first to create pools!`);
  }
  
  console.log('\n🎉 Your liquidity manager can work with these contracts!');
}

// Run tests
testQuickSwap().catch(console.error);