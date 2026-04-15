"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import StatisticianDashboardShell from "@/components/dashboard/StatisticianDashboardShell";
import PlayerPerformanceDetail from "@/components/statistician/PlayerPerformanceDetail";
import useSportsRealtimeData from "@/hooks/useSportsRealtimeData";
import type { StatisticianTabId } from "@/components/dashboard/statistician-navigation";

export default function StatisticianPerformanceDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { performanceSnapshot, loading } = useSportsRealtimeData();
  const summary = performanceSnapshot.summaries.find(
    (entry) => entry.playerId === params.id,
  );

  useEffect(() => {
    window.history.replaceState(
      null,
      "",
      `/dashboard/statistician/performance/${params.id}`,
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
    <StatisticianDashboardShell activeTab="performance" onTabChange={handleTabChange}>
      {loading ? (
        <div className="glass-panel rounded-[32px] px-6 py-10 text-center text-sm text-slate-500">
          Loading performance detail...
        </div>
      ) : summary ? (
        <PlayerPerformanceDetail summary={summary} />
      ) : (
        <div className="glass-panel rounded-[32px] px-6 py-10 text-center text-sm text-slate-500">
          The selected performance profile could not be found.
        </div>
      )}
    </StatisticianDashboardShell>
  );
}
