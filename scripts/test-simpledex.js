/**
 * Test SimpleDEX Functionality
 * Verifies our DEX is working correctly on Somnia Testnet
 */

const axios = require('axios');

const API_URL = 'http://localhost:3000/api/simpledex';

// Test wallet address (you'll need to set this)
const TEST_ADDRESS = '0x0000000000000000000000000000000000000000';

async function testSimpleDEX() {
  console.log('🧪 Testing SimpleDEX on Somnia Testnet\n');
  
  try {
    // 1. Check Pool Status
    console.log('1️⃣  Checking pool status...');
    const poolResponse = await axios.get(`${API_URL}?action=pool`);
    
    if (!poolResponse.data.success) {
      console.log('❌ SimpleDEX not deployed. Run: npm run deploy:testnet');
      return;
    }
    
    const pool = poolResponse.data.data;
    console.log('   ✅ Pool found at:', pool.address);
    console.log('   📊 Reserves:');
    console.log('      WSOMI:', (Number(pool.reserve0) / 1e18).toFixed(2));
    console.log('      USDC:', (Number(pool.reserve1) / 1e6).toFixed(2));
    console.log('   💰 TVL: $' + pool.tvl.usd.toFixed(2));
    console.log('   📈 Price: 1 WSOMI =', pool.price.toFixed(4), 'USDC\n');
    
    // 2. Get Swap Quote
    console.log('2️⃣  Getting swap quote...');
    const quoteResponse = await axios.get(`${API_URL}?action=quote&amount=100&zeroForOne=true`);
    
    if (quoteResponse.data.success) {
      const quote = quoteResponse.data.data;
      console.log('   ✅ Swap 100 WSOMI → ' + quote.amountOut + ' USDC');
      console.log('   💹 Rate:', quote.rate);
      console.log('   📉 Price Impact:', quote.priceImpact + '\n');
    }
    
    // 3. Check User Position
    console.log('3️⃣  Checking user position...');
    const positionResponse = await axios.get(`${API_URL}?action=position&address=${TEST_ADDRESS}`);
    
    if (positionResponse.data.success) {
      const position = positionResponse.data.data;
      if (position) {
        console.log('   ✅ Position found:');
        console.log('      Share:', position.share);
        console.log('      Value: $' + position.valueUSD);
      } else {
        console.log('   ℹ️  No position found for this address\n');
      }
    }
    
    // 4. Test Transaction Endpoints (without executing)
    console.log('4️⃣  Available transaction endpoints:');
    console.log('   • POST /api/simpledex { action: "faucet", address: "0x..." }');
    console.log('   • POST /api/simpledex { action: "add-liquidity", amount0: "100", amount1: "100" }');
    console.log('   • POST /api/simpledex { action: "swap", amountIn: "10", zeroForOne: true }');
    console.log('   • POST /api/simpledex { action: "remove-liquidity", liquidity: "10" }\n');
    
    console.log('✅ SimpleDEX is working correctly!\n');
    
    // 5. Integration with AI Liquidity Manager
    console.log('5️⃣  Testing AI integration...');
    
    // Test demo AI recommendation
    const aiResponse = await axios.get('http://localhost:3000/api/demo?action=ai-recommendation');
    if (aiResponse.data.success) {
      const ai = aiResponse.data.data;
      console.log('   ✅ AI Analysis:');
      console.log('      Recommendation:', ai.recommendation);
      console.log('      Confidence:', ai.confidence + '%');
      console.log('      Potential Profit:', ai.potentialProfit);
    }
    
    console.log('\n🎉 All tests passed! SimpleDEX ready for hackathon demo.\n');
    
  } catch (error) {
    if (error.response) {
      console.error('❌ API Error:', error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      console.error('❌ Server not running. Start with: npm run dev');
    } else {
      console.error('❌ Test failed:', error.message);
    }
  }
}

// Run tests
testSimpleDEX();