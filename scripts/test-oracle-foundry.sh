#!/bin/bash

echo "🔮 Testing DIA Oracle on Somnia with Foundry"
echo "============================================="
echo ""

# DIA Oracle addresses
MAINNET_ORACLE="0xeA82B12EB3330A8C73BF98fFe88fb637d88E5D31"
TESTNET_ORACLE="0x6090149792dAAeE9D1D568c9f9a6F6B46AA29eFD"

# Test on Somnia Testnet
echo "📊 Testing on Somnia Testnet (DevNet)"
echo "Oracle Address: $TESTNET_ORACLE"
echo ""

# Check if contract exists
echo "Checking contract code..."
cast code $TESTNET_ORACLE --rpc-url https://dream-rpc.somnia.network

echo ""
echo "Attempting to fetch ETH/USD price..."
cast call $TESTNET_ORACLE "getValue(string)(uint128,uint128)" "ETH/USD" --rpc-url https://dream-rpc.somnia.network 2>&1 || echo "❌ Oracle not available on testnet"

echo ""
echo "============================================="
echo ""

# Test on Somnia Mainnet
echo "📊 Testing on Somnia Mainnet"
echo "Oracle Address: $MAINNET_ORACLE"
echo ""

echo "Checking contract code..."
cast code $MAINNET_ORACLE --rpc-url https://api.mainnet.somnia.network

echo ""
echo "Attempting to fetch ETH/USD price..."
cast call $MAINNET_ORACLE "getValue(string)(uint128,uint128)" "ETH/USD" --rpc-url https://api.mainnet.somnia.network 2>&1 || echo "❌ Oracle not available on mainnet"

echo ""
echo "============================================="
echo ""

# Test QuickSwap V3 Quoter
echo "💱 Testing QuickSwap V3 Quoter on Mainnet"
QUOTER="0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4"
echo "Quoter Address: $QUOTER"

echo "Checking contract code..."
cast code $QUOTER --rpc-url https://api.mainnet.somnia.network

echo ""
echo "✅ Test complete!"