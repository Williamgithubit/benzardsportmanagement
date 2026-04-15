"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { MdChecklist, MdSave, MdSportsSoccer } from "react-icons/md";
import {
  saveCoachFormation,
  saveCoachMatchPreparation,
} from "@/store/coachSlice";
import { useAppDispatch } from "@/store/store";
import type {
  FormationRecord,
  MatchPreparationRecord,
  MatchSquadRecord,
} from "@/types/coach";
import type { MatchRecord, PlayerRecord } from "@/types/sports";

interface CoachMatchesPanelProps {
  teamId: string;
  currentUserId?: string | null;
  players: PlayerRecord[];
  matches: MatchRecord[];
  squads: MatchSquadRecord[];
  formations: FormationRecord[];
  preparations: MatchPreparationRecord[];
}

const formationTemplates: Record<
  string,
  Array<{ label: string; x: number; y: number }>
> = {
  "4-3-3": [
    { label: "GK", x: 50, y: 90 },
    { label: "LB", x: 18, y: 72 },
    { label: "LCB", x: 38, y: 72 },
    { label: "RCB", x: 62, y: 72 },
    { label: "RB", x: 82, y: 72 },
    { label: "LCM", x: 28, y: 50 },
    { label: "CM", x: 50, y: 45 },
    { label: "RCM", x: 72, y: 50 },
    { label: "LW", x: 18, y: 20 },
    { label: "ST", x: 50, y: 14 },
    { label: "RW", x: 82, y: 20 },
  ],
  "4-2-3-1": [
    { label: "GK", x: 50, y: 90 },
    { label: "LB", x: 18, y: 72 },
    { label: "LCB", x: 38, y: 72 },
    { label: "RCB", x: 62, y: 72 },
    { label: "RB", x: 82, y: 72 },
    { label: "LDM", x: 38, y: 55 },
    { label: "RDM", x: 62, y: 55 },
    { label: "LAM", x: 22, y: 32 },
    { label: "CAM", x: 50, y: 28 },
    { label: "RAM", x: 78, y: 32 },
    { label: "ST", x: 50, y: 12 },
  ],
};

const isUpcomingMatch = (match: MatchRecord) =>
  match.status === "scheduled" &&
  (!match.scheduledAt || new Date(match.scheduledAt).getTime() >= Date.now());

