"use client";

import type {
  AttendanceAnalytics,
  PlayerMatchContribution,
  PlayerPerformanceSummary,
  PlayerRecord,
  TrainingSessionRecord,
  AttendanceRecord,
} from "@/types/sports";
import { buildPlayerAttendanceHistory } from "@/services/attendanceService";

interface PlayerStatisticsDetailProps {
  player: PlayerRecord;
  summary: PlayerPerformanceSummary;
  matchContributions: PlayerMatchContribution[];
  sessions: TrainingSessionRecord[];
  attendanceRecords: AttendanceRecord[];
  attendanceAnalytics: AttendanceAnalytics;
}

export default function PlayerStatisticsDetail({
  player,
  summary,
  matchContributions,
  sessions,
  attendanceRecords,
}: PlayerStatisticsDetailProps) {
  const attendanceHistory = buildPlayerAttendanceHistory(
    player.id,
    sessions,
    attendanceRecords,
  );

  const statCards = [
    { label: "Matches Played", value: summary.matchesPlayed },
    { label: "Goals", value: summary.goals },
    { label: "Assists", value: summary.assists },
    { label: "Attendance Rate", value: `${summary.attendanceRate}%` },
  ];

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-[32px] px-6 py-7 sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          Player Detail
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-secondary">
          {player.fullName}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {player.position || "Squad member"} · {player.level || "First team"}
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => (
            <div key={card.label} className="rounded-[24px] border border-slate-200 bg-white/70 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                {card.label}
              </p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">{card.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
        <div className="glass-panel rounded-[32px] p-6">
          <h2 className="text-xl font-semibold text-secondary">Recent Match Contributions</h2>
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-white/70">
                <tr className="text-left text-xs uppercase tracking-[0.14em] text-slate-500">
                  <th className="px-4 py-3 font-semibold">Match</th>
                  <th className="px-4 py-3 font-semibold">Result</th>
                  <th className="px-4 py-3 font-semibold">Goals</th>
                  <th className="px-4 py-3 font-semibold">Assists</th>
                  <th className="px-4 py-3 font-semibold">Minutes</th>
                  <th className="px-4 py-3 font-semibold">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white/60">
                {matchContributions.length > 0 ? (
                  matchContributions.map((contribution) => (
                    <tr key={contribution.matchId}>
                      <td className="px-4 py-3">
                        <p className="text-sm font-semibold text-slate-900">
                          {contribution.matchTitle}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {contribution.scoreline}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        {contribution.result}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        {contribution.goals}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        {contribution.assists}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        {contribution.minutesPlayed}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        {contribution.rating || "0.0"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-10 text-center text-sm text-slate-500"
                    >
                      No match contribution data has been recorded yet for this player.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-panel rounded-[32px] p-6">
          <h2 className="text-xl font-semibold text-secondary">Attendance History</h2>
          <div className="mt-5 space-y-3">
            {attendanceHistory.length > 0 ? (
              attendanceHistory.map(({ record, session }) => (
                <div
                  key={record.id}
                  className="rounded-[24px] border border-slate-200 bg-white/70 px-4 py-4"
                >
                  <p className="text-sm font-semibold text-slate-900">
                    {session?.title || "Training Session"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {session?.sessionDate || "Date not available"} · {session?.venue || "Venue not set"}
                  </p>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
                    {record.status}
                  </p>
                  {record.notes ? (
                    <p className="mt-2 text-xs text-slate-500">{record.notes}</p>
                  ) : null}
                </div>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-slate-300 bg-white/60 px-4 py-10 text-center text-sm text-slate-500">
                Attendance history will show up after sessions are marked.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
