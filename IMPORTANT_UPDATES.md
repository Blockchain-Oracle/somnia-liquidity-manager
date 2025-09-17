# ⚠️ CRITICAL UPDATES - Somnia Liquidity Manager

## 🔴 Major Discoveries

### 1. **QuickSwap May NOT Be Live on Somnia Yet**
- The contract addresses we had might be placeholders
- Official Somnia docs don't list QuickSwap contracts
- Need to verify deployment status

### 2. **Correct Somnia Network Details**

#### Mainnet (Chain ID: 5031)
- **Native Token**: SOMI (not STT!)
- **RPC**: `https://dream-rpc.somnia.network`
- **WebSocket**: `wss://dream-rpc.somnia.network/ws`
- **Explorer**: `https://explorer.somnia.network`

#### Deployed Tokens on Mainnet
```solidity
WSOMI: 0x046EDe9564A72571df6F5e44d0405360c0f4dCab
USDC:  0x28BEc7E30E6faee657a03e19Bf1128AaD7632A00
USDT:  0x67B302E35Aef5EEE8c32D934F5856869EF428330
WETH:  0x936Ab8C674bcb567CD5dEB85D8A216494704E9D8
```

### 3. **Additional Infrastructure**
- **Multicall V3**: `0x5e44F178E8cF9B2F5409B6f18ce936aB817C5a11`
- **LayerZero Endpoint**: `0x6F475642a6e85809B1c36Fa62763669b1b48DD5B`
- **DIA Oracle**: `0xbA0E0750A56e995506CA458b2BdD752754CF39C4`

## 🎯 Action Items

### Immediate Verification Needed
1. **Check if QuickSwap is actually deployed on Somnia**
   - Try calling the factory contract
   - Check for pools with WSOMI/USDC
   - Verify with QuickSwap team/community

### If QuickSwap is NOT Live
We have two options:

#### Option A: Deploy Our Own AMM
- Use Uniswap V3 Core contracts
- Deploy on Somnia ourselves
- Full control but more complex

#### Option B: Use Different DEX
- Check if other DEXs are live on Somnia
- Adapt our manager for available DEX

### If QuickSwap IS Live
- Update all contract addresses
- Test with actual deployed contracts
- Verify pool creation works

## 💡 What We Can Use from Uniswap SDK

Since QuickSwap uses Algebra (similar architecture to Uniswap V3), we can leverage:

### 1. **Position Management Pattern**
```typescript
import { Pool, Position } from '@uniswap/v3-sdk'

// Similar structure for Algebra/QuickSwap
const position = new Position({
  pool,
  liquidity,
  tickLower,
  tickUpper
})
```

### 2. **Math Libraries**
- Tick math calculations
- Price conversions
- Liquidity calculations

### 3. **Calldata Generation**
- Mint position parameters
- Increase/decrease liquidity
- Collect fees

## 🚀 Updated Architecture

```
If QuickSwap Live:
├── Use existing contracts
├── Adapt Uniswap SDK patterns
└── Focus on AI layer

If QuickSwap NOT Live:
├── Option 1: Deploy Uniswap V3 fork
├── Option 2: Find alternative DEX
└── Option 3: Wait for QuickSwap deployment
```

## 🔧 Code Updates Made

1. **Updated contract addresses** (`lib/contracts/addresses.ts`)
   - Added real Somnia token addresses
   - Fixed RPC endpoints
   - Added WebSocket URL
   - Added LayerZero and Oracle addresses

2. **Added WebSocket Service** (`lib/services/websocket.service.ts`)
   - Real-time event monitoring
   - Auto-reconnection logic
   - Position-specific monitoring

## 📝 Next Steps

1. **Test QuickSwap Factory Contract**
```typescript
// Test if factory exists
const factory = new Contract(
  '0x0ccff3D02A3a200263eC4e0Fdb5E60a56721B8Ae',
  factoryABI,
  provider
);

try {
  const pool = await factory.poolByPair(WSOMI, USDC);
  console.log('QuickSwap is LIVE! Pool:', pool);
} catch (error) {
  console.log('QuickSwap NOT deployed yet');
}
```

2. **Verify Token Pairs**
- Check WSOMI/USDC pool
- Check WSOMI/USDT pool
- Check WETH/USDC pool

3. **Update Frontend Strategy**
- If no DEX: Show "Coming Soon"
- If DEX exists: Full functionality
- Add fallback to DIA Oracle for prices

## ⚡ WebSocket Integration

New real-time capabilities:
- Monitor position changes instantly
- Track new pools created
- Alert on large trades
- Real-time P&L updates

## 🎨 UI Considerations

Since we're building a user-facing app:
1. Clear indication if DEX not available
2. Use DIA Oracle for price displays
3. Show Somnia's speed metrics
4. Highlight sub-cent transaction costs

---

**Last Updated**: Just now
**Critical**: Verify QuickSwap deployment status ASAP