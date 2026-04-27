import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "@/services/firebase";
import { NotificationService } from "@/services/notificationService";
import type {
  CoachAlert,
  FormationRecord,
  MatchPreparationRecord,
  MatchSquadRecord,
  PlayerStatusRecord,
  TrainingPlanRecord,
} from "@/types/coach";
import type {
  AttendanceAnalytics,
  AttendanceRecord,
  MatchEventRecord,
  MatchRecord,
  PlayerPerformanceSummary,
  PlayerRecord,
  TrainingSessionRecord,
} from "@/types/sports";
import {
  buildAttendanceAnalytics,
} from "@/services/attendanceService";
import { buildPerformanceSnapshot } from "@/services/statisticianService";
import {
  sortByNewest,
  toIsoString,
  type FirestoreDateValue,
} from "@/utils/firestore";

const PLAYERS_COLLECTION = "players";
const ATHLETES_COLLECTION = "athletes";
const MATCHES_COLLECTION = "matches";
const MATCH_EVENTS_COLLECTION = "matchEvents";
const TRAINING_SESSIONS_COLLECTION = "trainingSessions";
const ATTENDANCE_COLLECTION = "attendance";
const MATCH_SQUADS_COLLECTION = "matchSquads";
const FORMATIONS_COLLECTION = "formations";
const TRAINING_PLANS_COLLECTION = "trainingPlans";
const PLAYER_STATUSES_COLLECTION = "playerStatuses";
const MATCH_PREPARATIONS_COLLECTION = "matchPreparations";

const normalizeTeamId = (data: Record<string, unknown>) =>
  typeof data.teamId === "string" && data.teamId.trim()
    ? data.teamId.trim()
    : null;

const legacyMatchesTeam = (
  data: Record<string, unknown>,
  teamId: string | null,
) => {
  if (!teamId) {
    return true;
  }

  const resolvedTeamId = normalizeTeamId(data);
  return !resolvedTeamId || resolvedTeamId === teamId;
};

const subscribeToLegacyAwareCollection = <T extends { id: string }>(
  collectionName: string,
  teamId: string | null,
  normalize: (id: string, data: Record<string, unknown>) => T,
  callback: (items: T[]) => void,
  onError?: (error: unknown) => void,
  options: {
    sort?: (left: T, right: T) => number;
    limit?: number;
  } = {},
) => {
  if (!teamId) {
    return onSnapshot(
      collection(db, collectionName),
      (snapshot) => {
        const items = snapshot.docs
          .map((entry) => ({
            id: entry.id,
            data: entry.data() as Record<string, unknown>,
          }))
          .filter((entry) => legacyMatchesTeam(entry.data, teamId))
          .map((entry) => normalize(entry.id, entry.data));

        const sortedItems = options.sort ? [...items].sort(options.sort) : items;
        callback(
          typeof options.limit === "number"
            ? sortedItems.slice(0, options.limit)
            : sortedItems,
        );
      },
      onError,
    );
  }

  let scopedItems: T[] = [];
  let legacyItems: T[] = [];

  const publish = () => {
    const scopedIds = new Set(scopedItems.map((item) => item.id));
    const mergedItems = [
      ...scopedItems,
      ...legacyItems.filter((item) => !scopedIds.has(item.id)),
    ];
    const sortedItems = options.sort
      ? [...mergedItems].sort(options.sort)
      : mergedItems;

    callback(
      typeof options.limit === "number"
        ? sortedItems.slice(0, options.limit)
        : sortedItems,
    );
  };

  const unsubscribeScoped = onSnapshot(
    query(collection(db, collectionName), where("teamId", "==", teamId)),
    (snapshot) => {
      scopedItems = snapshot.docs
        .map((entry) => ({
          id: entry.id,
          data: entry.data() as Record<string, unknown>,
        }))
        .filter((entry) => legacyMatchesTeam(entry.data, teamId))
        .map((entry) => normalize(entry.id, entry.data));
      publish();
    },
    onError,
  );

  const unsubscribeLegacy = onSnapshot(
    query(collection(db, collectionName), where("teamId", "==", null)),
    (snapshot) => {
      legacyItems = snapshot.docs
        .map((entry) => ({
          id: entry.id,
          data: entry.data() as Record<string, unknown>,
        }))
        .filter((entry) => legacyMatchesTeam(entry.data, teamId))
        .map((entry) => normalize(entry.id, entry.data));
      publish();
    },
    onError,
  );

  return () => {
    unsubscribeScoped();
    unsubscribeLegacy();
  };
};

