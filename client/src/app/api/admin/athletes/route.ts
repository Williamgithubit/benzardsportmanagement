import { NextRequest, NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import {
  getDateFromValue,
  requireAdminRequest,
  serializeFirestoreValue,
} from "@/lib/admin-route-utils";

export const runtime = "nodejs";

const toTimestamp = (value: unknown) => getDateFromValue(value)?.getTime() ?? 0;

export async function GET(request: NextRequest) {
  const authResult = await requireAdminRequest(request);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const snapshot = await getFirestore().collection("athletes").get();
    const athletes = (snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...(serializeFirestoreValue(doc.data()) as Record<string, unknown>),
      })) as Array<Record<string, unknown>>)
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
