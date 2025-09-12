#!/usr/bin/env ts-node

/**
 * Test script for pool-based price discovery
 * Tests getting WETH and WSOMI prices from QuickSwap V4 pools
 */

import { poolPriceDiscovery } from '../lib/services/poolPriceDiscovery.service.js'
import { diaOracleService } from '../lib/services/diaOracle.service.js'

async function main() {
  console.log('🔍 Testing Pool-Based Price Discovery\n')
  console.log('=' . repeat(60))
  
  // Test tokens that don't have DIA adapters
  const testTokens = ['WETH', 'WSOMI', 'USDC', 'USDT']
  
  console.log('\n📊 Testing Pool Prices:\n')
  for (const token of testTokens) {
    console.log(`\nTesting ${token}:`)
    console.log('-'.repeat(30))
    
    // Try pool-based pricing
    try {
      const poolPrice = await poolPriceDiscovery.getTokenPriceFromPools(token)
      if (poolPrice) {
        console.log(`✅ Pool price: $${poolPrice.toFixed(4)}`)
      } else {
        console.log('❌ No pool price found')
      }
    } catch (error: any) {
      console.log(`❌ Pool error: ${error.message}`)
    }
    
    // Try DIA Oracle (which will fallback to pools for WETH/WSOMI)
    try {
      const oraclePrice = await diaOracleService.getPrice(token)
      if (oraclePrice) {
        console.log(`✅ Oracle price: $${oraclePrice.value.toFixed(4)} (source: ${oraclePrice.source})`)
      } else {
        console.log('❌ No oracle price found')
      }
    } catch (error: any) {
      console.log(`❌ Oracle error: ${error.message}`)
    }
  }
  
  console.log('\n\n🔎 Discovering Available Pools:\n')
  for (const token of ['WETH', 'WSOMI']) {
    const pools = await poolPriceDiscovery.getAvailablePoolsForToken(token)
    console.log(`\n${token} pools:`)
    if (pools.length > 0) {
      pools.forEach(pool => {
        console.log(`  ✅ ${pool.pair} at ${pool.address}`)
      })
    } else {
      console.log('  ❌ No pools found')
    }
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('\n💡 Summary:')
  console.log('- Pool-based pricing uses QuickSwap V4 (Algebra) pools')
  console.log('- WETH and WSOMI prices are derived from pool liquidity')
  console.log('- Falls back to external APIs if pools are not available')
  console.log('- This ensures we always have prices without mocking')
}

main().catch(console.error)