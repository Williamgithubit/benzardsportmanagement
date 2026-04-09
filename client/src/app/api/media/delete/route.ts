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
    const { publicId, resourceType } = await request.json();

    if (!publicId) {
      return NextResponse.json(
        { success: false, error: 'Public ID is required' },
        { status: 400 }
      );
    }

    // Get the asset metadata to find the Firestore document ID
    // Note: In a real implementation, you might want to pass the Firestore ID directly
    // or maintain a mapping between publicId and Firestore document ID

    try {
      // Delete from Cloudinary
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType || 'image',
      });

      if (result.result !== 'ok' && result.result !== 'not found') {
        console.warn('Cloudinary deletion warning:', result);
      }

      // Note: For now, we'll skip Firestore deletion since we don't have the document ID
      // In a real implementation, you would:
      // 1. Query Firestore to find the document with matching publicId
      // 2. Delete that document
      // 3. Or pass the Firestore document ID in the request

      return NextResponse.json({
        success: true,
        message: 'Media asset deleted successfully',
      });

    } catch (cloudinaryError) {
      console.error('Cloudinary deletion error:', cloudinaryError);
      
      // Even if Cloudinary deletion fails, we might want to clean up Firestore
      return NextResponse.json({
        success: false,
        error: 'Failed to delete from Cloudinary',
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error deleting media asset:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete media asset' 
      },
      { status: 500 }
    );
  }
}
