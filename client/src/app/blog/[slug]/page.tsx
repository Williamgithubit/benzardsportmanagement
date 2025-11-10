import { Suspense } from "react";
import {
  getBlogPostBySlug,
  incrementBlogPostViews,
} from "@/services/blogService";
import BlogPost from "./BlogPost";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}



export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  // Increment view count (fire and forget)
  incrementBlogPostViews(post.id).catch(console.error);

  // Serialize Firestore timestamps to ISO strings
  // Serialize Firestore timestamps to ISO strings
  const serializedPost = {
    ...post,
    createdAt:
      post.createdAt && typeof post.createdAt === "object"
        ? new Date(post.createdAt).toISOString()
        : post.createdAt,
    updatedAt:
      post.updatedAt && typeof post.updatedAt === "object"
        ? new Date(post.updatedAt).toISOString()
        : post.updatedAt,
    publishedAt:
      post.publishedAt && typeof post.publishedAt === "object"
        ? new Date(post.publishedAt).toISOString()
        : post.publishedAt,
  };

  return (
    <Suspense
      fallback={
        <div className="min-h-screen pt-16 bg-gray-50">
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#000054]"></div>
          </div>
        </div>
      }
    >
      <BlogPost initialPost={serializedPost} />
    </Suspense>
  );
}
