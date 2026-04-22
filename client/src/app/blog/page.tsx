"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  MdArrowOutward,
  MdCalendarMonth,
  MdInsights,
  MdOutlineAccessTime,
  MdSearch,
} from "react-icons/md";
import PublicPageCanvas from "@/components/shared/PublicPageCanvas";
import PublicPageHero from "@/components/shared/PublicPageHero";
import { getBlogPosts } from "@/services/blogService";
import type { BlogPost } from "@/types/blog";

const cleanHtml = (html: string): string => {
  if (!html) return "";

  if (typeof document === "undefined") {
    return html.replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim();
  }

  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return (tmp.textContent || tmp.innerText || "")
    .replace(/\s+/g, " ")
    .trim();
};

const getExcerpt = (content: string, maxLength: number = 170): string => {
  const text = cleanHtml(content);
  return text.length > maxLength ? `${text.slice(0, maxLength).trim()}...` : text;
};

const calculateReadTime = (content: string) => {
  const text = cleanHtml(content);
  const wordsPerMinute = 200;
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const readTime = Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  return `${readTime} min read`;
};

const formatDate = (
  timestamp: { toDate?: () => Date } | string | number | null | undefined,
) => {
  try {
    if (
      timestamp &&
      typeof timestamp === "object" &&
      "toDate" in timestamp &&
      typeof timestamp.toDate === "function"
    ) {
      return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(timestamp.toDate());
    }

    const date = timestamp ? new Date(timestamp as string | number) : new Date();
    if (Number.isNaN(date.getTime())) {
      return "Date not available";
    }

    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  } catch {
    return "Date not available";
  }
};

