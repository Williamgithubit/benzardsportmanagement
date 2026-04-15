"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import AttendanceService, {
  buildAttendanceAnalytics,
} from "@/services/attendanceService";
import StatisticianService, {
  buildOverviewMetrics,
  buildPerformanceSnapshot,
  buildTeamStatistics,
} from "@/services/statisticianService";
import {
  setAttendanceAnalytics,
  setAttendanceError,
  setAttendanceLoading,
  setAttendanceRecords,
  setTrainingSessions,
} from "@/store/attendanceSlice";
import {
  setPerformanceData,
  syncPerformanceRecords,
} from "@/store/performanceSlice";
import { useAppDispatch, useAppSelector } from "@/store/store";
import type {
  MatchEventRecord,
  MatchRecord,
  PlayerAttendanceSummary,
  PlayerRecord,
} from "@/types/sports";

interface UseSportsRealtimeDataOptions {
  enabled?: boolean;
  enablePerformanceSync?: boolean;
  limitMatchEvents?: number;
  limitAttendance?: boolean;
  progressiveLoad?: boolean;
}

export function useSportsRealtimeData(
  options: UseSportsRealtimeDataOptions = {},
) {
  const {
    enabled = true,
    enablePerformanceSync = false,
    limitMatchEvents = 500,
    limitAttendance = true,
    progressiveLoad = false,
  } = options;
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.user);
  const { sessions, records } = useAppSelector((state) => state.attendance);
  const [players, setPlayers] = useState<PlayerRecord[]>([]);
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [matchEvents, setMatchEvents] = useState<MatchEventRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [readyState, setReadyState] = useState({
    players: false,
    matches: false,
    events: false,
    sessions: false,
    attendance: false,
  });
  const syncKeyRef = useRef<string>("");

  useEffect(() => {
    if (!enabled) {
      dispatch(setAttendanceLoading(false));
      setError(null);
      return;
    }

    if (!currentUser?.uid) {
      setPlayers([]);
      setMatches([]);
      setMatchEvents([]);
      dispatch(setAttendanceLoading(false));
      setError(null);
      return;
    }

    dispatch(setAttendanceLoading(true));

    const markReady = (key: keyof typeof readyState) => {
      setReadyState((current) => ({ ...current, [key]: true }));
    };

    const handleError = (message: string) => (incomingError: unknown) => {
      const nextMessage =
        incomingError instanceof Error ? incomingError.message : message;
      setError(nextMessage);
      dispatch(setAttendanceError(nextMessage));
    };

    const unsubs = [
      StatisticianService.subscribeToPlayers((items) => {
        setPlayers(items);
        markReady("players");
      }, handleError("Unable to load players")),
      StatisticianService.subscribeToMatches((items) => {
        setMatches(items);
        markReady("matches");
      }, handleError("Unable to load matches")),
      StatisticianService.subscribeToRecentMatchEvents(
        limitMatchEvents,
        (items) => {
          setMatchEvents(items);
          markReady("events");
        },
        handleError("Unable to load match events"),
      ),
      AttendanceService.subscribeToTrainingSessions((items) => {
        dispatch(setTrainingSessions(items));
        markReady("sessions");
      }, handleError("Unable to load training sessions")),
      limitAttendance
        ? AttendanceService.subscribeToRecentAttendance((items) => {
            dispatch(setAttendanceRecords(items));
            markReady("attendance");
          }, handleError("Unable to load attendance"))
        : AttendanceService.subscribeToAllAttendance((items) => {
            dispatch(setAttendanceRecords(items));
            markReady("attendance");
          }, handleError("Unable to load attendance")),
    ];

    return () => {
      unsubs.forEach((unsubscribe) => unsubscribe());
    };
  }, [currentUser?.uid, dispatch, enabled, limitMatchEvents, limitAttendance]);

  const attendanceAnalytics = useMemo(
    () => buildAttendanceAnalytics(sessions, records, players),
    [sessions, records, players],
  );

  const attendanceSummaryMap = useMemo(
    () =>
      new Map<string, PlayerAttendanceSummary>(
        attendanceAnalytics.byPlayer.map((summary) => [
          summary.playerId,
          summary,
        ]),
      ),
    [attendanceAnalytics.byPlayer],
  );

  // Memoize filtered match events to avoid unnecessary recomputation
  const filteredMatchEvents = useMemo(
    () => matchEvents.slice(0, limitMatchEvents),
    [matchEvents, limitMatchEvents],
  );

  const performanceSnapshot = useMemo(
    () =>
      buildPerformanceSnapshot(
        players,
        matches,
        filteredMatchEvents,
        attendanceSummaryMap,
      ),
    [players, matches, filteredMatchEvents, attendanceSummaryMap],
  );

  const overviewMetrics = useMemo(
    () =>
      buildOverviewMetrics(
        players,
        matches,
        filteredMatchEvents,
        attendanceSummaryMap,
      ),
    [players, matches, filteredMatchEvents, attendanceSummaryMap],
  );

  const teamStatistics = useMemo(
    () => buildTeamStatistics(matches, filteredMatchEvents),
    [matches, filteredMatchEvents],
  );

  useEffect(() => {
    dispatch(setAttendanceAnalytics(attendanceAnalytics));
  }, [attendanceAnalytics, dispatch]);

  useEffect(() => {
    dispatch(setPerformanceData(performanceSnapshot));
  }, [dispatch, performanceSnapshot]);

  useEffect(() => {
    if (
      !enabled ||
      !currentUser?.uid ||
      !enablePerformanceSync ||
      !performanceSnapshot.summaries.length
    ) {
      return;
    }

    const nextKey = JSON.stringify(
      performanceSnapshot.summaries.map((summary) => [
        summary.playerId,
        summary.performanceScore,
        summary.attendanceRate,
        summary.matchesPlayed,
      ]),
    );

    if (syncKeyRef.current === nextKey) {
      return;
    }

    syncKeyRef.current = nextKey;

    const timeoutId = window.setTimeout(() => {
      void dispatch(syncPerformanceRecords(performanceSnapshot));
    }, 1200);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [currentUser?.uid, dispatch, enabled, enablePerformanceSync, performanceSnapshot]);

  const loading = progressiveLoad
    ? false
    : Object.values(readyState).some((value) => !value) && !error;

  return {
    players,
    matches,
    matchEvents,
    sessions,
    attendanceRecords: records,
    attendanceAnalytics,
    attendanceSummaryMap,
    performanceSnapshot,
    overviewMetrics,
    teamStatistics,
    loading,
    error,
  };
}

export default useSportsRealtimeData;
