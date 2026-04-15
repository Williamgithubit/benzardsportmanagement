"use client";

import type { MediaDashboardAnalytics, TeamAnnouncementRecord, TeamMediaRecord, TeamPostRecord } from "@/types/media-dashboard";
import type { PlayerRecord } from "@/types/sports";

interface MediaOverviewPanelProps {
  analytics: MediaDashboardAnalytics;
  posts: TeamPostRecord[];
  media: TeamMediaRecord[];
  announcements: TeamAnnouncementRecord[];
  players: PlayerRecord[];
}

export default function MediaOverviewPanel({
  analytics,
  posts,
  media,
  announcements,
  players,
}: MediaOverviewPanelProps) {
  const recentActivity = [...posts, ...announcements]
    .sort((left, right) => {
      const rightTime = new Date(right.updatedAt || right.createdAt || 0).getTime();
      const leftTime = new Date(left.updatedAt || left.createdAt || 0).getTime();
      return rightTime - leftTime;
    })
    .slice(0, 6);

  const mostViewedPosts = [...posts]
    .sort((left, right) => (right.views || 0) - (left.views || 0))
    .slice(0, 5);

  const cards = [
    {
      label: "Posts",
      value: analytics.totalPosts,
      caption: "Drafts, scheduled stories, and published content",
    },
    {
      label: "Scheduled",
      value: analytics.scheduledPosts,
      caption: "Items queued for timestamp-based publishing",
    },
    {
      label: "Media Assets",
      value: analytics.totalMedia,
      caption: "Images and videos tagged to the current team",
    },
    {
      label: "Announcements",
      value: analytics.totalAnnouncements,
      caption: "Targeted messages already sent to players or staff",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-[32px] p-6">
        <h2 className="text-2xl font-semibold text-secondary">
          Content operations at a glance
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-500">
          Track publishing volume, watch what is scheduled next, and review which players already have enough supporting media around them.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="glass-panel rounded-[28px] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              {card.label}
            </p>
            <p className="mt-4 text-4xl font-semibold text-slate-900">
              {card.value}
            </p>
            <p className="mt-4 text-sm leading-6 text-slate-500">{card.caption}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <div className="glass-panel rounded-[32px] p-6">
          <h3 className="text-xl font-semibold text-secondary">Most Viewed Posts</h3>
          <div className="mt-5 space-y-3">
            {mostViewedPosts.length > 0 ? (
              mostViewedPosts.map((post) => (
                <div
                  key={post.id}
                  className="rounded-[24px] border border-slate-200 bg-white/70 px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {post.title}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-500">
                        {post.type.replace("_", " ")} · {post.status}
                      </p>
                    </div>
                    <p className="text-2xl font-semibold text-sky-600">
                      {post.views || 0}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-slate-300 bg-white/60 px-4 py-10 text-center text-sm text-slate-500">
                Views will appear here once your content starts collecting engagement.
              </div>
            )}
          </div>
        </div>

        <div className="glass-panel rounded-[32px] p-6">
          <h3 className="text-xl font-semibold text-secondary">Recent Activity</h3>
          <div className="mt-5 space-y-3">
            {recentActivity.length > 0 ? (
              recentActivity.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[24px] border border-slate-200 bg-white/70 px-4 py-4"
                >
                  <p className="text-sm font-semibold text-slate-900">
                    {"type" in item ? item.title : item.title}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {"status" in item
                      ? `${item.type.replace("_", " ")} · ${item.status}`
                      : `Announcement · ${(item.audiences || []).join(", ")}`}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    Updated {item.updatedAt || item.createdAt || "recently"}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-slate-300 bg-white/60 px-4 py-10 text-center text-sm text-slate-500">
                Activity will appear as soon as posts and announcements are created.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="glass-panel rounded-[32px] p-6">
        <h3 className="text-xl font-semibold text-secondary">Player Profiles</h3>
        <p className="mt-1 text-sm text-slate-500">
          View player info and see how many media assets are already attached to each profile.
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {players.length > 0 ? (
            players.map((player) => {
              const attachedMedia = media.filter((item) => item.playerId === player.id).length;
              return (
                <div
                  key={player.id}
                  className="rounded-[24px] border border-slate-200 bg-white/70 p-4"
                >
                  <p className="text-sm font-semibold text-slate-900">
                    {player.fullName}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {player.position || "Squad member"}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Attached media
                    </span>
                    <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                      {attachedMedia}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-[24px] border border-dashed border-slate-300 bg-white/60 px-4 py-10 text-center text-sm text-slate-500 md:col-span-2 xl:col-span-3">
              Player profiles will appear here once the team roster is available.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
