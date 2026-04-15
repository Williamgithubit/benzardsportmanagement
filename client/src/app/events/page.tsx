"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  MdAccessTime,
  MdArrowOutward,
  MdCalendarMonth,
  MdLocationOn,
  MdOutlineGroups,
  MdSportsSoccer,
} from "react-icons/md";
import { useAppSelector } from "@/store/store";
import PublicPageCanvas from "@/components/shared/PublicPageCanvas";
import PublicPageHero from "@/components/shared/PublicPageHero";
import { getEvents, type Event as EventType } from "@/services/eventService";

const formatEventCategory = (value: string) =>
  value
    .split("_")
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");

const formatEventDate = (date: Date) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);

export default function EventsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const [events, setEvents] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const allEvents = await getEvents();
        const now = new Date();
        const upcoming = allEvents.filter(
          (event) =>
            event.status === "upcoming" ||
            event.status === "ongoing" ||
            (event.startDate && event.startDate > now),
        );
        setEvents(upcoming);
      } catch (error) {
        console.error(error);
        toast.error("Unable to load events right now.");
      } finally {
        setLoading(false);
      }
    };

    void fetchEvents();
  }, []);

  const categories = useMemo(
    () => [
      "all",
      ...new Set(events.map((event) => event.category).filter(Boolean)),
    ],
    [events],
  );

  const filteredEvents = useMemo(
    () =>
      activeCategory === "all"
        ? events
        : events.filter((event) => event.category === activeCategory),
    [activeCategory, events],
  );

  const totalParticipants = useMemo(
    () => events.reduce((sum, event) => sum + (event.registrations || 0), 0),
    [events],
  );
  const openSpots = useMemo(
    () =>
      events.reduce(
        (sum, event) => sum + Math.max((event.capacity || 0) - (event.registrations || 0), 0),
        0,
      ),
    [events],
  );
  const locationsCount = useMemo(
    () => new Set(events.map((event) => event.location).filter(Boolean)).size,
    [events],
  );

  const handleEventRegister = (eventId: string) => {
    if (!isAuthenticated || !user) {
      router.push("/login");
      return;
    }

    const event = events.find((entry) => entry.id === eventId);
    if (!event) {
      toast.error("Event not found.");
      return;
    }

    if ((event.registrations || 0) >= (event.capacity || 0)) {
      toast.error("Sorry, this event is full.");
      return;
    }

    toast.success(`Successfully registered for ${event.title}!`);
  };

  return (
    <PublicPageCanvas>
      <PublicPageHero
        badge="Matchday Calendar"
        badgeIcon={<MdCalendarMonth size={16} />}
        title="Upcoming events built around development, visibility, and community momentum."
        description="Track the next tournament, clinic, training camp, or outreach stop in one place, with clearer detail on timing, capacity, and venue."
        stats={[
          {
            value: `${events.length}`,
            label: "Active Event Windows",
            accentClassName: "text-primary",
          },
          {
            value: `${openSpots}`,
            label: "Open Spots",
            accentClassName: "text-secondary",
          },
          {
            value: `${locationsCount || 0}`,
            label: "Venues In Play",
            accentClassName: "text-emerald-600",
          },
        ]}
        aside={
          <div className="glass-panel rounded-[32px] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Event Pulse
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-secondary">
              {events[0]?.title || "Fresh event schedule"}
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              {events[0]?.description ||
                "As new events are published, this page becomes the public-facing schedule for registrations and planning."}
            </p>
            <div className="mt-5 grid gap-3 rounded-[26px] border border-slate-200/80 bg-white/80 p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Registrations tracked</span>
                <span className="font-semibold text-secondary">
                  {totalParticipants}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Categories live</span>
                <span className="font-semibold text-secondary">
                  {Math.max(categories.length - 1, 0)}
                </span>
              </div>
            </div>
          </div>
        }
      />

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="glass-panel rounded-[36px] p-6 sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Public Schedule
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-secondary">
                Filter upcoming programs by category.
              </h2>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {categories.map((category) => {
              const isActive = activeCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    isActive
                      ? "bg-secondary text-white"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-secondary/20 hover:text-secondary"
                  }`}
                >
                  {category === "all" ? "All events" : formatEventCategory(category)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-8">
          {loading ? (
            <div className="grid gap-6 lg:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="glass-panel h-[320px] rounded-[32px] skeleton-shimmer"
                />
              ))}
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="glass-panel rounded-[32px] p-10 text-center">
              <h3 className="text-2xl font-semibold text-secondary">
                No upcoming events in this category yet.
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-500">
                Check back soon or switch categories to explore more of the
                public calendar.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              {filteredEvents.map((event) => {
                const spotsLeft = Math.max(
                  (event.capacity || 0) - (event.registrations || 0),
                  0,
                );

                return (
                  <article
                    key={event.id}
                    className="glass-panel rounded-[32px] p-6 transition hover:-translate-y-1 hover:border-primary/15"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                          {formatEventCategory(event.category)}
                        </span>
                        <h3 className="mt-4 text-2xl font-semibold text-secondary">
                          {event.title}
                        </h3>
                      </div>
                      <div className="rounded-[24px] border border-slate-200/80 bg-white/80 px-4 py-3 text-right">
                        <p className="text-2xl font-semibold text-secondary">
                          {spotsLeft}
                        </p>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Spots left
                        </p>
                      </div>
                    </div>

                    <p className="mt-4 text-sm leading-7 text-slate-600">
                      {event.description}
                    </p>

                    <div className="mt-6 grid gap-3 rounded-[28px] border border-slate-200/80 bg-white/80 p-4 sm:grid-cols-2">
                      <div className="inline-flex items-start gap-3">
                        <div className="rounded-2xl bg-secondary/6 p-3 text-secondary">
                          <MdCalendarMonth size={20} />
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Date
                          </p>
                          <p className="mt-1 font-semibold text-secondary">
                            {formatEventDate(event.startDate)}
                          </p>
                        </div>
                      </div>
                      <div className="inline-flex items-start gap-3">
                        <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                          <MdAccessTime size={20} />
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Time
                          </p>
                          <p className="mt-1 font-semibold text-secondary">
                            {event.startDate.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="inline-flex items-start gap-3">
                        <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
                          <MdLocationOn size={20} />
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Venue
                          </p>
                          <p className="mt-1 font-semibold text-secondary">
                            {event.location}
                          </p>
                        </div>
                      </div>
                      <div className="inline-flex items-start gap-3">
                        <div className="rounded-2xl bg-amber-50 p-3 text-amber-600">
                          <MdOutlineGroups size={20} />
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Capacity
                          </p>
                          <p className="mt-1 font-semibold text-secondary">
                            {event.registrations || 0} / {event.capacity || 0}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="inline-flex items-center gap-2 text-sm font-medium text-slate-500">
                        <MdSportsSoccer size={18} />
                        Status: {formatEventCategory(event.status)}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleEventRegister(event.id)}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-secondary px-4 py-3 text-sm font-semibold text-white transition hover:bg-secondary-hover"
                      >
                        Register now
                        <MdArrowOutward size={18} />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </PublicPageCanvas>
  );
}
