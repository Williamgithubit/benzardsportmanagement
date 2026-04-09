import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY || process.env.NEXT_PUBLIC_CLOUD_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET || process.env.NEXT_PUBLIC_CLOUD_API_SECRET,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const applicantId = formData.get('applicantId') as string;
    const uploadType = formData.get('uploadType') as string;

    if (!file || !applicantId || !uploadType) {
      return NextResponse.json(
        { error: 'File, applicant ID, and upload type are required' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Determine folder and public_id based on upload type
    let folder: string;
    let publicId: string;
    let resourceType: 'image' | 'raw' = 'image';
    let transformation: Record<string, unknown>[] = [];

    if (uploadType === 'admission-image') {
      folder = 'admission-applications/images';
      publicId = `admission-image-${applicantId}`;
      resourceType = 'image';
      transformation = [
        { width: 800, height: 800, crop: 'limit' },
        { quality: 'auto' },
        { format: 'auto' }
      ];
    } else if (uploadType === 'recommendation') {
      folder = 'admission-applications/recommendations';
      publicId = `recommendation-${applicantId}`;
      resourceType = 'raw'; // For documents like PDF, DOC, etc.
    } else {
      return NextResponse.json(
        { error: 'Invalid upload type' },
        { status: 400 }
      );
    }

    // Upload to Cloudinary
    const uploadOptions: Record<string, unknown> = {
      folder,
      public_id: publicId,
      overwrite: true,
      resource_type: resourceType,
    };

    // Add transformation only for images
    if (resourceType === 'image') {
      uploadOptions.transformation = transformation;
    }

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });

    return NextResponse.json({
      success: true,
      url: (result as { secure_url: string }).secure_url,
      publicId: (result as { public_id: string }).public_id
    });

  } catch (error) {
    console.error('Error uploading admission file to Cloudinary:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
