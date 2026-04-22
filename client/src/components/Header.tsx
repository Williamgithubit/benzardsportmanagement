"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import {
  MdArrowOutward,
  MdClose,
  MdDashboardCustomize,
  MdLogin,
  MdLogout,
  MdMenu,
  MdWbSunny,
} from "react-icons/md";
import { RootState, useAppDispatch } from "@/store/store";
import { performLogout } from "@/store/Auth/logoutAction";
import logo from "../../public/assets/Benzard_Logo.png";

interface NavigationItem {
  name: string;
  path: string;
}

const navigation: NavigationItem[] = [
  { name: "Home", path: "/" },
  { name: "About", path: "/about" },
  { name: "Athletes", path: "/athletes" },
  { name: "Events", path: "/events" },
  { name: "Blog", path: "/blog" },
  { name: "Contact", path: "/contact" },
];

const formatRoleLabel = (role?: string | null) => {
  if (!role) {
    return "Guest";
  }

  return role
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const normalizeRoleKey = (role?: string | null) =>
  typeof role === "string" ? role.trim().toLowerCase() : "";

const getDashboardPath = (role?: string | null) => {
  switch (normalizeRoleKey(role)) {
    case "admin":
      return "/dashboard/admin";
    case "statistician":
      return "/dashboard/statistician";
    case "coach":
      return "/dashboard/coach";
    case "media":
      return "/dashboard/media";
    default:
      return "/";
  }
};

const Header = () => {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, role } = useSelector((state: RootState) => state.auth);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    setIsMenuOpen(false);
    setIsProfileOpen(false);
  }, [pathname]);

  const resolvedRole = role || user?.role || null;
  const dashboardPath = useMemo(
    () => getDashboardPath(resolvedRole),
    [resolvedRole],
  );
  const canOpenDashboard = dashboardPath !== "/";
  const userName =
    user?.displayName || user?.name || user?.email?.split("@")[0] || "Guest";
  const roleLabel = formatRoleLabel(resolvedRole);

  const handleLogout = async () => {
    try {
      await dispatch(performLogout());
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      router.push("/login");
      router.refresh();
      setIsProfileOpen(false);
      setIsMenuOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 px-4 pt-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="glass-panel flex items-center justify-between gap-4 rounded-[28px] px-4 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-3 rounded-2xl border border-white/70 bg-white/70 px-3 py-2 shadow-sm transition hover:border-primary/20 hover:bg-white"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary/6">
                <Image
                  src={logo}
                  alt="Benzard Sports Management"
                  width={36}
                  height={36}
                  priority
                />
              </div>
              <div className="hidden min-w-0 sm:block">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                    <MdWbSunny size={14} />
                    Matchday Ready
                  </span>
                </div>
                <p className="mt-1 truncate text-sm font-semibold text-secondary">
                  Benzard Sports Management
                </p>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                  Grassroots to Glory
                </p>
              </div>
            </Link>

            <nav className="hidden items-center gap-1 lg:flex">
              {navigation.map((item) => {
                const isActive =
                  item.path === "/"
                    ? pathname === item.path
                    : pathname?.startsWith(item.path);

                return (
                  <Link
                    key={item.name}
                    href={item.path}
                    className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                      isActive
                        ? "bg-secondary text-white shadow-[0_16px_34px_-22px_rgba(0,0,84,0.72)]"
                        : "text-slate-600 hover:bg-white hover:text-secondary"
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-3 lg:flex">
              {user ? (
                <>
                  {canOpenDashboard ? (
                    <Link
                      href={dashboardPath}
                      className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-secondary/20 hover:text-secondary"
                    >
                      <MdDashboardCustomize size={19} />
                      <span>Dashboard</span>
                    </Link>
                  ) : null}

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsProfileOpen((current) => !current)}
                      className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-left shadow-sm transition hover:border-primary/20"
                    >
                      <p className="text-sm font-semibold text-slate-900">
                        {userName}
                      </p>
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                        {roleLabel}
                      </p>
                    </button>

                    {isProfileOpen ? (
                      <div className="absolute right-0 top-[calc(100%+12px)] w-60 rounded-[24px] border border-white/70 bg-white/95 p-3 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.4)] backdrop-blur-xl">
                        <Link
                          href="/"
                          className="flex items-center justify-between rounded-2xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-secondary"
                        >
                          Public site
                          <MdArrowOutward size={18} />
                        </Link>
                        {canOpenDashboard ? (
                          <Link
                            href={dashboardPath}
                            className="mt-1 flex items-center justify-between rounded-2xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-secondary"
                          >
                            Open dashboard
                            <MdArrowOutward size={18} />
                          </Link>
                        ) : null}
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="mt-2 flex w-full items-center justify-between rounded-2xl bg-secondary px-3 py-2 text-sm font-semibold text-white transition hover:bg-secondary-hover"
                        >
                          Sign out
                          <MdLogout size={18} />
                        </button>
                      </div>
                    ) : null}
                  </div>
                </>
              ) : (
                <>
                  <Link
                    href="/contact"
                    className="inline-flex h-11 items-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-secondary/20 hover:text-secondary"
                  >
                    Partner With Us
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex h-11 items-center gap-2 rounded-2xl bg-secondary px-4 text-sm font-semibold text-white shadow-[0_16px_40px_-20px_rgba(0,0,84,0.72)] transition hover:bg-secondary-hover"
                  >
                    <MdLogin size={19} />
                    Login
                  </Link>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsMenuOpen((current) => !current)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:border-primary/30 hover:text-primary lg:hidden"
              aria-label="Toggle navigation menu"
            >
              {isMenuOpen ? <MdClose size={22} /> : <MdMenu size={22} />}
            </button>
          </div>
        </div>

        {isMenuOpen ? (
          <div className="glass-panel mt-3 rounded-[28px] p-4 lg:hidden">
            <div className="space-y-2">
              {navigation.map((item) => {
                const isActive =
                  item.path === "/"
                    ? pathname === item.path
                    : pathname?.startsWith(item.path);

                return (
                  <Link
                    key={item.name}
                    href={item.path}
                    className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                      isActive
                        ? "bg-secondary text-white"
                        : "bg-white/75 text-slate-700 hover:bg-white hover:text-secondary"
                    }`}
                  >
                    <span>{item.name}</span>
                    <MdArrowOutward size={18} />
                  </Link>
                );
              })}
            </div>

            <div className="mt-4 rounded-[24px] border border-white/70 bg-white/75 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                {user ? "Account" : "Access"}
              </p>
              <p className="mt-2 text-lg font-semibold text-secondary">
                {user ? userName : "Join the network"}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {user
                  ? roleLabel
                  : "Sign in to manage athletes, events, and team operations."}
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {user ? (
                  <>
                    {canOpenDashboard ? (
                      <Link
                        href={dashboardPath}
                        className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-secondary/20 hover:text-secondary"
                      >
                        Open Dashboard
                      </Link>
                    ) : null}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="inline-flex h-11 items-center justify-center rounded-2xl bg-secondary px-4 text-sm font-semibold text-white transition hover:bg-secondary-hover"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/contact"
                      className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-secondary/20 hover:text-secondary"
                    >
                      Contact Us
                    </Link>
                    <Link
                      href="/login"
                      className="inline-flex h-11 items-center justify-center rounded-2xl bg-secondary px-4 text-sm font-semibold text-white transition hover:bg-secondary-hover"
                    >
                      Login
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
};

export default Header;
