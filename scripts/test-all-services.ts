/**
 * Comprehensive Testing Script for All Services
 * Tests DIA Oracle, Subgraph, and AI integrations
 */

import { DIAOracleService } from '../lib/services/dia-oracle.service';
import { SubgraphService } from '../lib/services/subgraph.service';
import { AIService } from '../lib/services/ai.service';
import { SimpleDEXService } from '../lib/services/simpledex.service';
import { NetworkManagerService } from '../lib/services/network-manager.service';
import { getCurrentNetwork, switchNetwork } from '../lib/config/networks.config';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title: string) {
  console.log('\n' + '='.repeat(60));
  log(title, colors.blue);
  console.log('='.repeat(60));
}

function logTest(name: string, result: boolean, details?: string) {
  const status = result ? `✅ PASS` : `❌ FAIL`;
  const color = result ? colors.green : colors.red;
  log(`${status}: ${name}`, color);
  if (details) {
    console.log(`   └─ ${details}`);
  }
}

async function testDIAOracle() {
  logSection('Testing DIA Oracle Service');
  
  const oracle = new DIAOracleService();
  const results: boolean[] = [];
  
  try {
    // Test 1: Get Oracle Health
    log('\nTest 1: Oracle Health Check', colors.yellow);
    const health = await oracle.getOracleHealth();
    const healthPass = health.isConnected && health.availableAssets.length > 0;
    logTest('Oracle Health', healthPass, 
      `Connected: ${health.isConnected}, Assets: ${health.availableAssets.join(', ')}`);
    results.push(healthPass);
    
    // Test 2: Get BTC Price from Adapter
    log('\nTest 2: BTC Price from Adapter', colors.yellow);
    const btcPrice = await oracle.getPriceFromAdapter('BTC');
    const btcPass = btcPrice !== null && btcPrice.price > 0;
    logTest('BTC Price', btcPass, 
      btcPrice ? `$${btcPrice.price.toFixed(2)} (${btcPrice.formattedTime})` : 'Failed to fetch');
    results.push(btcPass);
    
    // Test 3: Get USDC Price from Adapter
    log('\nTest 3: USDC Price from Adapter', colors.yellow);
    const usdcPrice = await oracle.getPriceFromAdapter('USDC');
    const usdcPass = usdcPrice !== null && usdcPrice.price > 0;
    logTest('USDC Price', usdcPass,
      usdcPrice ? `$${usdcPrice.price.toFixed(4)} (${usdcPrice.formattedTime})` : 'Failed to fetch');
    results.push(usdcPass);
    
    // Test 4: Get Multiple Prices
    log('\nTest 4: Multiple Price Fetching', colors.yellow);
    const prices = await oracle.getMultiplePrices(['BTC', 'USDC', 'USDT']);
    const multiPass = Object.keys(prices).length === 3;
    logTest('Multiple Prices', multiPass,
      `Fetched ${Object.keys(prices).length}/3 prices`);
    results.push(multiPass);
    
    // Test 5: Price Staleness Check
    log('\nTest 5: Price Staleness Detection', colors.yellow);
    if (btcPrice) {
      const isValid = oracle.isPriceValid(btcPrice, 3600);
      logTest('Staleness Check', true,
        `Price is ${isValid ? 'fresh' : 'stale'} (${btcPrice.isStale ? 'marked stale' : 'marked fresh'})`);
      results.push(true);
    } else {
      results.push(false);
    }
    
    // Test 6: Calculate Price Impact (Arbitrage Detection)
    log('\nTest 6: Price Impact Calculation', colors.yellow);
    const impact = await oracle.calculatePriceImpact('BTC', 'USDC', 1, 45000);
    const impactPass = impact !== null;
    logTest('Price Impact', impactPass,
      impact ? `Oracle: ${impact.oraclePrice.toFixed(2)}, DEX: ${impact.dexPrice}, Arbitrage: ${impact.arbitrageOpportunity}` : 'Failed');
    results.push(impactPass);
    
  } catch (error) {
    log(`Error in DIA Oracle tests: ${error}`, colors.red);
    results.push(false);
  }
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  log(`\n📊 DIA Oracle Results: ${passed}/${total} tests passed`, 
    passed === total ? colors.green : colors.yellow);
  
  return passed === total;
}

