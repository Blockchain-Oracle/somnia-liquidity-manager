/**
 * Test script for Stargate API integration
 * Tests the fixed parameters to ensure 422 errors are resolved
 */

import axios from 'axios';

const STARGATE_API = 'https://stargate.finance/api/v1';
const NATIVE_TOKEN_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

async function testStargateAPI() {
  console.log('Testing Stargate API with corrected parameters...\n');

  // Test 1: ETH from Ethereum to Arbitrum (using native token address)
  console.log('Test 1: ETH bridge from Ethereum to Arbitrum');
  try {
    const response1 = await axios.get(`${STARGATE_API}/quotes`, {
      params: {
        srcToken: NATIVE_TOKEN_ADDRESS,
        dstToken: NATIVE_TOKEN_ADDRESS,
        srcAddress: '0x1234567890abcdef1234567890abcdef12345678',
        dstAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
        srcChainKey: 'ethereum',
        dstChainKey: 'arbitrum',
        srcAmount: '1000000000000000000', // 1 ETH
        dstAmountMin: '950000000000000000', // 0.95 ETH (5% slippage)
      },
    });
    console.log('✅ Success! Got', response1.data.quotes.length, 'quotes');
    console.log('First quote route:', response1.data.quotes[0]?.route);
  } catch (error: any) {
    console.error('❌ Failed:', error.response?.status, error.response?.data || error.message);
  }

  console.log('\n---\n');

  // Test 2: USDC from Ethereum to Polygon
  console.log('Test 2: USDC bridge from Ethereum to Polygon');
  try {
    const response2 = await axios.get(`${STARGATE_API}/quotes`, {
      params: {
        srcToken: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC on Ethereum
        dstToken: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359', // Native USDC on Polygon
        srcAddress: '0x1234567890abcdef1234567890abcdef12345678',
        dstAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
        srcChainKey: 'ethereum',
        dstChainKey: 'polygon',
        srcAmount: '1000000', // 1 USDC (6 decimals)
        dstAmountMin: '990000', // 0.99 USDC
      },
    });
    console.log('✅ Success! Got', response2.data.quotes.length, 'quotes');
    console.log('First quote route:', response2.data.quotes[0]?.route);
  } catch (error: any) {
    console.error('❌ Failed:', error.response?.status, error.response?.data || error.message);
  }

  console.log('\n---\n');

  // Test 3: Get supported chains
  console.log('Test 3: Fetching supported chains');
  try {
    const response3 = await axios.get(`${STARGATE_API}/chains`);
    console.log('✅ Supported chains:', response3.data.chains.map((c: any) => c.key).join(', '));
  } catch (error: any) {
    console.error('❌ Failed:', error.response?.status, error.response?.data || error.message);
  }

  console.log('\n---\n');

  // Test 4: Get bridgeable tokens
  console.log('Test 4: Fetching bridgeable tokens');
  try {
    const response4 = await axios.get(`${STARGATE_API}/tokens`);
    const bridgeable = response4.data.tokens.filter((t: any) => t.isBridgeable);
    console.log('✅ Found', bridgeable.length, 'bridgeable tokens');
    
    // Show some examples
    const examples = bridgeable.slice(0, 5);
    examples.forEach((token: any) => {
      console.log(`  - ${token.symbol} on ${token.chainKey}: ${token.address}`);
    });
  } catch (error: any) {
    console.error('❌ Failed:', error.response?.status, error.response?.data || error.message);
  }
}

// Run tests
testStargateAPI().catch(console.error);