"use client";
import React, { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  MdAdd,
  MdEdit,
  MdDelete,
  MdPublish,
  MdDrafts,
  MdSearch,
  MdArticle,
  MdImage,
  MdClose,
  MdCheckCircle,
  MdChevronLeft,
  MdChevronRight,
  MdRefresh,
} from "react-icons/md";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/services/firebase";
import MediaPicker from "./MediaPicker";
import type { BlogPost } from "@/types/blog";
import type { MediaAsset } from "@/types/media";
import {
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
} from "@/services/blogService";
import TeamService from "@/services/teamService";
import RichTextEditor from "./RichTextEditor";
import { uploadBlogImage } from "@/services/cloudinaryService";
import { fetchAdminBlogData } from "@/services/adminDataService";
import { Skeleton, TableSkeleton } from "@/components/ui/Skeleton";
import { useAppSelector } from "@/store/store";

export interface BlogFormData {
  title: string;
  content: string;
  excerpt: string;
  category: string;
  tags: string[];
  status: "draft" | "published" | "review" | "archived";
  featured: boolean;
  seoTitle: string;
  seoDescription: string;
  featuredImage: string;
  _featuredImageFile?: File;
}

type CreateBlogPostData = Omit<BlogFormData, "_featuredImageFile"> & {
  teamId?: string | null;
};
type UpdateBlogPostData = Partial<CreateBlogPostData> & { id: string };

interface BlogManagementProps {
  openDialog?: boolean;
  onCloseDialog?: () => void;
}

