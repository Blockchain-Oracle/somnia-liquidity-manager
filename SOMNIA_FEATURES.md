# 🚀 Somnia Liquidity Manager - Feature Documentation

## Overview
AI-Powered Liquidity Manager for QuickSwap on Somnia blockchain. This application integrates multiple Somnia ecosystem features to provide comprehensive liquidity management with real-time oracle prices, historical data analysis, and AI-driven recommendations.

## 🌟 Key Somnia Features Integrated

### 1. DIA Oracle Integration
Real-time on-chain price feeds for accurate market data and arbitrage detection.

#### Features:
- **Direct Oracle Access**: Query prices directly from DIA's main oracle contract
- **Adapter Contracts**: Chainlink-compatible interface for major assets (BTC, ETH, USDT, USDC, ARB, SOL)
- **Price Staleness Detection**: Automatic detection of stale prices with configurable thresholds
- **Arbitrage Opportunities**: Compare oracle vs DEX prices to identify profitable trades

#### Addresses:
**Mainnet (5031)**:
- Main Oracle: `0xbA0E0750A56e995506CA458b2BdD752754CF39C4`
- USDT Adapter: `0x936C4F07fD4d01485849ee0EE2Cdcea2373ba267`
- USDC Adapter: `0x5D4266f4DD721c1cD8367FEb23E4940d17C83C93`
- BTC Adapter: `0xb12e1d47b0022fA577c455E7df2Ca9943D0152bE`

**Testnet (50312)**:
- Main Oracle: `0x9206296Ea3aEE3E6bdC07F7AaeF14DfCf33d865D`
- USDT Adapter: `0x67d2C2a87A17b7267a6DBb1A59575C0E9A1D1c3e`
- USDC Adapter: `0x235266D5ca6f19F134421C49834C108b32C2124e`

#### Usage Example:
```typescript
const oracleService = new DIAOracleService();

// Get price from main oracle
const btcPrice = await oracleService.getPrice('BTC/USD');

// Get price from adapter (Chainlink interface)
const usdcPrice = await oracleService.getPriceFromAdapter('USDC');

// Check for arbitrage
const priceImpact = await oracleService.calculatePriceImpact(
  'WSOMI', 'USDC', 10, dexPrice
);
```

### 2. Subgraph Integration
GraphQL API for querying historical blockchain data and complex analytics.

#### Features:
- **Pool Analytics**: TVL, volume, fees, transaction counts
- **Position Tracking**: User positions with P&L calculations
- **Historical Data**: Price charts, volume trends, liquidity changes
- **APR Calculations**: Real-time yield calculations based on fees
- **Impermanent Loss**: Track IL for positions over time

#### Endpoints:
- **Mainnet**: `https://proxy.somnia.chain.love/subgraphs/name/somnia-mainnet`
- **Testnet**: `https://proxy.somnia.chain.love/subgraphs/name/somnia-testnet`

#### Query Examples:
```typescript
const subgraphService = new SubgraphService();

// Get pool statistics
const poolStats = await subgraphService.getPoolStats(poolAddress);
// Returns: { tvl, volume24h, fees24h, apr, txCount24h }

// Get user positions
const positions = await subgraphService.getUserPositions(userAddress);

// Get historical data
const priceHistory = await subgraphService.getPoolDayData(poolAddress, 30);

// Calculate pool APR
const apr = await subgraphService.calculatePoolAPR(poolAddress);
```

### 3. QuickSwap Algebra V4 Integration
Full integration with QuickSwap's concentrated liquidity AMM on Somnia mainnet.

#### Features:
- **Concentrated Liquidity**: Capital-efficient liquidity provision
- **Dynamic Fees**: Automatic fee adjustment based on volatility
- **Farming Rewards**: Integration with QuickSwap farming contracts
- **Multi-hop Swaps**: Efficient routing through multiple pools

