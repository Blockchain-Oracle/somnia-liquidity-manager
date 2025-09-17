#!/usr/bin/env tsx

import { stargateApi } from '../lib/services/stargateApi.service'

async function testSmartRouteDiscovery() {
  console.log('🚀 Testing Smart Route Discovery with srcToken Parameter\n')
  console.log('=' .repeat(60))

  // Test tokens from different chains
  const testTokens = [
    {
      name: 'WETH on Somnia',
      chain: 'somnia',
      address: '0x936Ab8C674bcb567CD5dEB85D8A216494704E9D8'
    },
    {
      name: 'USDC.e on Somnia', 
      chain: 'somnia',
      address: '0x28BEc7E30E6faee657a03e19Bf1128AaD7632A00'
    },
    {
      name: 'USDT on Somnia',
      chain: 'somnia', 
      address: '0x67B302E35Aef5EEE8c32D934F5856869EF428330'
    },
    {
      name: 'ETH on Base',
      chain: 'base',
      address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
    },
    {
      name: 'USDC on Ethereum',
      chain: 'ethereum',
      address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
    }
  ]

  for (const token of testTokens) {
    console.log(`\n📍 ${token.name}`)
    console.log(`   Chain: ${token.chain}`)
    console.log(`   Address: ${token.address}`)
    
    try {
      // Get available destinations for this token
      const destinations = await stargateApi.getAvailableDestinations(
        token.chain as any,
        token.address
      )
      
      if (destinations.chains.length > 0) {
        console.log(`\n   ✅ Can bridge to ${destinations.chains.length} chain(s):\n`)
        
        for (const chain of destinations.chains) {
          const tokens = destinations.tokensByChain[chain]
          console.log(`   • ${chain}:`)
          tokens.forEach(t => {
            console.log(`     - ${t.symbol} (${t.address.substring(0, 10)}...)`)
          })
        }
      } else {
        console.log('   ❌ No bridge routes available')
      }
    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}`)
    }
    
    console.log('\n' + '-'.repeat(60))
  }

  // Test specific route checking
  console.log('\n\n🔍 Testing Specific Routes\n')
  console.log('=' .repeat(60))

  const routeTests = [
    {
      name: 'Somnia → Base (WETH → ETH)',
      srcChain: 'somnia',
      srcToken: '0x936Ab8C674bcb567CD5dEB85D8A216494704E9D8', // WETH
      dstChain: 'base'
    },
    {
      name: 'Somnia → Ethereum (USDC.e → USDC)',
      srcChain: 'somnia',
      srcToken: '0x28BEc7E30E6faee657a03e19Bf1128AaD7632A00', // USDC.e
      dstChain: 'ethereum'
    },
    {
      name: 'Base → Somnia (ETH → WETH)',
      srcChain: 'base',
      srcToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // ETH
      dstChain: 'somnia'
    }
  ]

  for (const test of routeTests) {
    console.log(`\n📋 ${test.name}`)
    
    const available = await stargateApi.isRouteAvailableViaTokens(
      test.srcChain as any,
      test.srcToken,
      test.dstChain as any
    )
    
    if (available) {
      console.log('   ✅ Route is available!')
    } else {
      console.log('   ❌ Route not available')
      
      // Show alternatives
      const destinations = await stargateApi.getAvailableDestinations(
        test.srcChain as any,
        test.srcToken
      )
      
      if (destinations.chains.length > 0) {
        console.log(`   💡 Alternative destinations: ${destinations.chains.join(', ')}`)
      }
    }
  }

  console.log('\n\n✨ Smart route discovery test complete!')
}

// Run the test
testSmartRouteDiscovery().catch(console.error)