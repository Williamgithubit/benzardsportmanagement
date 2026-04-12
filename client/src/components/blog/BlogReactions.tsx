"use client";

import React, { useEffect, useState } from "react";
import {
  FaHeart,
  FaRegHeart,
  FaRegStar,
  FaRegThumbsUp,
  FaStar,
  FaThumbsUp,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  addReaction,
  getUserReaction,
  removeReaction,
} from "@/services/blogInteractions";

interface BlogReactionsProps {
  postId: string;
  reactionCount: number;
  onReactionChange: () => void;
}

const reactionButtonStyles = {
  celebrate: "border-amber-200 bg-amber-50 text-amber-600",
  like: "border-sky-200 bg-sky-50 text-sky-600",
  love: "border-rose-200 bg-rose-50 text-rose-600",
};

const BlogReactions: React.FC<BlogReactionsProps> = ({
  postId,
  reactionCount,
  onReactionChange,
}) => {
  const { user } = useAuth();
  const [userReaction, setUserReaction] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      void loadUserReaction();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, postId]);

  const loadUserReaction = async () => {
    if (!user) return;

    try {
      const reaction = await getUserReaction(postId, user.uid);
      setUserReaction(reaction?.type || null);
    } catch (error) {
      console.error("Error loading user reaction:", error);
    }
  };

  const handleReaction = async (type: "like" | "love" | "celebrate") => {
    if (!user) {
      toast.error("Please sign in to react");
      return;
    }

    try {
      setIsLoading(true);

      if (userReaction === type) {
        await removeReaction(postId, user.uid);
        setUserReaction(null);
      } else {
        await addReaction(postId, user.uid, user.displayName || "Anonymous", type);
        setUserReaction(type);
      }

      onReactionChange();
    } catch (error) {
      console.error("Error handling reaction:", error);
      toast.error("Failed to update reaction");
    } finally {
      setIsLoading(false);
    }
  };

  const reactionButtons = [
    {
      type: "like" as const,
      icon: userReaction === "like" ? <FaThumbsUp /> : <FaRegThumbsUp />,
      label: userReaction === "like" ? "Unlike" : "Like",
    },
    {
      type: "love" as const,
      icon: userReaction === "love" ? <FaHeart /> : <FaRegHeart />,
      label: userReaction === "love" ? "Remove Love" : "Love",
    },
    {
      type: "celebrate" as const,
      icon: userReaction === "celebrate" ? <FaStar /> : <FaRegStar />,
      label: userReaction === "celebrate" ? "Remove Celebrate" : "Celebrate",
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3">
      {reactionButtons.map((button) => {
        const isActive = userReaction === button.type;

        return (
          <button
            key={button.type}
            type="button"
            title={button.label}
            onClick={() => void handleReaction(button.type)}
            disabled={isLoading}
            className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl border text-base transition ${
              isActive
                ? reactionButtonStyles[button.type]
                : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700"
            } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {button.icon}
          </button>
        );
      })}

      <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600">
        {reactionCount} reaction{reactionCount === 1 ? "" : "s"}
      </span>
    </div>
  );
};

export default BlogReactions;