const teamCollectionWithFilter = (
  collectionName: string,
  teamId: string | null,
  field: string,
  value: string,
) =>
  teamId
    ? query(
        collection(db, collectionName),
        where("teamId", "==", teamId),
        where(field, "==", value),
      )
    : query(collection(db, collectionName), where(field, "==", value));

const toNumber = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

const normalizePlayer = (
  id: string,
  data: Record<string, unknown>,
  sourceCollection: PlayerRecord["sourceCollection"],
): PlayerRecord => {
  const stats =
    data.stats && typeof data.stats === "object"
      ? (data.stats as Record<string, unknown>)
      : {};

  const fullName =
    (typeof data.name === "string" && data.name.trim()) ||
    [
      typeof data.firstName === "string" ? data.firstName : "",
      typeof data.lastName === "string" ? data.lastName : "",
    ]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    "Unnamed player";

  return {
    id,
    teamId: normalizeTeamId(data),
    sourceCollection,
    fullName,
    firstName: typeof data.firstName === "string" ? data.firstName : undefined,
    lastName: typeof data.lastName === "string" ? data.lastName : undefined,
    position: typeof data.position === "string" ? data.position : undefined,
    sport: typeof data.sport === "string" ? data.sport : undefined,
    level: typeof data.level === "string" ? data.level : undefined,
    status: typeof data.status === "string" ? data.status : undefined,
    scoutingStatus:
      typeof data.scoutingStatus === "string" ? data.scoutingStatus : undefined,
    location: typeof data.location === "string" ? data.location : undefined,
    county: typeof data.county === "string" ? data.county : undefined,
    photoURL:
      typeof data.photoURL === "string"
        ? data.photoURL
        : typeof data.avatar === "string"
          ? data.avatar
          : null,
    createdAt: toIsoString(data.createdAt as FirestoreDateValue),
    updatedAt: toIsoString(data.updatedAt as FirestoreDateValue),
    baseStats: {
      goals: toNumber(stats.goals),
      assists: toNumber(stats.assists),
      matches: toNumber(stats.matches),
      yellowCards: toNumber(stats.yellowCards),
      redCards: toNumber(stats.redCards),
      minutesPlayed: toNumber(stats.minutesPlayed),
    },
  };
};

const normalizeMatch = (
  id: string,
  data: Record<string, unknown>,
): MatchRecord => ({
  id,
  teamId: typeof data.teamId === "string" ? data.teamId : null,
  title:
    (typeof data.title === "string" && data.title.trim()) || "Untitled Match",
  opponent:
    (typeof data.opponent === "string" && data.opponent.trim()) ||
    "Unknown Opponent",
  venue: (typeof data.venue === "string" && data.venue.trim()) || "TBD",
  competition: typeof data.competition === "string" ? data.competition : null,
  scheduledAt: toIsoString(data.scheduledAt as FirestoreDateValue),
  status:
    data.status === "live" ||
    data.status === "paused" ||
    data.status === "completed" ||
    data.status === "cancelled"
      ? data.status
      : "scheduled",
  homeTeamName:
    typeof data.homeTeamName === "string" ? data.homeTeamName : "Home Team",
  awayTeamName:
    typeof data.awayTeamName === "string" ? data.awayTeamName : null,
  homeScore: toNumber(data.homeScore),
  awayScore: toNumber(data.awayScore),
  timerStartedAt: toIsoString(data.timerStartedAt as FirestoreDateValue),
  timerStoppedAt: toIsoString(data.timerStoppedAt as FirestoreDateValue),
  timerAccumulatedSeconds:
    typeof data.timerAccumulatedSeconds === "number"
      ? data.timerAccumulatedSeconds
      : 0,
  notes: typeof data.notes === "string" ? data.notes : null,
  isDataComplete:
    typeof data.isDataComplete === "boolean" ? data.isDataComplete : undefined,
  createdAt: toIsoString(data.createdAt as FirestoreDateValue),
  updatedAt: toIsoString(data.updatedAt as FirestoreDateValue),
  createdBy: typeof data.createdBy === "string" ? data.createdBy : null,
});