export default function CoachMatchesPanel({
  teamId,
  currentUserId,
  players,
  matches,
  squads,
  formations,
  preparations,
}: CoachMatchesPanelProps) {
  const dispatch = useAppDispatch();
  const upcomingMatches = useMemo(
    () => matches.filter(isUpcomingMatch),
    [matches],
  );
  const [selectedMatchId, setSelectedMatchId] = useState("");
  const [shape, setShape] = useState<keyof typeof formationTemplates>("4-3-3");
  const [slots, setSlots] = useState<FormationRecord["slots"]>(
    formationTemplates["4-3-3"].map((slot) => ({
      ...slot,
      playerId: null,
    })),
  );
  const [prepForm, setPrepForm] = useState({
    squadReady: false,
    keyPlayers: [] as string[],
    opponentNotes: "",
    checklistNotes: "",
  });

  const squadMap = useMemo(
    () => new Map(squads.map((squad) => [squad.matchId, squad])),
    [squads],
  );
  const preparationMap = useMemo(
    () =>
      new Map(preparations.map((preparation) => [preparation.matchId, preparation])),
    [preparations],
  );
  const formationMap = useMemo(
    () => new Map(formations.map((formation) => [formation.matchId, formation])),
    [formations],
  );

  const selectedSquad = selectedMatchId ? squadMap.get(selectedMatchId) : undefined;
  const squadPlayers = useMemo(
    () =>
      players.filter((player) =>
        selectedSquad
          ? [...selectedSquad.startingXI, ...selectedSquad.substitutes].includes(player.id)
          : true,
      ),
    [players, selectedSquad],
  );

  useEffect(() => {
    const initialMatchId =
      selectedMatchId || upcomingMatches[0]?.id || matches[0]?.id || "";
    setSelectedMatchId(initialMatchId);
  }, [matches, selectedMatchId, upcomingMatches]);

  useEffect(() => {
    if (!selectedMatchId) {
      return;
    }

    const savedPreparation = preparationMap.get(selectedMatchId);
    setPrepForm({
      squadReady: savedPreparation?.squadReady || false,
      keyPlayers: savedPreparation?.keyPlayers || [],
      opponentNotes: savedPreparation?.opponentNotes || "",
      checklistNotes: savedPreparation?.checklistNotes || "",
    });

    const savedFormation = formationMap.get(selectedMatchId);
    if (savedFormation) {
      setShape(
        (savedFormation.shape as keyof typeof formationTemplates) || "4-3-3",
      );
      setSlots(savedFormation.slots);
      return;
    }

    const nextTemplate = formationTemplates[shape].map((slot, index) => ({
      ...slot,
      playerId: selectedSquad?.startingXI[index] || null,
    }));
    setSlots(nextTemplate);
  }, [formationMap, preparationMap, selectedMatchId, selectedSquad, shape]);

  const handleFormationShapeChange = (
    nextShape: keyof typeof formationTemplates,
  ) => {
    setShape(nextShape);
    setSlots(
      formationTemplates[nextShape].map((slot, index) => ({
        ...slot,
        playerId: selectedSquad?.startingXI[index] || null,
      })),
    );
  };

  const handleSavePreparation = async () => {
    if (!selectedMatchId) {
      toast.error("Choose a match before saving preparation notes.");
      return;
    }

    try {
      await dispatch(
        saveCoachMatchPreparation({
          teamId,
          matchId: selectedMatchId,
          squadReady: prepForm.squadReady,
          keyPlayers: prepForm.keyPlayers,
          opponentNotes: prepForm.opponentNotes,
          checklistNotes: prepForm.checklistNotes || null,
          createdBy: currentUserId || null,
        }),
      ).unwrap();
      toast.success("Match preparation saved.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to save match preparation.",
      );
    }
  };

  const handleSaveFormation = async () => {
    if (!selectedMatchId) {
      toast.error("Choose a match before saving a formation.");
      return;
    }

    try {
      await dispatch(
        saveCoachFormation({
          teamId,
          name: `${shape} match plan`,
          shape,
          matchId: selectedMatchId,
          slots,
          notes: prepForm.checklistNotes || null,
          createdBy: currentUserId || null,
        }),
      ).unwrap();
      toast.success("Formation saved.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to save formation.",
      );
    }
  };

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-[32px] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
              <MdSportsSoccer size={14} />
              Match Preparation
            </span>
            <h2 className="mt-4 text-2xl font-semibold text-secondary">
              Checklist, tactical board, and saved formations
            </h2>
            <p className="mt-2 text-sm leading-7 text-slate-500">
              Finalize squad readiness, identify key players, add opponent notes, and save a simple field arrangement for the fixture.
            </p>
          </div>

          <label className="rounded-[24px] border border-white/70 bg-white/80 p-4">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Match
            </span>
            <select
              value={selectedMatchId}
              onChange={(event) => setSelectedMatchId(event.target.value)}
              className="mt-3 w-full bg-transparent text-sm font-medium text-slate-800 outline-none"
            >
              <option value="">Select a match</option>
              {upcomingMatches.map((match) => (
                <option key={match.id} value={match.id}>
                  {match.title}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="glass-panel rounded-[32px] p-6">
          <div className="flex items-center gap-2">
            <MdChecklist className="text-emerald-600" size={22} />
            <h3 className="text-xl font-semibold text-secondary">Pre-match Checklist</h3>
          </div>

          <div className="mt-5 space-y-4">
            <label className="flex items-center gap-3 rounded-[24px] border border-white/70 bg-white/80 px-4 py-4">
              <input
                type="checkbox"
                checked={prepForm.squadReady}
                onChange={(event) =>
                  setPrepForm((current) => ({
                    ...current,
                    squadReady: event.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm font-medium text-slate-800">
                Squad ready
              </span>
            </label>

            <label className="rounded-[24px] border border-white/70 bg-white/80 p-4">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Key Players
              </span>
              <select
                multiple
                value={prepForm.keyPlayers}
                onChange={(event) =>
                  setPrepForm((current) => ({
                    ...current,
                    keyPlayers: Array.from(event.target.selectedOptions).map(
                      (option) => option.value,
                    ),
                  }))
                }
                className="mt-3 min-h-28 w-full bg-transparent text-sm text-slate-800 outline-none"
              >
                {squadPlayers.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.fullName}
                  </option>
                ))}
              </select>
            </label>

            <label className="rounded-[24px] border border-white/70 bg-white/80 p-4">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Opponent Notes
              </span>
              <textarea
                rows={4}
                value={prepForm.opponentNotes}
                onChange={(event) =>
                  setPrepForm((current) => ({
                    ...current,
                    opponentNotes: event.target.value,
                  }))
                }
                className="mt-3 w-full resize-none bg-transparent text-sm leading-6 text-slate-700 outline-none"
                placeholder="Pressing traps, set-piece tendencies, transition risks, and focus points."
              />
            </label>

            <label className="rounded-[24px] border border-white/70 bg-white/80 p-4">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Checklist Notes
              </span>
              <textarea
                rows={3}
                value={prepForm.checklistNotes}
                onChange={(event) =>
                  setPrepForm((current) => ({
                    ...current,
                    checklistNotes: event.target.value,
                  }))
                }
                className="mt-3 w-full resize-none bg-transparent text-sm leading-6 text-slate-700 outline-none"
                placeholder="Travel notes, warm-up sequence, or last-minute reminders."
              />
            </label>
          </div>

          <button
            type="button"
            onClick={() => void handleSavePreparation()}
            className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            <MdSave size={18} />
            Save Checklist
          </button>
        </div>

        <div className="glass-panel rounded-[32px] p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-xl font-semibold text-secondary">Tactical Board</h3>
              <p className="mt-1 text-sm text-slate-500">
                Arrange the current squad on the field and save a formation for this match.
              </p>
            </div>

            <select
              value={shape}
              onChange={(event) =>
                handleFormationShapeChange(
                  event.target.value as keyof typeof formationTemplates,
                )
              }
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-emerald-300 focus:outline-none"
            >
              {Object.keys(formationTemplates).map((shapeOption) => (
                <option key={shapeOption} value={shapeOption}>
                  {shapeOption}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-6 rounded-[32px] border border-emerald-200 bg-[linear-gradient(180deg,#14532d_0%,#166534_100%)] p-4">
            <div className="relative mx-auto aspect-[4/5] max-w-xl overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.16),transparent_55%)]">
              <div className="absolute inset-3 rounded-[24px] border border-white/20" />
              <div className="absolute left-1/2 top-3 h-[calc(100%-1.5rem)] w-px -translate-x-1/2 bg-white/20" />
              <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20" />
              <div className="absolute left-1/2 top-[calc(100%-5rem)] h-12 w-28 -translate-x-1/2 rounded-t-full border border-white/20 border-b-0" />
              <div className="absolute left-1/2 top-4 h-12 w-28 -translate-x-1/2 rounded-b-full border border-white/20 border-t-0" />

              {slots.map((slot, index) => (
                <div
                  key={`${slot.label}-${index}`}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
                >
                  <div className="rounded-2xl bg-white/95 px-3 py-2 text-center shadow-lg">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                      {slot.label}
                    </p>
                    <select
                      value={slot.playerId || ""}
                      onChange={(event) =>
                        setSlots((current) =>
                          current.map((currentSlot, currentIndex) =>
                            currentIndex === index
                              ? {
                                  ...currentSlot,
                                  playerId: event.target.value || null,
                                }
                              : currentSlot,
                          ),
                        )
                      }
                      className="mt-2 max-w-28 bg-transparent text-center text-xs font-semibold text-slate-800 outline-none"
                    >
                      <option value="">Select</option>
                      {squadPlayers.map((player) => (
                        <option key={player.id} value={player.id}>
                          {player.fullName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => void handleSaveFormation()}
            className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <MdSave size={18} />
            Save Formation
          </button>
        </div>
      </section>
    </div>
  );
}
