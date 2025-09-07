# Somnia Liquidity Manager

**The Problem:** Managing liquidity on DEXs is hard. You need to track prices, monitor positions, rebalance ranges, and watch for impermanent loss - all while missing profitable opportunities.

**Our Solution:** An AI-powered liquidity manager that does the heavy lifting for you. It watches oracle prices, analyzes market conditions, and tells you exactly when and how to adjust your positions for maximum profit.

## Quick Start

```bash
# Install dependencies
pnpm install

# Run the app
pnpm dev

# Open in browser
http://localhost:3002
```

## What It Does

1. **Monitors Your Positions** - Tracks all your liquidity positions across QuickSwap (mainnet) and SimpleDEX (testnet)
2. **Compares Prices** - Checks DIA oracle prices against DEX prices to find arbitrage opportunities  
3. **AI Recommendations** - Tells you when to rebalance, add liquidity, or exit positions
4. **Real-time Alerts** - Notifies you about important events like positions going out of range

## Key Features

### DIA Oracle Integration
Get real-time price feeds directly from on-chain oracles. No more relying on CEX APIs or stale data.

- **BTC Price**: Real-time from DIA oracle ($110,209 as of testing)
- **Stablecoin Prices**: USDC, USDT tracking
- **Arbitrage Detection**: Compare oracle vs DEX prices instantly

### Smart Position Management
The AI analyzes multiple data sources to give you actionable advice:

- Historical price movements from Subgraph
- Current oracle prices from DIA
- Pool statistics and APR calculations
- Volatility and trend analysis

### Network Support
Works on both Somnia networks:
- **Mainnet**: QuickSwap V4 (concentrated liquidity)
- **Testnet**: SimpleDEX (our deployment for testing)

## Contract Addresses

### Testnet (Chain ID: 50312)

