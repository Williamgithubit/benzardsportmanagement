"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import useDashboardNotifications from "@/hooks/useDashboardNotifications";
import {
  clearAllNotifications,
  deleteNotification,
  markAllNotificationsRead,
  markNotificationRead,
  setNotifications,
} from "@/store/notificationsSlice";
import { useAppDispatch } from "@/store/store";
import type { Notification, NotificationPriority } from "@/types/notification";
import { toDate } from "@/utils/firestore";

type NotificationTone = "info" | "success" | "warning" | "error";

interface NotificationBellProps {
  fallbackRoutes?: Record<string, string>;
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

const resolveTone = (notification: Notification): NotificationTone => {
  const type = notification.type;
  if (type === "attendance_alert" || type === "performance_alert") {
    return "warning";
  }
  if (type === "match_alert") {
    return "error";
  }
  if (type === "blog") {
    return "success";
  }
  return "info";
};

const resolvePriority = (notification: Notification): NotificationPriority => {
  const priority = notification.data?.priority;
  if (priority === "high" || priority === "medium" || priority === "low") {
    return priority;
  }
  return "medium";
};

const formatRelativeTime = (timestamp: string | undefined) => {
  const parsed = toDate(timestamp);
  if (!parsed) return "Just now";

  const diffInMinutes = Math.floor((Date.now() - parsed.getTime()) / 60000);
  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;

  return `${Math.floor(diffInHours / 24)}d ago`;
};

export default function NotificationBell({
  fallbackRoutes = {},
}: NotificationBellProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const { items, unreadCount, user, teamId } = useDashboardNotifications(30);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const notifications = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        tone: resolveTone(item),
        priority: resolvePriority(item),
        actionUrl:
          (typeof item.data?.actionUrl === "string" && item.data.actionUrl) ||
          fallbackRoutes[item.type],
        actionLabel:
          typeof item.data?.actionLabel === "string"
            ? item.data.actionLabel
            : undefined,
      })),
    [fallbackRoutes, items],
  );
  const canMutateNotification = (notification: Notification) =>
    user?.role === "admin" ||
    (Boolean(notification.userId) && notification.userId === user?.uid);

  const updateLocalReadState = (notificationId?: string) => {
    dispatch(
      setNotifications(
        items.map((item) =>
          !notificationId || item.id === notificationId
            ? { ...item, read: true }
            : item,
        ),
      ),
    );
  };

  const handleNotificationClick = async (notification: (typeof notifications)[number]) => {
    try {
      if (canMutateNotification(notification)) {
        await dispatch(
          markNotificationRead({ id: notification.id, read: true }),
        ).unwrap();
      }
      updateLocalReadState(notification.id);
      setOpen(false);

      if (notification.actionUrl) {
        router.push(notification.actionUrl);
      }
    } catch (error) {
      console.error("Failed to handle notification click:", error);
      toast.error("Unable to update that notification.");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      if (!user?.uid) {
        updateLocalReadState();
        return;
      }

      await dispatch(
        markAllNotificationsRead({
          role: user.role || null,
          userId: user.uid,
          teamId,
        }),
      ).unwrap();
      updateLocalReadState();
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Failed to mark notifications as read:", error);
      toast.error("Unable to update notifications right now.");
    }
  };

  const handleDeleteNotification = async (
    notificationId: string,
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.stopPropagation();

    try {
      const notification = notifications.find((item) => item.id === notificationId);
      if (!notification || !canMutateNotification(notification)) {
        toast.error("That notification can only be removed by its owner.");
        return;
      }

      await dispatch(deleteNotification(notificationId)).unwrap();
      toast.success("Notification removed");
    } catch (error) {
      console.error("Failed to delete notification:", error);
      toast.error("Unable to delete notification.");
    }
  };

  const handleClearAllNotifications = async () => {
    try {
      if (!user?.uid) {
        dispatch(setNotifications([]));
        setOpen(false);
        return;
      }

      await dispatch(
        clearAllNotifications({
          role: user.role || null,
          userId: user.uid,
          teamId,
        }),
      ).unwrap();
      dispatch(setNotifications([]));
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
                  onClick={() => void handleMarkAllAsRead()}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:border-emerald-200 hover:text-emerald-600"
                  title="Mark all as read"
                >
                  <MdDoneAll size={18} />
                </button>
              ) : null}

              {notifications.length > 0 ? (
                <button
                  type="button"
                  onClick={() => void handleClearAllNotifications()}
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
                  <div
                    key={notification.id}
                    onClick={() => void handleNotificationClick(notification)}
                    className={`flex cursor-pointer items-start gap-3 rounded-[24px] px-3 py-3 text-left transition ${
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
                              {notification.title || "Update"}
                            </p>
                            {!notification.read ? (
                              <MdCircle size={8} className="flex-shrink-0 text-primary" />
                            ) : null}
                          </div>
                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            {notification.message || notification.body || "New activity is available."}
                          </p>
                        </div>

                        {canMutateNotification(notification) ? (
                          <button
                            type="button"
                            onClick={(event) =>
                              void handleDeleteNotification(notification.id, event)
                            }
                            className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white hover:text-rose-600"
                            aria-label="Delete notification"
                          >
                            <MdDelete size={16} />
                          </button>
                        ) : null}
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="text-xs font-medium text-slate-500">
                          {formatRelativeTime(
                            typeof notification.createdAt === "string"
                              ? notification.createdAt
                              : undefined,
                          )}
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
                  </div>
                );
              })}
            </div>
          )}

          <div className="border-t border-slate-200/70 px-4 py-3">
            <button
              type="button"
              onClick={() => {
                setOpen(false);

                if (user?.role === "admin") {
                  router.push("/dashboard/admin#notifications");
                  return;
                }

                if (user?.role === "statistician") {
                  router.push("/dashboard/statistician#notifications");
                }
              }}
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
}
