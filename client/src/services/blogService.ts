import {
  collection,
  doc,
  getDocs,
  getDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
  Timestamp,
  updateDoc,
  addDoc,
  limit,
} from "firebase/firestore";
import { db } from "./firebase";
import type { BlogPost, FirestoreBlogPost } from "@/types/blog";

const serializePost = (post: FirestoreBlogPost): BlogPost => {
  return {
    ...post,
    createdAt: post.createdAt?.toDate?.()?.toISOString() || null,
    updatedAt: post.updatedAt?.toDate?.()?.toISOString() || null,
    publishedAt: post.publishedAt?.toDate?.()?.toISOString() || null,
  };
};

export interface CreateBlogPostData {
  title: string;
  content: string;
  excerpt: string;
  featuredImage?: string;
  category: string;
  tags: string[];
  status: "draft" | "review" | "published" | "archived";
  featured?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  teamId?: string | null;
}

export interface UpdateBlogPostData extends Partial<CreateBlogPostData> {
  id: string;
}

/**
 * Generate URL-friendly slug from title
 */
const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
};

/**
 * Create a new blog post
 */
export const createBlogPost = async (
  postData: CreateBlogPostData,
  authorId: string,
  authorName: string,
  authorEmail: string,
): Promise<string> => {
  try {
    const slug = generateSlug(postData.title);
    const now = serverTimestamp();

    const blogPost: Record<string, unknown> = {
      title: postData.title,
      slug,
      content: postData.content,
      excerpt: postData.excerpt,
      author: {
        id: authorId,
        name: authorName,
        email: authorEmail,
      },
      status: postData.status,
      category: postData.category,
      tags: postData.tags,
      createdAt: now as Timestamp,
      updatedAt: now as Timestamp,
      views: 0,
      featured: postData.featured || false,
    };

    if (typeof postData.teamId === "string" && postData.teamId.trim()) {
      blogPost.teamId = postData.teamId.trim();
    }

    // Only add optional fields if they have values
    if (postData.featuredImage) {
      blogPost.featuredImage = postData.featuredImage;
    }
    if (postData.seoTitle) {
      blogPost.seoTitle = postData.seoTitle;
    }
    if (postData.seoDescription) {
      blogPost.seoDescription = postData.seoDescription;
    }

    // Only add publishedAt if the post is being published
    if (postData.status === "published") {
      blogPost.publishedAt = now as Timestamp;
    }

    const docRef = await addDoc(collection(db, "blogPosts"), blogPost);
    return docRef.id;
  } catch (error) {
    console.error("Error creating blog post:", error);
    throw error;
  }
};

/**
 * Update an existing blog post
 */
export const updateBlogPost = async (
  updateData: UpdateBlogPostData,
): Promise<void> => {
  try {
    const { id, ...data } = updateData;
    const updatePayload: Record<string, unknown> = {
      updatedAt: serverTimestamp() as Timestamp,
    };

    // Only add fields that have values to avoid undefined
    Object.keys(data).forEach((key) => {
      const value = (data as Record<string, unknown>)[key];
      if (value !== undefined && value !== null) {
        updatePayload[key] = value;
      }
    });

    // Update slug if title changed
    if (data.title) {
      updatePayload.slug = generateSlug(data.title);
    }

    // Set publishedAt if status changed to published
    if (data.status === "published") {
      updatePayload.publishedAt = serverTimestamp() as Timestamp;
    }

    await updateDoc(doc(db, "blogPosts", id), updatePayload);
  } catch (error) {
    console.error("Error updating blog post:", error);
    throw error;
  }
};

/**
 * Delete a blog post
 */
export const deleteBlogPost = async (postId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, "blogPosts", postId));
  } catch (error) {
    console.error("Error deleting blog post:", error);
    throw error;
  }
};

/**
 * Get all blog posts with optional filtering
 */
export const getBlogPosts = async (options?: {
  status?: BlogPost["status"];
  category?: string;
  limit?: number;
  orderByField?: "createdAt" | "publishedAt" | "updatedAt" | "views";
  orderDirection?: "asc" | "desc";
}): Promise<BlogPost[]> => {
  try {
    const {
      status,
      category,
      limit: limitCount,
      orderByField = "createdAt",
      orderDirection = "desc",
    } = options || {};

    let q = query(collection(db, "blogPosts"));

    // Add filters
    if (status) {
      q = query(q, where("status", "==", status));
    }
    if (category) {
      q = query(q, where("category", "==", category));
    }

    // Add ordering
    q = query(q, orderBy(orderByField, orderDirection));

    // Add limit
    if (limitCount) {
      q = query(q, limit(limitCount));
    }

    const querySnapshot = await getDocs(q);
    const posts: BlogPost[] = [];

    querySnapshot.forEach((doc) => {
      posts.push({
        id: doc.id,
        ...doc.data(),
      } as BlogPost);
    });

    return posts;
  } catch (error) {
    console.error("Error getting blog posts:", error);
    throw error;
  }
};

/**
 * Get a single blog post by ID
 */
export const getBlogPost = async (postId: string): Promise<BlogPost | null> => {
  try {
    const docSnap = await getDoc(doc(db, "blogPosts", postId));

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as BlogPost;
    }

    return null;
  } catch (error) {
    console.error("Error getting blog post:", error);
    throw error;
  }
};

/**
 * Get a blog post by slug
 */
export const getBlogPostBySlug = async (
  slug: string,
): Promise<BlogPost | null> => {
  try {
    const q = query(collection(db, "blogPosts"), where("slug", "==", slug));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      const firestorePost = {
        id: doc.id,
        ...doc.data(),
      } as FirestoreBlogPost;
      return serializePost(firestorePost);
    }

    return null;
  } catch (error) {
    console.error("Error getting blog post by slug:", error);
    throw error;
  }
};

/**
 * Increment view count for a blog post
 */
export const incrementBlogPostViews = async (postId: string): Promise<void> => {
  try {
    const postRef = doc(db, "blogPosts", postId);
    const postSnap = await getDoc(postRef);

    if (postSnap.exists()) {
      const currentViews = postSnap.data().views || 0;
      await updateDoc(postRef, {
        views: currentViews + 1,
      });
    }
  } catch (error) {
    console.error("Error incrementing blog post views:", error);
    throw error;
  }
};

/**
 * Get blog categories
 */
export const getBlogCategories = async (): Promise<string[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, "blogPosts"));
    const categories = new Set<string>();

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.category) {
        categories.add(data.category);
      }
    });

    return Array.from(categories).sort();
  } catch (error) {
    console.error("Error getting blog categories:", error);
    throw error;
  }
};

/**
 * Get popular tags
 */
export const getBlogTags = async (): Promise<string[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, "blogPosts"));
    const tagCounts = new Map<string, number>();

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.tags && Array.isArray(data.tags)) {
        data.tags.forEach((tag: string) => {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        });
      }
    });

    // Sort by usage count and return top tags
    return Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => tag)
      .slice(0, 20);
  } catch (error) {
    console.error("Error getting blog tags:", error);
    throw error;
  }
};
