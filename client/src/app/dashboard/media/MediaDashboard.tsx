"use client";

import { useEffect, useState } from "react";
import MediaDashboardShell from "@/components/dashboard/MediaDashboardShell";
import {
  isMediaTab,
  type MediaTabId,
} from "@/components/dashboard/media-navigation";
import MediaOverviewPanel from "@/components/media/MediaOverviewPanel";
import MediaPostsPanel from "@/components/media/MediaPostsPanel";
import MediaLibraryPanel from "@/components/media/MediaLibraryPanel";
import MediaAnnouncementsPanel from "@/components/media/MediaAnnouncementsPanel";
import MediaNotificationsPanel from "@/components/media/MediaNotificationsPanel";
import MediaProfilePanel from "@/components/media/MediaProfilePanel";
import useMediaDashboardData from "@/hooks/useMediaDashboardData";
import { useAppSelector } from "@/store/store";

export default function MediaDashboard() {
  const [tab, setTab] = useState<MediaTabId>(() => {
    if (typeof window === "undefined") {
      return "dashboard";
    }

    const initialHash = window.location.hash.replace("#", "");
    return isMediaTab(initialHash) ? initialHash : "dashboard";
  });
  const currentUser = useAppSelector((state) => state.auth.user);
  const mediaData = useMediaDashboardData(tab !== "notifications" && tab !== "profile");

  useEffect(() => {
    const syncFromHash = () => {
      const nextHash = window.location.hash.replace("#", "");
      if (isMediaTab(nextHash)) {
        setTab(nextHash);
      }
    };

    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);

    return () => {
      window.removeEventListener("hashchange", syncFromHash);
    };
  }, []);

  useEffect(() => {
    const nextUrl =
      tab === "dashboard" ? "/dashboard/media" : `/dashboard/media#${tab}`;
    window.history.replaceState(null, "", nextUrl);
  }, [tab]);

  return (
    <MediaDashboardShell activeTab={tab} onTabChange={setTab}>
      {mediaData.error && tab !== "notifications" && tab !== "profile" ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
          {mediaData.error}
        </div>
      ) : null}

      {tab === "dashboard" ? (
        <MediaOverviewPanel
          analytics={mediaData.analytics}
          posts={mediaData.posts}
          media={mediaData.media}
          announcements={mediaData.announcements}
          players={mediaData.players}
        />
      ) : null}

      {tab === "posts" && mediaData.teamContext?.teamId ? (
        <MediaPostsPanel
          teamId={mediaData.teamContext.teamId}
          currentUserId={currentUser?.uid}
          posts={mediaData.posts}
          mediaItems={mediaData.media}
        />
      ) : null}

      {tab === "media-library" && mediaData.teamContext?.teamId ? (
        <MediaLibraryPanel
          teamId={mediaData.teamContext.teamId}
          currentUserId={currentUser?.uid}
          media={mediaData.media}
          players={mediaData.players}
          matches={mediaData.matches}
        />
      ) : null}

      {tab === "announcements" && mediaData.teamContext?.teamId ? (
        <MediaAnnouncementsPanel
          teamId={mediaData.teamContext.teamId}
          currentUserId={currentUser?.uid}
          announcements={mediaData.announcements}
        />
      ) : null}

      {tab === "notifications" ? <MediaNotificationsPanel /> : null}
      {tab === "profile" ? <MediaProfilePanel /> : null}
    </MediaDashboardShell>
  );
}
