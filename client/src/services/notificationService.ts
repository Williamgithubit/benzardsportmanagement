import {
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
  onSnapshot,
  where,
  updateDoc,
  doc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/services/firebase";
import { Notification } from "@/types/notification";

const COLLECTION = "notifications";

export const NotificationService = {
  async createNotification(payload: Omit<Notification, "id" | "createdAt">) {
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...payload,
      read: false,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  },

  subscribeToNotifications(
    userRole: string,
    callback: (notifs: Notification[]) => void,
    onError?: (error: unknown) => void
  ) {
    // Role-based: admin sees all; managers/media see their types
    const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const items: Notification[] = [];
        snap.forEach((d) =>
          items.push({ id: d.id, ...d.data() } as Notification)
        );
        // apply client-side role filter if needed
        if (userRole && userRole !== "admin") {
          const allowedTypes =
            userRole === "manager"
              ? ["athlete", "event", "contact"]
              : ["blog", "media", "event"];
          callback(items.filter((i) => allowedTypes.includes(i.type)));
        } else {
          callback(items);
        }
      },
      (error) => {
        console.error("Failed to subscribe to notifications:", error);
        callback([]);
        onError?.(error);
      }
    );
    return unsubscribe;
  },

  async markAsRead(id: string, read = true) {
    await updateDoc(doc(db, COLLECTION, id), { read });
  },

  async markAllAsRead() {
    // Firestore batch update could be used; for simplicity fetch and update
    const snap = await getDocs(
      query(collection(db, COLLECTION), where("read", "==", false))
    );
    const promises: Promise<void>[] = [];
    snap.forEach((d) =>
      promises.push(updateDoc(doc(db, COLLECTION, d.id), { read: true }))
    );
    await Promise.all(promises);
  },

  async deleteNotification(id: string) {
    await deleteDoc(doc(db, COLLECTION, id));
  },

  async getNotificationsPaginated(pageSize = 20, startAfterDoc?: unknown) {
    let q;
    if (startAfterDoc) {
      q = query(
        collection(db, COLLECTION),
        orderBy("createdAt", "desc"),
        startAfter(startAfterDoc),
        limit(pageSize)
      );
    } else {
      q = query(
        collection(db, COLLECTION),
        orderBy("createdAt", "desc"),
        limit(pageSize)
      );
    }
    const snap = await getDocs(q);
    const items: Notification[] = [];
    snap.forEach((d) =>
      items.push({ id: d.id, ...d.data() } as Notification)
    );
    return { items, lastDoc: snap.docs[snap.docs.length - 1] };
  },

  async exportNotificationsCSV(filterFn?: (n: Notification) => boolean) {
    const snap = await getDocs(
      query(collection(db, COLLECTION), orderBy("createdAt", "desc"))
    );
    const rows: string[] = [];
    const headers = [
      "id",
      "type",
      "title",
      "body",
      "data",
      "read",
      "createdAt",
      "recipientRole",
    ];
    rows.push(headers.join(","));
    snap.forEach((d) => {
      const n = d.data();
      const notif = { id: d.id, ...n } as Notification;
      if (filterFn && !filterFn(notif)) return;
      const createdAt =
        notif.createdAt &&
        (typeof notif.createdAt === "object" && "toDate" in notif.createdAt && typeof (notif.createdAt as { toDate: () => Date }).toDate === "function"
          ? (notif.createdAt as { toDate: () => Date }).toDate().toISOString()
          : notif.createdAt instanceof Date
          ? notif.createdAt.toISOString()
          : notif.createdAt);
      rows.push(
        [
          `"${notif.id}"`,
          `"${notif.type}"`,
          `"${(notif.title || "").replace(/"/g, '""')}"`,
          `"${(notif.body || "").replace(/"/g, '""')}"`,
          `"${JSON.stringify(notif.data || {})}"`,
          notif.read ? "true" : "false",
          `"${createdAt || ""}"`,
          `"${notif.recipientRole || ""}"`,
        ].join(",")
      );
    });
    return rows.join("\n");
  },
};
