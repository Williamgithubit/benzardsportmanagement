import { adminApiFetch } from "@/services/adminApi";

export interface UserGrowthData {
  date: string;
  totalUsers: number;
  newUsers: number;
}

export interface TaskCompletionData {
  date: string;
  completed: number;
  pending: number;
  overdue: number;
}

export interface AnalyticsData {
  totalUsers: number;
  activeUsers: number;
  totalPrograms: number;
  activePrograms: number;
  totalEvents: number;
  upcomingEvents: number;
  completionRate: number;
  completedTasks: number;
  totalTasks: number;
  userGrowth: UserGrowthData[];
  taskCompletion: TaskCompletionData[];
  lastUpdated: Date;
}

export interface ProgramPerformance {
  id: string;
  name: string;
  status: string;
  startDate: Date;
  endDate: Date;
  enrollments: number;
  completions: number;
  completionRate: number;
  rating: number;
  lastUpdated: Date;
}

export interface UserEngagementMetrics {
  weeklyEngagement: number;
  monthlyEngagement: number;
  activeLastWeek: number;
  activeLastMonth: number;
  averageSessionDuration: number;
  totalSessions: number;
  lastUpdated: Date;
}

export interface ReportsData {
  analytics: AnalyticsData;
  engagementMetrics: UserEngagementMetrics;
  programPerformance: ProgramPerformance[];
}

interface ReportsResponse {
  success: boolean;
  analytics: Omit<AnalyticsData, "lastUpdated"> & { lastUpdated: string };
  engagementMetrics: Omit<UserEngagementMetrics, "lastUpdated"> & {
    lastUpdated: string;
  };
  programPerformance: Array<
    Omit<ProgramPerformance, "startDate" | "endDate" | "lastUpdated"> & {
      startDate: string;
      endDate: string;
      lastUpdated: string;
    }
  >;
}

const toAnalyticsData = (
  analytics: ReportsResponse["analytics"],
): AnalyticsData => ({
  ...analytics,
  lastUpdated: new Date(analytics.lastUpdated),
});

const toEngagementMetrics = (
  metrics: ReportsResponse["engagementMetrics"],
): UserEngagementMetrics => ({
  ...metrics,
  lastUpdated: new Date(metrics.lastUpdated),
});

const toProgramPerformance = (
  programs: ReportsResponse["programPerformance"],
): ProgramPerformance[] =>
  programs.map((program) => ({
    ...program,
    startDate: new Date(program.startDate),
    endDate: new Date(program.endDate),
    lastUpdated: new Date(program.lastUpdated),
  }));

export const getReportsData = async (): Promise<ReportsData> => {
  const response = await adminApiFetch<ReportsResponse>("/api/admin/reports");

  return {
    analytics: toAnalyticsData(response.analytics),
    engagementMetrics: toEngagementMetrics(response.engagementMetrics),
    programPerformance: toProgramPerformance(response.programPerformance),
  };
};

export const getAnalyticsData = async (): Promise<AnalyticsData> =>
  (await getReportsData()).analytics;

export const getUserEngagementMetrics =
  async (): Promise<UserEngagementMetrics> =>
    (await getReportsData()).engagementMetrics;

export const getProgramPerformanceMetrics =
  async (): Promise<ProgramPerformance[]> =>
    (await getReportsData()).programPerformance;
