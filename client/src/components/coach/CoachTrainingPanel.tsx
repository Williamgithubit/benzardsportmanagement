"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { MdChecklist, MdFitnessCenter, MdSave } from "react-icons/md";
import {
  dashboardNeutralButtonClass,
  dashboardPrimaryButtonClass,
} from "@/components/dashboard/dashboardButtonStyles";
import {
  createCoachTrainingSession,
  saveCoachTrainingPlan,
} from "@/store/coachSlice";
import { useAppDispatch } from "@/store/store";
import type { AttendanceRecord, TrainingSessionRecord } from "@/types/sports";
import type { TrainingPlanRecord } from "@/types/coach";

interface CoachTrainingPanelProps {
  teamId: string;
  currentUserId?: string | null;
  sessions: TrainingSessionRecord[];
  attendanceRecords: AttendanceRecord[];
  trainingPlans: TrainingPlanRecord[];
}

export default function CoachTrainingPanel({
  teamId,
  currentUserId,
  sessions,
  attendanceRecords,
  trainingPlans,
}: CoachTrainingPanelProps) {
  const dispatch = useAppDispatch();
  const [sessionForm, setSessionForm] = useState({
    title: "",
    sessionDate: new Date().toISOString().slice(0, 10),
    startTime: "16:00",
    endTime: "18:00",
    venue: "",
  });
  const [planForm, setPlanForm] = useState({
    sessionId: "",
    title: "",
    description: "",
    focusArea: "fitness",
    playerEffort: 7,
    coachRating: 7,
  });

  const attendanceBySession = useMemo(
    () =>
      sessions.map((session) => {
        const relatedRecords = attendanceRecords.filter(
          (record) => record.sessionId === session.id,
        );
        return {
          sessionId: session.id,
          total: relatedRecords.length,
          present: relatedRecords.filter((record) => record.status === "present").length,
          late: relatedRecords.filter((record) => record.status === "late").length,
          absent: relatedRecords.filter((record) => record.status === "absent").length,
        };
      }),
    [attendanceRecords, sessions],
  );

  const handleCreateSession = async () => {
    if (!sessionForm.venue.trim()) {
      toast.error("Training venue is required.");
      return;
    }

    try {
      await dispatch(
        createCoachTrainingSession({
          teamId,
          title: sessionForm.title || "Training Session",
          sessionDate: sessionForm.sessionDate,
          startTime: sessionForm.startTime,
          endTime: sessionForm.endTime || null,
          venue: sessionForm.venue,
          createdBy: currentUserId || null,
        }),
      ).unwrap();
      toast.success("Training session created.");
      setSessionForm((current) => ({
        ...current,
        title: "",
        venue: "",
      }));
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to create the training session.",
      );
    }
  };

  const handleSavePlan = async () => {
    if (!planForm.title.trim()) {
      toast.error("Plan title is required.");
      return;
    }

    try {
      await dispatch(
        saveCoachTrainingPlan({
          teamId,
          sessionId: planForm.sessionId || null,
          title: planForm.title,
          description: planForm.description,
          focusArea: planForm.focusArea,
          playerEffort: planForm.playerEffort,
          coachRating: planForm.coachRating,
          createdBy: currentUserId || null,
        }),
      ).unwrap();
      toast.success("Training plan saved.");
      setPlanForm({
        sessionId: "",
        title: "",
        description: "",
        focusArea: "fitness",
        playerEffort: 7,
        coachRating: 7,
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to save the training plan.",
      );
    }
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="glass-panel rounded-[32px] p-6">
          <div className="flex items-center gap-2">
            <MdFitnessCenter className="text-emerald-600" size={22} />
            <h2 className="text-2xl font-semibold text-secondary">Training Sessions</h2>
          </div>
          <p className="mt-2 text-sm leading-7 text-slate-500">
            Review existing sessions from the attendance module and add new ones when the squad schedule shifts.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="rounded-[24px] border border-white/70 bg-white/80 p-4">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Title
              </span>
              <input
                type="text"
                value={sessionForm.title}
                onChange={(event) =>
                  setSessionForm((current) => ({ ...current, title: event.target.value }))
                }
                className="mt-3 w-full bg-transparent text-sm text-slate-800 outline-none"
                placeholder="High-intensity recovery"
              />
            </label>

            <label className="rounded-[24px] border border-white/70 bg-white/80 p-4">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Venue
              </span>
              <input
                type="text"
                value={sessionForm.venue}
                onChange={(event) =>
                  setSessionForm((current) => ({ ...current, venue: event.target.value }))
                }
                className="mt-3 w-full bg-transparent text-sm text-slate-800 outline-none"
                placeholder="Main training pitch"
              />
            </label>

            <label className="rounded-[24px] border border-white/70 bg-white/80 p-4">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Session Date
              </span>
              <input
                type="date"
                value={sessionForm.sessionDate}
                onChange={(event) =>
                  setSessionForm((current) => ({ ...current, sessionDate: event.target.value }))
                }
                className="mt-3 w-full bg-transparent text-sm text-slate-800 outline-none"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="rounded-[24px] border border-white/70 bg-white/80 p-4">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Start
                </span>
                <input
                  type="time"
                  value={sessionForm.startTime}
                  onChange={(event) =>
                    setSessionForm((current) => ({ ...current, startTime: event.target.value }))
                  }
                  className="mt-3 w-full bg-transparent text-sm text-slate-800 outline-none"
                />
              </label>

              <label className="rounded-[24px] border border-white/70 bg-white/80 p-4">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  End
                </span>
                <input
                  type="time"
                  value={sessionForm.endTime}
                  onChange={(event) =>
                    setSessionForm((current) => ({ ...current, endTime: event.target.value }))
                  }
                  className="mt-3 w-full bg-transparent text-sm text-slate-800 outline-none"
                />
              </label>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void handleCreateSession()}
            className={`mt-5 ${dashboardPrimaryButtonClass}`}
          >
            <MdSave size={18} />
            Add Training Session
          </button>

          <div className="mt-6 space-y-3">
            {sessions.length > 0 ? (
              sessions.map((session) => {
                const attendance = attendanceBySession.find(
                  (item) => item.sessionId === session.id,
                );
                return (
                  <div
                    key={session.id}
                    className="rounded-[24px] border border-slate-200 bg-white/70 px-4 py-4"
                  >
                    <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {session.title}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {session.sessionDate} · {session.startTime} · {session.venue}
                        </p>
                      </div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                        {attendance?.present || 0} present · {attendance?.absent || 0} absent
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-[24px] border border-dashed border-slate-300 bg-white/60 px-4 py-10 text-center text-sm text-slate-500">
                No training sessions have been created yet.
              </div>
            )}
          </div>
        </div>

        <div className="glass-panel rounded-[32px] p-6">
          <div className="flex items-center gap-2">
            <MdChecklist className="text-emerald-600" size={22} />
            <h3 className="text-2xl font-semibold text-secondary">Training Plans</h3>
          </div>
          <p className="mt-2 text-sm leading-7 text-slate-500">
            Add focus areas, session objectives, player effort, and coach rating in one place.
          </p>

          <div className="mt-6 grid gap-4">
            <label className="rounded-[24px] border border-white/70 bg-white/80 p-4">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Link to Session
              </span>
              <select
                value={planForm.sessionId}
                onChange={(event) =>
                  setPlanForm((current) => ({ ...current, sessionId: event.target.value }))
                }
                className="mt-3 w-full bg-transparent text-sm text-slate-800 outline-none"
              >
                <option value="">Standalone plan</option>
                {sessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="rounded-[24px] border border-white/70 bg-white/80 p-4">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Title
              </span>
              <input
                type="text"
                value={planForm.title}
                onChange={(event) =>
                  setPlanForm((current) => ({ ...current, title: event.target.value }))
                }
                className="mt-3 w-full bg-transparent text-sm text-slate-800 outline-none"
                placeholder="Pressing drills and transition work"
              />
            </label>

            <label className="rounded-[24px] border border-white/70 bg-white/80 p-4">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Focus Area
              </span>
              <select
                value={planForm.focusArea}
                onChange={(event) =>
                  setPlanForm((current) => ({ ...current, focusArea: event.target.value }))
                }
                className="mt-3 w-full bg-transparent text-sm text-slate-800 outline-none"
              >
                <option value="fitness">Fitness</option>
                <option value="tactics">Tactics</option>
                <option value="technical">Technical</option>
                <option value="recovery">Recovery</option>
              </select>
            </label>

            <label className="rounded-[24px] border border-white/70 bg-white/80 p-4">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Description
              </span>
              <textarea
                rows={4}
                value={planForm.description}
                onChange={(event) =>
                  setPlanForm((current) => ({ ...current, description: event.target.value }))
                }
                className="mt-3 w-full resize-none bg-transparent text-sm leading-6 text-slate-700 outline-none"
                placeholder="Detail the goals, blocks, and coaching emphasis for this session."
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="rounded-[24px] border border-white/70 bg-white/80 p-4">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Player Effort
                </span>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={planForm.playerEffort}
                  onChange={(event) =>
                    setPlanForm((current) => ({
                      ...current,
                      playerEffort: Number(event.target.value || 0),
                    }))
                  }
                  className="mt-3 w-full bg-transparent text-sm text-slate-800 outline-none"
                />
              </label>

              <label className="rounded-[24px] border border-white/70 bg-white/80 p-4">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Coach Rating
                </span>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={planForm.coachRating}
                  onChange={(event) =>
                    setPlanForm((current) => ({
                      ...current,
                      coachRating: Number(event.target.value || 0),
                    }))
                  }
                  className="mt-3 w-full bg-transparent text-sm text-slate-800 outline-none"
                />
              </label>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void handleSavePlan()}
            className={`mt-5 ${dashboardNeutralButtonClass}`}
          >
            <MdSave size={18} />
            Save Training Plan
          </button>

          <div className="mt-6 space-y-3">
            {trainingPlans.length > 0 ? (
              trainingPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="rounded-[24px] border border-slate-200 bg-white/70 px-4 py-4"
                >
                  <p className="text-sm font-semibold text-slate-900">
                    {plan.title}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {plan.focusArea} · Effort {plan.playerEffort || "-"} · Coach rating {plan.coachRating || "-"}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {plan.description || "No detailed session description yet."}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-slate-300 bg-white/60 px-4 py-10 text-center text-sm text-slate-500">
                No training plans have been saved yet.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