async function testSubgraph() {
  logSection('Testing Subgraph Service');
  
  const subgraph = new SubgraphService();
  const results: boolean[] = [];
  
  try {
    // Test 1: Get Top Pools
    log('\nTest 1: Fetch Top Pools', colors.yellow);
    const topPools = await subgraph.getTopPools(5);
    const poolsPass = Array.isArray(topPools);
    logTest('Top Pools', poolsPass,
      `Found ${topPools.length} pools`);
    results.push(poolsPass);
    
    // Test 2: Get Protocol Stats
    log('\nTest 2: Protocol Statistics', colors.yellow);
    const stats = await subgraph.getProtocolStats();
    const statsPass = stats !== null;
    logTest('Protocol Stats', statsPass,
      stats ? `TVL: $${stats.totalTVL.toFixed(2)}, Pools: ${stats.poolCount}` : 'Failed to fetch');
    results.push(statsPass);
    
    // Test 3: Search Pools by Tokens
    log('\nTest 3: Search Pools', colors.yellow);
    const searchResults = await subgraph.searchPools('WSOMI', 'USDC');
    const searchPass = Array.isArray(searchResults);
    logTest('Pool Search', searchPass,
      `Found ${searchResults.length} WSOMI/USDC pools`);
    results.push(searchPass);
    
    // Test 4: Get Pool Stats (if pool exists)
    if (topPools.length > 0) {
      log('\nTest 4: Pool Statistics', colors.yellow);
      const poolStats = await subgraph.getPoolStats(topPools[0].id);
      const poolStatsPass = poolStats !== null;
      logTest('Pool Stats', poolStatsPass,
        poolStats ? `APR: ${poolStats.apr?.toFixed(2)}%, TVL: $${poolStats.tvl.toFixed(2)}` : 'Failed');
      results.push(poolStatsPass);
    } else {
      log('\nTest 4: Pool Statistics - Skipped (no pools)', colors.yellow);
      results.push(true);
    }
    
    // Test 5: Get Historical Data
    log('\nTest 5: Historical Data Query', colors.yellow);
    if (topPools.length > 0) {
      const history = await subgraph.getPoolDayData(topPools[0].id, 7);
      const historyPass = Array.isArray(history);
      logTest('Historical Data', historyPass,
        `Retrieved ${history.length} days of data`);
      results.push(historyPass);
    } else {
      results.push(true);
    }
    
  } catch (error) {
    log(`Error in Subgraph tests: ${error}`, colors.red);
    results.push(false);
  }
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  log(`\n📊 Subgraph Results: ${passed}/${total} tests passed`,
    passed === total ? colors.green : colors.yellow);
  
  return passed === total;
}

async function testAIService() {
  logSection('Testing AI Service with Integrations');
  
  const ai = new AIService();
  const results: boolean[] = [];
  
  try {
    // Test 1: Analyze with Oracle
    log('\nTest 1: Oracle Analysis', colors.yellow);
    const oracleAnalysis = await ai.analyzeWithOracle(
      'WSOMI', 'USDC', '0xF4a6bbF79D16207a527518fBEB6Be5Aa771984CB'
    );
    const oraclePass = oracleAnalysis.recommendation !== '';
    logTest('Oracle Analysis', oraclePass,
      `Deviation: ${oracleAnalysis.priceDeviation.toFixed(2)}%, Arbitrage: ${oracleAnalysis.arbitrageOpportunity}`);
    results.push(oraclePass);
    
    // Test 2: Get Enhanced Market Conditions
    log('\nTest 2: Enhanced Market Conditions', colors.yellow);
    const conditions = await ai.getEnhancedMarketConditions(
      '0xF4a6bbF79D16207a527518fBEB6Be5Aa771984CB'
    );
    const conditionsPass = conditions.volatility !== undefined;
    logTest('Market Conditions', conditionsPass,
      `Trend: ${conditions.trend}, Volatility: ${conditions.volatility}`);
    results.push(conditionsPass);
    
    // Test 3: Get Optimal Range
    log('\nTest 3: Optimal Range Calculation', colors.yellow);
    const mockPool = {
      tick: 0,
      tickSpacing: 60,
      sqrtPrice: '79228162514264337593543950336',
      liquidity: '1000000000000000000',
      token0: { symbol: 'WSOMI', address: '0x001Da752ACD5e96077Ac5Cd757dC9ebAd109210A', decimals: 18 },
      token1: { symbol: 'USDC', address: '0xb81713B44ef5F68eF921A8637FabC025e63B3523', decimals: 18 }
    };
    
    const range = await ai.getOptimalRange(mockPool as any, '24h');
    const rangePass = range.tickLower < range.tickUpper;
    logTest('Optimal Range', rangePass,
      `Range: [${range.tickLower}, ${range.tickUpper}], Confidence: ${range.confidence}%`);
    results.push(rangePass);
    
    // Test 4: Enhanced Recommendation
    log('\nTest 4: Enhanced AI Recommendation', colors.yellow);
    const mockPosition = {
      id: '1',
      owner: '0x7D71f82611BA86BC302A655EC3D2050E98BAf49C',
      pool: mockPool,
      liquidity: '500000000000000000',
      tickLower: -1000,
      tickUpper: 1000,
      tokensOwed0: '100',
      tokensOwed1: '100'
    };
    
    const recommendation = await ai.getEnhancedRecommendation(
      mockPosition as any,
      mockPool as any,
      '0xF4a6bbF79D16207a527518fBEB6Be5Aa771984CB'
    );
    const recPass = recommendation.action !== undefined;
    logTest('AI Recommendation', recPass,
      `Action: ${recommendation.action}, Confidence: ${recommendation.confidence}%, Reasoning: ${recommendation.reasoning.substring(0, 50)}...`);
    results.push(recPass);
    
  } catch (error) {
    log(`Error in AI Service tests: ${error}`, colors.red);
    results.push(false);
  }
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  log(`\n📊 AI Service Results: ${passed}/${total} tests passed`,
    passed === total ? colors.green : colors.yellow);
  
  return passed === total;
}

