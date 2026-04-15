"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  MdCheckCircle,
  MdEmojiEvents,
  MdGroups,
  MdSportsSoccer,
} from "react-icons/md";
import type {
  AttendanceAnalytics,
  MatchRecord,
  PerformanceSnapshot,
  StatisticianOverviewMetrics,
} from "@/types/sports";

interface StatisticianOverviewProps {
  overviewMetrics: StatisticianOverviewMetrics;
  matches: MatchRecord[];
  attendanceAnalytics: AttendanceAnalytics;
  performanceSnapshot: PerformanceSnapshot;
}

const resultTone = (match: MatchRecord) => {
  if (match.homeScore > match.awayScore) {
    return "text-emerald-600 bg-emerald-50 border-emerald-200";
  }
  if (match.homeScore < match.awayScore) {
    return "text-rose-600 bg-rose-50 border-rose-200";
  }
  return "text-amber-600 bg-amber-50 border-amber-200";
};

export default function StatisticianOverview({
  overviewMetrics,
  matches,
  attendanceAnalytics,
  performanceSnapshot,
}: StatisticianOverviewProps) {
  const recentMatches = matches.slice(0, 5);
  const matchTrendData = matches
    .slice(0, 6)
    .reverse()
    .map((match) => ({
      label: match.opponent,
      goalsFor: match.homeScore,
      goalsAgainst: match.awayScore,
    }));
  const attendanceTrendData = attendanceAnalytics.sessionBreakdown
    .slice(0, 6)
    .reverse()
    .map((session) => ({
      label: session.sessionDate.slice(5),
      attendanceRate: session.attendanceRate,
      lateCount: session.lateCount,
    }));

  const statCards = [
    {
      label: "Total Matches Recorded",
      value: overviewMetrics.totalMatchesRecorded,
      icon: MdSportsSoccer,
      iconColor: "text-primary",
      accent: "from-primary/20 via-primary/10 to-transparent",
    },
    {
      label: "Total Players",
      value: overviewMetrics.totalPlayers,
      icon: MdGroups,
      iconColor: "text-secondary",
      accent: "from-secondary/20 via-secondary/10 to-transparent",
    },
    {
      label: "Goals Recorded",
      value: overviewMetrics.goalsRecorded,
      icon: MdEmojiEvents,
      iconColor: "text-amber-500",
      accent: "from-amber-400/20 via-amber-200/10 to-transparent",
    },
    {
      label: "Attendance Rate",
      value: `${overviewMetrics.attendanceRate}%`,
      icon: MdCheckCircle,
      iconColor: "text-emerald-500",
      accent: "from-emerald-400/20 via-emerald-200/10 to-transparent",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="glass-panel relative overflow-hidden rounded-[32px] px-6 py-7 sm:px-8">
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(227,40,69,0.16),transparent_55%)]" />
        <div className="pointer-events-none absolute -left-10 top-0 h-48 w-48 rounded-full bg-secondary/10 blur-3xl" />

        <div className="relative grid gap-6 xl:grid-cols-[1.5fr_1fr] xl:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Matchday Snapshot
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-secondary sm:text-4xl">
              Statistics, attendance, and form in one command center.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              The overview keeps the current squad pulse visible, from results and goals to
              attendance trends and the players carrying the strongest form.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-[28px] border border-slate-200 bg-white/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Team Average Score
              </p>
              <p className="mt-2 text-3xl font-semibold text-secondary">
                {performanceSnapshot.averagePerformanceScore}
              </p>
            </div>
            <div className="rounded-[28px] border border-slate-200 bg-white/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Strongest Form
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {performanceSnapshot.leaderboard[0]?.playerName || "No player data yet"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <article
            key={card.label}
            className="glass-panel relative overflow-hidden rounded-[28px] p-5"
          >
            <div
              className={`pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-r ${card.accent}`}
            />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-500">{card.label}</p>
                <p className="mt-4 text-3xl font-semibold text-slate-900">
                  {card.value}
                </p>
              </div>
              <span
                className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm ${card.iconColor}`}
              >
                <card.icon size={24} />
              </span>
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="glass-panel rounded-[32px] p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-secondary">Recent Matches</h2>
              <p className="mt-1 text-sm text-slate-500">
                Latest recorded fixtures and scorelines.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {recentMatches.length > 0 ? (
              recentMatches.map((match) => (
                <div
                  key={match.id}
                  className="flex items-center justify-between gap-4 rounded-[26px] border border-slate-200 bg-white/70 px-4 py-4"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">
                      {match.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {match.venue} · {match.competition || "Friendly"}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-lg font-semibold text-secondary">
                        {match.homeScore} - {match.awayScore}
                      </p>
                      <p className="text-xs text-slate-500">{match.opponent}</p>
                    </div>
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${resultTone(match)}`}
                    >
                      {match.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[26px] border border-dashed border-slate-300 bg-white/60 px-4 py-10 text-center text-sm text-slate-500">
                Match records will appear here as soon as the first fixture is logged.
              </div>
            )}
          </div>
        </div>

        <div className="glass-panel rounded-[32px] p-6">
          <h2 className="text-xl font-semibold text-secondary">Form Leaders</h2>
          <p className="mt-1 text-sm text-slate-500">
            Current top performers based on match output, ratings, and attendance.
          </p>

          <div className="mt-6 space-y-3">
            {performanceSnapshot.leaderboard.length > 0 ? (
              performanceSnapshot.leaderboard.map((summary, index) => (
                <div
                  key={summary.playerId}
                  className="flex items-center justify-between rounded-[24px] border border-slate-200 bg-white/70 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {index + 1}. {summary.playerName}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {summary.position || "Squad member"} · {summary.attendanceRate}% attendance
                    </p>
                  </div>
                  <p className="text-xl font-semibold text-secondary">
                    {summary.performanceScore}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-slate-300 bg-white/60 px-4 py-10 text-center text-sm text-slate-500">
                Performance rankings will populate once matches and attendance are recorded.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="glass-panel rounded-[32px] p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-secondary">Quick Match Trend</h2>
              <p className="mt-1 text-sm text-slate-500">
                Goals for and against across recent fixtures.
              </p>
            </div>
          </div>

          <div className="mt-6 h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={matchTrendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="label" stroke="#64748b" />
                <YAxis allowDecimals={false} stroke="#64748b" />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="goalsFor"
                  stroke="#E32845"
                  fill="rgba(227,40,69,0.18)"
                  strokeWidth={3}
                />
                <Area
                  type="monotone"
                  dataKey="goalsAgainst"
                  stroke="#000054"
                  fill="rgba(0,0,84,0.12)"
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel rounded-[32px] p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-secondary">Attendance Pulse</h2>
              <p className="mt-1 text-sm text-slate-500">
                Session attendance rate and late arrivals over time.
              </p>
            </div>
          </div>

          <div className="mt-6 h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceTrendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="label" stroke="#64748b" />
                <YAxis allowDecimals={false} stroke="#64748b" />
                <Tooltip />
                <Bar dataKey="attendanceRate" fill="#000054" radius={[6, 6, 0, 0]} />
                <Bar dataKey="lateCount" fill="#E32845" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </div>
  );
}
