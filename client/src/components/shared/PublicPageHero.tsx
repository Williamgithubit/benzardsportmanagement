"use client";

import type { ReactNode } from "react";

interface PublicHeroStat {
  label: string;
  value: string;
  accentClassName?: string;
}

interface PublicPageHeroProps {
  badge: string;
  badgeIcon?: ReactNode;
  title: string;
  description: string;
  actions?: ReactNode;
  stats?: PublicHeroStat[];
  aside?: ReactNode;
}

export default function PublicPageHero({
  badge,
  badgeIcon,
  title,
  description,
  actions,
  stats = [],
  aside,
}: PublicPageHeroProps) {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
      <div className="glass-panel rounded-[36px] p-6 sm:p-8 lg:p-10">
        <div className={`grid gap-8 ${aside ? "lg:grid-cols-[1.12fr_0.88fr]" : ""}`}>
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              {badgeIcon}
              {badge}
            </div>

            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-secondary sm:text-5xl">
              {title}
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              {description}
            </p>

            {actions ? <div className="mt-8 flex flex-col gap-3 sm:flex-row">{actions}</div> : null}

            {stats.length ? (
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {stats.map((stat) => (
                  <div key={stat.label} className="glass-panel rounded-[26px] p-4">
                    <p className={`text-3xl font-semibold ${stat.accentClassName || "text-secondary"}`}>
                      {stat.value}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">{stat.label}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {aside ? <div>{aside}</div> : null}
        </div>
      </div>
    </section>
  );
}
