import { NextRequest, NextResponse } from 'next/server';
import { EngagementService } from '@/lib/services/engagement.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { listingId, address, message, signature } = body;

    // Validate required fields
    if (!listingId || !address || !message || !signature) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Toggle the like with signature verification
    const result = await EngagementService.toggleLike(
      listingId.toString(),
      address,
      message,
      signature
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to toggle like' },
        { status: 401 }
      );
    }

    // Get updated stats
    const stats = await EngagementService.getStats(
      listingId.toString(),
      address
    );

    return NextResponse.json({
      success: true,
      liked: result.liked,
      stats
    });
  } catch (error: any) {
    console.error('Error toggling like:', error);
    return NextResponse.json(
      { error: 'Failed to toggle like' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch engagement stats
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const listingId = searchParams.get('listingId');
    const userAddress = searchParams.get('userAddress');

    if (!listingId) {
      return NextResponse.json(
        { error: 'Listing ID is required' },
        { status: 400 }
      );
    }

    const stats = await EngagementService.getStats(
      listingId,
      userAddress || undefined
    );

    return NextResponse.json({
      success: true,
      stats
    });
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}