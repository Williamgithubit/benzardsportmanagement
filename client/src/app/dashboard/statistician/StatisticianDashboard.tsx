"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import StatisticianDashboardShell from "@/components/dashboard/StatisticianDashboardShell";
import {
  isStatisticianTab,
  type StatisticianTabId,
} from "@/components/dashboard/statistician-navigation";
import AttendanceManagementPanel from "@/components/statistician/AttendanceManagementPanel";
import LiveMatchTracker from "@/components/statistician/LiveMatchTracker";
import PerformanceTrackingModule from "@/components/statistician/PerformanceTrackingModule";
import StatisticianNotificationsPanel from "@/components/statistician/StatisticianNotificationsPanel";
import PlayerStatisticsModule from "@/components/statistician/PlayerStatisticsModule";
import StatisticianProfilePanel from "@/components/statistician/StatisticianProfilePanel";
import StatisticianOverview from "@/components/statistician/StatisticianOverview";
import TeamStatisticsPanel from "@/components/statistician/TeamStatisticsPanel";
import useSportsRealtimeData from "@/hooks/useSportsRealtimeData";
import { useAppSelector } from "@/store/store";

function LoadingPanels() {
  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-[32px] p-6">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="mt-4 h-4 w-3/4" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="glass-panel rounded-[28px] p-5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-4 h-10 w-20" />
            <Skeleton className="mt-4 h-4 w-16" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="glass-panel rounded-[32px] p-6">
          <Skeleton className="h-6 w-52" />
          <Skeleton className="mt-6 h-72 w-full rounded-2xl" />
        </div>
        <div className="glass-panel rounded-[32px] p-6">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="mt-6 h-72 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export default function StatisticianDashboard() {
  const [tab, setTab] = useState<StatisticianTabId>(() => {
    if (typeof window === "undefined") {
      return "overview";
    }

    const initialHash = window.location.hash.replace("#", "");
    return isStatisticianTab(initialHash) ? initialHash : "overview";
  });
  const {
    players,
    matches,
    matchEvents,
    sessions,
    attendanceRecords,
    attendanceAnalytics,
    performanceSnapshot,
    overviewMetrics,
    teamStatistics,
    loading,
    error,
  } = useSportsRealtimeData({
    enabled: tab !== "notifications" && tab !== "profile",
    enablePerformanceSync: true,
    limitMatchEvents: 500,
    limitAttendance: true,
    progressiveLoad: true,
  });
  const currentUser = useAppSelector((state) => state.auth.user);

  useEffect(() => {
    const syncFromHash = () => {
      const nextHash = window.location.hash.replace("#", "");
      if (isStatisticianTab(nextHash)) {
        setTab(nextHash);
      }
    };

    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);

    return () => {
      window.removeEventListener("hashchange", syncFromHash);
    };
  }, []);

  useEffect(() => {
    const nextUrl =
      tab === "overview"
        ? "/dashboard/statistician"
        : `/dashboard/statistician#${tab}`;
    window.history.replaceState(null, "", nextUrl);
  }, [tab]);

  return (
    <StatisticianDashboardShell activeTab={tab} onTabChange={setTab}>
      {!error ? (
        <>
          {tab === "overview" ? (
            <StatisticianOverview
              overviewMetrics={overviewMetrics}
              matches={matches}
              attendanceAnalytics={attendanceAnalytics}
              performanceSnapshot={performanceSnapshot}
            />
          ) : null}

          {tab === "live-match" ? (
            loading && !matches.length ? (
              <LoadingPanels />
            ) : (
              <LiveMatchTracker
                matches={matches}
                players={players}
                matchEvents={matchEvents}
                currentUserId={currentUser?.uid}
              />
            )
          ) : null}

          {tab === "players" ? (
            loading && !performanceSnapshot.summaries.length ? (
              <LoadingPanels />
            ) : (
              <PlayerStatisticsModule
                summaries={performanceSnapshot.summaries}
              />
            )
          ) : null}

          {tab === "team-stats" ? (
            loading && !teamStatistics.leagueTable.length ? (
              <LoadingPanels />
            ) : (
              <TeamStatisticsPanel
                teamStatistics={teamStatistics}
                matches={matches}
              />
            )
          ) : null}

          {tab === "performance" ? (
            loading && !performanceSnapshot.summaries.length ? (
              <LoadingPanels />
            ) : (
              <PerformanceTrackingModule snapshot={performanceSnapshot} />
            )
          ) : null}

          {tab === "attendance" ? (
            loading && !attendanceAnalytics.sessionBreakdown.length ? (
              <LoadingPanels />
            ) : (
              <AttendanceManagementPanel
                players={players}
                sessions={sessions}
                attendanceRecords={attendanceRecords}
                attendanceAnalytics={attendanceAnalytics}
                currentUserId={currentUser?.uid}
              />
            )
          ) : null}
        </>
      ) : null}

      {tab === "notifications" ? <StatisticianNotificationsPanel /> : null}

      {tab === "profile" ? <StatisticianProfilePanel /> : null}

      {error && tab !== "notifications" && tab !== "profile" ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
          {error}
        </div>
      ) : null}
    </StatisticianDashboardShell>
  );
}
