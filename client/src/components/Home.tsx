"use client";

import Image from "next/image";
import Link from "next/link";
import {
  MdArrowOutward,
  MdCalendarMonth,
  MdEmojiEvents,
  MdGroups,
  MdOutlineInsights,
  MdSportsSoccer,
  MdTrackChanges,
  MdWbSunny,
} from "react-icons/md";

const impactMetrics = [
  { value: "150+", label: "Athletes Scouted", accent: "text-primary" },
  { value: "24", label: "Live Development Cycles", accent: "text-secondary" },
  { value: "12", label: "Community Event Windows", accent: "text-emerald-600" },
];

const featuredPrograms = [
  {
    title: "Scouting Network",
    description:
      "Track emerging football talent across counties with structured evaluation, highlights, and readiness notes.",
    icon: MdTrackChanges,
    badge: "Talent discovery",
  },
  {
    title: "Elite Training Blocks",
    description:
      "Run focused development cycles that combine technical sessions, fitness work, and match intelligence.",
    icon: MdSportsSoccer,
    badge: "Performance growth",
  },
  {
    title: "Event Operations",
    description:
      "Coordinate tournaments, showcases, and camps with one rhythm across logistics, registrations, and updates.",
    icon: MdCalendarMonth,
    badge: "Matchday delivery",
  },
  {
    title: "Community Partnerships",
    description:
      "Build trust with schools, clubs, and sponsors through outreach that keeps pathways open for young athletes.",
    icon: MdGroups,
    badge: "Regional impact",
  },
];

const operatingModel = [
  {
    step: "01",
    title: "Spot Potential Early",
    description:
      "We identify athletes through local competitions, recommendations, and direct scouting visits.",
  },
  {
    step: "02",
    title: "Train With Structure",
    description:
      "Players move into focused development plans that combine drills, conditioning, and match understanding.",
  },
  {
    step: "03",
    title: "Create Visibility",
    description:
      "Events, showcases, and media moments help athletes earn attention from coaches, clubs, and partners.",
  },
];

const focusAreas = [
  {
    title: "For Athletes",
    description:
      "Clearer pathways from grassroots football into higher-level opportunities and ongoing mentorship.",
  },
  {
    title: "For Coaches",
    description:
      "A coordinated environment for session planning, athlete tracking, and talent progression.",
  },
  {
    title: "For Partners",
    description:
      "A trusted platform for events, sponsorship visibility, and community-centered sports development.",
  },
];

