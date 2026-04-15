"use client";

import { useEffect } from "react";
import { NotificationService } from "@/services/notificationService";
import {
  setNotifications,
  setNotificationsError,
  setNotificationsLoading,
} from "@/store/notificationsSlice";
import { useAppDispatch, useAppSelector } from "@/store/store";

export function useDashboardNotifications(limitCount = 30) {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector((state) => state.notifications);
  const user = useAppSelector((state) => state.auth.user);

  useEffect(() => {
    if (!user?.uid) {
      dispatch(setNotifications([]));
      dispatch(setNotificationsLoading(false));
      dispatch(setNotificationsError(null));
      return;
    }

    dispatch(setNotificationsLoading(true));

    const unsubscribe = NotificationService.subscribeToNotifications(
      {
        role: user.role || null,
        userId: user.uid,
        limitCount,
      },
      (items) => {
        dispatch(setNotifications(items));
      },
      (error) => {
        dispatch(
          setNotificationsError(
            error instanceof Error
              ? error.message
              : "Unable to subscribe to notifications",
          ),
        );
      },
    );

    return () => unsubscribe();
  }, [dispatch, limitCount, user?.role, user?.uid]);

  return {
    ...notifications,
    user,
  };
}

export default useDashboardNotifications;
