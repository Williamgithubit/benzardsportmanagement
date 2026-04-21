export type TeamPostType =
  | "blog"
  | "event"
  | "match_report"
  | "announcement";

export type TeamPostStatus = "draft" | "scheduled" | "published";
export type TeamPostSource = "posts" | "blogPosts" | "events";

export interface TeamMediaRecord {
  id: string;
  teamId: string;
  type: "image" | "video";
  url: string;
  publicId?: string | null;
  title?: string | null;
  tags: string[];
  matchId?: string | null;
  playerId?: string | null;
  eventId?: string | null;
  uploadedBy?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface TeamPostRecord {
  id: string;
  teamId: string;
  sourceCollection?: TeamPostSource;
  sourceId?: string;
  type: TeamPostType;
  status: TeamPostStatus;
  title: string;
  content: string;
  mediaIds: string[];
  publishedAt?: string | null;
  scheduledFor?: string | null;
  createdBy?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  views?: number;
}

export interface TeamAnnouncementRecord {
  id: string;
  teamId: string;
  title: string;
  content: string;
  audiences: Array<"players" | "staff">;
  createdBy?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface MediaDashboardAnalytics {
  totalPosts: number;
  scheduledPosts: number;
  totalMedia: number;
  totalAnnouncements: number;
  totalViews: number;
}
