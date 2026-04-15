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
import type { PlayerPerformanceSummary } from "@/types/sports";

interface PlayerPerformanceDetailProps {
  summary: PlayerPerformanceSummary;
}

export default function PlayerPerformanceDetail({
  summary,
}: PlayerPerformanceDetailProps) {
  const cards = [
    { label: "Performance Score", value: summary.performanceScore },
    { label: "Average Rating", value: summary.averageRating || "0.0" },
    { label: "Trend", value: summary.trend > 0 ? `+${summary.trend}` : summary.trend },
    { label: "Attendance Rate", value: `${summary.attendanceRate}%` },
  ];

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-[32px] px-6 py-7 sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          Performance Detail
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-secondary">
          {summary.playerName}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {summary.position || "Squad member"} · {summary.tags.join(", ") || "No current tag"}
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <div key={card.label} className="rounded-[24px] border border-slate-200 bg-white/70 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                {card.label}
              </p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">{card.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.9fr]">
        <div className="glass-panel rounded-[32px] p-6">
          <h2 className="text-xl font-semibold text-secondary">Performance Trend</h2>
          <p className="mt-1 text-sm text-slate-500">
            Recent score movement across the latest logged form points.
          </p>

          <div className="mt-6 h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={summary.recentForm}>
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

        <div className="glass-panel rounded-[32px] p-6">
          <h2 className="text-xl font-semibold text-secondary">Performance Inputs</h2>
          <div className="mt-5 space-y-3">
            <div className="rounded-[24px] border border-slate-200 bg-white/70 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Goals / Assists
              </p>
              <p className="mt-3 text-sm text-slate-900">
                {summary.goals} goals and {summary.assists} assists are currently boosting this score.
              </p>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-white/70 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Discipline impact
              </p>
              <p className="mt-3 text-sm text-slate-900">
                {summary.yellowCards} yellow cards and {summary.redCards} red cards are applied as score penalties.
              </p>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-white/70 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Current tags
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {summary.tags.length > 0 ? (
                  summary.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600"
                    >
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-slate-500">No tags assigned yet.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
