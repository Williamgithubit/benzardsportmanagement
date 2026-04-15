"use client";

import { useEffect, useState } from "react";
import CoachDashboardShell from "@/components/dashboard/CoachDashboardShell";
import {
  isCoachTab,
  type CoachTabId,
} from "@/components/dashboard/coach-navigation";
import CoachOverview from "@/components/coach/CoachOverview";
import CoachSquadManagementPanel from "@/components/coach/CoachSquadManagementPanel";
import CoachPerformancePanel from "@/components/coach/CoachPerformancePanel";
import CoachTrainingPanel from "@/components/coach/CoachTrainingPanel";
import CoachMatchesPanel from "@/components/coach/CoachMatchesPanel";
import CoachNotificationsPanel from "@/components/coach/CoachNotificationsPanel";
import CoachProfilePanel from "@/components/coach/CoachProfilePanel";
import useCoachRealtimeData from "@/hooks/useCoachRealtimeData";
import { useAppSelector } from "@/store/store";

export default function CoachDashboard() {
  const [tab, setTab] = useState<CoachTabId>(() => {
    if (typeof window === "undefined") {
      return "dashboard";
    }

    const initialHash = window.location.hash.replace("#", "");
    return isCoachTab(initialHash) ? initialHash : "dashboard";
  });
  const currentUser = useAppSelector((state) => state.auth.user);
  const coachData = useCoachRealtimeData({
    enabled: tab !== "notifications" && tab !== "profile",
  });

  useEffect(() => {
    const syncFromHash = () => {
      const nextHash = window.location.hash.replace("#", "");
      if (isCoachTab(nextHash)) {
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
      tab === "dashboard" ? "/dashboard/coach" : `/dashboard/coach#${tab}`;
    window.history.replaceState(null, "", nextUrl);
  }, [tab]);

  return (
    <CoachDashboardShell activeTab={tab} onTabChange={setTab}>
      {coachData.error && tab !== "notifications" && tab !== "profile" ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
          {coachData.error}
        </div>
      ) : null}

      {tab === "dashboard" && (
        <CoachOverview
          players={coachData.players}
          matches={coachData.matches}
          performanceSnapshot={coachData.performanceSnapshot}
          attendanceAnalytics={coachData.attendanceAnalytics}
          playerStatuses={coachData.playerStatuses}
          alerts={coachData.alerts}
        />
      )}

      {tab === "squad" && coachData.teamContext?.teamId ? (
        <CoachSquadManagementPanel
          teamId={coachData.teamContext.teamId}
          currentUserId={currentUser?.uid}
          players={coachData.players}
          matches={coachData.matches}
          squads={coachData.squads}
          playerStatuses={coachData.playerStatuses}
        />
      ) : null}

      {tab === "performance" ? (
        <CoachPerformancePanel snapshot={coachData.performanceSnapshot} />
      ) : null}

      {tab === "training" && coachData.teamContext?.teamId ? (
        <CoachTrainingPanel
          teamId={coachData.teamContext.teamId}
          currentUserId={currentUser?.uid}
          sessions={coachData.sessions}
          attendanceRecords={coachData.attendanceRecords}
          trainingPlans={coachData.trainingPlans}
        />
      ) : null}

      {tab === "matches" && coachData.teamContext?.teamId ? (
        <CoachMatchesPanel
          teamId={coachData.teamContext.teamId}
          currentUserId={currentUser?.uid}
          players={coachData.players}
          matches={coachData.matches}
          squads={coachData.squads}
          formations={coachData.formations}
          preparations={coachData.preparations}
        />
      ) : null}

      {tab === "notifications" ? <CoachNotificationsPanel /> : null}
      {tab === "profile" ? <CoachProfilePanel /> : null}
    </CoachDashboardShell>
  );
}