const normalizeMatchEvent = (
  id: string,
  data: Record<string, unknown>,
): MatchEventRecord => ({
  id,
  teamId: typeof data.teamId === "string" ? data.teamId : null,
  matchId: typeof data.matchId === "string" ? data.matchId : "",
  type:
    data.type === "goal" ||
    data.type === "assist" ||
    data.type === "foul" ||
    data.type === "yellow_card" ||
    data.type === "red_card" ||
    data.type === "substitution" ||
    data.type === "rating" ||
    data.type === "minutes_played"
      ? data.type
      : "foul",
  minute: toNumber(data.minute),
  teamSide: data.teamSide === "away" ? "away" : "home",
  playerId: typeof data.playerId === "string" ? data.playerId : null,
  secondaryPlayerId:
    typeof data.secondaryPlayerId === "string" ? data.secondaryPlayerId : null,
  note: typeof data.note === "string" ? data.note : null,
  rating: typeof data.rating === "number" ? data.rating : null,
  minutesPlayed:
    typeof data.minutesPlayed === "number" ? data.minutesPlayed : null,
  createdAt: toIsoString(data.createdAt as FirestoreDateValue),
  updatedAt: toIsoString(data.updatedAt as FirestoreDateValue),
  createdBy: typeof data.createdBy === "string" ? data.createdBy : null,
});

const normalizeTrainingSession = (
  id: string,
  data: Record<string, unknown>,
): TrainingSessionRecord => ({
  id,
  teamId: typeof data.teamId === "string" ? data.teamId : null,
  title:
    (typeof data.title === "string" && data.title.trim()) || "Training Session",
  sessionDate:
    (typeof data.sessionDate === "string" && data.sessionDate) ||
    new Date().toISOString().slice(0, 10),
  startTime: (typeof data.startTime === "string" && data.startTime) || "09:00",
  endTime: typeof data.endTime === "string" ? data.endTime : null,
  venue: (typeof data.venue === "string" && data.venue.trim()) || "TBD",
  gracePeriodMinutes:
    typeof data.gracePeriodMinutes === "number" ? data.gracePeriodMinutes : 10,
  status:
    data.status === "completed" || data.status === "cancelled"
      ? data.status
      : "scheduled",
  createdAt: toIsoString(data.createdAt as FirestoreDateValue),
  updatedAt: toIsoString(data.updatedAt as FirestoreDateValue),
  createdBy: typeof data.createdBy === "string" ? data.createdBy : null,
});

const normalizeAttendanceRecord = (
  id: string,
  data: Record<string, unknown>,
): AttendanceRecord => ({
  id,
  teamId: typeof data.teamId === "string" ? data.teamId : null,
  sessionId: typeof data.sessionId === "string" ? data.sessionId : "",
  playerId: typeof data.playerId === "string" ? data.playerId : "",
  status:
    data.status === "present" ||
    data.status === "absent" ||
    data.status === "late" ||
    data.status === "excused"
      ? data.status
      : "absent",
  arrivalTime: toIsoString(data.arrivalTime as FirestoreDateValue),
  manualArrivalTime: toIsoString(data.manualArrivalTime as FirestoreDateValue),
  autoDetectedLate: Boolean(data.autoDetectedLate),
  notes: typeof data.notes === "string" ? data.notes : null,
  createdAt: toIsoString(data.createdAt as FirestoreDateValue),
  updatedAt: toIsoString(data.updatedAt as FirestoreDateValue),
  markedBy: typeof data.markedBy === "string" ? data.markedBy : null,
});

