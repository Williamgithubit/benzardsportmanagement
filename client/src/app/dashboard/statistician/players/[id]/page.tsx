"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import StatisticianDashboardShell from "@/components/dashboard/StatisticianDashboardShell";
import PlayerStatisticsDetail from "@/components/statistician/PlayerStatisticsDetail";
import useSportsRealtimeData from "@/hooks/useSportsRealtimeData";
import {
  buildPlayerMatchContributions,
} from "@/services/statisticianService";
import type { StatisticianTabId } from "@/components/dashboard/statistician-navigation";

export default function StatisticianPlayerDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const {
    players,
    matches,
    matchEvents,
    sessions,
    attendanceRecords,
    attendanceAnalytics,
    performanceSnapshot,
    loading,
  } = useSportsRealtimeData();

  const player = players.find((entry) => entry.id === params.id);
  const summary = performanceSnapshot.summaries.find(
    (entry) => entry.playerId === params.id,
  );
  const matchContributions = buildPlayerMatchContributions(
    params.id,
    matches,
    matchEvents,
  );

  useEffect(() => {
    window.history.replaceState(
      null,
      "",
      `/dashboard/statistician/players/${params.id}`,
    );
  }, [params.id]);

  const handleTabChange = (tab: StatisticianTabId) => {
    router.push(
      tab === "overview"
        ? "/dashboard/statistician"
        : `/dashboard/statistician#${tab}`,
    );
  };

  return (
    <StatisticianDashboardShell activeTab="players" onTabChange={handleTabChange}>
      {loading ? (
        <div className="glass-panel rounded-[32px] px-6 py-10 text-center text-sm text-slate-500">
          Loading player detail...
        </div>
      ) : player && summary ? (
        <PlayerStatisticsDetail
          player={player}
          summary={summary}
          matchContributions={matchContributions}
          sessions={sessions}
          attendanceRecords={attendanceRecords}
          attendanceAnalytics={attendanceAnalytics}
        />
      ) : (
        <div className="glass-panel rounded-[32px] px-6 py-10 text-center text-sm text-slate-500">
          The selected player could not be found.
        </div>
      )}
    </StatisticianDashboardShell>
  );
}
