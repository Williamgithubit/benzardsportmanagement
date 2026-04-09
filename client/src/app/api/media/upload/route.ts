import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { adminDb } from "@/lib/firebase-admin";
import { MediaAsset } from "@/types/media";

// Configure Cloudinary
// Validate Cloudinary configuration (server-side env vars expected)
const cloudName =
  process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUD_NAME;
const cloudApiKey =
  process.env.CLOUDINARY_API_KEY || process.env.NEXT_PUBLIC_CLOUD_API_KEY;
const cloudApiSecret =
  process.env.CLOUDINARY_API_SECRET || process.env.NEXT_PUBLIC_CLOUD_API_SECRET;

if (!cloudName || !cloudApiKey || !cloudApiSecret) {
  console.error(
    "Cloudinary not configured. Check CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET"
  );
} else {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: cloudApiKey,
    api_secret: cloudApiSecret,
  });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const folder = formData.get("folder") as string;
    const category = formData.get("category") as string;
    const entityId = formData.get("entityId") as string;
    const entityType = formData.get("entityType") as string;
    const caption = formData.get("caption") as string;
    const altText = formData.get("altText") as string;
    const description = formData.get("description") as string;
    const tagsString = formData.get("tags") as string;
    const contextString = formData.get("context") as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    if (!folder || !category) {
      return NextResponse.json(
        { success: false, error: "Folder and category are required" },
        { status: 400 }
      );
    }

    // Parse tags and context
    let tags: string[] = [];
    let context: Record<string, string> = {};

    try {
      if (tagsString) {
        tags = JSON.parse(tagsString);
      }
      if (contextString) {
        context = JSON.parse(contextString);
      }
    } catch (error) {
      console.error("Error parsing tags or context:", error);
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Determine resource type
    const resourceType = file.type.startsWith("video/") ? "video" : "image";

    // Generate public ID with BSM structure
    const timestamp = Date.now();
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const publicId = `${folder}/${timestamp}_${sanitizedFilename}`;

    // Ensure Cloudinary is configured before attempting upload
    if (!cloudName || !cloudApiKey || !cloudApiSecret) {
      console.error(
        "Attempted upload but Cloudinary is not configured on server"
      );
      return NextResponse.json(
        { success: false, error: "Cloudinary not configured on server" },
        { status: 500 }
      );
    }

    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            resource_type: resourceType,
            public_id: publicId,
            folder: folder,
            tags: tags,
            context: {
              ...context,
              category,
              entityId: entityId || "",
              entityType: entityType || "",
              originalFilename: file.name,
            },
            transformation:
              resourceType === "image"
                ? [{ quality: "auto", format: "auto" }]
                : undefined,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        )
        .end(buffer);
    });

    const result = uploadResult as {
      public_id: string;
      secure_url: string;
      format: string;
      resource_type: string;
      type: string;
      bytes: number;
      width: number;
      height: number;
      duration?: number;
    };

    // Create MediaAsset object
    const mediaAsset: Omit<MediaAsset, "id" | "createdAt" | "updatedAt"> = {
      publicId: result.public_id,
      url: result.secure_url,
      secureUrl: result.secure_url,
      filename: sanitizedFilename,
      originalFilename: file.name,
      format: result.format,
      resourceType: result.resource_type as "image" | "video" | "raw",
      type: result.type as "upload" | "private" | "authenticated",
      bytes: result.bytes,
      width: result.width,
      height: result.height,
      duration: result.duration,
      folder: folder,
      tags: tags,
      context: context,
      category: category as "athlete" | "event" | "blog" | "general",
      entityId: entityId || undefined,
      entityType: entityType || undefined,
      uploadedBy: "current-user-id", // TODO: Get from auth
      uploadedAt: new Date().toISOString(),
      caption: caption || undefined,
      altText: altText || undefined,
      description: description || undefined,
      usageCount: 0,
    };

    // Save metadata to Firestore
    let firestoreId: string;

    // Verify admin Firestore is initialized
    if (!adminDb) {
      console.error(
        "Admin Firestore not initialized - check firebase-admin credentials"
      );
      return NextResponse.json(
        {
          success: false,
          error:
            "Server database connection not available. Check firebase-admin configuration.",
        },
        { status: 500 }
      );
    }

    try {
      console.log("Preparing to save media metadata to Firestore...");

      // Filter out undefined fields from mediaAsset
      const filteredAsset = Object.fromEntries(
        Object.entries(mediaAsset).filter(([key, v]) => {
          const keep = v !== undefined;
          if (!keep) {
            console.log(`Filtering out undefined field: ${key}`);
          }
          return keep;
        })
      );

      // Use admin Firestore to create a document
      const mediaCollection = adminDb.collection("bsm_media");
      console.log("Adding document to bsm_media collection...");

      const docRef = await mediaCollection.add({
        ...filteredAsset,
        uploadedBy: "current-user-id",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      console.log("Successfully saved media metadata with ID:", docRef.id);
      firestoreId = docRef.id;
    } catch (saveErr) {
      console.error("Failed to save media metadata to Firestore:", saveErr);
      return NextResponse.json(
        {
          success: false,
          error:
            saveErr instanceof Error
              ? `Uploaded to Cloudinary but failed to save metadata: ${saveErr.message}`
              : "Uploaded to Cloudinary but failed to save metadata",
        },
        { status: 500 }
      );
    }

    // Return the complete asset with Firestore ID
    const completeAsset: MediaAsset = {
      ...mediaAsset,
      id: firestoreId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      asset: completeAsset,
    });
  } catch (error) {
    console.error("Error uploading media:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to upload media",
      },
      { status: 500 }
    );
  }
}