const normalizePlayerStatus = (
  id: string,
  data: Record<string, unknown>,
): PlayerStatusRecord => ({
  id,
  teamId: typeof data.teamId === "string" ? data.teamId : "",
  playerId: typeof data.playerId === "string" ? data.playerId : "",
  status:
    data.status === "injured" || data.status === "suspended"
      ? data.status
      : "fit",
  reason: typeof data.reason === "string" ? data.reason : null,
  returnDate: toIsoString(data.returnDate as FirestoreDateValue),
  availabilityNote:
    typeof data.availabilityNote === "string" ? data.availabilityNote : null,
  createdBy: typeof data.createdBy === "string" ? data.createdBy : null,
  createdAt: toIsoString(data.createdAt as FirestoreDateValue),
  updatedAt: toIsoString(data.updatedAt as FirestoreDateValue),
});

const normalizeMatchSquad = (
  id: string,
  data: Record<string, unknown>,
): MatchSquadRecord => ({
  id,
  teamId: typeof data.teamId === "string" ? data.teamId : "",
  matchId: typeof data.matchId === "string" ? data.matchId : "",
  startingXI: Array.isArray(data.startingXI)
    ? data.startingXI.filter(
        (playerId): playerId is string =>
          typeof playerId === "string" && Boolean(playerId.trim()),
      )
    : [],
  substitutes: Array.isArray(data.substitutes)
    ? data.substitutes.filter(
        (playerId): playerId is string =>
          typeof playerId === "string" && Boolean(playerId.trim()),
      )
    : [],
  captainId: typeof data.captainId === "string" ? data.captainId : null,
  notes: typeof data.notes === "string" ? data.notes : null,
  createdBy: typeof data.createdBy === "string" ? data.createdBy : null,
  createdAt: toIsoString(data.createdAt as FirestoreDateValue),
  updatedAt: toIsoString(data.updatedAt as FirestoreDateValue),
});

const normalizeFormation = (
  id: string,
  data: Record<string, unknown>,
): FormationRecord => ({
  id,
  teamId: typeof data.teamId === "string" ? data.teamId : "",
  name:
    (typeof data.name === "string" && data.name.trim()) || "Saved formation",
  shape: (typeof data.shape === "string" && data.shape.trim()) || "4-3-3",
  matchId: typeof data.matchId === "string" ? data.matchId : null,
  slots: Array.isArray(data.slots)
    ? data.slots
        .map((slot) => {
          if (!slot || typeof slot !== "object") {
            return null;
          }

          const typedSlot = slot as Record<string, unknown>;
          return {
            playerId:
              typeof typedSlot.playerId === "string" ? typedSlot.playerId : null,
            x: typeof typedSlot.x === "number" ? typedSlot.x : 0,
            y: typeof typedSlot.y === "number" ? typedSlot.y : 0,
            label:
              typeof typedSlot.label === "string" ? typedSlot.label : "Slot",
          };
        })
        .filter(Boolean) as FormationRecord["slots"]
    : [],
  notes: typeof data.notes === "string" ? data.notes : null,
  createdBy: typeof data.createdBy === "string" ? data.createdBy : null,
  createdAt: toIsoString(data.createdAt as FirestoreDateValue),
  updatedAt: toIsoString(data.updatedAt as FirestoreDateValue),
});

