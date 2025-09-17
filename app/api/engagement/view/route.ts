import { NextResponse } from 'next/server';
import { EngagementService } from '@/lib/services/engagement.service';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { listingId, viewerAddress } = body;
    
    if (!listingId) {
      return NextResponse.json(
        { success: false, error: 'Listing ID is required' },
        { status: 400 }
      );
    }
    
    // Get IP hash for unique view tracking (privacy-preserving)
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
    const ipHash = crypto.createHash('sha256').update(ip).digest('hex');
    
    // Track the view
    await EngagementService.trackView(listingId, viewerAddress, ipHash);
    
    // Get updated stats
    const stats = await EngagementService.getStats(listingId, viewerAddress);
    
    return NextResponse.json({
      success: true,
      stats
    });
  } catch (error: any) {
    console.error('Failed to track view:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to track view'
      },
      { status: 500 }
    );
  }
}