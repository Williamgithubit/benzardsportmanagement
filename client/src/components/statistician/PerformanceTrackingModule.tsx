"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { MdArrowOutward, MdInsights, MdSearch } from "react-icons/md";
import type { PerformanceSnapshot } from "@/types/sports";

interface PerformanceTrackingModuleProps {
  snapshot: PerformanceSnapshot;
}

export default function PerformanceTrackingModule({
  snapshot,
}: PerformanceTrackingModuleProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredSummaries = useMemo(
    () =>
      snapshot.summaries.filter((summary) =>
        summary.playerName.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [searchTerm, snapshot.summaries],
  );

  const topTrendSeries = snapshot.leaderboard[0]?.recentForm || [];

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-[32px] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              <MdInsights size={16} />
              Dynamic Performance Score
            </div>
            <h2 className="mt-4 text-2xl font-semibold text-secondary">
              Leaderboard, trends, and alert list
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Performance score blends goals, assists, ratings, attendance, and discipline.
            </p>
          </div>

          <label className="relative">
            <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-700 shadow-sm focus:border-secondary/30 focus:outline-none sm:w-72"
              placeholder="Search performance table"
            />
          </label>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
        <div className="space-y-6">
          <div className="glass-panel rounded-[32px] p-6">
            <h3 className="text-xl font-semibold text-secondary">Top Players</h3>
            <div className="mt-5 space-y-3">
              {snapshot.leaderboard.length > 0 ? (
                snapshot.leaderboard.map((summary, index) => (
                  <div
                    key={summary.playerId}
                    className="rounded-[24px] border border-slate-200 bg-white/70 px-4 py-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {index + 1}. {summary.playerName}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {summary.position || "Squad member"} · {summary.goals} goals · {summary.assists} assists
                        </p>
                      </div>
                      <p className="text-2xl font-semibold text-secondary">
                        {summary.performanceScore}
                      </p>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {summary.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[24px] border border-dashed border-slate-300 bg-white/60 px-4 py-10 text-center text-sm text-slate-500">
                  Performance standings will populate once match events are recorded.
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel rounded-[32px] p-6">
            <h3 className="text-xl font-semibold text-secondary">Underperforming Players</h3>
            <div className="mt-5 space-y-3">
              {snapshot.underperformers.length > 0 ? (
                snapshot.underperformers.map((summary) => (
                  <div
                    key={summary.playerId}
                    className="rounded-[24px] border border-amber-200 bg-amber-50/70 px-4 py-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {summary.playerName}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Attendance {summary.attendanceRate}% · Rating {summary.averageRating || "0.0"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          router.push(`/dashboard/statistician/performance/${summary.playerId}`)
                        }
                        className="inline-flex items-center gap-1 rounded-2xl border border-amber-200 bg-white px-3 py-2 text-xs font-semibold text-amber-700 transition hover:border-amber-300"
                      >
                        Review
                        <MdArrowOutward size={14} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[24px] border border-dashed border-slate-300 bg-white/60 px-4 py-10 text-center text-sm text-slate-500">
                  No underperformance alerts are active right now.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-panel rounded-[32px] p-6">
            <h3 className="text-xl font-semibold text-secondary">Performance Trend</h3>
            <p className="mt-1 text-sm text-slate-500">
              Recent form trajectory for the current top-ranked player.
            </p>

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
                    stroke="#E32845"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-panel overflow-hidden rounded-[32px]">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-white/70">
                  <tr className="text-left text-xs uppercase tracking-[0.14em] text-slate-500">
                    <th className="px-5 py-4 font-semibold">Player</th>
                    <th className="px-5 py-4 font-semibold">Score</th>
                    <th className="px-5 py-4 font-semibold">Trend</th>
                    <th className="px-5 py-4 font-semibold">Tags</th>
                    <th className="px-5 py-4 font-semibold">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white/60">
                  {filteredSummaries.length > 0 ? (
                    filteredSummaries.map((summary) => (
                      <tr key={summary.playerId} className="hover:bg-slate-50/80">
                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold text-slate-900">
                            {summary.playerName}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {summary.position || "Squad member"}
                          </p>
                        </td>
                        <td className="px-5 py-4 text-sm font-semibold text-secondary">
                          {summary.performanceScore}
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-700">
                          {summary.trend > 0 ? `+${summary.trend}` : summary.trend}
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-700">
                          {summary.tags.join(", ") || "No tag"}
                        </td>
                        <td className="px-5 py-4">
                          <button
                            type="button"
                            onClick={() =>
                              router.push(`/dashboard/statistician/performance/${summary.playerId}`)
                            }
                            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-secondary/20 hover:text-secondary"
                          >
                            Open
                            <MdArrowOutward size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-5 py-10 text-center text-sm text-slate-500"
                      >
                        No players match the current search query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
