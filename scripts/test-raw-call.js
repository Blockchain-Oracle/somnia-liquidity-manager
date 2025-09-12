import { createPublicClient, http, decodeAbiParameters } from 'viem';

const RPC_URL = 'https://api.infra.mainnet.somnia.network';
const POOL = '0xe5467Be8B8Db6B074904134E8C1a581F5565E2c3';

async function test() {
  const client = createPublicClient({
    transport: http(RPC_URL),
  });

  // Call globalState() - function selector 0xe76c01e4
  const data = await client.request({
    method: 'eth_call',
    params: [{
      to: POOL,
      data: '0xe76c01e4'
    }, 'latest']
  });
  
  console.log('Raw return data:', data);
  console.log('Data length:', (data.length - 2) / 2, 'bytes');
  
  // Manual decode
  const sqrtPriceX96 = '0x' + data.slice(2, 66);
  const tick = parseInt(data.slice(66, 130), 16);
  const observationIndex = parseInt(data.slice(130, 194), 16);
  const observationCardinality = parseInt(data.slice(194, 258), 16);
  const observationCardinalityNext = parseInt(data.slice(258, 322), 16); 
  const feeProtocol = parseInt(data.slice(322, 386), 16);
  const unlocked = data.slice(-1) === '1';
  
  console.log('Manual decode:');
  console.log('  sqrtPriceX96:', BigInt(sqrtPriceX96).toString());
  console.log('  tick:', tick > 0x7fffff ? tick - 0x1000000 : tick); // Convert to signed
  console.log('  observationIndex:', observationIndex);
  console.log('  observationCardinality:', observationCardinality);
  console.log('  observationCardinalityNext:', observationCardinalityNext);
  console.log('  feeProtocol:', feeProtocol); 
  console.log('  unlocked:', unlocked);
}

test().catch(console.error);