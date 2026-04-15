import type { Timestamp } from "firebase/firestore";

export type NotificationPriority = "low" | "medium" | "high";
export type NotificationAudienceRole = "admin" | "statistician" | "all" | string;
export type NotificationType =
  | "attendance_alert"
  | "match_alert"
  | "performance_alert"
  | "system_alert"
  | "blog"
  | "athlete"
  | "event"
  | "contact"
  | "system"
  | string;

export interface NotificationPayloadData extends Record<string, unknown> {
  actionUrl?: string;
  actionLabel?: string;
  priority?: NotificationPriority;
}

export interface Notification {
  id: string;
  userId?: string | null;
  role?: NotificationAudienceRole;
  recipientRole?: NotificationAudienceRole;
  type: NotificationType;
  title?: string;
  message?: string;
  body?: string;
  data?: NotificationPayloadData;
  read?: boolean;
  dedupeKey?: string;
  createdAt?:
    | Date
    | string
    | Timestamp
    | {
        toDate: () => Date;
      };
}
