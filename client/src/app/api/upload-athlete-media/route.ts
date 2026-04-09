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
    const athleteId = formData.get('athleteId') as string;
    const mediaType = formData.get('mediaType') as string;
    const caption = formData.get('caption') as string;

    if (!file || !athleteId || !mediaType) {
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

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique public ID
    const timestamp = Date.now();
    const publicId = `athletes/${athleteId}/${mediaType}s/${timestamp}_${file.name.replace(/\s+/g, '_')}`;

    // Upload to Cloudinary
    const uploadOptions: Record<string, unknown> = {
      public_id: publicId,
      folder: `athletes/${athleteId}/${mediaType}s`,
      resource_type: mediaType === 'video' ? 'video' : 'image',
    };

    // Add caption as context if provided
    if (caption) {
      uploadOptions.context = `caption=${caption}`;
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

    const uploadResult = result as { secure_url: string, public_id: string, format: string, bytes: number };

    return NextResponse.json({
      success: true,
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      format: uploadResult.format,
      bytes: uploadResult.bytes,
    });

  } catch (error) {
    console.error('Error uploading athlete media to Cloudinary:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload media' },
      { status: 500 }
    );
  }
}