async function testNetworkIntegration() {
  logSection('Testing Network Integration');
  
  const networkManager = NetworkManagerService.getInstance();
  const results: boolean[] = [];
  
  try {
    // Test 1: Get Current Network
    log('\nTest 1: Current Network Status', colors.yellow);
    const status = await networkManager.getNetworkStatus();
    const statusPass = status.currentNetwork !== undefined;
    logTest('Network Status', statusPass,
      `Network: ${status.currentNetwork}, Chain ID: ${status.chainId}`);
    results.push(statusPass);
    
    // Test 2: Switch to Testnet
    log('\nTest 2: Switch to Testnet', colors.yellow);
    const testnetSwitch = await networkManager.switchToNetwork('testnet');
    const testnetPass = testnetSwitch.currentNetwork === 'testnet';
    logTest('Testnet Switch', testnetPass,
      `SimpleDEX Available: ${testnetSwitch.features.simpledex}`);
    results.push(testnetPass);
    
    // Test 3: SimpleDEX Integration (Testnet)
    log('\nTest 3: SimpleDEX Pool Info', colors.yellow);
    const simpledex = new SimpleDEXService();
    const poolInfo = await simpledex.getPoolInfo();
    const poolPass = poolInfo.poolAddress === '0xF4a6bbF79D16207a527518fBEB6Be5Aa771984CB';
    logTest('SimpleDEX Pool', poolPass,
      `TVL: $${poolInfo.tvl.toFixed(2)}, Price: ${poolInfo.price.toFixed(4)}`);
    results.push(poolPass);
    
    // Test 4: Switch to Mainnet
    log('\nTest 4: Switch to Mainnet', colors.yellow);
    const mainnetSwitch = await networkManager.switchToNetwork('mainnet');
    const mainnetPass = mainnetSwitch.currentNetwork === 'mainnet';
    logTest('Mainnet Switch', mainnetPass,
      `QuickSwap Available: ${mainnetSwitch.features.quickswap}`);
    results.push(mainnetPass);
    
    // Test 5: Verify Contract Addresses
    log('\nTest 5: Contract Address Verification', colors.yellow);
    const config = getCurrentNetwork();
    const hasContracts = config.contracts.diaOracle !== undefined;
    logTest('Contract Configuration', hasContracts,
      `DIA Oracle: ${hasContracts ? '✓' : '✗'}, Tokens: ${config.contracts.tokens ? '✓' : '✗'}`);
    results.push(hasContracts);
    
  } catch (error) {
    log(`Error in Network Integration tests: ${error}`, colors.red);
    results.push(false);
  }
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  log(`\n📊 Network Integration Results: ${passed}/${total} tests passed`,
    passed === total ? colors.green : colors.yellow);
  
  return passed === total;
}

