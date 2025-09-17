#!/usr/bin/env ts-node

import { stargateApi } from '../lib/services/stargateApi.service'

async function testDynamicRoutes() {
  console.log('🔍 Testing Dynamic Route Checking\n')

  // Test cases for Somnia routes
  const testCases = [
    // Should work - WETH from Somnia to ETH on Base
    {
      name: 'WETH (Somnia) → ETH (Base)',
      srcChain: 'somnia',
      dstChain: 'base',
      srcToken: '0x936Ab8C674bcb567CD5dEB85D8A216494704E9D8', // WETH on Somnia
      dstToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // Native ETH
    },
    // Should work - USDC.e from Somnia to USDC on Ethereum
    {
      name: 'USDC.e (Somnia) → USDC (Ethereum)',
      srcChain: 'somnia',
      dstChain: 'ethereum',
      srcToken: '0x28BEc7E30E6faee657a03e19Bf1128AaD7632A00', // USDC.e on Somnia
      dstToken: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC on Ethereum
    },
    // Should work - USDT bidirectional
    {
      name: 'USDT (Somnia) → USDT (Arbitrum)',
      srcChain: 'somnia',
      dstChain: 'arbitrum',
      srcToken: '0x67B302E35Aef5EEE8c32D934F5856869EF428330', // USDT on Somnia
      dstToken: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9', // USDT on Arbitrum
    },
    // Should NOT work - SOMI native token
    {
      name: 'SOMI (Somnia) → ETH (Base)',
      srcChain: 'somnia',
      dstChain: 'base',
      srcToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // SOMI native
      dstToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // ETH native
    },
  ]

  for (const test of testCases) {
    console.log(`\n📋 Testing: ${test.name}`)
    console.log(`   From: ${test.srcChain}`)
    console.log(`   To: ${test.dstChain}`)
    
    try {
      const quotes = await stargateApi.getQuotes({
        srcToken: test.srcToken,
        dstToken: test.dstToken,
        srcAddress: '0x0000000000000000000000000000000000000001',
        dstAddress: '0x0000000000000000000000000000000000000001',
        srcChainKey: test.srcChain as any,
        dstChainKey: test.dstChain as any,
        srcAmount: '1000000000000000000', // 1 token
        dstAmountMin: '0'
      })
      
      if (quotes.length > 0) {
        console.log(`   ✅ Route available! Found ${quotes.length} quote(s)`)
        console.log(`   Duration: ~${quotes[0].duration.estimated / 60} minutes`)
      } else {
        console.log(`   ❌ Route not available`)
      }
    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}`)
    }
  }

  // Test getting supported tokens between chains
  console.log('\n\n🔍 Testing getSupportedTokens\n')
  
  const chainPairs = [
    { src: 'somnia', dst: 'base' },
    { src: 'somnia', dst: 'ethereum' },
    { src: 'base', dst: 'somnia' },
  ]

  for (const pair of chainPairs) {
    console.log(`\n📋 Supported tokens: ${pair.src} → ${pair.dst}`)
    try {
      const tokens = await stargateApi.getSupportedTokens(
        pair.src as any,
        pair.dst as any
      )
      
      if (tokens.length > 0) {
        tokens.forEach(token => {
          console.log(`   • ${token.symbol}`)
        })
      } else {
        console.log('   No supported tokens found')
      }
    } catch (error: any) {
      console.log(`   Error: ${error.message}`)
    }
  }

  console.log('\n✅ Dynamic route testing complete!')
}

// Run the test
testDynamicRoutes().catch(console.error)