"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  MdDelete,
  MdOutlinePublish,
  MdPostAdd,
  MdSave,
} from "react-icons/md";
import RichTextEditor from "@/components/admin/RichTextEditor";
import {
  dashboardDangerActionButtonClass,
  dashboardNeutralButtonClass,
  dashboardOutlineActionButtonClass,
  dashboardPrimaryButtonClass,
  dashboardSoftActionButtonClass,
} from "@/components/dashboard/dashboardButtonStyles";
import {
  createTeamPost,
  deleteTeamPost,
  updateTeamPost,
} from "@/store/mediaSlice";
import { useAppDispatch, useAppSelector } from "@/store/store";
import type { TeamMediaRecord, TeamPostRecord } from "@/types/media-dashboard";

interface MediaPostsPanelProps {
  teamId: string;
  currentUserId?: string | null;
  posts: TeamPostRecord[];
  mediaItems: TeamMediaRecord[];
}

const emptyForm = {
  title: "",
  type: "blog" as TeamPostRecord["type"],
  status: "draft" as TeamPostRecord["status"],
  scheduledFor: "",
  content: "",
  mediaIds: [] as string[],
};

const stripHtml = (value: string) =>
  value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

const buildExcerpt = (content: string, maxLength = 180) => {
  const plainText = stripHtml(content);
  if (plainText.length <= maxLength) {
    return plainText;
  }

  return `${plainText.slice(0, maxLength).trim()}...`;
};

const getCategoryForPostType = (type: TeamPostRecord["type"]) => {
  switch (type) {
    case "announcement":
      return "announcements";
    case "match_report":
      return "match_report";
    case "event":
      return "events";
    default:
      return "general";
  }
};

