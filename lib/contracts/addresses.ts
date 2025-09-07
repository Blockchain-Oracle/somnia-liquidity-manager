/**
 * QuickSwap Algebra V4 Contract Addresses on Somnia
 * Based on governance proposal and deployment information
 */

export const CONTRACTS = {
  // Somnia Testnet (Chain ID: 50312)
  testnet: {
    chainId: 50312,
    rpcUrl: 'https://testnet.somnia.network',
    explorerUrl: 'https://explorer.testnet.somnia.network',
    nativeSymbol: 'STT',
    
    // Core QuickSwap Algebra V4 Contracts (need to verify if deployed on testnet)
    factory: '0x0ccff3D02A3a200263eC4e0Fdb5E60a56721B8Ae',
    router: '0x1582f6f3D26658F7208A799Be46e34b1f366CE44',
    positionManager: '0xfE02219e0578B1E4831CDE7C3CB36f71AEb4A833',
    quoter: '0x0524E833cCD057e4d7A296e3aaAb9f7675964Ce1',
    multicall: '0x5e44F178E8cF9B2F5409B6f18ce936aB817C5a11', // Updated from mainnet
    
    // Token addresses (need testnet addresses)
    tokens: {
      WSTT: '', // Need testnet address
      USDC: '', // Need testnet address
      USDT: '', // Need testnet address
      WETH: '', // Need testnet address
    }
  },
  
  // Somnia Mainnet (Chain ID: 50311) - ACTUAL ADDRESSES
  mainnet: {
    chainId: 50311,
    rpcUrl: 'https://dream-rpc.somnia.network', // Updated to correct RPC
    wsUrl: 'wss://dream-rpc.somnia.network/ws', // WebSocket endpoint
    explorerUrl: 'https://explorer.somnia.network',
    nativeSymbol: 'SOMI', // Corrected: SOMI not STT
    
    // Core Somnia Contracts (ACTUAL DEPLOYED)
    multicall: '0x5e44F178E8cF9B2F5409B6f18ce936aB817C5a11',
    
    // QuickSwap Algebra V4 Contracts (CONFIRMED DEPLOYED!)
    algebraFactory: '0x0ccff3D02A3a200263eC4e0Fdb5E60a56721B8Ae',
    algebraPoolDeployer: '0x0361B4883FfD676BB0a4642B3139D38A33e452f5',
    swapRouter: '0x1582f6f3D26658F7208A799Be46e34b1f366CE44',
    nonfungiblePositionManager: '0xfE02219e0578B1E4831CDE7C3CB36f71AEb4A833',
    quoter: '0xd86C6620300f59f3C6566b3Fb9269674fd5c5264',
    quoterV2: '0xcB68373404a835268D3ED76255C8148578A82b77',
    tickLens: '0xc868a65f702E1d55CDD2F426DCF97D29A2dA90B9',
    interfaceMulticall: '0x5793c5bA2E1821a817336DAd9bf8bfC9406d3045',
    
    // Farming contracts
    algebraEternalFarming: '0xFd4D18867d21cD0b0db5918cEf1a3fea55D7D317',
    farmingCenter: '0xEf181Ea0d1223CFEe104439213AF3F1Be6788850',
    
    // Vault and plugins
    communityVault: '0xBC8e2d40B90F27Fd9d54005bb38A2770fe9180eF',
    vaultFactoryStub: '0xE7Fe2F9B4fbfebB1A5f1f44857425A3f2598599C',
    pluginFactory: '0x57Fd247Ce7922067710452923806F52F4b1c2D34',
    
    // Additional contracts
    entryPoint: '0x69cfa238cDD06F4519d70e78272D880646c51F95',
    nftPositionDescriptor: '0xfa49223107Ad26c7a91957f2c5b239bC5d02C153',
    proxy: '0xD4ba86fbf231ecBc99d99Cd74C998C5f73d4D641',
    
    // Token addresses (ACTUAL DEPLOYED ON SOMNIA)
    tokens: {
      WSOMI: '0x046EDe9564A72571df6F5e44d0405360c0f4dCab', // Wrapped SOMI
      USDC: '0x28BEc7E30E6faee657a03e19Bf1128AaD7632A00',
      USDT: '0x67B302E35Aef5EEE8c32D934F5856869EF428330',
      WETH: '0x936Ab8C674bcb567CD5dEB85D8A216494704E9D8',
    },
    
    // LayerZero Integration
    layerZero: {
      endpoint: '0x6F475642a6e85809B1c36Fa62763669b1b48DD5B',
      sendUln302: '0xC39161c743D0307EB9BCc9FEF03eeb9Dc4802de7',
      receiveUln302: '0xe1844c5D63a9543023008D332Bd3d2e6f1FE1043',
      executor: '0x4208D6E27538189bB48E603D6123A94b8Abe0A0b',
      eid: 30380,
    },
    
    // DIA Oracle
    oracle: {
      priceOracle: '0xbA0E0750A56e995506CA458b2BdD752754CF39C4',
      gasWallet: '0x3073d2E61ecb6E4BF4273Af83d53eDAE099ea04a',
    }
  }
} as const;

// Helper to get current network config
export function getNetworkConfig(network: 'testnet' | 'mainnet' = 'testnet') {
  return CONTRACTS[network];
}

// Export type for network config
export type NetworkConfig = typeof CONTRACTS.testnet;