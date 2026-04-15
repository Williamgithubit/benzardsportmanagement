"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { MdInsights, MdOutlineWarningAmber } from "react-icons/md";
import type { CoachAlert, PlayerStatusRecord } from "@/types/coach";
import type {
  AttendanceAnalytics,
  MatchRecord,
  PerformanceSnapshot,
  PlayerRecord,
} from "@/types/sports";

interface CoachOverviewProps {
  players: PlayerRecord[];
  matches: MatchRecord[];
  performanceSnapshot: PerformanceSnapshot;
  attendanceAnalytics: AttendanceAnalytics;
  playerStatuses: PlayerStatusRecord[];
  alerts: CoachAlert[];
}

const isUpcomingMatch = (match: MatchRecord) => {
  if (match.status !== "scheduled") {
    return false;
  }

  if (!match.scheduledAt) {
    return true;
  }

  return new Date(match.scheduledAt).getTime() >= Date.now();
};

export default function CoachOverview({
  players,
  matches,
  performanceSnapshot,
  attendanceAnalytics,
  playerStatuses,
  alerts,
}: CoachOverviewProps) {
  const unavailablePlayers = new Set(
    playerStatuses
      .filter((status) => status.status !== "fit")
      .map((status) => status.playerId),
  );
  const topTrendSeries = performanceSnapshot.leaderboard[0]?.recentForm || [];
  const upcomingMatches = matches.filter(isUpcomingMatch);

  const cards = [
    {
      label: "Total Players",
      value: players.length,
      caption: "Registered for the current team workspace",
    },
    {
      label: "Available Players",
      value: Math.max(0, players.length - unavailablePlayers.size),
      caption: "Fit and available for selection",
    },
    {
      label: "Upcoming Matches",
      value: upcomingMatches.length,
      caption: "Scheduled fixtures still in preparation",
    },
    {
      label: "Team Performance Score",
      value: performanceSnapshot.averagePerformanceScore,
      caption: "Live average blended from form, output, and attendance",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-[32px] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
              <MdInsights size={14} />
              Coach Overview
            </span>
            <h2 className="mt-4 text-2xl font-semibold text-secondary">
              Match readiness, form, and attendance at a glance
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-500">
              The overview blends live roster status, performance trends, attendance signals, and urgent alerts so matchday decisions can move faster.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="glass-panel rounded-[28px] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              {card.label}
            </p>
            <p className="mt-4 text-4xl font-semibold text-slate-900">
              {card.value}
            </p>
            <p className="mt-4 text-sm leading-6 text-slate-500">{card.caption}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="glass-panel rounded-[32px] p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-secondary">
                Recent Performance Trend
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Based on the current top-ranked player’s recent form line.
              </p>
            </div>
          </div>

          <div className="mt-6 h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={topTrendSeries}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="label" stroke="#64748b" />
                <YAxis allowDecimals={false} stroke="#64748b" domain={[0, 100]} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#059669"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel rounded-[32px] p-6">
          <h3 className="text-xl font-semibold text-secondary">Attendance Summary</h3>
          <div className="mt-5 space-y-3">
            {attendanceAnalytics.sessionBreakdown.length > 0 ? (
              attendanceAnalytics.sessionBreakdown.slice(0, 5).map((session) => (
                <div
                  key={session.sessionId}
                  className="rounded-[24px] border border-slate-200 bg-white/70 px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {session.title}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {session.sessionDate} · {session.venue}
                      </p>
                    </div>
                    <p className="text-xl font-semibold text-emerald-600">
                      {session.attendanceRate}%
                    </p>
                  </div>
                  <p className="mt-3 text-xs uppercase tracking-[0.14em] text-slate-500">
                    {session.presentCount} present · {session.absentCount} absent · {session.lateCount} late
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-slate-300 bg-white/60 px-4 py-10 text-center text-sm text-slate-500">
                Attendance summaries will appear once training sessions are tracked.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="glass-panel rounded-[32px] p-6">
          <div className="flex items-center gap-2">
            <MdOutlineWarningAmber className="text-amber-500" size={22} />
            <h3 className="text-xl font-semibold text-secondary">Alerts</h3>
          </div>

          <div className="mt-5 space-y-3">
            {alerts.length > 0 ? (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`rounded-[24px] border px-4 py-4 ${
                    alert.tone === "error"
                      ? "border-rose-200 bg-rose-50/80"
                      : "border-amber-200 bg-amber-50/80"
                  }`}
                >
                  <p className="text-sm font-semibold text-slate-900">
                    {alert.title}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {alert.message}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-slate-300 bg-white/60 px-4 py-10 text-center text-sm text-slate-500">
                No urgent coach alerts are active right now.
              </div>
            )}
          </div>
        </div>

        <div className="glass-panel rounded-[32px] p-6">
          <h3 className="text-xl font-semibold text-secondary">
            Underperformance Insights
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Players flagged for low performance or weak attendance are surfaced here first.
          </p>

          <div className="mt-5 space-y-3">
            {performanceSnapshot.underperformers.length > 0 ? (
              performanceSnapshot.underperformers.map((player) => (
                <div
                  key={player.playerId}
                  className="rounded-[24px] border border-amber-200 bg-amber-50/80 px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {player.playerName}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Attendance {player.attendanceRate}% · Rating {player.averageRating || "0.0"}
                      </p>
                    </div>
                    <p className="text-2xl font-semibold text-amber-700">
                      {player.performanceScore}
                    </p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(player.tags.length > 0 ? player.tags : ["At Risk"]).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-amber-200 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-slate-300 bg-white/60 px-4 py-10 text-center text-sm text-slate-500">
                No at-risk players are currently flagged.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
