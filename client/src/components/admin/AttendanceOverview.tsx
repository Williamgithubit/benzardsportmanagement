"use client";

import { useEffect, useMemo, useState } from "react";
import { MdSearch } from "react-icons/md";
import useSportsRealtimeData from "@/hooks/useSportsRealtimeData";
import { buildPlayerAttendanceHistory } from "@/services/attendanceService";
import { Skeleton } from "@/components/ui/Skeleton";

export default function AttendanceOverview() {
  const {
    players,
    sessions,
    attendanceRecords,
    attendanceAnalytics,
    loading,
    error,
  } = useSportsRealtimeData();
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!selectedSessionId && sessions[0]?.id) {
      setSelectedSessionId(sessions[0].id);
    }
  }, [selectedSessionId, sessions]);

  useEffect(() => {
    if (!selectedPlayerId && players[0]?.id) {
      setSelectedPlayerId(players[0].id);
    }
  }, [players, selectedPlayerId]);

  const sessionStats = attendanceAnalytics.sessionBreakdown.find(
    (entry) => entry.sessionId === selectedSessionId,
  );
  const selectedPlayer = players.find((player) => player.id === selectedPlayerId);
  const playerHistory = selectedPlayerId
    ? buildPlayerAttendanceHistory(selectedPlayerId, sessions, attendanceRecords)
    : [];

  const filteredPlayers = useMemo(
    () =>
      attendanceAnalytics.byPlayer.filter((summary) =>
        summary.playerName.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [attendanceAnalytics.byPlayer, searchTerm],
  );

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Header skeleton */}
        <section className="glass-panel rounded-[32px] p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="space-y-3">
              <Skeleton className="h-8 w-56" />
              <Skeleton className="h-4 w-full max-w-md" />
            </div>
            <Skeleton className="h-12 w-72 rounded-2xl" />
          </div>
        </section>

        {/* Stats cards skeleton */}
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="glass-panel rounded-[28px] p-5">
              <Skeleton className="h-3 w-28 rounded-full" />
              <Skeleton className="mt-4 h-9 w-24" />
            </div>
          ))}
        </section>

        {/* Main content skeleton */}
        <section className="grid gap-6 xl:grid-cols-[1.1fr_1.2fr]">
          <div className="space-y-6">
            {/* Session breakdown skeleton */}
            <div className="glass-panel rounded-[32px] p-6">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="mt-1 h-4 w-72" />
              <div className="mt-5 space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="rounded-[24px] border border-slate-200 bg-white/70 px-4 py-4">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="mt-2 h-3 w-56" />
                    <Skeleton className="mt-3 h-3 w-28 rounded-full" />
                  </div>
                ))}
              </div>
            </div>

            {/* Selected session skeleton */}
            <div className="glass-panel rounded-[32px] p-6">
              <Skeleton className="h-7 w-40" />
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="rounded-[24px] border border-slate-200 bg-white/70 px-4 py-4">
                    <Skeleton className="h-2.5 w-16 rounded-full" />
                    <Skeleton className="mt-3 h-9 w-14" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Player history skeleton */}
            <div className="glass-panel rounded-[32px] p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-7 w-56" />
                  <Skeleton className="h-4 w-72" />
                </div>
                <Skeleton className="h-12 w-48 rounded-2xl" />
              </div>
              <div className="mt-5 space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="rounded-[24px] border border-slate-200 bg-white/70 px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-56" />
                      </div>
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Consistency table skeleton */}
            <div className="glass-panel rounded-[32px] p-6">
              <Skeleton className="h-7 w-52" />
              <div className="mt-5 space-y-0">
                <div className="flex gap-4 border-b border-slate-200 py-3">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className="h-3 flex-1 rounded-full" />
                  ))}
                </div>
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="flex gap-4 border-b border-slate-100 py-3 last:border-0">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <Skeleton key={j} className="h-4 flex-1" />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-[32px] p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-secondary">Attendance Overview</h2>
            <p className="mt-2 text-sm text-slate-500">
              Read-only visibility into session attendance, player history, and consistency trends.
            </p>
          </div>

          <label className="relative">
            <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-700 shadow-sm focus:border-secondary/30 focus:outline-none sm:w-72"
              placeholder="Search attendance records"
            />
          </label>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="glass-panel rounded-[28px] p-5">
          <p className="text-sm font-semibold text-slate-500">Attendance Rate</p>
          <p className="mt-4 text-3xl font-semibold text-slate-900">
            {attendanceAnalytics.overallAttendanceRate}%
          </p>
        </div>
        <div className="glass-panel rounded-[28px] p-5">
          <p className="text-sm font-semibold text-slate-500">Training Sessions</p>
          <p className="mt-4 text-3xl font-semibold text-slate-900">
            {attendanceAnalytics.totalSessions}
          </p>
        </div>
        <div className="glass-panel rounded-[28px] p-5">
          <p className="text-sm font-semibold text-slate-500">Frequent Absentees</p>
          <p className="mt-4 text-sm text-slate-700">
            {attendanceAnalytics.frequentAbsentees
              .slice(0, 2)
              .map((summary) => `${summary.playerName} (${summary.absentCount})`)
              .join(", ") || "No repeat absences yet"}
          </p>
        </div>
        <div className="glass-panel rounded-[28px] p-5">
          <p className="text-sm font-semibold text-slate-500">Most Consistent</p>
          <p className="mt-4 text-sm text-slate-700">
            {attendanceAnalytics.mostConsistentPlayers
              .slice(0, 2)
              .map((summary) => `${summary.playerName} (${summary.attendanceRate}%)`)
              .join(", ") || "No attendance history yet"}
          </p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_1.2fr]">
        <div className="space-y-6">
          <div className="glass-panel rounded-[32px] p-6">
            <h3 className="text-xl font-semibold text-secondary">Session Breakdown</h3>
            <p className="mt-1 text-sm text-slate-500">
              Review the current attendance split for each recorded session.
            </p>

            <div className="mt-5 space-y-3">
              {attendanceAnalytics.sessionBreakdown.length > 0 ? (
                attendanceAnalytics.sessionBreakdown.map((session) => (
                  <button
                    key={session.sessionId}
                    type="button"
                    onClick={() => setSelectedSessionId(session.sessionId)}
                    className={`w-full rounded-[24px] border px-4 py-4 text-left transition ${
                      selectedSessionId === session.sessionId
                        ? "border-primary/40 bg-primary/5"
                        : "border-slate-200 bg-white/70 hover:border-secondary/20"
                    }`}
                  >
                    <p className="text-sm font-semibold text-slate-900">{session.title}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {session.sessionDate} · {session.venue}
                    </p>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
                      {session.attendanceRate}% attendance
                    </p>
                  </button>
                ))
              ) : (
                <div className="rounded-[24px] border border-dashed border-slate-300 bg-white/60 px-4 py-10 text-center text-sm text-slate-500">
                  Session attendance summaries will appear here once training sessions are logged.
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel rounded-[32px] p-6">
            <h3 className="text-xl font-semibold text-secondary">Selected Session</h3>
            {sessionStats ? (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[24px] border border-slate-200 bg-white/70 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Present
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-slate-900">
                    {sessionStats.presentCount}
                  </p>
                </div>
                <div className="rounded-[24px] border border-slate-200 bg-white/70 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Late
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-slate-900">
                    {sessionStats.lateCount}
                  </p>
                </div>
                <div className="rounded-[24px] border border-slate-200 bg-white/70 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Absent
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-slate-900">
                    {sessionStats.absentCount}
                  </p>
                </div>
                <div className="rounded-[24px] border border-slate-200 bg-white/70 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Excused
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-slate-900">
                    {sessionStats.excusedCount}
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-5 rounded-[24px] border border-dashed border-slate-300 bg-white/60 px-4 py-10 text-center text-sm text-slate-500">
                Select a session to inspect its attendance split.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-panel rounded-[32px] p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-xl font-semibold text-secondary">Player Attendance History</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Read through a single player&apos;s session-by-session attendance trail.
                </p>
              </div>

              <select
                value={selectedPlayerId}
                onChange={(event) => setSelectedPlayerId(event.target.value)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-secondary/30 focus:outline-none"
              >
                <option value="">Select player</option>
                {players.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.fullName}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-5 space-y-3">
              {selectedPlayer && playerHistory.length > 0 ? (
                playerHistory.map(({ record, session }) => (
                  <div
                    key={record.id}
                    className="rounded-[24px] border border-slate-200 bg-white/70 px-4 py-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {session?.title || "Training Session"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {session?.sessionDate || "Date not available"} · {session?.venue || "Venue not set"}
                        </p>
                      </div>
                      <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">
                        {record.status}
                      </span>
                    </div>
                    {record.notes ? (
                      <p className="mt-3 text-sm text-slate-500">{record.notes}</p>
                    ) : null}
                  </div>
                ))
              ) : (
                <div className="rounded-[24px] border border-dashed border-slate-300 bg-white/60 px-4 py-10 text-center text-sm text-slate-500">
                  Select a player to review their attendance history.
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel rounded-[32px] p-6">
            <h3 className="text-xl font-semibold text-secondary">Player Consistency Table</h3>
            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-white/70">
                  <tr className="text-left text-xs uppercase tracking-[0.14em] text-slate-500">
                    <th className="px-4 py-3 font-semibold">Player</th>
                    <th className="px-4 py-3 font-semibold">Tracked</th>
                    <th className="px-4 py-3 font-semibold">Absent</th>
                    <th className="px-4 py-3 font-semibold">Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white/60">
                  {filteredPlayers.length > 0 ? (
                    filteredPlayers.map((summary) => (
                      <tr key={summary.playerId}>
                        <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                          {summary.playerName}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">
                          {summary.sessionsTracked}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">
                          {summary.absentCount}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-secondary">
                          {summary.attendanceRate}%
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-10 text-center text-sm text-slate-500"
                      >
                        No player attendance records match the current search query.
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
