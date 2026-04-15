import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/services/firebase";
import { NotificationService } from "@/services/notificationService";
import type {
  MatchEventRecord,
  MatchEventType,
  MatchRecord,
  MatchTeamSide,
  PerformanceSnapshot,
  PerformanceTag,
  PerformanceTrendPoint,
  PlayerAttendanceSummary,
  PlayerMatchContribution,
  PlayerPerformanceSummary,
  PlayerRecord,
  PlayerStatisticRow,
  StatisticianOverviewMetrics,
  TeamStandingRow,
  TeamStatisticsSnapshot,
} from "@/types/sports";
import { emptyPerformanceSnapshot, emptyTeamStatistics } from "@/types/sports";
import {
  clamp,
  sortByNewest,
  toIsoString,
  toMillis,
  type FirestoreDateValue,
} from "@/utils/firestore";

const PLAYERS_COLLECTION = "players";
const ATHLETES_COLLECTION = "athletes";
const MATCHES_COLLECTION = "matches";
const MATCH_EVENTS_COLLECTION = "matchEvents";
const PERFORMANCE_COLLECTION = "performance";
const HOME_TEAM_NAME = "Benzard Sports";

export interface MatchInput {
  title?: string;
  opponent: string;
  venue: string;
  competition?: string;
  scheduledAt?: string | null;
  homeTeamName?: string | null;
  awayTeamName?: string | null;
  notes?: string | null;
}

export interface MatchEventInput {
  type: Exclude<MatchEventType, "rating" | "minutes_played">;
  minute: number;
  teamSide: MatchTeamSide;
  playerId?: string | null;
  secondaryPlayerId?: string | null;
  note?: string | null;
  createdBy?: string | null;
}

export interface MatchEvaluationInput {
  playerId: string;
  rating: number;
  minutesPlayed: number;
  note?: string | null;
  createdBy?: string | null;
}

const toNumber = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

const getTimerAccumulatedSeconds = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.round(value))
    : 0;

const getElapsedTimerSeconds = (
  startedAt: FirestoreDateValue,
  fallback = 0,
) => {
  const startedAtMs = toMillis(startedAt, 0);

  if (!startedAtMs) {
    return fallback;
  }

  return Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000));
};

const resolveMatchTimerSeconds = (match: MatchRecord) => {
  const carriedSeconds = getTimerAccumulatedSeconds(
    match.timerAccumulatedSeconds,
  );

  if (match.status !== "live" || !match.timerStartedAt) {
    return carriedSeconds;
  }

  return carriedSeconds + getElapsedTimerSeconds(match.timerStartedAt);
};

const normalizePlayer = (
  id: string,
  data: Record<string, unknown>,
  sourceCollection: PlayerRecord["sourceCollection"],
): PlayerRecord => {
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
  const stats =
    data.stats && typeof data.stats === "object"
      ? (data.stats as Record<string, unknown>)
      : {};

  return {
    id,
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
    typeof data.homeTeamName === "string" ? data.homeTeamName : HOME_TEAM_NAME,
  awayTeamName:
    typeof data.awayTeamName === "string" ? data.awayTeamName : null,
  homeScore: toNumber(data.homeScore),
  awayScore: toNumber(data.awayScore),
  timerStartedAt: toIsoString(data.timerStartedAt as FirestoreDateValue),
  timerStoppedAt: toIsoString(data.timerStoppedAt as FirestoreDateValue),
  timerAccumulatedSeconds: getTimerAccumulatedSeconds(
    data.timerAccumulatedSeconds,
  ),
  notes: typeof data.notes === "string" ? data.notes : null,
  isDataComplete:
    typeof data.isDataComplete === "boolean" ? data.isDataComplete : undefined,
  createdAt: toIsoString(data.createdAt as FirestoreDateValue),
  updatedAt: toIsoString(data.updatedAt as FirestoreDateValue),
  createdBy: typeof data.createdBy === "string" ? data.createdBy : null,
});