const BlogManagement: React.FC<BlogManagementProps> = ({
  openDialog = false,
  onCloseDialog,
}) => {
  const [user] = useAuthState(auth);
  const currentUser = useAppSelector((state) => state.auth.user);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(openDialog);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<BlogPost | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [categories, setCategories] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);

  const [formData, setFormData] = useState<BlogFormData>({
    title: "",
    content: "",
    excerpt: "",
    category: "",
    tags: [],
    status: "draft",
    featured: false,
    seoTitle: "",
    seoDescription: "",
    featuredImage: "",
    _featuredImageFile: undefined,
  });

  useEffect(() => {
    void loadBlogData();

    const intervalId = window.setInterval(() => {
      void loadBlogData(false, false, false);
    }, 30000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    setDialogOpen(openDialog);
  }, [openDialog]);

  const loadBlogData = async (
    showLoader = true,
    showToast = true,
    showRefreshing = !showLoader,
  ) => {
    try {
      if (showLoader) {
        setLoading(true);
      } else if (showRefreshing) {
        setRefreshing(true);
      }

      const { posts: fetchedPosts, categories: fetchedCategories } =
        await fetchAdminBlogData();

      setPosts(fetchedPosts);
      setCategories(fetchedCategories);
    } catch (error) {
      console.error("Error loading posts:", error);
      if (showToast) {
        toast.error("Failed to load blog posts");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCreatePost = async () => {
    if (!user) {
      toast.error("You must be logged in to create a post");
      return;
    }

    try {
      setIsSubmitting(true);
      const updatedFormData = { ...formData };

      // If a new featured image file was provided, upload it
      if (formData._featuredImageFile) {
        try {
          const asset = await uploadBlogImage(formData._featuredImageFile);
          updatedFormData.featuredImage = asset.url;
        } catch (err) {
          console.error("Failed to upload featured image:", err);
          const message = err instanceof Error ? err.message : String(err);
          toast.error(
            `Failed to upload featured image. ${message}. Post creation aborted.`,
          );
          return;
        }
      }

      // Remove _featuredImageFile from the data sent to createBlogPost
      const postData = { ...updatedFormData };
      delete postData._featuredImageFile;

      const teamContext = currentUser
        ? await TeamService.ensureTeamContext(currentUser).catch(() => null)
        : null;

      await createBlogPost(
        {
          ...postData,
          teamId: teamContext?.teamId || currentUser?.teamId || null,
        },
        user.uid,
        user.displayName || "Anonymous",
        user.email || "unknown@email.com",
      );

      toast.success("Blog post created successfully!");
      handleCloseDialog();
      await loadBlogData(false);
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("Failed to create blog post. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePost = async () => {
    if (!editingPost) return;

    try {
      setIsSubmitting(true);
      const updatedFormData = { ...formData };

      // If a new featured image file was provided, upload it
      if (formData._featuredImageFile) {
        try {
          const asset = await uploadBlogImage(
            formData._featuredImageFile,
            editingPost.id,
          );
          updatedFormData.featuredImage = asset.url;
        } catch (err) {
          console.error("Failed to upload featured image:", err);
          const message = err instanceof Error ? err.message : String(err);
          toast.error(
            `Failed to upload featured image. ${message}. Post update aborted.`,
          );
          return;
        }
      }

      // Remove _featuredImageFile from the data sent to updateBlogPost
      const postData = { ...updatedFormData };
      delete postData._featuredImageFile;

      const teamContext = currentUser
        ? await TeamService.ensureTeamContext(currentUser).catch(() => null)
        : null;

      const updateData: UpdateBlogPostData = {
        id: editingPost.id,
        ...postData,
        teamId: teamContext?.teamId || currentUser?.teamId || null,
      };

      await updateBlogPost(updateData);

      toast.success("Blog post updated successfully!");
      handleCloseDialog();
      await loadBlogData(false);
    } catch (error) {
      console.error("Error updating post:", error);
      toast.error("Failed to update blog post. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePost = async () => {
    if (!postToDelete) return;

    try {
      await deleteBlogPost(postToDelete.id);
      toast.success("Blog post deleted successfully!");
      setDeleteConfirmOpen(false);
      setPostToDelete(null);
      await loadBlogData(false);
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete blog post. Please try again.");
    }
  };

  const handleOpenDialog = (post?: BlogPost) => {
    if (post) {
      setEditingPost(post);
      const postData = post as unknown as Record<string, unknown>;
      setFormData({
        title: post.title,
        content: post.content,
        excerpt: post.excerpt || "", // Ensure excerpt is string
        featuredImage: post.featuredImage || "",
        category: post.category || "",
        tags: post.tags || [],
        status: post.status || "draft",
        featured: Boolean(postData.featured ?? false),
        seoTitle: String(postData.seoTitle || ""),
        seoDescription: String(postData.seoDescription || ""),
        _featuredImageFile: undefined,
      });
    } else {
      setEditingPost(null);
      setFormData({
        title: "",
        content: "",
        excerpt: "",
        category: "",
        tags: [],
        status: "draft",
        featured: false,
        seoTitle: "",
        seoDescription: "",
        featuredImage: "",
        _featuredImageFile: undefined,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingPost(null);
    if (onCloseDialog) {
      onCloseDialog();
    }
  };

  const handleStatusChange = async (
    post: BlogPost,
    newStatus: BlogPost["status"],
  ) => {
    try {
      await updateBlogPost({
        id: post.id,
        status: newStatus,
      });

      toast.success(
        `Post ${newStatus === "published" ? "published" : "updated"} successfully`,
      );
      await loadBlogData(false);
    } catch (error) {
      console.error("Error updating post status:", error);
      toast.error("Failed to update post status");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800 border-green-200";
      case "draft":
        return "bg-slate-100 text-slate-800 border-slate-200";
      case "review":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "archived":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const getCategoryColor = (category: string) => {
    // Generate a consistent but varied color based on category name
    const colors = [
      "bg-purple-100 text-purple-800 border-purple-200",
      "bg-indigo-100 text-indigo-800 border-indigo-200",
      "bg-blue-100 text-blue-800 border-blue-200",
      "bg-cyan-100 text-cyan-800 border-cyan-200",
      "bg-teal-100 text-teal-800 border-teal-200",
      "bg-orange-100 text-orange-800 border-orange-200",
      "bg-pink-100 text-pink-800 border-pink-200",
    ];
    let hash = 0;
    for (let i = 0; i < category.length; i++) {
      hash = category.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (post.author?.name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || post.status === statusFilter;
    const matchesCategory =
      categoryFilter === "all" || post.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const paginatedPosts = filteredPosts.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  const totalPages = Math.ceil(filteredPosts.length / rowsPerPage);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-11 w-64" />
          <Skeleton className="h-11 w-36 rounded-xl" />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row">
            <Skeleton className="h-11 flex-1 rounded-xl" />
            <Skeleton className="h-11 w-full rounded-xl md:w-48" />
            <Skeleton className="h-11 w-full rounded-xl md:w-48" />
            <Skeleton className="h-6 w-28 self-center" />
          </div>
        </div>

        <div className="block space-y-4 lg:hidden">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <div className="mt-4 flex gap-2">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            </div>
          ))}
        </div>

        <div className="hidden lg:block">
          <TableSkeleton rows={6} columns={7} />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mt-10">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-3xl font-extrabold text-[#000054] flex items-center gap-2">
          <MdArticle size={32} />
          Blog Management
        </h1>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <button
            onClick={() => void loadBlogData(false)}
            disabled={loading || refreshing}
            className="flex items-center justify-center gap-2 px-5 py-2.5 border border-[#000054] bg-white text-[#000054] rounded-lg hover:bg-[#000054]/5 transition-colors font-bold shadow-sm disabled:opacity-50"
          >
            <MdRefresh
              size={18}
              className={loading || refreshing ? "animate-spin" : ""}
            />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => handleOpenDialog()}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-secondary text-white rounded-lg hover:bg-secondary-hover transition-colors font-bold shadow-sm"
          >
            <MdAdd size={20} />
            <span>Create Post</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-grow w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MdSearch className="text-slate-400" size={20} />
          </div>
          <input
            type="text"
            placeholder="Search posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white transition-colors focus:ring-2 focus:ring-primary/20 outline-none focus:border-primary"
          />
        </div>

        <div className="w-full md:w-48 shrink-0">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white transition-colors focus:ring-2 focus:ring-primary/20 outline-none focus:border-primary appearance-none"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="review">Under Review</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div className="w-full md:w-48 shrink-0">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white transition-colors focus:ring-2 focus:ring-primary/20 outline-none focus:border-primary appearance-none"
          >
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full md:w-auto shrink-0 text-right md:text-left text-sm text-slate-500 font-medium whitespace-nowrap">
          {filteredPosts.length} posts found
        </div>
      </div>

      {/* Mobile/Tablet Card View */}
      <div className="block lg:hidden space-y-4 mb-6">
        {paginatedPosts.map((post) => (
          <div
            key={post.id}
            className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:border-primary/30 transition-colors"
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-bold text-slate-800 leading-tight">
                {post.title}
              </h3>
              <span
                className={`px-2 py-1 rounded-md text-xs font-bold border ml-2 shrink-0 ${getStatusColor(post.status)}`}
              >
                {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
              </span>
            </div>

            <p className="text-sm text-slate-500 mb-3 line-clamp-2">
              {post.excerpt || "No excerpt available"}
            </p>

            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                {post.author?.name?.charAt(0) || "?"}
              </div>
              <span className="text-sm font-medium text-slate-700">
                {post.author?.name || "Unknown"}
              </span>
              <span className="text-xs text-slate-400">
                &bull;{" "}
                {post.createdAt
                  ? new Date(post.createdAt).toLocaleDateString()
                  : "Unknown date"}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-4">
              {post.category && (
                <span
                  className={`px-2 py-0.5 rounded-md text-xs font-bold border ${getCategoryColor(post.category)}`}
                >
                  {post.category}
                </span>
              )}
              {post.tags?.slice(0, 2).map((tag: string) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-md text-xs font-medium border border-slate-200 bg-slate-50 text-slate-600"
                >
                  #{tag}
                </span>
              ))}
              {post.tags && post.tags.length > 2 && (
                <span className="px-2 py-0.5 rounded-md text-xs font-medium border border-slate-200 bg-slate-50 text-slate-600">
                  +{post.tags.length - 2}
                </span>
              )}
            </div>

            <div className="flex justify-end items-center gap-1 border-t border-slate-100 pt-3">
              <button
                onClick={() => handleOpenDialog(post)}
                className="p-2 text-[#000054] hover:bg-[#000054]/10 rounded-lg transition-colors"
                title="Edit"
              >
                <MdEdit size={20} />
              </button>
              <button
                onClick={() =>
                  handleStatusChange(
                    post,
                    post.status === "published" ? "draft" : "published",
                  )
                }
                className="p-2 text-[#ADF802] hover:bg-[#ADF802]/20 rounded-lg transition-colors"
                title={
                  post.status === "published" ? "Revert to Draft" : "Publish"
                }
              >
                {post.status === "published" ? (
                  <MdDrafts size={20} className="text-amber-500" />
                ) : (
                  <MdPublish size={20} className="text-[#8ec400]" />
                )}
              </button>
              <button
                onClick={() => {
                  setPostToDelete(post);
                  setDeleteConfirmOpen(true);
                }}
                className="p-2 text-[#E32845] hover:bg-[#E32845]/10 rounded-lg transition-colors"
                title="Delete"
              >
                <MdDelete size={20} />
              </button>
            </div>
          </div>
        ))}
        {filteredPosts.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
            <p className="text-slate-500">
              No blog posts found matching your criteria.
            </p>
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-sm font-bold text-slate-600">
                <th className="p-4">Title</th>
                <th className="p-4">Author</th>
                <th className="p-4">Category</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Views</th>
                <th className="p-4 text-right">Created</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedPosts.length > 0 ? (
                paginatedPosts.map((post) => (
                  <tr
                    key={post.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="p-4 max-w-sm">
                      <p className="font-bold text-slate-800 text-sm">
                        {post.title}
                      </p>
                      <p className="text-xs text-slate-500 mt-1 truncate">
                        {post.excerpt || "No excerpt"}
                      </p>
                      {Boolean((post as unknown as Record<string, unknown>).featured) && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-[#ADF802]/20 text-[#000054] text-[10px] font-bold uppercase rounded-sm border border-[#ADF802]/50">
                          Featured
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
                          {post.author?.name?.charAt(0) || "?"}
                        </div>
                        <span className="text-sm font-medium text-slate-700 whitespace-nowrap">
                          {post.author?.name || "Unknown"}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded-md text-xs font-bold border whitespace-nowrap ${post.category ? getCategoryColor(post.category) : "bg-slate-100 text-slate-600 border-slate-200"}`}
                      >
                        {post.category || "Uncategorized"}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded-md text-xs font-bold border whitespace-nowrap ${getStatusColor(post.status)}`}
                      >
                        {post.status.charAt(0).toUpperCase() +
                          post.status.slice(1)}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-600 text-right font-medium">
                      {post.views || 0}
                    </td>
                    <td className="p-4 text-sm text-slate-600 text-right whitespace-nowrap">
                      {post.createdAt
                        ? new Date(post.createdAt).toLocaleDateString()
                        : "Unknown"}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenDialog(post)}
                          className="p-1.5 text-[#000054] hover:bg-[#000054]/10 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <MdEdit size={20} />
                        </button>
                        <button
                          onClick={() =>
                            handleStatusChange(
                              post,
                              post.status === "published"
                                ? "draft"
                                : "published",
                            )
                          }
                          className="p-1.5 text-[#ADF802] hover:bg-[#ADF802]/20 rounded-lg transition-colors"
                          title={
                            post.status === "published"
                              ? "Revert to Draft"
                              : "Publish"
                          }
                        >
                          {post.status === "published" ? (
                            <MdDrafts size={20} className="text-amber-500" />
                          ) : (
                            <MdPublish size={20} className="text-[#8ec400]" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setPostToDelete(post);
                            setDeleteConfirmOpen(true);
                          }}
                          className="p-1.5 text-[#E32845] hover:bg-[#E32845]/10 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <MdDelete size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No blog posts found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination component */}
      {filteredPosts.length > 0 && (
        <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3 sm:px-6 rounded-xl shadow-sm">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="relative inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="relative ml-3 inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <p className="text-sm text-slate-700">
                Showing{" "}
                <span className="font-medium">{page * rowsPerPage + 1}</span> to{" "}
                <span className="font-medium">
                  {Math.min((page + 1) * rowsPerPage, filteredPosts.length)}
                </span>{" "}
                of <span className="font-medium">{filteredPosts.length}</span>{" "}
                results
              </p>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setPage(0);
                }}
                className="p-1 rounded border border-slate-300 bg-white text-sm"
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
              </select>
            </div>
            <div>
              <nav
                className="isolate inline-flex -space-x-px rounded-md shadow-sm"
                aria-label="Pagination"
              >
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                >
                  <MdChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                {/* Simple pagination page numbers can go here if needed, omitted for brevity and flexibility */}
                <button
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page >= totalPages - 1}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                >
                  <MdChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Dialog */}
      {dialogOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-navy/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-[#000054] text-white px-6 py-4 flex items-center justify-between shrink-0">
              <h2 className="font-bold text-lg">
                {editingPost ? "Edit Blog Post" : "Create New Blog Post"}
              </h2>
              <button
                onClick={handleCloseDialog}
                disabled={isSubmitting}
                className="text-white/70 hover:text-white transition-colors disabled:opacity-50"
              >
                <MdClose size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto w-full flex-grow">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Left Column: Form Fields */}
                <div className="md:col-span-8 space-y-5">
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white transition-colors focus:ring-2 focus:ring-primary/20 outline-none focus:border-primary font-medium"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700">
                      Excerpt <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      value={formData.excerpt}
                      onChange={(e) =>
                        setFormData({ ...formData, excerpt: e.target.value })
                      }
                      className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white transition-colors focus:ring-2 focus:ring-primary/20 outline-none focus:border-primary resize-y"
                      required
                    />
                  </div>

                  <div className="space-y-1 outline-none min-h-[400px]">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-2">
                      Content <span className="text-red-500">*</span>
                    </label>
                    <RichTextEditor
                      value={formData.content}
                      onChange={(content) =>
                        setFormData({ ...formData, content })
                      }
                      placeholder="Write your blog post content here..."
                      minHeight={400}
                      allowMedia={true}
                      showPreview={true}
                    />
                  </div>
                </div>

                {/* Right Column: Meta & Settings */}
                <div className="md:col-span-4 space-y-5">
                  {/* Status & Visibility Component */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-800 mb-3 border-b border-slate-200 pb-2">
                      Publishing
                    </h3>

                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase">
                          Status
                        </label>
                        <select
                          value={formData.status}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              status: e.target.value as BlogPost["status"],
                            })
                          }
                          className="w-full p-2 rounded-md border border-slate-300 bg-white focus:ring-2 focus:ring-primary/20 outline-none focus:border-primary appearance-none text-sm font-medium"
                        >
                          <option value="draft">Draft</option>
                          <option value="review">Under Review</option>
                          <option value="published">Published</option>
                          <option value="archived">Archived</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase">
                          Category <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.category}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              category: e.target.value,
                            })
                          }
                          className="w-full p-2 rounded-md border border-slate-300 bg-white focus:ring-2 focus:ring-primary/20 outline-none focus:border-primary text-sm"
                          placeholder="e.g., News, Event"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Taxonomy */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-800 mb-3 border-b border-slate-200 pb-2">
                      Organization
                    </h3>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500 uppercase">
                        Tags (comma separated)
                      </label>
                      <input
                        type="text"
                        value={formData.tags.join(", ")}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            tags: e.target.value
                              .split(",")
                              .map((tag) => tag.trim())
                              .filter((tag) => tag),
                          })
                        }
                        className="w-full p-2 rounded-md border border-slate-300 bg-white focus:ring-2 focus:ring-primary/20 outline-none focus:border-primary text-sm"
                        placeholder="tag1, tag2"
                      />
                    </div>
                  </div>

                  {/* Featured Image */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-800 mb-3 border-b border-slate-200 pb-2">
                      Featured Image
                    </h3>

                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="flex-1 py-1.5 px-3 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-md transition-colors flex items-center justify-center gap-1"
                          onClick={() => setMediaPickerOpen(true)}
                        >
                          <MdImage size={16} /> Select Media
                        </button>

                        <label className="flex-1 py-1.5 px-3 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-md transition-colors flex items-center justify-center gap-1 cursor-pointer">
                          <MdPublish size={16} /> Upload
                          <input
                            type="file"
                            accept="image/*"
                            hidden
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setFormData({
                                  ...formData,
                                  _featuredImageFile: file,
                                  featuredImage: URL.createObjectURL(file),
                                });
                              }
                            }}
                          />
                        </label>
                      </div>

                      {formData.featuredImage && (
                        <div className="relative group rounded-lg overflow-hidden border border-slate-200 bg-black/5 mt-2">
                          <img
                            src={formData.featuredImage}
                            alt="Featured"
                            className="w-full h-[150px] object-cover"
                          />
                          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  featuredImage: "",
                                  _featuredImageFile: undefined,
                                })
                              }
                              className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-colors"
                            >
                              <MdDelete size={20} />
                            </button>
                            <span className="text-white text-xs font-bold mt-1">
                              Remove Image
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 shrink-0">
              <button
                onClick={handleCloseDialog}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 bg-white font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={editingPost ? handleUpdatePost : handleCreatePost}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-lg bg-[#E32845] text-white font-bold hover:bg-[#c41e3a] transition-colors disabled:opacity-50 shadow-sm flex items-center gap-2 min-w-[140px] justify-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                    {editingPost ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  <>
                    <MdCheckCircle size={20} />
                    {editingPost ? "Update Post" : "Create Post"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmOpen && postToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <MdDelete size={32} />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">
                Confirm Deletion
              </h2>
              <p className="text-sm text-slate-600 mb-1">
                Are you sure you want to delete{" "}
                <strong className="text-slate-800">
                  &quot;{postToDelete.title}&quot;
                </strong>
                ?
              </p>
              <p className="text-xs text-red-500 font-medium">
                This action cannot be undone.
              </p>
            </div>
            <div className="bg-slate-50 px-6 py-4 flex gap-3 border-t border-slate-200">
              <button
                onClick={() => setDeleteConfirmOpen(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 font-bold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePost}
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Media Picker Dialog */}
      {mediaPickerOpen && (
        <MediaPicker
          open={mediaPickerOpen}
          onClose={() => setMediaPickerOpen(false)}
          title="Select Featured Image"
          allowMultiple={false}
          allowedTypes={["image"]}
          category="blog"
          onSelect={(assets: MediaAsset[]) => {
            if (assets.length > 0) {
              setFormData({
                ...formData,
                featuredImage: assets[0].url,
                _featuredImageFile: undefined, // Clear any uploaded file
              });
            }
            setMediaPickerOpen(false);
          }}
          onCancel={() => setMediaPickerOpen(false)}
        />
      )}
    </div>
  );
};

export default BlogManagement;
