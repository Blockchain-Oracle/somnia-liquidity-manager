/**
 * Network Management API
 * Easy switching between Mainnet and Testnet
 * NO ENVIRONMENT VARIABLES NEEDED!
 */

import { NextRequest, NextResponse } from 'next/server';
import { NetworkManagerService } from '@/lib/services/network-manager.service';

// Token symbol to address mapping for Somnia mainnet
const TOKEN_ADDRESSES: Record<string, string> = {
  'WETH': '0x936Ab8C674bcb567CD5dEB85D8A216494704E9D8',
  'USDC': '0x28BEc7E30E6faee657a03e19Bf1128AaD7632A00',
  'USDT': '0x67B302E35Aef5EEE8c32D934F5856869EF428330',
  'WSOMI': '0x046EDe9564A72571df6F5e44d0405360c0f4dCab',
  'SOMI': '0x046EDe9564A72571df6F5e44d0405360c0f4dCab', // Use WSOMI address
};

// Convert token symbol to address
function getTokenAddress(tokenSymbol: string | undefined): string | undefined {
  if (!tokenSymbol) return undefined;
  
  // If it's already an address (starts with 0x and has 42 chars), return as is
  if (tokenSymbol.startsWith('0x') && tokenSymbol.length === 42) {
    return tokenSymbol;
  }
  
  // Otherwise look up the address
  return TOKEN_ADDRESSES[tokenSymbol.toUpperCase()] || undefined;
}

// Get singleton instance
const networkManager = NetworkManagerService.getInstance();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    switch (action) {
      case 'status': {
        const status = networkManager.getStatus();
        return NextResponse.json({
          success: true,
          ...status,
          tip: status.network === 'mainnet' 
            ? '💡 Mainnet uses QuickSwap (real Algebra V4 contracts)'
            : '💡 Testnet uses SimpleDEX (our deployed contracts)'
        });
      }

      case 'switch': {
        const network = searchParams.get('network');
        if (!network || (network !== 'mainnet' && network !== 'testnet')) {
          return NextResponse.json({
            success: false,
            error: 'Invalid network. Use: ?network=mainnet or ?network=testnet'
          }, { status: 400 });
        }

        const newStatus = await networkManager.switchToNetwork(network);
        const { message, ...statusWithoutMessage } = newStatus;
        return NextResponse.json({
          success: true,
          message: `Switched to ${network}`,
          ...statusWithoutMessage
        });
      }

      case 'contracts': {
        const status = networkManager.getStatus();
        return NextResponse.json({
          success: true,
          network: status.network,
          contracts: status.contracts,
          explanation: {
            mainnet: 'QuickSwap Algebra V4 contracts (REAL, DEPLOYED)',
            testnet: 'SimpleDEX contracts (deploy with: npm run deploy:testnet)'
          }
        });
      }

      case 'pool': {
        const token0Symbol = searchParams.get('token0');
        const token1Symbol = searchParams.get('token1');
        
        // Convert symbols to addresses
        const token0Address = getTokenAddress(token0Symbol || undefined);
        const token1Address = getTokenAddress(token1Symbol || undefined);
        
        // Skip pool fetching if tokens aren't supported on Somnia
        if ((token0Symbol && !token0Address) || (token1Symbol && !token1Address)) {
          return NextResponse.json({
            success: false,
            message: `Token not available on Somnia mainnet. Supported tokens: ${Object.keys(TOKEN_ADDRESSES).join(', ')}`,
            supportedTokens: Object.keys(TOKEN_ADDRESSES),
            network: networkManager.getCurrentNetwork()
          });
        }
        
        const pool = await networkManager.getPool(token0Address, token1Address);
        const status = networkManager.getStatus();
        
        // Serialize BigInt values
        const serializedPool = pool ? JSON.parse(JSON.stringify(pool, (key, value) =>
          typeof value === 'bigint' ? value.toString() : value
        )) : null;
        
        // Add liquidity information if available
        let liquidityInfo = null;
        if (pool && pool.liquidity) {
          const liquidityValue = typeof pool.liquidity === 'bigint' 
            ? Number(pool.liquidity) / 1e18 
            : pool.liquidity;
          liquidityInfo = {
            totalLiquidity: liquidityValue,
            token0Reserve: pool.token0Reserve || 0,
            token1Reserve: pool.token1Reserve || 0,
            tvl: pool.tvl || liquidityValue * 2 // Rough estimate
          };
        }
        
        return NextResponse.json({
          success: !!pool,
          network: status.network,
          dex: status.activeDEX,
          data: serializedPool,
          liquidity: liquidityInfo,
          message: pool 
            ? `Pool data from ${status.activeDEX} on ${status.network}`
            : 'No pool found'
        });
      }

      case 'positions': {
        const address = searchParams.get('address');
        if (!address) {
          return NextResponse.json({
            success: false,
            error: 'Address parameter required'
          }, { status: 400 });
        }

        const positions = await networkManager.getUserPositions(address);
        const status = networkManager.getStatus();
        
        // Serialize BigInt values
        const serializedPositions = positions.map(pos => 
          JSON.parse(JSON.stringify(pos, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
          ))
        );
        
        return NextResponse.json({
          success: true,
          network: status.network,
          dex: status.activeDEX,
          count: positions.length,
          data: serializedPositions
        });
      }

      default:
        const currentStatus = networkManager.getStatus();
        return NextResponse.json({
          success: true,
          message: 'Somnia Network Manager API',
          current: {
            network: currentStatus.network,
            dex: currentStatus.activeDEX,
            connected: currentStatus.isConnected
          },
          endpoints: [
            'GET /api/network?action=status - Current network status',
            'GET /api/network?action=switch&network=mainnet - Switch to mainnet',
            'GET /api/network?action=switch&network=testnet - Switch to testnet',
            'GET /api/network?action=contracts - View contract addresses',
            'GET /api/network?action=pool - Get pool information',
            'GET /api/network?action=positions&address=0x... - Get user positions'
          ],
          quickstart: [
            '1. Switch to mainnet: /api/network?action=switch&network=mainnet',
            '2. Switch to testnet: /api/network?action=switch&network=testnet',
            '3. Check status: /api/network?action=status'
          ]
        });
    }
  } catch (error: any) {
    console.error('Network API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error',
      network: networkManager.getCurrentNetwork()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action } = body;

  try {
    const status = networkManager.getStatus();

    switch (action) {
      case 'add-liquidity': {
        if (status.activeDEX === 'demo') {
          return NextResponse.json({
            success: false,
            error: 'Cannot add liquidity in demo mode. Deploy SimpleDEX or switch to mainnet.'
          }, { status: 400 });
        }

        const result = await networkManager.addLiquidity(body.params);
        return NextResponse.json({
          success: !!result,
          network: status.network,
          dex: status.activeDEX,
          transaction: result,
          message: `Liquidity added via ${status.activeDEX} on ${status.network}`
        });
      }

      case 'deploy-simpledex': {
        if (!networkManager.isTestnet()) {
          return NextResponse.json({
            success: false,
            error: 'SimpleDEX can only be deployed on testnet'
          }, { status: 400 });
        }

        return NextResponse.json({
          success: false,
          message: 'Please run: npm run deploy:testnet',
          note: 'Deployment must be done via command line'
        });
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'Unknown action'
        }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Transaction failed'
    }, { status: 500 });
  }
}