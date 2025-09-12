#!/bin/bash

echo "🔮 Testing DIA Oracle on Somnia with Foundry Cast"
echo "=================================================="
echo ""

# Network RPCs
TESTNET_RPC="https://dream-rpc.somnia.network"
MAINNET_RPC="https://api.mainnet.somnia.network"

# DIA Oracle contract addresses
TESTNET_ORACLE="0x9206296Ea3aEE3E6bdC07F7AaeF14DfCf33d865D"
MAINNET_ORACLE="0xbA0E0750A56e995506CA458b2BdD752754CF39C4"

# Asset Adapter addresses for testnet
declare -A TESTNET_ADAPTERS=(
    ["USDT"]="0x67d2C2a87A17b7267a6DBb1A59575C0E9A1D1c3e"
    ["USDC"]="0x235266D5ca6f19F134421C49834C108b32C2124e"
    ["BTC"]="0x4803db1ca3A1DA49c3DB991e1c390321c20e1f21"
    ["ARB"]="0x74952812B6a9e4f826b2969C6D189c4425CBc19B"
    ["SOL"]="0xD5Ea6C434582F827303423dA21729bEa4F87D519"
)

# Asset Adapter addresses for mainnet
declare -A MAINNET_ADAPTERS=(
    ["USDT"]="0x936C4F07fD4d01485849ee0EE2Cdcea2373ba267"
    ["USDC"]="0x5D4266f4DD721c1cD8367FEb23E4940d17C83C93"
    ["BTC"]="0xb12e1d47b0022fA577c455E7df2Ca9943D0152bE"
    ["ARB"]="0x6a96a0232402c2BC027a12C73f763b604c9F77a6"
    ["SOL"]="0xa4a3a8B729939E2a79dCd9079cee7d84b0d96234"
)

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to test DIA Oracle getValue
test_oracle_getValue() {
    local network=$1
    local rpc=$2
    local oracle=$3
    local pair=$4
    
    echo "Testing getValue('$pair')..."
    result=$(cast call $oracle "getValue(string)(uint128,uint128)" "$pair" --rpc-url $rpc 2>&1)
    
    if [[ $? -eq 0 ]]; then
        # Parse the result
        IFS=$'\n' read -d '' -r -a values <<< "$result"
        if [[ ${#values[@]} -ge 2 ]]; then
            price_raw=${values[0]}
            timestamp_raw=${values[1]}
            
            # Convert to decimal (assuming 8 decimals)
            price=$(echo "scale=6; $price_raw / 100000000" | bc)
            
            echo -e "${GREEN}✓${NC} $pair: \$$price (timestamp: $timestamp_raw)"
        else
            echo -e "${YELLOW}⚠${NC} $pair: Unexpected response format"
        fi
    else
        echo -e "${RED}✗${NC} $pair: Not available"
    fi
}

# Function to test Asset Adapter
test_adapter() {
    local network=$1
    local rpc=$2
    local adapter=$3
    local symbol=$4
    
    echo ""
    echo "Testing $symbol Adapter at $adapter..."
    
    # Check if contract exists
    code=$(cast code $adapter --rpc-url $rpc 2>&1)
    if [[ "$code" == "0x" ]] || [[ -z "$code" ]]; then
        echo -e "${RED}✗${NC} No contract at this address"
        return
    fi
    
    # Get decimals
    decimals=$(cast call $adapter "decimals()(uint8)" --rpc-url $rpc 2>&1)
    if [[ $? -ne 0 ]]; then
        echo -e "${RED}✗${NC} Failed to get decimals"
        return
    fi
    
    # Get latest round data
    result=$(cast call $adapter "latestRoundData()(uint80,int256,uint256,uint256,uint80)" --rpc-url $rpc 2>&1)
    if [[ $? -eq 0 ]]; then
        IFS=$'\n' read -d '' -r -a values <<< "$result"
        if [[ ${#values[@]} -ge 5 ]]; then
            roundId=${values[0]}
            answer=${values[1]}
            startedAt=${values[2]}
            updatedAt=${values[3]}
            answeredInRound=${values[4]}
            
            # Calculate price based on decimals
            divisor=$((10**decimals))
            price=$(echo "scale=6; $answer / $divisor" | bc)
            
            # Convert timestamp to readable format
            if [[ "$updatedAt" -gt 0 ]]; then
                date_str=$(date -r $updatedAt 2>/dev/null || date -d @$updatedAt 2>/dev/null || echo "Unknown")
            else
                date_str="Unknown"
            fi
            
            echo -e "${GREEN}✓${NC} Latest Price: \$$price"
            echo "  Round ID: $roundId"
            echo "  Decimals: $decimals"
            echo "  Updated: $date_str"
        else
            echo -e "${YELLOW}⚠${NC} Unexpected response format"
        fi
    else
        echo -e "${RED}✗${NC} Failed to get latest round data"
    fi
}

# Test Testnet
echo "=========================================="
echo "📊 SOMNIA TESTNET (DevNet)"
echo "=========================================="
echo ""
echo "Oracle Address: $TESTNET_ORACLE"
echo ""

# Check if oracle exists
code=$(cast code $TESTNET_ORACLE --rpc-url $TESTNET_RPC 2>&1)
if [[ "$code" != "0x" ]] && [[ -n "$code" ]]; then
    echo -e "${GREEN}✓${NC} Oracle contract exists"
    echo ""
    
    # Test getValue for common pairs
    echo "Testing getValue() method:"
    echo "--------------------------"
    for pair in "ETH/USD" "BTC/USD" "SOMI/USD" "USDC/USD"; do
        test_oracle_getValue "testnet" "$TESTNET_RPC" "$TESTNET_ORACLE" "$pair"
    done
else
    echo -e "${RED}✗${NC} Oracle contract not found"
fi

echo ""
echo "Testing Asset Adapters:"
echo "-----------------------"
for symbol in "${!TESTNET_ADAPTERS[@]}"; do
    test_adapter "testnet" "$TESTNET_RPC" "${TESTNET_ADAPTERS[$symbol]}" "$symbol"
done

# Test Mainnet
echo ""
echo "=========================================="
echo "📊 SOMNIA MAINNET"
echo "=========================================="
echo ""
echo "Oracle Address: $MAINNET_ORACLE"
echo ""

# Check if oracle exists
code=$(cast code $MAINNET_ORACLE --rpc-url $MAINNET_RPC 2>&1)
if [[ "$code" != "0x" ]] && [[ -n "$code" ]]; then
    echo -e "${GREEN}✓${NC} Oracle contract exists"
    echo ""
    
    # Test getValue for common pairs
    echo "Testing getValue() method:"
    echo "--------------------------"
    for pair in "ETH/USD" "BTC/USD" "SOMI/USD" "USDC/USD"; do
        test_oracle_getValue "mainnet" "$MAINNET_RPC" "$MAINNET_ORACLE" "$pair"
    done
else
    echo -e "${RED}✗${NC} Oracle contract not found"
fi

echo ""
echo "Testing Asset Adapters:"
echo "-----------------------"
for symbol in "${!MAINNET_ADAPTERS[@]}"; do
    test_adapter "mainnet" "$MAINNET_RPC" "${MAINNET_ADAPTERS[$symbol]}" "$symbol"
done

echo ""
echo "=========================================="
echo "✅ DIA Oracle Testing Complete!"
echo "=========================================="