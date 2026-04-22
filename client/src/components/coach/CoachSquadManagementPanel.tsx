"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { MdGroups, MdMedicalInformation, MdSave } from "react-icons/md";
import {
  dashboardOutlineActionButtonClass,
  dashboardPrimaryCompactButtonClass,
  dashboardToggleActiveClass,
  dashboardToggleButtonClass,
  dashboardToggleInactiveClass,
} from "@/components/dashboard/dashboardButtonStyles";
import { saveCoachMatchSquad, saveCoachPlayerStatus } from "@/store/coachSlice";
import { useAppDispatch } from "@/store/store";
import type { MatchSquadRecord, PlayerStatusRecord } from "@/types/coach";
import type { MatchRecord, PlayerRecord } from "@/types/sports";

interface CoachSquadManagementPanelProps {
  teamId: string;
  currentUserId?: string | null;
  players: PlayerRecord[];
  matches: MatchRecord[];
  squads: MatchSquadRecord[];
  playerStatuses: PlayerStatusRecord[];
}

const MAX_STARTING_PLAYERS = 11;
const MAX_SUBSTITUTES = 9;

const isUpcomingMatch = (match: MatchRecord) =>
  match.status === "scheduled" &&
  (!match.scheduledAt || new Date(match.scheduledAt).getTime() >= Date.now());

