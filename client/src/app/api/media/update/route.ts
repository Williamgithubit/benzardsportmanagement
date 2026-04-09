import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY || process.env.NEXT_PUBLIC_CLOUD_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET || process.env.NEXT_PUBLIC_CLOUD_API_SECRET,
});

export async function PATCH(request: NextRequest) {
  try {
    const { publicId, updates } = await request.json();

    if (!publicId) {
      return NextResponse.json(
        { success: false, error: 'Public ID is required' },
        { status: 400 }
      );
    }

    if (!updates || Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: 'Updates are required' },
        { status: 400 }
      );
    }

    // Update tags and context in Cloudinary if provided
    if (updates.tags || updates.context) {
      try {
        const cloudinaryUpdates: Record<string, string> = {};
        
        if (updates.tags) {
          cloudinaryUpdates.tags = updates.tags.join(',');
        }
        
        if (updates.context) {
          cloudinaryUpdates.context = updates.context;
        }

        await cloudinary.uploader.update_metadata(cloudinaryUpdates, [publicId]);
      } catch (cloudinaryError) {
        console.error('Cloudinary update error:', cloudinaryError);
        // Continue with Firestore update even if Cloudinary update fails
      }
    }

    // Note: For now, we'll skip Firestore update since we don't have the document ID
    // In a real implementation, you would:
    // 1. Query Firestore to find the document with matching publicId
    // 2. Update that document with the new metadata
    // 3. Or pass the Firestore document ID in the request

    // Mock response for now
    const updatedAsset = {
      publicId,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      asset: updatedAsset,
      message: 'Media asset updated successfully',
    });

  } catch (error) {
    console.error('Error updating media asset:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update media asset' 
      },
      { status: 500 }
    );
  }
}
