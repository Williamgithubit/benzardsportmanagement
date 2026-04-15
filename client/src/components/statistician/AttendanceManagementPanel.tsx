"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { MdDoneAll, MdEventAvailable, MdSave, MdSearch } from "react-icons/md";
import { createTrainingSession, saveAttendanceSheet } from "@/store/attendanceSlice";
import { useAppDispatch } from "@/store/store";
import type {
  AttendanceAnalytics,
  AttendanceRecord,
  AttendanceStatus,
  PlayerRecord,
  TrainingSessionRecord,
} from "@/types/sports";

interface AttendanceManagementPanelProps {
  players: PlayerRecord[];
  sessions: TrainingSessionRecord[];
  attendanceRecords: AttendanceRecord[];
  attendanceAnalytics: AttendanceAnalytics;
  currentUserId?: string | null;
}

interface AttendanceDraftState {
  status?: AttendanceStatus;
  arrivalTime?: string;
  notes?: string;
}

const todayIso = new Date().toISOString().slice(0, 10);
const currentTime = new Date().toTimeString().slice(0, 5);

const toTimeInput = (value?: string | null) =>
  value ? new Date(value).toISOString().slice(11, 16) : "";

export default function AttendanceManagementPanel({
  players,
  sessions,
  attendanceRecords,
  attendanceAnalytics,
  currentUserId,
}: AttendanceManagementPanelProps) {
  const dispatch = useAppDispatch();
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [creatingSession, setCreatingSession] = useState(false);
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [sessionForm, setSessionForm] = useState({
    title: "",
    sessionDate: todayIso,
    startTime: currentTime,
    endTime: "",
    venue: "",
    gracePeriodMinutes: "15",
  });
  const [drafts, setDrafts] = useState<Record<string, AttendanceDraftState>>({});

  useEffect(() => {
    if (!selectedSessionId && sessions[0]?.id) {
      setSelectedSessionId(sessions[0].id);
    }
  }, [selectedSessionId, sessions]);

  const selectedSession = useMemo(
    () => sessions.find((session) => session.id === selectedSessionId) || null,
    [selectedSessionId, sessions],
  );

  const sessionRecordsMap = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    attendanceRecords
      .filter((record) => record.sessionId === selectedSessionId)
      .forEach((record) => {
        map.set(record.playerId, record);
      });
    return map;
  }, [attendanceRecords, selectedSessionId]);

  useEffect(() => {
    if (!selectedSession) {
      return;
    }

    const nextDrafts: Record<string, AttendanceDraftState> = {};
    players.forEach((player) => {
      const record = sessionRecordsMap.get(player.id);
      if (!record) {
        return;
      }

      nextDrafts[player.id] = {
        status: record.status,
        arrivalTime: toTimeInput(record.manualArrivalTime || record.arrivalTime),
        notes: record.notes || "",
      };
    });

    setDrafts(nextDrafts);
  }, [players, selectedSession, sessionRecordsMap]);

  const filteredPlayers = useMemo(
    () =>
      players.filter((player) =>
        player.fullName.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [players, searchTerm],
  );

  const updateDraft = (playerId: string, next: AttendanceDraftState) => {
    setDrafts((current) => ({
      ...current,
      [playerId]: {
        ...current[playerId],
        ...next,
      },
    }));
  };

  const handleMarkAllPresent = () => {
    const nextTime = new Date().toTimeString().slice(0, 5);
    const nextDrafts = players.reduce<Record<string, AttendanceDraftState>>(
      (accumulator, player) => {
        accumulator[player.id] = {
          status: "present",
          arrivalTime: nextTime,
          notes: drafts[player.id]?.notes || "",
        };
        return accumulator;
      },
      {},
    );
    setDrafts(nextDrafts);
  };

  const handleCreateSession = async () => {
    if (!sessionForm.venue.trim()) {
      toast.error("Venue is required.");
      return;
    }

    try {
      setCreatingSession(true);
      await dispatch(
        createTrainingSession({
          title: sessionForm.title.trim() || undefined,
          sessionDate: sessionForm.sessionDate,
          startTime: sessionForm.startTime,
          endTime: sessionForm.endTime || undefined,
          venue: sessionForm.venue,
          gracePeriodMinutes: Number(sessionForm.gracePeriodMinutes) || 15,
          createdBy: currentUserId,
        }),
      ).unwrap();
      setSessionForm({
        title: "",
        sessionDate: todayIso,
        startTime: currentTime,
        endTime: "",
        venue: "",
        gracePeriodMinutes: "15",
      });
      setShowSessionForm(false);
      toast.success("Training session created.");
    } catch (error) {
      console.error("Failed to create training session:", error);
      toast.error("Unable to create this session.");
    } finally {
      setCreatingSession(false);
    }
  };

  const handleSaveAttendance = async () => {
    if (!selectedSession) {
      toast.error("Select a session first.");
      return;
    }

    const recordsToSave = players.reduce<
      Array<{
        playerId: string;
        status: AttendanceStatus;
        manualArrivalTime?: string;
        notes?: string;
      }>
    >((accumulator, player) => {
        const existing = sessionRecordsMap.get(player.id);
        const draft = drafts[player.id];
        const resolvedStatus = draft?.status || existing?.status;

        if (!resolvedStatus) {
          return accumulator;
        }

        accumulator.push({
          playerId: player.id,
          status: resolvedStatus,
          manualArrivalTime:
            draft?.arrivalTime && selectedSession
              ? `${selectedSession.sessionDate}T${draft.arrivalTime}:00`
              : existing?.manualArrivalTime || existing?.arrivalTime || undefined,
          notes: draft?.notes || existing?.notes || "",
        });

        return accumulator;
      }, []);

    if (!recordsToSave.length) {
      toast.error("Mark at least one player before saving.");
      return;
    }

    try {
      setSavingAttendance(true);
      await dispatch(
        saveAttendanceSheet({
          session: selectedSession,
          records: recordsToSave,
          markedBy: currentUserId,
          playerNameMap: Object.fromEntries(
            players.map((player) => [player.id, player.fullName]),
          ),
        }),
      ).unwrap();
      toast.success("Attendance saved successfully.");
    } catch (error) {
      console.error("Failed to save attendance:", error);
      toast.error("Unable to save attendance.");
    } finally {
      setSavingAttendance(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-[32px] p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-secondary">Attendance Module</h2>
            <p className="mt-2 text-sm text-slate-500">
              Create sessions, mark attendance fast, and let late arrivals auto-classify.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setShowSessionForm((current) => !current)}
              className="inline-flex items-center gap-2 rounded-2xl bg-secondary px-4 py-3 text-sm font-semibold text-white transition hover:bg-secondary-hover"
            >
              <MdEventAvailable size={18} />
              {showSessionForm ? "Close Session Form" : "Create Session"}
            </button>
            <button
              type="button"
              onClick={handleMarkAllPresent}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-secondary/20 hover:text-secondary"
            >
              <MdDoneAll size={18} />
              Mark All Present
            </button>
            <button
              type="button"
              onClick={() => void handleSaveAttendance()}
              disabled={savingAttendance}
              className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-70"
            >
              <MdSave size={18} />
              {savingAttendance ? "Saving..." : "Save Attendance"}
            </button>
          </div>
        </div>

        {showSessionForm ? (
          <div className="mt-6 grid gap-4 rounded-[28px] border border-slate-200 bg-white/70 p-5 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-600">
              Session title
              <input
                type="text"
                value={sessionForm.title}
                onChange={(event) =>
                  setSessionForm((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-secondary/30 focus:outline-none"
                placeholder="Morning recovery"
              />
            </label>
            <label className="text-sm font-medium text-slate-600">
              Venue
              <input
                type="text"
                value={sessionForm.venue}
                onChange={(event) =>
                  setSessionForm((current) => ({
                    ...current,
                    venue: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-secondary/30 focus:outline-none"
                placeholder="Training ground"
              />
            </label>
            <label className="text-sm font-medium text-slate-600">
              Date
              <input
                type="date"
                value={sessionForm.sessionDate}
                onChange={(event) =>
                  setSessionForm((current) => ({
                    ...current,
                    sessionDate: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-secondary/30 focus:outline-none"
              />
            </label>
            <label className="text-sm font-medium text-slate-600">
              Start time
              <input
                type="time"
                value={sessionForm.startTime}
                onChange={(event) =>
                  setSessionForm((current) => ({
                    ...current,
                    startTime: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-secondary/30 focus:outline-none"
              />
            </label>
            <label className="text-sm font-medium text-slate-600">
              End time
              <input
                type="time"
                value={sessionForm.endTime}
                onChange={(event) =>
                  setSessionForm((current) => ({
                    ...current,
                    endTime: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-secondary/30 focus:outline-none"
              />
            </label>
            <label className="text-sm font-medium text-slate-600">
              Grace period (minutes)
              <input
                type="number"
                min={0}
                value={sessionForm.gracePeriodMinutes}
                onChange={(event) =>
                  setSessionForm((current) => ({
                    ...current,
                    gracePeriodMinutes: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-secondary/30 focus:outline-none"
              />
            </label>
            <div className="md:col-span-2">
              <button
                type="button"
                onClick={() => void handleCreateSession()}
                disabled={creatingSession}
                className="inline-flex items-center gap-2 rounded-2xl bg-secondary px-4 py-3 text-sm font-semibold text-white transition hover:bg-secondary-hover disabled:cursor-not-allowed disabled:opacity-70"
              >
                <MdSave size={18} />
                {creatingSession ? "Creating..." : "Save Session"}
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.45fr]">
        <div className="space-y-6">
          <div className="glass-panel rounded-[32px] p-6">
            <h3 className="text-xl font-semibold text-secondary">Session List</h3>
            <div className="mt-5 space-y-3">
              {sessions.length > 0 ? (
                sessions.map((session) => {
                  const sessionStats = attendanceAnalytics.sessionBreakdown.find(
                    (entry) => entry.sessionId === session.id,
                  );

                  return (
                    <button
                      key={session.id}
                      type="button"
                      onClick={() => setSelectedSessionId(session.id)}
                      className={`w-full rounded-[24px] border px-4 py-4 text-left transition ${
                        selectedSessionId === session.id
                          ? "border-primary/40 bg-primary/5"
                          : "border-slate-200 bg-white/70 hover:border-secondary/20"
                      }`}
                    >
                      <p className="text-sm font-semibold text-slate-900">
                        {session.title}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {session.sessionDate} · {session.startTime} · {session.venue}
                      </p>
                      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Attendance {sessionStats?.attendanceRate || 0}%
                      </p>
                    </button>
                  );
                })
              ) : (
                <div className="rounded-[24px] border border-dashed border-slate-300 bg-white/60 px-4 py-10 text-center text-sm text-slate-500">
                  Create a training session to begin taking attendance.
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel rounded-[32px] p-6">
            <h3 className="text-xl font-semibold text-secondary">Attendance Analytics</h3>
            <div className="mt-5 grid gap-3">
              <div className="rounded-[24px] border border-slate-200 bg-white/70 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Overall attendance rate
                </p>
                <p className="mt-2 text-3xl font-semibold text-secondary">
                  {attendanceAnalytics.overallAttendanceRate}%
                </p>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-white/70 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Frequent absentees
                </p>
                <p className="mt-2 text-sm text-slate-700">
                  {attendanceAnalytics.frequentAbsentees
                    .slice(0, 3)
                    .map((summary) => `${summary.playerName} (${summary.absentCount})`)
                    .join(", ") || "No absence pattern detected yet."}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-[32px] p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-xl font-semibold text-secondary">Attendance Sheet</h3>
              <p className="mt-1 text-sm text-slate-500">
                Mark each player present, absent, late, or excused for the selected session.
              </p>
            </div>

            <label className="relative">
              <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-700 shadow-sm focus:border-secondary/30 focus:outline-none sm:w-72"
                placeholder="Search squad"
              />
            </label>
          </div>

          {selectedSession ? (
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-white/70">
                  <tr className="text-left text-xs uppercase tracking-[0.14em] text-slate-500">
                    <th className="px-4 py-3 font-semibold">Player</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Arrival time</th>
                    <th className="px-4 py-3 font-semibold">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white/60">
                  {filteredPlayers.map((player) => {
                    const existing = sessionRecordsMap.get(player.id);
                    const draft = drafts[player.id] || {};

                    return (
                      <tr key={player.id}>
                        <td className="px-4 py-4">
                          <p className="text-sm font-semibold text-slate-900">
                            {player.fullName}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {player.position || "Squad member"}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <select
                            value={draft.status || existing?.status || ""}
                            onChange={(event) =>
                              updateDraft(player.id, {
                                status: event.target.value as AttendanceStatus,
                              })
                            }
                            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-secondary/30 focus:outline-none"
                          >
                            <option value="">Select</option>
                            <option value="present">Present</option>
                            <option value="absent">Absent</option>
                            <option value="late">Late</option>
                            <option value="excused">Excused</option>
                          </select>
                        </td>
                        <td className="px-4 py-4">
                          <input
                            type="time"
                            value={draft.arrivalTime || ""}
                            onChange={(event) =>
                              updateDraft(player.id, {
                                arrivalTime: event.target.value,
                              })
                            }
                            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-secondary/30 focus:outline-none"
                          />
                        </td>
                        <td className="px-4 py-4">
                          <input
                            type="text"
                            value={draft.notes || existing?.notes || ""}
                            onChange={(event) =>
                              updateDraft(player.id, {
                                notes: event.target.value,
                              })
                            }
                            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-secondary/30 focus:outline-none"
                            placeholder="Injury, travel, reason..."
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mt-6 rounded-[24px] border border-dashed border-slate-300 bg-white/60 px-4 py-10 text-center text-sm text-slate-500">
              Select a session to begin marking attendance.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
