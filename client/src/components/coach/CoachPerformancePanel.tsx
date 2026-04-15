"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MdArrowOutward, MdSearch } from "react-icons/md";
import type { PerformanceSnapshot } from "@/types/sports";

interface CoachPerformancePanelProps {
  snapshot: PerformanceSnapshot;
}

export default function CoachPerformancePanel({
  snapshot,
}: CoachPerformancePanelProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [positionFilter, setPositionFilter] = useState("all");
  const [compareIds, setCompareIds] = useState<[string, string]>(["", ""]);

  const positions = useMemo(
    () =>
      Array.from(
        new Set(
          snapshot.summaries
            .map((summary) => summary.position)
            .filter((position): position is string => Boolean(position)),
        ),
      ),
    [snapshot.summaries],
  );

  const filteredPlayers = useMemo(
    () =>
      snapshot.summaries.filter((summary) => {
        const matchesSearch =
          !searchTerm ||
          summary.playerName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesPosition =
          positionFilter === "all" || summary.position === positionFilter;
        return matchesSearch && matchesPosition;
      }),
    [positionFilter, searchTerm, snapshot.summaries],
  );

  const comparedPlayers = compareIds
    .map((playerId) =>
      snapshot.summaries.find((summary) => summary.playerId === playerId),
    )
    .filter((player): player is PerformanceSnapshot["summaries"][number] => Boolean(player));

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-[32px] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-secondary">
              Player Performance Analysis
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Filter the squad, compare players side by side, and open player detail profiles for deeper review.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="relative">
              <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-700 shadow-sm focus:border-emerald-300 focus:outline-none sm:w-72"
                placeholder="Search player"
              />
            </label>

            <select
              value={positionFilter}
              onChange={(event) => setPositionFilter(event.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-emerald-300 focus:outline-none"
            >
              <option value="all">All positions</option>
              {positions.map((position) => (
                <option key={position} value={position}>
                  {position}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="glass-panel rounded-[32px] p-6">
          <h3 className="text-xl font-semibold text-secondary">Compare Players</h3>
          <p className="mt-1 text-sm text-slate-500">
            Pick two players to compare output, attendance, and form at a glance.
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {[0, 1].map((index) => (
              <label
                key={index}
                className="rounded-[24px] border border-white/70 bg-white/80 p-4"
              >
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Player {index + 1}
                </span>
                <select
                  value={compareIds[index]}
                  onChange={(event) =>
                    setCompareIds((current) => {
                      const next = [...current] as [string, string];
                      next[index] = event.target.value;
                      return next;
                    })
                  }
                  className="mt-3 w-full bg-transparent text-sm font-medium text-slate-800 outline-none"
                >
                  <option value="">Select player</option>
                  {snapshot.summaries.map((summary) => (
                    <option key={summary.playerId} value={summary.playerId}>
                      {summary.playerName}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {comparedPlayers.length > 0 ? (
              comparedPlayers.map((player) => (
                <div
                  key={player.playerId}
                  className="rounded-[24px] border border-slate-200 bg-white/70 p-4"
                >
                  <p className="text-sm font-semibold text-slate-900">
                    {player.playerName}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {player.position || "Squad member"}
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <MetricCard label="Goals" value={player.goals} />
                    <MetricCard label="Assists" value={player.assists} />
                    <MetricCard label="Rating" value={player.averageRating || "0.0"} />
                    <MetricCard label="Attendance" value={`${player.attendanceRate}%`} />
                    <MetricCard label="Score" value={player.performanceScore} />
                    <MetricCard label="Trend" value={player.trend > 0 ? `+${player.trend}` : player.trend} />
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-slate-300 bg-white/60 px-4 py-10 text-center text-sm text-slate-500 md:col-span-2">
                Select players above to compare them side by side.
              </div>
            )}
          </div>
        </div>

        <div className="glass-panel overflow-hidden rounded-[32px]">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-white/70">
                <tr className="text-left text-xs uppercase tracking-[0.14em] text-slate-500">
                  <th className="px-5 py-4 font-semibold">Player</th>
                  <th className="px-5 py-4 font-semibold">Goals</th>
                  <th className="px-5 py-4 font-semibold">Assists</th>
                  <th className="px-5 py-4 font-semibold">Rating</th>
                  <th className="px-5 py-4 font-semibold">Attendance</th>
                  <th className="px-5 py-4 font-semibold">Score</th>
                  <th className="px-5 py-4 font-semibold">Insights</th>
                  <th className="px-5 py-4 font-semibold">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white/60">
                {filteredPlayers.length > 0 ? (
                  filteredPlayers.map((summary) => (
                    <tr key={summary.playerId} className="hover:bg-slate-50/80">
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-slate-900">
                          {summary.playerName}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {summary.position || "Squad member"}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-700">{summary.goals}</td>
                      <td className="px-5 py-4 text-sm text-slate-700">{summary.assists}</td>
                      <td className="px-5 py-4 text-sm text-slate-700">{summary.averageRating || "0.0"}</td>
                      <td className="px-5 py-4 text-sm text-slate-700">{summary.attendanceRate}%</td>
                      <td className="px-5 py-4 text-sm font-semibold text-emerald-600">
                        {summary.performanceScore}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-700">
                        {(summary.tags.length ? summary.tags : ["At Risk"]).join(", ")}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() =>
                            router.push(`/dashboard/coach/players/${summary.playerId}`)
                          }
                          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700"
                        >
                          Open
                          <MdArrowOutward size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-5 py-10 text-center text-sm text-slate-500">
                      No players match the current search filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}
