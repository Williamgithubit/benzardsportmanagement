"use client";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { MdEmojiEvents, MdShield, MdTrendingUp } from "react-icons/md";
import type { MatchRecord, TeamStatisticsSnapshot } from "@/types/sports";

interface TeamStatisticsPanelProps {
  teamStatistics: TeamStatisticsSnapshot;
  matches: MatchRecord[];
}

const chartColors = ["#10b981", "#f59e0b", "#ef4444"];

export default function TeamStatisticsPanel({
  teamStatistics,
  matches,
}: TeamStatisticsPanelProps) {
  const resultsData = [
    { name: "Wins", value: teamStatistics.wins },
    { name: "Draws", value: teamStatistics.draws },
    { name: "Losses", value: teamStatistics.losses },
  ];

  const statCards = [
    {
      label: "Wins / Draws / Losses",
      value: `${teamStatistics.wins} / ${teamStatistics.draws} / ${teamStatistics.losses}`,
      icon: MdTrendingUp,
      iconColor: "text-primary",
    },
    {
      label: "Goals Scored",
      value: teamStatistics.goalsScored,
      icon: MdEmojiEvents,
      iconColor: "text-amber-500",
    },
    {
      label: "Goals Conceded",
      value: teamStatistics.goalsConceded,
      icon: MdShield,
      iconColor: "text-secondary",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-3">
        {statCards.map((card) => (
          <article key={card.label} className="glass-panel rounded-[28px] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-500">{card.label}</p>
                <p className="mt-4 text-3xl font-semibold text-slate-900">
                  {card.value}
                </p>
              </div>
              <span className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm ${card.iconColor}`}>
                <card.icon size={24} />
              </span>
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1.3fr]">
        <div className="glass-panel rounded-[32px] p-6">
          <h2 className="text-xl font-semibold text-secondary">Result Distribution</h2>
          <p className="mt-1 text-sm text-slate-500">
            How recorded fixtures are breaking down across results.
          </p>

          <div className="mt-6 h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={resultsData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={96}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {resultsData.map((entry, index) => (
                    <Cell key={entry.name} fill={chartColors[index]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel rounded-[32px] p-6">
          <h2 className="text-xl font-semibold text-secondary">Competition Snapshot</h2>
          <p className="mt-1 text-sm text-slate-500">
            Opponent-by-opponent table built from recorded Benzard fixtures.
          </p>

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-white/70">
                <tr className="text-left text-xs uppercase tracking-[0.14em] text-slate-500">
                  <th className="px-4 py-3 font-semibold">Opponent</th>
                  <th className="px-4 py-3 font-semibold">P</th>
                  <th className="px-4 py-3 font-semibold">W</th>
                  <th className="px-4 py-3 font-semibold">D</th>
                  <th className="px-4 py-3 font-semibold">L</th>
                  <th className="px-4 py-3 font-semibold">GF</th>
                  <th className="px-4 py-3 font-semibold">GA</th>
                  <th className="px-4 py-3 font-semibold">Pts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white/60">
                {teamStatistics.leagueTable.length > 0 ? (
                  teamStatistics.leagueTable.map((row) => (
                    <tr key={row.team}>
                      <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                        {row.team}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">{row.played}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{row.wins}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{row.draws}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{row.losses}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{row.goalsFor}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{row.goalsAgainst}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-secondary">
                        {row.points}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-10 text-center text-sm text-slate-500"
                    >
                      Record more matches to generate a competition table.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 rounded-[24px] border border-slate-200 bg-white/70 px-4 py-3 text-sm text-slate-500">
            {matches.length} total fixture{matches.length === 1 ? "" : "s"} currently included in this summary.
          </div>
        </div>
      </section>
    </div>
  );
}
