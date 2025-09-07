/**
 * Network Management API
 * Easy switching between Mainnet and Testnet
 * NO ENVIRONMENT VARIABLES NEEDED!
 */

import { NextRequest, NextResponse } from 'next/server';
import { NetworkManagerService } from '@/lib/services/network-manager.service';

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
        return NextResponse.json({
          success: true,
          message: `Switched to ${network}`,
          ...newStatus
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
        const token0 = searchParams.get('token0');
        const token1 = searchParams.get('token1');
        
        const pool = await networkManager.getPool(token0 || undefined, token1 || undefined);
        const status = networkManager.getStatus();
        
        // Serialize BigInt values
        const serializedPool = pool ? JSON.parse(JSON.stringify(pool, (key, value) =>
          typeof value === 'bigint' ? value.toString() : value
        )) : null;
        
        return NextResponse.json({
          success: !!pool,
          network: status.network,
          dex: status.activeDEX,
          data: serializedPool,
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