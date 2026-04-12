import { adminApiFetch } from "@/services/adminApi";
import type { Athlete } from "@/types/athlete";
import type { BlogPost } from "@/types/blog";
import type { Event } from "@/services/eventService";

export interface DashboardStats {
  totalUsers: number;
  activePrograms: number;
  upcomingEvents: number;
  tasksCompleted: number;
  totalCertificates: number;
  totalAdmissions: number;
  totalBlogPosts: number;
  totalAthletes: number;
  scoutedAthletes: number;
  activeTrainingPrograms: number;
  recentRegistrations: number;
  contactSubmissions: number;
}

export interface RecentActivity {
  id: string;
  type:
    | "user_registered"
    | "program_created"
    | "event_created"
    | "task_completed"
    | "athlete_added"
    | "training_completed"
    | "contact_received"
    | "blog_published";
  description: string;
  timestamp: string;
  user?: string;
}

export interface RegionalData {
  name: string;
  athletes: number;
  events: number;
}

export interface LevelData {
  name: string;
  value: number;
  color: string;
}

export interface GrowthData {
  month: string;
  athletes: number;
  events: number;
}

export interface AnalyticsMetrics {
  eventAttendanceRate: number;
  athletesScouted: number;
  trainingCompletion: number;
  activePrograms: number;
}

interface DashboardResponse {
  success: boolean;
  stats: DashboardStats;
  recentActivity: RecentActivity[];
}

interface AthletesResponse {
  success: boolean;
  athletes: Athlete[];
}

interface SerializedEvent
  extends Omit<Event, "startDate" | "endDate" | "createdAt" | "updatedAt"> {
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

interface EventsResponse {
  success: boolean;
  events: SerializedEvent[];
  stats: {
    total: number;
    upcoming: number;
    ongoing: number;
    completed: number;
    cancelled: number;
    totalRegistrations: number;
    totalCapacity: number;
  };
}

interface BlogResponse {
  success: boolean;
  posts: BlogPost[];
  categories: string[];
  tags: string[];
}

interface AnalyticsResponse {
  success: boolean;
  regionalData: RegionalData[];
  levelData: LevelData[];
  growthData: GrowthData[];
  metrics: AnalyticsMetrics;
}

const toEvent = (event: SerializedEvent): Event => ({
  ...event,
  startDate: new Date(event.startDate),
  endDate: new Date(event.endDate),
  createdAt: new Date(event.createdAt),
  updatedAt: new Date(event.updatedAt),
});

export async function fetchAdminDashboardData(limitCount = 10) {
  const encodedLimit = encodeURIComponent(limitCount.toString());
  const response = await adminApiFetch<DashboardResponse>(
    `/api/admin/dashboard?limit=${encodedLimit}`
  );

  return {
    stats: response.stats,
    recentActivity: response.recentActivity,
  };
}

export async function fetchAdminAthletes() {
  const response = await adminApiFetch<AthletesResponse>("/api/admin/athletes");
  return response.athletes;
}

export async function fetchAdminEvents() {
  const response = await adminApiFetch<EventsResponse>("/api/admin/events");

  return {
    events: response.events.map(toEvent),
    stats: response.stats,
  };
}

export async function fetchAdminBlogData() {
  const response = await adminApiFetch<BlogResponse>("/api/admin/blog-posts");

  return {
    posts: response.posts,
    categories: response.categories,
    tags: response.tags,
  };
}

export async function fetchAdminAnalytics() {
  const response = await adminApiFetch<AnalyticsResponse>("/api/admin/analytics");

  return {
    regionalData: response.regionalData,
    levelData: response.levelData,
    growthData: response.growthData,
    metrics: response.metrics,
  };
}

export const getTimeAgo = (timestamp: string): string => {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) {
    return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  }
  if (diffInSeconds < 86400) {
    return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  }
  if (diffInSeconds < 604800) {
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  }

  return time.toLocaleDateString();
};