const normalizeTrainingPlan = (
  id: string,
  data: Record<string, unknown>,
): TrainingPlanRecord => ({
  id,
  teamId: typeof data.teamId === "string" ? data.teamId : "",
  sessionId: typeof data.sessionId === "string" ? data.sessionId : null,
  title:
    (typeof data.title === "string" && data.title.trim()) || "Training plan",
  description:
    (typeof data.description === "string" && data.description.trim()) || "",
  focusArea:
    (typeof data.focusArea === "string" && data.focusArea.trim()) ||
    "General",
  playerEffort:
    typeof data.playerEffort === "number" ? data.playerEffort : null,
  coachRating: typeof data.coachRating === "number" ? data.coachRating : null,
  createdBy: typeof data.createdBy === "string" ? data.createdBy : null,
  createdAt: toIsoString(data.createdAt as FirestoreDateValue),
  updatedAt: toIsoString(data.updatedAt as FirestoreDateValue),
});

const normalizePreparation = (
  id: string,
  data: Record<string, unknown>,
): MatchPreparationRecord => ({
  id,
  teamId: typeof data.teamId === "string" ? data.teamId : "",
  matchId: typeof data.matchId === "string" ? data.matchId : "",
  squadReady: Boolean(data.squadReady),
  keyPlayers: Array.isArray(data.keyPlayers)
    ? data.keyPlayers.filter(
        (playerId): playerId is string =>
          typeof playerId === "string" && Boolean(playerId.trim()),
      )
    : [],
  opponentNotes:
    (typeof data.opponentNotes === "string" && data.opponentNotes.trim()) || "",
  checklistNotes:
    typeof data.checklistNotes === "string" ? data.checklistNotes : null,
  createdBy: typeof data.createdBy === "string" ? data.createdBy : null,
  createdAt: toIsoString(data.createdAt as FirestoreDateValue),
  updatedAt: toIsoString(data.updatedAt as FirestoreDateValue),
});

export const buildCoachAlerts = (
  players: PlayerRecord[],
  statuses: PlayerStatusRecord[],
  performanceSummaries: PlayerPerformanceSummary[],
  attendanceAnalytics: AttendanceAnalytics,
): CoachAlert[] => {
  const playerNameMap = new Map(players.map((player) => [player.id, player.fullName]));
  const alerts: CoachAlert[] = [];

  statuses
    .filter((status) => status.status !== "fit")
    .forEach((status) => {
      const playerName = playerNameMap.get(status.playerId) || "Player";
      alerts.push({
        id: `status-${status.playerId}`,
        type: status.status === "injured" ? "injury" : "availability",
        title:
          status.status === "injured"
            ? "Player injured"
            : "Player unavailable",
        message: `${playerName} is currently ${status.status}.`,
        playerId: status.playerId,
        tone: "error",
      });
    });

  attendanceAnalytics.frequentAbsentees.slice(0, 3).forEach((summary) => {
    alerts.push({
      id: `absence-${summary.playerId}`,
      type: "absence",
      title: "Attendance risk",
      message: `${summary.playerName} has ${summary.absentCount} recent absences.`,
      playerId: summary.playerId,
      tone: "warning",
    });
  });

  performanceSummaries
    .filter((summary) => summary.performanceScore < 45 || summary.attendanceRate < 60)
    .slice(0, 3)
    .forEach((summary) => {
      alerts.push({
        id: `performance-${summary.playerId}`,
        type: "performance",
        title: "Needs improvement",
        message: `${summary.playerName} is trending below the expected performance threshold.`,
        playerId: summary.playerId,
        tone: "warning",
      });
    });

  return alerts.slice(0, 8);
};