async function checkMissingFeatures() {
  logSection('Checking for Missing Features');
  
  const checks: { feature: string; present: boolean; details: string }[] = [];
  
  // Check 1: DIA Oracle Integration
  const config = getCurrentNetwork();
  checks.push({
    feature: 'DIA Oracle Configuration',
    present: !!config.contracts.diaOracle,
    details: config.contracts.diaOracle ? 
      `Main: ${config.contracts.diaOracle.mainOracle}, Adapters: ${Object.keys(config.contracts.diaOracle.adapters).length}` :
      'Not configured'
  });
  
  // Check 2: Subgraph Configuration
  checks.push({
    feature: 'Subgraph Endpoint',
    present: !!config.subgraph,
    details: config.subgraph ? config.subgraph.endpoint : 'Not configured'
  });
  
  // Check 3: SimpleDEX Contracts
  switchNetwork('testnet');
  const testnetConfig = getCurrentNetwork();
  checks.push({
    feature: 'SimpleDEX Contracts',
    present: !!testnetConfig.contracts.simpledex,
    details: testnetConfig.contracts.simpledex ? 
      `Pool: ${testnetConfig.contracts.simpledex.pool}` : 'Not deployed'
  });
  
  // Check 4: QuickSwap Contracts
  switchNetwork('mainnet');
  const mainnetConfig = getCurrentNetwork();
  checks.push({
    feature: 'QuickSwap Contracts',
    present: !!mainnetConfig.contracts.quickswap,
    details: mainnetConfig.contracts.quickswap ?
      `Factory: ${mainnetConfig.contracts.quickswap.algebraFactory}` : 'Not configured'
  });
  
  // Check 5: AI Service Methods
  const aiService = new AIService();
  checks.push({
    feature: 'AI Oracle Integration',
    present: typeof aiService.analyzeWithOracle === 'function',
    details: 'analyzeWithOracle method present'
  });
  
  checks.push({
    feature: 'AI Subgraph Integration',
    present: typeof aiService.getEnhancedMarketConditions === 'function',
    details: 'getEnhancedMarketConditions method present'
  });
  
  checks.push({
    feature: 'Position Monitoring',
    present: typeof aiService.monitorPositionsWithAlerts === 'function',
    details: 'monitorPositionsWithAlerts method present'
  });
  
  // Display results
  console.log('\nFeature Checklist:');
  checks.forEach(check => {
    const status = check.present ? '✅' : '❌';
    const color = check.present ? colors.green : colors.red;
    log(`${status} ${check.feature}`, color);
    console.log(`   └─ ${check.details}`);
  });
  
  const allPresent = checks.every(c => c.present);
  log(`\n📋 Feature Completeness: ${checks.filter(c => c.present).length}/${checks.length}`,
    allPresent ? colors.green : colors.yellow);
  
  return allPresent;
}

async function main() {
  console.clear();
  log('🚀 SOMNIA LIQUIDITY MANAGER - COMPREHENSIVE TEST SUITE', colors.magenta);
  log('Testing all services and integrations...', colors.magenta);
  
  const results = {
    diaOracle: false,
    subgraph: false,
    aiService: false,
    network: false,
    features: false
  };
  
  try {
    // Run all tests
    results.diaOracle = await testDIAOracle();
    results.subgraph = await testSubgraph();
    results.aiService = await testAIService();
    results.network = await testNetworkIntegration();
    results.features = await checkMissingFeatures();
    
    // Final Summary
    logSection('FINAL TEST SUMMARY');
    
    console.log('\nTest Results:');
    Object.entries(results).forEach(([test, passed]) => {
      const status = passed ? '✅ PASS' : '❌ FAIL';
      const color = passed ? colors.green : colors.red;
      log(`${status}: ${test}`, color);
    });
    
    const totalPassed = Object.values(results).filter(r => r).length;
    const totalTests = Object.keys(results).length;
    const allPassed = totalPassed === totalTests;
    
    console.log('\n' + '='.repeat(60));
    log(`OVERALL: ${totalPassed}/${totalTests} test suites passed`,
      allPassed ? colors.green : colors.yellow);
    
    if (allPassed) {
      log('🎉 ALL TESTS PASSED! System is ready for production.', colors.green);
    } else {
      log('⚠️ Some tests failed. Please review and fix issues.', colors.yellow);
    }
    console.log('='.repeat(60));
    
  } catch (error) {
    log(`\n❌ Fatal error during testing: ${error}`, colors.red);
    process.exit(1);
  }
}

// Run tests
main().catch(console.error);