"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "react-hot-toast";
import {
  MdArrowOutward,
  MdClose,
  MdLocationOn,
  MdMailOutline,
  MdOutlineAccessTime,
  MdOutlineSportsSoccer,
  MdPersonOutline,
} from "react-icons/md";
import AthleteService from "@/services/athleteService";
import EnquiryService from "@/services/enquiryService";
import PublicPageCanvas from "@/components/shared/PublicPageCanvas";
import PublicPageHero from "@/components/shared/PublicPageHero";
import type {
  Athlete,
  AthleteComputedStats,
  AthleteProfileStatsSnapshot,
} from "@/types/athlete";

interface Props {
  params: Promise<{ id: string }>;
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

const formatStatValue = (value?: number) =>
  typeof value === "number" && Number.isFinite(value) ? `${value}` : "0";

const metricEntries = (stats: AthleteComputedStats) => [
  { label: "Matches", value: formatStatValue(stats.matches) },
  { label: "Goals", value: formatStatValue(stats.goals) },
  { label: "Assists", value: formatStatValue(stats.assists) },
  { label: "Minutes", value: formatStatValue(stats.minutesPlayed) },
  { label: "Yellow Cards", value: formatStatValue(stats.yellowCards) },
  { label: "Red Cards", value: formatStatValue(stats.redCards) },
  { label: "Rating", value: formatStatValue(stats.averageRating) },
  {
    label: "Attendance",
    value:
      typeof stats.attendanceRate === "number"
        ? `${Math.round(stats.attendanceRate)}%`
        : "—",
  },
];

export default function AthleteProfilePage({ params }: Props) {
  const resolvedParams =
    typeof (
      React as { use?: (value: Promise<{ id: string }>) => { id: string } }
    ).use === "function"
      ? (React as { use: (value: Promise<{ id: string }>) => { id: string } }).use(
          params,
        )
      : (params as unknown as { id: string });

  const { id } = resolvedParams;

  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [statsSnapshot, setStatsSnapshot] =
    useState<AthleteProfileStatsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [contactOpen, setContactOpen] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactSubmitting, setContactSubmitting] = useState(false);

