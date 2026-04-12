import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  orderBy, 
  where, 
  serverTimestamp,
  limit as firestoreLimit,
  startAfter,
  getDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  MediaAsset, 
  MediaFilters, 
  MediaPagination, 
  MediaAnalytics,
  MediaPermissions
} from '@/types/media';

const MEDIA_COLLECTION = 'bsm_media';

/**
 * Save media asset metadata to Firestore
 * @param asset - Media asset data from Cloudinary
 * @param uploadedBy - User ID who uploaded the asset
 * @returns Promise<string> - Document ID
 */
export async function saveMediaMetadata(
  asset: Omit<MediaAsset, 'id' | 'createdAt' | 'updatedAt'>,
  uploadedBy: string
): Promise<string> {
  try {
    const mediaData = {
      ...asset,
      uploadedBy,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      usageCount: 0,
    };

    const docRef = await addDoc(collection(db, MEDIA_COLLECTION), mediaData);
    return docRef.id;
  } catch (error) {
    console.error('Error saving media metadata:', error);
    throw new Error('Failed to save media metadata');
  }
}

/**
 * Get media assets with filtering and pagination
 * @param filters - Filter criteria
 * @param page - Page number (1-based)
 * @param pageSize - Items per page
 * @returns Promise<{assets: MediaAsset[], pagination: MediaPagination}>
 */
export async function getMediaAssetsFromFirestore(
  filters: MediaFilters,
  page: number = 1,
  pageSize: number = 20
): Promise<{assets: MediaAsset[], pagination: MediaPagination}> {
  try {
    let q = query(collection(db, MEDIA_COLLECTION), orderBy('createdAt', 'desc'));

    // Apply filters
    if (filters.category && filters.category !== '') {
      q = query(q, where('category', '==', filters.category));
    }

    if (filters.resourceType && filters.resourceType !== '') {
      q = query(q, where('resourceType', '==', filters.resourceType));
    }

    if (filters.folder && filters.folder !== '') {
      q = query(q, where('folder', '==', filters.folder));
    }

    if (filters.entityId && filters.entityId !== '') {
      q = query(q, where('entityId', '==', filters.entityId));
    }

    if (filters.uploadedBy && filters.uploadedBy !== '') {
      q = query(q, where('uploadedBy', '==', filters.uploadedBy));
    }

    // Add pagination
    q = query(q, firestoreLimit(pageSize));

    // Handle pagination offset
    if (page > 1) {
      // Get the last document from the previous page
      const prevPageQuery = query(
        collection(db, MEDIA_COLLECTION),
        orderBy('createdAt', 'desc'),
        firestoreLimit((page - 1) * pageSize)
      );
      const prevPageSnapshot = await getDocs(prevPageQuery);
      const lastDoc = prevPageSnapshot.docs[prevPageSnapshot.docs.length - 1];
      
      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }
    }

    const querySnapshot = await getDocs(q);
    const assets: MediaAsset[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      assets.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        uploadedAt: data.uploadedAt || data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      } as MediaAsset);
    });

    // Apply client-side text search if needed
    let filteredAssets = assets;
    if (filters.search && filters.search.trim() !== '') {
      const searchTerm = filters.search.toLowerCase();
      filteredAssets = assets.filter(asset =>
        asset.filename.toLowerCase().includes(searchTerm) ||
        asset.originalFilename.toLowerCase().includes(searchTerm) ||
        asset.caption?.toLowerCase().includes(searchTerm) ||
        asset.altText?.toLowerCase().includes(searchTerm) ||
        asset.description?.toLowerCase().includes(searchTerm) ||
        asset.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    // Apply tag filtering
    if (filters.tags && filters.tags.length > 0) {
      filteredAssets = filteredAssets.filter(asset =>
        filters.tags!.some(tag => asset.tags.includes(tag))
      );
    }

    // Get total count for pagination (approximate)
    const totalQuery = query(collection(db, MEDIA_COLLECTION));
    const totalSnapshot = await getDocs(totalQuery);
    const total = totalSnapshot.size;

    const pagination: MediaPagination = {
      page,
      limit: pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      hasNext: page < Math.ceil(total / pageSize),
      hasPrev: page > 1,
    };

    return { assets: filteredAssets, pagination };
  } catch (error) {
    console.error('Error getting media assets:', error);
    throw new Error('Failed to get media assets');
  }
}

