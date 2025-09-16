#!/bin/bash

echo "🚀 Deploying Sommia NFT Marketplace to Testnet"
echo "============================================="

# Check if PRIVATE_KEY is set
if [ -z "$PRIVATE_KEY" ]; then
    source .env
fi

if [ -z "$PRIVATE_KEY" ]; then
    echo "❌ Error: PRIVATE_KEY not set in .env file"
    echo "Please add your private key (without 0x prefix) to .env"
    echo "Get testnet STT from: https://somnia.faucet.berachain.com/"
    exit 1
fi

echo "📦 Compiling contracts..."
forge build

if [ $? -ne 0 ]; then
    echo "❌ Compilation failed"
    exit 1
fi

echo "✅ Compilation successful"
echo ""
echo "🚀 Deploying to Somnia Testnet..."
echo "Chain ID: 50312"
echo ""

# Deploy and capture output
OUTPUT=$(forge script script/DeployMarketplace.s.sol:DeployMarketplace \
    --rpc-url https://rpc.testnet.somnia.network \
    --broadcast \
    --verify \
    --verifier-url https://somniascan.xyz/api \
    -vvv 2>&1)

# Extract deployed address from output
DEPLOYED_ADDRESS=$(echo "$OUTPUT" | grep -o "Marketplace deployed at: 0x[a-fA-F0-9]*" | cut -d' ' -f4)

if [ -z "$DEPLOYED_ADDRESS" ]; then
    echo "❌ Deployment failed. Full output:"
    echo "$OUTPUT"
    exit 1
fi

echo "✅ Marketplace deployed successfully!"
echo ""
echo "============================================="
echo "📍 CONTRACT ADDRESS: $DEPLOYED_ADDRESS"
echo "============================================="
echo ""
echo "🔍 View on Explorer:"
echo "https://somniascan.xyz/address/$DEPLOYED_ADDRESS"
echo ""
echo "📝 Next steps:"
echo "1. Update MARKETPLACE_ADDRESS in lib/constants/marketplace.ts to:"
echo "   export const MARKETPLACE_ADDRESS = \"$DEPLOYED_ADDRESS\";"
echo ""
echo "2. The marketplace is ready to use!"

# Save deployment info
mkdir -p deployments
cat > deployments/marketplace-testnet.json << EOF
{
  "network": "somnia-testnet",
  "chainId": 50312,
  "marketplace": {
    "address": "$DEPLOYED_ADDRESS",
    "deployedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "config": {
      "platformFeeBps": 250,
      "listingFeeWei": "0",
      "cancelRefundBps": 0
    }
  }
}
EOF

echo "📁 Deployment info saved to deployments/marketplace-testnet.json"