"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { FiCalendar, FiClock, FiArrowLeft, FiEye } from "react-icons/fi";
import { FaFacebook, FaTwitter, FaLinkedin } from "react-icons/fa";
import Button from "@/components/ui/Button";
import type { BlogPost, BlogComment as BlogCommentType } from "@/types/blog";
import BlogReactions from "@/components/blog/BlogReactions";
import BlogComment from "@/components/blog/BlogComment";
import { getComments, getReactions } from "@/services/blogInteractions";

interface BlogPostProps {
  initialPost: BlogPost;
}

export default function BlogPostContent({ initialPost }: BlogPostProps) {
  const router = useRouter();

  // Extend the BlogPost type locally to include fields we manage client-side
  interface ExtendedBlogPost extends BlogPost {
    reactionCount: number;
    comments?: BlogCommentType[];
  }

  const defaultPost: ExtendedBlogPost = {
    ...initialPost,
    reactionCount: 0
  };

  const [post, setPost] = useState<ExtendedBlogPost>(defaultPost);

  const loadInteractions = React.useCallback(async () => {
    try {
      const [comments, reactions] = await Promise.all([
        getComments(post.id),
        getReactions(post.id),
      ]);

      setPost((prev) => ({
        ...prev,
        comments,
        reactionCount: reactions.length,
      }));
    } catch (error) {
      console.error("Error loading interactions:", error);
    }
  }, [post.id]);

  // Load comments and reactions
  useEffect(() => {
    loadInteractions();
  }, [loadInteractions]);

  const formatDate = (timestamp: string | null | undefined) => {
    if (!timestamp) return 'No date available';
    
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
      }
      
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(date);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Date not available';
    }
  };

  const cleanHtml = (html: string): string => {
    if (typeof document === 'undefined') {
      // Fallback for server-side rendering
      return html.replace(/<[^>]*>?/gm, '');
    }
    
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  };

  const getExcerpt = (content: string, maxLength: number = 160): string => {
    const text = cleanHtml(content);
    return text.length > maxLength 
      ? `${text.substring(0, maxLength).trim()}...` 
      : text;
  };

  const calculateReadTime = (content: string) => {
    // Remove HTML tags before counting words
    const text = cleanHtml(content);
    const wordsPerMinute = 200;
    const wordCount = text.split(/\s+/).length;
    const readTime = Math.ceil(wordCount / wordsPerMinute);
    return `${readTime} min read`;
  };

  const handleShare = (platform: string) => {
    if (typeof window === "undefined") return;

    const url = window.location.href;
    const title = post?.title || "";

    let shareUrl = "";
    switch (platform) {
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
          url
        )}`;
        break;
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(
          url
        )}&text=${encodeURIComponent(title)}`;
        break;
      case "linkedin":
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
          url
        )}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, "_blank", "width=600,height=400");
    }
  };

  return (
    <div className="min-h-screen pt-16 bg-gray-50">
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <Button
            variant="outline"
            onClick={() => router.push("/blog")}
            className="flex items-center"
          >
            <FiArrowLeft className="mr-2" />
            Back to Blog
          </Button>
        </motion.div>

        {/* Article Header */}
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <div className="text-center mb-8">
            <span className="inline-block px-3 py-1 text-xs font-medium text-[#E32845] bg-red-50 rounded-full mb-4">
              {post.category}
            </span>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              {post.title}
            </h1>
            <p className="text-xl text-gray-600 mb-6 max-w-3xl mx-auto">
              {post.excerpt ? cleanHtml(post.excerpt) : getExcerpt(post.content)}
            </p>

            {/* Meta Information */}
            <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-gray-500 mb-6">
              <div className="flex items-center">
                <FiCalendar className="mr-2" />
                {formatDate(post.publishedAt || post.createdAt)}
              </div>
              <div className="flex items-center">
                <FiClock className="mr-2" />
                {calculateReadTime(post.content)}
              </div>
              <div className="flex items-center">
                <FiEye className="mr-1" /> {post.views} views
              </div>
            </div>

            {/* Author Info */}
            <div className="flex justify-center items-center mb-6">
              <div className="text-center">
                <p className="font-medium text-gray-900">{post.author.name}</p>
                <p className="text-sm text-gray-500">{post.author.email}</p>
              </div>
            </div>

            {/* Share Buttons */}
            <div className="flex justify-center space-x-4 mb-8">
              <button
                onClick={() => handleShare("facebook")}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FaFacebook className="mr-2" />
                Share
              </button>
              <button
                onClick={() => handleShare("twitter")}
                className="flex items-center px-4 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition-colors"
              >
                <FaTwitter className="mr-2" />
                Tweet
              </button>
              <button
                onClick={() => handleShare("linkedin")}
                className="flex items-center px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors"
              >
                <FaLinkedin className="mr-2" />
                Share
              </button>
            </div>
          </div>

          {/* Featured Image */}
          {post.featuredImage && (
            <div className="relative w-full h-64 md:h-96 mb-8 rounded-xl overflow-hidden">
              <Image
                src={post.featuredImage}
                alt={post.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                priority
              />
            </div>
          )}
        </motion.header>

        {/* Article Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm p-8 mb-8"
        >
          <div
            className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-[#000054] prose-strong:text-gray-900"
            dangerouslySetInnerHTML={{
              __html: post.content ? post.content.trim() : '<p>No content available</p>',
            }}
          />
        </motion.div>

        {/* Reactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm p-6 mb-8"
        >
          <BlogReactions
            postId={post.id}
            reactionCount={post.reactionCount || 0}
            onReactionChange={() => loadInteractions()}
          />
        </motion.div>

        {/* Comments */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <BlogComment
            postId={post.id}
            comments={post.comments || []}
            onCommentAdded={() => loadInteractions()}
          />
        </motion.div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm p-6 mb-8"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex justify-between items-center pt-8 border-t border-gray-200"
        >
          <Button
            variant="outline"
            onClick={() => router.push("/blog")}
            className="flex items-center"
          >
            <FiArrowLeft className="mr-2" />
            All Posts
          </Button>

          <div className="flex space-x-4">
            <button
              onClick={() => handleShare("facebook")}
              className="text-gray-400 hover:text-blue-600 transition-colors p-2"
            >
              <FaFacebook className="text-xl" />
            </button>
            <button
              onClick={() => handleShare("twitter")}
              className="text-gray-400 hover:text-blue-400 transition-colors p-2"
            >
              <FaTwitter className="text-xl" />
            </button>
            <button
              onClick={() => handleShare("linkedin")}
              className="text-gray-400 hover:text-blue-700 transition-colors p-2"
            >
              <FaLinkedin className="text-xl" />
            </button>
          </div>
        </motion.div>
      </article>
    </div>
  );
}
