"use client";

import { useMemo } from "react";
import { MdMenu, MdQueryStats } from "react-icons/md";
import NotificationBell from "@/components/dashboard/NotificationBell";
import { useAppSelector } from "@/store/store";
import { selectAuthState } from "@/store/Auth/authSlice";

interface StatisticianDashboardHeaderProps {
  activeTabLabel: string;
  onMenuToggle: () => void;
}

const fallbackRoutes = {
  attendance_alert: "/dashboard/statistician#attendance",
  match_alert: "/dashboard/statistician#live-match",
  performance_alert: "/dashboard/statistician#performance",
  system_alert: "/dashboard/statistician#notifications",
  system: "/dashboard/statistician#notifications",
};

export default function StatisticianDashboardHeader({
  activeTabLabel,
  onMenuToggle,
}: StatisticianDashboardHeaderProps) {
  const { user } = useAppSelector(selectAuthState);

  const currentDateLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      }).format(new Date()),
    [],
  );

  const userName =
    user?.displayName ||
    user?.name ||
    user?.email?.split("@")[0] ||
    "Statistician";

  return (
    <header className="fixed inset-x-0 top-0 z-40 px-4 pt-4 sm:px-6 lg:left-72 lg:px-8">
      <div className="glass-panel mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-[28px] px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenuToggle}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:border-primary/30 hover:text-primary lg:hidden"
            aria-label="Open dashboard navigation"
          >
            <MdMenu size={22} />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                <MdQueryStats size={14} />
                Performance Desk
              </span>
            </div>
            <div className="mt-2 flex min-w-0 flex-col">
              <p className="truncate text-lg font-semibold text-secondary sm:text-xl">
                {activeTabLabel}
              </p>
              <p className="truncate text-sm text-slate-500">
                {currentDateLabel} · Ready to log the next edge, {userName}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <NotificationBell fallbackRoutes={fallbackRoutes} />

          <div className="hidden rounded-2xl border border-slate-200 bg-white px-3 py-2 text-right shadow-sm sm:block">
            <p className="text-sm font-semibold text-slate-900">{userName}</p>
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
              {user?.role || "statistician"}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
