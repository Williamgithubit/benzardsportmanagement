"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  MdCheckCircle,
  MdCircle,
  MdDelete,
  MdDoneAll,
  MdError,
  MdInfo,
  MdNotificationsActive,
  MdNotificationsNone,
  MdOutlineWarningAmber,
  MdSettings,
} from "react-icons/md";
import { NotificationService } from "@/services/notificationService";
import useUserRole from "@/hooks/useUserRole";
import type { Notification as FirestoreNotification } from "@/types/notification";
import { toDate } from "@/utils/firestore";

type NotificationTone = "info" | "success" | "warning" | "error";
type NotificationPriority = "low" | "medium" | "high";

interface DashboardNotification {
  id: string;
  sourceType: string;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  priority: NotificationPriority;
  tone: NotificationTone;
}

interface NotificationSystemProps {
  onNotificationClick?: (notification: DashboardNotification) => void;
}

const toneStyles: Record<
  NotificationTone,
  {
    icon: React.ComponentType<{ size?: string | number; className?: string }>;
    badge: string;
    iconWrap: string;
  }
> = {
  info: {
    icon: MdInfo,
    badge: "border-sky-200 bg-sky-50 text-sky-600",
    iconWrap: "bg-sky-50 text-sky-600",
  },
  success: {
    icon: MdCheckCircle,
    badge: "border-emerald-200 bg-emerald-50 text-emerald-600",
    iconWrap: "bg-emerald-50 text-emerald-600",
  },
  warning: {
    icon: MdOutlineWarningAmber,
    badge: "border-amber-200 bg-amber-50 text-amber-600",
    iconWrap: "bg-amber-50 text-amber-600",
  },
  error: {
    icon: MdError,
    badge: "border-rose-200 bg-rose-50 text-rose-600",
    iconWrap: "bg-rose-50 text-rose-600",
  },
};

const notificationTabMap: Record<string, string> = {
  athlete: "athletes",
  blog: "blog",
  contact: "contacts",
  event: "events",
  system: "dashboard",
};

const resolveNotificationTone = (type: string): NotificationTone => {
  switch (type) {
    case "blog":
      return "success";
    case "contact":
      return "warning";
    case "system":
      return "info";
    default:
      return "info";
  }
};

const resolveNotificationPriority = (
  notification: FirestoreNotification & Record<string, unknown>
): NotificationPriority => {
  const rawPriority =
    typeof notification.priority === "string"
      ? notification.priority
      : typeof notification.data?.priority === "string"
        ? notification.data.priority
        : "medium";

  if (rawPriority === "high" || rawPriority === "medium" || rawPriority === "low") {
    return rawPriority;
  }

  return "medium";
};

const normalizeNotification = (
  notification: FirestoreNotification & Record<string, unknown>
): DashboardNotification => ({
  id: notification.id,
  sourceType: notification.type || "system",
  title:
    notification.title ||
    notification.body ||
    `${notification.type || "System"} update`,
  message: notification.body || "New activity is available.",
  timestamp:
    notification.createdAt && typeof notification.createdAt === "object" && "toDate" in notification.createdAt && typeof (notification.createdAt as { toDate: () => Date }).toDate === "function"
      ? (notification.createdAt as { toDate: () => Date }).toDate()
      : notification.createdAt
        ? toDate(notification.createdAt) || new Date()
        : new Date(),
  read: Boolean(notification.read),
  actionUrl:
    typeof notification.data?.actionUrl === "string"
      ? notification.data.actionUrl
      : undefined,
  actionLabel:
    typeof notification.data?.actionLabel === "string"
      ? notification.data.actionLabel
      : undefined,
  priority: resolveNotificationPriority(notification),
  tone: resolveNotificationTone(notification.type || "system"),
});

const formatRelativeTime = (timestamp: Date) => {
  const diffInMinutes = Math.floor((Date.now() - timestamp.getTime()) / 60000);

  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
};

