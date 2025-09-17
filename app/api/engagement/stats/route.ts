import { NextResponse } from 'next/server';
import { EngagementService } from '@/lib/services/engagement.service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get('listingId');
    const userAddress = searchParams.get('userAddress');
    
    if (!listingId) {
      return NextResponse.json(
        { success: false, error: 'Listing ID is required' },
        { status: 400 }
      );
    }
    
    const stats = await EngagementService.getStats(listingId, userAddress || undefined);
    
    return NextResponse.json({
      success: true,
      stats
    });
  } catch (error: any) {
    console.error('Failed to get stats:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to get stats',
        stats: {
          views: 0,
          likes: 0,
          hasLiked: false
        }
      },
      { status: 500 }
    );
  }
}