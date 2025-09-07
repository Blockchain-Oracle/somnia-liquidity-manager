# Somnia QuickSwap Liquidity Manager - Backend Documentation

## 🏗️ Architecture Overview

The backend is built with **Next.js 14 API Routes** and provides a comprehensive set of services for managing liquidity positions on QuickSwap (Somnia).

```
/lib
├── contracts/           # Contract ABIs and addresses
│   ├── addresses.ts    # QuickSwap contract addresses
│   └── abis/          # JSON ABI files
├── services/           # Core business logic
│   ├── quickswap.service.ts      # Contract interactions
│   ├── ai.service.ts             # AI recommendations
│   ├── price.service.ts         # CEX price feeds (CCXT)
│   └── position-manager.service.ts # Orchestration
└── types/              # TypeScript type definitions

/app/api
├── pools/              # Pool information endpoints
├── positions/          # Position management endpoints
├── prices/            # Price data and arbitrage
├── ai/                # AI analysis endpoints
└── manage/            # Comprehensive management API
```

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Run development server
npm run dev

# Test backend (in another terminal)
node test-backend.js
```

## 📡 API Endpoints

### Pool Endpoints

#### GET /api/pools
Get pool information for a token pair.

**Query Parameters:**
- `token0` (required): Address of token 0
- `token1` (required): Address of token 1
- `network`: 'testnet' or 'mainnet' (default: testnet)

**Response:**
```json
{
  "success": true,
  "data": {
    "address": "0x...",
    "token0": "0x...",
    "token1": "0x...",
    "fee": 3000,
    "tick": -887220,
    "price": "1234567890",
    "liquidity": "1000000000000000000",
    "tickSpacing": 60,
    "priceToken0": 1.23,
    "priceToken1": 0.81
  }
}
```

### Position Endpoints

#### GET /api/positions
Get user positions or specific position.

**Query Parameters:**
- `address`: User wallet address (for all positions)
- `tokenId`: Specific position NFT ID
- `network`: 'testnet' or 'mainnet'

#### POST /api/positions
Create a new liquidity position.

**Body:**
```json
{
  "token0": "0x...",
  "token1": "0x...",
  "tickLower": -887220,
  "tickUpper": 887220,
  "amount0Desired": "1000000000000000000",
  "amount1Desired": "2000000000000000000",
  "recipient": "0x...",
  "privateKey": "0x...",
  "network": "testnet"
}
```

#### PUT /api/positions
Modify existing position (increase/decrease liquidity, collect fees).

**Body:**
```json
{
  "action": "increase|decrease|collect",
  "tokenId": "123",
  "amount0Desired": "1000000000000000000",
  "liquidity": "500000000000000000",
  "privateKey": "0x...",
  "network": "testnet"
}
```

### Price Endpoints

#### GET /api/prices
Get price data from CEXs.

**Query Parameters:**
- `symbol` (required): Trading pair (e.g., "ETH/USDT")
- `exchange`: Specific exchange (binance, okx, gate)
- `aggregated`: true for volume-weighted average

#### POST /api/prices
Check for arbitrage opportunities.

**Body:**
```json
{
  "symbol": "ETH/USDT",
  "dexPrice": 3000,
  "minProfitPercent": 0.5
}
```

#### GET /api/prices/history
Get historical OHLCV data.

**Query Parameters:**
- `symbol` (required): Trading pair
- `timeframe`: 1m, 5m, 15m, 1h, 4h, 1d
- `limit`: Number of candles (default: 100)
- `exchange`: Exchange to use
- `volatility`: true to include volatility calculation

### AI Analysis Endpoints

#### GET /api/ai/analyze
Get optimal range for a pool.

**Query Parameters:**
- `token0` (required): Token 0 address
- `token1` (required): Token 1 address
- `network`: Network to use
- `timeframe`: 1h, 24h, 7d

#### POST /api/ai/analyze
Analyze a position with AI recommendations.

**Body:**
```json
{
  "tokenId": "123",
  "position": { /* position data */ },
  "marketData": {
    "volatility": "low|medium|high",
    "trend": "bullish|bearish|neutral",
    "volume24h": 1000000,
    "priceChange24h": 2.5
  },
  "openaiKey": "sk-..." // Optional
}
```

### Management Endpoint

#### POST /api/manage
Comprehensive position management.

**Actions:**
- `analyze_all`: Analyze all positions for a user
- `analyze_position`: Analyze single position
- `execute`: Execute a management action

**Body for analyze_all:**
```json
{
  "action": "analyze_all",
  "userAddress": "0x...",
  "strategy": "conservative|balanced|aggressive",
  "includeMarketData": true
}
```

## 🧠 AI Features

The AI service provides intelligent recommendations based on:

1. **Position Health Analysis**
   - In-range status
   - Impermanent loss calculation
   - Fee accumulation tracking

2. **Market Conditions**
   - Volatility assessment (via CCXT)
   - Trend detection
   - Volume analysis

3. **Recommendations**
   - Rebalancing suggestions
   - Optimal range calculation
   - Fee compounding timing
   - Risk assessment

### AI Configuration

To enable OpenAI-powered features:
1. Get API key from [OpenAI Platform](https://platform.openai.com/)
2. Add to `.env`: `OPENAI_API_KEY=sk-...`
3. Pass `openaiKey` in API requests

Without OpenAI key, the system uses rule-based recommendations.

## 📊 Price Feeds

The price service uses CCXT to fetch data from multiple CEXs:

- **Supported Exchanges**: Binance, OKX, Gate.io
- **Features**:
  - Real-time price feeds
  - Historical OHLCV data
  - Volatility calculation
  - Arbitrage detection
  - Volume-weighted average prices

## 🔧 Services

### QuickSwapService
Core service for interacting with QuickSwap contracts:
- Get pool information
- Fetch user positions
- Create/modify positions
- Collect fees
- Execute swaps

### AIService
Provides intelligent analysis:
- Position health scoring
- Rebalancing recommendations
- Impermanent loss calculation
- Market condition assessment

### PriceService
CEX price data via CCXT:
- Multi-exchange price aggregation
- Historical data fetching
- Volatility calculation
- Arbitrage opportunity detection

### PositionManagerService
Orchestrates all services:
- Comprehensive position analysis
- Strategy-based management
- Action execution
- Report generation

## 🧪 Testing

Run the test suite:

```bash
# Start dev server
npm run dev