/**
 * Update media asset metadata
 * @param assetId - Firestore document ID
 * @param updates - Fields to update
 * @returns Promise<void>
 */
export async function updateMediaMetadata(
  assetId: string,
  updates: Partial<Pick<MediaAsset, 'tags' | 'caption' | 'altText' | 'description' | 'context'>>
): Promise<void> {
  try {
    const docRef = doc(db, MEDIA_COLLECTION, assetId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating media metadata:', error);
    throw new Error('Failed to update media metadata');
  }
}

/**
 * Delete media asset metadata from Firestore
 * @param assetId - Firestore document ID
 * @returns Promise<void>
 */
export async function deleteMediaMetadata(assetId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, MEDIA_COLLECTION, assetId));
  } catch (error) {
    console.error('Error deleting media metadata:', error);
    throw new Error('Failed to delete media metadata');
  }
}

/**
 * Get media asset by ID
 * @param assetId - Firestore document ID
 * @returns Promise<MediaAsset | null>
 */
export async function getMediaAssetById(assetId: string): Promise<MediaAsset | null> {
  try {
    const docRef = doc(db, MEDIA_COLLECTION, assetId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        uploadedAt: data.uploadedAt || data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      } as MediaAsset;
    }

    return null;
  } catch (error) {
    console.error('Error getting media asset by ID:', error);
    throw new Error('Failed to get media asset');
  }
}

/**
 * Increment usage count for a media asset
 * @param assetId - Firestore document ID
 * @returns Promise<void>
 */
export async function incrementUsageCount(assetId: string): Promise<void> {
  try {
    const docRef = doc(db, MEDIA_COLLECTION, assetId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const currentCount = docSnap.data().usageCount || 0;
      await updateDoc(docRef, {
        usageCount: currentCount + 1,
        lastUsed: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('Error incrementing usage count:', error);
    // Don't throw error for usage tracking failures
  }
}

/**
 * Get media analytics
 * @returns Promise<MediaAnalytics>
 */
export async function getMediaAnalytics(): Promise<MediaAnalytics> {
  try {
    const querySnapshot = await getDocs(collection(db, MEDIA_COLLECTION));
    
    let totalAssets = 0;
    let totalSize = 0;
    const assetsByCategory: Record<string, number> = {};
    const assetsByType: Record<string, number> = {};
    const topTags: Record<string, number> = {};

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      totalAssets++;
      totalSize += data.bytes || 0;

      // Count by category
      const category = data.category || 'general';
      assetsByCategory[category] = (assetsByCategory[category] || 0) + 1;

      // Count by resource type
      const resourceType = data.resourceType || 'unknown';
      assetsByType[resourceType] = (assetsByType[resourceType] || 0) + 1;

      // Count tags
      if (data.tags && Array.isArray(data.tags)) {
        data.tags.forEach((tag: string) => {
          topTags[tag] = (topTags[tag] || 0) + 1;
        });
      }
    });

    // Convert topTags to sorted array
    const topTagsArray = Object.entries(topTags)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Mock upload trends (would need more complex querying for real data)
    const uploadTrends = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      uploadTrends.push({
        date: date.toISOString().split('T')[0],
        count: Math.floor(Math.random() * 10), // Mock data
        size: Math.floor(Math.random() * 1000000), // Mock data
      });
    }

    return {
      totalAssets,
      totalSize,
      assetsByCategory,
      assetsByType,
      uploadTrends,
      topTags: topTagsArray,
      storageUsage: {
        used: totalSize,
        limit: 10 * 1024 * 1024 * 1024, // 10GB limit (mock)
        percentage: (totalSize / (10 * 1024 * 1024 * 1024)) * 100,
      },
    };
  } catch (error) {
    console.error('Error getting media analytics:', error);
    throw new Error('Failed to get media analytics');
  }
}

/**
 * Get unique folders from media assets
 * @returns Promise<string[]>
 */
export async function getMediaFolders(): Promise<string[]> {
  try {
    const querySnapshot = await getDocs(collection(db, MEDIA_COLLECTION));
    const folders = new Set<string>();

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.folder) {
        folders.add(data.folder);
      }
    });

    return Array.from(folders).sort();
  } catch (error) {
    console.error('Error getting media folders:', error);
    throw new Error('Failed to get media folders');
  }
}

