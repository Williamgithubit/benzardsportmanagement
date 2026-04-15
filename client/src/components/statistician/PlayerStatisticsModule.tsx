"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MdArrowOutward, MdSearch } from "react-icons/md";
import type { PlayerPerformanceSummary } from "@/types/sports";

interface PlayerStatisticsModuleProps {
  summaries: PlayerPerformanceSummary[];
}

export default function PlayerStatisticsModule({
  summaries,
}: PlayerStatisticsModuleProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [positionFilter, setPositionFilter] = useState("all");

  const positions = useMemo(
    () =>
      Array.from(
        new Set(
          summaries
            .map((summary) => summary.position)
            .filter((position): position is string => Boolean(position)),
        ),
      ),
    [summaries],
  );

  const filteredPlayers = useMemo(
    () =>
      summaries.filter((summary) => {
        const matchesSearch =
          !searchTerm ||
          summary.playerName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesPosition =
          positionFilter === "all" || summary.position === positionFilter;
        return matchesSearch && matchesPosition;
      }),
    [positionFilter, searchTerm, summaries],
  );

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-[32px] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-secondary">Player Statistics</h2>
            <p className="mt-2 text-sm text-slate-500">
              Search, filter, and drill into match output, minutes, and discipline data.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="relative">
              <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-700 shadow-sm focus:border-secondary/30 focus:outline-none sm:w-72"
                placeholder="Search player"
              />
            </label>

            <select
              value={positionFilter}
              onChange={(event) => setPositionFilter(event.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-secondary/30 focus:outline-none"
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

      <section className="glass-panel overflow-hidden rounded-[32px]">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-white/70">
              <tr className="text-left text-xs uppercase tracking-[0.14em] text-slate-500">
                <th className="px-5 py-4 font-semibold">Player</th>
                <th className="px-5 py-4 font-semibold">Matches</th>
                <th className="px-5 py-4 font-semibold">Goals</th>
                <th className="px-5 py-4 font-semibold">Assists</th>
                <th className="px-5 py-4 font-semibold">Cards</th>
                <th className="px-5 py-4 font-semibold">Minutes</th>
                <th className="px-5 py-4 font-semibold">Rating</th>
                <th className="px-5 py-4 font-semibold">Attendance</th>
                <th className="px-5 py-4 font-semibold">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white/60">
              {filteredPlayers.length > 0 ? (
                filteredPlayers.map((summary) => (
                  <tr key={summary.playerId} className="hover:bg-slate-50/80">
                    <td className="px-5 py-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {summary.playerName}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {summary.position || "Squad member"}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-700">
                      {summary.matchesPlayed}
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-secondary">
                      {summary.goals}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-700">
                      {summary.assists}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-700">
                      {summary.yellowCards}Y / {summary.redCards}R
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-700">
                      {summary.minutesPlayed}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-700">
                      {summary.averageRating || "0.0"}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-700">
                      {summary.attendanceRate}%
                    </td>
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() =>
                          router.push(`/dashboard/statistician/players/${summary.playerId}`)
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
                    colSpan={9}
                    className="px-5 py-10 text-center text-sm text-slate-500"
                  >
                    No players match the current search filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
