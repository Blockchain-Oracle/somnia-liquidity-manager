/**
 * Test script to verify Algebra pools are accessible
 */

import { algebraPoolsService } from '../lib/services/algebraPoolsService';

async function testPools() {
  console.log('Testing Algebra Pools Service...\n');
  
  // Test 1: Check if contracts are deployed
  console.log('1. Checking if contracts are deployed...');
  const deployed = await algebraPoolsService.areContractsDeployed();
  console.log(`   Contracts deployed: ${deployed}\n`);
  
  if (!deployed) {
    console.error('ERROR: Contracts not deployed. Check factory address.');
    return;
  }
  
  // Test 2: Get all pools
  console.log('2. Fetching all pools...');
  const allPools = await algebraPoolsService.getAllPools();
  console.log(`   Found ${allPools.length} pools\n`);
  
  // Test 3: Display pool details
  if (allPools.length > 0) {
    console.log('3. Pool Details:');
    allPools.forEach((pool, index) => {
      console.log(`\n   Pool ${index + 1}:`);
      console.log(`   - Pair: ${pool.token0.symbol}/${pool.token1.symbol}`);
      console.log(`   - Address: ${pool.address}`);
      console.log(`   - Liquidity: ${pool.liquidity}`);
      console.log(`   - TVL: $${pool.tvlUSD.toFixed(2)}`);
      console.log(`   - Fee: ${pool.fee} bps`);
      console.log(`   - APR: ${pool.apr.toFixed(2)}%`);
    });
  } else {
    console.log('   No pools found - this might be an issue with the factory address or pool discovery.');
  }
  
  // Test 4: Test specific known pool
  console.log('\n4. Testing known WSOMI/USDC pool...');
  const knownPoolAddress = '0xe5467Be8B8Db6B074904134E8C1a581F5565E2c3';
  const poolInfo = await algebraPoolsService.getPoolInfo(knownPoolAddress as any);
  
  if (poolInfo) {
    console.log('   Successfully fetched known pool info:');
    console.log(`   - ${poolInfo.token0.symbol}/${poolInfo.token1.symbol}`);
    console.log(`   - TVL: $${poolInfo.tvlUSD.toFixed(2)}`);
  } else {
    console.log('   ERROR: Could not fetch known pool info');
  }
  
  console.log('\n✅ Test complete!');
}

// Run the test
testPools().catch(console.error);