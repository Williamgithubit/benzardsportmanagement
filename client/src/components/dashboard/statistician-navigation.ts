import type { IconType } from "react-icons";
import {
  MdDashboardCustomize,
  MdGroups,
  MdInsights,
  MdNotifications,
  MdOutlineBadge,
  MdQueryStats,
  MdSchedule,
  MdSportsSoccer,
} from "react-icons/md";

export type StatisticianTabId =
  | "overview"
  | "live-match"
  | "players"
  | "team-stats"
  | "performance"
  | "attendance"
  | "notifications"
  | "profile";

export interface StatisticianNavigationItem {
  id: StatisticianTabId;
  label: string;
  description: string;
  icon: IconType;
}

export const statisticianNavigation: StatisticianNavigationItem[] = [
  {
    id: "overview",
    label: "Overview",
    description: "Live dashboard metrics, trends, and recent matches.",
    icon: MdDashboardCustomize,
  },
  {
    id: "live-match",
    label: "Live Match",
    description: "Track scorelines, events, and player evaluations in real time.",
    icon: MdSportsSoccer,
  },
  {
    id: "players",
    label: "Player Stats",
    description: "Search player performance, cards, minutes, and match history.",
    icon: MdGroups,
  },
  {
    id: "team-stats",
    label: "Team Stats",
    description: "Review results, goals, and competition standing snapshots.",
    icon: MdQueryStats,
  },
  {
    id: "performance",
    label: "Performance",
    description: "Monitor form, score trends, and underperforming players.",
    icon: MdInsights,
  },
  {
    id: "attendance",
    label: "Attendance",
    description: "Create training sessions and mark squad attendance quickly.",
    icon: MdSchedule,
  },
  {
    id: "notifications",
    label: "Notifications",
    description: "Track live alerts and enable device push notifications.",
    icon: MdNotifications,
  },
  {
    id: "profile",
    label: "Profile",
    description: "Manage your account details and upload a Cloudinary headshot.",
    icon: MdOutlineBadge,
  },
];

export const statisticianTabs = statisticianNavigation.map((item) => item.id);

export const isStatisticianTab = (
  value: string,
): value is StatisticianTabId => statisticianTabs.includes(value as StatisticianTabId);

export const getStatisticianTabMeta = (tab: StatisticianTabId) =>
  statisticianNavigation.find((item) => item.id === tab) || statisticianNavigation[0];