export default function BlogPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlogPosts = async () => {
      try {
        setLoading(true);
        const publishedPosts = await getBlogPosts({
          status: "published",
          orderByField: "publishedAt",
          orderDirection: "desc",
        });
        setBlogPosts(publishedPosts);
      } catch (error) {
        console.error("Error fetching blog posts:", error);
      } finally {
        setLoading(false);
      }
    };

    void fetchBlogPosts();
  }, []);

  const categories = useMemo(
    () => [
      { id: "all", name: "All stories" },
      ...Array.from(new Set(blogPosts.map((post) => post.category).filter(Boolean))).map(
        (category) => ({
          id: category,
          name: category
            .split(/[_\s-]+/)
            .filter(Boolean)
            .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
            .join(" "),
        }),
      ),
    ],
    [blogPosts],
  );

  const filteredPosts = useMemo(
    () =>
      blogPosts.filter((post) => {
        const matchesSearch =
          post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
          cleanHtml(post.content).toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory =
          activeCategory === "all" || post.category === activeCategory;

        return matchesSearch && matchesCategory;
      }),
    [activeCategory, blogPosts, searchQuery],
  );

  const featuredPost = filteredPosts[0];
  const secondaryPosts = filteredPosts.slice(1);

  return (
    <PublicPageCanvas>
      <PublicPageHero
        badge="Inside Benzard"
        badgeIcon={<MdInsights size={16} />}
        title="Stories, updates, and field notes from the Benzard ecosystem."
        description="Follow the latest platform updates, event recaps, training insights, and athlete-development stories in a layout that mirrors the rest of the public site."
        stats={[
          {
            value: `${blogPosts.length}`,
            label: "Published Stories",
            accentClassName: "text-primary",
          },
          {
            value: `${categories.length - 1}`,
            label: "Active Categories",
            accentClassName: "text-secondary",
          },
          {
            value: featuredPost ? calculateReadTime(featuredPost.content) : "0 min",
            label: "Featured Read",
            accentClassName: "text-emerald-600",
          },
        ]}
        aside={
          <div className="glass-panel rounded-[32px] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Search Stories
            </p>
            <label className="mt-4 flex items-center gap-3 rounded-[24px] border border-slate-200 bg-white/85 px-4 py-3 shadow-sm">
              <MdSearch className="text-slate-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search posts, excerpts, or keywords"
                className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
            </label>
            <div className="mt-4 flex flex-wrap gap-2">
              {categories.slice(0, 5).map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setActiveCategory(category.id)}
                  className={`rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition ${
                    activeCategory === category.id
                      ? "bg-secondary text-white"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-secondary/20 hover:text-secondary"
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        }
      />

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="glass-panel rounded-[36px] p-6 sm:p-8">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setActiveCategory(category.id)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeCategory === category.id
                    ? "bg-secondary text-white"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-secondary/20 hover:text-secondary"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8">
          {loading ? (
            <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="glass-panel h-[420px] rounded-[32px] skeleton-shimmer" />
              <div className="space-y-6">
                <div className="glass-panel h-[196px] rounded-[32px] skeleton-shimmer" />
                <div className="glass-panel h-[196px] rounded-[32px] skeleton-shimmer" />
              </div>
            </div>
          ) : !featuredPost ? (
            <div className="glass-panel rounded-[32px] p-10 text-center">
              <h3 className="text-2xl font-semibold text-secondary">
                No blog posts matched your search.
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-500">
                Adjust the search term or category filter to widen the journal.
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                <article className="glass-panel overflow-hidden rounded-[32px] p-4">
                  <div className="relative overflow-hidden rounded-[26px]">
                    <Image
                      src={featuredPost.featuredImage || "/assets/11.jpg"}
                      alt={featuredPost.title}
                      width={1400}
                      height={900}
                      className="h-[340px] w-full object-cover"
                      sizes="(max-width: 1024px) 100vw, 60vw"
                      priority
                    />
                  </div>
                  <div className="px-2 pb-2 pt-5">
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                      Featured story
                    </span>
                    <h2 className="mt-4 text-3xl font-semibold text-secondary">
                      {featuredPost.title}
                    </h2>
                    <p className="mt-4 text-sm leading-7 text-slate-600">
                      {getExcerpt(featuredPost.excerpt || featuredPost.content, 240)}
                    </p>
                    <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                      <span className="inline-flex items-center gap-2">
                        <MdCalendarMonth size={16} />
                        {formatDate(featuredPost.publishedAt || featuredPost.createdAt)}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <MdOutlineAccessTime size={16} />
                        {calculateReadTime(featuredPost.content)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => router.push(`/blog/${featuredPost.slug}`)}
                      className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-secondary px-4 py-3 text-sm font-semibold text-white transition hover:bg-secondary-hover"
                    >
                      Read story
                      <MdArrowOutward size={18} />
                    </button>
                  </div>
                </article>

                <div className="space-y-6">
                  {secondaryPosts.slice(0, 3).map((post) => (
                    <article
                      key={post.id}
                      className="glass-panel rounded-[32px] p-5 transition hover:-translate-y-1 hover:border-primary/15"
                    >
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                        {post.category}
                      </span>
                      <h3 className="mt-4 text-2xl font-semibold text-secondary">
                        {post.title}
                      </h3>
                      <p className="mt-3 text-sm leading-7 text-slate-600">
                        {getExcerpt(post.excerpt || post.content, 130)}
                      </p>
                      <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                        <span className="inline-flex items-center gap-2">
                          <MdCalendarMonth size={16} />
                          {formatDate(post.publishedAt || post.createdAt)}
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <MdOutlineAccessTime size={16} />
                          {calculateReadTime(post.content)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => router.push(`/blog/${post.slug}`)}
                        className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-secondary transition hover:text-primary"
                      >
                        Open article
                        <MdArrowOutward size={18} />
                      </button>
                    </article>
                  ))}
                </div>
              </div>

              {secondaryPosts.length > 3 ? (
                <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {secondaryPosts.slice(3).map((post) => (
                    <article
                      key={post.id}
                      className="glass-panel overflow-hidden rounded-[32px] p-4 transition hover:-translate-y-1 hover:border-primary/15"
                    >
                      <div className="relative overflow-hidden rounded-[24px]">
                        <Image
                          src={post.featuredImage || "/assets/10.jpg"}
                          alt={post.title}
                          width={1200}
                          height={800}
                          className="h-56 w-full object-cover"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                      </div>
                      <div className="px-2 pb-2 pt-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                          {post.category}
                        </p>
                        <h3 className="mt-3 text-2xl font-semibold text-secondary">
                          {post.title}
                        </h3>
                        <p className="mt-3 text-sm leading-7 text-slate-600">
                          {getExcerpt(post.excerpt || post.content, 130)}
                        </p>
                        <button
                          type="button"
                          onClick={() => router.push(`/blog/${post.slug}`)}
                          className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-secondary transition hover:text-primary"
                        >
                          Read article
                          <MdArrowOutward size={18} />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : null}
            </>
          )}
        </div>
      </section>
    </PublicPageCanvas>
  );
}