const normalizeEvent = (
  id: string,
  data: Record<string, unknown>,
): MatchEventRecord => ({
  id,
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

const sortPlayers = (players: PlayerRecord[]) =>
  [...players].sort((left, right) =>
    left.fullName.localeCompare(right.fullName),
  );

const getMatchScore = (
  match: MatchRecord,
  events: MatchEventRecord[],
): { homeScore: number; awayScore: number } => {
  const goalEvents = events.filter((event) => event.type === "goal");

  if (!goalEvents.length) {
    return {
      homeScore: match.homeScore,
      awayScore: match.awayScore,
    };
  }

  return {
    homeScore: goalEvents.filter((event) => event.teamSide === "home").length,
    awayScore: goalEvents.filter((event) => event.teamSide === "away").length,
  };
};

const resultFromScore = (
  homeScore: number,
  awayScore: number,
): PlayerMatchContribution["result"] => {
  if (homeScore > awayScore) {
    return "W";
  }

  if (homeScore < awayScore) {
    return "L";
  }

  return "D";
};

const buildRecentForm = (
  playerId: string,
  matches: MatchRecord[],
  events: MatchEventRecord[],
  attendanceSummaries: Map<string, PlayerAttendanceSummary>,
): PerformanceTrendPoint[] => {
  const contributions = matches
    .map((match) => {
      const matchEvents = events.filter(
        (event) => event.matchId === match.id && event.playerId === playerId,
      );
      if (!matchEvents.length) {
        return null;
      }

      const goals = matchEvents.filter((event) => event.type === "goal").length;
      const assists = matchEvents.filter(
        (event) => event.type === "assist",
      ).length;
      const cards =
        matchEvents.filter((event) => event.type === "yellow_card").length * 2 +
        matchEvents.filter((event) => event.type === "red_card").length * 5;
      const ratingEvents = matchEvents.filter(
        (event) => event.type === "rating" && typeof event.rating === "number",
      );
      const rating = ratingEvents.length
        ? ratingEvents.reduce(
            (total, event) => total + (event.rating || 0),
            0,
          ) / ratingEvents.length
        : 0;
      const attendanceRate =
        attendanceSummaries.get(playerId)?.attendanceRate || 0;
      const score = clamp(
        goals * 12 + assists * 8 + rating * 5 + attendanceRate * 0.12 - cards,
        0,
        100,
      );

      return {
        label: match.title,
        score: Math.round(score),
        createdAt:
          match.scheduledAt ||
          match.updatedAt ||
          match.createdAt ||
          new Date().toISOString(),
      };
    })
    .filter((entry): entry is PerformanceTrendPoint => Boolean(entry))
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .slice(0, 6)
    .reverse();

  return contributions;
};

export const buildPlayerStatistics = (
  players: PlayerRecord[],
  matches: MatchRecord[],
  events: MatchEventRecord[],
  attendanceSummaries: Map<string, PlayerAttendanceSummary> = new Map(),
): PlayerStatisticRow[] =>
  players.map((player) => {
    const playerEvents = events.filter((event) => event.playerId === player.id);
    const contributionMatchIds = new Set(
      playerEvents
        .filter((event) => event.type !== "assist" || Boolean(event.playerId))
        .map((event) => event.matchId),
    );
    const ratingEvents = playerEvents.filter(
      (event) => event.type === "rating" && typeof event.rating === "number",
    );
    const minutesPlayedEvents = playerEvents.filter(
      (event) =>
        event.type === "minutes_played" &&
        typeof event.minutesPlayed === "number",
    );

    const matchesPlayed = Math.max(
      player.baseStats.matches,
      contributionMatchIds.size || 0,
    );
    const goals =
      player.baseStats.goals +
      playerEvents.filter((event) => event.type === "goal").length;
    const assists =
      player.baseStats.assists +
      playerEvents.filter((event) => event.type === "assist").length;
    const yellowCards =
      player.baseStats.yellowCards +
      playerEvents.filter((event) => event.type === "yellow_card").length;
    const redCards =
      player.baseStats.redCards +
      playerEvents.filter((event) => event.type === "red_card").length;
    const fouls = playerEvents.filter((event) => event.type === "foul").length;
    const minutesPlayed =
      player.baseStats.minutesPlayed +
      minutesPlayedEvents.reduce(
        (total, event) => total + (event.minutesPlayed || 0),
        0,
      );
    const averageRating = ratingEvents.length
      ? Number(
          (
            ratingEvents.reduce(
              (total, event) => total + (event.rating || 0),
              0,
            ) / ratingEvents.length
          ).toFixed(1),
        )
      : 0;

    return {
      playerId: player.id,
      playerName: player.fullName,
      position: player.position,
      matchesPlayed,
      goals,
      assists,
      yellowCards,
      redCards,
      fouls,
      minutesPlayed,
      averageRating,
      attendanceRate: attendanceSummaries.get(player.id)?.attendanceRate || 0,
      sourceCollection: player.sourceCollection,
    };
  });

export const buildPlayerMatchContributions = (
  playerId: string,
  matches: MatchRecord[],
  events: MatchEventRecord[],
): PlayerMatchContribution[] => {
  const contributions = matches.reduce<PlayerMatchContribution[]>(
    (accumulator, match) => {
      const playerEvents = events.filter(
        (event) => event.matchId === match.id && event.playerId === playerId,
      );

      if (!playerEvents.length) {
        return accumulator;
      }

      const score = getMatchScore(
        match,
        events.filter((event) => event.matchId === match.id),
      );
      const ratingEvent = playerEvents.find((event) => event.type === "rating");
      const minutesEvent = playerEvents.find(
        (event) => event.type === "minutes_played",
      );

      accumulator.push({
        matchId: match.id,
        matchTitle: match.title,
        scheduledAt: match.scheduledAt,
        result: resultFromScore(score.homeScore, score.awayScore),
        scoreline: `${score.homeScore} - ${score.awayScore}`,
        goals: playerEvents.filter((event) => event.type === "goal").length,
        assists: playerEvents.filter((event) => event.type === "assist").length,
        yellowCards: playerEvents.filter(
          (event) => event.type === "yellow_card",
        ).length,
        redCards: playerEvents.filter((event) => event.type === "red_card")
          .length,
        fouls: playerEvents.filter((event) => event.type === "foul").length,
        minutesPlayed: minutesEvent?.minutesPlayed || 0,
        rating: ratingEvent?.rating || 0,
      });

      return accumulator;
    },
    [],
  );

  return contributions.sort(
    (left, right) => toMillis(right.scheduledAt) - toMillis(left.scheduledAt),
  );
};

export const buildPerformanceSnapshot = (
  players: PlayerRecord[],
  matches: MatchRecord[],
  events: MatchEventRecord[],
  attendanceSummaries: Map<string, PlayerAttendanceSummary>,
): PerformanceSnapshot => {
  if (!players.length) {
    return {
      ...emptyPerformanceSnapshot,
      generatedAt: new Date().toISOString(),
    };
  }

  const rows = buildPlayerStatistics(
    players,
    matches,
    events,
    attendanceSummaries,
  );

  const summaries: PlayerPerformanceSummary[] = rows
    .map((row) => {
      const recentForm = buildRecentForm(
        row.playerId,
        matches,
        events,
        attendanceSummaries,
      );
      const goalsImpact = Math.min(row.goals * 6, 30);
      const assistImpact = Math.min(row.assists * 4, 20);
      const ratingImpact = Math.min(row.averageRating * 4, 30);
      const attendanceImpact = row.attendanceRate * 0.2;
      const disciplinePenalty = row.yellowCards * 1.5 + row.redCards * 5;
      const minutesImpact = Math.min(row.minutesPlayed / 45, 10);
      const performanceScore = Math.round(
        clamp(
          goalsImpact +
            assistImpact +
            ratingImpact +
            attendanceImpact +
            minutesImpact -
            disciplinePenalty,
          0,
          100,
        ),
      );
      const trend =
        recentForm.length >= 2
          ? recentForm[recentForm.length - 1].score - recentForm[0].score
          : 0;
      const tags: PerformanceTag[] = [];

      if (performanceScore >= 75) {
        tags.push("Key Player");
      }
      if (performanceScore >= 65 && trend >= 0) {
        tags.push("In Form");
      }
      if (performanceScore < 45 || row.attendanceRate < 60) {
        tags.push("Needs Improvement");
      }

      return {
        ...row,
        performanceScore,
        tags,
        trend,
        recentForm,
      };
    })
    .sort((left, right) => right.performanceScore - left.performanceScore);

  const averagePerformanceScore = summaries.length
    ? Math.round(
        summaries.reduce(
          (total, summary) => total + summary.performanceScore,
          0,
        ) / summaries.length,
      )
    : 0;

  return {
    summaries,
    leaderboard: summaries.slice(0, 5),
    underperformers: summaries
      .filter(
        (summary) =>
          summary.performanceScore < 45 || summary.attendanceRate < 60,
      )
      .slice(0, 5),
    averagePerformanceScore,
    generatedAt: new Date().toISOString(),
  };
};

export const buildTeamStatistics = (
  matches: MatchRecord[],
  events: MatchEventRecord[],
): TeamStatisticsSnapshot => {
  if (!matches.length) {
    return emptyTeamStatistics;
  }

  const opponentRows = new Map<string, TeamStandingRow>();
  let wins = 0;
  let draws = 0;
  let losses = 0;
  let goalsScored = 0;
  let goalsConceded = 0;

  matches.forEach((match) => {
    const score = getMatchScore(
      match,
      events.filter((event) => event.matchId === match.id),
    );
    goalsScored += score.homeScore;
    goalsConceded += score.awayScore;
    if (score.homeScore > score.awayScore) {
      wins += 1;
    } else if (score.homeScore < score.awayScore) {
      losses += 1;
    } else {
      draws += 1;
    }

    const current = opponentRows.get(match.opponent) || {
      team: match.opponent,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
    };

    current.played += 1;
    current.goalsFor += score.homeScore;
    current.goalsAgainst += score.awayScore;

    if (score.homeScore > score.awayScore) {
      current.wins += 1;
      current.points += 3;
    } else if (score.homeScore < score.awayScore) {
      current.losses += 1;
    } else {
      current.draws += 1;
      current.points += 1;
    }

    current.goalDifference = current.goalsFor - current.goalsAgainst;
    opponentRows.set(match.opponent, current);
  });

  return {
    wins,
    draws,
    losses,
    goalsScored,
    goalsConceded,
    leagueTable: [...opponentRows.values()].sort((left, right) => {
      if (right.points !== left.points) {
        return right.points - left.points;
      }
      return right.goalDifference - left.goalDifference;
    }),
  };
};

export const buildOverviewMetrics = (
  players: PlayerRecord[],
  matches: MatchRecord[],
  events: MatchEventRecord[],
  attendanceSummaries: Map<string, PlayerAttendanceSummary>,
): StatisticianOverviewMetrics => {
  const attendanceRate = attendanceSummaries.size
    ? Math.round(
        [...attendanceSummaries.values()].reduce(
          (total, summary) => total + summary.attendanceRate,
          0,
        ) / attendanceSummaries.size,
      )
    : 0;

  return {
    totalMatchesRecorded: matches.length,
    totalPlayers: players.length,
    goalsRecorded: events.filter((event) => event.type === "goal").length,
    attendanceRate,
  };
};

export const StatisticianService = {
  subscribeToPlayers(
    callback: (players: PlayerRecord[]) => void,
    onError?: (error: unknown) => void,
  ) {
    let playersDocs: PlayerRecord[] = [];
    let athleteDocs: PlayerRecord[] = [];

    const publish = () => {
      callback(sortPlayers(playersDocs.length ? playersDocs : athleteDocs));
    };

    const unsubPlayers = onSnapshot(
      collection(db, PLAYERS_COLLECTION),
      (snapshot) => {
        playersDocs = snapshot.docs.map((entry) =>
          normalizePlayer(
            entry.id,
            entry.data() as Record<string, unknown>,
            "players",
          ),
        );
        publish();
      },
      (error) => {
        console.error("Failed to subscribe to players collection:", error);
        playersDocs = [];
        publish();
        onError?.(error);
      },
    );

    const unsubAthletes = onSnapshot(
      collection(db, ATHLETES_COLLECTION),
      (snapshot) => {
        athleteDocs = snapshot.docs.map((entry) =>
          normalizePlayer(
            entry.id,
            entry.data() as Record<string, unknown>,
            "athletes",
          ),
        );
        publish();
      },
      (error) => {
        console.error("Failed to subscribe to athletes collection:", error);
        athleteDocs = [];
        publish();
        onError?.(error);
      },
    );

    return () => {
      unsubPlayers();
      unsubAthletes();
    };
  },

  subscribeToMatches(
    callback: (matches: MatchRecord[]) => void,
    onError?: (error: unknown) => void,
  ) {
    return onSnapshot(
      collection(db, MATCHES_COLLECTION),
      (snapshot) => {
        const matches = snapshot.docs
          .map((entry) =>
            normalizeMatch(entry.id, entry.data() as Record<string, unknown>),
          )
          .sort((left, right) => {
            const rightTime =
              toMillis(right.scheduledAt) ||
              toMillis(right.updatedAt) ||
              toMillis(right.createdAt);
            const leftTime =
              toMillis(left.scheduledAt) ||
              toMillis(left.updatedAt) ||
              toMillis(left.createdAt);
            return rightTime - leftTime;
          });

        callback(matches);
      },
      (error) => {
        console.error("Failed to subscribe to matches:", error);
        callback([]);
        onError?.(error);
      },
    );
  },

  subscribeToAllMatchEvents(
    callback: (events: MatchEventRecord[]) => void,
    onError?: (error: unknown) => void,
  ) {
    return onSnapshot(
      collection(db, MATCH_EVENTS_COLLECTION),
      (snapshot) => {
        const events = snapshot.docs
          .map((entry) =>
            normalizeEvent(entry.id, entry.data() as Record<string, unknown>),
          )
          .sort(sortByNewest);

        callback(events);
      },
      (error) => {
        console.error("Failed to subscribe to match events:", error);
        callback([]);
        onError?.(error);
      },
    );
  },

  subscribeToRecentMatchEvents(
    limit: number = 500,
    callback: (events: MatchEventRecord[]) => void,
    onError?: (error: unknown) => void,
  ) {
    return onSnapshot(
      collection(db, MATCH_EVENTS_COLLECTION),
      (snapshot) => {
        const events = snapshot.docs
          .map((entry) =>
            normalizeEvent(entry.id, entry.data() as Record<string, unknown>),
          )
          .sort(sortByNewest)
          .slice(0, limit);

        callback(events);
      },
      (error) => {
        console.error("Failed to subscribe to recent match events:", error);
        callback([]);
        onError?.(error);
      },
    );
  },

  subscribeToMatchEvents(
    matchId: string,
    callback: (events: MatchEventRecord[]) => void,
    onError?: (error: unknown) => void,
  ) {
    const eventsQuery = query(
      collection(db, MATCH_EVENTS_COLLECTION),
      where("matchId", "==", matchId),
    );

    return onSnapshot(
      eventsQuery,
      (snapshot) => {
        const events = snapshot.docs
          .map((entry) =>
            normalizeEvent(entry.id, entry.data() as Record<string, unknown>),
          )
          .sort((left, right) => left.minute - right.minute);

        callback(events);
      },
      (error) => {
        console.error("Failed to subscribe to a match timeline:", error);
        callback([]);
        onError?.(error);
      },
    );
  },

  async getPlayerById(playerId: string) {
    const [playerDoc, athleteDoc] = await Promise.all([
      getDoc(doc(db, PLAYERS_COLLECTION, playerId)),
      getDoc(doc(db, ATHLETES_COLLECTION, playerId)),
    ]);

    if (playerDoc.exists()) {
      return normalizePlayer(
        playerDoc.id,
        playerDoc.data() as Record<string, unknown>,
        "players",
      );
    }

    if (athleteDoc.exists()) {
      return normalizePlayer(
        athleteDoc.id,
        athleteDoc.data() as Record<string, unknown>,
        "athletes",
      );
    }

    return null;
  },

  async createMatch(input: MatchInput, createdBy?: string | null) {
    const docRef = await addDoc(collection(db, MATCHES_COLLECTION), {
      title:
        input.title?.trim() || `${HOME_TEAM_NAME} vs ${input.opponent.trim()}`,
      opponent: input.opponent.trim(),
      venue: input.venue.trim(),
      competition: input.competition?.trim() || null,
      scheduledAt: input.scheduledAt || null,
      status: "scheduled",
      homeTeamName: input.homeTeamName?.trim() || HOME_TEAM_NAME,
      awayTeamName: input.awayTeamName?.trim() || input.opponent.trim(),
      homeScore: 0,
      awayScore: 0,
      timerAccumulatedSeconds: 0,
      notes: input.notes?.trim() || null,
      createdBy: createdBy || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return docRef.id;
  },

  async updateMatch(matchId: string, updates: Partial<MatchInput>) {
    const matchRef = doc(db, MATCHES_COLLECTION, matchId);
    await updateDoc(matchRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  },

  async startMatch(matchId: string) {
    const matchSnapshot = await getDoc(doc(db, MATCHES_COLLECTION, matchId));

    if (!matchSnapshot.exists()) {
      throw new Error("Match not found.");
    }

    const match = normalizeMatch(
      matchSnapshot.id,
      matchSnapshot.data() as Record<string, unknown>,
    );

    if (match.status === "completed") {
      throw new Error("Completed matches cannot be restarted.");
    }

    const matchRef = doc(db, MATCHES_COLLECTION, matchId);
    await updateDoc(matchRef, {
      status: "live",
      timerStartedAt: serverTimestamp(),
      timerStoppedAt: null,
      timerAccumulatedSeconds: 0,
      updatedAt: serverTimestamp(),
    });
  },

  async pauseMatch(matchId: string) {
    const matchSnapshot = await getDoc(doc(db, MATCHES_COLLECTION, matchId));

    if (!matchSnapshot.exists()) {
      throw new Error("Match not found.");
    }

    const match = normalizeMatch(
      matchSnapshot.id,
      matchSnapshot.data() as Record<string, unknown>,
    );

    if (match.status !== "live") {
      return {
        timerAccumulatedSeconds: getTimerAccumulatedSeconds(
          match.timerAccumulatedSeconds,
        ),
      };
    }

    const timerAccumulatedSeconds = resolveMatchTimerSeconds(match);

    await updateDoc(doc(db, MATCHES_COLLECTION, matchId), {
      status: "paused",
      timerAccumulatedSeconds,
      timerStartedAt: null,
      timerStoppedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { timerAccumulatedSeconds };
  },

  async resumeMatch(matchId: string) {
    const matchSnapshot = await getDoc(doc(db, MATCHES_COLLECTION, matchId));

    if (!matchSnapshot.exists()) {
      throw new Error("Match not found.");
    }

    const match = normalizeMatch(
      matchSnapshot.id,
      matchSnapshot.data() as Record<string, unknown>,
    );

    if (match.status === "completed") {
      throw new Error("Completed matches cannot be restarted.");
    }

    await updateDoc(doc(db, MATCHES_COLLECTION, matchId), {
      status: "live",
      timerStartedAt: serverTimestamp(),
      timerStoppedAt: null,
      timerAccumulatedSeconds: getTimerAccumulatedSeconds(
        match.timerAccumulatedSeconds,
      ),
      updatedAt: serverTimestamp(),
    });
  },

  async completeMatch(matchId: string) {
    const [matchSnapshot, eventsSnapshot] = await Promise.all([
      getDoc(doc(db, MATCHES_COLLECTION, matchId)),
      getDocs(
        query(
          collection(db, MATCH_EVENTS_COLLECTION),
          where("matchId", "==", matchId),
        ),
      ),
    ]);

    if (!matchSnapshot.exists()) {
      throw new Error("Match not found.");
    }

    const match = normalizeMatch(
      matchSnapshot.id,
      matchSnapshot.data() as Record<string, unknown>,
    );
    const events = eventsSnapshot.docs.map((entry) =>
      normalizeEvent(entry.id, entry.data() as Record<string, unknown>),
    );
    const hasScoreEvent = events.some((event) => event.type === "goal");
    const hasEvaluation = events.some(
      (event) => event.type === "rating" || event.type === "minutes_played",
    );
    const isDataComplete = hasScoreEvent && hasEvaluation;
    const timerAccumulatedSeconds = resolveMatchTimerSeconds(match);

    await updateDoc(doc(db, MATCHES_COLLECTION, matchId), {
      status: "completed",
      timerAccumulatedSeconds,
      timerStartedAt: null,
      timerStoppedAt: serverTimestamp(),
      isDataComplete,
      updatedAt: serverTimestamp(),
    });

    if (!isDataComplete) {
      try {
        await NotificationService.createRoleNotifications(
          ["admin", "statistician"],
          {
            type: "match_alert",
            title: "Match data needs attention",
            message:
              "A completed match is missing either score events or player evaluations.",
            data: {
              actionUrl: "/dashboard/statistician#live-match",
              actionLabel: "Open tracker",
              matchId,
              priority: "high",
            },
            dedupeKey: `match-alert:${matchId}`,
          },
        );
      } catch (error) {
        console.error(
          "Match completed, but the follow-up notification could not be created:",
          error,
        );
      }
    }

    return {
      isDataComplete,
      timerAccumulatedSeconds,
    };
  },

  async recordMatchEvent(matchId: string, input: MatchEventInput) {
    const batch = writeBatch(db);
    const eventRef = doc(collection(db, MATCH_EVENTS_COLLECTION));

    batch.set(eventRef, {
      matchId,
      type: input.type,
      minute: input.minute,
      teamSide: input.teamSide,
      playerId: input.playerId || null,
      secondaryPlayerId: input.secondaryPlayerId || null,
      note: input.note?.trim() || null,
      createdBy: input.createdBy || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    if (input.type === "goal" && input.secondaryPlayerId) {
      const assistRef = doc(collection(db, MATCH_EVENTS_COLLECTION));
      batch.set(assistRef, {
        matchId,
        type: "assist",
        minute: input.minute,
        teamSide: input.teamSide,
        playerId: input.secondaryPlayerId,
        secondaryPlayerId: input.playerId || null,
        note: "Auto-created from goal event",
        createdBy: input.createdBy || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    batch.update(doc(db, MATCHES_COLLECTION, matchId), {
      updatedAt: serverTimestamp(),
      ...(input.type === "goal"
        ? input.teamSide === "home"
          ? { homeScore: increment(1) }
          : { awayScore: increment(1) }
        : {}),
    });

    await batch.commit();
  },

  async saveMatchEvaluation(matchId: string, input: MatchEvaluationInput) {
    const ratingRef = doc(
      db,
      MATCH_EVENTS_COLLECTION,
      `rating_${matchId}_${input.playerId}`,
    );
    const minutesRef = doc(
      db,
      MATCH_EVENTS_COLLECTION,
      `minutes_${matchId}_${input.playerId}`,
    );

    const batch = writeBatch(db);
    batch.set(
      ratingRef,
      {
        matchId,
        type: "rating",
        minute: 90,
        teamSide: "home",
        playerId: input.playerId,
        note: input.note?.trim() || null,
        rating: clamp(input.rating, 1, 10),
        createdBy: input.createdBy || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
    batch.set(
      minutesRef,
      {
        matchId,
        type: "minutes_played",
        minute: 90,
        teamSide: "home",
        playerId: input.playerId,
        note: input.note?.trim() || null,
        minutesPlayed: Math.max(0, Math.round(input.minutesPlayed)),
        createdBy: input.createdBy || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
    batch.update(doc(db, MATCHES_COLLECTION, matchId), {
      updatedAt: serverTimestamp(),
    });

    await batch.commit();
  },

  async syncPerformanceRecords(snapshot: PerformanceSnapshot) {
    if (!snapshot.summaries.length) {
      return;
    }

    const batch = writeBatch(db);

    snapshot.summaries.forEach((summary) => {
      batch.set(
        doc(db, PERFORMANCE_COLLECTION, summary.playerId),
        {
          ...summary,
          generatedAt: snapshot.generatedAt,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    });

    await batch.commit();

    await Promise.all(
      snapshot.underperformers.map((summary) =>
        NotificationService.createRoleNotifications(["admin", "statistician"], {
          type: "performance_alert",
          title: "Player needs attention",
          message: `${summary.playerName} is trending below the performance threshold.`,
          data: {
            actionUrl: `/dashboard/statistician/performance/${summary.playerId}`,
            actionLabel: "Review performance",
            playerId: summary.playerId,
            priority: "medium",
          },
          dedupeKey: `performance-alert:${summary.playerId}:${summary.performanceScore}`,
        }),
      ),
    );
  },
};

export default StatisticianService;
