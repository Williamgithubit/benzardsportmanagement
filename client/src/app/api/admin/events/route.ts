import { NextRequest, NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import {
  getDateFromValue,
  requireAdminRequest,
  serializeFirestoreValue,
} from "@/lib/admin-route-utils";

export const runtime = "nodejs";

const toTimestamp = (value: unknown) => getDateFromValue(value)?.getTime() ?? 0;

const toNumber = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

interface EventData {
  id: string;
  startDate?: unknown;
  createdAt?: unknown;
  status?: string;
  registrations?: unknown;
  capacity?: unknown;
  [key: string]: unknown;
}

export async function GET(request: NextRequest) {
  const authResult = await requireAdminRequest(request);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const now = Date.now();
    const snapshot = await getFirestore().collection("events").get();
    const events = snapshot.docs
      .map((doc): EventData => ({
        id: doc.id,
        ...(serializeFirestoreValue(doc.data()) as Record<string, unknown>),
      }))
      .sort(
        (left, right) =>
          toTimestamp(right.startDate ?? right.createdAt) -
          toTimestamp(left.startDate ?? left.createdAt)
      );

    const stats = {
      total: events.length,
      upcoming: events.filter((event) => {
        const status = `${event.status ?? ""}`.toLowerCase();
        const startDate = getDateFromValue(event.startDate);

        return (
          status === "upcoming" ||
          (Boolean(startDate) &&
            startDate!.getTime() >= now &&
            status !== "completed" &&
            status !== "cancelled")
        );
      }).length,
      ongoing: events.filter(
        (event) => `${event.status ?? ""}`.toLowerCase() === "ongoing"
      ).length,
      completed: events.filter(
        (event) => `${event.status ?? ""}`.toLowerCase() === "completed"
      ).length,
      cancelled: events.filter(
        (event) => `${event.status ?? ""}`.toLowerCase() === "cancelled"
      ).length,
      totalRegistrations: events.reduce(
        (sum, event) => sum + toNumber(event.registrations),
        0
      ),
      totalCapacity: events.reduce((sum, event) => sum + toNumber(event.capacity), 0),
    };

    return NextResponse.json({
      success: true,
      events,
      stats,
    });
  } catch (error) {
    console.error("Failed to load admin events:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to load events",
      },
      { status: 500 }
    );
  }
}
