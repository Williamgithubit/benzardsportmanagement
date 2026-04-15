import { NextRequest, NextResponse } from "next/server";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { requireAdminRequest } from "@/lib/admin-route-utils";
import { adminApp } from "@/lib/firebase-admin";

export const runtime = "nodejs";

type AudienceRole = "admin" | "statistician" | "all";

interface NotificationRequestBody {
  title?: string;
  message?: string;
  type?: string;
  roles?: AudienceRole[];
  priority?: "low" | "medium" | "high";
  actionUrl?: string;
  actionLabel?: string;
}

const allowedRoles: AudienceRole[] = ["admin", "statistician", "all"];

const normalizeRole = (role: unknown) =>
  typeof role === "string" ? role.trim().toLowerCase() : "";

const normalizeAudience = (roles: AudienceRole[] = []) => {
  const normalized = [
    ...new Set(
      roles.filter((role): role is AudienceRole =>
        allowedRoles.includes(normalizeRole(role) as AudienceRole),
      ),
    ),
  ].map((role) => normalizeRole(role) as AudienceRole);

  return normalized.length > 0 ? normalized : ["all"];
};

const defaultActionUrl = (role: string) =>
  role === "statistician"
    ? "/dashboard/statistician#notifications"
    : "/dashboard/admin#notifications";

const toFcmData = (payload: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(payload).flatMap(([key, value]) => {
      if (value == null) {
        return [];
      }

      if (typeof value === "string") {
        return [[key, value]];
      }

      return [[key, JSON.stringify(value)]];
    }),
  ) as Record<string, string>;

export async function POST(request: NextRequest) {
  const authResult = await requireAdminRequest(request);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  if (!adminApp) {
    return NextResponse.json(
      {
        success: false,
        error: "Firebase Admin SDK is not available.",
      },
      { status: 500 },
    );
  }

  try {
    const body = (await request.json()) as NotificationRequestBody;
    const title = body.title?.trim();
    const message = body.message?.trim();

    if (!title || !message) {
      return NextResponse.json(
        {
          success: false,
          error: "Title and message are required.",
        },
        { status: 400 },
      );
    }

    const roles = normalizeAudience(body.roles);
    const db = getFirestore();
    const usersCollection = db.collection("users");
    const usersSnapshot = await usersCollection.get();

    const recipients = new Map<
      string,
      { uid: string; role: string }
    >();

    usersSnapshot.docs.forEach((entry) => {
      const data = entry.data();
      const uid =
        typeof data.uid === "string" && data.uid.trim()
          ? data.uid.trim()
          : entry.id;
      const role = normalizeRole(data.role) || "user";

      if (
        !roles.includes("all") &&
        !roles.includes(role as AudienceRole)
      ) {
        return;
      }

      recipients.set(uid, {
        uid,
        role,
      });
    });

    if (recipients.size === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No recipients matched the selected audience.",
        },
        { status: 404 },
      );
    }

    const recipientEntries = [...recipients.values()];
    for (let index = 0; index < recipientEntries.length; index += 450) {
      const batch = db.batch();
      const chunk = recipientEntries.slice(index, index + 450);

      chunk.forEach((recipient) => {
        const notificationRef = db.collection("notifications").doc();
        batch.set(notificationRef, {
          userId: recipient.uid,
          role: recipient.role,
          recipientRole: recipient.role,
          type: body.type || "system_alert",
          title,
          message,
          body: message,
          read: false,
          data: {
            priority: body.priority || "medium",
            actionUrl: body.actionUrl || defaultActionUrl(recipient.role),
            actionLabel: body.actionLabel || "Open notifications",
            createdBy: authResult.uid,
          },
          createdAt: FieldValue.serverTimestamp(),
        });
      });

      await batch.commit();
    }

    const recipientIds = new Set([...recipients.keys()]);
    const tokensSnapshot = await db.collection("fcmTokens").get();
    const tokens = tokensSnapshot.docs
      .map((entry) => entry.data())
      .filter(
        (entry) =>
          typeof entry.uid === "string" &&
          recipientIds.has(entry.uid) &&
          typeof entry.token === "string",
      )
      .map((entry) => entry.token as string);

    const messaging = getMessaging(adminApp);
    const invalidTokens: string[] = [];

    for (let index = 0; index < tokens.length; index += 500) {
      const chunk = tokens.slice(index, index + 500);
      if (!chunk.length) {
        continue;
      }

      const result = await messaging.sendEachForMulticast({
        tokens: chunk,
        notification: {
          title,
          body: message,
        },
        data: toFcmData({
          type: body.type || "system_alert",
          title,
          message,
          priority: body.priority || "medium",
          actionUrl: body.actionUrl || "/dashboard",
          actionLabel: body.actionLabel || "Open notifications",
        }),
      });

      result.responses.forEach((response, responseIndex) => {
        if (
          !response.success &&
          response.error?.code ===
            "messaging/registration-token-not-registered"
        ) {
          invalidTokens.push(chunk[responseIndex]);
        }
      });
    }

    if (invalidTokens.length > 0) {
      const cleanupBatch = db.batch();
      invalidTokens.forEach((token) => {
        cleanupBatch.delete(db.collection("fcmTokens").doc(token));
      });
      await cleanupBatch.commit();
    }

    return NextResponse.json({
      success: true,
      recipients: recipients.size,
      pushTokens: tokens.length,
    });
  } catch (error) {
    console.error("Failed to send admin notification:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to send the notification.",
      },
      { status: 500 },
    );
  }
}
