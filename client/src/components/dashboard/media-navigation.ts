import type { IconType } from "react-icons";
import {
  MdCampaign,
  MdDashboardCustomize,
  MdImage,
  MdNotifications,
  MdOutlineBadge,
  MdPostAdd,
} from "react-icons/md";

export type MediaTabId =
  | "dashboard"
  | "posts"
  | "media-library"
  | "announcements"
  | "notifications"
  | "profile";

export interface MediaNavigationItem {
  id: MediaTabId;
  label: string;
  description: string;
  icon: IconType;
}

export const mediaNavigation: MediaNavigationItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    description: "Publishing overview, analytics, and recent activity.",
    icon: MdDashboardCustomize,
  },
  {
    id: "posts",
    label: "Posts",
    description: "Create blog posts, match reports, event stories, and updates.",
    icon: MdPostAdd,
  },
  {
    id: "media-library",
    label: "Media Library",
    description: "Upload, tag, preview, and manage images and videos.",
    icon: MdImage,
  },
  {
    id: "announcements",
    label: "Announcements",
    description: "Send targeted updates to players and staff.",
    icon: MdCampaign,
  },
  {
    id: "notifications",
    label: "Notifications",
    description: "Track reminders, player updates, and match alerts.",
    icon: MdNotifications,
  },
  {
    id: "profile",
    label: "Profile",
    description: "Manage your account details and profile image.",
    icon: MdOutlineBadge,
  },
];

export const mediaTabs = mediaNavigation.map((item) => item.id);

export const isMediaTab = (value: string): value is MediaTabId =>
  mediaTabs.includes(value as MediaTabId);

export const getMediaTabMeta = (tab: MediaTabId) =>
  mediaNavigation.find((item) => item.id === tab) || mediaNavigation[0];