export default function MediaPostsPanel({
  teamId,
  currentUserId,
  posts,
  mediaItems,
}: MediaPostsPanelProps) {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.user);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const supportsScheduling = form.type === "event";
  const editingPost = editingPostId
    ? posts.find((post) => post.id === editingPostId) || null
    : null;
  const selectedMedia = useMemo(
    () => mediaItems.filter((item) => form.mediaIds.includes(item.id)),
    [form.mediaIds, mediaItems],
  );

  const sortedPosts = useMemo(
    () =>
      [...posts].sort((left, right) => {
        const rightTime = new Date(right.updatedAt || right.createdAt || 0).getTime();
        const leftTime = new Date(left.updatedAt || left.createdAt || 0).getTime();
        return rightTime - leftTime;
      }),
    [posts],
  );

  const resetForm = () => {
    setEditingPostId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error("Title and content are required.");
      return;
    }

    if (!supportsScheduling && form.status === "scheduled") {
      toast.error("Scheduling is only available for event posts.");
      return;
    }

    try {
      const featuredImage =
        selectedMedia.find((item) => item.type === "image")?.url || null;
      const tags = Array.from(
        new Set(
          selectedMedia.flatMap((item) => item.tags).filter(Boolean),
        ),
      );
      const derivedPayload = {
        excerpt: buildExcerpt(form.content),
        category: getCategoryForPostType(form.type),
        tags,
        featuredImage,
      };

      if (editingPostId) {
        if (!editingPost) {
          toast.error("The selected post could not be found.");
          resetForm();
          return;
        }

        await dispatch(
          updateTeamPost({
            post: editingPost,
            updates: {
              title: form.title,
              type: form.type,
              status: form.status,
              scheduledFor: form.scheduledFor || null,
              content: form.content,
              mediaIds: form.mediaIds,
              ...derivedPayload,
            },
          }),
        ).unwrap();
        toast.success("Post updated.");
      } else {
        await dispatch(
          createTeamPost({
            teamId,
            title: form.title,
            type: form.type,
            status: form.status,
            scheduledFor: form.scheduledFor || null,
            content: form.content,
            mediaIds: form.mediaIds,
            createdBy: currentUserId || null,
            authorName:
              currentUser?.displayName || currentUser?.name || "Media Team",
            authorEmail: currentUser?.email || "media@benzard.local",
            ...derivedPayload,
          }),
        ).unwrap();
        toast.success("Post created.");
      }

      resetForm();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to save the post.",
      );
    }
  };

  const handleDelete = async (post: TeamPostRecord) => {
    try {
      await dispatch(deleteTeamPost(post)).unwrap();
      toast.success("Post deleted.");
      if (editingPostId === post.id) {
        resetForm();
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to delete the post.",
      );
    }
  };

  const handleEdit = (post: TeamPostRecord) => {
    setEditingPostId(post.id);
    setForm({
      title: post.title,
      type: post.type,
      status: post.status,
      scheduledFor: post.scheduledFor?.slice(0, 16) || "",
      content: post.content,
      mediaIds: post.mediaIds,
    });
  };

  const handlePublishNow = async (postId: string) => {
    try {
      const targetPost = posts.find((post) => post.id === postId);

      if (!targetPost) {
        toast.error("The selected post could not be found.");
        return;
      }

      await dispatch(
        updateTeamPost({
          post: targetPost,
          updates: {
            status: "published",
          },
        }),
      ).unwrap();
      toast.success("Post published.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to publish the post.",
      );
    }
  };

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-[32px] p-6">
        <div className="flex items-center gap-2">
          <MdPostAdd className="text-sky-600" size={22} />
          <h2 className="text-2xl font-semibold text-secondary">Content Management</h2>
        </div>
        <p className="mt-2 text-sm leading-7 text-slate-500">
          Create blog posts, event posts, match reports, and announcements with rich text and attached media.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="rounded-[24px] border border-white/70 bg-white/80 p-4">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Title
            </span>
            <input
              type="text"
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({ ...current, title: event.target.value }))
              }
              className="mt-3 w-full bg-transparent text-sm text-slate-800 outline-none"
              placeholder="Matchday reaction and key moments"
            />
          </label>

          <label className="rounded-[24px] border border-white/70 bg-white/80 p-4">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Post Type
            </span>
            <select
              value={form.type}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  type: event.target.value as TeamPostRecord["type"],
                  status:
                    event.target.value === "event" || current.status !== "scheduled"
                      ? current.status
                      : "draft",
                  scheduledFor:
                    event.target.value === "event" ? current.scheduledFor : "",
                }))
              }
              className="mt-3 w-full bg-transparent text-sm text-slate-800 outline-none"
            >
              <option value="blog">Blog Post</option>
              <option value="event">Event Post</option>
              <option value="match_report">Match Report</option>
              <option value="announcement">Announcement</option>
            </select>
          </label>

          <label className="rounded-[24px] border border-white/70 bg-white/80 p-4">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Status
            </span>
            <select
              value={form.status}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  status: event.target.value as TeamPostRecord["status"],
                }))
              }
              className="mt-3 w-full bg-transparent text-sm text-slate-800 outline-none"
            >
              <option value="draft">Draft</option>
              {supportsScheduling ? <option value="scheduled">Scheduled</option> : null}
              <option value="published">Published</option>
            </select>
          </label>

          <label className="rounded-[24px] border border-white/70 bg-white/80 p-4">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Schedule
            </span>
            <input
              type="datetime-local"
              value={form.scheduledFor}
              onChange={(event) =>
                setForm((current) => ({ ...current, scheduledFor: event.target.value }))
              }
              className="mt-3 w-full bg-transparent text-sm text-slate-800 outline-none"
            />
          </label>
        </div>

        <div className="mt-6 rounded-[28px] border border-white/70 bg-white/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Content
          </p>
          <div className="mt-4">
            <RichTextEditor
              value={form.content}
              onChange={(value) =>
                setForm((current) => ({ ...current, content: value }))
              }
              minHeight={260}
              allowMedia={false}
            />
          </div>
        </div>

        <div className="mt-6 rounded-[28px] border border-white/70 bg-white/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Attach Media
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {mediaItems.length > 0 ? (
              mediaItems.map((item) => (
                <label
                  key={item.id}
                  className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3"
                >
                  <input
                    type="checkbox"
                    checked={form.mediaIds.includes(item.id)}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        mediaIds: event.target.checked
                          ? [...current.mediaIds, item.id]
                          : current.mediaIds.filter((mediaId) => mediaId !== item.id),
                      }))
                    }
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-secondary focus:ring-secondary"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {item.title || item.url}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.type} · {item.tags.join(", ") || "No tags"}
                    </p>
                  </div>
                </label>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-slate-300 bg-white/60 px-4 py-10 text-center text-sm text-slate-500 md:col-span-2 xl:col-span-3">
                Upload media first and it will become available for posts here.
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void handleSubmit()}
            className={dashboardPrimaryButtonClass}
          >
            <MdSave size={18} />
            {editingPostId ? "Update Post" : "Create Post"}
          </button>
          <button
            type="button"
            onClick={resetForm}
            className={dashboardNeutralButtonClass}
          >
            Reset
          </button>
        </div>
      </section>

      <section className="glass-panel overflow-hidden rounded-[32px]">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-white/70">
              <tr className="text-left text-xs uppercase tracking-[0.14em] text-slate-500">
                <th className="px-5 py-4 font-semibold">Title</th>
                <th className="px-5 py-4 font-semibold">Type</th>
                <th className="px-5 py-4 font-semibold">Status</th>
                <th className="px-5 py-4 font-semibold">Published</th>
                <th className="px-5 py-4 font-semibold">Views</th>
                <th className="px-5 py-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white/60">
              {sortedPosts.length > 0 ? (
                sortedPosts.map((post) => (
                  <tr key={`${post.sourceCollection || "posts"}:${post.id}`} className="hover:bg-slate-50/80">
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-slate-900">
                        {post.title}
                      </p>
                      {post.sourceCollection && post.sourceCollection !== "posts" ? (
                        <p className="mt-1 text-xs text-slate-500">
                          Imported from{" "}
                          {post.sourceCollection === "blogPosts"
                            ? "blog posts"
                            : "events"}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-700">
                      {post.type.replace("_", " ")}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-700">
                      {post.status}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-700">
                      {post.publishedAt || post.scheduledFor || "Not set"}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-700">
                      {post.views || 0}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(post)}
                          className={dashboardOutlineActionButtonClass}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void handlePublishNow(post.id)}
                          className={dashboardSoftActionButtonClass}
                        >
                          <MdOutlinePublish size={14} />
                          Publish
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(post)}
                          className={dashboardDangerActionButtonClass}
                        >
                          <MdDelete size={14} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-500">
                    No posts have been created yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
