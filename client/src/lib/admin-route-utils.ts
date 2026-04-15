import { NextRequest, NextResponse } from "next/server";
import { getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { adminAuth } from "@/lib/firebase-admin";

const ADMIN_ROLE = "admin";

const isAdminRole = (value: unknown) =>
  typeof value === "string" && value.toLowerCase() === ADMIN_ROLE;

export async function requireAuthenticatedRequest(
  request: NextRequest
): Promise<{ uid: string; role: string | null } | NextResponse> {
  if (!adminAuth || !getApps().length) {
    return NextResponse.json(
      {
        success: false,
        error: "Firebase Admin SDK not initialized",
      },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      {
        success: false,
        error: "Unauthorized",
      },
      { status: 401 }
    );
  }

  const token = authHeader.slice("Bearer ".length);

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    let role: string | null =
      decodedToken.admin === true
        ? ADMIN_ROLE
        : typeof decodedToken.role === "string"
          ? decodedToken.role
          : null;

    if (!role) {
      const db = getFirestore();
      const userDoc = await db.collection("users").doc(decodedToken.uid).get();
      const userData = userDoc.data();
      role = typeof userData?.role === "string" ? userData.role : null;
    }

    return {
      uid: decodedToken.uid,
      role,
    };
  } catch (error) {
    console.error("Failed to verify authenticated request:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Invalid token",
      },
      { status: 401 }
    );
  }
}

export async function requireAdminRequest(
  request: NextRequest
): Promise<{ uid: string } | NextResponse> {
  if (!adminAuth || !getApps().length) {
    return NextResponse.json(
      {
        success: false,
        error: "Firebase Admin SDK not initialized",
      },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      {
        success: false,
        error: "Unauthorized",
      },
      { status: 401 }
    );
  }

  const token = authHeader.slice("Bearer ".length);

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);

    if (decodedToken.admin === true || isAdminRole(decodedToken.role)) {
      return { uid: decodedToken.uid };
    }

    const db = getFirestore();
    const userDoc = await db.collection("users").doc(decodedToken.uid).get();
    const userData = userDoc.data();

    if (userData?.admin === true || isAdminRole(userData?.role)) {
      return { uid: decodedToken.uid };
    }

    return NextResponse.json(
      {
        success: false,
        error: "Forbidden: Admin access required",
      },
      { status: 403 }
    );
  } catch (error) {
    console.error("Failed to verify admin request:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Invalid token",
      },
      { status: 401 }
    );
  }
}

export function serializeFirestoreValue(value: unknown): unknown {
  if (value == null) {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as { toDate: () => Date }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }

  if (Array.isArray(value)) {
    return value.map((item) => serializeFirestoreValue(item));
  }

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        serializeFirestoreValue(item),
      ])
    );
  }

  return value;
}

export function getDateFromValue(value: unknown): Date | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as { toDate: () => Date }).toDate === "function"
  ) {
    const parsed = (value as { toDate: () => Date }).toDate();
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "_seconds" in value &&
    typeof (value as { _seconds: number })._seconds === "number"
  ) {
    const parsed = new Date((value as { _seconds: number })._seconds * 1000);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}