  useEffect(() => {
    const loadAthlete = async () => {
      setLoading(true);

      try {
        const [loadedAthlete, loadedStats] = await Promise.all([
          AthleteService.getAthleteById(id),
          AthleteService.getAthleteProfileStats(id).catch((error) => {
            console.error(error);
            return null;
          }),
        ]);

        setAthlete(loadedAthlete || null);
        setStatsSnapshot(loadedStats);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    void loadAthlete();
  }, [id]);

  const effectiveStats = useMemo<AthleteComputedStats>(
    () => ({
      ...(athlete?.stats || {}),
      ...(statsSnapshot?.stats || {}),
    }),
    [athlete?.stats, statsSnapshot?.stats],
  );

  const handleEnquirySubmit = async () => {
    if (!contactName.trim()) {
      toast.error("Please add your name.");
      return;
    }

    setContactSubmitting(true);

    try {
      await EnquiryService.createEnquiry({
        athleteId: id,
        name: contactName,
        email: contactEmail,
        phone: contactPhone,
        message: contactMessage,
      });

      setContactOpen(false);
      setContactName("");
      setContactEmail("");
      setContactPhone("");
      setContactMessage("");
      toast.success("Enquiry sent. Our admins have been notified.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to send enquiry");
    } finally {
      setContactSubmitting(false);
    }
  };

  if (!loading && !athlete) {
    return (
      <PublicPageCanvas>
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="glass-panel rounded-[32px] px-8 py-12 text-center">
            <h1 className="text-2xl font-semibold text-secondary">
              Athlete not found
            </h1>
            <p className="mt-3 text-sm text-slate-500">
              The profile you&apos;re looking for is unavailable right now.
            </p>
            <Link
              href="/athletes"
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-secondary px-4 py-3 text-sm font-semibold text-white transition hover:bg-secondary-hover"
            >
              Back to athletes
              <MdArrowOutward size={18} />
            </Link>
          </div>
        </section>
      </PublicPageCanvas>
    );
  }

  if (!athlete) {
    return (
      <PublicPageCanvas>
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="glass-panel rounded-[36px] p-8">
            <div className="h-16 w-48 rounded-2xl skeleton-shimmer" />
            <div className="mt-6 h-6 w-full rounded-xl skeleton-shimmer" />
            <div className="mt-4 h-6 w-4/5 rounded-xl skeleton-shimmer" />
          </div>
        </section>
      </PublicPageCanvas>
    );
  }

  const portrait =
    athlete.media && athlete.media.length > 0 ? athlete.media[0].url : "/assets/1.jpg";
  const mediaGallery = athlete.media || [];
  const mediaPhotos = mediaGallery.filter((media) => media.type === "photo");
  const mediaVideos = mediaGallery.filter((media) => media.type === "video");

  return (
    <PublicPageCanvas>
      <PublicPageHero
        badge="Player Spotlight"
        badgeIcon={<MdPersonOutline size={16} />}
        title={athlete.name}
        description={
          athlete.bio ||
          "This athlete profile combines scouting context with live performance data from the Benzard sports workflow."
        }
        actions={
          <>
            <Link
              href="/athletes"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-secondary/20 hover:text-secondary"
            >
              Back to athletes
            </Link>
            <button
              type="button"
              onClick={() => setContactOpen(true)}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-secondary px-5 text-sm font-semibold text-white shadow-[0_18px_44px_-24px_rgba(0,0,84,0.75)] transition hover:bg-secondary-hover"
            >
              Contact / Enquire
              <MdArrowOutward size={18} />
            </button>
          </>
        }
        stats={[
          {
            value: formatStatValue(effectiveStats.matches),
            label: "Matches",
            accentClassName: "text-secondary",
          },
          {
            value: formatStatValue(effectiveStats.goals),
            label: "Goals",
            accentClassName: "text-primary",
          },
          {
            value: formatStatValue(effectiveStats.assists),
            label: "Assists",
            accentClassName: "text-emerald-600",
          },
        ]}
        aside={
          <div className="glass-panel overflow-hidden rounded-[32px] p-4">
            <div className="relative overflow-hidden rounded-[26px]">
              <Image
                src={portrait}
                alt={athlete.name}
                width={900}
                height={1200}
                className="h-[360px] w-full object-cover"
                sizes="(max-width: 1024px) 100vw, 32vw"
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

            <div className="mt-4 grid gap-3 rounded-[26px] border border-slate-200/80 bg-white/75 p-4 text-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Position
                </p>
                <p className="mt-1 font-semibold text-secondary">
                  {athlete.position || "Not set"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  County
                </p>
                <p className="mt-1 font-semibold text-secondary">
                  {athlete.county || athlete.location || "Not set"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Sport
                </p>
                <p className="mt-1 font-semibold text-secondary">
                  {formatLabel(athlete.sport)}
                </p>
              </div>
            </div>
          </div>
        }
      />

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <div className="glass-panel rounded-[32px] p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                    Performance Snapshot
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold text-secondary">
                    Live stats
                  </h2>
                </div>
                <div className="rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Source: {statsSnapshot?.source || "athlete profile"}
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {metricEntries(effectiveStats).map((metric) => (
                  <div
                    key={metric.label}
                    className="rounded-[26px] border border-slate-200/80 bg-white/80 p-4"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      {metric.label}
                    </p>
                    <p className="mt-3 text-3xl font-semibold text-secondary">
                      {metric.value}
                    </p>
                  </div>
                ))}
              </div>

              {statsSnapshot?.updatedAt ? (
                <p className="mt-5 inline-flex items-center gap-2 text-sm text-slate-500">
                  <MdOutlineAccessTime size={16} />
                  Updated {new Date(statsSnapshot.updatedAt).toLocaleDateString()}
                </p>
              ) : null}
            </div>

            <div className="glass-panel rounded-[32px] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                Profile Story
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-secondary">
                Athlete overview
              </h2>
              <p className="mt-4 text-sm leading-8 text-slate-600">
                {athlete.bio ||
                  "Detailed scouting notes, development context, and coach observations will appear here as the profile grows."}
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {[
                  {
                    label: "Preferred Foot",
                    value: athlete.preferredFoot
                      ? formatLabel(athlete.preferredFoot)
                      : "Not set",
                  },
                  {
                    label: "Nationality",
                    value: athlete.nationality || "Not set",
                  },
                  {
                    label: "Age",
                    value:
                      typeof athlete.age === "number" ? `${athlete.age} years` : "Not set",
                  },
                  {
                    label: "Development Level",
                    value: formatLabel(athlete.level),
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[24px] border border-slate-200/80 bg-white/80 p-4"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      {item.label}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-secondary">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel rounded-[32px] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                Gallery
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-secondary">
                Photos and clips
              </h2>

              {mediaGallery.length ? (
                <div className="mt-6 space-y-6">
                  {mediaPhotos.length ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {mediaPhotos.map((media) => (
                        <div
                          key={media.id}
                          className="relative overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/70"
                        >
                          <Image
                            src={media.url}
                            alt={media.caption || athlete.name}
                            width={1200}
                            height={900}
                            className="h-72 w-full object-cover"
                            sizes="(max-width: 768px) 100vw, 50vw"
                          />
                          {media.caption ? (
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent px-4 pb-4 pt-10 text-sm text-white">
                              {media.caption}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {mediaVideos.length ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {mediaVideos.map((media) => (
                        <div
                          key={media.id}
                          className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/70"
                        >
                          <video
                            src={media.url}
                            controls
                            className="h-72 w-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="mt-6 rounded-[28px] border border-dashed border-slate-300 bg-white/60 px-4 py-10 text-center text-sm text-slate-500">
                  Media highlights will appear here as new scouting assets are added.
                </div>
              )}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="glass-panel rounded-[32px] p-6">
              <div className="flex items-center gap-2">
                <MdOutlineSportsSoccer className="text-primary" size={18} />
                <h3 className="text-xl font-semibold text-secondary">
                  Quick facts
                </h3>
              </div>
              <div className="mt-5 space-y-4 text-sm">
                <div className="rounded-[24px] border border-slate-200/80 bg-white/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Location
                  </p>
                  <p className="mt-2 inline-flex items-center gap-2 font-semibold text-secondary">
                    <MdLocationOn size={16} />
                    {athlete.county || athlete.location || "Not set"}
                  </p>
                </div>
                <div className="rounded-[24px] border border-slate-200/80 bg-white/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Training Program
                  </p>
                  <p className="mt-2 font-semibold text-secondary">
                    {athlete.trainingProgram || "Program assignment not set"}
                  </p>
                </div>
                <div className="rounded-[24px] border border-slate-200/80 bg-white/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Performance Notes
                  </p>
                  <p className="mt-2 leading-7 text-slate-600">
                    {athlete.performanceNotes ||
                      "Coach observations and longer-form development notes are still being compiled."}
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-panel rounded-[32px] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                Enquiry Desk
              </p>
              <h3 className="mt-3 text-2xl font-semibold text-secondary">
                Start a conversation
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Reach the Benzard team if you want more context on availability,
                scouting history, or partnership fit for this athlete.
              </p>
              <button
                type="button"
                onClick={() => setContactOpen(true)}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-secondary px-4 py-3 text-sm font-semibold text-white transition hover:bg-secondary-hover"
              >
                <MdMailOutline size={18} />
                Contact / Enquire
              </button>
            </div>
          </aside>
        </div>
      </section>

      {contactOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-xl rounded-[32px] bg-white">
            <div className="flex items-start justify-between border-b border-slate-200/70 px-6 py-5">
              <div>
                <h3 className="text-lg font-semibold text-secondary">
                  Contact about {athlete.name}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Send an enquiry and the admin team will follow up with you.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setContactOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close enquiry form"
              >
                <MdClose size={18} />
              </button>
            </div>

            <div className="grid gap-4 px-6 py-5">
              <label className="block text-sm font-medium text-slate-700">
                Name
                <input
                  type="text"
                  value={contactName}
                  onChange={(event) => setContactName(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-secondary/20 focus:ring-2 focus:ring-secondary/10"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Email
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(event) => setContactEmail(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-secondary/20 focus:ring-2 focus:ring-secondary/10"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Phone
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(event) => setContactPhone(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-secondary/20 focus:ring-2 focus:ring-secondary/10"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Message
                <textarea
                  rows={5}
                  value={contactMessage}
                  onChange={(event) => setContactMessage(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-secondary/20 focus:ring-2 focus:ring-secondary/10"
                />
              </label>

              <button
                type="button"
                onClick={() => void handleEnquirySubmit()}
                disabled={contactSubmitting}
                className="inline-flex items-center justify-center rounded-2xl bg-secondary px-4 py-3 text-sm font-semibold text-white transition hover:bg-secondary-hover disabled:cursor-not-allowed disabled:opacity-70"
              >
                {contactSubmitting ? "Sending..." : "Send enquiry"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </PublicPageCanvas>
  );
}
