import { NextResponse } from 'next/server';
import { EngagementService } from '@/lib/services/engagement.service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { listingId, userAddress, message, signature } = body;
    
    if (!listingId || !userAddress || !message || !signature) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: listingId, userAddress, message, signature' 
        },
        { status: 400 }
      );
    }
    
    // Toggle like with signature verification
    const result = await EngagementService.toggleLike(
      listingId,
      userAddress,
      message,
      signature
    );
    
    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || 'Failed to toggle like' 
        },
        { status: 400 }
      );
    }
    
    // Get updated stats
    const stats = await EngagementService.getStats(listingId, userAddress);
    
    return NextResponse.json({
      success: true,
      liked: result.liked,
      stats
    });
  } catch (error: any) {
    console.error('Failed to toggle like:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to toggle like'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to generate like message for signing
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get('listingId');
    const chainId = parseInt(searchParams.get('chainId') || '50312'); // Default to Somnia testnet
    
    if (!listingId) {
      return NextResponse.json(
        { success: false, error: 'Listing ID is required' },
        { status: 400 }
      );
    }
    
    const message = EngagementService.generateLikeMessage(listingId, chainId);
    
    return NextResponse.json({
      success: true,
      message
    });
  } catch (error: any) {
    console.error('Failed to generate like message:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to generate like message'
      },
      { status: 500 }
    );
  }
}