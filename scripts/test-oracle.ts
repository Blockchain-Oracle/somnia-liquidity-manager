#!/usr/bin/env npx tsx

/**
 * Test script for DIA Oracle integration
 * Run with: npx tsx scripts/test-oracle.ts
 */

import { diaOracleService } from '../lib/services/diaOracle.service'

async function testOracle() {
  console.log('🔮 Testing DIA Oracle Integration on Somnia\n')
  
  // Check oracle availability
  const oracleInfo = await diaOracleService.getOracleInfo()
  console.log('Oracle Info:', oracleInfo)
  console.log('\n---\n')
  
  // Test single price fetch
  console.log('📊 Fetching single price:')
  const ethPrice = await diaOracleService.getPrice('ETH')
  if (ethPrice) {
    console.log(`ETH/USD: $${ethPrice.value.toFixed(2)}`)
    console.log(`Source: ${ethPrice.source}`)
    console.log(`Timestamp: ${new Date(ethPrice.timestamp * 1000).toISOString()}`)
  }
  console.log('\n---\n')
  
  // Test batch price fetch
  console.log('📈 Fetching multiple prices:')
  const tokens = ['ETH', 'BTC', 'USDC', 'SOMI', 'STT']
  const prices = await diaOracleService.getPrices(tokens)
  
  prices.forEach((price, token) => {
    console.log(`${token}: $${price.value.toFixed(4)} (${price.source})`)
  })
  console.log('\n---\n')
  
  // Test pair price
  console.log('💱 Testing pair prices:')
  const ethUsdcPrice = await diaOracleService.getPairPrice('ETH', 'USDC')
  console.log(`ETH/USDC: ${ethUsdcPrice.toFixed(2)}`)
  
  const btcEthPrice = await diaOracleService.getPairPrice('BTC', 'ETH')
  console.log(`BTC/ETH: ${btcEthPrice.toFixed(4)}`)
  console.log('\n---\n')
  
  // Test price subscription
  console.log('🔄 Testing price subscription (5 seconds):')
  const unsubscribe = diaOracleService.subscribeToPriceUpdates(
    'ETH',
    (price) => {
      console.log(`  Update: ETH = $${price.value.toFixed(2)} at ${new Date().toLocaleTimeString()}`)
    },
    2000 // Update every 2 seconds
  )
  
  // Stop after 5 seconds
  setTimeout(() => {
    unsubscribe()
    console.log('\n✅ Oracle test complete!')
    process.exit(0)
  }, 5000)
}

// Run the test
testOracle().catch(console.error)