# Important Documentation and Requirements from User

## User's Key Requirements and Prompts

### 1. Initial Vision
"just that the codebase is using lot of mocks but we will handle it one by one 
lets first handle the the trade part okay
im thinking of adding bridge feature too okay check the docs so this codebase can be full defi all in one place i hope you get me"

### 2. Critical Network Understanding
"ohh i dont want you to just go in there and start coding without doing proper reserach lol that is wild youd hacucinate impmenetation

im saying some places we are using testnet and quickswap only provided with mainnet adddress and stuff that was why i had my own dex contract stuff intially so for testnet i can just show how this works we can also have mainnet integration too such we can just switch"

### 3. Architecture Requirements
- Testnet: Mock DEX for demonstration
- Mainnet: Real Algebra/QuickSwap V3 integration
- Network switching capability
- Bridge feature (Stargate) for mainnet only
- Show blur/backdrop for mainnet-only features on testnet

---

## Somnia Network - Algebra DEX Contracts (Mainnet V4)

**CRITICAL: These are MAINNET ONLY - No testnet deployment exists**

```solidity
// Algebra (QuickSwap V3) on Somnia Mainnet
AlgebraFactory: 0x0ccff3D02A3a200263eC4e0Fdb5E60a56721B8Ae
AlgebraPoolDeployer: 0x0361B4883FfD676BB0a4642B3139D38A33e452f5
AlgebraCommunityVault: 0xBC8e2d40B90F27Fd9d54005bb38A2770fe9180eF
AlgebraVaultFactoryStub: 0xE7Fe2F9B4fbfebB1A5f1f44857425A3f2598599C
PluginFactory: 0x57Fd247Ce7922067710452923806F52F4b1c2D34
EntryPoint: 0x69cfa238cDD06F4519d70e78272D880646c51F95
TickLens: 0xc868a65f702E1d55CDD2F426DCF97D29A2dA90B9
Quoter: 0xd86C6620300f59f3C6566b3Fb9269674fd5c5264
QuoterV2: 0xcB68373404a835268D3ED76255C8148578A82b77
SwapRouter: 0x1582f6f3D26658F7208A799Be46e34b1f366CE44
NonfungibleTokenPositionDescriptor: 0xfa49223107Ad26c7a91957f2c5b239bC5d02C153
Proxy: 0xD4ba86fbf231ecBc99d99Cd74C998C5f73d4D641
NonfungiblePositionManager: 0xfE02219e0578B1E4831CDE7C3CB36f71AEb4A833
AlgebraInterfaceMulticall: 0x5793c5bA2E1821a817336DAd9bf8bfC9406d3045
AlgebraEternalFarming: 0xFd4D18867d21cD0b0db5918cEf1a3fea55D7D317
FarmingCenter: 0xEf181Ea0d1223CFEe104439213AF3F1Be6788850
```

---

## DIA Oracle Integration on Somnia

### Oracle Contracts (BOTH Networks Available!)

#### Mainnet
- Oracle: `0xbA0E0750A56e995506CA458b2BdD752754CF39C4`
- Gas Wallet: `0x3073d2E61ecb6E4BF4273Af83d53eDAE099ea04a`

#### Testnet
- Oracle: `0x9206296Ea3aEE3E6bdC07F7AaeF14DfCf33d865D`
- Gas Wallet: `0x24384e1c60547b0D5403b21ed9b6fb9457fb573f`

### Oracle Configuration
- **Pricing Methodology:** MAIR
- **Deviation Threshold:** 0.5% (Triggers price update if exceeded)
- **Refresh Frequency:** Every 120 seconds
- **Heartbeat:** Forced price update every 24 hours

### Supported Asset Price Feeds

#### Mainnet Adapters
```javascript
USDT: 0x936C4F07fD4d01485849ee0EE2Cdcea2373ba267
USDC: 0x5D4266f4DD721c1cD8367FEb23E4940d17C83C93
BTC: 0xb12e1d47b0022fA577c455E7df2Ca9943D0152bE
ARB: 0x6a96a0232402c2BC027a12C73f763b604c9F77a6
SOL: 0xa4a3a8B729939E2a79dCd9079cee7d84b0d96234
```