const NotificationSystem: React.FC<NotificationSystemProps> = ({
  onNotificationClick,
}) => {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<DashboardNotification[]>([]);
  const userRole = useUserRole();

  useEffect(() => {
    const unsubscribe = NotificationService.subscribeToNotifications(
      userRole.role || "admin",
      (items) => {
        setNotifications(
          items.map((item) => normalizeNotification(item as FirestoreNotification & Record<string, unknown>))
        );
      },
      (error) => {
        console.error("Notification stream unavailable:", error);
        setNotifications([]);
      }
    );

    return () => unsubscribe();
  }, [userRole.role]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications]
  );

  const handleNotificationClick = async (notification: DashboardNotification) => {
    try {
      await NotificationService.markAsRead(notification.id, true);
      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id ? { ...item, read: true } : item
        )
      );

      onNotificationClick?.(notification);
      setOpen(false);

      if (notification.actionUrl) {
        router.push(notification.actionUrl);
        return;
      }

      const targetTab = notificationTabMap[notification.sourceType];
      if (targetTab) {
        router.push(
          targetTab === "dashboard"
            ? "/dashboard/admin"
            : `/dashboard/admin#${targetTab}`
        );

        window.setTimeout(() => {
          window.dispatchEvent(new CustomEvent("changeTab", { detail: targetTab }));
        }, 75);
      }
    } catch (error) {
      console.error("Failed to handle notification click:", error);
      toast.error("Unable to update that notification.");
    }
  };

  const markAllAsRead = async () => {
    try {
      await NotificationService.markAllAsRead();
      setNotifications((current) =>
        current.map((notification) => ({ ...notification, read: true }))
      );
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Failed to mark notifications as read:", error);
      toast.error("Unable to update notifications right now.");
    }
  };

  const deleteNotification = async (
    notificationId: string,
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.stopPropagation();

    try {
      await NotificationService.deleteNotification(notificationId);
      setNotifications((current) =>
        current.filter((notification) => notification.id !== notificationId)
      );
      toast.success("Notification removed");
    } catch (error) {
      console.error("Failed to delete notification:", error);
      toast.error("Unable to delete notification.");
    }
  };

  const clearAllNotifications = async () => {
    try {
      await Promise.all(
        notifications.map((notification) =>
          NotificationService.deleteNotification(notification.id)
        )
      );
      setNotifications([]);
      setOpen(false);
      toast.success("All notifications cleared");
    } catch (error) {
      console.error("Failed to clear notifications:", error);
      toast.error("Unable to clear notifications.");
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:border-secondary/20 hover:text-secondary"
        aria-label="Open notifications"
      >
        {unreadCount > 0 ? (
          <MdNotificationsActive size={22} />
        ) : (
          <MdNotificationsNone size={22} />
        )}

        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="glass-panel absolute right-0 top-[calc(100%+0.75rem)] z-50 w-[min(23rem,calc(100vw-2rem))] overflow-hidden rounded-[28px] border border-slate-200/80">
          <div className="flex items-start justify-between gap-3 border-b border-slate-200/70 px-5 py-4">
            <div>
              <p className="text-lg font-semibold text-secondary">Notifications</p>
              <p className="mt-1 text-sm text-slate-500">
                {unreadCount > 0
                  ? `${unreadCount} unread update${unreadCount === 1 ? "" : "s"}`
                  : "Everything is caught up"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 ? (
                <button
                  type="button"
                  onClick={() => void markAllAsRead()}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:border-emerald-200 hover:text-emerald-600"
                  title="Mark all as read"
                >
                  <MdDoneAll size={18} />
                </button>
              ) : null}

              {notifications.length > 0 ? (
                <button
                  type="button"
                  onClick={() => void clearAllNotifications()}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:border-rose-200 hover:text-rose-600"
                  title="Clear all notifications"
                >
                  <MdDelete size={18} />
                </button>
              ) : null}
            </div>
          </div>

          {notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-3xl border border-slate-200 bg-white text-slate-400">
                <MdNotificationsNone size={28} />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  No notifications yet
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Activity alerts will show up here as they arrive.
                </p>
              </div>
            </div>
          ) : (
            <div className="max-h-[24rem] space-y-1 overflow-y-auto p-3">
              {notifications.map((notification) => {
                const tone = toneStyles[notification.tone];
                const ToneIcon = tone.icon;

                return (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => void handleNotificationClick(notification)}
                    className={`flex w-full items-start gap-3 rounded-[24px] px-3 py-3 text-left transition ${
                      notification.read
                        ? "bg-white/70 hover:bg-slate-50"
                        : "bg-secondary/5 hover:bg-secondary/8"
                    }`}
                  >
                    <span
                      className={`inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl ${tone.iconWrap}`}
                    >
                      <ToneIcon size={18} />
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p
                              className={`truncate text-sm ${
                                notification.read
                                  ? "font-medium text-slate-800"
                                  : "font-semibold text-slate-900"
                              }`}
                            >
                              {notification.title}
                            </p>
                            {!notification.read ? (
                              <MdCircle size={8} className="flex-shrink-0 text-primary" />
                            ) : null}
                          </div>
                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            {notification.message}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={(event) =>
                            void deleteNotification(notification.id, event)
                          }
                          className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white hover:text-rose-600"
                          aria-label="Delete notification"
                        >
                          <MdDelete size={16} />
                        </button>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="text-xs font-medium text-slate-500">
                          {formatRelativeTime(notification.timestamp)}
                        </span>
                        <span
                          className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${tone.badge}`}
                        >
                          {notification.priority}
                        </span>
                        {notification.actionLabel ? (
                          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                            {notification.actionLabel}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <div className="border-t border-slate-200/70 px-4 py-3">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-secondary"
            >
              <MdSettings size={18} />
              Notification settings
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default NotificationSystem;
