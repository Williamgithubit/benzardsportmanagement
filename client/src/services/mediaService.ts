import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject
} from 'firebase/storage';
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
  Timestamp 
} from 'firebase/firestore';
import { storage, db } from './firebase';

export interface MediaFile {
  id: string;
  name: string;
  originalName: string;
  url: string;
  type: string;
  size: number;
  folder: string;
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: Timestamp;
  alt?: string;
  caption?: string;
  tags: string[];
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;
  };
}

export interface UploadMediaData {
  file: File;
  folder?: string;
  alt?: string;
  caption?: string;
  tags?: string[];
}

export interface UpdateMediaData {
  id: string;
  alt?: string;
  caption?: string;
  tags?: string[];
}

export interface MediaFilters {
  type?: string;
  folder?: string;
  uploadedBy?: string;
  tags?: string[];
  dateFrom?: Date;
  dateTo?: Date;
}

const MEDIA_COLLECTION = 'media';
const STORAGE_PATH = 'media';

// Generate unique filename
const generateUniqueFileName = (originalName: string): string => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop();
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
  const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_');
  
  return `${sanitizedName}_${timestamp}_${randomString}.${extension}`;
};

// Get file type category
const getFileTypeCategory = (mimeType: string): string => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.includes('pdf')) return 'pdf';
  if (mimeType.includes('document') || mimeType.includes('word')) return 'document';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'spreadsheet';
  return 'other';
};

// Get image dimensions
const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      resolve({ width: 0, height: 0 });
      return;
    }

    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

// Upload media file
export const uploadMediaFile = async (
  data: UploadMediaData,
  userId: string,
  userName: string
): Promise<MediaFile> => {
  try {
    const { file, folder = 'general', alt = '', caption = '', tags = [] } = data;
    
    // Generate unique filename
    const uniqueFileName = generateUniqueFileName(file.name);
    const filePath = `${STORAGE_PATH}/${folder}/${uniqueFileName}`;
    
    // Create storage reference
    const storageRef = ref(storage, filePath);
    
    // Get image dimensions if it's an image
    const dimensions = await getImageDimensions(file);
    
    // Upload file
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    // Create media document
    const mediaData = {
      name: uniqueFileName,
      originalName: file.name,
      url: downloadURL,
      type: getFileTypeCategory(file.type),
      size: file.size,
      folder,
      uploadedBy: userId,
      uploadedByName: userName,
      uploadedAt: serverTimestamp(),
      alt,
      caption,
      tags,
      metadata: {
        width: dimensions.width,
        height: dimensions.height,
        mimeType: file.type,
      },
    };
    
    // Save to Firestore
    const docRef = await addDoc(collection(db, MEDIA_COLLECTION), mediaData);
    
    return {
      id: docRef.id,
      ...mediaData,
      uploadedAt: Timestamp.now(), // For immediate return
    } as MediaFile;
  } catch (error) {
    console.error('Error uploading media file:', error);
    throw new Error('Failed to upload media file');
  }
};

// Get media files
export const getMediaFiles = async (filters?: MediaFilters): Promise<MediaFile[]> => {
  try {
    let q = query(collection(db, MEDIA_COLLECTION), orderBy('uploadedAt', 'desc'));
    
    // Apply filters
    if (filters?.type) {
      q = query(q, where('type', '==', filters.type));
    }
    if (filters?.folder) {
      q = query(q, where('folder', '==', filters.folder));
    }
    if (filters?.uploadedBy) {
      q = query(q, where('uploadedBy', '==', filters.uploadedBy));
    }
    
    const querySnapshot = await getDocs(q);
    const mediaFiles: MediaFile[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      mediaFiles.push({
        id: doc.id,
        ...data,
      } as MediaFile);
    });
    
    // Apply client-side filters for complex queries
    let filteredFiles = mediaFiles;
    
    if (filters?.tags && filters.tags.length > 0) {
      filteredFiles = filteredFiles.filter(file =>
        filters.tags!.some(tag => file.tags.includes(tag))
      );
    }
    
    if (filters?.dateFrom) {
      filteredFiles = filteredFiles.filter(file =>
        file.uploadedAt.toDate() >= filters.dateFrom!
      );
    }
    
    if (filters?.dateTo) {
      filteredFiles = filteredFiles.filter(file =>
        file.uploadedAt.toDate() <= filters.dateTo!
      );
    }
    
    return filteredFiles;
  } catch (error) {
    console.error('Error getting media files:', error);
    throw new Error('Failed to get media files');
  }
};

// Update media file metadata
export const updateMediaFile = async (data: UpdateMediaData): Promise<void> => {
  try {
    const { id, ...updateData } = data;
    const docRef = doc(db, MEDIA_COLLECTION, id);
    
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating media file:', error);
    throw new Error('Failed to update media file');
  }
};

// Delete media file
export const deleteMediaFile = async (mediaFile: MediaFile): Promise<void> => {
  try {
    // Delete from storage
    const storageRef = ref(storage, `${STORAGE_PATH}/${mediaFile.folder}/${mediaFile.name}`);
    await deleteObject(storageRef);
    
    // Delete from Firestore
    await deleteDoc(doc(db, MEDIA_COLLECTION, mediaFile.id));
  } catch (error) {
    console.error('Error deleting media file:', error);
    throw new Error('Failed to delete media file');
  }
};

// Get media folders
export const getMediaFolders = async (): Promise<string[]> => {
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
};

// Get media tags
export const getMediaTags = async (): Promise<string[]> => {
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
};

// Get storage usage statistics
export const getStorageStats = async (): Promise<{
  totalFiles: number;
  totalSize: number;
  filesByType: Record<string, number>;
  sizeByType: Record<string, number>;
}> => {
  try {
    const querySnapshot = await getDocs(collection(db, MEDIA_COLLECTION));
    
    let totalFiles = 0;
    let totalSize = 0;
    const filesByType: Record<string, number> = {};
    const sizeByType: Record<string, number> = {};
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      totalFiles++;
      totalSize += data.size || 0;
      
      const type = data.type || 'other';
      filesByType[type] = (filesByType[type] || 0) + 1;
      sizeByType[type] = (sizeByType[type] || 0) + (data.size || 0);
    });
    
    return {
      totalFiles,
      totalSize,
      filesByType,
      sizeByType,
    };
  } catch (error) {
    console.error('Error getting storage stats:', error);
    throw new Error('Failed to get storage statistics');
  }
};

// Format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Check if file type is supported
export const isSupportedFileType = (file: File): boolean => {
  const supportedTypes = [
    // Images
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    // Videos
    'video/mp4',
    'video/webm',
    'video/ogg',
    // Audio
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];
  
  return supportedTypes.includes(file.type);
};

// Get max file size (in bytes)
export const getMaxFileSize = (fileType: string): number => {
  if (fileType.startsWith('image/')) return 10 * 1024 * 1024; // 10MB for images
  if (fileType.startsWith('video/')) return 100 * 1024 * 1024; // 100MB for videos
  if (fileType.startsWith('audio/')) return 50 * 1024 * 1024; // 50MB for audio
  return 25 * 1024 * 1024; // 25MB for documents
};
