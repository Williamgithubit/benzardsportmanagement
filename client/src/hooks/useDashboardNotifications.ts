"use client";

import { useEffect, useState } from "react";
import { NotificationService } from "@/services/notificationService";
import TeamService from "@/services/teamService";
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
  const [teamId, setTeamId] = useState<string | null>(
    TeamService.getResolvedTeamId(user),
  );

  useEffect(() => {
    if (!user?.uid) {
      setTeamId(null);
      return;
    }

    const existingTeamId = TeamService.getResolvedTeamId(user);
    if (existingTeamId) {
      setTeamId(existingTeamId);
      return;
    }

    let mounted = true;

    void TeamService.ensureTeamContext(user)
      .then((context) => {
        if (!mounted) {
          return;
        }

        setTeamId(context?.teamId || null);
      })
      .catch((error) => {
        console.warn("Unable to resolve notification team context.", error);
        if (mounted) {
          setTeamId(null);
        }
      });

    return () => {
      mounted = false;
    };
  }, [user, user?.teamId, user?.teamIds]);

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
        role:
          user.role === "admin" ||
          user.role === "statistician" ||
          Boolean(teamId)
            ? user.role || null
            : null,
        userId: user.uid,
        teamId,
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
  }, [dispatch, limitCount, teamId, user?.role, user?.uid]);

  return {
    ...notifications,
    user,
    teamId,
  };
}

export default useDashboardNotifications;
