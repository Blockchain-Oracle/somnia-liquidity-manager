#!/bin/bash

echo "Testing Somnia routes with Stargate API"
echo "========================================"

# Test USDC from Ethereum to various addresses on Somnia
echo -e "\n1. Testing USDC (Ethereum) -> USDC addresses on Somnia:"

# Test with standard USDC address
echo -e "\n  a) Same USDC address (0xa0b86991...):"
curl -s "https://stargate.finance/api/v1/quotes?srcChainKey=ethereum&dstChainKey=somnia&srcToken=0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48&dstToken=0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48&srcAddress=0x0000000000000000000000000000000000000001&dstAddress=0x0000000000000000000000000000000000000001&srcAmount=1000000&dstAmountMin=0" 2>/dev/null | jq -r '.quotes | if length > 0 then "✅ Works! Found \(length) quotes" else .error // "❌ No quotes" end'

# Test with USDC.e address we have
echo -e "\n  b) USDC.e address (0x28BEc7E3...):"
curl -s "https://stargate.finance/api/v1/quotes?srcChainKey=ethereum&dstChainKey=somnia&srcToken=0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48&dstToken=0x28BEc7E30E6faee657a03e19Bf1128AaD7632A00&srcAddress=0x0000000000000000000000000000000000000001&dstAddress=0x0000000000000000000000000000000000000001&srcAmount=1000000&dstAmountMin=0" 2>/dev/null | jq -r '.quotes | if length > 0 then "✅ Works! Found \(length) quotes" else .error // "❌ No quotes" end'

# Try native address
echo -e "\n  c) Native address (0xEeeeeEee...):"
curl -s "https://stargate.finance/api/v1/quotes?srcChainKey=ethereum&dstChainKey=somnia&srcToken=0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48&dstToken=0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE&srcAddress=0x0000000000000000000000000000000000000001&dstAddress=0x0000000000000000000000000000000000000001&srcAmount=1000000&dstAmountMin=0" 2>/dev/null | jq -r '.quotes | if length > 0 then "✅ Works! Found \(length) quotes" else .error // "❌ No quotes" end'

echo -e "\n2. Testing ETH -> WETH on Somnia:"

# ETH to WETH address we have
echo -e "\n  a) ETH -> WETH (0x936Ab8C6...):"
curl -s "https://stargate.finance/api/v1/quotes?srcChainKey=ethereum&dstChainKey=somnia&srcToken=0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE&dstToken=0x936Ab8C674bcb567CD5dEB85D8A216494704E9D8&srcAddress=0x0000000000000000000000000000000000000001&dstAddress=0x0000000000000000000000000000000000000001&srcAmount=1000000000000000000&dstAmountMin=0" 2>/dev/null | jq -r '.quotes | if length > 0 then "✅ Works! Found \(length) quotes" else .error // "❌ No quotes" end'

# ETH to native SOMI
echo -e "\n  b) ETH -> Native SOMI:"
curl -s "https://stargate.finance/api/v1/quotes?srcChainKey=ethereum&dstChainKey=somnia&srcToken=0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE&dstToken=0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE&srcAddress=0x0000000000000000000000000000000000000001&dstAddress=0x0000000000000000000000000000000000000001&srcAmount=1000000000000000000&dstAmountMin=0" 2>/dev/null | jq -r '.quotes | if length > 0 then "✅ Works! Found \(length) quotes" else .error // "❌ No quotes" end'

echo -e "\n3. Testing reverse: Somnia -> Ethereum:"

# WETH from Somnia to ETH on Ethereum
echo -e "\n  a) WETH (Somnia) -> ETH (Ethereum):"
curl -s "https://stargate.finance/api/v1/quotes?srcChainKey=somnia&dstChainKey=ethereum&srcToken=0x936Ab8C674bcb567CD5dEB85D8A216494704E9D8&dstToken=0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE&srcAddress=0x0000000000000000000000000000000000000001&dstAddress=0x0000000000000000000000000000000000000001&srcAmount=1000000000000000000&dstAmountMin=0" 2>/dev/null | jq -r '.quotes | if length > 0 then "✅ Works! Found \(length) quotes" else .error // "❌ No quotes" end'

# USDC.e from Somnia to USDC on Ethereum
echo -e "\n  b) USDC.e (Somnia) -> USDC (Ethereum):"
curl -s "https://stargate.finance/api/v1/quotes?srcChainKey=somnia&dstChainKey=ethereum&srcToken=0x28BEc7E30E6faee657a03e19Bf1128AaD7632A00&dstToken=0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48&srcAddress=0x0000000000000000000000000000000000000001&dstAddress=0x0000000000000000000000000000000000000001&srcAmount=1000000&dstAmountMin=0" 2>/dev/null | jq -r '.quotes | if length > 0 then "✅ Works! Found \(length) quotes" else .error // "❌ No quotes" end'

echo -e "\n4. Let's find what tokens Somnia actually has:"
curl -s "https://stargate.finance/api/v1/tokens?chainKey=somnia" 2>/dev/null | jq -r '.tokens[] | select(.symbol | test("USD|ETH|BTC")) | {symbol, address, isBridgeable}' | head -20