export const CoachService = {
  subscribeToPlayers(teamId: string | null, callback: (players: PlayerRecord[]) => void, onError?: (error: unknown) => void) {
    let playerDocs: PlayerRecord[] = [];
    let legacyPlayerDocs: PlayerRecord[] = [];
    let athleteDocs: PlayerRecord[] = [];
    let legacyAthleteDocs: PlayerRecord[] = [];

    const publish = () => {
      const seenIds = new Set<string>();
      callback(
        [...playerDocs, ...legacyPlayerDocs, ...athleteDocs, ...legacyAthleteDocs]
          .filter((player) => {
            const key = `${player.sourceCollection}:${player.id}`;
            if (seenIds.has(key)) {
              return false;
            }

            seenIds.add(key);
            return true;
          })
          .sort((left, right) => left.fullName.localeCompare(right.fullName)),
      );
    };

    const unsubscribePlayers = subscribeToLegacyAwareCollection(
      PLAYERS_COLLECTION,
      teamId,
      (id, data) =>
        normalizePlayer(
          id,
          data,
          "players",
        ),
      (items) => {
        playerDocs = items;
        publish();
      },
      (error) => {
        playerDocs = [];
        publish();
        onError?.(error);
      },
    );

    const unsubscribeAthletes = subscribeToLegacyAwareCollection(
      ATHLETES_COLLECTION,
      teamId,
      (id, data) =>
        normalizePlayer(
          id,
          data,
          "athletes",
        ),
      (items) => {
        athleteDocs = items;
        publish();
      },
      (error) => {
        athleteDocs = [];
        publish();
        onError?.(error);
      },
    );

    const unsubscribeLegacyPlayers = teamId
      ? onSnapshot(
          collection(db, PLAYERS_COLLECTION),
          (snapshot) => {
            legacyPlayerDocs = snapshot.docs
              .map((entry) => ({
                id: entry.id,
                data: entry.data() as Record<string, unknown>,
              }))
              .filter((entry) => !normalizeTeamId(entry.data))
              .map((entry) => normalizePlayer(entry.id, entry.data, "players"));
            publish();
          },
          (error) => {
            legacyPlayerDocs = [];
            publish();
            onError?.(error);
          },
        )
      : () => undefined;

    const unsubscribeLegacyAthletes = teamId
      ? onSnapshot(
          collection(db, ATHLETES_COLLECTION),
          (snapshot) => {
            legacyAthleteDocs = snapshot.docs
              .map((entry) => ({
                id: entry.id,
                data: entry.data() as Record<string, unknown>,
              }))
              .filter((entry) => !normalizeTeamId(entry.data))
              .map((entry) => normalizePlayer(entry.id, entry.data, "athletes"));
            publish();
          },
          (error) => {
            legacyAthleteDocs = [];
            publish();
            onError?.(error);
          },
        )
      : () => undefined;

    return () => {
      unsubscribePlayers();
      unsubscribeAthletes();
      unsubscribeLegacyPlayers();
      unsubscribeLegacyAthletes();
    };
  },

  subscribeToMatches(teamId: string | null, callback: (matches: MatchRecord[]) => void, onError?: (error: unknown) => void) {
    return subscribeToLegacyAwareCollection(
      MATCHES_COLLECTION,
      teamId,
      normalizeMatch,
      callback,
      onError,
      {
        sort: (left, right) => sortByNewest(left, right),
      },
    );
  },

  subscribeToMatchEvents(teamId: string | null, callback: (events: MatchEventRecord[]) => void, onError?: (error: unknown) => void) {
    return subscribeToLegacyAwareCollection(
      MATCH_EVENTS_COLLECTION,
      teamId,
      normalizeMatchEvent,
      callback,
      onError,
      {
        sort: sortByNewest,
        limit: 1000,
      },
    );
  },

  subscribeToTrainingSessions(teamId: string | null, callback: (sessions: TrainingSessionRecord[]) => void, onError?: (error: unknown) => void) {
    return subscribeToLegacyAwareCollection(
      TRAINING_SESSIONS_COLLECTION,
      teamId,
      normalizeTrainingSession,
      callback,
      onError,
      {
        sort: (left, right) => sortByNewest(left, right),
      },
    );
  },

  subscribeToAttendance(teamId: string | null, callback: (records: AttendanceRecord[]) => void, onError?: (error: unknown) => void) {
    return subscribeToLegacyAwareCollection(
      ATTENDANCE_COLLECTION,
      teamId,
      normalizeAttendanceRecord,
      callback,
      onError,
      {
        sort: sortByNewest,
        limit: 1500,
      },
    );
  },

  subscribeToPlayerStatuses(teamId: string | null, callback: (items: PlayerStatusRecord[]) => void, onError?: (error: unknown) => void) {
    return subscribeToLegacyAwareCollection(
      PLAYER_STATUSES_COLLECTION,
      teamId,
      normalizePlayerStatus,
      callback,
      onError,
    );
  },

  subscribeToMatchSquads(teamId: string | null, callback: (items: MatchSquadRecord[]) => void, onError?: (error: unknown) => void) {
    return subscribeToLegacyAwareCollection(
      MATCH_SQUADS_COLLECTION,
      teamId,
      normalizeMatchSquad,
      callback,
      onError,
    );
  },

  subscribeToFormations(teamId: string | null, callback: (items: FormationRecord[]) => void, onError?: (error: unknown) => void) {
    return subscribeToLegacyAwareCollection(
      FORMATIONS_COLLECTION,
      teamId,
      normalizeFormation,
      callback,
      onError,
      {
        sort: sortByNewest,
      },
    );
  },

  subscribeToTrainingPlans(teamId: string | null, callback: (items: TrainingPlanRecord[]) => void, onError?: (error: unknown) => void) {
    return subscribeToLegacyAwareCollection(
      TRAINING_PLANS_COLLECTION,
      teamId,
      normalizeTrainingPlan,
      callback,
      onError,
      {
        sort: sortByNewest,
      },
    );
  },

  subscribeToMatchPreparations(teamId: string | null, callback: (items: MatchPreparationRecord[]) => void, onError?: (error: unknown) => void) {
    return subscribeToLegacyAwareCollection(
      MATCH_PREPARATIONS_COLLECTION,
      teamId,
      normalizePreparation,
      callback,
      onError,
      {
        sort: sortByNewest,
      },
    );
  },

  buildCoachSnapshot(
    players: PlayerRecord[],
    matches: MatchRecord[],
    matchEvents: MatchEventRecord[],
    sessions: TrainingSessionRecord[],
    attendanceRecords: AttendanceRecord[],
    statuses: PlayerStatusRecord[],
  ) {
    const attendanceAnalytics = buildAttendanceAnalytics(
      sessions,
      attendanceRecords,
      players,
    );
    const attendanceSummaryMap = new Map(
      attendanceAnalytics.byPlayer.map((summary) => [summary.playerId, summary]),
    );
    const performance = buildPerformanceSnapshot(
      players,
      matches,
      matchEvents,
      attendanceSummaryMap,
    );

    return {
      attendanceAnalytics,
      performance,
      alerts: buildCoachAlerts(
        players,
        statuses,
        performance.summaries,
        attendanceAnalytics,
      ),
    };
  },

  async saveMatchSquad(
    teamId: string,
    payload: Omit<MatchSquadRecord, "id" | "createdAt" | "updatedAt" | "teamId">,
  ) {
    await setDoc(
      doc(db, MATCH_SQUADS_COLLECTION, payload.matchId),
      {
        ...payload,
        teamId,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      },
      { merge: true },
    );
  },

  async saveFormation(
    teamId: string,
    payload: Omit<FormationRecord, "id" | "createdAt" | "updatedAt" | "teamId">,
  ) {
    const formationRef = payload.matchId
      ? doc(db, FORMATIONS_COLLECTION, `${payload.matchId}_${payload.shape}`)
      : doc(collection(db, FORMATIONS_COLLECTION));

    await setDoc(
      formationRef,
      {
        ...payload,
        teamId,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      },
      { merge: true },
    );
  },

  async saveTrainingPlan(
    teamId: string,
    payload: Omit<TrainingPlanRecord, "id" | "createdAt" | "updatedAt" | "teamId">,
  ) {
    const trainingPlanRef = payload.sessionId
      ? doc(db, TRAINING_PLANS_COLLECTION, payload.sessionId)
      : doc(collection(db, TRAINING_PLANS_COLLECTION));

    await setDoc(
      trainingPlanRef,
      {
        ...payload,
        teamId,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      },
      { merge: true },
    );
  },

  async savePlayerStatus(
    teamId: string,
    payload: Omit<PlayerStatusRecord, "id" | "createdAt" | "updatedAt" | "teamId">,
  ) {
    await setDoc(
      doc(db, PLAYER_STATUSES_COLLECTION, payload.playerId),
      {
        ...payload,
        teamId,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      },
      { merge: true },
    );

    if (payload.status !== "fit") {
      await NotificationService.createRoleNotifications(["coach"], {
        teamId,
        type: "system_alert",
        title: "Player unavailable",
        message: "A player status was updated and requires coach attention.",
        data: {
          playerId: payload.playerId,
          priority: "high",
          actionUrl: "/dashboard/coach#squad",
          actionLabel: "Open squad",
        },
        dedupeKey: `coach-player-status:${payload.playerId}:${payload.status}`,
      });
    }
  },

  async saveMatchPreparation(
    teamId: string,
    payload: Omit<MatchPreparationRecord, "id" | "createdAt" | "updatedAt" | "teamId">,
  ) {
    await setDoc(
      doc(db, MATCH_PREPARATIONS_COLLECTION, payload.matchId),
      {
        ...payload,
        teamId,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      },
      { merge: true },
    );
  },

  async syncCoachInsights(
    teamId: string,
    performanceSummaries: PlayerPerformanceSummary[],
    attendanceAnalytics: AttendanceAnalytics,
  ) {
    await Promise.all([
      ...performanceSummaries
        .filter(
          (summary) =>
            summary.performanceScore < 45 || summary.attendanceRate < 60,
        )
        .slice(0, 5)
        .map((summary) =>
          NotificationService.createRoleNotifications(["coach"], {
            teamId,
            type: "performance_alert",
            title: "Performance drop detected",
            message: `${summary.playerName} is trending below expectation.`,
            data: {
              playerId: summary.playerId,
              priority: "medium",
              actionUrl: `/dashboard/coach/players/${summary.playerId}`,
              actionLabel: "Review player",
            },
            dedupeKey: `coach-performance:${summary.playerId}:${summary.performanceScore}`,
          }),
        ),
      ...attendanceAnalytics.frequentAbsentees.slice(0, 5).map((summary) =>
        NotificationService.createRoleNotifications(["coach"], {
          teamId,
          type: "attendance_alert",
          title: "Training missed",
          message: `${summary.playerName} has missed multiple recent sessions.`,
          data: {
            playerId: summary.playerId,
            priority: "high",
            actionUrl: "/dashboard/coach#training",
            actionLabel: "Review training",
          },
          dedupeKey: `coach-attendance:${summary.playerId}:${summary.absentCount}`,
        }),
      ),
    ]);
  },

  async createTrainingSession(
    teamId: string,
    payload: Omit<TrainingSessionRecord, "id" | "createdAt" | "updatedAt" | "teamId">,
  ) {
    const docRef = await addDoc(collection(db, TRAINING_SESSIONS_COLLECTION), {
      ...payload,
      teamId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return docRef.id;
  },

  async subscribeToPlayerAttendance(
    teamId: string | null,
    playerId: string,
    callback: (records: AttendanceRecord[]) => void,
    onError?: (error: unknown) => void,
  ) {
    return onSnapshot(
      teamCollectionWithFilter(ATTENDANCE_COLLECTION, teamId, "playerId", playerId),
      (snapshot) => {
        callback(
          snapshot.docs.map((entry) =>
            normalizeAttendanceRecord(
              entry.id,
              entry.data() as Record<string, unknown>,
            ),
          ),
        );
      },
      onError,
    );
  },
};

export default CoachService;
