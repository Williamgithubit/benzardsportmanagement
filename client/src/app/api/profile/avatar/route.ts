import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { requireAuthenticatedRequest } from "@/lib/admin-route-utils";

export const runtime = "nodejs";

const cloudName =
  process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUD_NAME;
const cloudApiKey =
  process.env.CLOUDINARY_API_KEY || process.env.NEXT_PUBLIC_CLOUD_API_KEY;
const cloudApiSecret =
  process.env.CLOUDINARY_API_SECRET || process.env.NEXT_PUBLIC_CLOUD_API_SECRET;

if (cloudName && cloudApiKey && cloudApiSecret) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: cloudApiKey,
    api_secret: cloudApiSecret,
  });
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuthenticatedRequest(request);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  if (!cloudName || !cloudApiKey || !cloudApiSecret) {
    return NextResponse.json(
      {
        success: false,
        error: "Cloudinary is not configured on the server.",
      },
      { status: 500 },
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const previousPublicId = formData.get("previousPublicId");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          error: "A profile image file is required.",
        },
        { status: 400 },
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const publicId = `user-profiles/${authResult.uid}-${Date.now()}`;

    const uploadResult = await new Promise<{
      secure_url: string;
      public_id: string;
    }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: "user-profiles",
            public_id: publicId,
            overwrite: true,
            resource_type: "image",
            transformation: [
              { width: 600, height: 600, crop: "fill", gravity: "face" },
              { quality: "auto", format: "auto" },
            ],
          },
          (error, result) => {
            if (error || !result) {
              reject(error || new Error("Cloudinary upload failed"));
              return;
            }

            resolve({
              secure_url: result.secure_url,
              public_id: result.public_id,
            });
          },
        )
        .end(buffer);
    });

    if (typeof previousPublicId === "string" && previousPublicId.trim()) {
      try {
        await cloudinary.uploader.destroy(previousPublicId.trim(), {
          resource_type: "image",
        });
      } catch (error) {
        console.warn("Unable to delete previous profile image:", error);
      }
    }

    return NextResponse.json({
      success: true,
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
    });
  } catch (error) {
    console.error("Failed to upload profile avatar:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to upload the profile image.",
      },
      { status: 500 },
    );
  }
}
