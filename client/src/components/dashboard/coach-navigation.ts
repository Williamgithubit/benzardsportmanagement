import type { IconType } from "react-icons";
import {
  MdDashboardCustomize,
  MdGroups,
  MdInsights,
  MdNotifications,
  MdOutlineBadge,
  MdSchedule,
  MdSportsSoccer,
} from "react-icons/md";

export type CoachTabId =
  | "dashboard"
  | "squad"
  | "performance"
  | "training"
  | "matches"
  | "notifications"
  | "profile";

export interface CoachNavigationItem {
  id: CoachTabId;
  label: string;
  description: string;
  icon: IconType;
}

export const coachNavigation: CoachNavigationItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    description: "Overview, alerts, trends, and availability snapshots.",
    icon: MdDashboardCustomize,
  },
  {
    id: "squad",
    label: "Squad",
    description: "Manage the roster, player status, and matchday selections.",
    icon: MdGroups,
  },
  {
    id: "performance",
    label: "Performance",
    description: "Compare players, review form, and spot underperformance.",
    icon: MdInsights,
  },
  {
    id: "training",
    label: "Training",
    description: "Plan sessions, track effort, and keep attendance in view.",
    icon: MdSchedule,
  },
  {
    id: "matches",
    label: "Matches",
    description: "Save formations, tactical plans, and pre-match readiness.",
    icon: MdSportsSoccer,
  },
  {
    id: "notifications",
    label: "Notifications",
    description: "Track availability, attendance, and performance alerts.",
    icon: MdNotifications,
  },
  {
    id: "profile",
    label: "Profile",
    description: "Manage your account details and profile image.",
    icon: MdOutlineBadge,
  },
];

export const coachTabs = coachNavigation.map((item) => item.id);

export const isCoachTab = (value: string): value is CoachTabId =>
  coachTabs.includes(value as CoachTabId);

export const getCoachTabMeta = (tab: CoachTabId) =>
  coachNavigation.find((item) => item.id === tab) || coachNavigation[0];
