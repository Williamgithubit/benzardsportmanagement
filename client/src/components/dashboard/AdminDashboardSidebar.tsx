"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { MdChevronRight, MdClose, MdLogout } from "react-icons/md";
import type { IconType } from "react-icons";
import { useAppDispatch, useAppSelector } from "@/store/store";
import { selectAuthState } from "@/store/Auth/authSlice";
import { performLogout } from "@/store/Auth/logoutAction";
import {
  adminNavigation,
  AdminTabId,
  getAdminTabMeta,
} from "./admin-navigation";

interface AdminDashboardSidebarProps {
  activeTab: AdminTabId;
  onTabChange: (tab: AdminTabId) => void;
  mobileOpen: boolean;
  setMobileOpen: (value: boolean) => void;
}

export default function AdminDashboardSidebar({
  activeTab,
  onTabChange,
  mobileOpen,
  setMobileOpen,
}: AdminDashboardSidebarProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(selectAuthState);
  const [contentOpen, setContentOpen] = useState(() =>
    ["blog", "media"].includes(activeTab),
  );

  useEffect(() => {
    if (["blog", "media"].includes(activeTab)) {
      setContentOpen(true);
    }
  }, [activeTab]);

  const activeMeta = getAdminTabMeta(activeTab);

  const handleLogout = async () => {
    try {
      await dispatch(performLogout());
      toast.success("Logged out successfully");
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("We couldn't complete the logout cleanly.");
      router.push("/login");
      router.refresh();
    }
  };

  const renderNavButton = (
    id: AdminTabId,
    label: string,
    description: string,
    Icon: IconType,
  ) => {
    const isActive = activeTab === id;

    return (
      <button
        key={id}
        type="button"
        onClick={() => {
          onTabChange(id);
          setMobileOpen(false);
        }}
        className={`group w-full rounded-lg px-2 py-1.5 text-left text-xs transition ${
          isActive
            ? "bg-white/12 text-white shadow-[0_8px_16px_-16px_rgba(255,255,255,0.4)]"
            : "text-white/70 hover:bg-white/8 hover:text-white"
        }`}
      >
        <div className="flex items-start gap-2">
          <div
            className={`mt-0 rounded-lg p-1.5 shrink-0 ${
              isActive
                ? "bg-red-500/20 text-red-400"
                : "bg-white/8 text-white/60 group-hover:bg-white/12 group-hover:text-white"
            }`}
          >
            <Icon size={14} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold truncate">{label}</p>
            <p className="mt-0.5 text-[10px] leading-3 text-white/55 truncate">
              {description}
            </p>
          </div>
        </div>
      </button>
    );
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-sm transition lg:hidden ${
          mobileOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        onClick={() => setMobileOpen(false)}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 transform transition duration-300 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-[linear-gradient(135deg,#000054_80%,#1a1a6e_20%,#000054_100%)] px-5 py-4 text-white shadow-[0_32px_90px_-42px_rgba(0,0,84,0.95)]">
          <div className="pointer-events-none absolute inset-x-4 top-0 h-40 rounded-full bg-red-500/8 blur-3xl" />

          <div className="relative flex items-start justify-between">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="glass-panel flex items-center gap-2 rounded-[20px] bg-white/10 px-3 py-2 text-left text-white transition hover:bg-white/14"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                <Image
                  src="/assets/Benzard_Logo.png"
                  alt="Benzard Sports Management"
                  width={32}
                  height={32}
                  className="object-contain"
                />
              </div>
              <div>
                <p className="text-xs font-semibold">Benzard Sports</p>
                <p className="text-[10px] text-white/65">Admin</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/12 bg-white/8 text-white/80 transition hover:bg-white/14 lg:hidden"
              aria-label="Close dashboard navigation"
            >
              <MdClose size={20} />
            </button>
          </div>

          <div className="relative mt-2 rounded-2xl border border-white/10 bg-white/6 p-2">
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/50">
              Current Workspace
            </p>
            <p className="mt-0.5 text-sm font-semibold">{activeMeta.label}</p>
            <p className="mt-0.5 text-xs leading-4 text-white/60">
              {activeMeta.description}
            </p>
          </div>

          <nav className="relative mt-3 flex-1 min-h-0 overflow-y-auto pr-1">
            <div className="space-y-0.5 pb-2">
              {adminNavigation.map((item) => {
                if (item.children) {
                  const isGroupActive = item.children.some(
                    (child) => child.id === activeTab,
                  );

                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-white/10 bg-white/5 p-0.5 mb-0.5"
                    >
                      <button
                        type="button"
                        onClick={() => setContentOpen((current) => !current)}
                        className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs transition ${
                          isGroupActive
                            ? "bg-white/10 text-white"
                            : "text-white/70 hover:bg-white/8 hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className={`rounded-lg p-1.5 shrink-0 ${
                              isGroupActive
                                ? "bg-red-500/20 text-red-400"
                                : "bg-white/8 text-white/60"
                            }`}
                          >
                            <item.icon size={14} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold truncate">
                              {item.label}
                            </p>
                            <p className="text-[10px] text-white/50 truncate">
                              {item.description}
                            </p>
                          </div>
                        </div>
                        <MdChevronRight
                          size={14}
                          className={`transition shrink-0 ${contentOpen ? "rotate-90" : ""}`}
                        />
                      </button>

                      {contentOpen ? (
                        <div className="mt-0.5 space-y-0.5 px-1 pb-0.5">
                          {item.children.map((child) =>
                            renderNavButton(
                              child.id,
                              child.label,
                              child.description,
                              child.icon,
                            ),
                          )}
                        </div>
                      ) : null}
                    </div>
                  );
                }

                if (!item.children && item.id !== "content") {
                  return renderNavButton(
                    item.id as AdminTabId,
                    item.label,
                    item.description,
                    item.icon,
                  );
                }
              })}
            </div>
          </nav>

          <div className="relative mt-2 rounded-2xl border border-white/12 bg-white/8 p-2.5">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-red-500/20 text-[10px] font-semibold text-red-400 shrink-0">
                {user?.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.photoURL}
                    alt={user.displayName || user.name || "Admin"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  (user?.displayName || user?.name || user?.email || "A")
                    .slice(0, 1)
                    .toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold">
                  {user?.displayName || user?.name || "Admin"}
                </p>
                <p className="truncate text-[9px] uppercase tracking-[0.12em] text-white/50">
                  {user?.role || "admin"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-600"
            >
              <MdLogout size={14} />
              Sign Out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
