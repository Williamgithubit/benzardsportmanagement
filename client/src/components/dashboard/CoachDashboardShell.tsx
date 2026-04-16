"use client";

import { useEffect, useState, type ReactNode } from "react";
import CoachDashboardHeader from "./CoachDashboardHeader";
import CoachDashboardSidebar from "./CoachDashboardSidebar";
import {
  getCoachTabMeta,
  type CoachTabId,
} from "./coach-navigation";

interface CoachDashboardShellProps {
  activeTab: CoachTabId;
  onTabChange: (tab: CoachTabId) => void;
  children: ReactNode;
}

export default function CoachDashboardShell({
  activeTab,
  onTabChange,
  children,
}: CoachDashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const meta = getCoachTabMeta(activeTab);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    setMobileOpen(false);
  }, [activeTab]);

  return (
    <div className="relative min-h-screen overflow-hidden text-slate-900">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="dashboard-grid-pattern absolute inset-0 opacity-60" />
        <div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-secondary/16 blur-3xl" />
        <div className="absolute right-0 top-32 h-80 w-80 rounded-full bg-primary/14 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-secondary/20 blur-3xl" />
      </div>

      <CoachDashboardSidebar
        activeTab={activeTab}
        onTabChange={onTabChange}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <div className="relative lg:pl-72">
        <CoachDashboardHeader
          activeTabLabel={meta.label}
          onMenuToggle={() => setMobileOpen((current) => !current)}
        />

        <main className="min-h-screen px-4 pb-8 pt-28 sm:px-6 lg:px-8">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