#### Contracts (Mainnet):
- Factory: `0x0ccff3D02A3a200263eC4e0Fdb5E60a56721B8Ae`
- SwapRouter: `0x1582f6f3D26658F7208A799Be46e34b1f366CE44`
- NFT Position Manager: `0xfE02219e0578B1E4831CDE7C3CB36f71AEb4A833`
- QuoterV2: `0xcB68373404a835268D3ED76255C8148578A82b77`
- Farming Center: `0xEf181Ea0d1223CFEe104439213AF3F1Be6788850`

### 4. SimpleDEX (Testnet Demo)
Custom AMM implementation for testnet demonstrations, following Somnia's DEX building tutorial.

#### Features:
- **Constant Product AMM**: Classic x*y=k formula
- **0.3% Trading Fee**: Standard fee model
- **LP Tokens**: Proportional liquidity representation
- **Faucet Integration**: Test token distribution

#### Deployed Contracts (Testnet):
- Pool: `0xF4a6bbF79D16207a527518fBEB6Be5Aa771984CB`
- WSOMI: `0x001Da752ACD5e96077Ac5Cd757dC9ebAd109210A`
- USDC: `0xb81713B44ef5F68eF921A8637FabC025e63B3523`

### 5. AI-Enhanced Decision Engine
Intelligent recommendations using oracle prices and historical data.

#### Features:
- **Market Analysis**: Volatility detection, trend identification
- **Arbitrage Detection**: Real-time opportunity identification
- **Position Health Scoring**: 0-100 score based on multiple factors
- **Rebalancing Recommendations**: Optimal range suggestions
- **Risk Assessment**: Impermanent loss calculations

#### Enhanced Methods:
```typescript
const aiService = new AIService();

// Analyze with oracle data
const oracleAnalysis = await aiService.analyzeWithOracle(
  'WSOMI', 'USDC', poolAddress
);

// Get enhanced market conditions from subgraph
const marketConditions = await aiService.getEnhancedMarketConditions(poolAddress);

// Get AI recommendation with all data sources
const recommendation = await aiService.getEnhancedRecommendation(
  position, pool, poolAddress
);

// Monitor positions with alerts
await aiService.monitorPositionsWithAlerts(positions, (alert) => {
  console.log(`Alert: ${alert.type} - ${alert.message}`);
});
```

### 6. Network Management System
Seamless switching between mainnet and testnet without environment variables.

#### Features:
- **Hardcoded Configurations**: No environment variables needed
- **Automatic DEX Selection**: QuickSwap on mainnet, SimpleDEX on testnet
- **Network Status API**: Real-time network information
- **Chain-specific Features**: Automatic feature toggling

#### API Endpoints:
```bash
# Get current network
GET /api/network

# Switch network
GET /api/network?action=switch&network=mainnet
GET /api/network?action=switch&network=testnet

# Get network status
GET /api/network?action=status
```

## 📊 Data Flow Architecture

```
User Request
    ↓
Network Manager (determines mainnet/testnet)
    ↓
DEX Manager (routes to QuickSwap or SimpleDEX)
    ↓
[Parallel Data Fetching]
    ├── DIA Oracle → Real-time prices
    ├── Subgraph → Historical data
    └── DEX Contract → Current pool state
    ↓
AI Service (analyzes all data sources)
    ↓
Recommendation Engine
    ↓
User Response (with actionable insights)
```

## 🎯 Use Cases

### 1. Arbitrage Trading
```typescript
// Monitor price differences between oracle and DEX
const priceAnalysis = await aiService.analyzeWithOracle(
  'BTC', 'USDC', poolAddress
);

if (priceAnalysis.arbitrageOpportunity) {
  console.log(`Arbitrage: ${priceAnalysis.priceDeviation}% difference`);
  // Execute arbitrage trade
}
```

### 2. Position Management
```typescript
// Get comprehensive position analysis
const analysis = await aiService.analyzePosition(position, pool);
const recommendation = await aiService.getEnhancedRecommendation(
  position, pool, poolAddress
);

if (recommendation.action === 'rebalance') {
  // Rebalance position with suggested parameters
  await dexManager.rebalancePosition(
    position.id,
    recommendation.suggestedParams
  );
}
```

