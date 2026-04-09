import { NextResponse } from 'next/server';
import { getMediaAnalytics } from '@/services/bsmMediaService';

export async function GET() {
  try {
    // TODO: Add authentication and authorization check
    // Only admin and media team should access analytics

    const analytics = await getMediaAnalytics();

    return NextResponse.json({
      success: true,
      analytics,
    });

  } catch (error) {
    console.error('Error fetching media analytics:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch media analytics' 
      },
      { status: 500 }
    );
  }
}
