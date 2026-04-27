import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import type { AthleteComputedStats } from "@/types/athlete";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

const toNumber = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

const toIsoString = (value: unknown) => {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as { toDate: () => Date }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return null;
};

const resolveAthleteName = (athlete: Record<string, unknown>) =>
  (typeof athlete.name === "string" && athlete.name.trim()) ||
  [
    typeof athlete.firstName === "string" ? athlete.firstName : "",
    typeof athlete.lastName === "string" ? athlete.lastName : "",
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

const normalizeBaseStats = (value: unknown): AthleteComputedStats => {
  const stats =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};

  return {
    goals: toNumber(stats.goals),
    assists: toNumber(stats.assists),
    matches: toNumber(stats.matches),
    yellowCards: toNumber(stats.yellowCards),
    redCards: toNumber(stats.redCards),
    minutesPlayed: toNumber(stats.minutesPlayed),
    saves: toNumber(stats.saves),
    cleanSheets: toNumber(stats.cleanSheets),
    tackles: toNumber(stats.tackles),
    passes: toNumber(stats.passes),
    passAccuracy: toNumber(stats.passAccuracy),
    shotsOnTarget: toNumber(stats.shotsOnTarget),
  };
};

export async function GET(_request: Request, context: RouteContext) {
  if (!adminDb) {
    return NextResponse.json(
      {
        success: false,
        error: "Firebase Admin SDK is not available.",
      },
      { status: 500 },
    );
  }

  try {
    const { id } = await context.params;
    const athleteRef = adminDb.collection("athletes").doc(id);
    const performanceRef = adminDb.collection("performance").doc(id);

    const [athleteDoc, performanceDoc] = await Promise.all([
      athleteRef.get(),
      performanceRef.get(),
    ]);

    if (!athleteDoc.exists) {
      return NextResponse.json(
        {
          success: false,
          error: "Athlete not found.",
        },
        { status: 404 },
      );
    }

    const athleteData = athleteDoc.data() as Record<string, unknown>;
    const baseStats = normalizeBaseStats(athleteData.stats);
    const athleteName = resolveAthleteName(athleteData);
    let resolvedPerformanceDoc = performanceDoc;

    if (!resolvedPerformanceDoc.exists && athleteName) {
      const performanceByNameSnapshot = await adminDb
        .collection("performance")
        .where("playerName", "==", athleteName)
        .limit(1)
        .get();

      if (!performanceByNameSnapshot.empty) {
        resolvedPerformanceDoc = performanceByNameSnapshot.docs[0];
      }
    }

    if (resolvedPerformanceDoc.exists) {
      const performanceData = resolvedPerformanceDoc.data() as Record<string, unknown>;
      return NextResponse.json({
        success: true,
        stats: {
          ...baseStats,
          matches: toNumber(
            performanceData.matchesPlayed ?? performanceData.matches ?? baseStats.matches,
          ),
          goals: toNumber(performanceData.goals ?? baseStats.goals),
          assists: toNumber(performanceData.assists ?? baseStats.assists),
          yellowCards: toNumber(
            performanceData.yellowCards ?? baseStats.yellowCards,
          ),
          redCards: toNumber(performanceData.redCards ?? baseStats.redCards),
          minutesPlayed: toNumber(
            performanceData.minutesPlayed ?? baseStats.minutesPlayed,
          ),
          fouls: toNumber(performanceData.fouls),
          averageRating: toNumber(performanceData.averageRating),
          attendanceRate: toNumber(performanceData.attendanceRate),
        } as AthleteComputedStats,
        source: "performance",
        updatedAt:
          toIsoString(performanceData.updatedAt) ||
          toIsoString(performanceData.generatedAt) ||
          toIsoString(athleteData.updatedAt),
      });
    }

    const eventsSnapshot = await adminDb
      .collection("matchEvents")
      .where("playerId", "==", id)
      .get();

    const matchIds = new Set<string>();
    let goalCount = 0;
    let assistCount = 0;
    let yellowCardCount = 0;
    let redCardCount = 0;
    let foulCount = 0;
    let minutesPlayed = 0;
    let ratingTotal = 0;
    let ratingCount = 0;

    eventsSnapshot.docs.forEach((entry) => {
      const data = entry.data() as Record<string, unknown>;
      const matchId = typeof data.matchId === "string" ? data.matchId : "";
      const type = typeof data.type === "string" ? data.type : "";

      if (matchId) {
        matchIds.add(matchId);
      }

      if (type === "goal") {
        goalCount += 1;
      }
      if (type === "assist") {
        assistCount += 1;
      }
      if (type === "yellow_card") {
        yellowCardCount += 1;
      }
      if (type === "red_card") {
        redCardCount += 1;
      }
      if (type === "foul") {
        foulCount += 1;
      }
      if (type === "minutes_played") {
        minutesPlayed += toNumber(data.minutesPlayed);
      }
      if (type === "rating") {
        ratingTotal += toNumber(data.rating);
        ratingCount += 1;
      }
    });

    const stats: AthleteComputedStats = {
      ...baseStats,
      matches: Math.max(baseStats.matches || 0, matchIds.size),
      goals: (baseStats.goals || 0) + goalCount,
      assists: (baseStats.assists || 0) + assistCount,
      yellowCards: (baseStats.yellowCards || 0) + yellowCardCount,
      redCards: (baseStats.redCards || 0) + redCardCount,
      minutesPlayed: (baseStats.minutesPlayed || 0) + minutesPlayed,
      fouls: foulCount,
      averageRating: ratingCount ? Number((ratingTotal / ratingCount).toFixed(1)) : 0,
    };

    return NextResponse.json({
      success: true,
      stats,
      source: "events",
      updatedAt: toIsoString(athleteData.updatedAt),
    });
  } catch (error) {
    console.error("Failed to build athlete stats:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Unable to load athlete stats.",
      },
      { status: 500 },
    );
  }
}