### 3. Yield Optimization
```typescript
// Find highest APR pools
const topPools = await subgraphService.getTopPools(10);
for (const pool of topPools) {
  const apr = await subgraphService.calculatePoolAPR(pool.id);
  console.log(`Pool ${pool.id}: ${apr}% APR`);
}
```

### 4. Risk Monitoring
```typescript
// Set up alerts for position monitoring
await aiService.monitorPositionsWithAlerts(userPositions, (alert) => {
  if (alert.severity === 'high') {
    // Send notification to user
    notifyUser(alert);
  }
});
```

## 🔧 Configuration

### Network Configuration (`lib/config/networks.config.ts`)
All network configurations are hardcoded for easy deployment:

```typescript
// Mainnet (QuickSwap)
export const MAINNET_CONFIG = {
  chainId: 5031,
  rpcUrl: 'https://rpc.somnia.network',
  contracts: {
    quickswap: { /* addresses */ },
    diaOracle: { /* addresses */ },
    tokens: { /* addresses */ }
  },
  subgraph: { /* endpoint */ }
};

// Testnet (SimpleDEX)
export const TESTNET_CONFIG = {
  chainId: 50312,
  rpcUrl: 'https://dream-rpc.somnia.network',
  contracts: {
    simpledex: { /* addresses */ },
    diaOracle: { /* addresses */ },
    tokens: { /* addresses */ }
  },
  subgraph: { /* endpoint */ }
};
```

## 🚀 Performance Optimizations

### Somnia Network Advantages:
- **1M+ TPS**: Handle high-frequency trading strategies
- **Sub-second Finality**: Instant transaction confirmation
- **~$0.001 Gas Costs**: Frequent rebalancing is economically viable
- **EVM Compatible**: Use existing Ethereum tools and libraries

### Application Optimizations:
- **Parallel Data Fetching**: Oracle, subgraph, and DEX queries run concurrently
- **Caching Layer**: 15-minute cache for frequently accessed data
- **WebSocket Updates**: Real-time position and price updates
- **Batch Operations**: Multiple transactions in single call

## 📈 Analytics Dashboard (Future)

Planned features for comprehensive analytics:
- Real-time P&L tracking
- Historical performance charts
- Fee earnings breakdown
- Impermanent loss visualization
- Portfolio optimization suggestions
- Cross-pool arbitrage scanner

## 🏆 Hackathon Innovation Points

1. **First Liquidity Manager on Somnia**: Pioneering DeFi tool for the ecosystem
2. **Multi-Source Data Integration**: Combines oracle, subgraph, and on-chain data
3. **AI-Driven Decisions**: Machine learning for optimal liquidity management
4. **Zero Configuration**: No environment variables, instant deployment
5. **Dual Network Support**: Seamless mainnet/testnet switching
6. **Real Contract Deployment**: Live on Somnia testnet, not simulations

## 📝 Summary

This liquidity manager demonstrates deep integration with the Somnia ecosystem:
- **DIA Oracle**: Real-time price feeds for accurate market data
- **Subgraph**: Historical analytics and complex queries
- **QuickSwap**: Production-ready concentrated liquidity management
- **SimpleDEX**: Testnet demonstration and development
- **AI Engine**: Intelligent recommendations using all data sources
- **Network Management**: Seamless multi-network support

The application showcases Somnia's capabilities for building sophisticated DeFi applications with high performance, low costs, and comprehensive data access.

## 🔗 Resources

- [Somnia Documentation](https://docs.somnia.network)
- [DIA Oracle Docs](https://docs.diadata.org)
- [QuickSwap Algebra V4](https://docs.quickswap.exchange)
- [Subgraph Documentation](https://thegraph.com/docs)
- [Application Repository](https://github.com/your-repo/somnia-liquidity-manager)

---

Built for Somnia DeFi Mini Hackathon 2025 🏆