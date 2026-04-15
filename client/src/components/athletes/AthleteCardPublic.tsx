"use client";

import Image from "next/image";
import Link from "next/link";
import { MdArrowOutward, MdLocationOn, MdSportsSoccer } from "react-icons/md";
import type { Athlete } from "@/types/athlete";

interface Props {
  athlete: Athlete;
}

const formatLabel = (value?: string) => {
  if (!value) {
    return "Not set";
  }

  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
};

export default function AthleteCardPublic({ athlete }: Props) {
  const profileImage =
    athlete.media && athlete.media.length > 0
      ? athlete.media[0].url
      : "/assets/1.jpg";

  return (
    <article className="glass-panel group overflow-hidden rounded-[32px] p-4 transition hover:-translate-y-1 hover:border-primary/15">
      <div className="relative overflow-hidden rounded-[26px]">
        <Image
          src={profileImage}
          alt={athlete.name}
          width={900}
          height={900}
          className="h-72 w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
        />
        <div className="absolute inset-x-4 top-4 flex items-center justify-between gap-3">
          <span className="rounded-full border border-white/40 bg-white/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary shadow-sm backdrop-blur-xl">
            {formatLabel(athlete.level)}
          </span>
          <span className="rounded-full border border-white/25 bg-slate-950/55 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-xl">
            {formatLabel(athlete.scoutingStatus)}
          </span>
        </div>
      </div>

      <div className="px-2 pb-2 pt-5">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
            <MdSportsSoccer size={14} />
            {formatLabel(athlete.sport)}
          </span>
          {athlete.county ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
              <MdLocationOn size={14} />
              {athlete.county}
            </span>
          ) : null}
        </div>

        <h3 className="mt-4 text-2xl font-semibold text-secondary">{athlete.name}</h3>
        <p className="mt-2 text-sm font-medium text-slate-500">
          {athlete.position || "Versatile athlete"}
          {athlete.age ? ` · ${athlete.age} yrs` : ""}
        </p>
        <p className="mt-4 line-clamp-3 text-sm leading-7 text-slate-600">
          {athlete.bio ||
            "Development profile is being updated with scouting notes, progression markers, and highlights."}
        </p>

        <div className="mt-6 flex items-center justify-between gap-3">
          <div className="flex-1 rounded-[24px] border border-slate-200/80 bg-white/75 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Development snapshot
            </p>
            <p className="mt-2 text-sm font-semibold text-secondary">
              {athlete.trainingProgram || "Profile synced for scouting review"}
            </p>
          </div>

          <Link
            href={`/athletes/${athlete.id}`}
            className="inline-flex h-12 items-center gap-2 rounded-2xl bg-secondary px-4 text-sm font-semibold text-white shadow-[0_18px_44px_-24px_rgba(0,0,84,0.75)] transition hover:bg-secondary-hover"
          >
            View
            <MdArrowOutward size={18} />
          </Link>
        </div>
      </div>
    </article>
  );
}
