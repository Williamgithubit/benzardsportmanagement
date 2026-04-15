import { NextRequest, NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { requireAuthenticatedRequest } from "@/lib/admin-route-utils";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const authResult = await requireAuthenticatedRequest(request);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const body = (await request.json()) as { token?: string };
    const token = body.token?.trim();

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: "A device token is required.",
        },
        { status: 400 },
      );
    }

    const db = getFirestore();
    const tokenRef = db.collection("fcmTokens").doc(token);
    const existing = await tokenRef.get();
    const timestamp = new Date().toISOString();

    await tokenRef.set(
      {
        token,
        uid: authResult.uid,
        role: authResult.role || "user",
        userAgent: request.headers.get("user-agent") || null,
        createdAt: existing.exists
          ? existing.data()?.createdAt || timestamp
          : timestamp,
        updatedAt: timestamp,
      },
      { merge: true },
    );

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Failed to register FCM token:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to register the device token.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const authResult = await requireAuthenticatedRequest(request);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const body = (await request.json()) as { token?: string };
    const token = body.token?.trim();

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: "A device token is required.",
        },
        { status: 400 },
      );
    }

    const db = getFirestore();
    const tokenRef = db.collection("fcmTokens").doc(token);
    const existing = await tokenRef.get();

    if (!existing.exists) {
      return NextResponse.json({ success: true });
    }

    const tokenData = existing.data();
    if (
      tokenData?.uid &&
      tokenData.uid !== authResult.uid &&
      authResult.role !== "admin"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden",
        },
        { status: 403 },
      );
    }

    await tokenRef.delete();

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Failed to unregister FCM token:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to unregister the device token.",
      },
      { status: 500 },
    );
  }
}
