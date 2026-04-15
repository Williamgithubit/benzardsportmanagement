"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import MediaDashboardService from "@/services/mediaDashboardService";
import TeamService from "@/services/teamService";
import {
  setMediaError,
  setMediaLoading,
  setTeamMedia,
  setTeamAnnouncements,
  setTeamPosts,
} from "@/store/mediaSlice";
import { useAppDispatch, useAppSelector } from "@/store/store";
import type { MatchRecord, PlayerRecord } from "@/types/sports";
import type { TeamContext } from "@/types/team";

export function useMediaDashboardData(enabled = true) {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.user);
  const mediaState = useAppSelector((state) => state.media);
  const [teamContext, setTeamContext] = useState<TeamContext | null>(null);
  const [players, setPlayers] = useState<PlayerRecord[]>([]);
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const syncKeyRef = useRef("");

  useEffect(() => {
    if (!enabled || !currentUser?.uid) {
      setTeamContext(null);
      return;
    }

    let mounted = true;

    void TeamService.ensureTeamContext(currentUser)
      .then((context) => {
        if (!mounted) {
          return;
        }

        setTeamContext(context);
      })
      .catch((incomingError) => {
        const message =
          incomingError instanceof Error
            ? incomingError.message
            : "Unable to resolve team access";
        setError(message);
        dispatch(setMediaError(message));
      });

    return () => {
      mounted = false;
    };
  }, [currentUser, dispatch, enabled]);

  useEffect(() => {
    if (!enabled || !teamContext?.teamId) {
      return;
    }

    dispatch(setMediaLoading(true));
    setError(null);

    const handleError = (incomingError: unknown) => {
      const message =
        incomingError instanceof Error
          ? incomingError.message
          : "Unable to load media workspace";
      setError(message);
      dispatch(setMediaError(message));
      dispatch(setMediaLoading(false));
    };

    void MediaDashboardService.publishDuePosts(teamContext.teamId).catch(handleError);

    const publishInterval = window.setInterval(() => {
      void MediaDashboardService.publishDuePosts(teamContext.teamId).catch(handleError);
    }, 60_000);

    const unsubscribers = [
      MediaDashboardService.subscribeToPosts(
        teamContext.teamId,
        (items) => dispatch(setTeamPosts(items)),
        handleError,
      ),
      MediaDashboardService.subscribeToMedia(
        teamContext.teamId,
        (items) => dispatch(setTeamMedia(items)),
        handleError,
      ),
      MediaDashboardService.subscribeToAnnouncements(
        teamContext.teamId,
        (items) => dispatch(setTeamAnnouncements(items)),
        handleError,
      ),
      MediaDashboardService.subscribeToPlayerProfiles(
        teamContext.teamId,
        setPlayers,
        handleError,
      ),
      MediaDashboardService.subscribeToMatches(
        teamContext.teamId,
        setMatches,
        handleError,
      ),
    ];

    dispatch(setMediaLoading(false));

    return () => {
      window.clearInterval(publishInterval);
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [dispatch, enabled, teamContext?.teamId]);

  useEffect(() => {
    if (!teamContext?.teamId) {
      return;
    }

    const nextKey = JSON.stringify({
      players: players.map((player) => player.id),
      matches: matches.map((match) => match.id),
      reminders: mediaState.posts
        .filter((post) => post.status === "scheduled")
        .map((post) => [post.id, post.scheduledFor]),
    });

    if (syncKeyRef.current === nextKey) {
      return;
    }

    syncKeyRef.current = nextKey;

    const timeoutId = window.setTimeout(() => {
      void MediaDashboardService.syncMediaNotifications(
        teamContext.teamId,
        players,
        matches,
        mediaState.posts,
      );
    }, 1400);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [matches, mediaState.posts, players, teamContext?.teamId]);

  const analytics = useMemo(
    () => ({
      totalPosts: mediaState.posts.length,
      scheduledPosts: mediaState.posts.filter((post) => post.status === "scheduled").length,
      totalMedia: mediaState.media.length,
      totalAnnouncements: mediaState.announcements.length,
      totalViews: mediaState.posts.reduce((total, post) => total + (post.views || 0), 0),
    }),
    [mediaState.announcements.length, mediaState.media.length, mediaState.posts],
  );

  return {
    teamContext,
    players,
    matches,
    posts: mediaState.posts,
    media: mediaState.media,
    announcements: mediaState.announcements,
    analytics,
    loading: mediaState.loading,
    saving: mediaState.saving,
    error: error || mediaState.error,
  };
}

export default useMediaDashboardData;
