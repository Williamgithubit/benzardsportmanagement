import {
  collection,
  doc,
  getDocs,
  getDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
  updateDoc,
  addDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import type { BlogPost, BlogPostStatus, FirestoreBlogPost } from "@/types/blog";

const blogStatuses: BlogPostStatus[] = [
  "draft",
  "review",
  "published",
  "archived",
];

const isBlogStatus = (value: unknown): value is BlogPostStatus =>
  typeof value === "string" && blogStatuses.includes(value as BlogPostStatus);

const toIsoString = (
  value:
    | Timestamp
    | { toDate?: () => Date }
    | string
    | number
    | null
    | undefined,
) => {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    const parsedDate = new Date(value);
    return Number.isNaN(parsedDate.getTime()) ? value : parsedDate.toISOString();
  }

  if (typeof value === "number") {
    const parsedDate = new Date(value);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate.toISOString();
  }

  if (typeof value === "object" && typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }

  return null;
};

const normalizeBlogStatus = (
  post: Partial<FirestoreBlogPost> & Record<string, unknown>,
): BlogPostStatus => {
  if (isBlogStatus(post.status)) {
    return post.status;
  }

  if (post.publishedAt) {
    return "published";
  }

  return "draft";
};

const serializePost = (post: FirestoreBlogPost): BlogPost => ({
  id: post.id,
  title: typeof post.title === "string" ? post.title : "Untitled post",
  slug: typeof post.slug === "string" ? post.slug : "",
  excerpt: typeof post.excerpt === "string" ? post.excerpt : "",
  content: typeof post.content === "string" ? post.content : "",
  teamId: typeof post.teamId === "string" ? post.teamId : undefined,
  mediaIds: Array.isArray(post.mediaIds)
    ? post.mediaIds.filter(
        (mediaId): mediaId is string =>
          typeof mediaId === "string" && Boolean(mediaId.trim()),
      )
    : undefined,
  featuredImage:
    typeof post.featuredImage === "string" ? post.featuredImage : undefined,
  category: typeof post.category === "string" ? post.category : "general",
  tags: Array.isArray(post.tags)
    ? post.tags.filter(
        (tag): tag is string => typeof tag === "string" && Boolean(tag.trim()),
      )
    : [],
  author: {
    id: typeof post.author?.id === "string" ? post.author.id : undefined,
    name:
      typeof post.author?.name === "string" && post.author.name.trim()
        ? post.author.name
        : "Benzard Sports Management",
    email:
      typeof post.author?.email === "string" && post.author.email.trim()
        ? post.author.email
        : "support@benzardsportsmanagement.com",
  },
  views: typeof post.views === "number" ? post.views : 0,
  status: normalizeBlogStatus(post),
  publishedAt: toIsoString(post.publishedAt),
  createdAt: toIsoString(post.createdAt),
  updatedAt: toIsoString(post.updatedAt),
  comments: Array.isArray(post.comments) ? post.comments : [],
  reactionCount: typeof post.reactionCount === "number" ? post.reactionCount : 0,
});

const getDateSortValue = (
  post: BlogPost,
  field: "createdAt" | "publishedAt" | "updatedAt",
) => {
  const candidates = [
    post[field],
    post.publishedAt,
    post.updatedAt,
    post.createdAt,
  ].filter(Boolean);

  for (const candidate of candidates) {
    const timestamp = new Date(candidate as string).getTime();
    if (!Number.isNaN(timestamp)) {
      return timestamp;
    }
  }

  return 0;
};

const sortPosts = (
  posts: BlogPost[],
  orderByField: "createdAt" | "publishedAt" | "updatedAt" | "views",
  orderDirection: "asc" | "desc",
) => {
  const direction = orderDirection === "asc" ? 1 : -1;

  return [...posts].sort((left, right) => {
    const leftValue =
      orderByField === "views"
        ? left.views || 0
        : getDateSortValue(left, orderByField);
    const rightValue =
      orderByField === "views"
        ? right.views || 0
        : getDateSortValue(right, orderByField);

    if (leftValue === rightValue) {
      return (
        getDateSortValue(left, "updatedAt") -
        getDateSortValue(right, "updatedAt")
      ) * direction;
    }

    return (leftValue - rightValue) * direction;
  });
};

const fetchAllSerializedPosts = async (): Promise<BlogPost[]> => {
  const querySnapshot = await getDocs(collection(db, "blogPosts"));

  return querySnapshot.docs.map((entry) =>
    serializePost({
      id: entry.id,
      ...(entry.data() as Omit<FirestoreBlogPost, "id">),
    } as FirestoreBlogPost),
  );
};

export interface CreateBlogPostData {
  title: string;
  content: string;
  excerpt: string;
  mediaIds?: string[];
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
      reactionCount: 0,
      featured: postData.featured || false,
    };

    if (typeof postData.teamId === "string" && postData.teamId.trim()) {
      blogPost.teamId = postData.teamId.trim();
    }
    if (Array.isArray(postData.mediaIds) && postData.mediaIds.length > 0) {
      blogPost.mediaIds = postData.mediaIds.filter(
        (mediaId): mediaId is string =>
          typeof mediaId === "string" && Boolean(mediaId.trim()),
      );
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
  status?: BlogPostStatus;
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

    const filteredPosts = (await fetchAllSerializedPosts()).filter((post) => {
      const matchesStatus = !status || post.status === status;
      const matchesCategory = !category || post.category === category;
      return matchesStatus && matchesCategory;
    });
    const sortedPosts = sortPosts(
      filteredPosts,
      orderByField,
      orderDirection,
    );

    return typeof limitCount === "number"
      ? sortedPosts.slice(0, limitCount)
      : sortedPosts;
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
      return serializePost({
        id: docSnap.id,
        ...(docSnap.data() as Omit<FirestoreBlogPost, "id">),
      } as FirestoreBlogPost);
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
      const matchingPosts = querySnapshot.docs.map((entry) =>
        serializePost({
          id: entry.id,
          ...(entry.data() as Omit<FirestoreBlogPost, "id">),
        } as FirestoreBlogPost),
      );

      return sortPosts(matchingPosts, "updatedAt", "desc")[0] || null;
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
