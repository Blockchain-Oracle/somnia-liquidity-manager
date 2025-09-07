# 🚀 SimpleDEX Deployment Guide

## Prerequisites

1. **Get Somnia Testnet STT tokens**
   - Visit: https://somnia.faucetme.pro/
   - Get at least 10 STT for deployment and testing

2. **Set up your wallet**
   ```bash
   # Create .env file
   cp .env.example .env
   
   # Add your private key (with 0x prefix)
   PRIVATE_KEY=0x...your_private_key_here
   ```

## Step 1: Install Dependencies

```bash
# Install all packages including Solidity compiler
npm install
```

## Step 2: Compile Smart Contracts

```bash
# This compiles SimpleDEX and MockERC20 contracts
npm run compile

# Artifacts will be saved to ./artifacts/
```

## Step 3: Deploy to Somnia Testnet

```bash
# Deploy all contracts and add initial liquidity
npm run deploy:testnet
```

This will:
1. Deploy MockWSOМI token
2. Deploy MockUSDC token  
3. Deploy SimpleLiquidityPool
4. Mint 10,000 of each token to deployer
5. Add 1,000 WSOMI/USDC initial liquidity
6. Save deployment addresses to `deployments/testnet.json`

## Step 4: Test the DEX

```bash
# Start the backend server
npm run dev

# In another terminal, run tests
npm run test:dex
```

## Step 5: Interact with SimpleDEX

### Via API:
```bash
# Get pool information
curl http://localhost:3000/api/simpledex?action=pool

# Get swap quote
curl http://localhost:3000/api/simpledex?action=quote&amount=100&zeroForOne=true

# Check user position
curl http://localhost:3000/api/simpledex?action=position&address=YOUR_ADDRESS
```

### Via Transactions:
```bash
# Get faucet tokens (1000 each)
curl -X POST http://localhost:3000/api/simpledex \
  -H "Content-Type: application/json" \
  -d '{"action": "faucet", "address": "YOUR_ADDRESS"}'

# Add liquidity
curl -X POST http://localhost:3000/api/simpledex \
  -H "Content-Type: application/json" \
  -d '{"action": "add-liquidity", "amount0": "100", "amount1": "100"}'

# Swap tokens
curl -X POST http://localhost:3000/api/simpledex \
  -H "Content-Type: application/json" \
  -d '{"action": "swap", "amountIn": "10", "zeroForOne": true}'
```

## Contract Addresses (After Deployment)

Your deployment addresses will be saved in `deployments/testnet.json`:

```json
{
  "network": "somnia-testnet",
  "chainId": 50312,
  "contracts": {
    "wsomi": "0x...",
    "usdc": "0x...",
    "pool": "0x..."
  }
}
```

## Troubleshooting

### "Contract not compiled"
Run `npm run compile` first

### "Insufficient balance"  
Get testnet STT from: https://somnia.faucetme.pro/

### "SimpleDEX not deployed"
Run `npm run deploy:testnet` first

### "Server not running"
Start the server with `npm run dev`

## Network Information

- **Network**: Somnia Testnet
- **Chain ID**: 50312
- **RPC**: https://dream-rpc.somnia.network
- **Explorer**: https://somnia-explorer.com
- **Faucet**: https://somnia.faucetme.pro/

## Smart Contract Features

### SimpleLiquidityPool
- Constant product AMM (x*y=k)
- 0.3% trading fee
- LP token minting/burning
- Price impact calculation

### MockERC20 Tokens
- WSOMI: 18 decimals
- USDC: 6 decimals  
- Faucet function (1000 tokens per call)
- Standard ERC20 functions

## Next Steps

After successful deployment:

1. **Test AI Features**
   ```bash
   curl http://localhost:3000/api/demo?action=ai-recommendation
   ```

2. **Monitor Pool Metrics**
   - TVL tracking
   - Volume monitoring
   - Fee accumulation

3. **Build Frontend**
   - Connect wallet UI
   - Pool interface
   - Swap interface
   - Liquidity management

## For Hackathon Judges

This SimpleDEX implementation demonstrates:
- ✅ Real smart contract deployment on Somnia
- ✅ Functional AMM with swaps and liquidity
- ✅ Integration with AI liquidity manager
- ✅ Complete backend API
- ✅ Ready for frontend integration

The system is designed to seamlessly switch between:
- SimpleDEX (testnet) for live demos
- QuickSwap (mainnet) for production