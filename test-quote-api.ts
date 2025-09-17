#!/usr/bin/env node
import axios from 'axios'

const STARGATE_API = 'https://stargate.finance/api/v1'

async function testQuoteAPI() {
  console.log('Testing Stargate Quote API...\n')

  // Test case 1: Ethereum SOMI to Somnia SOMI
  const test1 = {
    name: 'Ethereum SOMI → Somnia SOMI',
    params: {
      srcToken: '0x1B0F6590d21dc02B92ad3A7D00F8884dC4f1aed9', // Ethereum SOMI
      dstToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // Somnia native SOMI
      srcChainKey: 'ethereum',
      dstChainKey: 'somnia',
      srcAddress: '0x0000000000000000000000000000000000000001',
      dstAddress: '0x0000000000000000000000000000000000000001',
      srcAmount: '1000000000000000000', // 1 SOMI (18 decimals)
      dstAmountMin: '0'
    }
  }

  // Test case 2: Somnia SOMI to Ethereum SOMI
  const test2 = {
    name: 'Somnia SOMI → Ethereum SOMI',
    params: {
      srcToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // Somnia native SOMI
      dstToken: '0x1B0F6590d21dc02B92ad3A7D00F8884dC4f1aed9', // Ethereum SOMI
      srcChainKey: 'somnia',
      dstChainKey: 'ethereum',
      srcAddress: '0x0000000000000000000000000000000000000001',
      dstAddress: '0x0000000000000000000000000000000000000001',
      srcAmount: '1000000000000000000', // 1 SOMI (18 decimals)
      dstAmountMin: '0'
    }
  }

  // Test case 3: Somnia WETH to Ethereum ETH
  const test3 = {
    name: 'Somnia WETH → Ethereum ETH',
    params: {
      srcToken: '0x936Ab8C674bcb567CD5dEB85D8A216494704E9D8', // Somnia WETH
      dstToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // Ethereum native ETH
      srcChainKey: 'somnia',
      dstChainKey: 'ethereum',
      srcAddress: '0x0000000000000000000000000000000000000001',
      dstAddress: '0x0000000000000000000000000000000000000001',
      srcAmount: '1000000000000000000', // 1 WETH (18 decimals)
      dstAmountMin: '0'
    }
  }

  const tests = [test1, test2, test3]

  for (const test of tests) {
    console.log(`\n📋 Testing: ${test.name}`)
    console.log('Parameters:', test.params)
    
    const queryParams = new URLSearchParams(test.params as any)
    const url = `${STARGATE_API}/quotes?${queryParams.toString()}`
    
    console.log('📡 URL:', url)
    
    try {
      const response = await axios.get(url)
      
      if (response.data.quotes && response.data.quotes.length > 0) {
        console.log('✅ Success! Got', response.data.quotes.length, 'quotes')
        const quote = response.data.quotes[0]
        console.log('First quote:', {
          dstAmount: quote.dstAmount,
          duration: quote.duration,
          bridgeType: quote.bridgeType
        })
      } else {
        console.log('⚠️ No quotes returned')
      }
    } catch (error: any) {
      console.log('❌ Error:', error.response?.status, error.response?.data?.message || error.message)
      if (error.response?.data) {
        console.log('Response data:', error.response.data)
      }
    }
  }
}

testQuoteAPI().catch(console.error)