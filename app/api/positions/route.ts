/**
 * API Route: /api/positions
 * Manage liquidity positions
 */

import { NextRequest, NextResponse } from 'next/server';
import { QuickSwapService } from '@/lib/services/quickswap.service';
import type { Address } from 'viem';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userAddress = searchParams.get('address') as Address | null;
    const tokenId = searchParams.get('tokenId');
    const network = (searchParams.get('network') || 'testnet') as 'testnet' | 'mainnet';

    const quickswap = new QuickSwapService(network);

    // Get specific position by tokenId
    if (tokenId) {
      const position = await quickswap.getPosition(BigInt(tokenId));
      
      if (!position) {
        return NextResponse.json(
          { error: 'Position not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          ...position,
          tokenId: tokenId.toString(),
          liquidity: position.liquidity.toString(),
          tokensOwed0: position.tokensOwed0.toString(),
          tokensOwed1: position.tokensOwed1.toString(),
        }
      });
    }

    // Get all positions for user
    if (userAddress) {
      const positions = await quickswap.getUserPositions(userAddress);
      
      const formattedPositions = positions.map(pos => ({
        ...pos,
        tokenId: pos.tokenId.toString(),
        liquidity: pos.liquidity.toString(),
        tokensOwed0: pos.tokensOwed0.toString(),
        tokensOwed1: pos.tokensOwed1.toString(),
        feeGrowthInside0LastX128: pos.feeGrowthInside0LastX128.toString(),
        feeGrowthInside1LastX128: pos.feeGrowthInside1LastX128.toString(),
      }));

      return NextResponse.json({
        success: true,
        data: formattedPositions
      });
    }

    return NextResponse.json(
      { error: 'address or tokenId parameter required' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in /api/positions GET:', error);
    return NextResponse.json(
      { error: 'Failed to fetch positions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      token0,
      token1,
      tickLower,
      tickUpper,
      amount0Desired,
      amount1Desired,
      amount0Min,
      amount1Min,
      recipient,
      deadline,
      privateKey,
      network = 'testnet'
    } = body;

    if (!privateKey) {
      return NextResponse.json(
        { error: 'Private key required for creating positions' },
        { status: 400 }
      );
    }

    const quickswap = new QuickSwapService(network, privateKey);
    
    const params = {
      token0: token0 as Address,
      token1: token1 as Address,
      tickLower: Number(tickLower),
      tickUpper: Number(tickUpper),
      amount0Desired: BigInt(amount0Desired),
      amount1Desired: BigInt(amount1Desired),
      amount0Min: BigInt(amount0Min || 0),
      amount1Min: BigInt(amount1Min || 0),
      recipient: recipient as Address,
      deadline: BigInt(deadline || Math.floor(Date.now() / 1000) + 3600), // 1 hour from now
    };

    const txHash = await quickswap.mintPosition(params);

    if (!txHash) {
      return NextResponse.json(
        { error: 'Failed to create position' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        transactionHash: txHash,
        params
      }
    });
  } catch (error) {
    console.error('Error in /api/positions POST:', error);
    return NextResponse.json(
      { error: 'Failed to create position' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      action,
      tokenId,
      amount0Desired,
      amount1Desired,
      amount0Min,
      amount1Min,
      liquidity,
      recipient,
      deadline,
      privateKey,
      network = 'testnet'
    } = body;

    if (!privateKey) {
      return NextResponse.json(
        { error: 'Private key required for modifying positions' },
        { status: 400 }
      );
    }

    const quickswap = new QuickSwapService(network, privateKey);
    let txHash: string | null = null;

    const deadlineTimestamp = BigInt(deadline || Math.floor(Date.now() / 1000) + 3600);

    switch (action) {
      case 'increase':
        txHash = await quickswap.increaseLiquidity(
          BigInt(tokenId),
          BigInt(amount0Desired),
          BigInt(amount1Desired),
          BigInt(amount0Min || 0),
          BigInt(amount1Min || 0),
          deadlineTimestamp
        );
        break;

      case 'decrease':
        txHash = await quickswap.decreaseLiquidity(
          BigInt(tokenId),
          BigInt(liquidity),
          BigInt(amount0Min || 0),
          BigInt(amount1Min || 0),
          deadlineTimestamp
        );
        break;

      case 'collect':
        txHash = await quickswap.collectFees(
          BigInt(tokenId),
          recipient as Address
        );
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: increase, decrease, or collect' },
          { status: 400 }
        );
    }

    if (!txHash) {
      return NextResponse.json(
        { error: `Failed to ${action} position` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        action,
        transactionHash: txHash,
        tokenId
      }
    });
  } catch (error) {
    console.error('Error in /api/positions PUT:', error);
    return NextResponse.json(
      { error: 'Failed to modify position' },
      { status: 500 }
    );
  }
}