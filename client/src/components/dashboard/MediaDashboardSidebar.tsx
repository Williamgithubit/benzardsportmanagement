"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { MdClose, MdLogout } from "react-icons/md";
import { useAppDispatch, useAppSelector } from "@/store/store";
import { performLogout } from "@/store/Auth/logoutAction";
import { selectAuthState } from "@/store/Auth/authSlice";
import {
  mediaNavigation,
  type MediaTabId,
  getMediaTabMeta,
} from "./media-navigation";

interface MediaDashboardSidebarProps {
  activeTab: MediaTabId;
  onTabChange: (tab: MediaTabId) => void;
  mobileOpen: boolean;
  setMobileOpen: (value: boolean) => void;
}

export default function MediaDashboardSidebar({
  activeTab,
  onTabChange,
  mobileOpen,
  setMobileOpen,
}: MediaDashboardSidebarProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(selectAuthState);
  const [logoutPending, setLogoutPending] = useState(false);
  const activeMeta = getMediaTabMeta(activeTab);

  const handleLogout = async () => {
    try {
      setLogoutPending(true);
      await dispatch(performLogout());
      toast.success("Logged out successfully");
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("We couldn't complete the logout cleanly.");
      router.push("/login");
      router.refresh();
    } finally {
      setLogoutPending(false);
    }
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
        <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-[linear-gradient(135deg,#0f172a_82%,#0369a1_18%,#0f172a_100%)] px-5 py-4 text-white shadow-[0_32px_90px_-42px_rgba(3,105,161,0.95)]">
          <div className="pointer-events-none absolute inset-x-4 top-0 h-40 rounded-full bg-sky-300/10 blur-3xl" />

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
                <p className="text-[10px] text-white/65">Media</p>
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

          <div className="relative mt-3 rounded-2xl border border-white/10 bg-white/6 p-3">
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/50">
              Current Workspace
            </p>
            <p className="mt-1 text-sm font-semibold">{activeMeta.label}</p>
            <p className="mt-1 text-xs leading-4 text-white/60">
              {activeMeta.description}
            </p>
          </div>

          <nav className="relative mt-4 flex-1 min-h-0 overflow-y-auto pr-1">
            <div className="space-y-1">
              {mediaNavigation.map((item) => {
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onTabChange(item.id);
                      setMobileOpen(false);
                    }}
                    className={`group w-full rounded-2xl px-3 py-2 text-left text-xs transition ${
                      isActive
                        ? "bg-white/12 text-white shadow-[0_8px_16px_-16px_rgba(255,255,255,0.4)]"
                        : "text-white/70 hover:bg-white/8 hover:text-white"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`rounded-xl p-2 ${
                          isActive
                            ? "bg-sky-300/20 text-sky-300"
                            : "bg-white/8 text-white/60 group-hover:bg-white/12 group-hover:text-white"
                        }`}
                      >
                        <item.icon size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate">{item.label}</p>
                        <p className="mt-0.5 text-[10px] leading-4 text-white/55">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </nav>

          <div className="relative mt-3 rounded-2xl border border-white/12 bg-white/8 p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-sky-300/20 text-[10px] font-semibold text-sky-300">
                {user?.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.photoURL}
                    alt={user.displayName || user.name || "Media"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  (user?.displayName || user?.name || user?.email || "M")
                    .slice(0, 1)
                    .toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold">
                  {user?.displayName || user?.name || "Media"}
                </p>
                <p className="truncate text-[9px] uppercase tracking-[0.12em] text-white/50">
                  {user?.role || "media"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              disabled={logoutPending}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <MdLogout size={16} />
              {logoutPending ? "Signing out..." : "Logout"}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
