/**
 * Unified DEX API Route
 * Automatically selects between QuickSwap (mainnet), SimpleDEX (testnet), or Demo mode
 */

import { NextRequest, NextResponse } from 'next/server';
import { DEXManagerService } from '@/lib/services/dex-manager.service';

const dexManager = new DEXManagerService();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    switch (action) {
      case 'status': {
        const status = dexManager.getStatus();
        const availableModes = await dexManager.getAvailableModes();
        
        return NextResponse.json({
          success: true,
          current: status,
          available: availableModes,
          recommendation: status.mode === 'quickswap-mainnet' 
            ? 'Using live QuickSwap on mainnet!' 
            : status.mode === 'simpledex-testnet'
            ? 'Using SimpleDEX on testnet for demo'
            : 'Demo mode active - deploy SimpleDEX or wait for mainnet access'
        });
      }

      case 'pool': {
        const token0 = searchParams.get('token0');
        const token1 = searchParams.get('token1');
        
        const pool = await dexManager.getPool(
          token0 as any,
          token1 as any
        );
        
        if (!pool) {
          return NextResponse.json({
            success: false,
            error: 'Pool not found',
            mode: dexManager.getStatus().mode
          }, { status: 404 });
        }
        
        return NextResponse.json({
          success: true,
          mode: dexManager.getStatus().mode,
          data: pool
        });
      }

      case 'positions': {
        const address = searchParams.get('address');
        if (!address) {
          return NextResponse.json({
            success: false,
            error: 'Address required'
          }, { status: 400 });
        }

        const positions = await dexManager.getUserPositions(address as any);
        
        return NextResponse.json({
          success: true,
          mode: dexManager.getStatus().mode,
          data: positions,
          count: positions.length
        });
      }

      case 'switch-mode': {
        const mode = searchParams.get('mode') as any;
        if (!mode) {
          return NextResponse.json({
            success: false,
            error: 'Mode parameter required (quickswap-mainnet, simpledex-testnet, or demo)'
          }, { status: 400 });
        }

        const switched = await dexManager.setMode(mode);
        
        return NextResponse.json({
          success: switched,
          message: switched 
            ? `Switched to ${mode}` 
            : `Failed to switch to ${mode} - not available`,
          currentMode: dexManager.getStatus().mode
        });
      }

      default:
        const status = dexManager.getStatus();
        return NextResponse.json({
          success: true,
          message: 'Unified DEX API - Somnia Liquidity Manager',
          status: status,
          endpoints: [
            'GET /api/dex?action=status - Get current DEX connection status',
            'GET /api/dex?action=pool&token0=...&token1=... - Get pool info',
            'GET /api/dex?action=positions&address=... - Get user positions',
            'GET /api/dex?action=switch-mode&mode=... - Switch DEX mode',
            'POST /api/dex - Execute transactions'
          ],
          notes: {
            quickswap: 'QuickSwap Algebra V4 deployed on Somnia mainnet',
            simpledex: 'Our SimpleDEX deployed on testnet for demos',
            demo: 'Simulated data when neither is accessible'
          }
        });
    }
  } catch (error) {
    console.error('DEX API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      mode: dexManager.getStatus().mode
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action } = body;

  try {
    const currentMode = dexManager.getStatus().mode;

    switch (action) {
      case 'add-liquidity': {
        const result = await dexManager.addLiquidity(body.params);
        
        return NextResponse.json({
          success: !!result,
          mode: currentMode,
          data: result,
          message: currentMode === 'demo' 
            ? 'Demo liquidity added (simulation)'
            : 'Liquidity added successfully'
        });
      }

      case 'swap': {
        const result = await dexManager.swap(body.params);
        
        return NextResponse.json({
          success: !!result,
          mode: currentMode,
          data: result,
          message: currentMode === 'demo'
            ? 'Swap not available in demo mode'
            : 'Swap executed successfully'
        });
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'Unknown action',
          mode: currentMode
        }, { status: 400 });
    }
  } catch (error) {
    console.error('DEX POST error:', error);
    return NextResponse.json({
      success: false,
      error: 'Transaction failed',
      mode: dexManager.getStatus().mode
    }, { status: 500 });
  }
}