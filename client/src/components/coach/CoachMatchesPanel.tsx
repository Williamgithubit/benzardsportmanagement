"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  MdChecklist,
  MdDragIndicator,
  MdRefresh,
  MdSave,
  MdSportsSoccer,
} from "react-icons/md";
import {
  dashboardNeutralButtonClass,
  dashboardPrimaryButtonClass,
} from "@/components/dashboard/dashboardButtonStyles";
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

interface FormationTemplate {
  shape: string;
  summary: string;
  slots: Array<{ label: string; x: number; y: number }>;
}

interface FormationGroup {
  id: string;
  title: string;
  description: string;
  formations: FormationTemplate[];
}

const formationGroups: FormationGroup[] = [
  {
    id: "back-four-balanced",
    title: "Back Four Basics",
    description: "Balanced shapes for most match plans and in-game tweaks.",
    formations: [
      {
        shape: "4-3-3",
        summary: "Width up front with a stable midfield triangle.",
        slots: [
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
      },
      {
        shape: "4-4-2",
        summary: "Traditional two-bank structure with dual strikers.",
        slots: [
          { label: "GK", x: 50, y: 90 },
          { label: "LB", x: 18, y: 72 },
          { label: "LCB", x: 38, y: 72 },
          { label: "RCB", x: 62, y: 72 },
          { label: "RB", x: 82, y: 72 },
          { label: "LM", x: 16, y: 48 },
          { label: "LCM", x: 38, y: 50 },
          { label: "RCM", x: 62, y: 50 },
          { label: "RM", x: 84, y: 48 },
          { label: "LS", x: 38, y: 18 },
          { label: "RS", x: 62, y: 18 },
        ],
      },
      {
        shape: "4-2-3-1",
        summary: "Double pivot behind a creative line of three.",
        slots: [
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
      },
    ],
  },
  {
    id: "control-midfield",
    title: "Midfield Control",
    description: "Shapes for possession, rhythm, and compact central coverage.",
    formations: [
      {
        shape: "4-1-4-1",
        summary: "Single holder protecting a disciplined midfield line.",
        slots: [
          { label: "GK", x: 50, y: 90 },
          { label: "LB", x: 18, y: 72 },
          { label: "LCB", x: 38, y: 72 },
          { label: "RCB", x: 62, y: 72 },
          { label: "RB", x: 82, y: 72 },
          { label: "DM", x: 50, y: 58 },
          { label: "LM", x: 18, y: 40 },
          { label: "LCM", x: 38, y: 42 },
          { label: "RCM", x: 62, y: 42 },
          { label: "RM", x: 82, y: 40 },
          { label: "ST", x: 50, y: 16 },
        ],
      },
      {
        shape: "4-3-1-2",
        summary: "Narrow diamond support behind two forwards.",
        slots: [
          { label: "GK", x: 50, y: 90 },
          { label: "LB", x: 18, y: 72 },
          { label: "LCB", x: 38, y: 72 },
          { label: "RCB", x: 62, y: 72 },
          { label: "RB", x: 82, y: 72 },
          { label: "L8", x: 28, y: 48 },
          { label: "DM", x: 50, y: 58 },
          { label: "R8", x: 72, y: 48 },
          { label: "CAM", x: 50, y: 30 },
          { label: "LS", x: 38, y: 14 },
          { label: "RS", x: 62, y: 14 },
        ],
      },
      {
        shape: "4-4-2 Diamond",
        summary: "Compact diamond with a 10 and twin strikers.",
        slots: [
          { label: "GK", x: 50, y: 90 },
          { label: "LB", x: 18, y: 72 },
          { label: "LCB", x: 38, y: 72 },
          { label: "RCB", x: 62, y: 72 },
          { label: "RB", x: 82, y: 72 },
          { label: "LM", x: 26, y: 44 },
          { label: "DM", x: 50, y: 56 },
          { label: "RM", x: 74, y: 44 },
          { label: "CAM", x: 50, y: 32 },
          { label: "LS", x: 38, y: 14 },
          { label: "RS", x: 62, y: 14 },
        ],
      },
    ],
  },
  {
    id: "three-at-back",
    title: "Three At The Back",
    description: "Wing-back systems for aggressive width and overloads.",
    formations: [
      {
        shape: "3-5-2",
        summary: "Wing-backs plus a strong central midfield box.",
        slots: [
          { label: "GK", x: 50, y: 90 },
          { label: "LCB", x: 28, y: 74 },
          { label: "CB", x: 50, y: 70 },
          { label: "RCB", x: 72, y: 74 },
          { label: "LWB", x: 12, y: 48 },
          { label: "LCM", x: 34, y: 46 },
          { label: "CM", x: 50, y: 40 },
          { label: "RCM", x: 66, y: 46 },
          { label: "RWB", x: 88, y: 48 },
          { label: "LS", x: 40, y: 16 },
          { label: "RS", x: 60, y: 16 },
        ],
      },
      {
        shape: "3-4-3",
        summary: "Front-three pressure with wing-back support.",
        slots: [
          { label: "GK", x: 50, y: 90 },
          { label: "LCB", x: 28, y: 74 },
          { label: "CB", x: 50, y: 70 },
          { label: "RCB", x: 72, y: 74 },
          { label: "LWB", x: 16, y: 48 },
          { label: "LCM", x: 40, y: 46 },
          { label: "RCM", x: 60, y: 46 },
          { label: "RWB", x: 84, y: 48 },
          { label: "LW", x: 18, y: 18 },
          { label: "ST", x: 50, y: 12 },
          { label: "RW", x: 82, y: 18 },
        ],
      },
      {
        shape: "3-4-1-2",
        summary: "Wing-backs and a central creator behind a pair.",
        slots: [
          { label: "GK", x: 50, y: 90 },
          { label: "LCB", x: 28, y: 74 },
          { label: "CB", x: 50, y: 70 },
          { label: "RCB", x: 72, y: 74 },
          { label: "LWB", x: 16, y: 48 },
          { label: "LCM", x: 40, y: 46 },
          { label: "RCM", x: 60, y: 46 },
          { label: "RWB", x: 84, y: 48 },
          { label: "CAM", x: 50, y: 28 },
          { label: "LS", x: 40, y: 14 },
          { label: "RS", x: 60, y: 14 },
        ],
      },
    ],
  },
  {
    id: "protect-the-lead",
    title: "Protect The Lead",
    description: "Compact shapes for game management and defensive control.",
    formations: [
      {
        shape: "4-5-1",
        summary: "Crowd midfield and screen the back line.",
        slots: [
          { label: "GK", x: 50, y: 90 },
          { label: "LB", x: 18, y: 72 },
          { label: "LCB", x: 38, y: 72 },
          { label: "RCB", x: 62, y: 72 },
          { label: "RB", x: 82, y: 72 },
          { label: "LM", x: 16, y: 44 },
          { label: "LCM", x: 34, y: 48 },
          { label: "CM", x: 50, y: 42 },
          { label: "RCM", x: 66, y: 48 },
          { label: "RM", x: 84, y: 44 },
          { label: "ST", x: 50, y: 16 },
        ],
      },
      {
        shape: "5-4-1",
        summary: "Low block shape with wing-backs dropping deep.",
        slots: [
          { label: "GK", x: 50, y: 90 },
          { label: "LWB", x: 10, y: 72 },
          { label: "LCB", x: 28, y: 76 },
          { label: "CB", x: 50, y: 72 },
          { label: "RCB", x: 72, y: 76 },
          { label: "RWB", x: 90, y: 72 },
          { label: "LM", x: 18, y: 46 },
          { label: "LCM", x: 38, y: 48 },
          { label: "RCM", x: 62, y: 48 },
          { label: "RM", x: 82, y: 46 },
          { label: "ST", x: 50, y: 16 },
        ],
      },
      {
        shape: "5-3-2",
        summary: "Back five plus central cover and two counter outlets.",
        slots: [
          { label: "GK", x: 50, y: 90 },
          { label: "LWB", x: 10, y: 70 },
          { label: "LCB", x: 28, y: 76 },
          { label: "CB", x: 50, y: 72 },
          { label: "RCB", x: 72, y: 76 },
          { label: "RWB", x: 90, y: 70 },
          { label: "LCM", x: 34, y: 46 },
          { label: "CM", x: 50, y: 40 },
          { label: "RCM", x: 66, y: 46 },
          { label: "LS", x: 40, y: 16 },
          { label: "RS", x: 60, y: 16 },
        ],
      },
    ],
  },
];

const formationTemplates = formationGroups.reduce<Record<string, FormationTemplate>>(
  (templates, group) => {
    group.formations.forEach((formation) => {
      templates[formation.shape] = formation;
    });

    return templates;
  },
  {},
);

const DEFAULT_SHAPE = "4-3-3";

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const buildSlotsForShape = (
  shape: string,
  playerIds: Array<string | null | undefined> = [],
): FormationRecord["slots"] => {
  const template =
    formationTemplates[shape] || formationTemplates[DEFAULT_SHAPE];

  return template.slots.map((slot, index) => ({
    ...slot,
    playerId: playerIds[index] || null,
  }));
};

const normalizeSavedSlots = (
  shape: string,
  savedSlots: FormationRecord["slots"],
): FormationRecord["slots"] => {
  const templateSlots = buildSlotsForShape(shape);

  return templateSlots.map((templateSlot, index) => ({
    label:
      typeof savedSlots[index]?.label === "string" && savedSlots[index].label
        ? savedSlots[index].label
        : templateSlot.label,
    x:
      typeof savedSlots[index]?.x === "number"
        ? savedSlots[index].x
        : templateSlot.x,
    y:
      typeof savedSlots[index]?.y === "number"
        ? savedSlots[index].y
        : templateSlot.y,
    playerId:
      typeof savedSlots[index]?.playerId === "string"
        ? savedSlots[index].playerId
        : null,
  }));
};

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

const isSelectableMatch = (match: MatchRecord) =>
  match.status === "live" ||
  match.status === "paused" ||
  (match.status === "scheduled" &&
    (!match.scheduledAt || new Date(match.scheduledAt).getTime() >= Date.now()));

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
  const pitchRef = useRef<HTMLDivElement | null>(null);
  const selectableMatches = useMemo(
    () => matches.filter(isSelectableMatch),
    [matches],
  );
  const [selectedMatchId, setSelectedMatchId] = useState("");
  const [shape, setShape] = useState(DEFAULT_SHAPE);
  const [draggingSlotIndex, setDraggingSlotIndex] = useState<number | null>(null);
  const [slots, setSlots] = useState<FormationRecord["slots"]>(
    buildSlotsForShape(DEFAULT_SHAPE),
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
  const playerMap = useMemo(
    () => new Map(players.map((player) => [player.id, player])),
    [players],
  );

  const selectedMatch = useMemo(
    () => matches.find((match) => match.id === selectedMatchId),
    [matches, selectedMatchId],
  );
  const selectedSquad = selectedMatchId ? squadMap.get(selectedMatchId) : undefined;

  const squadPlayers = useMemo(() => {
    if (!selectedSquad) {
      return players;
    }

    const seenPlayerIds = new Set<string>();

    return [...selectedSquad.startingXI, ...selectedSquad.substitutes]
      .map((playerId) => playerMap.get(playerId))
      .filter((player): player is PlayerRecord => {
        if (!player || seenPlayerIds.has(player.id)) {
          return false;
        }

        seenPlayerIds.add(player.id);
        return true;
      });
  }, [playerMap, players, selectedSquad]);

  const assignedPlayerIds = useMemo(
    () =>
      slots
        .map((slot) => slot.playerId)
        .filter((playerId): playerId is string => typeof playerId === "string"),
    [slots],
  );
  const assignedPlayerIdSet = useMemo(
    () => new Set(assignedPlayerIds),
    [assignedPlayerIds],
  );
  const activeFormation = formationTemplates[shape] || formationTemplates[DEFAULT_SHAPE];
  const activeFormationGroup = useMemo(
    () =>
      formationGroups.find((group) =>
        group.formations.some((formation) => formation.shape === shape),
      ) || formationGroups[0],
    [shape],
  );

  useEffect(() => {
    if (!selectedMatchId || !matches.some((match) => match.id === selectedMatchId)) {
      setSelectedMatchId(selectableMatches[0]?.id || matches[0]?.id || "");
    }
  }, [matches, selectableMatches, selectedMatchId]);

  useEffect(() => {
    if (!selectedMatchId) {
      setPrepForm({
        squadReady: false,
        keyPlayers: [],
        opponentNotes: "",
        checklistNotes: "",
      });
      setShape(DEFAULT_SHAPE);
      setSlots(buildSlotsForShape(DEFAULT_SHAPE));
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
      const nextShape = formationTemplates[savedFormation.shape]
        ? savedFormation.shape
        : DEFAULT_SHAPE;

      setShape(nextShape);
      setSlots(normalizeSavedSlots(nextShape, savedFormation.slots));
      return;
    }

    setShape(DEFAULT_SHAPE);
    setSlots(buildSlotsForShape(DEFAULT_SHAPE, selectedSquad?.startingXI || []));
  }, [formationMap, preparationMap, selectedMatchId, selectedSquad]);

  useEffect(() => {
    if (draggingSlotIndex === null) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const pitchBounds = pitchRef.current?.getBoundingClientRect();
      if (!pitchBounds) {
        return;
      }

      const nextX = clamp(
        ((event.clientX - pitchBounds.left) / pitchBounds.width) * 100,
        8,
        92,
      );
      const nextY = clamp(
        ((event.clientY - pitchBounds.top) / pitchBounds.height) * 100,
        8,
        92,
      );

      setSlots((current) =>
        current.map((slot, index) =>
          index === draggingSlotIndex
            ? {
                ...slot,
                x: nextX,
                y: nextY,
              }
            : slot,
        ),
      );
    };

    const handlePointerUp = () => {
      setDraggingSlotIndex(null);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [draggingSlotIndex]);

  const handleFormationShapeChange = (nextShape: string) => {
    const playerAssignments = slots.some((slot) => slot.playerId)
      ? slots.map((slot) => slot.playerId ?? null)
      : selectedSquad?.startingXI || [];

    setShape(nextShape);
    setSlots(buildSlotsForShape(nextShape, playerAssignments));
  };

  const handleSlotPlayerChange = (slotIndex: number, nextPlayerId: string) => {
    setSlots((current) =>
      current.map((slot, index) => {
        if (index === slotIndex) {
          return {
            ...slot,
            playerId: nextPlayerId || null,
          };
        }

        if (nextPlayerId && slot.playerId === nextPlayerId) {
          return {
            ...slot,
            playerId: null,
          };
        }

        return slot;
      }),
    );
  };

  const handleResetBoard = () => {
    setSlots(
      buildSlotsForShape(
        shape,
        slots.map((slot) => slot.playerId ?? null),
      ),
    );
    setDraggingSlotIndex(null);
  };

  const handleDragStart = (
    event: React.PointerEvent<HTMLButtonElement>,
    slotIndex: number,
  ) => {
    if (!slots[slotIndex]?.playerId) {
      return;
    }

    event.preventDefault();
    setDraggingSlotIndex(slotIndex);
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
          name: `${shape} ${selectedMatch?.title || "match plan"}`,
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
              Finalize squad readiness, identify key players, add opponent notes,
              and demonstrate your match plan with a movable tactical board.
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
              {selectableMatches.map((match) => (
                <option key={match.id} value={match.id}>
                  {match.title}
                  {match.status === "live"
                    ? " • Live"
                    : match.status === "paused"
                      ? " • Paused"
                      : ""}
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
            className={`mt-5 ${dashboardPrimaryButtonClass}`}
          >
            <MdSave size={18} />
            Save Checklist
          </button>
        </div>

        <div className="glass-panel rounded-[32px] p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h3 className="text-xl font-semibold text-secondary">Tactical Board</h3>
              <p className="mt-1 text-sm text-slate-500">
                Choose a match-ready formation, assign players, then drag them on
                the board to demonstrate movements and shape changes.
              </p>
            </div>

            <div className="rounded-[24px] border border-white/70 bg-white/85 px-4 py-3 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Active setup
              </p>
              <p className="mt-2 text-lg font-semibold text-secondary">{shape}</p>
              <p className="mt-1 max-w-xs text-xs leading-6 text-slate-500">
                {activeFormationGroup.title} • {activeFormation.summary}
              </p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                {assignedPlayerIds.length}/{slots.length} players assigned
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {formationGroups.map((group) => (
              <div
                key={group.id}
                className="rounded-[26px] border border-white/70 bg-white/80 p-4"
              >
                <p className="text-sm font-semibold text-secondary">{group.title}</p>
                <p className="mt-2 text-xs leading-6 text-slate-500">
                  {group.description}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {group.formations.map((formation) => (
                    <button
                      key={formation.shape}
                      type="button"
                      onClick={() => handleFormationShapeChange(formation.shape)}
                      className={`rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition ${
                        shape === formation.shape
                          ? "bg-secondary text-white"
                          : "border border-slate-200 bg-white text-slate-600 hover:border-secondary/20 hover:text-secondary"
                      }`}
                    >
                      {formation.shape}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-6 2xl:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-[32px] border border-emerald-200 bg-[linear-gradient(180deg,#14532d_0%,#166534_100%)] p-4">
              <div
                ref={pitchRef}
                className="relative mx-auto aspect-[4/5] max-w-xl overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.16),transparent_55%)] touch-none"
              >
                <div className="absolute inset-3 rounded-[24px] border border-white/20" />
                <div className="absolute left-1/2 top-3 h-[calc(100%-1.5rem)] w-px -translate-x-1/2 bg-white/20" />
                <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20" />
                <div className="absolute left-1/2 top-[calc(100%-5rem)] h-12 w-28 -translate-x-1/2 rounded-t-full border border-white/20 border-b-0" />
                <div className="absolute left-1/2 top-4 h-12 w-28 -translate-x-1/2 rounded-b-full border border-white/20 border-t-0" />

                {slots.map((slot, index) => {
                  const player = slot.playerId ? playerMap.get(slot.playerId) : undefined;
                  const isDragging = draggingSlotIndex === index;

                  return (
                    <div
                      key={`${slot.label}-${index}`}
                      className="absolute -translate-x-1/2 -translate-y-1/2"
                      style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
                    >
                      {player ? (
                        <button
                          type="button"
                          onPointerDown={(event) => handleDragStart(event, index)}
                          className={`min-w-[104px] max-w-[116px] rounded-[22px] border px-3 py-2 text-center shadow-lg transition touch-none ${
                            isDragging
                              ? "scale-105 border-emerald-300 bg-white"
                              : "border-white/70 bg-white/95"
                          }`}
                        >
                          <div className="mx-auto flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-emerald-100 bg-emerald-50">
                            {player.photoURL ? (
                              <Image
                                src={player.photoURL}
                                alt={player.fullName}
                                width={48}
                                height={48}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-xs font-semibold text-emerald-700">
                                {getInitials(player.fullName)}
                              </span>
                            )}
                          </div>
                          <p className="mt-2 truncate text-xs font-semibold text-slate-900">
                            {player.fullName}
                          </p>
                          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                            {slot.label}
                          </p>
                          <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
                            <MdDragIndicator size={13} />
                            Drag
                          </span>
                        </button>
                      ) : (
                        <div className="rounded-[20px] border border-dashed border-white/35 bg-white/10 px-3 py-3 text-center text-white/90 backdrop-blur-sm">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.14em]">
                            {slot.label}
                          </p>
                          <p className="mt-1 text-[11px] text-white/70">
                            Select player
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-[28px] border border-white/70 bg-white/80 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-secondary">
                      Player Assignments
                    </p>
                    <p className="mt-1 text-xs leading-6 text-slate-500">
                      Selected players show on the board with their name and photo.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleResetBoard}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-secondary/20 hover:text-secondary"
                  >
                    <MdRefresh size={16} />
                    Reset Board
                  </button>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {slots.map((slot, index) => {
                    const currentPlayer = slot.playerId
                      ? playerMap.get(slot.playerId)
                      : undefined;

                    return (
                      <label
                        key={`${slot.label}-assignment-${index}`}
                        className="rounded-[22px] border border-slate-200/80 bg-white p-3 shadow-sm"
                      >
                        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                          {slot.label}
                        </span>
                        <select
                          value={slot.playerId || ""}
                          onChange={(event) =>
                            handleSlotPlayerChange(index, event.target.value)
                          }
                          className="mt-2 w-full bg-transparent text-sm font-medium text-slate-800 outline-none"
                        >
                          <option value="">Unassigned</option>
                          {squadPlayers.map((player) => {
                            const assignedElsewhere =
                              player.id !== slot.playerId &&
                              assignedPlayerIdSet.has(player.id);

                            return (
                              <option
                                key={player.id}
                                value={player.id}
                                disabled={assignedElsewhere}
                              >
                                {player.fullName}
                                {assignedElsewhere ? " • Assigned" : ""}
                              </option>
                            );
                          })}
                        </select>
                        <p className="mt-2 text-xs text-slate-500">
                          {currentPlayer?.position || "Choose from the selected squad."}
                        </p>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-[28px] border border-white/70 bg-white/80 p-4">
                <p className="text-sm font-semibold text-secondary">Squad Pool</p>
                <p className="mt-1 text-xs leading-6 text-slate-500">
                  Assigned players are marked so the same player is not used twice.
                </p>

                <div className="mt-4 space-y-2">
                  {squadPlayers.length === 0 ? (
                    <div className="rounded-[22px] border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">
                      No squad players are available for this match yet.
                    </div>
                  ) : (
                    squadPlayers.map((player) => {
                      const assigned = assignedPlayerIdSet.has(player.id);

                      return (
                        <div
                          key={player.id}
                          className={`flex items-center gap-3 rounded-[22px] border px-3 py-3 transition ${
                            assigned
                              ? "border-emerald-200 bg-emerald-50/70"
                              : "border-slate-200 bg-white"
                          }`}
                        >
                          <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                            {player.photoURL ? (
                              <Image
                                src={player.photoURL}
                                alt={player.fullName}
                                width={44}
                                height={44}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-xs font-semibold text-slate-700">
                                {getInitials(player.fullName)}
                              </span>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {player.fullName}
                            </p>
                            <p className="text-xs text-slate-500">
                              {player.position || "Squad player"}
                            </p>
                          </div>

                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                              assigned
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {assigned ? "On board" : "Available"}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleResetBoard}
              className={dashboardNeutralButtonClass}
            >
              <MdRefresh size={18} />
              Reset Tactical Board
            </button>

            <button
              type="button"
              onClick={() => void handleSaveFormation()}
              className={dashboardPrimaryButtonClass}
            >
              <MdSave size={18} />
              Save Formation
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
