import { createPublicClient, http, parseAbi } from 'viem';

const FACTORY_ADDRESS = '0x0ccff3D02A3a200263eC4e0Fdb5E60a56721B8Ae';
const RPC_URL = 'https://api.infra.mainnet.somnia.network';

const FACTORY_ABI = parseAbi([
  'function poolByPair(address tokenA, address tokenB) external view returns (address pool)',
]);

const POOL_ABI = parseAbi([
  'function token0() external view returns (address)',
  'function token1() external view returns (address)',
  'function liquidity() external view returns (uint128)',
  'function globalState() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
  'function fee() external view returns (uint24)',
]);

const TOKENS = {
  WSOMI: '0x046EDe9564A72571df6F5e44d0405360c0f4dCab',
  USDC: '0x28bec7e30e6faee657a03e19bf1128aad7632a00',
  WETH: '0x936Ab8C674bcb567CD5dEB85D8A216494704E9D8',
  USDT: '0x67B302E35Aef5EEE8c32D934F5856869EF428330',
};

async function testPools() {
  console.log('Testing Algebra Pools with simple script...\n');
  
  const client = createPublicClient({
    transport: http(RPC_URL),
  });
  
  // Check factory bytecode
  console.log('1. Checking factory contract...');
  const factoryBytecode = await client.getBytecode({ address: FACTORY_ADDRESS });
  console.log(`   Factory has bytecode: ${factoryBytecode && factoryBytecode !== '0x' ? 'YES ✅' : 'NO ❌'}\n`);
  
  // Find pools
  console.log('2. Looking for pools...\n');
  
  const pairs = [
    ['WSOMI', 'USDC'],
    ['WETH', 'USDC'],
    ['WETH', 'WSOMI'],
    ['USDT', 'USDC'],
  ];
  
  for (const [token0Name, token1Name] of pairs) {
    const token0 = TOKENS[token0Name];
    const token1 = TOKENS[token1Name];
    
    try {
      const poolAddress = await client.readContract({
        address: FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: 'poolByPair',
        args: [token0, token1],
      });
      
      if (poolAddress && poolAddress !== '0x0000000000000000000000000000000000000000') {
        console.log(`   ✅ ${token0Name}/${token1Name} pool: ${poolAddress}`);
        
        // Get pool details
        try {
          const [liquidity, globalState] = await Promise.all([
            client.readContract({
              address: poolAddress,
              abi: POOL_ABI,
              functionName: 'liquidity',
            }),
            client.readContract({
              address: poolAddress,
              abi: POOL_ABI,
              functionName: 'globalState',
            }),
          ]);
          
          const fee = await client.readContract({
            address: poolAddress,
            abi: POOL_ABI,
            functionName: 'fee',
          }).catch(() => 3000n); // Default 0.3% if fee call fails
          
          console.log(`      Liquidity: ${liquidity.toString()}`);
          console.log(`      Price (sqrtPriceX96): ${globalState[0].toString()}`);
          console.log(`      Tick: ${globalState[1]}`);
          console.log(`      Fee (bps): ${Number(fee) / 100}\n`);
        } catch (error) {
          console.log(`      ❌ Error reading pool data: ${error.message}\n`);
        }
      } else {
        console.log(`   ❌ ${token0Name}/${token1Name} pool not found\n`);
      }
    } catch (error) {
      console.log(`   ❌ Error checking ${token0Name}/${token1Name}: ${error.message}\n`);
    }
  }
  
  console.log('✅ Test complete!');
}

testPools().catch(console.error);