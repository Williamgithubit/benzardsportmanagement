import { NextRequest, NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import {
  getDateFromValue,
  requireAdminRequest,
  serializeFirestoreValue,
} from "@/lib/admin-route-utils";
import type { AthleteComputedStats } from "@/types/athlete";

export const runtime = "nodejs";

const toTimestamp = (value: unknown) => getDateFromValue(value)?.getTime() ?? 0;

const toNumber = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

const normalizeName = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

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

const mergeComputedStats = (
  baseStats: AthleteComputedStats,
  performanceData: Record<string, unknown> | null,
): AthleteComputedStats => {
  if (!performanceData) {
    return baseStats;
  }

  return {
    ...baseStats,
    matches: toNumber(
      performanceData.matchesPlayed ?? performanceData.matches ?? baseStats.matches,
    ),
    goals: toNumber(performanceData.goals ?? baseStats.goals),
    assists: toNumber(performanceData.assists ?? baseStats.assists),
    yellowCards: toNumber(performanceData.yellowCards ?? baseStats.yellowCards),
    redCards: toNumber(performanceData.redCards ?? baseStats.redCards),
    minutesPlayed: toNumber(
      performanceData.minutesPlayed ?? baseStats.minutesPlayed,
    ),
    fouls: toNumber(performanceData.fouls),
    averageRating: toNumber(performanceData.averageRating),
    attendanceRate: toNumber(performanceData.attendanceRate),
  };
};

export async function GET(request: NextRequest) {
  const authResult = await requireAdminRequest(request);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const db = getFirestore();
    const [athletesSnapshot, performanceSnapshot] = await Promise.all([
      db.collection("athletes").get(),
      db.collection("performance").get(),
    ]);

    const performanceById = new Map<string, Record<string, unknown>>();
    const performanceByName = new Map<string, Record<string, unknown>>();

    performanceSnapshot.docs.forEach((doc) => {
      const data = doc.data() as Record<string, unknown>;
      performanceById.set(doc.id, data);

      if (typeof data.playerName === "string" && data.playerName.trim()) {
        const normalizedName = normalizeName(data.playerName);
        if (!performanceByName.has(normalizedName)) {
          performanceByName.set(normalizedName, data);
        }
      }
    });

    const athletes = (athletesSnapshot.docs
      .map((doc) => {
        const serializedAthlete = serializeFirestoreValue(
          doc.data(),
        ) as Record<string, unknown>;
        const athleteName = resolveAthleteName(serializedAthlete);
        const performanceData =
          performanceById.get(doc.id) ||
          (athleteName ? performanceByName.get(normalizeName(athleteName)) : null) ||
          null;
        const stats = mergeComputedStats(
          normalizeBaseStats(serializedAthlete.stats),
          performanceData,
        );

        return {
          id: doc.id,
          ...serializedAthlete,
          stats,
        };
      }) as Array<Record<string, unknown>>)
      .sort(
        (left, right) =>
          toTimestamp(right.updatedAt ?? right.createdAt) -
          toTimestamp(left.updatedAt ?? left.createdAt)
      );

    return NextResponse.json({
      success: true,
      athletes,
    });
  } catch (error) {
    console.error("Failed to load admin athletes:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to load athletes",
      },
      { status: 500 }
    );
  }
}
