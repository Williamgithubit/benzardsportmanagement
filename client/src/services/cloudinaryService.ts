import {
  MediaAsset,
  MediaUploadOptions,
  MediaFilters,
  BulkUploadProgress,
  MediaTransformation,
  BSM_MEDIA_FOLDERS,
  BSM_MEDIA_TAGS,
} from "@/types/media";

/**
 * Delete student image from Cloudinary via API
 * @param certificateNumber - Certificate number to identify the image
 * @returns Promise<void>
 */
export async function deleteStudentImageFromCloudinary(
  certificateNumber: string,
): Promise<void> {
  try {
    const response = await fetch("/api/delete-image", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ certificateNumber }),
    });

    if (!response.ok) {
      console.warn("Failed to delete image from Cloudinary");
    }
  } catch (error) {
    console.error("Error deleting from Cloudinary:", error);
    // Don't throw error for deletion failures
  }
}

/**
 * Client-side image upload using Next.js API route
 * @param file - Image file to upload
 * @param certificateNumber - Certificate number for unique file naming
 * @returns Promise<string> - Cloudinary URL of uploaded image
 */
export async function uploadStudentImageClient(
  file: File,
  certificateNumber: string,
): Promise<string> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("certificateNumber", certificateNumber);

    const response = await fetch("/api/upload-image", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to upload image");
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Failed to upload image");
    }

    return data.url;
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    throw new Error("Failed to upload image to Cloudinary");
  }
}

/**
 * Upload admission application image to Cloudinary
 * @param file - Image file to upload
 * @param applicantId - Applicant ID for unique file naming
 * @returns Promise<string> - Cloudinary URL of uploaded image
 */
export async function uploadAdmissionImage(
  file: File,
  applicantId: string,
): Promise<string> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("applicantId", applicantId);
    formData.append("uploadType", "admission-image");

    const response = await fetch("/api/upload-admission-file", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to upload admission image");
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Failed to upload admission image");
    }

    return data.url;
  } catch (error) {
    console.error("Error uploading admission image to Cloudinary:", error);
    throw new Error("Failed to upload admission image to Cloudinary");
  }
}

/**
 * Upload community recommendation file to Cloudinary
 * @param file - File to upload (PDF, DOC, etc.)
 * @param applicantId - Applicant ID for unique file naming
 * @returns Promise<string> - Cloudinary URL of uploaded file
 */
export async function uploadCommunityRecommendation(
  file: File,
  applicantId: string,
): Promise<string> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("applicantId", applicantId);
    formData.append("uploadType", "recommendation");

    const response = await fetch("/api/upload-admission-file", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to upload community recommendation");
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(
        data.error || "Failed to upload community recommendation",
      );
    }

    return data.url;
  } catch (error) {
    console.error(
      "Error uploading community recommendation to Cloudinary:",
      error,
    );
    throw new Error("Failed to upload community recommendation to Cloudinary");
  }
}

/**
 * Delete admission file from Cloudinary
 * @param applicantId - Applicant ID
 * @param fileType - Type of file ('image' | 'recommendation')
 * @returns Promise<void>
 */
export async function deleteAdmissionFileFromCloudinary(
  applicantId: string,
  fileType: "image" | "recommendation",
): Promise<void> {
  try {
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    const response = await fetch("/api/delete-admission-file", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ applicantId, fileType }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Handle different response statuses
    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        console.log(
          `Successfully deleted ${fileType} for applicant ${applicantId}`,
        );
        return;
      }
    }

    // Handle specific error cases
    if (response.status === 408) {
      console.warn(`Timeout deleting ${fileType} for applicant ${applicantId}`);
      return; // Don't throw for timeouts
    }

    if (response.status === 404) {
      console.log(
        `${fileType} for applicant ${applicantId} was already deleted or doesn't exist`,
      );
      return; // File not found is success for deletion
    }

    if (response.status >= 500) {
      console.warn(
        `Server error deleting ${fileType} for applicant ${applicantId}:`,
        response.status,
      );
      return; // Don't throw for server errors
    }

    // For other errors, log but don't throw
    console.warn(
      `Failed to delete ${fileType} for applicant ${applicantId}:`,
      response.status,
    );
  } catch (error) {
    // Handle network errors and aborted requests
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        console.warn(
          `Request timeout deleting ${fileType} for applicant ${applicantId}`,
        );
        return; // Don't throw for timeouts
      }

      if (
        error.message.includes("network") ||
        error.message.includes("fetch")
      ) {
        console.warn(
          `Network error deleting ${fileType} for applicant ${applicantId}:`,
          error.message,
        );
        return; // Don't throw for network errors
      }
    }

    console.error(
      `Error deleting ${fileType} for applicant ${applicantId}:`,
      error,
    );
    // Don't throw error for deletion failures - this prevents blocking the main deletion operation
  }
}

