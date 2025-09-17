# 🔄 Network Switching Guide

## NO ENVIRONMENT VARIABLES NEEDED! 

Just use the API to switch between Mainnet and Testnet instantly.

## Quick Start

```bash
# Start the server
npm run dev

# Test network switching
npm run test:network
```

## How It Works

### 📍 MAINNET = QuickSwap
When you switch to mainnet, the system uses:
- **QuickSwap Algebra V4** contracts (REAL, DEPLOYED)
- **Contract addresses** are hardcoded in the config
- **RPC**: https://rpc.somnia.network
- **Chain ID**: 5031

### 📍 TESTNET = SimpleDEX
When you switch to testnet, the system uses:
- **SimpleDEX** contracts (our implementation)
- **Contract addresses** loaded from deployment
- **RPC**: https://dream-rpc.somnia.network
- **Chain ID**: 50312

## API Endpoints

### Check Current Network
```bash
curl http://localhost:3000/api/network?action=status
```

Response:
```json
{
  "network": "mainnet",
  "chainId": 5031,
  "activeDEX": "quickswap",
  "isConnected": true,
  "message": "🚀 Connected to QuickSwap on Somnia Mainnet"
}
```

### Switch to Mainnet
```bash
curl http://localhost:3000/api/network?action=switch&network=mainnet
```

### Switch to Testnet
```bash
curl http://localhost:3000/api/network?action=switch&network=testnet
```

### View Contract Addresses
```bash
curl http://localhost:3000/api/network?action=contracts
```

## Network Configuration

All network configs are in: `lib/config/networks.config.ts`

```typescript
// MAINNET - QuickSwap Contracts
{
  algebraFactory: '0x0ccff3D02A3a200263eC4e0Fdb5E60a56721B8Ae',
  swapRouter: '0x1582f6f3D26658F7208A799Be46e34b1f366CE44',
  nonfungiblePositionManager: '0xfE02219e0578B1E4831CDE7C3CB36f71AEb4A833',
  // ...
}

// TESTNET - SimpleDEX Contracts
{
  pool: '[deployed address]',
  wsomi: '[deployed address]',
  usdc: '[deployed address]'
}
```

## Automatic DEX Selection

The system automatically selects the right DEX:

1. **On Mainnet** → Uses QuickSwap
2. **On Testnet with SimpleDEX deployed** → Uses SimpleDEX
3. **On Testnet without SimpleDEX** → Uses Demo mode
4. **If network unreachable** → Falls back to Demo mode

## Deploy SimpleDEX on Testnet

If SimpleDEX is not deployed:

```bash
# 1. Switch to testnet
curl http://localhost:3000/api/network?action=switch&network=testnet

# 2. Deploy SimpleDEX
npm run compile
npm run deploy:testnet

# 3. Test it works
npm run test:dex
```

## Example Usage

### Get Pool on Current Network
```bash
# This automatically uses the right DEX for the current network
curl http://localhost:3000/api/network?action=pool
```

### Get User Positions
```bash
curl http://localhost:3000/api/network?action=positions&address=0x...
```

## Priority System

As you requested, the priority is:
1. **Network selection** (mainnet or testnet)
2. **Contract addresses** (automatic based on network)
3. **DEX selection** (automatic based on what's available)

## Benefits

✅ **No environment variables**
✅ **Easy switching via API**
✅ **Automatic DEX detection**
✅ **Clear separation of mainnet/testnet**
✅ **Fallback to demo if needed**

## For Frontend Integration

```javascript
// Switch to mainnet
await fetch('/api/network?action=switch&network=mainnet');

// Switch to testnet  
await fetch('/api/network?action=switch&network=testnet');

// Get current status
const status = await fetch('/api/network?action=status').then(r => r.json());
console.log(`Current network: ${status.network}`);
console.log(`Using DEX: ${status.activeDEX}`);
```