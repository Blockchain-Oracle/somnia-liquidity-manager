# Network Differences: Testnet vs Mainnet

## Testnet (Chain ID: 50312) - OUR DEPLOYED CONTRACTS

### Tokens (Mock tokens we deployed)
- **STT** (0x001Da752ACD5e96077Ac5Cd757dC9ebAd109210A) - Test token
- **tWETH** (0x4DfB21D6419dc430F5D5F901B0E699ff2BaD9Ac1) - Test WETH
- **tUSDC** (0xbb9474aA3a654DDA7Ff09A94a9Bd7C7095E62732) - Test USDC
- **tUSDT** (0x0EC9D4B712F16F5054c2CE9Da5c5FEbf360AE149) - Test USDT

### Pools (SimpleLiquidityPool contracts WE DEPLOYED)
- STT/tWETH: 0xd0BC69A4A4599b561c944f4F0263f498F396e4BD
- STT/tUSDC: 0x735901b22d167e2FA38F97E95886754CAe925CEF
- STT/tUSDT: 0xeCa49817EeDDCE89A6e0b978d46B51c4d8A8f611
- tWETH/tUSDC: 0xa55B7A74D05b5D5C48E431e44Fea83a1047A7582
- tWETH/tUSDT: 0x0247FFDb658563f019eE256226f6B82e9Ae79000
- tUSDC/tUSDT: 0xD0dAFd63d42cae8220089fbC3c541c4F09740bCb

### TVL Calculation
- Fetched directly from contract reserves (reserve0, reserve1)
- Mock prices used: STT=$2, tWETH=$4000, tUSDC=$1, tUSDT=$1
- TVL = (reserve0 * price0) + (reserve1 * price1)

### Volume & APY
- Volume24h = TVL * 0.1 (mock 10% daily volume)
- APY = (dailyFees / TVL) * 365 * 100
- Fee = 0.3% of volume

### Contract Interactions
- Uses SimpleLiquidityPool ABI
- Requires ERC20 approval before addLiquidity
- Functions: addLiquidity, removeLiquidity, swap

### Explorer
- https://shannon-explorer.somnia.network

---

## Mainnet (Chain ID: 5031) - QUICKSWAP ALGEBRA V4 (NOT OUR CONTRACTS!)

### Tokens (Real tokens on mainnet)
- **WSOMI** (0x046EDe9564A72571df6F5e44d0405360c0f4dCab) - Wrapped SOMI
- **WETH** (0x936Ab8C674bcb567CD5dEB85D8A216494704E9D8)
- **USDC** (0x28BEc7E30E6faee657a03e19Bf1128AaD7632A00)
- **USDT** (0x67B302E35Aef5EEE8c32D934F5856869EF428330)

### DEX Contracts (QuickSwap Algebra V4 - NOT OUR DEPLOYMENT)
- Factory: 0x0ccff3D02A3a200263eC4e0Fdb5E60a56721B8Ae
- Router: 0x1582f6f3D26658F7208A799Be46e34b1f366CE44
- Position Manager: 0xfE02219e0578B1E4831CDE7C3CB36f71AEb4A833

### Pools
- Dynamic pools created by QuickSwap users
- Need to fetch from Algebra Factory contract
- We DO NOT have SimpleLiquidityPool on mainnet!

### TVL Calculation
- Fetched from Algebra pool contracts (tvlUSD field)
- Uses real price feeds from oracle/DEX

### Volume & APR
- Real 24h volume from trading activity
- APR calculated from actual fee collection

### Contract Interactions
- Uses Algebra V4 ABI
- Complex position management with NFTs
- Functions vary based on concentrated liquidity

### Explorer
- https://explorer.somnia.network

---

## Key Differences in Code

### 1. Pool Data Structure
```typescript
// Testnet
{
  tvl: number,      // Simple TVL in USD
  apy: number,      // Mock APY
  fee: 0.003        // Fixed 0.3%
}

// Mainnet
{
  tvlUSD: number,   // Real TVL from DEX
  apr: number,      // Real APR from fees
  fee: variable     // Dynamic fee tiers
}
```

### 2. Token Address Resolution
```typescript
// Testnet
const tokenAddress = TESTNET_CONTRACTS.tokens[symbol]

// Mainnet
const tokenAddress = MAINNET_CONTRACTS.tokens[symbol]
```

### 3. Service Usage
```typescript
// Testnet
import { testnetPoolsService } from '@/lib/services/testnetPoolsService'
import { testnetSwapService } from '@/lib/services/testnetSwapService'

// Mainnet
import { algebraPoolsService } from '@/lib/services/algebraPoolsService'
import { enhancedSwapService } from '@/lib/services/enhancedSwapService'
```

### 4. Contract Calls
```typescript
// Testnet - Simple liquidity
abi: SIMPLE_POOL_ABI
functionName: 'addLiquidity'
args: [amount0, amount1]

// Mainnet - Concentrated liquidity
abi: ALGEBRA_V4_ABI
functionName: 'mint'
args: [tickLower, tickUpper, amount0, amount1, ...]
```

## Important Notes

1. **Always check `isTestnet` from useNetwork() hook** before deciding which contracts/services to use
2. **Token symbols differ**: Testnet uses tWETH, tUSDC, etc. Mainnet uses WETH, USDC, etc.
3. **Pool addresses are completely different** between networks
4. **TVL/Volume calculations** are mocked on testnet, real on mainnet
5. **Explorer URLs** are different for each network