/**
 * Upload athlete media (photo or video) to Cloudinary
 * @param file - Media file to upload
 * @param athleteId - Athlete ID for unique file naming
 * @param mediaType - Type of media ('photo' | 'video')
 * @param caption - Optional caption for the media
 * @returns Promise<{url: string, publicId: string}> - Cloudinary URL and public ID
 */
export async function uploadAthleteMedia(
  file: File,
  athleteId: string,
  mediaType: "photo" | "video",
  caption?: string,
): Promise<{ url: string; publicId: string }> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("athleteId", athleteId);
    formData.append("mediaType", mediaType);
    formData.append("uploadType", "athlete-media");
    if (caption) {
      formData.append("caption", caption);
    }

    const response = await fetch("/api/upload-athlete-media", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload athlete ${mediaType}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || `Failed to upload athlete ${mediaType}`);
    }

    return {
      url: data.url,
      publicId: data.publicId,
    };
  } catch (error) {
    console.error(`Error uploading athlete ${mediaType} to Cloudinary:`, error);
    throw new Error(`Failed to upload athlete ${mediaType} to Cloudinary`);
  }
}

/**
 * Delete athlete media from Cloudinary
 * @param athleteId - Athlete ID
 * @param mediaId - Media ID (public ID from Cloudinary)
 * @param mediaType - Type of media ('photo' | 'video')
 * @returns Promise<void>
 */
export async function deleteAthleteMediaFromCloudinary(
  athleteId: string,
  mediaId: string,
  mediaType: "photo" | "video",
): Promise<void> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch("/api/delete-athlete-media", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ athleteId, mediaId, mediaType }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        console.log(
          `Successfully deleted ${mediaType} ${mediaId} for athlete ${athleteId}`,
        );
        return;
      }
    }

    // Handle specific error cases
    if (response.status === 408) {
      console.warn(`Timeout deleting ${mediaType} for athlete ${athleteId}`);
      return;
    }

    if (response.status === 404) {
      console.log(
        `${mediaType} ${mediaId} for athlete ${athleteId} was already deleted or doesn't exist`,
      );
      return;
    }

    if (response.status >= 500) {
      console.warn(
        `Server error deleting ${mediaType} for athlete ${athleteId}:`,
        response.status,
      );
      return;
    }

    console.warn(
      `Failed to delete ${mediaType} for athlete ${athleteId}:`,
      response.status,
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        console.warn(
          `Request timeout deleting ${mediaType} for athlete ${athleteId}`,
        );
        return;
      }

      if (
        error.message.includes("network") ||
        error.message.includes("fetch")
      ) {
        console.warn(
          `Network error deleting ${mediaType} for athlete ${athleteId}:`,
          error.message,
        );
        return;
      }
    }

    console.error(
      `Error deleting ${mediaType} for athlete ${athleteId}:`,
      error,
    );
  }
}

/**
 * Upload media to Cloudinary with BSM folder structure and tagging
 * @param file - File to upload
 * @param options - Upload options including folder, tags, metadata
 * @returns Promise<MediaAsset> - Uploaded media asset details
 */
