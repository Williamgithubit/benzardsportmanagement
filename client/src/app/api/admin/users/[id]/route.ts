import { NextRequest, NextResponse } from "next/server";
import { getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { UpdateRequest, UserRecord } from "firebase-admin/auth";
import { adminAuth } from "@/lib/firebase-admin";
import { requireAdminRequest } from "@/lib/admin-route-utils";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

const getDb = () => (getApps().length > 0 ? getFirestore() : null);

const getPhoneNumber = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const formatUser = (
  user: UserRecord,
  firestoreData: Record<string, unknown> = {},
) => ({
  id: user.uid,
  email: user.email || "",
  name: String(
    user.displayName ||
      firestoreData.displayName ||
      firestoreData.name ||
      user.email?.split("@")[0] ||
      "User",
  ),
  role: String(user.customClaims?.role || firestoreData.role || "user"),
  status: String(
    firestoreData.status || (user.disabled ? "inactive" : "active"),
  ),
  lastLogin: firestoreData.lastLogin ? String(firestoreData.lastLogin) : null,
  createdAt: String(
    firestoreData.createdAt || user.metadata.creationTime || new Date().toISOString(),
  ),
  emailVerified: user.emailVerified,
  photoURL: user.photoURL || (firestoreData.photoURL ? String(firestoreData.photoURL) : null),
  phoneNumber:
    user.phoneNumber || (firestoreData.phoneNumber ? String(firestoreData.phoneNumber) : null),
});

export async function PUT(request: NextRequest, context: RouteContext) {
  const authResult = await requireAdminRequest(request);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const db = getDb();

  if (!adminAuth || !db) {
    return NextResponse.json(
      {
        success: false,
        error: "Firebase Admin SDK not initialized",
      },
      { status: 500 },
    );
  }

  try {
    const { id } = await context.params;
    const body = await request.json();
    const userRecord = await adminAuth.getUser(id);
    const userDocRef = db.collection("users").doc(id);
    const userDoc = await userDocRef.get();
    const currentData = userDoc.exists ? (userDoc.data() as Record<string, unknown>) : {};

    const authUpdates: UpdateRequest = {};
    const nextName =
      typeof body.name === "string" && body.name.trim()
        ? body.name.trim()
        : userRecord.displayName ||
          (typeof currentData.name === "string" ? currentData.name : null) ||
          userRecord.email?.split("@")[0] ||
          "User";
    const nextEmail =
      typeof body.email === "string" && body.email.trim()
        ? body.email.trim()
        : userRecord.email || "";
    const nextRole =
      typeof body.role === "string" && body.role.trim()
        ? body.role.trim()
        : String(userRecord.customClaims?.role || currentData.role || "user");
    const nextStatus =
      typeof body.status === "string" && body.status.trim()
        ? body.status.trim()
        : String(currentData.status || (userRecord.disabled ? "inactive" : "active"));
    const nextPhoneNumber =
      body.phoneNumber === null
        ? null
        : getPhoneNumber(body.phoneNumber) ||
          userRecord.phoneNumber ||
          getPhoneNumber(currentData.phoneNumber);

    if (typeof body.name === "string" && body.name.trim()) {
      authUpdates.displayName = nextName;
    }

    if (typeof body.email === "string" && body.email.trim()) {
      authUpdates.email = nextEmail;
    }

    if (typeof body.password === "string" && body.password.trim()) {
      authUpdates.password = body.password.trim();
    }

    if (typeof body.status === "string") {
      authUpdates.disabled = nextStatus === "inactive" || nextStatus === "suspended";
    }

    if (body.phoneNumber === null) {
      authUpdates.phoneNumber = undefined;
    } else if (typeof body.phoneNumber === "string" && body.phoneNumber.trim()) {
      authUpdates.phoneNumber = body.phoneNumber.trim();
    }

    if (Object.keys(authUpdates).length > 0) {
      await adminAuth.updateUser(id, authUpdates);
    }

    const existingClaims = userRecord.customClaims || {};
    await adminAuth.setCustomUserClaims(id, {
      ...existingClaims,
      role: nextRole,
      admin: nextRole === "admin",
    });

    const timestamp = new Date().toISOString();

    await userDocRef.set(
      {
        uid: id,
        email: nextEmail,
        name: nextName,
        displayName: nextName,
        role: nextRole,
        status: nextStatus,
        phoneNumber: nextPhoneNumber,
        emailVerified:
          typeof currentData.emailVerified === "boolean"
            ? currentData.emailVerified
            : userRecord.emailVerified,
        updatedAt: timestamp,
        createdAt:
          currentData.createdAt || userRecord.metadata.creationTime || timestamp,
      },
      { merge: true },
    );

    const refreshedUser = await adminAuth.getUser(id);
    const refreshedDoc = await userDocRef.get();

    return NextResponse.json(
      formatUser(
        refreshedUser,
        refreshedDoc.exists ? (refreshedDoc.data() as Record<string, unknown>) : {},
      ),
    );
  } catch (error: unknown) {
    console.error("Error updating user:", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to update user",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const authResult = await requireAdminRequest(request);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const db = getDb();

  if (!adminAuth || !db) {
    return NextResponse.json(
      {
        success: false,
        error: "Firebase Admin SDK not initialized",
      },
      { status: 500 },
    );
  }

  try {
    const { id } = await context.params;

    if (authResult.uid === id) {
      return NextResponse.json(
        { error: "You cannot delete the currently signed-in admin user." },
        { status: 400 },
      );
    }

    await Promise.allSettled([
      adminAuth.deleteUser(id),
      db.collection("users").doc(id).delete(),
    ]);

    return NextResponse.json({
      success: true,
      userId: id,
      message: "User deleted successfully",
    });
  } catch (error: unknown) {
    console.error("Error deleting user:", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to delete user",
      },
      { status: 500 },
    );
  }
}
