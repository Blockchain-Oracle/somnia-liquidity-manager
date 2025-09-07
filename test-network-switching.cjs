/**
 * Test Network Switching
 * Shows how easy it is to switch between mainnet and testnet
 */

const axios = require('axios');

const API_URL = 'http://localhost:3002/api/network';

async function testNetworkSwitching() {
  console.log('🔄 Testing Network Switching\n');
  console.log('=' . repeat(50));
  
  try {
    // 1. Check current status
    console.log('\n1️⃣  Current Network Status:');
    let response = await axios.get(`${API_URL}?action=status`);
    console.log(`   Network: ${response.data.network.toUpperCase()}`);
    console.log(`   Chain ID: ${response.data.chainId}`);
    console.log(`   Active DEX: ${response.data.activeDEX}`);
    console.log(`   Connected: ${response.data.isConnected ? '✅' : '❌'}`);
    console.log(`   Message: ${response.data.message}`);
    
    // 2. Show available contracts
    console.log('\n2️⃣  Contract Addresses:');
    response = await axios.get(`${API_URL}?action=contracts`);
    if (response.data.network === 'mainnet' && response.data.contracts.quickswap) {
      console.log('   QuickSwap Contracts (MAINNET):');
      console.log(`     Factory: ${response.data.contracts.quickswap.algebraFactory}`);
      console.log(`     Router: ${response.data.contracts.quickswap.swapRouter}`);
      console.log(`     NFT Manager: ${response.data.contracts.quickswap.nonfungiblePositionManager}`);
    } else if (response.data.network === 'testnet' && response.data.contracts.simpledex) {
      console.log('   SimpleDEX Contracts (TESTNET):');
      console.log(`     Pool: ${response.data.contracts.simpledex.pool || 'Not deployed'}`);
      console.log(`     WSOMI: ${response.data.contracts.simpledex.wsomi || 'Not deployed'}`);
      console.log(`     USDC: ${response.data.contracts.simpledex.usdc || 'Not deployed'}`);
    }
    
    // 3. Switch to testnet
    console.log('\n3️⃣  Switching to TESTNET...');
    response = await axios.get(`${API_URL}?action=switch&network=testnet`);
    console.log(`   ✅ ${response.data.message}`);
    console.log(`   Active DEX: ${response.data.activeDEX}`);
    console.log(`   RPC: ${response.data.rpcUrl}`);
    
    // 4. Check testnet pool
    console.log('\n4️⃣  Checking Testnet Pool:');
    response = await axios.get(`${API_URL}?action=pool`);
    if (response.data.success && response.data.data) {
      console.log(`   Pool found on ${response.data.dex}`);
      if (response.data.dex === 'simpledex') {
        console.log('   SimpleDEX is deployed and working!');
      } else if (response.data.dex === 'demo') {
        console.log('   Using demo mode (SimpleDEX not deployed)');
        console.log('   💡 Deploy SimpleDEX: npm run deploy:testnet');
      }
    }
    
    // 5. Switch to mainnet
    console.log('\n5️⃣  Switching to MAINNET...');
    response = await axios.get(`${API_URL}?action=switch&network=mainnet`);
    console.log(`   ✅ ${response.data.message}`);
    console.log(`   Active DEX: ${response.data.activeDEX}`);
    console.log(`   RPC: ${response.data.rpcUrl}`);
    
    // 6. Check mainnet pool
    console.log('\n6️⃣  Checking Mainnet Pool:');
    response = await axios.get(`${API_URL}?action=pool`);
    if (response.data.success) {
      console.log(`   Pool data from ${response.data.dex}`);
      if (response.data.dex === 'quickswap') {
        console.log('   ✅ QuickSwap is accessible on mainnet!');
      } else if (response.data.dex === 'demo') {
        console.log('   ⚠️ QuickSwap not accessible, using demo mode');
        console.log('   (This might be due to RPC connectivity)');
      }
    }
    
    console.log('\n' + '=' . repeat(50));
    console.log('✅ Network switching test complete!\n');
    
    console.log('📝 Summary:');
    console.log('- Mainnet → QuickSwap (Algebra V4)');
    console.log('- Testnet → SimpleDEX (Our implementation)');
    console.log('- No environment variables needed!');
    console.log('- Automatic fallback to demo mode\n');
    
  } catch (error) {
    if (error.response) {
      console.error('❌ API Error:', error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      console.error('❌ Server not running. Start with: npm run dev');
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

// Run test
testNetworkSwitching();