# In another terminal
node test-backend.js
```

The test script covers:
- Pool information retrieval
- Position management
- Price feeds
- AI analysis
- Error handling

## 🔐 Security Notes

1. **Private Keys**: Never expose private keys in production. Users should connect their own wallets.
2. **API Keys**: Keep OpenAI and other API keys secure.
3. **CORS**: Configure appropriate CORS settings for production.
4. **Rate Limiting**: Implement rate limiting for public endpoints.
5. **Input Validation**: All inputs are validated but additional sanitization recommended for production.

## 🌐 Network Configuration

### Somnia Testnet
- Chain ID: 50312
- RPC: https://testnet.somnia.network
- Explorer: https://explorer.testnet.somnia.network
- Faucet: https://somnia.faucetme.pro/

### Somnia Mainnet
- Chain ID: 50311
- RPC: https://rpc.somnia.network
- Explorer: https://explorer.somnia.network

## 📝 Contract Addresses

All networks use the same contract addresses:
- Factory: `0x0ccff3D02A3a200263eC4e0Fdb5E60a56721B8Ae`
- Router: `0x1582f6f3D26658F7208A799Be46e34b1f366CE44`
- Position Manager: `0xfE02219e0578B1E4831CDE7C3CB36f71AEb4A833`
- Quoter: `0x0524E833cCD057e4d7A296e3aaAb9f7675964Ce1`

## 🚦 Status Codes

- `200`: Success
- `400`: Bad request (missing/invalid parameters)
- `404`: Resource not found
- `500`: Internal server error
- `501`: Not implemented

## 📦 Dependencies

Key packages:
- `viem`: Ethereum interactions
- `wagmi`: React hooks for Web3
- `ccxt`: Exchange connections
- `openai`: AI recommendations
- `@rainbow-me/rainbowkit`: Wallet connections

## 🔄 Next Steps

Frontend integration needs:
1. Wallet connection (RainbowKit)
2. Position display components
3. Range selector UI
4. Price charts
5. Action confirmation modals
6. Transaction status tracking

---

Built for the Somnia DeFi Mini Hackathon 🚀