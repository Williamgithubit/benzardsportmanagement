"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  MdCampaign,
  MdCheckCircle,
  MdDelete,
  MdDoneAll,
  MdNotifications,
  MdSend,
  MdWifiTethering,
} from "react-icons/md";
import { adminApiFetch } from "@/services/adminApi";
import { enablePushNotifications } from "@/services/fcm";
import {
  clearAllNotifications,
  deleteNotification,
  markAllNotificationsRead,
  markNotificationRead,
  setNotifications,
} from "@/store/notificationsSlice";
import useDashboardNotifications from "@/hooks/useDashboardNotifications";
import { useAppDispatch } from "@/store/store";
import type { Notification } from "@/types/notification";
import { toDate } from "@/utils/firestore";

interface DashboardNotificationsPanelProps {
  variant: "admin" | "statistician" | "coach" | "media";
  canCompose?: boolean;
}

interface SendNotificationResponse {
  success: boolean;
  recipients: number;
  pushTokens: number;
}

const variantStyles = {
  admin: {
    badge: "bg-red-500/10 text-red-500",
    button: "bg-red-500 hover:bg-red-600",
  },
  statistician: {
    badge: "bg-primary/10 text-primary",
    button: "bg-primary hover:bg-primary-hover",
  },
  coach: {
    badge: "bg-emerald-100 text-emerald-700",
    button: "bg-emerald-600 hover:bg-emerald-700",
  },
  media: {
    badge: "bg-sky-100 text-sky-700",
    button: "bg-sky-600 hover:bg-sky-700",
  },
} as const;

const formatRelativeTime = (timestamp?: string) => {
  const parsed = toDate(timestamp);
  if (!parsed) {
    return "Just now";
  }

  const diffInMinutes = Math.floor((Date.now() - parsed.getTime()) / 60000);
  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;

  return `${Math.floor(diffInHours / 24)}d ago`;
};

