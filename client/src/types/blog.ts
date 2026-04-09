import { Timestamp } from "firebase/firestore";

export interface FirestoreBlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage?: string;
  category: string;
  tags?: string[];
  author: {
    name: string;
    email: string;
  };
  views: number;
  status: "draft" | "published";
  publishedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  comments?: BlogComment[];
  reactionCount: number;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage?: string;
  category: string;
  tags?: string[];
  author: {
    name: string;
    email: string;
  };
  views: number;
  status: "draft" | "published";
  publishedAt?: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  comments?: BlogComment[];
  reactionCount: number;
}

export interface BlogComment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userEmail: string;
  content: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface BlogReaction {
  userId: string;
  userName: string;
  type: "like" | "love" | "celebrate";
  createdAt: Date | string;
}
