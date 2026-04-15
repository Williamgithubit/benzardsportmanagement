"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  MdAdd,
  MdFlag,
  MdOutlinePlayArrow,
  MdPause,
  MdSave,
  MdStopCircle,
  MdTimer,
} from "react-icons/md";
import StatisticianService from "@/services/statisticianService";
import type {
  MatchEventRecord,
  MatchRecord,
  MatchTeamSide,
  PlayerRecord,
} from "@/types/sports";
import { toDate } from "@/utils/firestore";

interface LiveMatchTrackerProps {
  matches: MatchRecord[];
  players: PlayerRecord[];
  matchEvents: MatchEventRecord[];
  currentUserId?: string | null;
}

const eventTypeLabels: Record<string, string> = {
  goal: "Goal",
  assist: "Assist",
  foul: "Foul",
  yellow_card: "Yellow Card",
  red_card: "Red Card",
  substitution: "Substitution",
};

const scoreTone = (match: MatchRecord) => {
  if (match.homeScore > match.awayScore) {
    return "text-emerald-600";
  }
  if (match.homeScore < match.awayScore) {
    return "text-rose-600";
  }
  return "text-slate-700";
};

export default function LiveMatchTracker({
  matches,
  players,
  matchEvents,
  currentUserId,
}: LiveMatchTrackerProps) {
  const [selectedMatchId, setSelectedMatchId] = useState<string>("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creatingMatch, setCreatingMatch] = useState(false);
  const [submittingEvent, setSubmittingEvent] = useState(false);
  const [savingEvaluation, setSavingEvaluation] = useState(false);
  const [tick, setTick] = useState(Date.now());
  const [matchForm, setMatchForm] = useState({
    title: "",
    opponent: "",
    venue: "",
    competition: "",
    scheduledAt: "",
    notes: "",
  });
  const [eventForm, setEventForm] = useState({
    type: "goal",
    minute: 1,
    teamSide: "home" as MatchTeamSide,
    playerId: "",
    secondaryPlayerId: "",
    note: "",
  });
  const [evaluationForm, setEvaluationForm] = useState({
    playerId: "",
    rating: 7,
    minutesPlayed: 90,
    note: "",
  });

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setTick(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (!selectedMatchId && matches[0]?.id) {
      setSelectedMatchId(matches[0].id);
    }
  }, [matches, selectedMatchId]);

  const selectedMatch = useMemo(
    () => matches.find((match) => match.id === selectedMatchId) || null,
    [matches, selectedMatchId],
  );

  const selectedMatchEvents = useMemo(
    () =>
      matchEvents
        .filter((event) => event.matchId === selectedMatchId)
        .sort((left, right) => right.minute - left.minute),
    [matchEvents, selectedMatchId],
  );

  const timerMinutes = useMemo(() => {
    if (!selectedMatch) {
      return 0;
    }

    const carriedSeconds = Math.max(
      0,
      Math.round(selectedMatch.timerAccumulatedSeconds || 0),
    );

    if (selectedMatch.status !== "live" || !selectedMatch.timerStartedAt) {
      return Math.floor(carriedSeconds / 60);
    }

    const startedAt = toDate(selectedMatch.timerStartedAt);

    if (!startedAt) {
      return Math.floor(carriedSeconds / 60);
    }

    return Math.max(
      0,
      Math.floor(
        (carriedSeconds * 1000 + (tick - startedAt.getTime())) / 60_000,
      ),
    );
  }, [
    selectedMatch,
    tick,
  ]);

  const handleCreateMatch = async () => {
    if (!matchForm.opponent.trim() || !matchForm.venue.trim()) {
      toast.error("Opponent and venue are required.");
      return;
    }

    try {
      setCreatingMatch(true);
      const matchId = await StatisticianService.createMatch(
        {
          title: matchForm.title.trim() || undefined,
          opponent: matchForm.opponent,
          venue: matchForm.venue,
          competition: matchForm.competition.trim() || undefined,
          scheduledAt: matchForm.scheduledAt
            ? new Date(matchForm.scheduledAt).toISOString()
            : null,
          notes: matchForm.notes.trim() || undefined,
        },
        currentUserId,
      );
      setSelectedMatchId(matchId);
      setShowCreateForm(false);
      setMatchForm({
        title: "",
        opponent: "",
        venue: "",
        competition: "",
        scheduledAt: "",
        notes: "",
      });
      toast.success("Match created successfully.");
    } catch (error) {
      console.error("Failed to create match:", error);
      toast.error("Unable to create the match.");
    } finally {
      setCreatingMatch(false);
    }
  };

  const handleStartMatch = async () => {
    if (!selectedMatch) {
      toast.error("Select a match first.");
      return;
    }

    try {
      await StatisticianService.startMatch(selectedMatch.id);
      toast.success("Match timer started.");
    } catch (error) {
      console.error("Failed to start match:", error);
      toast.error("Unable to start this match.");
    }
  };

  const handlePauseMatch = async () => {
    if (!selectedMatch) {
      toast.error("Select a match first.");
      return;
    }

    try {
      await StatisticianService.pauseMatch(selectedMatch.id);
      toast.success("Match timer paused.");
    } catch (error) {
      console.error("Failed to pause match:", error);
      toast.error("Unable to pause this match.");
    }
  };

  const handleResumeMatch = async () => {
    if (!selectedMatch) {
      toast.error("Select a match first.");
      return;
    }

    try {
      await StatisticianService.resumeMatch(selectedMatch.id);
      toast.success("Match timer resumed.");
    } catch (error) {
      console.error("Failed to resume match:", error);
      toast.error("Unable to resume this match.");
    }
  };

  const handleCompleteMatch = async () => {
    if (!selectedMatch) {
      return;
    }

    try {
      const result = await StatisticianService.completeMatch(selectedMatch.id);
      toast.success(
        result.isDataComplete
          ? "Match marked as completed."
          : "Match completed. Add player evaluations to finish the data pack.",
      );
    } catch (error) {
      console.error("Failed to complete match:", error);
      toast.error("Unable to complete this match.");
    }
  };

  const handleSaveEvent = async () => {
    if (!selectedMatch) {
      toast.error("Select a match before recording an event.");
      return;
    }

    if (
      eventForm.teamSide === "home" &&
      !eventForm.playerId &&
      eventForm.type !== "foul"
    ) {
      toast.error("Select the player involved in this event.");
      return;
    }

    try {
      setSubmittingEvent(true);
      await StatisticianService.recordMatchEvent(selectedMatch.id, {
        type: eventForm.type as
          | "goal"
          | "assist"
          | "foul"
          | "yellow_card"
          | "red_card"
          | "substitution",
        minute: Math.max(1, Number(eventForm.minute)),
        teamSide: eventForm.teamSide,
        playerId: eventForm.playerId || null,
        secondaryPlayerId: eventForm.secondaryPlayerId || null,
        note: eventForm.note,
        createdBy: currentUserId,
      });
      setEventForm((current) => ({
        ...current,
        secondaryPlayerId: "",
        note: "",
        minute: Math.max(timerMinutes, current.minute),
      }));
      toast.success("Match event recorded.");
    } catch (error) {
      console.error("Failed to record match event:", error);
      toast.error("Unable to save that event.");
    } finally {
      setSubmittingEvent(false);
    }
  };

  const handleSaveEvaluation = async () => {
    if (!selectedMatch || !evaluationForm.playerId) {
      toast.error("Choose a player before saving an evaluation.");
      return;
    }

    try {
      setSavingEvaluation(true);
      await StatisticianService.saveMatchEvaluation(selectedMatch.id, {
        playerId: evaluationForm.playerId,
        rating: evaluationForm.rating,
        minutesPlayed: evaluationForm.minutesPlayed,
        note: evaluationForm.note,
        createdBy: currentUserId,
      });
      setEvaluationForm((current) => ({
        ...current,
        note: "",
      }));
      toast.success("Player evaluation saved.");
    } catch (error) {
      console.error("Failed to save evaluation:", error);
      toast.error("Unable to save that evaluation.");
    } finally {
      setSavingEvaluation(false);
    }
  };

  const handleTimerAction = async () => {
    if (!selectedMatch || selectedMatch.status === "completed") {
      return;
    }

    if (selectedMatch.status === "live") {
      await handlePauseMatch();
      return;
    }

    if (selectedMatch.status === "paused") {
      await handleResumeMatch();
      return;
    }

    await handleStartMatch();
  };

  const timerActionLabel =
    selectedMatch?.status === "live"
      ? "Pause Match"
      : selectedMatch?.status === "paused"
        ? "Resume Match"
        : "Start Match";
  const timerActionIcon =
    selectedMatch?.status === "live" ? <MdPause size={18} /> : <MdOutlinePlayArrow size={18} />;

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-[32px] p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-secondary">Live Match Tracker</h2>
            <p className="mt-2 text-sm text-slate-500">
              Start a fixture, update the timer, and log events as they happen.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <select
              value={selectedMatchId}
              onChange={(event) => setSelectedMatchId(event.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-secondary/30 focus:outline-none"
            >
              <option value="">Select a match</option>
              {matches.map((match) => (
                <option key={match.id} value={match.id}>
                  {match.title}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setShowCreateForm((current) => !current)}
              className="inline-flex items-center gap-2 rounded-2xl bg-secondary px-4 py-3 text-sm font-semibold text-white transition hover:bg-secondary-hover"
            >
              <MdAdd size={18} />
              {showCreateForm ? "Close Match Form" : "Create Match"}
            </button>
          </div>
        </div>

        {showCreateForm ? (
          <div className="mt-6 grid gap-4 rounded-[28px] border border-slate-200 bg-white/70 p-5 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-600">
              Match title
              <input
                type="text"
                value={matchForm.title}
                onChange={(event) =>
                  setMatchForm((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-secondary/30 focus:outline-none"
                placeholder="BSM vs Invincibles FC"
              />
            </label>
            <label className="text-sm font-medium text-slate-600">
              Opponent
              <input
                type="text"
                value={matchForm.opponent}
                onChange={(event) =>
                  setMatchForm((current) => ({
                    ...current,
                    opponent: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-secondary/30 focus:outline-none"
                placeholder="Opponent club"
              />
            </label>
            <label className="text-sm font-medium text-slate-600">
              Venue
              <input
                type="text"
                value={matchForm.venue}
                onChange={(event) =>
                  setMatchForm((current) => ({
                    ...current,
                    venue: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-secondary/30 focus:outline-none"
                placeholder="Antoinette Tubman Stadium"
              />
            </label>
            <label className="text-sm font-medium text-slate-600">
              Competition
              <input
                type="text"
                value={matchForm.competition}
                onChange={(event) =>
                  setMatchForm((current) => ({
                    ...current,
                    competition: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-secondary/30 focus:outline-none"
                placeholder="League / Cup / Friendly"
              />
            </label>
            <label className="text-sm font-medium text-slate-600">
              Kick-off
              <input
                type="datetime-local"
                value={matchForm.scheduledAt}
                onChange={(event) =>
                  setMatchForm((current) => ({
                    ...current,
                    scheduledAt: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-secondary/30 focus:outline-none"
              />
            </label>
            <label className="text-sm font-medium text-slate-600 md:col-span-2">
              Notes
              <textarea
                value={matchForm.notes}
                onChange={(event) =>
                  setMatchForm((current) => ({
                    ...current,
                    notes: event.target.value,
                  }))
                }
                className="mt-2 min-h-[110px] w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-secondary/30 focus:outline-none"
                placeholder="Optional context for the fixture"
              />
            </label>
            <div className="md:col-span-2">
              <button
                type="button"
                onClick={() => void handleCreateMatch()}
                disabled={creatingMatch}
                className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-70"
              >
                <MdSave size={18} />
                {creatingMatch ? "Creating..." : "Save Match"}
              </button>
            </div>
          </div>
        ) : null}
      </section>

      {selectedMatch ? (
        <section className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
          <div className="space-y-6">
            <div className="glass-panel rounded-[32px] p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {selectedMatch.competition || "Matchday"}
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-secondary">
                    {selectedMatch.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">
                    {selectedMatch.venue} · {selectedMatch.status}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="rounded-[26px] border border-slate-200 bg-white px-5 py-4 text-center shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Match Timer
                    </p>
                    <p className="mt-2 text-3xl font-semibold text-secondary">
                      {timerMinutes}&apos;
                    </p>
                  </div>

                  <div className="rounded-[26px] border border-slate-200 bg-white px-5 py-4 text-center shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Scoreline
                    </p>
                    <p className={`mt-2 text-3xl font-semibold ${scoreTone(selectedMatch)}`}>
                      {selectedMatch.homeScore} - {selectedMatch.awayScore}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void handleTimerAction()}
                  disabled={selectedMatch.status === "completed"}
                  className="inline-flex items-center gap-2 rounded-2xl bg-secondary px-4 py-3 text-sm font-semibold text-white transition hover:bg-secondary-hover disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {timerActionIcon}
                  {timerActionLabel}
                </button>

                <button
                  type="button"
                  onClick={() => void handleCompleteMatch()}
                  disabled={selectedMatch.status === "completed"}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-secondary/20 hover:text-secondary disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <MdStopCircle size={18} />
                  {selectedMatch.status === "completed" ? "Match Completed" : "Complete Match"}
                </button>
              </div>
            </div>

            <div className="glass-panel rounded-[32px] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-secondary">Event Timeline</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Every event saved here updates the match record in Firestore immediately.
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                  <MdTimer size={14} />
                  {selectedMatchEvents.length} entries
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {selectedMatchEvents.length > 0 ? (
                  selectedMatchEvents.map((event) => {
                    const playerName =
                      players.find((player) => player.id === event.playerId)?.fullName ||
                      (event.teamSide === "away" ? "Opponent" : "Unassigned player");
                    const supportName =
                      players.find((player) => player.id === event.secondaryPlayerId)
                        ?.fullName || "";

                    return (
                      <div
                        key={event.id}
                        className="flex items-center justify-between gap-4 rounded-[24px] border border-slate-200 bg-white/70 px-4 py-3"
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {eventTypeLabels[event.type] || event.type}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {playerName}
                            {supportName ? ` · ${supportName}` : ""}
                            {event.note ? ` · ${event.note}` : ""}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-secondary">
                            {event.minute}&apos;
                          </p>
                          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                            {event.teamSide}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-[24px] border border-dashed border-slate-300 bg-white/60 px-4 py-10 text-center text-sm text-slate-500">
                    No events recorded yet for this match.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-panel rounded-[32px] p-6">
              <div className="flex items-center gap-2">
                <MdFlag className="text-primary" size={20} />
                <h3 className="text-xl font-semibold text-secondary">Record Event</h3>
              </div>

              <div className="mt-5 space-y-4">
                <label className="block text-sm font-medium text-slate-600">
                  Event type
                  <select
                    value={eventForm.type}
                    onChange={(event) =>
                      setEventForm((current) => ({
                        ...current,
                        type: event.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-secondary/30 focus:outline-none"
                  >
                    <option value="goal">Goal</option>
                    <option value="foul">Foul</option>
                    <option value="yellow_card">Yellow Card</option>
                    <option value="red_card">Red Card</option>
                    <option value="substitution">Substitution</option>
                  </select>
                </label>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block text-sm font-medium text-slate-600">
                    Minute
                    <input
                      type="number"
                      min={1}
                      value={eventForm.minute}
                      onChange={(event) =>
                        setEventForm((current) => ({
                          ...current,
                          minute: Number(event.target.value),
                        }))
                      }
                      className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-secondary/30 focus:outline-none"
                    />
                  </label>
                  <label className="block text-sm font-medium text-slate-600">
                    Team side
                    <select
                      value={eventForm.teamSide}
                      onChange={(event) =>
                        setEventForm((current) => ({
                          ...current,
                          teamSide: event.target.value as MatchTeamSide,
                        }))
                      }
                      className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-secondary/30 focus:outline-none"
                    >
                      <option value="home">Benzard Sports</option>
                      <option value="away">Opponent</option>
                    </select>
                  </label>
                </div>

                <label className="block text-sm font-medium text-slate-600">
                  Primary player
                  <select
                    value={eventForm.playerId}
                    onChange={(event) =>
                      setEventForm((current) => ({
                        ...current,
                        playerId: event.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-secondary/30 focus:outline-none"
                  >
                    <option value="">Select player</option>
                    {players.map((player) => (
                      <option key={player.id} value={player.id}>
                        {player.fullName}
                      </option>
                    ))}
                  </select>
                </label>

                {eventForm.type === "goal" || eventForm.type === "substitution" ? (
                  <label className="block text-sm font-medium text-slate-600">
                    {eventForm.type === "goal" ? "Assist player" : "Second player"}
                    <select
                      value={eventForm.secondaryPlayerId}
                      onChange={(event) =>
                        setEventForm((current) => ({
                          ...current,
                          secondaryPlayerId: event.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-secondary/30 focus:outline-none"
                    >
                      <option value="">Optional</option>
                      {players.map((player) => (
                        <option key={player.id} value={player.id}>
                          {player.fullName}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}

                <label className="block text-sm font-medium text-slate-600">
                  Notes
                  <textarea
                    value={eventForm.note}
                    onChange={(event) =>
                      setEventForm((current) => ({
                        ...current,
                        note: event.target.value,
                      }))
                    }
                    className="mt-2 min-h-[100px] w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-secondary/30 focus:outline-none"
                    placeholder="Optional context for this event"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => void handleSaveEvent()}
                  disabled={submittingEvent}
                  className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <MdSave size={18} />
                  {submittingEvent ? "Saving..." : "Save Event"}
                </button>
              </div>
            </div>

            <div className="glass-panel rounded-[32px] p-6">
              <h3 className="text-xl font-semibold text-secondary">Player Evaluation</h3>
              <p className="mt-1 text-sm text-slate-500">
                Save a match rating and minutes played so performance scores stay current.
              </p>

              <div className="mt-5 space-y-4">
                <label className="block text-sm font-medium text-slate-600">
                  Player
                  <select
                    value={evaluationForm.playerId}
                    onChange={(event) =>
                      setEvaluationForm((current) => ({
                        ...current,
                        playerId: event.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-secondary/30 focus:outline-none"
                  >
                    <option value="">Select player</option>
                    {players.map((player) => (
                      <option key={player.id} value={player.id}>
                        {player.fullName}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block text-sm font-medium text-slate-600">
                    Rating
                    <input
                      type="number"
                      min={1}
                      max={10}
                      step={0.1}
                      value={evaluationForm.rating}
                      onChange={(event) =>
                        setEvaluationForm((current) => ({
                          ...current,
                          rating: Number(event.target.value),
                        }))
                      }
                      className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-secondary/30 focus:outline-none"
                    />
                  </label>
                  <label className="block text-sm font-medium text-slate-600">
                    Minutes played
                    <input
                      type="number"
                      min={0}
                      max={130}
                      value={evaluationForm.minutesPlayed}
                      onChange={(event) =>
                        setEvaluationForm((current) => ({
                          ...current,
                          minutesPlayed: Number(event.target.value),
                        }))
                      }
                      className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-secondary/30 focus:outline-none"
                    />
                  </label>
                </div>

                <label className="block text-sm font-medium text-slate-600">
                  Evaluation notes
                  <textarea
                    value={evaluationForm.note}
                    onChange={(event) =>
                      setEvaluationForm((current) => ({
                        ...current,
                        note: event.target.value,
                      }))
                    }
                    className="mt-2 min-h-[100px] w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-secondary/30 focus:outline-none"
                    placeholder="Short notes on the player's contribution"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => void handleSaveEvaluation()}
                  disabled={savingEvaluation}
                  className="inline-flex items-center gap-2 rounded-2xl bg-secondary px-4 py-3 text-sm font-semibold text-white transition hover:bg-secondary-hover disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <MdSave size={18} />
                  {savingEvaluation ? "Saving..." : "Save Evaluation"}
                </button>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <div className="glass-panel rounded-[32px] px-6 py-10 text-center text-sm text-slate-500">
          Create or select a match to start tracking live events.
        </div>
      )}
    </div>
  );
}