export default function CoachSquadManagementPanel({
  teamId,
  currentUserId,
  players,
  matches,
  squads,
  playerStatuses,
}: CoachSquadManagementPanelProps) {
  const dispatch = useAppDispatch();
  const upcomingMatches = useMemo(
    () => matches.filter(isUpcomingMatch),
    [matches],
  );
  const [selectedMatchId, setSelectedMatchId] = useState<string>("");
  const [startingXI, setStartingXI] = useState<string[]>([]);
  const [substitutes, setSubstitutes] = useState<string[]>([]);
  const [captainId, setCaptainId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [statusDrafts, setStatusDrafts] = useState<
    Record<string, { status: PlayerStatusRecord["status"]; returnDate: string; reason: string }>
  >({});

  const statusMap = useMemo(
    () => new Map(playerStatuses.map((status) => [status.playerId, status])),
    [playerStatuses],
  );
  const squadMap = useMemo(
    () => new Map(squads.map((squad) => [squad.matchId, squad])),
    [squads],
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

    const existingSquad = squadMap.get(selectedMatchId);
    setStartingXI(existingSquad?.startingXI || []);
    setSubstitutes(existingSquad?.substitutes || []);
    setCaptainId(existingSquad?.captainId || "");
    setNotes(existingSquad?.notes || "");
  }, [selectedMatchId, squadMap]);

  useEffect(() => {
    const nextDrafts = players.reduce<
      Record<string, { status: PlayerStatusRecord["status"]; returnDate: string; reason: string }>
    >((accumulator, player) => {
      const currentStatus = statusMap.get(player.id);
      accumulator[player.id] = {
        status: currentStatus?.status || "fit",
        returnDate: currentStatus?.returnDate?.slice(0, 10) || "",
        reason: currentStatus?.reason || "",
      };
      return accumulator;
    }, {});

    setStatusDrafts(nextDrafts);
  }, [players, statusMap]);

  const toggleStarter = (playerId: string) => {
    setStartingXI((current) => {
      if (current.includes(playerId)) {
        return current.filter((id) => id !== playerId);
      }

      if (current.length >= MAX_STARTING_PLAYERS) {
        toast.error("Starting XI already has 11 players.");
        return current;
      }

      return [...current, playerId];
    });

    setSubstitutes((current) => current.filter((id) => id !== playerId));
  };

  const toggleSubstitute = (playerId: string) => {
    setSubstitutes((current) => {
      if (current.includes(playerId)) {
        return current.filter((id) => id !== playerId);
      }

      if (current.length >= MAX_SUBSTITUTES) {
        toast.error("Substitutes list is full.");
        return current;
      }

      return [...current, playerId];
    });

    setStartingXI((current) => current.filter((id) => id !== playerId));
  };

  const handleSaveSquad = async () => {
    if (!selectedMatchId) {
      toast.error("Choose a match before saving a squad.");
      return;
    }

    if (startingXI.length !== MAX_STARTING_PLAYERS) {
      toast.error("Select exactly 11 starting players.");
      return;
    }

    try {
      await dispatch(
        saveCoachMatchSquad({
          teamId,
          matchId: selectedMatchId,
          startingXI,
          substitutes,
          captainId: captainId || null,
          notes: notes.trim() || null,
          createdBy: currentUserId || null,
        }),
      ).unwrap();
      toast.success("Match squad saved.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to save the match squad.",
      );
    }
  };

  const handleSaveStatus = async (playerId: string) => {
    const draft = statusDrafts[playerId];
    if (!draft) {
      return;
    }

    try {
      await dispatch(
        saveCoachPlayerStatus({
          teamId,
          playerId,
          status: draft.status,
          returnDate: draft.returnDate || null,
          reason: draft.reason || null,
          availabilityNote:
            draft.status === "fit" ? "Available for selection" : draft.reason || null,
          createdBy: currentUserId || null,
        }),
      ).unwrap();
      toast.success("Player status updated.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to update player status.",
      );
    }
  };

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-[32px] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
              <MdGroups size={14} />
              Squad Management
            </span>
            <h2 className="mt-4 text-2xl font-semibold text-secondary">
              Select the matchday squad and manage player availability
            </h2>
            <p className="mt-2 text-sm leading-7 text-slate-500">
              Choose an upcoming match, assign the Starting XI and substitutes, and keep injury or suspension status current.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
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

            <label className="rounded-[24px] border border-white/70 bg-white/80 p-4">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Captain
              </span>
              <select
                value={captainId}
                onChange={(event) => setCaptainId(event.target.value)}
                className="mt-3 w-full bg-transparent text-sm font-medium text-slate-800 outline-none"
              >
                <option value="">Choose a captain</option>
                {startingXI.map((playerId) => {
                  const player = players.find((entry) => entry.id === playerId);
                  return player ? (
                    <option key={player.id} value={player.id}>
                      {player.fullName}
                    </option>
                  ) : null;
                })}
              </select>
            </label>
          </div>

          <label className="mt-4 block rounded-[24px] border border-white/70 bg-white/80 p-4">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Match Notes
            </span>
            <textarea
              rows={3}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="mt-3 w-full resize-none bg-transparent text-sm leading-6 text-slate-700 outline-none"
              placeholder="Add selection notes, tactical themes, or special matchday instructions."
            />
          </label>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="glass-panel rounded-[32px] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-secondary">Roster</h3>
              <p className="mt-1 text-sm text-slate-500">
                Tap players to move them into the Starting XI or the substitutes bench.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void handleSaveSquad()}
              className={dashboardPrimaryCompactButtonClass}
            >
              <MdSave size={18} />
              Save Squad
            </button>
          </div>

          <div className="mt-6 space-y-3">
            {players.map((player) => {
              const draft = statusDrafts[player.id];
              const isUnavailable = draft?.status !== "fit";
              const isStarter = startingXI.includes(player.id);
              const isSubstitute = substitutes.includes(player.id);

              return (
                <div
                  key={player.id}
                  className={`rounded-[24px] border px-4 py-4 ${
                    isUnavailable
                      ? "border-amber-200 bg-amber-50/70"
                      : "border-slate-200 bg-white/70"
                  }`}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {player.fullName}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {player.position || "Squad member"} · {draft?.status || "fit"}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => toggleStarter(player.id)}
                        className={`${dashboardToggleButtonClass} text-xs ${
                          isStarter
                            ? dashboardToggleActiveClass
                            : dashboardToggleInactiveClass
                        }`}
                      >
                        Starting XI
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleSubstitute(player.id)}
                        className={`${dashboardToggleButtonClass} text-xs ${
                          isSubstitute
                            ? dashboardToggleActiveClass
                            : dashboardToggleInactiveClass
                        }`}
                      >
                        Substitute
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-[0.75fr_0.75fr_1fr_auto]">
                    <label className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Status
                      </span>
                      <select
                        value={draft?.status || "fit"}
                        onChange={(event) =>
                          setStatusDrafts((current) => ({
                            ...current,
                            [player.id]: {
                              ...(current[player.id] || {
                                status: "fit",
                                returnDate: "",
                                reason: "",
                              }),
                              status: event.target.value as PlayerStatusRecord["status"],
                            },
                          }))
                        }
                        className="mt-2 w-full bg-transparent text-sm text-slate-800 outline-none"
                      >
                        <option value="fit">Fit</option>
                        <option value="injured">Injured</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </label>

                    <label className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Return Date
                      </span>
                      <input
                        type="date"
                        value={draft?.returnDate || ""}
                        onChange={(event) =>
                          setStatusDrafts((current) => ({
                            ...current,
                            [player.id]: {
                              ...(current[player.id] || {
                                status: "fit",
                                returnDate: "",
                                reason: "",
                              }),
                              returnDate: event.target.value,
                            },
                          }))
                        }
                        className="mt-2 w-full bg-transparent text-sm text-slate-800 outline-none"
                      />
                    </label>

                    <label className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Availability Note
                      </span>
                      <input
                        type="text"
                        value={draft?.reason || ""}
                        onChange={(event) =>
                          setStatusDrafts((current) => ({
                            ...current,
                            [player.id]: {
                              ...(current[player.id] || {
                                status: "fit",
                                returnDate: "",
                                reason: "",
                              }),
                              reason: event.target.value,
                            },
                          }))
                        }
                        className="mt-2 w-full bg-transparent text-sm text-slate-800 outline-none"
                        placeholder="Reason, treatment note, or restriction"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => void handleSaveStatus(player.id)}
                      className={dashboardOutlineActionButtonClass}
                    >
                      <MdMedicalInformation size={18} />
                      Save Status
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-panel rounded-[32px] p-6">
            <h3 className="text-xl font-semibold text-secondary">Starting XI</h3>
            <div className="mt-5 space-y-3">
              {startingXI.length > 0 ? (
                startingXI.map((playerId, index) => {
                  const player = players.find((entry) => entry.id === playerId);
                  return (
                    <div
                      key={playerId}
                      className="rounded-[24px] border border-slate-200 bg-white/70 px-4 py-3"
                    >
                      <p className="text-sm font-semibold text-slate-900">
                        {index + 1}. {player?.fullName || "Player"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {player?.position || "Squad member"}
                      </p>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-[24px] border border-dashed border-slate-300 bg-white/60 px-4 py-10 text-center text-sm text-slate-500">
                  No starters selected yet.
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel rounded-[32px] p-6">
            <h3 className="text-xl font-semibold text-secondary">Substitutes</h3>
            <div className="mt-5 space-y-3">
              {substitutes.length > 0 ? (
                substitutes.map((playerId, index) => {
                  const player = players.find((entry) => entry.id === playerId);
                  return (
                    <div
                      key={playerId}
                      className="rounded-[24px] border border-slate-200 bg-white/70 px-4 py-3"
                    >
                      <p className="text-sm font-semibold text-slate-900">
                        {index + 1}. {player?.fullName || "Player"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {player?.position || "Squad member"}
                      </p>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-[24px] border border-dashed border-slate-300 bg-white/60 px-4 py-10 text-center text-sm text-slate-500">
                  No substitutes selected yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