/**
 * Get unique tags from media assets
 * @returns Promise<string[]>
 */
export async function getMediaTags(): Promise<string[]> {
  try {
    const querySnapshot = await getDocs(collection(db, MEDIA_COLLECTION));
    const tags = new Set<string>();

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.tags && Array.isArray(data.tags)) {
        data.tags.forEach((tag: string) => tags.add(tag));
      }
    });

    return Array.from(tags).sort();
  } catch (error) {
    console.error('Error getting media tags:', error);
    throw new Error('Failed to get media tags');
  }
}

/**
 * Get user media permissions based on role
 * @param userRole - User's role
 * @returns MediaPermissions
 */
export function getUserMediaPermissions(userRole: string): MediaPermissions {
  const rolePermissions: Record<string, MediaPermissions> = {
    admin: {
      canView: true,
      canUpload: true,
      canEdit: true,
      canDelete: true,
      canManageCollections: true,
      canBulkUpload: true,
      canAccessAnalytics: true,
      allowedCategories: ['athlete', 'event', 'blog', 'general'],
      maxFileSize: 100 * 1024 * 1024, // 100MB
      allowedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'mp4', 'webm', 'pdf', 'doc', 'docx'],
    },
    media_team: {
      canView: true,
      canUpload: true,
      canEdit: true,
      canDelete: false,
      canManageCollections: false,
      canBulkUpload: true,
      canAccessAnalytics: false,
      allowedCategories: ['event', 'blog', 'general'],
      maxFileSize: 50 * 1024 * 1024, // 50MB
      allowedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'webm'],
    },
    manager: {
      canView: true,
      canUpload: true,
      canEdit: false,
      canDelete: false,
      canManageCollections: false,
      canBulkUpload: false,
      canAccessAnalytics: false,
      allowedCategories: ['athlete', 'event'],
      maxFileSize: 25 * 1024 * 1024, // 25MB
      allowedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    },
    coach: {
      canView: true,
      canUpload: true,
      canEdit: false,
      canDelete: false,
      canManageCollections: false,
      canBulkUpload: false,
      canAccessAnalytics: false,
      allowedCategories: ['athlete'],
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowedFormats: ['jpg', 'jpeg', 'png'],
    },
    athlete: {
      canView: true,
      canUpload: false,
      canEdit: false,
      canDelete: false,
      canManageCollections: false,
      canBulkUpload: false,
      canAccessAnalytics: false,
      allowedCategories: ['athlete'],
      maxFileSize: 5 * 1024 * 1024, // 5MB
      allowedFormats: ['jpg', 'jpeg', 'png'],
    },
    viewer: {
      canView: true,
      canUpload: false,
      canEdit: false,
      canDelete: false,
      canManageCollections: false,
      canBulkUpload: false,
      canAccessAnalytics: false,
      allowedCategories: ['general'],
      maxFileSize: 0,
      allowedFormats: [],
    },
  };

  return rolePermissions[userRole] || rolePermissions.viewer;
}

/**
 * Check if user can perform action on media asset
 * @param userRole - User's role
 * @param action - Action to check
 * @param asset - Media asset (optional, for category-specific checks)
 * @returns boolean
 */
export function canUserPerformAction(
  userRole: string,
  action: 'view' | 'upload' | 'edit' | 'delete' | 'bulkUpload' | 'manageCollections' | 'analytics',
  asset?: MediaAsset
): boolean {
  const permissions = getUserMediaPermissions(userRole);

  switch (action) {
    case 'view':
      if (!permissions.canView) return false;
      if (asset && !permissions.allowedCategories.includes(asset.category)) return false;
      return true;
    case 'upload':
      return permissions.canUpload;
    case 'edit':
      if (!permissions.canEdit) return false;
      if (asset && !permissions.allowedCategories.includes(asset.category)) return false;
      return true;
    case 'delete':
      if (!permissions.canDelete) return false;
      if (asset && !permissions.allowedCategories.includes(asset.category)) return false;
      return true;
    case 'bulkUpload':
      return permissions.canBulkUpload;
    case 'manageCollections':
      return permissions.canManageCollections;
    case 'analytics':
      return permissions.canAccessAnalytics;
    default:
      return false;
  }
}

/**
 * Format file size in human readable format
 * @param bytes - Size in bytes
 * @returns string - Formatted size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
