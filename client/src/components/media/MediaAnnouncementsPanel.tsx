"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { MdCampaign, MdSend } from "react-icons/md";
import {
  dashboardPrimaryButtonClass,
  dashboardToggleActiveClass,
  dashboardToggleButtonClass,
  dashboardToggleInactiveClass,
} from "@/components/dashboard/dashboardButtonStyles";
import { createTeamAnnouncement } from "@/store/mediaSlice";
import { useAppDispatch } from "@/store/store";
import type { TeamAnnouncementRecord } from "@/types/media-dashboard";

interface MediaAnnouncementsPanelProps {
  teamId: string;
  currentUserId?: string | null;
  announcements: TeamAnnouncementRecord[];
}

export default function MediaAnnouncementsPanel({
  teamId,
  currentUserId,
  announcements,
}: MediaAnnouncementsPanelProps) {
  const dispatch = useAppDispatch();
  const [form, setForm] = useState({
    title: "",
    content: "",
    audiences: ["players"] as Array<"players" | "staff">,
  });

  const handleToggleAudience = (audience: "players" | "staff") => {
    setForm((current) => {
      const hasAudience = current.audiences.includes(audience);
      const nextAudiences = hasAudience
        ? current.audiences.filter((entry) => entry !== audience)
        : [...current.audiences, audience];

      return {
        ...current,
        audiences: nextAudiences.length > 0 ? nextAudiences : ["players"],
      };
    });
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error("Announcement title and content are required.");
      return;
    }

    try {
      await dispatch(
        createTeamAnnouncement({
          teamId,
          title: form.title,
          content: form.content,
          audiences: form.audiences,
          createdBy: currentUserId || null,
        }),
      ).unwrap();
      toast.success("Announcement sent.");
      setForm({
        title: "",
        content: "",
        audiences: ["players"],
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to send the announcement.",
      );
    }
  };

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-[32px] p-6">
        <div className="flex items-center gap-2">
          <MdCampaign className="text-sky-600" size={22} />
          <h2 className="text-2xl font-semibold text-secondary">Announcements</h2>
        </div>
        <p className="mt-2 text-sm leading-7 text-slate-500">
          Send targeted announcements to players, staff, or both. Each announcement is stored in Firestore and fan-outs into notifications for the selected audience.
        </p>

        <div className="mt-6 grid gap-4">
          <label className="rounded-[24px] border border-white/70 bg-white/80 p-4">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Title
            </span>
            <input
              type="text"
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({ ...current, title: event.target.value }))
              }
              className="mt-3 w-full bg-transparent text-sm text-slate-800 outline-none"
              placeholder="Travel update for the weekend fixture"
            />
          </label>

          <label className="rounded-[24px] border border-white/70 bg-white/80 p-4">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Announcement
            </span>
            <textarea
              rows={5}
              value={form.content}
              onChange={(event) =>
                setForm((current) => ({ ...current, content: event.target.value }))
              }
              className="mt-3 w-full resize-none bg-transparent text-sm leading-7 text-slate-700 outline-none"
              placeholder="Share logistics, reminders, call times, or publication notes."
            />
          </label>

          <div className="rounded-[24px] border border-white/70 bg-white/80 p-4">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Audience
            </span>
            <div className="mt-4 flex flex-wrap gap-3">
              {(["players", "staff"] as Array<"players" | "staff">).map((audience) => {
                const active = form.audiences.includes(audience);
                return (
                  <button
                    key={audience}
                    type="button"
                    onClick={() => handleToggleAudience(audience)}
                    className={`${dashboardToggleButtonClass} ${
                      active
                        ? dashboardToggleActiveClass
                        : dashboardToggleInactiveClass
                    }`}
                  >
                    {audience}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void handleSubmit()}
          className={`mt-5 ${dashboardPrimaryButtonClass}`}
        >
          <MdSend size={18} />
          Send Announcement
        </button>
      </section>

      <section className="glass-panel rounded-[32px] p-6">
        <h3 className="text-xl font-semibold text-secondary">Recent Announcements</h3>
        <div className="mt-5 space-y-3">
          {announcements.length > 0 ? (
            announcements.map((announcement) => (
              <div
                key={announcement.id}
                className="rounded-[24px] border border-slate-200 bg-white/70 px-4 py-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {announcement.title}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-500">
                      {(announcement.audiences || []).join(", ")}
                    </p>
                  </div>
                  <p className="text-xs text-slate-400">
                    {announcement.createdAt || "recently"}
                  </p>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {announcement.content}
                </p>
              </div>
            ))
          ) : (
            <div className="rounded-[24px] border border-dashed border-slate-300 bg-white/60 px-4 py-10 text-center text-sm text-slate-500">
              No announcements have been sent yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