export async function uploadMediaToBSM(
  file: File,
  options: MediaUploadOptions,
): Promise<MediaAsset> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", options.folder);
    formData.append("category", options.category);

    if (options.tags) {
      formData.append("tags", JSON.stringify(options.tags));
    }

    if (options.context) {
      formData.append("context", JSON.stringify(options.context));
    }

    if (options.entityId) {
      formData.append("entityId", options.entityId);
    }

    if (options.entityType) {
      formData.append("entityType", options.entityType);
    }

    if (options.caption) {
      formData.append("caption", options.caption);
    }

    if (options.altText) {
      formData.append("altText", options.altText);
    }

    if (options.description) {
      formData.append("description", options.description);
    }

    const response = await fetch("/api/media/upload", {
      method: "POST",
      body: formData,
    });

    // Try to parse JSON body from server for better diagnostics
    let data: { success?: boolean; error?: string; asset?: MediaAsset } | null =
      null;
    try {
      data = await response.json();
    } catch {
      const text = await response.text().catch(() => "");
      if (!response.ok) {
        throw new Error(
          `Failed to upload media: ${response.status} ${response.statusText} ${text}`.trim(),
        );
      }
      // If response is OK but not JSON, treat as failure
      throw new Error(`Failed to upload media: unexpected server response`);
    }

    if (!response.ok) {
      // If server returned structured error message prefer that
      throw new Error(
        data?.error ||
          `Failed to upload media: ${response.status} ${response.statusText}`,
      );
    }

    if (!data || !data.success) {
      throw new Error(data?.error || "Failed to upload media");
    }

    if (!data.asset) {
      throw new Error("Failed to upload media: no asset returned");
    }

    return data.asset;
  } catch (error) {
    console.error("Error uploading media to Cloudinary:", error);
    throw new Error("Failed to upload media to Cloudinary");
  }
}

/**
 * Bulk upload multiple files to Cloudinary
 * @param files - Array of files to upload
 * @param options - Upload options
 * @param onProgress - Progress callback
 * @returns Promise<{successful: MediaAsset[], failed: Array<{file: File, error: string}>}>
 */
export async function bulkUploadMedia(
  files: File[],
  options: MediaUploadOptions,
  onProgress?: (progress: BulkUploadProgress) => void,
): Promise<{
  successful: MediaAsset[];
  failed: Array<{ file: File; error: string }>;
}> {
  const successful: MediaAsset[] = [];
  const failed: Array<{ file: File; error: string }> = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    if (onProgress) {
      onProgress({
        total: files.length,
        completed: i,
        failed: failed.length,
        current: file.name,
        errors: failed.map((f) => ({ filename: f.file.name, error: f.error })),
      });
    }

    try {
      const asset = await uploadMediaToBSM(file, {
        ...options,
        // Add file index to avoid naming conflicts
        context: {
          ...options.context,
          batch_index: i.toString(),
          batch_total: files.length.toString(),
        },
      });
      successful.push(asset);
    } catch (error) {
      failed.push({
        file,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  if (onProgress) {
    onProgress({
      total: files.length,
      completed: files.length,
      failed: failed.length,
      errors: failed.map((f) => ({ filename: f.file.name, error: f.error })),
    });
  }

  return { successful, failed };
}

/**
 * Get media assets from Cloudinary with filtering and pagination
 * @param filters - Filter options
 * @param page - Page number (1-based)
 * @param limit - Items per page
 * @returns Promise<{assets: MediaAsset[], pagination: any}>
 */
export async function getMediaAssets(
  filters: MediaFilters,
  page: number = 1,
  limit: number = 20,
): Promise<{
  assets: MediaAsset[];
  pagination: { page: number; limit: number; total: number; hasMore: boolean };
}> {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append("page", page.toString());
    queryParams.append("limit", limit.toString());
    queryParams.append("search", filters.search);
    queryParams.append("category", filters.category);
    queryParams.append("resourceType", filters.resourceType);
    queryParams.append("folder", filters.folder);
    queryParams.append("tags", filters.tags.join(","));

    if (filters.entityId) {
      queryParams.append("entityId", filters.entityId);
    }

    if (filters.uploadedBy) {
      queryParams.append("uploadedBy", filters.uploadedBy);
    }

    if (filters.dateRange?.start) {
      queryParams.append("dateStart", filters.dateRange.start);
    }

    if (filters.dateRange?.end) {
      queryParams.append("dateEnd", filters.dateRange.end);
    }

    const response = await fetch(`/api/media/list?${queryParams}`);

    // Try to parse JSON body (server may provide an error message)
    let data: {
      success?: boolean;
      error?: string;
      assets?: MediaAsset[];
      pagination?: unknown;
    } | null = null;
    try {
      data = await response.json();
    } catch {
      // If response is not JSON, include status text for diagnostics
      const text = await response.text().catch(() => "");
      throw new Error(
        `Failed to fetch media assets: ${response.status} ${response.statusText} ${text}`.trim(),
      );
    }

    if (!response.ok) {
      throw new Error(
        data?.error ||
          `Failed to fetch media assets: ${response.status} ${response.statusText}`,
      );
    }

    if (!data || !data.success) {
      throw new Error(data?.error || "Failed to fetch media assets");
    }

    if (!data.assets || !data.pagination) {
      throw new Error("Failed to fetch media assets: incomplete response");
    }

    return {
      assets: data.assets,
      pagination: data.pagination as {
        page: number;
        limit: number;
        total: number;
        hasMore: boolean;
      },
    };
  } catch (error) {
    console.error("Error fetching media assets:", error);
    throw new Error("Failed to fetch media assets");
  }
}

/**
 * Delete media asset from Cloudinary
 * @param publicId - Cloudinary public ID
 * @param resourceType - Type of resource (image, video, raw)
 * @returns Promise<void>
 */
export async function deleteMediaAsset(
  publicId: string,
  resourceType: "image" | "video" | "raw" = "image",
): Promise<void> {
  try {
    const response = await fetch("/api/media/delete", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ publicId, resourceType }),
    });

    if (!response.ok) {
      throw new Error("Failed to delete media asset");
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Failed to delete media asset");
    }
  } catch (error) {
    console.error("Error deleting media asset:", error);
    throw new Error("Failed to delete media asset");
  }
}

