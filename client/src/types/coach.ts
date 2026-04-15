import type {
  AttendanceAnalytics,
  AttendanceRecord,
  MatchRecord,
  PlayerPerformanceSummary,
  PlayerRecord,
  TrainingSessionRecord,
} from "@/types/sports";

export type PlayerAvailabilityStatus = "fit" | "injured" | "suspended";

export interface PlayerStatusRecord {
  id: string;
  teamId: string;
  playerId: string;
  status: PlayerAvailabilityStatus;
  reason?: string | null;
  returnDate?: string | null;
  availabilityNote?: string | null;
  createdBy?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface MatchSquadRecord {
  id: string;
  teamId: string;
  matchId: string;
  startingXI: string[];
  substitutes: string[];
  captainId?: string | null;
  notes?: string | null;
  createdBy?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface TacticalBoardSlot {
  playerId?: string | null;
  x: number;
  y: number;
  label: string;
}

export interface FormationRecord {
  id: string;
  teamId: string;
  name: string;
  shape: string;
  matchId?: string | null;
  slots: TacticalBoardSlot[];
  notes?: string | null;
  createdBy?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface TrainingPlanRecord {
  id: string;
  teamId: string;
  sessionId?: string | null;
  title: string;
  description: string;
  focusArea: string;
  playerEffort?: number | null;
  coachRating?: number | null;
  createdBy?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface MatchPreparationRecord {
  id: string;
  teamId: string;
  matchId: string;
  squadReady: boolean;
  keyPlayers: string[];
  opponentNotes: string;
  checklistNotes?: string | null;
  createdBy?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface CoachAlert {
  id: string;
  type: "injury" | "absence" | "performance" | "availability";
  title: string;
  message: string;
  playerId?: string;
  tone: "info" | "warning" | "error";
}

export interface CoachOverviewMetrics {
  totalPlayers: number;
  availablePlayers: number;
  upcomingMatches: number;
  teamPerformanceScore: number;
}

export interface CoachDashboardSnapshot {
  overview: CoachOverviewMetrics;
  players: PlayerRecord[];
  matches: MatchRecord[];
  attendanceAnalytics: AttendanceAnalytics;
  attendanceRecords: AttendanceRecord[];
  sessions: TrainingSessionRecord[];
  performance: PlayerPerformanceSummary[];
  underperformers: PlayerPerformanceSummary[];
  squads: MatchSquadRecord[];
  formations: FormationRecord[];
  trainingPlans: TrainingPlanRecord[];
  playerStatuses: PlayerStatusRecord[];
  preparations: MatchPreparationRecord[];
  alerts: CoachAlert[];
}
