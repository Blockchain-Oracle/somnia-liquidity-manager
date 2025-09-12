#!/usr/bin/env ts-node

/**
 * Script to discover all available DIA Oracle price feeds on Somnia
 */

import { createPublicClient, http, parseAbi, type Address } from 'viem';

// Somnia Mainnet configuration
const SOMNIA_RPC = 'https://dream-rpc.somnia.network';

// DIA Oracle contract
const DIA_ORACLE = '0xbA0E0750A56e995506CA458b2BdD752754CF39C4' as Address;

// Known DIA price feed adapters on Somnia
const KNOWN_ADAPTERS = {
  'USDT': '0x936C4F07fD4d01485849ee0EE2Cdcea2373ba267',
  'USDC': '0x5D4266f4DD721c1cD8367FEb23E4940d17C83C93',
};

// Official token addresses on Somnia
const SOMNIA_TOKENS = {
  'WSOMI': '0x046EDe9564A72571df6F5e44d0405360c0f4dCab',
  'USDC': '0x28bec7e30e6faee657a03e19bf1128aad7632a00',
  'WETH': '0x936Ab8C674bcb567CD5dEB85D8A216494704E9D8',
  'USDT': '0x67B302E35Aef5EEE8c32D934F5856869EF428330',
};

// DIA Oracle ABI
const DIA_ORACLE_ABI = parseAbi([
  'function getValue(string memory key) external view returns (uint128 value, uint128 timestamp)',
  'function owner() external view returns (address)',
]);

// AggregatorV3Interface ABI for price adapters
const AGGREGATOR_V3_ABI = parseAbi([
  'function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)',
  'function decimals() external view returns (uint8)',
  'function description() external view returns (string)',
]);

async function main() {
  console.log('🔍 Discovering DIA Oracle Price Feeds on Somnia Mainnet\n');
  console.log('='.repeat(60));
  
  const client = createPublicClient({
    transport: http(SOMNIA_RPC),
  });

  // Test known adapters
  console.log('\n📊 Testing Known Price Feed Adapters:\n');
  for (const [symbol, address] of Object.entries(KNOWN_ADAPTERS)) {
    try {
      const [latestData, decimals] = await Promise.all([
        client.readContract({
          address: address as Address,
          abi: AGGREGATOR_V3_ABI,
          functionName: 'latestRoundData',
        }) as Promise<[bigint, bigint, bigint, bigint, bigint]>,
        client.readContract({
          address: address as Address,
          abi: AGGREGATOR_V3_ABI,
          functionName: 'decimals',
        }) as Promise<number>,
      ]);

      const [, answer, , updatedAt] = latestData;
      const price = Number(answer) / Math.pow(10, decimals);
      const updateTime = new Date(Number(updatedAt) * 1000).toLocaleString();

      console.log(`✅ ${symbol.padEnd(6)} | ${address} | $${price.toFixed(2)} | Updated: ${updateTime}`);
    } catch (error) {
      console.log(`❌ ${symbol.padEnd(6)} | ${address} | Failed to fetch`);
    }
  }

  // Try common price pairs on the main oracle
  console.log('\n📈 Testing Direct Oracle Price Pairs:\n');
  const testPairs = [
    'ETH/USD',
    'WETH/USD',
    'SOMI/USD',
    'WSOMI/USD',
    'USDC/USD',
    'USDT/USD',
  ];

  for (const pair of testPairs) {
    try {
      const result = await client.readContract({
        address: DIA_ORACLE,
        abi: DIA_ORACLE_ABI,
        functionName: 'getValue',
        args: [pair],
      }) as [bigint, bigint];

      const [value, timestamp] = result;
      const price = Number(value) / 1e8; // DIA uses 8 decimals
      const updateTime = new Date(Number(timestamp) * 1000).toLocaleString();

      if (price > 0) {
        console.log(`✅ ${pair.padEnd(10)} | Price: $${price.toFixed(4)} | Updated: ${updateTime}`);
      } else {
        console.log(`⚠️  ${pair.padEnd(10)} | No data (price = 0)`);
      }
    } catch (error) {
      console.log(`❌ ${pair.padEnd(10)} | Not available`);
    }
  }

  // Test different key formats
  console.log('\n🔧 Testing Alternative Key Formats:\n');
  const alternativeKeys = [
    'Crypto.ETH/USD',
    'Crypto.WETH/USD',
    'Crypto.SOMI/USD',
    'ETH',
    'WETH',
    'SOMI',
    'ETHEREUM/USD',
    'SOMNIA/USD',
  ];

  for (const key of alternativeKeys) {
    try {
      const result = await client.readContract({
        address: DIA_ORACLE,
        abi: DIA_ORACLE_ABI,
        functionName: 'getValue',
        args: [key],
      }) as [bigint, bigint];

      const [value, timestamp] = result;
      const price = Number(value) / 1e8;

      if (price > 0) {
        console.log(`✅ "${key}" | Price: $${price.toFixed(4)}`);
      }
    } catch (error) {
      // Silently skip if not found
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n📝 Summary:');
  console.log('\nOfficial Token Addresses on Somnia:');
  for (const [symbol, address] of Object.entries(SOMNIA_TOKENS)) {
    console.log(`  ${symbol.padEnd(6)} : ${address}`);
  }

  console.log('\nDIA Oracle Address:', DIA_ORACLE);
  console.log('\n💡 Note: WETH and WSOMI may not have direct price feeds.');
  console.log('   We can derive their prices from ETH and SOMI if those exist,');
  console.log('   or use the adapter pattern with Chainlink-compatible interfaces.');
}

main().catch(console.error);