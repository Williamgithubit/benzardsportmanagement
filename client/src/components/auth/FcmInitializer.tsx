"use client";

import { useEffect } from "react";
import toast from "react-hot-toast";
import { useAppSelector } from "@/store/store";
import {
  subscribeToForegroundMessages,
  syncPushNotifications,
} from "@/services/fcm";

export default function FcmInitializer() {
  const user = useAppSelector((state) => state.auth.user);

  useEffect(() => {
    if (!user?.uid) {
      return;
    }

    let unsubscribe: (() => void) | null = null;

    void syncPushNotifications().catch((error) => {
      console.warn("FCM sync skipped:", error);
    });

    void subscribeToForegroundMessages((payload) => {
      const title = payload.notification?.title || "New notification";
      const body = payload.notification?.body || "A new update has arrived.";
      toast(`${title}: ${body}`);
    }).then((cleanup) => {
      unsubscribe = cleanup;
    });

    return () => {
      unsubscribe?.();
    };
  }, [user?.uid]);

  return null;
}
