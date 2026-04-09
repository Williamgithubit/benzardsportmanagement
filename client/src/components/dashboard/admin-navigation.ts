import type { IconType } from "react-icons";
import {
  MdAnalytics,
  MdArticle,
  MdCalendarMonth,
  MdContacts,
  MdDashboardCustomize,
  MdImage,
  MdPeopleAlt,
  MdSettings,
  MdSportsSoccer,
} from "react-icons/md";

export type AdminTabId =
  | "dashboard"
  | "athletes"
  | "events"
  | "blog"
  | "media"
  | "users"
  | "contacts"
  | "reports"
  | "settings";

export interface AdminNavigationChild {
  id: AdminTabId;
  label: string;
  description: string;
  icon: IconType;
}

export interface AdminNavigationItem {
  id: "content" | AdminTabId;
  label: string;
  description: string;
  icon: IconType;
  children?: AdminNavigationChild[];
}

export const adminNavigation: AdminNavigationItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    description: "Overview, insights, and recent platform activity.",
    icon: MdDashboardCustomize,
  },
  {
    id: "athletes",
    label: "Athletes",
    description: "Track talent profiles, scouting, and development.",
    icon: MdSportsSoccer,
  },
  {
    id: "events",
    label: "Events",
    description: "Manage upcoming matches, camps, and registrations.",
    icon: MdCalendarMonth,
  },
  {
    id: "content",
    label: "Content",
    description: "Publish blog posts and manage media assets.",
    icon: MdArticle,
    children: [
      {
        id: "blog",
        label: "Blog",
        description: "Create, review, and publish stories.",
        icon: MdArticle,
      },
      {
        id: "media",
        label: "Media",
        description: "Organize photos, video, and uploads.",
        icon: MdImage,
      },
    ],
  },
  {
    id: "users",
    label: "Users",
    description: "Administer permissions, roles, and team access.",
    icon: MdPeopleAlt,
  },
  {
    id: "contacts",
    label: "Contacts",
    description: "Respond to enquiries and inbound communication.",
    icon: MdContacts,
  },
  {
    id: "reports",
    label: "Reports",
    description: "Review platform performance and analytics trends.",
    icon: MdAnalytics,
  },
  {
    id: "settings",
    label: "Settings",
    description: "Control security, preferences, and account setup.",
    icon: MdSettings,
  },
];

export const adminTabs = adminNavigation.flatMap((item) =>
  item.children ? item.children.map((child) => child.id) : item.id
).filter((tab): tab is AdminTabId => tab !== "content");

export const isAdminTab = (value: string): value is AdminTabId =>
  adminTabs.includes(value as AdminTabId);

export const getAdminTabMeta = (tab: AdminTabId) => {
  for (const item of adminNavigation) {
    if (item.children) {
      const child = item.children.find((entry) => entry.id === tab);
      if (child) {
        return child;
      }
    } else if (item.id === tab) {
      return item;
    }
  }

  return adminNavigation[0] as AdminNavigationItem;
};
