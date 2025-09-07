#!/usr/bin/env node

/**
 * Backend Test Script
 * Tests all API endpoints and services
 * Run: node test-backend.js
 */

const axios = require('axios');

// Configuration
const API_BASE = 'http://localhost:3000/api';
const TEST_WALLET = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb9'; // Example address
const TEST_TOKEN0 = '0x0000000000000000000000000000000000000001';
const TEST_TOKEN1 = '0x0000000000000000000000000000000000000002';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

// Test results
let passed = 0;
let failed = 0;

/**
 * Test a single endpoint
 */
async function testEndpoint(name, method, endpoint, data = null, params = {}) {
  try {
    console.log(`\n${colors.blue}Testing: ${name}${colors.reset}`);
    console.log(`  ${method} ${endpoint}`);
    
    const config = {
      method,
      url: `${API_BASE}${endpoint}`,
      params,
      data,
      timeout: 10000,
    };

    const response = await axios(config);
    
    if (response.data.success !== false) {
      console.log(`  ${colors.green}✓ Success${colors.reset}`);
      console.log(`  Response:`, JSON.stringify(response.data, null, 2).slice(0, 200));
      passed++;
      return response.data;
    } else {
      console.log(`  ${colors.red}✗ Failed: ${response.data.error}${colors.reset}`);
      failed++;
      return null;
    }
  } catch (error) {
    console.log(`  ${colors.red}✗ Error: ${error.message}${colors.reset}`);
    if (error.response) {
      console.log(`  Status: ${error.response.status}`);
      console.log(`  Data:`, error.response.data);
    }
    failed++;
    return null;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log(`
╔══════════════════════════════════════════════════╗
║   Somnia Liquidity Manager - Backend Tests      ║
╚══════════════════════════════════════════════════╝
  `);

  // Test 1: Pool endpoints
  console.log(`\n${colors.yellow}=== POOL ENDPOINTS ===${colors.reset}`);
  
  await testEndpoint(
    'Get Pool Info',
    'GET',
    '/pools',
    null,
    { token0: TEST_TOKEN0, token1: TEST_TOKEN1, network: 'testnet' }
  );

  // Test 2: Position endpoints
  console.log(`\n${colors.yellow}=== POSITION ENDPOINTS ===${colors.reset}`);
  
  await testEndpoint(
    'Get User Positions',
    'GET',
    '/positions',
    null,
    { address: TEST_WALLET, network: 'testnet' }
  );

  await testEndpoint(
    'Get Position by Token ID',
    'GET',
    '/positions',
    null,
    { tokenId: '1', network: 'testnet' }
  );

  // Test 3: Price endpoints
  console.log(`\n${colors.yellow}=== PRICE ENDPOINTS ===${colors.reset}`);
  
  await testEndpoint(
    'Get Aggregated Prices',
    'GET',
    '/prices',
    null,
    { symbol: 'BTC/USDT', aggregated: 'true' }
  );

  await testEndpoint(
    'Get Price from Binance',
    'GET',
    '/prices',
    null,
    { symbol: 'ETH/USDT', exchange: 'binance' }
  );

  await testEndpoint(
    'Check Arbitrage Opportunity',
    'POST',
    '/prices',
    { symbol: 'ETH/USDT', dexPrice: 3000, minProfitPercent: 0.5 }
  );

  // Test 4: Historical price data
  console.log(`\n${colors.yellow}=== HISTORICAL PRICE DATA ===${colors.reset}`);
  
  await testEndpoint(
    'Get Historical Prices',
    'GET',
    '/prices/history',
    null,
    { symbol: 'BTC/USDT', timeframe: '1h', limit: 24, volatility: 'true' }
  );

  // Test 5: AI Analysis endpoints
  console.log(`\n${colors.yellow}=== AI ANALYSIS ===${colors.reset}`);
  
  await testEndpoint(
    'Get Optimal Range',
    'GET',
    '/ai/analyze',
    null,
    { token0: TEST_TOKEN0, token1: TEST_TOKEN1, network: 'testnet', timeframe: '24h' }
  );

  const mockPosition = {
    tokenId: '1',
    token0: TEST_TOKEN0,
    token1: TEST_TOKEN1,
    tickLower: -887220,
    tickUpper: 887220,
    liquidity: '1000000000000000000',
    tokensOwed0: '100000000000000',
    tokensOwed1: '200000000000000',
    feeGrowthInside0LastX128: '0',
    feeGrowthInside1LastX128: '0',
  };

  await testEndpoint(
    'Analyze Position with AI',
    'POST',
    '/ai/analyze',
    {
      position: mockPosition,
      token0: TEST_TOKEN0,
      token1: TEST_TOKEN1,
      network: 'testnet',
      marketData: {
        volatility: 'medium',
        trend: 'bullish',
        volume24h: 1000000,
        priceChange24h: 2.5,
      }
    }
  );

  // Test 6: Management endpoints
  console.log(`\n${colors.yellow}=== MANAGEMENT ENDPOINTS ===${colors.reset}`);
  
  await testEndpoint(
    'Analyze All Positions',
    'POST',
    '/manage',
    {
      action: 'analyze_all',
      userAddress: TEST_WALLET,
      strategy: 'balanced',
      network: 'testnet',
      includeMarketData: false,
    }
  );

  await testEndpoint(
    'Analyze Single Position',
    'POST',
    '/manage',
    {
      action: 'analyze_position',
      position: mockPosition,
      strategy: 'aggressive',
      network: 'testnet',
      includeMarketData: true,
    }
  );

  // Test 7: Error handling
  console.log(`\n${colors.yellow}=== ERROR HANDLING ===${colors.reset}`);
  
  await testEndpoint(
    'Invalid Pool Request',
    'GET',
    '/pools',
    null,
    { network: 'testnet' } // Missing required tokens
  );

  await testEndpoint(
    'Invalid Position Request',
    'GET',
    '/positions',
    null,
    {} // Missing required params
  );

  // Summary
  console.log(`\n${colors.yellow}${'='.repeat(50)}${colors.reset}`);
  console.log(`${colors.blue}TEST SUMMARY:${colors.reset}`);
  console.log(`${colors.green}  Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}  Failed: ${failed}${colors.reset}`);
  console.log(`  Total: ${passed + failed}`);
  
  if (failed === 0) {
    console.log(`\n${colors.green}✅ All tests passed!${colors.reset}`);
  } else {
    console.log(`\n${colors.red}❌ Some tests failed${colors.reset}`);
  }

  console.log(`\n${colors.yellow}Note:${colors.reset} Some tests may fail due to:`);
  console.log('  - Somnia testnet RPC not accessible');
  console.log('  - No actual positions on testnet');
  console.log('  - CEX API rate limits');
  console.log('  - Missing OpenAI API key for AI features');
  
  process.exit(failed > 0 ? 1 : 0);
}

// Check if server is running
async function checkServer() {
  try {
    await axios.get(API_BASE.replace('/api', ''));
    return true;
  } catch (error) {
    console.log(`${colors.red}Error: Next.js server is not running${colors.reset}`);
    console.log(`Please run: ${colors.green}npm run dev${colors.reset}`);
    return false;
  }
}

// Main
async function main() {
  const serverRunning = await checkServer();
  if (!serverRunning) {
    process.exit(1);
  }
  
  await runTests();
}

// Run tests
main().catch(console.error);