**SimpleDEX Contracts** (Deployed by us):
- Pool: [`0xF4a6bbF79D16207a527518fBEB6Be5Aa771984CB`](https://shannon-explorer.somnia.network/address/0xF4a6bbF79D16207a527518fBEB6Be5Aa771984CB)
- WSOMI Token: [`0x001Da752ACD5e96077Ac5Cd757dC9ebAd109210A`](https://shannon-explorer.somnia.network/address/0x001Da752ACD5e96077Ac5Cd757dC9ebAd109210A)
- USDC Token: [`0xb81713B44ef5F68eF921A8637FabC025e63B3523`](https://shannon-explorer.somnia.network/address/0xb81713B44ef5F68eF921A8637FabC025e63B3523)

**DIA Oracle (Testnet)**:
- Main Oracle: [`0x9206296Ea3aEE3E6bdC07F7AaeF14DfCf33d865D`](https://shannon-explorer.somnia.network/address/0x9206296Ea3aEE3E6bdC07F7AaeF14DfCf33d865D)
- USDT Adapter: [`0x67d2C2a87A17b7267a6DBb1A59575C0E9A1D1c3e`](https://shannon-explorer.somnia.network/address/0x67d2C2a87A17b7267a6DBb1A59575C0E9A1D1c3e)
- USDC Adapter: [`0x235266D5ca6f19F134421C49834C108b32C2124e`](https://shannon-explorer.somnia.network/address/0x235266D5ca6f19F134421C49834C108b32C2124e)
- BTC Adapter: [`0x4803db1ca3A1DA49c3DB991e1c390321c20e1f21`](https://shannon-explorer.somnia.network/address/0x4803db1ca3A1DA49c3DB991e1c390321c20e1f21)

### Mainnet (Chain ID: 5031)

**QuickSwap V4 Contracts**:
- Factory: [`0x0ccff3D02A3a200263eC4e0Fdb5E60a56721B8Ae`](https://explorer.somnia.network/address/0x0ccff3D02A3a200263eC4e0Fdb5E60a56721B8Ae)
- Swap Router: [`0x1582f6f3D26658F7208A799Be46e34b1f366CE44`](https://explorer.somnia.network/address/0x1582f6f3D26658F7208A799Be46e34b1f366CE44)
- Position Manager: [`0xfE02219e0578B1E4831CDE7C3CB36f71AEb4A833`](https://explorer.somnia.network/address/0xfE02219e0578B1E4831CDE7C3CB36f71AEb4A833)

**DIA Oracle (Mainnet)**:
- Main Oracle: [`0xbA0E0750A56e995506CA458b2BdD752754CF39C4`](https://explorer.somnia.network/address/0xbA0E0750A56e995506CA458b2BdD752754CF39C4)
- USDT Adapter: [`0x936C4F07fD4d01485849ee0EE2Cdcea2373ba267`](https://explorer.somnia.network/address/0x936C4F07fD4d01485849ee0EE2Cdcea2373ba267)
- USDC Adapter: [`0x5D4266f4DD721c1cD8367FEb23E4940d17C83C93`](https://explorer.somnia.network/address/0x5D4266f4DD721c1cD8367FEb23E4940d17C83C93)
- BTC Adapter: [`0xb12e1d47b0022fA577c455E7df2Ca9943D0152bE`](https://explorer.somnia.network/address/0xb12e1d47b0022fA577c455E7df2Ca9943D0152bE)

## API Endpoints

### Network Management
```bash
# Get current network
GET /api/network

# Switch networks
GET /api/network?action=switch&network=mainnet
GET /api/network?action=switch&network=testnet
```

### SimpleDEX Operations (Testnet)
```bash
# Get pool info
GET /api/simpledex?action=pool

# Get swap quote
GET /api/simpledex?action=quote&amount=10&zeroForOne=true

# Check position
GET /api/simpledex?action=position&address=YOUR_ADDRESS
```

### Oracle Prices
```bash
# Get BTC price
GET /api/oracle?asset=BTC

# Get multiple prices
GET /api/oracle?assets=BTC,USDC,USDT

# Check arbitrage opportunity
GET /api/oracle?action=arbitrage&token0=WSOMI&token1=USDC&poolAddress=POOL_ADDRESS
```

## How It Works

### 1. Price Monitoring
The system continuously monitors:
- **DIA Oracle**: On-chain price feeds updated every 120 seconds
- **DEX Prices**: Real-time from liquidity pools
- **Price Deviation**: Alerts when oracle and DEX prices differ by >2%

### 2. Position Analysis
For each position, we calculate:
- **Health Score**: 0-100 based on range, fees earned, and market conditions
- **Impermanent Loss**: Real-time IL calculation
- **Fee APR**: Annualized return from trading fees
- **Range Status**: Whether position is in range and earning fees

### 3. AI Recommendations
The AI considers:
- Current market volatility (from historical data)
- Price trends (7-day moving average)
- Arbitrage opportunities (oracle vs DEX)
- Gas costs on Somnia (~$0.001 per tx)

Then recommends:
- **REBALANCE**: When position is out of range in stable market
- **ADD**: When arbitrage opportunity exists
- **COMPOUND**: When fees exceed threshold
- **REMOVE**: When high volatility threatens position
- **HOLD**: When no action needed

## Testing

```bash
# Run comprehensive tests
npx tsx scripts/test-all-services.ts

# Deploy SimpleDEX (testnet only)
npx hardhat run scripts/deploy-simpledex.ts --network somnia-testnet
```

## Architecture

```
User Request → Network Manager → DEX Service
                                      ↓
                            [Parallel Data Fetch]
                                      ↓
                    DIA Oracle ← AI Engine → Subgraph
                                      ↓
                              Recommendation → User
```

## Why Somnia?

- **Fast**: 1M+ TPS means instant rebalancing
- **Cheap**: ~$0.001 gas makes frequent adjustments profitable
- **EVM**: Use existing tools and knowledge
- **DIA Oracle**: Real on-chain price feeds
- **QuickSwap V4**: Advanced concentrated liquidity

## For Developers

### Adding New Features
1. Services are in `lib/services/`
2. API routes in `app/api/`
3. Contracts in `contracts/`
4. Network config in `lib/config/networks.config.ts`

### Key Services
- `DIAOracleService`: Fetches oracle prices
- `SubgraphService`: Queries historical data
- `AIService`: Generates recommendations
- `SimpleDEXService`: Manages testnet DEX
- `NetworkManagerService`: Handles network switching

## Support

Built for Somnia DeFi Mini Hackathon 2025

- [Somnia Discord](https://discord.com/invite/somnia)
- [Somnia Docs](https://docs.somnia.network)
- [DIA Oracle Docs](https://docs.diadata.org)

## License

MIT