"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import CoachDashboardShell from "@/components/dashboard/CoachDashboardShell";
import PlayerStatisticsDetail from "@/components/statistician/PlayerStatisticsDetail";
import type { CoachTabId } from "@/components/dashboard/coach-navigation";
import useCoachRealtimeData from "@/hooks/useCoachRealtimeData";
import { buildPlayerMatchContributions } from "@/services/statisticianService";

export default function CoachPlayerDetailPage() {
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
  } = useCoachRealtimeData();

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
      `/dashboard/coach/players/${params.id}`,
    );
  }, [params.id]);

  const handleTabChange = (tab: CoachTabId) => {
    router.push(
      tab === "dashboard" ? "/dashboard/coach" : `/dashboard/coach#${tab}`,
    );
  };

  return (
    <CoachDashboardShell activeTab="performance" onTabChange={handleTabChange}>
      {player && summary ? (
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
    </CoachDashboardShell>
  );
}
