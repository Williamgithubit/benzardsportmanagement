import {
  collection,
  addDoc,
  query,
  limit,
  getDocs,
  onSnapshot,
  where,
  updateDoc,
  doc,
  deleteDoc,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/services/firebase";
import type { Notification, NotificationAudienceRole } from "@/types/notification";
import {
  sortByNewest,
  toIsoString,
  type FirestoreDateValue,
} from "@/utils/firestore";

const COLLECTION = "notifications";
const USERS_COLLECTION = "users";

type SubscriptionArgs =
  | string
  | {
      role?: NotificationAudienceRole | null;
      userId?: string | null;
      teamId?: string | null;
      limitCount?: number;
    };

const normalizeAudienceRole = (
  value: unknown,
): NotificationAudienceRole | null => {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  return normalized || null;
};

const resolveUserUid = (id: string, data: Record<string, unknown>) => {
  const storedUid =
    typeof data.uid === "string" ? data.uid.trim() : "";

  return storedUid || id;
};

const normalizeNotification = (
  id: string,
  data: Record<string, unknown>,
): Notification => ({
  id,
  userId: typeof data.userId === "string" ? data.userId : null,
  teamId: typeof data.teamId === "string" ? data.teamId : null,
  role:
    normalizeAudienceRole(data.role) ||
    normalizeAudienceRole(data.recipientRole) ||
    "all",
  recipientRole:
    normalizeAudienceRole(data.recipientRole) ||
    normalizeAudienceRole(data.role) ||
    "all",
  type: typeof data.type === "string" ? data.type : "system",
  title: typeof data.title === "string" ? data.title : undefined,
  message:
    typeof data.message === "string"
      ? data.message
      : typeof data.body === "string"
        ? data.body
        : undefined,
  body:
    typeof data.body === "string"
      ? data.body
      : typeof data.message === "string"
        ? data.message
        : undefined,
  data:
    data.data && typeof data.data === "object"
      ? (data.data as Record<string, unknown>)
      : undefined,
  read: Boolean(data.read),
  dedupeKey: typeof data.dedupeKey === "string" ? data.dedupeKey : undefined,
  createdAt:
    toIsoString(data.createdAt as FirestoreDateValue) || new Date().toISOString(),
});

const buildTargetQueries = ({
  role,
  userId,
  teamId,
  includeRoleFallback = true,
}: {
  role?: NotificationAudienceRole | null;
  userId?: string | null;
  teamId?: string | null;
  includeRoleFallback?: boolean;
}) => {
  const targets = [];
  const normalizedRole = normalizeAudienceRole(role);
  const normalizedUserId =
    typeof userId === "string" && userId.trim() ? userId.trim() : null;
  const normalizedTeamId =
    typeof teamId === "string" && teamId.trim() ? teamId.trim() : null;
  const notificationsRef = collection(db, COLLECTION);

  if (normalizedUserId) {
    if (normalizedTeamId) {
      targets.push(
        query(
          notificationsRef,
          where("userId", "==", normalizedUserId),
          where("teamId", "==", normalizedTeamId),
        ),
        query(
          notificationsRef,
          where("userId", "==", normalizedUserId),
          where("teamId", "==", null),
        ),
      );
    } else {
      targets.push(query(notificationsRef, where("userId", "==", normalizedUserId)));
    }
  }

  if (includeRoleFallback && normalizedRole) {
    if (normalizedTeamId) {
      targets.push(
        query(
          notificationsRef,
          where("role", "==", normalizedRole),
          where("teamId", "==", normalizedTeamId),
        ),
        query(
          notificationsRef,
          where("role", "==", normalizedRole),
          where("teamId", "==", null),
        ),
        query(
          notificationsRef,
          where("recipientRole", "==", normalizedRole),
          where("teamId", "==", normalizedTeamId),
        ),
        query(
          notificationsRef,
          where("recipientRole", "==", normalizedRole),
          where("teamId", "==", null),
        ),
      );
    } else {
      targets.push(
        query(notificationsRef, where("role", "==", normalizedRole)),
        query(notificationsRef, where("recipientRole", "==", normalizedRole)),
      );
    }
  }

  if (includeRoleFallback) {
    if (normalizedTeamId) {
      targets.push(
        query(
          notificationsRef,
          where("role", "==", "all"),
          where("teamId", "==", normalizedTeamId),
        ),
        query(
          notificationsRef,
          where("role", "==", "all"),
          where("teamId", "==", null),
        ),
        query(
          notificationsRef,
          where("recipientRole", "==", "all"),
          where("teamId", "==", normalizedTeamId),
        ),
        query(
          notificationsRef,
          where("recipientRole", "==", "all"),
          where("teamId", "==", null),
        ),
      );
    } else {
      targets.push(
        query(notificationsRef, where("role", "==", "all")),
        query(notificationsRef, where("recipientRole", "==", "all")),
      );
    }
  }

  return targets;
};

const resolveAudienceUsers = async (
  roles: NotificationAudienceRole[],
  teamId?: string | null,
) => {
  const normalizedRoles = [
    ...new Set(
      roles
        .map((role) => normalizeAudienceRole(role))
        .filter((role): role is NotificationAudienceRole => Boolean(role)),
    ),
  ];
  const normalizedTeamId =
    typeof teamId === "string" && teamId.trim() ? teamId.trim() : null;
  const usersRef = collection(db, USERS_COLLECTION);
  const audienceSnapshots = normalizedTeamId
    ? await Promise.all([
        getDocs(query(usersRef, where("teamId", "==", normalizedTeamId))),
      ])
    : await Promise.all([
        normalizedRoles.length === 0 || normalizedRoles.includes("all")
          ? getDocs(usersRef)
          : getDocs(query(usersRef, where("role", "in", normalizedRoles))),
      ]);

  const scopedAudience = new Map<
    string,
    { uid: string; role: NotificationAudienceRole }
  >();
  audienceSnapshots.forEach((snapshot) => {
    snapshot.docs.forEach((entry) => {
      const data = entry.data() as Record<string, unknown>;
      const uid = resolveUserUid(entry.id, data);
      const role = normalizeAudienceRole(data.role) || "all";

      if (!uid) {
        return;
      }

      if (
        normalizedTeamId &&
        typeof data.teamId === "string" &&
        data.teamId.trim() &&
        data.teamId.trim() !== normalizedTeamId
      ) {
        return;
      }

      if (
        !normalizedRoles.includes("all") &&
        !normalizedRoles.includes(role)
      ) {
        return;
      }

      scopedAudience.set(uid, {
        uid,
        role,
      });
    });
  });

  return [...scopedAudience.values()];
};

export const NotificationService = {
  async createNotification(payload: Omit<Notification, "id" | "createdAt">) {
    const normalizedRole =
      normalizeAudienceRole(payload.role) ||
      normalizeAudienceRole(payload.recipientRole) ||
      "all";

    const docRef = await addDoc(collection(db, COLLECTION), {
      ...payload,
      role: normalizedRole,
      recipientRole: normalizedRole,
      teamId:
        typeof payload.teamId === "string" && payload.teamId.trim()
          ? payload.teamId.trim()
          : null,
      message: payload.message || payload.body || "",
      body: payload.body || payload.message || "",
      read: false,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  },

  async createRoleNotifications(
    roles: NotificationAudienceRole[],
    payload: Omit<Notification, "id" | "createdAt" | "role" | "recipientRole">,
  ) {
    const audience = await resolveAudienceUsers(roles, payload.teamId);

    return Promise.all(
      audience.map((recipient) => {
        const scopedPayload = {
          ...payload,
          userId: recipient.uid,
          role: recipient.role,
          recipientRole: recipient.role,
          dedupeKey: payload.dedupeKey
            ? `${payload.dedupeKey}:${recipient.uid}`
            : undefined,
        };

        if (scopedPayload.dedupeKey) {
          return this.createNotificationIfMissing(
            scopedPayload as Omit<Notification, "id" | "createdAt"> & {
              dedupeKey: string;
            },
          );
        }

        return this.createNotification(scopedPayload);
      }),
    );
  },

  async createNotificationIfMissing(
    payload: Omit<Notification, "id" | "createdAt"> & { dedupeKey: string },
  ) {
    const dedupeQuery = query(
      collection(db, COLLECTION),
      where("dedupeKey", "==", payload.dedupeKey),
      ...(typeof payload.userId === "string" && payload.userId.trim()
        ? [where("userId", "==", payload.userId.trim())]
        : []),
      typeof payload.teamId === "string" && payload.teamId.trim()
        ? where("teamId", "==", payload.teamId.trim())
        : where("teamId", "==", null),
      limit(1),
    );
    const existing = await getDocs(dedupeQuery);

    if (!existing.empty) {
      return existing.docs[0].id;
    }

    return this.createNotification(payload);
  },

  subscribeToNotifications(
    args: SubscriptionArgs,
    callback: (notifs: Notification[]) => void,
    onError?: (error: unknown) => void
  ) {
    const resolved =
      typeof args === "string"
        ? {
            role: normalizeAudienceRole(args),
            userId: null,
            teamId: null,
            limitCount: 30,
          }
        : {
            role: normalizeAudienceRole(args.role) || null,
            userId:
              typeof args.userId === "string" && args.userId.trim()
                ? args.userId.trim()
                : null,
            teamId:
              typeof args.teamId === "string" && args.teamId.trim()
                ? args.teamId.trim()
                : null,
            limitCount: args.limitCount || 30,
          };

    const state = new Map<string, Notification[]>();
    const publish = () => {
      const merged = [...state.values()]
        .flat()
        .reduce<Notification[]>((accumulator, notification) => {
          if (accumulator.some((entry) => entry.id === notification.id)) {
            return accumulator;
          }

          if (
            resolved.teamId &&
            notification.teamId &&
            notification.teamId !== resolved.teamId
          ) {
            return accumulator;
          }

          accumulator.push(notification);
          return accumulator;
        }, [])
        .sort(sortByNewest)
        .slice(0, resolved.limitCount);

      callback(merged);
    };

    const unsubscribers = buildTargetQueries({
      role: resolved.role,
      userId: resolved.userId,
      teamId: resolved.teamId,
      includeRoleFallback: true,
    }).map((entry, index) =>
      onSnapshot(
        entry,
        (snapshot) => {
          state.set(
            `source_${index}`,
            snapshot.docs.map((item) =>
              normalizeNotification(
                item.id,
                item.data() as Record<string, unknown>,
              ),
            ),
          );
          publish();
        },
        (error) => {
          console.error("Failed to subscribe to notifications:", error);
          onError?.(error);
        },
      ),
    );

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  },

  async markAsRead(id: string, read = true) {
    await updateDoc(doc(db, COLLECTION, id), { read });
  },

  async markAllAsRead(filters: { role?: string | null; userId?: string | null; teamId?: string | null } = {}) {
    const snapshots = await Promise.all(
      buildTargetQueries({
        ...filters,
        includeRoleFallback: !filters.userId,
      }).map((entry) => getDocs(entry)),
    );
    const batch = writeBatch(db);
    const processed = new Set<string>();

    snapshots.forEach((snapshot) => {
      snapshot.docs.forEach((entry) => {
        const notification = normalizeNotification(
          entry.id,
          entry.data() as Record<string, unknown>,
        );

        if (
          processed.has(entry.id) ||
          entry.data().read === true ||
          (filters.teamId &&
            notification.teamId &&
            notification.teamId !== filters.teamId)
        ) {
          return;
        }

        processed.add(entry.id);
        batch.update(doc(db, COLLECTION, entry.id), { read: true });
      });
    });

    if (processed.size > 0) {
      await batch.commit();
    }
  },

  async deleteNotification(id: string) {
    await deleteDoc(doc(db, COLLECTION, id));
  },

  async clearAllNotifications(filters: { role?: string | null; userId?: string | null; teamId?: string | null } = {}) {
    const snapshots = await Promise.all(
      buildTargetQueries({
        ...filters,
        includeRoleFallback: !filters.userId,
      }).map((entry) => getDocs(entry)),
    );
    const batch = writeBatch(db);
    const processed = new Set<string>();

    snapshots.forEach((snapshot) => {
      snapshot.docs.forEach((entry) => {
        const notification = normalizeNotification(
          entry.id,
          entry.data() as Record<string, unknown>,
        );

        if (processed.has(entry.id)) {
          return;
        }

        if (
          filters.teamId &&
          notification.teamId &&
          notification.teamId !== filters.teamId
        ) {
          return;
        }

        processed.add(entry.id);
        batch.delete(doc(db, COLLECTION, entry.id));
      });
    });

    if (processed.size > 0) {
      await batch.commit();
    }
  },

  async getNotificationsPaginated(pageSize = 20, startAfterDoc?: unknown) {
    void startAfterDoc;
    const snap = await getDocs(query(collection(db, COLLECTION), limit(pageSize)));
    const items = snap.docs
      .map((entry) =>
        normalizeNotification(entry.id, entry.data() as Record<string, unknown>),
      )
      .sort(sortByNewest);
    return { items, lastDoc: snap.docs[snap.docs.length - 1] };
  },

  async exportNotificationsCSV(filterFn?: (n: Notification) => boolean) {
    const snap = await getDocs(collection(db, COLLECTION));
    const rows: string[] = [];
    const headers = [
      "id",
      "type",
      "title",
      "message",
      "data",
      "read",
      "createdAt",
      "role",
      "userId",
    ];
    rows.push(headers.join(","));
    snap.forEach((d) => {
      const notif = normalizeNotification(
        d.id,
        d.data() as Record<string, unknown>,
      );
      if (filterFn && !filterFn(notif)) return;
      rows.push(
        [
          `"${notif.id}"`,
          `"${notif.type}"`,
          `"${(notif.title || "").replace(/"/g, '""')}"`,
          `"${(notif.message || notif.body || "").replace(/"/g, '""')}"`,
          `"${JSON.stringify(notif.data || {})}"`,
          notif.read ? "true" : "false",
          `"${notif.createdAt || ""}"`,
          `"${notif.role || notif.recipientRole || ""}"`,
          `"${notif.userId || ""}"`,
        ].join(",")
      );
    });
    return rows.join("\n");
  },
};
