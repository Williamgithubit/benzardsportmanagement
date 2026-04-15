"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FiFilter, FiMapPin, FiSearch } from "react-icons/fi";
import { MdArrowOutward, MdTrackChanges } from "react-icons/md";
import AthleteService from "@/services/athleteService";
import PublicPageCanvas from "@/components/shared/PublicPageCanvas";
import PublicPageHero from "@/components/shared/PublicPageHero";
import AthleteCardPublic from "./AthleteCardPublic";
import {
  type Athlete,
  type AthleteFilters,
  LIBERIA_COUNTIES,
  SPORTS,
} from "@/types/athlete";

export default function PublicAthleteDirectory() {
  const [search, setSearch] = useState("");
  const [sport, setSport] = useState("all");
  const [level, setLevel] = useState("all");
  const [county, setCounty] = useState("all");
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      try {
        const filters: AthleteFilters = {
          search,
          sport: sport || "all",
          level: level || "all",
          county: county || "all",
          scoutingStatus: "all",
          position: "all",
          ageRange: {},
        };

        const result = await AthleteService.getAthletes(filters, {
          page: 1,
          pageSize: 100,
        });

        setAthletes(result.athletes);
        setError(null);
      } catch (incomingError) {
        console.error(incomingError);
        setError(
          incomingError instanceof Error
            ? incomingError.message
            : "Unable to load athletes.",
        );
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [county, level, search, sport]);

  const countiesRepresented = useMemo(
    () => new Set(athletes.map((athlete) => athlete.county).filter(Boolean)).size,
    [athletes],
  );
  const sportsRepresented = useMemo(
    () => new Set(athletes.map((athlete) => athlete.sport).filter(Boolean)).size,
    [athletes],
  );
  const spotlightAthlete = athletes[0];

  return (
    <PublicPageCanvas>
      <PublicPageHero
        badge="Scouting Network"
        badgeIcon={<MdTrackChanges size={16} />}
        title="Explore athletes with a clearer view of talent, readiness, and development."
        description="Browse the current athlete directory, filter by sport and county, and open player profiles with real performance stats pulled from the Benzard data flow."
        stats={[
          {
            value: `${athletes.length}`,
            label: "Visible Athletes",
            accentClassName: "text-primary",
          },
          {
            value: `${countiesRepresented || 0}`,
            label: "Counties Represented",
            accentClassName: "text-secondary",
          },
          {
            value: `${sportsRepresented || 0}`,
            label: "Sports Active",
            accentClassName: "text-emerald-600",
          },
        ]}
        aside={
          <div className="glass-panel rounded-[32px] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Spotlight
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-secondary">
              {spotlightAthlete?.name || "Fresh scouting profiles"}
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              {spotlightAthlete?.bio ||
                "Use the filters below to move from broad discovery into player-by-player review."}
            </p>
            {spotlightAthlete ? (
              <div className="mt-5 rounded-[26px] border border-slate-200/80 bg-white/80 p-4">
                <p className="text-sm font-semibold text-secondary">
                  {spotlightAthlete.position || "Athlete profile"}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {spotlightAthlete.county || spotlightAthlete.location || "Liberia"} ·{" "}
                  {spotlightAthlete.sport}
                </p>
                <Link
                  href={`/athletes/${spotlightAthlete.id}`}
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-secondary transition hover:text-primary"
                >
                  Open profile
                  <MdArrowOutward size={18} />
                </Link>
              </div>
            ) : null}
          </div>
        }
      />

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="glass-panel rounded-[36px] p-6 sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Filter Directory
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-secondary">
                Find the right athlete faster.
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
                Search by player name, then narrow the field by sport, level,
                and county to open a stronger shortlist.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 xl:grid-cols-[1.2fr_repeat(3,minmax(0,0.8fr))]">
            <label className="rounded-[24px] border border-slate-200 bg-white/85 px-4 py-3 text-sm text-slate-700 shadow-sm">
              <span className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                <FiSearch />
                Search
              </span>
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search athlete name, position, or bio"
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
            </label>

            <label className="rounded-[24px] border border-slate-200 bg-white/85 px-4 py-3 text-sm text-slate-700 shadow-sm">
              <span className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                <FiFilter />
                Sport
              </span>
              <select
                value={sport}
                onChange={(event) => setSport(event.target.value)}
                className="w-full bg-transparent text-sm outline-none"
              >
                {["all", ...SPORTS].map((entry) => (
                  <option key={entry} value={entry}>
                    {entry === "all"
                      ? "All sports"
                      : entry.charAt(0).toUpperCase() + entry.slice(1)}
                  </option>
                ))}
              </select>
            </label>

            <label className="rounded-[24px] border border-slate-200 bg-white/85 px-4 py-3 text-sm text-slate-700 shadow-sm">
              <span className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                <FiFilter />
                Level
              </span>
              <select
                value={level}
                onChange={(event) => setLevel(event.target.value)}
                className="w-full bg-transparent text-sm outline-none"
              >
                <option value="all">All levels</option>
                <option value="grassroots">Grassroots</option>
                <option value="semi-pro">Semi-Pro</option>
                <option value="professional">Professional</option>
              </select>
            </label>

            <label className="rounded-[24px] border border-slate-200 bg-white/85 px-4 py-3 text-sm text-slate-700 shadow-sm">
              <span className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                <FiMapPin />
                County
              </span>
              <select
                value={county}
                onChange={(event) => setCounty(event.target.value)}
                className="w-full bg-transparent text-sm outline-none"
              >
                <option value="all">All counties</option>
                {LIBERIA_COUNTIES.map((entry) => (
                  <option key={entry} value={entry}>
                    {entry}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="mt-8">
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="glass-panel h-[430px] rounded-[32px] skeleton-shimmer"
                />
              ))}
            </div>
          ) : error ? (
            <div className="glass-panel rounded-[32px] border border-rose-200 bg-rose-50 p-8 text-center">
              <h3 className="text-xl font-semibold text-rose-700">
                Unable to load athletes
              </h3>
              <p className="mt-3 text-sm text-rose-600">{error}</p>
            </div>
          ) : athletes.length === 0 ? (
            <div className="glass-panel rounded-[32px] p-10 text-center">
              <h3 className="text-2xl font-semibold text-secondary">
                No athletes matched this filter set.
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-500">
                Reset one or two filters to widen the scouting view and surface
                more profiles.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {athletes.map((athlete) => (
                <AthleteCardPublic key={athlete.id} athlete={athlete} />
              ))}
            </div>
          )}
        </div>
      </section>
    </PublicPageCanvas>
  );
}