/**
 * Update media asset metadata
 * @param publicId - Cloudinary public ID
 * @param updates - Metadata updates
 * @returns Promise<MediaAsset>
 */
export async function updateMediaAsset(
  publicId: string,
  updates: Partial<
    Pick<MediaAsset, "tags" | "context" | "caption" | "altText" | "description">
  >,
): Promise<MediaAsset> {
  try {
    const response = await fetch("/api/media/update", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ publicId, updates }),
    });

    if (!response.ok) {
      throw new Error("Failed to update media asset");
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Failed to update media asset");
    }

    return data.asset;
  } catch (error) {
    console.error("Error updating media asset:", error);
    throw new Error("Failed to update media asset");
  }
}

/**
 * Generate optimized URL for media asset with transformations
 * @param publicId - Cloudinary public ID
 * @param transformations - Image/video transformations
 * @returns string - Optimized URL
 */
export function generateOptimizedUrl(
  publicId: string,
  transformations: MediaTransformation = {},
): string {
  const cloudName = process.env.NEXT_PUBLIC_CLOUD_NAME;

  if (!cloudName) {
    throw new Error("Cloudinary cloud name not configured");
  }

  // Build transformation string
  const transforms: string[] = [];

  if (transformations.width) transforms.push(`w_${transformations.width}`);
  if (transformations.height) transforms.push(`h_${transformations.height}`);
  if (transformations.crop) transforms.push(`c_${transformations.crop}`);
  if (transformations.quality) transforms.push(`q_${transformations.quality}`);
  if (transformations.format) transforms.push(`f_${transformations.format}`);
  if (transformations.gravity) transforms.push(`g_${transformations.gravity}`);

  const transformString =
    transforms.length > 0 ? `${transforms.join(",")}/` : "";

  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformString}${publicId}`;
}

/**
 * Upload blog post image with automatic optimization
 * @param file - Image file
 * @param postId - Blog post ID
 * @param caption - Optional caption
 * @returns Promise<MediaAsset>
 */
export async function uploadBlogImage(
  file: File,
  postId?: string,
  caption?: string,
): Promise<MediaAsset> {
  const folder = postId
    ? `${BSM_MEDIA_FOLDERS.BLOG}/${postId}`
    : BSM_MEDIA_FOLDERS.BLOG;

  return uploadMediaToBSM(file, {
    folder,
    category: "blog",
    entityId: postId,
    entityType: "blog_post",
    caption,
    tags: [BSM_MEDIA_TAGS.BLOG],
    transformation: {
      quality: "auto",
      format: "auto",
    },
  });
}

/**
 * Get media assets for a specific entity (athlete, event, blog post)
 * @param entityType - Type of entity
 * @param entityId - Entity ID
 * @returns Promise<MediaAsset[]>
 */
export async function getEntityMedia(
  entityType: "athlete" | "event" | "blog",
  entityId: string,
): Promise<MediaAsset[]> {
  try {
    const { assets } = await getMediaAssets({
      search: "",
      category: entityType,
      resourceType: "",
      folder: "",
      tags: [],
      entityId,
    });

    return assets;
  } catch (error) {
    console.error(`Error fetching ${entityType} media:`, error);
    throw new Error(`Failed to fetch ${entityType} media`);
  }
}
