import {
  getMessaging,
  getToken,
  isSupported as isMessagingSupported,
  onMessage,
  type MessagePayload,
} from "firebase/messaging";
import { app, auth } from "@/services/firebase";

const FCM_TOKEN_STORAGE_KEY = "bsm_fcm_token";

const getStoredToken = () =>
  typeof window !== "undefined"
    ? window.localStorage.getItem(FCM_TOKEN_STORAGE_KEY)
    : null;

const setStoredToken = (token: string | null) => {
  if (typeof window === "undefined") {
    return;
  }

  if (token) {
    window.localStorage.setItem(FCM_TOKEN_STORAGE_KEY, token);
    return;
  }

  window.localStorage.removeItem(FCM_TOKEN_STORAGE_KEY);
};

const getVapidKey = () => process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || "";

const getNotificationPermission = () => {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported" as const;
  }

  return Notification.permission;
};

const getMessagingInstance = async () => {
  if (typeof window === "undefined") {
    return null;
  }

  const supported = await isMessagingSupported().catch(() => false);
  if (!supported) {
    return null;
  }

  return getMessaging(app);
};

const registerServiceWorker = async () => {
  if (
    typeof window === "undefined" ||
    !("serviceWorker" in navigator)
  ) {
    throw new Error("Service workers are not supported in this browser.");
  }

  return navigator.serviceWorker.register("/firebase-messaging-sw.js");
};

const registerDeviceToken = async (token: string) => {
  if (!auth.currentUser) {
    throw new Error("User not authenticated");
  }

  const idToken = await auth.currentUser.getIdToken();
  const response = await fetch("/api/notifications/device", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok || payload?.success === false) {
    throw new Error(
      payload?.error || payload?.message || "Unable to register push device",
    );
  }
};

export async function removeRegisteredFcmToken() {
  const storedToken = getStoredToken();

  if (!storedToken) {
    return;
  }

  try {
    if (auth.currentUser) {
      const idToken = await auth.currentUser.getIdToken();
      await fetch("/api/notifications/device", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: storedToken }),
      });
    }
  } catch (error) {
    console.warn("Unable to unregister FCM token cleanly:", error);
  } finally {
    setStoredToken(null);
  }
}

const ensureMessagingToken = async (requestPermission: boolean) => {
  if (!auth.currentUser) {
    throw new Error("User not authenticated");
  }

  const vapidKey = getVapidKey();
  if (!vapidKey) {
    throw new Error(
      "NEXT_PUBLIC_FIREBASE_VAPID_KEY is missing. Add it before enabling push notifications.",
    );
  }

  const messaging = await getMessagingInstance();
  if (!messaging) {
    throw new Error("Firebase Messaging is not supported in this browser.");
  }

  let permission = getNotificationPermission();
  if (permission === "unsupported") {
    throw new Error("Browser notifications are not supported in this browser.");
  }

  if (permission !== "granted" && requestPermission) {
    permission = await Notification.requestPermission();
  }

  if (permission !== "granted") {
    return {
      permission,
      token: null,
    };
  }

  const serviceWorkerRegistration = await registerServiceWorker();
  const token = await getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration,
  });

  if (!token) {
    throw new Error("Firebase did not return a messaging token.");
  }

  await registerDeviceToken(token);
  setStoredToken(token);

  return {
    permission,
    token,
  };
};

export async function enablePushNotifications() {
  return ensureMessagingToken(true);
}

export async function syncPushNotifications() {
  const permission = getNotificationPermission();
  if (permission !== "granted") {
    return {
      permission,
      token: null,
    };
  }

  return ensureMessagingToken(false);
}

export async function subscribeToForegroundMessages(
  callback: (payload: MessagePayload) => void,
) {
  const messaging = await getMessagingInstance();
  if (!messaging) {
    return () => undefined;
  }

  return onMessage(messaging, callback);
}

export function getStoredFcmToken() {
  return getStoredToken();
}