export default function DashboardNotificationsPanel({
  variant,
  canCompose = false,
}: DashboardNotificationsPanelProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const style = variantStyles[variant];
  const { items, unreadCount, user, teamId } = useDashboardNotifications(50);
  const [permission, setPermission] = useState<string>(
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "unsupported",
  );
  const [sending, setSending] = useState(false);
  const [enablingPush, setEnablingPush] = useState(false);
  const [form, setForm] = useState({
    title: "",
    message: "",
    type: "system_alert",
    priority: "medium" as "low" | "medium" | "high",
    actionLabel: "Open notifications",
    actionUrl: "",
    audiences: ["all"] as Array<"admin" | "statistician" | "all">,
  });

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const notifications = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        actionUrl:
          typeof item.data?.actionUrl === "string" ? item.data.actionUrl : "",
      })),
    [items],
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

  const handleOpenNotification = async (notification: Notification) => {
    try {
      if (canMutateNotification(notification)) {
        await dispatch(
          markNotificationRead({ id: notification.id, read: true }),
        ).unwrap();
      }

      updateLocalReadState(notification.id);

      if (typeof notification.data?.actionUrl === "string" && notification.data.actionUrl) {
        router.push(notification.data.actionUrl);
      }
    } catch (error) {
      console.error("Unable to open notification:", error);
      toast.error("Unable to update that notification.");
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.uid) {
      return;
    }

    try {
      await dispatch(
        markAllNotificationsRead({
          role: user.role || null,
          userId: user.uid,
          teamId,
        }),
      ).unwrap();
      updateLocalReadState();
      toast.success("All notifications marked as read.");
    } catch (error) {
      console.error("Unable to mark all as read:", error);
      toast.error("Unable to update notifications right now.");
    }
  };

  const handleDelete = async (notification: Notification) => {
    if (!canMutateNotification(notification)) {
      toast.error("That notification can only be removed by its owner.");
      return;
    }

    try {
      await dispatch(deleteNotification(notification.id)).unwrap();
      toast.success("Notification removed.");
    } catch (error) {
      console.error("Unable to delete notification:", error);
      toast.error("Unable to delete that notification.");
    }
  };

  const handleClearAll = async () => {
    if (!user?.uid) {
      return;
    }

    try {
      await dispatch(
        clearAllNotifications({
          role: user.role || null,
          userId: user.uid,
          teamId,
        }),
      ).unwrap();
      dispatch(setNotifications([]));
      toast.success("Notifications cleared.");
    } catch (error) {
      console.error("Unable to clear notifications:", error);
      toast.error("Unable to clear notifications right now.");
    }
  };

  const handleEnablePush = async () => {
    try {
      setEnablingPush(true);
      const result = await enablePushNotifications();
      setPermission(result.permission);

      if (result.permission === "granted") {
        toast.success("Push notifications are enabled on this device.");
        return;
      }

      toast.error("Push notifications were not granted.");
    } catch (error) {
      console.error("Unable to enable push notifications:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to enable push notifications.",
      );
    } finally {
      setEnablingPush(false);
    }
  };

  const toggleAudience = (role: "admin" | "statistician" | "all") => {
    setForm((current) => {
      const hasRole = current.audiences.includes(role);
      const nextAudiences = hasRole
        ? current.audiences.filter((entry) => entry !== role)
        : [...current.audiences, role];

      return {
        ...current,
        audiences: nextAudiences.length > 0 ? nextAudiences : ["all"],
      };
    });
  };

  const handleSend = async () => {
    try {
      setSending(true);
      const response = await adminApiFetch<SendNotificationResponse>(
        "/api/admin/notifications/send",
        {
          method: "POST",
          body: JSON.stringify({
            title: form.title,
            message: form.message,
            type: form.type,
            priority: form.priority,
            actionLabel: form.actionLabel,
            actionUrl: form.actionUrl,
            roles: form.audiences,
          }),
        },
      );

      toast.success(
        `Notification sent to ${response.recipients} recipient${response.recipients === 1 ? "" : "s"}.`,
      );
      setForm({
        title: "",
        message: "",
        type: "system_alert",
        priority: "medium",
        actionLabel: "Open notifications",
        actionUrl: "",
        audiences: ["all"],
      });
    } catch (error) {
      console.error("Unable to send notification:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to send the platform notification.",
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-[32px] p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <span
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${style.badge}`}
            >
              <MdNotifications size={14} />
              Live notifications
            </span>
            <h2 className="mt-4 text-2xl font-semibold text-secondary">
              {canCompose ? "Broadcast and monitor updates" : "Track every alert in one place"}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-500">
              In-app alerts stay live from Firestore, while Firebase Cloud Messaging keeps signed-in devices in sync.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[24px] border border-white/70 bg-white/80 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Total
              </p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">{notifications.length}</p>
            </div>
            <div className="rounded-[24px] border border-white/70 bg-white/80 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Unread
              </p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">{unreadCount}</p>
            </div>
            <div className="rounded-[24px] border border-white/70 bg-white/80 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Push
              </p>
              <p className="mt-3 text-lg font-semibold text-slate-900">
                {permission === "granted"
                  ? "Enabled"
                  : permission === "denied"
                    ? "Blocked"
                    : permission === "unsupported"
                      ? "Unsupported"
                      : "Inactive"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="glass-panel rounded-[32px] p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-xl font-semibold text-secondary">Inbox</h3>
              <p className="mt-1 text-sm text-slate-500">
                Open alerts, clear read items, and jump straight to the relevant dashboard area.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void handleMarkAllAsRead()}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300"
              >
                <MdDoneAll size={18} />
                Mark all read
              </button>
              <button
                type="button"
                onClick={() => void handleClearAll()}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-rose-200 hover:text-rose-600"
              >
                <MdDelete size={18} />
                Clear
              </button>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {notifications.length === 0 ? (
              <div className="rounded-[28px] border border-dashed border-slate-300 bg-white/75 px-6 py-10 text-center">
                <p className="text-lg font-semibold text-slate-700">No notifications yet</p>
                <p className="mt-2 text-sm text-slate-500">
                  New platform activity will appear here as soon as it arrives.
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <article
                  key={notification.id}
                  className={`rounded-[28px] border px-5 py-4 transition ${
                    notification.read
                      ? "border-white/70 bg-white/75"
                      : "border-secondary/10 bg-secondary/5"
                  }`}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-base font-semibold text-slate-900">
                          {notification.title || "Update"}
                        </p>
                        {!notification.read ? (
                          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm leading-7 text-slate-600">
                        {notification.message || notification.body || "New activity is available."}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                        <span>{formatRelativeTime(typeof notification.createdAt === "string" ? notification.createdAt : undefined)}</span>
                        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1">
                          {notification.type}
                        </span>
                        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1">
                          {notification.data?.priority || "medium"}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void handleOpenNotification(notification)}
                        className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold text-white ${style.button}`}
                      >
                        <MdCheckCircle size={18} />
                        Open
                      </button>
                      {canMutateNotification(notification) ? (
                        <button
                          type="button"
                          onClick={() => void handleDelete(notification)}
                          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-rose-200 hover:text-rose-600"
                        >
                          <MdDelete size={18} />
                          Delete
                        </button>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <section className="glass-panel rounded-[32px] p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-secondary">Device push</h3>
                <p className="mt-2 text-sm leading-7 text-slate-500">
                  Register this browser for Firebase Cloud Messaging so urgent updates arrive even when the dashboard is in the background.
                </p>
              </div>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                <MdWifiTethering size={14} className="inline" /> {permission}
              </span>
            </div>

            <button
              type="button"
              onClick={() => void handleEnablePush()}
              disabled={enablingPush || permission === "granted" || permission === "unsupported"}
              className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${style.button}`}
            >
              <MdWifiTethering size={18} />
              {permission === "granted"
                ? "Push notifications enabled"
                : enablingPush
                  ? "Enabling..."
                  : "Enable push notifications"}
            </button>
          </section>

          {canCompose ? (
            <section className="glass-panel rounded-[32px] p-6">
              <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${style.badge}`}>
                <MdCampaign size={14} />
                Platform broadcast
              </span>
              <h3 className="mt-4 text-xl font-semibold text-secondary">Create a live notification</h3>
              <p className="mt-2 text-sm leading-7 text-slate-500">
                Send an in-app update to admin, statisticians, or everyone tracked in the platform. Matching devices will receive an FCM push too.
              </p>

              <div className="mt-5 space-y-4">
                <input
                  type="text"
                  value={form.title}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, title: event.target.value }))
                  }
                  placeholder="Notification title"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-slate-300"
                />
                <textarea
                  rows={5}
                  value={form.message}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, message: event.target.value }))
                  }
                  placeholder="Write the platform update"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-7 text-slate-800 outline-none transition focus:border-slate-300"
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <select
                    value={form.priority}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        priority: event.target.value as "low" | "medium" | "high",
                      }))
                    }
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none"
                  >
                    <option value="low">Low priority</option>
                    <option value="medium">Medium priority</option>
                    <option value="high">High priority</option>
                  </select>

                  <input
                    type="text"
                    value={form.actionLabel}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        actionLabel: event.target.value,
                      }))
                    }
                    placeholder="Action label"
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none"
                  />
                </div>

                <input
                  type="text"
                  value={form.actionUrl}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, actionUrl: event.target.value }))
                  }
                  placeholder="Optional action URL (defaults to the dashboard notifications tab)"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none"
                />

                <div className="rounded-[24px] border border-slate-200 bg-white/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Audience
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(["all", "admin", "statistician"] as const).map((role) => {
                      const active = form.audiences.includes(role);
                      return (
                        <button
                          key={role}
                          type="button"
                          onClick={() => toggleAudience(role)}
                          className={`rounded-full px-3 py-2 text-sm font-semibold transition ${
                            active
                              ? "bg-secondary text-white"
                              : "border border-slate-200 bg-white text-slate-600"
                          }`}
                        >
                          {role}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => void handleSend()}
                  disabled={sending}
                  className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-70 ${style.button}`}
                >
                  <MdSend size={18} />
                  {sending ? "Sending..." : "Send live notification"}
                </button>
              </div>
            </section>
          ) : null}
        </div>
      </section>
    </div>
  );
}
