"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { FiSearch, FiCalendar, FiClock, FiArrowRight } from "react-icons/fi";
import { FaFacebook, FaTwitter, FaLinkedin } from "react-icons/fa";
import Button from "@/components/ui/Button";
import { getBlogPosts } from "@/services/blogService";
import type { BlogPost } from "@/types/blog";

const Blog = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  interface Category {
    id: string;
    name: string;
  }

  const [categories] = useState<Category[]>([
    { id: "all", name: "All Posts" },
    { id: "updates", name: "News & Updates" },
    { id: "events", name: "Events" },
    { id: "stories", name: "Success Stories" },
    { id: "tech", name: "Tech Tips" },
    { id: "training", name: "Training" },
  ]);

  // Fetch blog posts from Firebase
  useEffect(() => {
    const fetchBlogPosts = async () => {
      try {
        setLoading(true);
        // Fetch all posts and filter published ones client-side to avoid index requirement
        const allPosts = await getBlogPosts({
          orderByField: "createdAt",
          orderDirection: "desc",
        });
        // Filter for published posts only
        const publishedPosts = allPosts.filter(
          (post) => post.status === "published"
        );
        // Debug: Log the posts to check tags
        console.log("Published posts:", publishedPosts);
        publishedPosts.forEach((post) => {
          console.log(`Post "${post.title}" tags:`, post.tags);
          // Temporary fix: Add sample tags if none exist for testing
          if (!post.tags || post.tags.length === 0) {
            post.tags = ["digital-literacy", "education", "youth-empowerment"];
            console.log(`Added sample tags to "${post.title}":`, post.tags);
          }
        });
        setBlogPosts(publishedPosts);
      } catch (error) {
        console.error("Error fetching blog posts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogPosts();
  }, []);

  const filteredPosts = blogPosts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      activeCategory === "all" || post.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  // Function to safely format dates
  const formatDate = (timestamp: { toDate?: () => Date } | string | number | null | undefined) => {
    try {
      if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp && typeof timestamp.toDate === 'function') {
        return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(timestamp.toDate());
      }
      const date = timestamp ? new Date(timestamp as string | number) : new Date();
      if (isNaN(date.getTime())) return 'Date not available';
      return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(date);
    } catch {
      return 'Date not available';
    }
  };

  // Function to clean HTML from text and decode HTML entities
  const cleanHtml = (html: string): string => {
    if (!html) return '';
    
    // Create a temporary div element
    const tmp = document.createElement('div');
    
    // Set the HTML content (this automatically decodes entities)
    tmp.innerHTML = html;
    
    // Get the text content (strips HTML tags)
    const text = tmp.textContent || tmp.innerText || '';
    
    // Clean up any remaining HTML entities and extra whitespace
    return text
      .replace(/&[a-z0-9]+;|&#[0-9]+;|&#x[0-9a-f]+;/gi, ' ') // Replace HTML entities with spaces
      .replace(/\s+/g, ' ') // Replace multiple spaces with a single space
      .trim();
  };

  // Function to get excerpt from content
  const getExcerpt = (content: string, maxLength: number = 160): string => {
    if (!content) return '';
    const text = cleanHtml(content);
    return text.length > maxLength 
      ? `${text.substring(0, maxLength).trim()}...` 
      : text;
  };

  const calculateReadTime = (content: string) => {
    if (!content) return '1 min read';
    const text = cleanHtml(content);
    const wordsPerMinute = 200;
    const wordCount = text.split(/\s+/).length;
    const readTime = Math.max(1, Math.ceil(wordCount / wordsPerMinute));
    return `${readTime} min read`;
  };

  return (
    <div className="min-h-screen pt-16 bg-gray-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-[#000054] to-[#1e1e8f] text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">TTI Blog</h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-8">
            Insights, stories, and updates from our journey to transform lives
            through technology education
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <div className="relative">
              <input
                type="text"
                placeholder="Search articles..."
                className="w-full px-6 py-4 pr-12 rounded-full text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#E32845] bg-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <FiSearch className="absolute right-6 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Categories */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeCategory === category.id
                  ? "bg-[#000054] text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#000054]"></div>
          </div>
        )}

        {/* Featured Post */}
        {!loading && filteredPosts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-16"
          >
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="md:flex">
                <div className="md:flex-shrink-0 md:w-1/2">
                  <div className="relative h-full w-full min-h-[300px]">
                    <Image
                      src={
                        filteredPosts[0].featuredImage ||
                        "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1471&q=80"
                      }
                      alt={filteredPosts[0].title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                      priority
                    />
                  </div>
                </div>
                
                <div className="p-8 md:w-1/2 flex flex-col justify-center">
                  <div className="uppercase tracking-wide text-sm text-[#E32845] font-semibold mb-2">
                    Featured Post
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                    {filteredPosts[0].title}
                  </h2>
                  <p className="mt-2 text-gray-600 mb-6">
                    {getExcerpt(filteredPosts[0].excerpt || filteredPosts[0].content, 200)}
                  </p>
                  <div className="flex items-center text-sm text-gray-500 mb-6">
                    <span className="flex items-center mr-4">
                      <FiCalendar className="mr-1" />
                      {formatDate(
                        filteredPosts[0].publishedAt ||
                          filteredPosts[0].createdAt
                      )}
                    </span>
                    <span className="flex items-center">
                      <FiClock className="mr-1" />
                      {calculateReadTime(filteredPosts[0].content)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <Button
                      size="sm"
                      className="group"
                      onClick={() =>
                        (window.location.href = `/blog/${filteredPosts[0].slug}`)
                      }
                    >
                      Read Full Story
                      <FiArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                    <div className="flex space-x-3">
                      <button className="text-gray-400 hover:text-blue-600 transition-colors">
                        <FaFacebook className="text-xl" />
                      </button>
                      <button className="text-gray-400 hover:text-blue-400 transition-colors">
                        <FaTwitter className="text-xl" />
                      </button>
                      <button className="text-gray-400 hover:text-blue-700 transition-colors">
                        <FaLinkedin className="text-xl" />
                      </button>
                    </div>
                  </div>
                  {/* Tags for Featured Post */}
                  {filteredPosts[0].tags &&
                    filteredPosts[0].tags.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex flex-wrap gap-2">
                          {filteredPosts[0].tags.map((tag, i) => (
                            <span
                              key={i}
                              className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Blog Posts Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 mb-12">
            {filteredPosts.slice(1).map((post, index) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: (index + 1) * 0.1 }}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
              >
                <div className="relative w-full h-48">
                  <Image
                    src={
                      post.featuredImage ||
                      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1471&q=80"
                    }
                    alt={post.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-medium text-[#E32845] bg-red-50 px-3 py-1 rounded-full">
                      {categories.find((cat) => cat.id === post.category)
                        ?.name || post.category}
                    </span>
                    <div className="flex items-center text-xs text-gray-500">
                      <FiCalendar className="mr-1" />
                      {formatDate(post.publishedAt || post.createdAt)}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {post.title}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {getExcerpt(post.excerpt || post.content, 150)}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center text-sm text-gray-500">
                      <FiClock className="mr-1" />
                      {calculateReadTime(post.content)}
                    </span>
                    <button
                      onClick={() => router.push(`/blog/${post.slug}`)}
                      className="text-[#000054] font-medium hover:text-[#1e1e8f] transition-colors flex items-center"
                    >
                      Read More
                      <FiArrowRight className="ml-1" />
                    </button>
                  </div>
                  {/* Tags */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex flex-wrap gap-2">
                        {post.tags.map((tag, i) => (
                          <span
                            key={i}
                            className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.article>
            ))}
          </div>
        )}

        {/* No Posts Message */}
        {!loading && filteredPosts.length === 0 && (
          <div className="text-center py-20">
            <div className="text-gray-400 text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No blog posts found
            </h3>
            <p className="text-gray-500">
              {searchQuery || activeCategory !== "all"
                ? "Try adjusting your search or filter criteria."
                : "Check back soon for new content!"}
            </p>
          </div>
        )}

        {/* Newsletter Subscription */}
        <div className="bg-gradient-to-r from-[#000054] to-[#1e1e8f] rounded-2xl p-8 md:p-12 text-white overflow-hidden relative mb-16">
          <div className="relative z-10 max-w-3xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Stay Updated
            </h2>
            <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
              Subscribe to our newsletter to receive the latest news, updates,
              and exclusive content directly to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-6 py-3 rounded-full text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#E32845] bg-white"
              />
              <Button
                variant="secondary"
                className="whitespace-nowrap rounded-full"
              >
                Subscribe
              </Button>
            </div>
          </div>
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#E32845] rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
          <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-[#0000ff] rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        </div>

        {/* Pagination */}
        {filteredPosts.length > 0 && (
          <div className="flex justify-center">
            <nav className="flex items-center space-x-2">
              <button className="px-4 py-2 rounded-lg bg-white text-gray-700 hover:bg-gray-100 transition-colors">
                Previous
              </button>
              {[1, 2, 3].map((page) => (
                <button
                  key={page}
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    page === 1
                      ? "bg-[#000054] text-white"
                      : "bg-white text-gray-700 hover:bg-gray-100"
                  } transition-colors`}
                >
                  {page}
                </button>
              ))}
              <button className="px-4 py-2 rounded-lg bg-white text-gray-700 hover:bg-gray-100 transition-colors">
                Next
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
};

export default Blog;