const Home = () => {
  return (
    <div className="relative overflow-hidden pb-20">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="dashboard-grid-pattern absolute inset-0 opacity-50" />
        <div className="absolute -left-24 top-6 h-72 w-72 rounded-full bg-primary/12 blur-3xl" />
        <div className="absolute right-0 top-24 h-80 w-80 rounded-full bg-secondary/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-accent/18 blur-3xl" />
      </div>

      <section className="relative mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:px-8 lg:pt-16">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              <MdWbSunny size={16} />
              Next Generation Football Ops
            </div>

            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-secondary sm:text-5xl lg:text-6xl">
              A sharper home base for scouting, training, and matchday growth.
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              Benzard Sports Management connects grassroots discovery with elite
              development, live event coordination, and community partnerships
              that keep talented athletes moving forward.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/athletes"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-secondary px-5 text-sm font-semibold text-white shadow-[0_18px_44px_-24px_rgba(0,0,84,0.75)] transition hover:bg-secondary-hover"
              >
                Explore Athletes
                <MdArrowOutward size={18} />
              </Link>
              <Link
                href="/contact"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-secondary/20 hover:text-secondary"
              >
                Partner With Us
                <MdArrowOutward size={18} />
              </Link>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {impactMetrics.map((metric) => (
                <div
                  key={metric.label}
                  className="glass-panel rounded-[26px] p-4"
                >
                  <p className={`text-3xl font-semibold ${metric.accent}`}>
                    {metric.value}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">{metric.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="glass-panel overflow-hidden rounded-[36px] p-4 shadow-[0_32px_80px_-40px_rgba(15,23,42,0.55)]">
              <div className="relative overflow-hidden rounded-[28px]">
                <Image
                  src="/assets/1.jpg"
                  alt="Young athletes training on the pitch"
                  width={1200}
                  height={1400}
                  className="h-[420px] w-full object-cover sm:h-[520px]"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/15 to-transparent" />

                <div className="absolute inset-x-4 bottom-4 rounded-[24px] border border-white/20 bg-slate-950/55 p-4 text-white backdrop-blur-xl">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
                        Live Focus
                      </p>
                      <p className="mt-2 text-xl font-semibold">
                        Preparing athletes for the next opportunity window.
                      </p>
                    </div>
                    <div className="hidden rounded-2xl bg-white/12 px-3 py-2 text-right sm:block">
                      <p className="text-2xl font-semibold">89%</p>
                      <p className="text-xs uppercase tracking-[0.16em] text-white/70">
                        Camp readiness
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-panel absolute -left-4 top-6 hidden w-52 rounded-[24px] p-4 lg:block">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
                  <MdEmojiEvents size={24} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Next window
                  </p>
                  <p className="text-lg font-semibold text-secondary">
                    Showcase camp
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-panel absolute -right-4 bottom-10 hidden w-56 rounded-[24px] p-4 lg:block">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                  <MdOutlineInsights size={24} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Weekly pulse
                  </p>
                  <p className="text-lg font-semibold text-secondary">
                    Stronger scouting visibility
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="glass-panel rounded-[36px] px-6 py-8 sm:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                What We Run
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-secondary">
                A modern sports pipeline built for consistency.
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
                From first scouting notes to tournament logistics, every part of
                the platform should feel clear, intentional, and ready for real
                work on the ground.
              </p>
            </div>
            <Link
              href="/events"
              className="inline-flex items-center gap-2 text-sm font-semibold text-secondary transition hover:text-primary"
            >
              View upcoming events
              <MdArrowOutward size={18} />
            </Link>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {featuredPrograms.map((program) => (
              <article
                key={program.title}
                className="group rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-sm transition hover:-translate-y-1 hover:border-primary/15"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {program.badge}
                  </span>
                  <div className="rounded-2xl bg-secondary/6 p-3 text-secondary transition group-hover:bg-primary/10 group-hover:text-primary">
                    <program.icon size={24} />
                  </div>
                </div>
                <h3 className="mt-5 text-xl font-semibold text-secondary">
                  {program.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {program.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="glass-panel rounded-[36px] p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Operating Model
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-secondary">
              Built to move from local discovery to real opportunity.
            </h2>
            <div className="mt-8 space-y-5">
              {operatingModel.map((item) => (
                <div
                  key={item.step}
                  className="rounded-[26px] border border-white/70 bg-white/85 p-5"
                >
                  <div className="flex items-start gap-4">
                    <div className="rounded-2xl bg-secondary px-3 py-2 text-sm font-semibold text-white">
                      {item.step}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-secondary">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-sm leading-7 text-slate-600">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-6">
            <div className="glass-panel overflow-hidden rounded-[36px] p-4">
              <div className="grid gap-4 md:grid-cols-[1fr_0.85fr]">
                <div className="relative overflow-hidden rounded-[28px]">
                  <Image
                    src="/assets/5.jpg"
                    alt="Athletes during a football showcase"
                    width={1200}
                    height={900}
                    className="h-full min-h-[280px] w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-transparent to-transparent" />
                </div>

                <div className="flex flex-col justify-between rounded-[28px] bg-white/85 p-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Why it matters
                    </p>
                    <h3 className="mt-3 text-2xl font-semibold text-secondary">
                      Cleaner systems create better athlete outcomes.
                    </h3>
                    <p className="mt-4 text-sm leading-7 text-slate-600">
                      Coaches, managers, sponsors, and players all need a shared
                      picture of what is happening next. The platform should
                      support that rhythm from the first click.
                    </p>
                  </div>

                  <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-secondary">
                      This season&apos;s priority
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      Expand athlete visibility while keeping event operations
                      smooth and easier to trust.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {focusAreas.map((item) => (
                <div
                  key={item.title}
                  className="glass-panel rounded-[28px] p-5"
                >
                  <h3 className="text-lg font-semibold text-secondary">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-4 pt-2 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[36px] bg-secondary px-6 py-8 text-white shadow-[0_28px_70px_-40px_rgba(0,0,84,0.8)] sm:px-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                Ready To Build With Us
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                Let&apos;s create stronger systems for athletes, events, and
                partnerships.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/80 sm:text-base">
                Whether you&apos;re looking to support a program, identify
                talent, or launch a new football initiative, we can help shape
                the next phase.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link
                href="/contact"
                className="inline-flex h-12 items-center justify-center rounded-2xl bg-white px-5 text-sm font-semibold text-secondary transition hover:bg-slate-100"
              >
                Start a Conversation
              </Link>
              <Link
                href="/blog"
                className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/20 px-5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Read Latest Updates
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
