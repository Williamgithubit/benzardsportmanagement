"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import CoachService from "@/services/coachService";
import TeamService from "@/services/teamService";
import {
  setCoachError,
  setCoachFormations,
  setCoachLoading,
  setCoachPlayerStatuses,
  setCoachPreparations,
  setCoachSquads,
  setCoachTrainingPlans,
} from "@/store/coachSlice";
import { useAppDispatch, useAppSelector } from "@/store/store";
import type {
  AttendanceRecord,
  MatchEventRecord,
  MatchRecord,
  PlayerRecord,
  TrainingSessionRecord,
} from "@/types/sports";
import type { TeamContext } from "@/types/team";

interface UseCoachRealtimeDataOptions {
  enabled?: boolean;
}

export function useCoachRealtimeData(
  options: UseCoachRealtimeDataOptions = {},
) {
  const { enabled = true } = options;
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.user);
  const coachState = useAppSelector((state) => state.coach);
  const [teamContext, setTeamContext] = useState<TeamContext | null>(null);
  const [players, setPlayers] = useState<PlayerRecord[]>([]);
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [matchEvents, setMatchEvents] = useState<MatchEventRecord[]>([]);
  const [sessions, setSessions] = useState<TrainingSessionRecord[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
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
        dispatch(setCoachError(message));
      });

    return () => {
      mounted = false;
    };
  }, [currentUser, dispatch, enabled]);

  useEffect(() => {
    if (!enabled || !teamContext?.teamId) {
      return;
    }

    dispatch(setCoachLoading(true));
    setError(null);

    const handleError = (incomingError: unknown) => {
      const message =
        incomingError instanceof Error
          ? incomingError.message
          : "Unable to load coach workspace";
      setError(message);
      dispatch(setCoachError(message));
      dispatch(setCoachLoading(false));
    };

    const unsubscribers = [
      CoachService.subscribeToPlayers(teamContext.teamId, setPlayers, handleError),
      CoachService.subscribeToMatches(teamContext.teamId, setMatches, handleError),
      CoachService.subscribeToMatchEvents(teamContext.teamId, setMatchEvents, handleError),
      CoachService.subscribeToTrainingSessions(teamContext.teamId, setSessions, handleError),
      CoachService.subscribeToAttendance(teamContext.teamId, setAttendanceRecords, handleError),
      CoachService.subscribeToPlayerStatuses(
        teamContext.teamId,
        (items) => dispatch(setCoachPlayerStatuses(items)),
        handleError,
      ),
      CoachService.subscribeToMatchSquads(
        teamContext.teamId,
        (items) => dispatch(setCoachSquads(items)),
        handleError,
      ),
      CoachService.subscribeToFormations(
        teamContext.teamId,
        (items) => dispatch(setCoachFormations(items)),
        handleError,
      ),
      CoachService.subscribeToTrainingPlans(
        teamContext.teamId,
        (items) => dispatch(setCoachTrainingPlans(items)),
        handleError,
      ),
      CoachService.subscribeToMatchPreparations(
        teamContext.teamId,
        (items) => dispatch(setCoachPreparations(items)),
        handleError,
      ),
    ];

    dispatch(setCoachLoading(false));

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [dispatch, enabled, teamContext?.teamId]);

  const coachSnapshot = useMemo(
    () =>
      CoachService.buildCoachSnapshot(
        players,
        matches,
        matchEvents,
        sessions,
        attendanceRecords,
        coachState.playerStatuses,
      ),
    [
      attendanceRecords,
      coachState.playerStatuses,
      matchEvents,
      matches,
      players,
      sessions,
    ],
  );

  useEffect(() => {
    if (!teamContext?.teamId || !coachSnapshot.performance.summaries.length) {
      return;
    }

    const nextKey = JSON.stringify({
      underperformers: coachSnapshot.performance.underperformers.map((player) => [
        player.playerId,
        player.performanceScore,
      ]),
      absentees: coachSnapshot.attendanceAnalytics.frequentAbsentees.map((player) => [
        player.playerId,
        player.absentCount,
      ]),
    });

    if (syncKeyRef.current === nextKey) {
      return;
    }

    syncKeyRef.current = nextKey;

    const timeoutId = window.setTimeout(() => {
      void CoachService.syncCoachInsights(
        teamContext.teamId,
        coachSnapshot.performance.underperformers,
        coachSnapshot.attendanceAnalytics,
      );
    }, 1200);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [coachSnapshot.attendanceAnalytics, coachSnapshot.performance.underperformers, teamContext?.teamId]);

  return {
    teamContext,
    players,
    matches,
    matchEvents,
    sessions,
    attendanceRecords,
    attendanceAnalytics: coachSnapshot.attendanceAnalytics,
    performanceSnapshot: coachSnapshot.performance,
    alerts: coachSnapshot.alerts,
    squads: coachState.squads,
    formations: coachState.formations,
    trainingPlans: coachState.trainingPlans,
    playerStatuses: coachState.playerStatuses,
    preparations: coachState.preparations,
    loading: coachState.loading,
    saving: coachState.saving,
    error: error || coachState.error,
  };
}

export default useCoachRealtimeData;
