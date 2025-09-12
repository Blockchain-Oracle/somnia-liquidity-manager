#!/usr/bin/env node

/**
 * Test script for price service
 * Run with: node scripts/test-price-service.js
 */

import { priceService } from '../lib/services/priceService.js';
import { diaOracleService } from '../lib/services/diaOracle.service.js';

console.log('=====================================');
console.log('Testing Price Services');
console.log('=====================================\n');

async function testDiaOracle() {
  console.log('1. Testing DIA Oracle Service');
  console.log('-----------------------------');
  
  const tokens = ['ETH', 'BTC', 'USDC', 'USDT'];
  
  for (const token of tokens) {
    console.log(`\nTesting ${token}:`);
    const price = await diaOracleService.getPrice(token);
    console.log('Result:', price);
  }
}

async function testPriceService() {
  console.log('\n2. Testing Price Service (Current Prices)');
  console.log('------------------------------------------');
  
  const tokens = ['ETH', 'BTC', 'USDC'];
  
  for (const token of tokens) {
    console.log(`\nTesting ${token}:`);
    const price = await priceService.getCurrentPrice(token);
    console.log('Result:', price);
  }
}

async function testOHLCData() {
  console.log('\n3. Testing OHLC Data');
  console.log('--------------------');
  
  console.log('\nFetching ETH OHLC data (1 day):');
  const ohlcData = await priceService.getOHLCData('ETH', 1);
  console.log(`Received ${ohlcData.length} candles`);
  console.log('First candle:', ohlcData[0]);
  console.log('Last candle:', ohlcData[ohlcData.length - 1]);
}

async function main() {
  try {
    await testDiaOracle();
    await testPriceService();
    await testOHLCData();
    
    console.log('\n=====================================');
    console.log('All tests completed!');
    console.log('=====================================');
  } catch (error) {
    console.error('Test failed:', error);
  }
  
  process.exit(0);
}

main();