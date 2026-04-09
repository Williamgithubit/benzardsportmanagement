import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY || process.env.NEXT_PUBLIC_CLOUD_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET || process.env.NEXT_PUBLIC_CLOUD_API_SECRET,
});

export async function DELETE(request: NextRequest) {
  try {
    const { athleteId, mediaId, mediaType } = await request.json();

    if (!athleteId || !mediaId || !mediaType) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate media type
    if (!['photo', 'video'].includes(mediaType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid media type' },
        { status: 400 }
      );
    }

    // Delete from Cloudinary
    const resourceType = mediaType === 'video' ? 'video' : 'image';
    
    const result = await cloudinary.uploader.destroy(mediaId, {
      resource_type: resourceType,
    });

    if (result.result === 'ok' || result.result === 'not found') {
      return NextResponse.json({
        success: true,
        message: `Successfully deleted ${mediaType}`,
        result: result.result,
      });
    } else {
      console.warn(`Unexpected result from Cloudinary delete: ${result.result}`);
      return NextResponse.json({
        success: false,
        error: `Failed to delete ${mediaType}: ${result.result}`,
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error deleting athlete media from Cloudinary:', error);
    
    // Handle specific Cloudinary errors
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json({
          success: true,
          message: 'Media was already deleted or does not exist',
        });
      }
    }

    return NextResponse.json(
      { success: false, error: 'Failed to delete media' },
      { status: 500 }
    );
  }
}