#### Testnet Adapters
```javascript
USDT: 0x67d2C2a87A17b7267a6DBb1A59575C0E9A1D1c3e
USDC: 0x235266D5ca6f19F134421C49834C108b32C2124e
BTC: 0x4803db1ca3A1DA49c3DB991e1c390321c20e1f21
ARB: 0x74952812B6a9e4f826b2969C6D189c4425CBc19B
SOL: 0xD5Ea6C434582F827303423dA21729bEa4F87D519
```

### DIA Oracle Usage Example
```solidity
interface IDIAOracleV2 {
    function getValue(string memory) external view returns (uint128, uint128);
}

contract DIAOracleSample {
    address diaOracle;

    constructor(address _oracle) {
        diaOracle = _oracle;
    }

    function getPrice(string memory key) 
    external 
    view
    returns (
        uint128 latestPrice, 
        uint128 timestampOflatestPrice
    ) {
        (latestPrice, timestampOflatestPrice) =   
                 IDIAOracleV2(diaOracle).getValue(key); 
    }
}
```

---

## Stargate Bridge Integration (MAINNET ONLY)

**Documentation:** https://docs.stargate.finance/

### Key Features
- LayerZero-based omnichain protocol
- Support for 80+ blockchains
- Unified liquidity pools
- Native asset bridging (USDC, USDT, ETH, BTC)
- Cross-chain composability

**Note:** Stargate contracts for Somnia need to be researched from official docs

---

## QuickSwap/Uniswap V3 Subgraph API

### Subgraph Endpoint (If exists for Somnia)
```
https://api.thegraph.com/subgraphs/name/quickswap/v3-somnia
```

### Key Queries

#### Global Stats
```graphql
{
  uniswapFactory(id: "0x..."){
    totalVolumeUSD
    totalLiquidityUSD
    txCount
  }
}
```

#### Token Price Query
```graphql
query tokens($tokenAddress: Bytes!) {
  tokens(where: { id: $tokenAddress }) {
    derivedETH
    totalLiquidity
  }
}
```

#### Pool Information
```graphql
{
  pair(id: "POOL_ADDRESS"){
    token0 { symbol name }
    token1 { symbol name }
    reserve0
    reserve1
    reserveUSD
    volumeUSD
    txCount
  }
}
```

---

## Project Architecture Decisions

### Network Handling Strategy
1. **Testnet (Default)**
   - Mock DEX service with simulated prices
   - Real DIA Oracle integration
   - Demo liquidity positions
   - No bridge functionality
   - Clear "Demo Mode" indicators

2. **Mainnet**
   - Real Algebra/QuickSwap V3 integration
   - Real liquidity and trading
   - Stargate bridge enabled
   - Yield farming with AlgebraEternalFarming
   - Subgraph queries for analytics

### UI/UX Requirements
- Network indicator in top-right
- Feature cards showing availability per network
- "Mainnet Only" badges for restricted features
- Network switching modal
- Blur/backdrop for unavailable features
- Demo notifications on testnet

### File Structure in Somnia Project
```
/lib/services/dex/
  - networkConfig.ts       # Network configurations
  - algebraConfig.ts        # DEX contract addresses
  - algebraService.ts       # Real DEX integration
  - unifiedDexService.ts    # Unified service with mock support

/components/DeFi/
  - NetworkAwareDeFi.tsx    # Main DeFi dashboard
  - TradingInterface.tsx    # Swap UI
  - LiquidityInterface.tsx  # Liquidity provision
  - *.module.css           # Styling files
```

---

## Implementation Status

### ✅ Completed
1. Network configuration system
2. Mock DEX for testnet
3. Algebra DEX integration for mainnet
4. DIA Oracle integration (both networks)
5. Trading interface with slippage protection
6. Liquidity provision interface
7. Network-aware UI components

### ⏳ Pending
1. Stargate bridge UI implementation
2. Yield farming interface
3. Subgraph integration for analytics
4. Wallet connection integration
5. Transaction history
6. Portfolio tracking

---

## Critical Notes

1. **NO ALGEBRA DEX ON TESTNET** - Must use mock implementation
2. **Stargate is MAINNET ONLY** - Show "Mainnet Only" on testnet
3. **DIA Oracle works on BOTH networks** - Different addresses
4. **Always check network before operations**
5. **Clear UI indicators for network requirements**

---

## User's Pain Point
"fuck this is in the wrong codebase wtf
/Users/apple/dev/hackathon/sommia/somnia-liquidity-manager
its was suppose to be in here sighh"

**Resolution:** All code has been moved to the correct directory.