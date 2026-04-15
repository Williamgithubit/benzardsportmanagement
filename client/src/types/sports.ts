export type PlayerSourceCollection = "players" | "athletes";
export type MatchStatus =
  | "scheduled"
  | "live"
  | "paused"
  | "completed"
  | "cancelled";
export type MatchTeamSide = "home" | "away";
export type MatchEventType =
  | "goal"
  | "assist"
  | "foul"
  | "yellow_card"
  | "red_card"
  | "substitution"
  | "rating"
  | "minutes_played";
export type AttendanceStatus = "present" | "absent" | "late" | "excused";
export type PerformanceTag = "In Form" | "Needs Improvement" | "Key Player";

export interface PlayerRecord {
  id: string;
  sourceCollection: PlayerSourceCollection;
  fullName: string;
  firstName?: string;
  lastName?: string;
  position?: string;
  sport?: string;
  level?: string;
  status?: string;
  scoutingStatus?: string;
  location?: string;
  county?: string;
  photoURL?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  baseStats: {
    goals: number;
    assists: number;
    matches: number;
    yellowCards: number;
    redCards: number;
    minutesPlayed: number;
  };
}

export interface MatchRecord {
  id: string;
  title: string;
  opponent: string;
  venue: string;
  competition?: string | null;
  scheduledAt?: string | null;
  status: MatchStatus;
  homeTeamName?: string | null;
  awayTeamName?: string | null;
  homeScore: number;
  awayScore: number;
  timerStartedAt?: string | null;
  timerStoppedAt?: string | null;
  timerAccumulatedSeconds?: number;
  notes?: string | null;
  isDataComplete?: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
  createdBy?: string | null;
}

export interface MatchEventRecord {
  id: string;
  matchId: string;
  type: MatchEventType;
  minute: number;
  teamSide: MatchTeamSide;
  playerId?: string | null;
  secondaryPlayerId?: string | null;
  note?: string | null;
  rating?: number | null;
  minutesPlayed?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  createdBy?: string | null;
}

export interface TrainingSessionRecord {
  id: string;
  title: string;
  sessionDate: string;
  startTime: string;
  endTime?: string | null;
  venue: string;
  gracePeriodMinutes: number;
  status: "scheduled" | "completed" | "cancelled";
  createdAt?: string | null;
  updatedAt?: string | null;
  createdBy?: string | null;
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  playerId: string;
  status: AttendanceStatus;
  arrivalTime?: string | null;
  manualArrivalTime?: string | null;
  autoDetectedLate: boolean;
  notes?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  markedBy?: string | null;
}

export interface PlayerAttendanceSummary {
  playerId: string;
  playerName: string;
  position?: string;
  sessionsTracked: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  attendanceRate: number;
  lastStatus?: AttendanceStatus;
}

export interface SessionAttendanceSummary {
  sessionId: string;
  title: string;
  sessionDate: string;
  venue: string;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  attendanceRate: number;
}

export interface AttendanceAnalytics {
  totalSessions: number;
  overallAttendanceRate: number;
  byPlayer: PlayerAttendanceSummary[];
  frequentAbsentees: PlayerAttendanceSummary[];
  mostConsistentPlayers: PlayerAttendanceSummary[];
  sessionBreakdown: SessionAttendanceSummary[];
}

export interface PlayerStatisticRow {
  playerId: string;
  playerName: string;
  position?: string;
  matchesPlayed: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  fouls: number;
  minutesPlayed: number;
  averageRating: number;
  attendanceRate: number;
  sourceCollection: PlayerSourceCollection;
}

export interface PlayerMatchContribution {
  matchId: string;
  matchTitle: string;
  scheduledAt?: string | null;
  result: "W" | "D" | "L";
  scoreline: string;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  fouls: number;
  minutesPlayed: number;
  rating: number;
}

export interface PerformanceTrendPoint {
  label: string;
  score: number;
  createdAt: string;
}

export interface PlayerPerformanceSummary extends PlayerStatisticRow {
  performanceScore: number;
  tags: PerformanceTag[];
  trend: number;
  recentForm: PerformanceTrendPoint[];
}

export interface PerformanceSnapshot {
  summaries: PlayerPerformanceSummary[];
  leaderboard: PlayerPerformanceSummary[];
  underperformers: PlayerPerformanceSummary[];
  averagePerformanceScore: number;
  generatedAt: string;
}

export interface TeamStandingRow {
  team: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface TeamStatisticsSnapshot {
  wins: number;
  draws: number;
  losses: number;
  goalsScored: number;
  goalsConceded: number;
  leagueTable: TeamStandingRow[];
}

export interface StatisticianOverviewMetrics {
  totalMatchesRecorded: number;
  totalPlayers: number;
  goalsRecorded: number;
  attendanceRate: number;
}

export const emptyAttendanceAnalytics: AttendanceAnalytics = {
  totalSessions: 0,
  overallAttendanceRate: 0,
  byPlayer: [],
  frequentAbsentees: [],
  mostConsistentPlayers: [],
  sessionBreakdown: [],
};

export const emptyPerformanceSnapshot: PerformanceSnapshot = {
  summaries: [],
  leaderboard: [],
  underperformers: [],
  averagePerformanceScore: 0,
  generatedAt: new Date(0).toISOString(),
};

export const emptyTeamStatistics: TeamStatisticsSnapshot = {
  wins: 0,
  draws: 0,
  losses: 0,
  goalsScored: 0,
  goalsConceded: 0,
  leagueTable: [],
};
