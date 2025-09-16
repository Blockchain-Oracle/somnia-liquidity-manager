import { NextRequest, NextResponse } from 'next/server';
import { EngagementService } from '@/lib/services/engagement.service';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { listingId, viewerAddress } = body;

    if (!listingId) {
      return NextResponse.json(
        { error: 'Listing ID is required' },
        { status: 400 }
      );
    }

    // Hash IP for privacy (optional - for unique view tracking)
    const ip = request.headers.get('x-forwarded-for') || 
                request.headers.get('x-real-ip') || 
                'unknown';
    const ipHash = ip !== 'unknown' 
      ? crypto.createHash('sha256').update(ip).digest('hex')
      : undefined;

    // Track the view
    await EngagementService.trackView(
      listingId.toString(),
      viewerAddress,
      ipHash
    );

    // Get updated stats
    const stats = await EngagementService.getStats(
      listingId.toString(),
      viewerAddress
    );

    return NextResponse.json({
      success: true,
      stats
    });
  } catch (error: any) {
    console.error('Error tracking view:', error);
    return NextResponse.json(
      { error: 'Failed to track view' },
      { status: 500 }
    );
  }
}