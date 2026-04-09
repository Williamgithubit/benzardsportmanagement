export interface MediaAsset {
  id: string;
  publicId: string;
  url: string;
  secureUrl: string;
  filename: string;
  originalFilename: string;
  format: string;
  resourceType: "image" | "video" | "raw";
  type: "upload" | "private" | "authenticated";

  // File details
  bytes: number;
  width?: number;
  height?: number;
  duration?: number; // for videos

  // Organization
  folder: string;
  tags: string[];
  context?: Record<string, string>;

  // BSM specific metadata
  category: "athlete" | "event" | "blog" | "general";
  entityId?: string; // athleteId, eventId, postId
  entityType?: string;

  // Upload info
  uploadedBy: string;
  uploadedAt: string;
  createdAt: string;
  updatedAt: string;

  // Additional metadata
  caption?: string;
  altText?: string;
  description?: string;

  // Usage tracking
  usageCount?: number;
  lastUsed?: string;
}

export interface MediaFilters {
  search: string;
  category: string;
  resourceType: string;
  folder: string;
  tags: string[];
  dateRange?: {
    start?: string;
    end?: string;
  };
  sizeRange?: {
    min?: number;
    max?: number;
  };
  entityId?: string;
  uploadedBy?: string;
}

export interface MediaUploadOptions {
  folder: string;
  tags?: string[];
  context?: Record<string, string>;
  category: "athlete" | "event" | "blog" | "general";
  entityId?: string;
  entityType?: string;
  caption?: string;
  altText?: string;
  description?: string;
  transformation?: Record<string, unknown>;
  eager?: Array<Record<string, unknown>>;
  overwrite?: boolean;
  uniqueFilename?: boolean;
}

export interface BulkUploadProgress {
  total: number;
  completed: number;
  failed: number;
  current?: string;
  errors: Array<{
    filename: string;
    error: string;
  }>;
}

export interface MediaCollection {
  id: string;
  name: string;
  description?: string;
  folder: string;
  tags: string[];
  category: "athlete" | "event" | "blog" | "general";
  assetCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  coverImage?: string;
}

export interface MediaTransformation {
  width?: number;
  height?: number;
  crop?:
    | "fill"
    | "fit"
    | "scale"
    | "crop"
    | "thumb"
    | "limit"
    | "mfit"
    | "mpad";
  gravity?: string;
  quality?: number | "auto";
  format?: "auto" | "jpg" | "png" | "webp" | "gif" | "mp4" | "webm";
  effect?: string;
  overlay?: string;
  underlay?: string;
  border?: string;
  radius?: number | string;
  angle?: number;
  opacity?: number;
  background?: string;
}

// User roles for media access control
export interface MediaPermissions {
  canView: boolean;
  canUpload: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManageCollections: boolean;
  canBulkUpload: boolean;
  canAccessAnalytics: boolean;
  allowedCategories: Array<"athlete" | "event" | "blog" | "general">;
  maxFileSize: number; // in bytes
  allowedFormats: string[];
}

export interface UserMediaRole {
  role: "admin" | "media_team" | "manager" | "coach" | "athlete" | "viewer";
  permissions: MediaPermissions;
}

// Predefined folder structure for BSM
export const BSM_MEDIA_FOLDERS = {
  ATHLETES: "bsm/athletes",
  EVENTS: "bsm/events",
  BLOG: "bsm/blog",
  GENERAL: "bsm/general",
  LOGOS: "bsm/branding/logos",
  BANNERS: "bsm/branding/banners",
  SOCIAL: "bsm/social",
  DOCUMENTS: "bsm/documents",
} as const;

// Common tags for BSM media
export const BSM_MEDIA_TAGS = {
  // Sports
  FOOTBALL: "football",
  BASKETBALL: "basketball",
  ATHLETICS: "athletics",

  // Categories
  ATHLETE: "athlete",
  EVENT: "event",
  BLOG: "blog",
  BRANDING: "branding",

  // Content types
  PROFILE: "profile",
  ACTION: "action",
  TEAM: "team",
  TRAINING: "training",
  MATCH: "match",
  CEREMONY: "ceremony",

  // Levels
  GRASSROOTS: "grassroots",
  SEMI_PRO: "semi-pro",
  PROFESSIONAL: "professional",

  // Locations (Liberia counties)
  MONTSERRADO: "montserrado",
  NIMBA: "nimba",
  BONG: "bong",
  LOFA: "lofa",
  GRAND_BASSA: "grand-bassa",
  MARGIBI: "margibi",

  // Quality/Usage
  HIGH_QUALITY: "high-quality",
  FEATURED: "featured",
  THUMBNAIL: "thumbnail",
  BANNER: "banner",
  SOCIAL_MEDIA: "social-media",
} as const;

export type BSMMediaTag = (typeof BSM_MEDIA_TAGS)[keyof typeof BSM_MEDIA_TAGS];

// Pagination for media library
export interface MediaPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Media analytics
export interface MediaAnalytics {
  totalAssets: number;
  totalSize: number;
  assetsByCategory: Record<string, number>;
  assetsByType: Record<string, number>;
  uploadTrends: Array<{
    date: string;
    count: number;
    size: number;
  }>;
  topTags: Array<{
    tag: string;
    count: number;
  }>;
  storageUsage: {
    used: number;
    limit: number;
    percentage: number;
  };
}

// Rich text editor integration
export interface MediaPickerOptions {
  allowMultiple?: boolean;
  allowedTypes?: Array<"image" | "video">;
  maxFileSize?: number;
  category?: "athlete" | "event" | "blog" | "general";
  folder?: string;
  onSelect: (assets: MediaAsset[]) => void;
  onCancel?: () => void;
}
