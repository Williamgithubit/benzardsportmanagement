"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { toast } from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import { addComment } from "@/services/blogInteractions";
import { BlogComment as BlogCommentType } from "@/types/blog";

interface BlogCommentProps {
  postId: string;
  comments: BlogCommentType[];
  onCommentAdded: () => void;
}

const formatCommentDate = (createdAt: BlogCommentType["createdAt"]) =>
  format(
    createdAt instanceof Date ? createdAt : new Date(createdAt),
    "MMM d, yyyy"
  );

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase() || "")
    .join("");

const BlogComment: React.FC<BlogCommentProps> = ({
  postId,
  comments,
  onCommentAdded,
}) => {
  const { user } = useAuth();
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!user) {
      toast.error("Please sign in to comment");
      return;
    }

    if (!comment.trim()) {
      toast.error("Please enter a comment");
      return;
    }

    try {
      setIsSubmitting(true);
      await addComment(
        postId,
        user.uid,
        user.displayName || "Anonymous",
        user.email || "",
        comment.trim()
      );
      setComment("");
      onCommentAdded();
      toast.success("Comment added successfully");
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-panel rounded-[32px] p-6 sm:p-8">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h3 className="text-2xl font-semibold text-secondary">
            Comments ({comments.length})
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            Join the conversation and share your thoughts on the story.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mb-10 space-y-4">
        <textarea
          rows={4}
          placeholder={user ? "Write a comment..." : "Please sign in to comment"}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          disabled={!user || isSubmitting}
          className="w-full rounded-[28px] border border-slate-200 bg-white px-5 py-4 text-sm leading-7 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-secondary/20 focus:ring-2 focus:ring-secondary/10 disabled:cursor-not-allowed disabled:bg-slate-50"
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-500">
            {user
              ? "Your comment will appear immediately after posting."
              : "Sign in with your account to join the discussion."}
          </p>
          <button
            type="submit"
            disabled={!user || isSubmitting}
            className="rounded-2xl bg-secondary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-secondary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Posting..." : "Post Comment"}
          </button>
        </div>
      </form>

      <div className="space-y-5">
        {comments.map((commentItem) => (
          <div
            key={commentItem.id}
            className="rounded-[28px] border border-slate-200/80 bg-white/80 p-5 shadow-sm"
          >
            <div className="flex items-start gap-4">
              <div className="inline-flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-secondary text-sm font-semibold text-white">
                {getInitials(commentItem.userName)}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <span className="font-semibold text-slate-900">
                    {commentItem.userName}
                  </span>
                  <span className="text-sm text-slate-500">
                    {formatCommentDate(commentItem.createdAt)}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {commentItem.content}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BlogComment;
