"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { toast } from "react-hot-toast";
import { MdClose } from "react-icons/md";
import AthleteService from "@/services/athleteService";
import EnquiryService from "@/services/enquiryService";
import { Athlete } from "@/types/athlete";

interface Props {
  params: Promise<{ id: string }>;
}

export default function AthleteProfilePage({ params }: Props) {
  const resolvedParams =
    typeof (React as { use?: (value: Promise<{ id: string }>) => { id: string } }).use ===
    "function"
      ? (React as { use: (value: Promise<{ id: string }>) => { id: string } }).use(params)
      : (params as unknown as { id: string });

  const { id } = resolvedParams;

  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [loading, setLoading] = useState(true);
  const [contactOpen, setContactOpen] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactSubmitting, setContactSubmitting] = useState(false);

  useEffect(() => {
    const loadAthlete = async () => {
      setLoading(true);

      try {
        const loadedAthlete = await AthleteService.getAthleteById(id);
        setAthlete(loadedAthlete || null);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    void loadAthlete();
  }, [id]);

  const handleEnquirySubmit = async () => {
    if (!contactName.trim()) return;

    setContactSubmitting(true);

    try {
      await EnquiryService.createEnquiry({
        athleteId: id,
        name: contactName,
        email: contactEmail,
        phone: contactPhone,
        message: contactMessage,
      });

      setContactOpen(false);
      setContactName("");
      setContactEmail("");
      setContactPhone("");
      setContactMessage("");
      toast.success("Enquiry sent. Our admins have been notified.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to send enquiry");
    } finally {
      setContactSubmitting(false);
    }
  };

  if (!loading && !athlete) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="glass-panel rounded-[32px] px-8 py-10 text-center">
          <h1 className="text-2xl font-semibold text-secondary">Athlete not found</h1>
          <p className="mt-3 text-sm text-slate-500">
            The profile you’re looking for is unavailable right now.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16">
      <div className="bg-white/60">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          {athlete ? (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <div className="md:col-span-2">
                <div className="glass-panel rounded-[32px] p-8">
                  <h1 className="text-3xl font-semibold text-secondary">
                    {athlete.name}
                  </h1>
                  <div className="mt-4 text-sm leading-7 text-slate-600">
                    {athlete.bio}
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4">
                  {(athlete.media || []).slice(0, 4).map((media) => (
                    <div
                      key={media.id}
                      className="glass-panel relative h-44 overflow-hidden rounded-[28px]"
                    >
                      {media.type === "photo" ? (
                        <Image
                          src={media.url}
                          alt={media.caption || athlete.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <video
                          src={media.url}
                          controls
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                  ))}
                </div>

                <div className="glass-panel mt-6 rounded-[32px] p-6">
                  <h2 className="text-xl font-semibold text-secondary">Stats</h2>
                  {athlete.stats ? (
                    <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
                      {Object.entries(athlete.stats).map(([key, value]) => (
                        <div
                          key={key}
                          className="rounded-[24px] border border-slate-200 bg-white/80 p-4 text-sm text-slate-700"
                        >
                          <div className="font-medium text-slate-500">
                            {key.replace(/([A-Z])/g, " $1")}
                          </div>
                          <div className="mt-2 text-2xl font-semibold text-secondary">
                            {value ?? "—"}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-4 text-slate-500">No stats available.</div>
                  )}
                </div>

                {athlete.media?.some((media) => media.type === "video") ? (
                  <div className="glass-panel mt-6 rounded-[32px] p-6">
                    <h2 className="text-xl font-semibold text-secondary">Videos</h2>
                    <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                      {athlete.media
                        .filter((media) => media.type === "video")
                        .map((video) => (
                          <video
                            key={video.id}
                            src={video.url}
                            controls
                            className="h-48 w-full rounded-[24px] object-cover"
                          />
                        ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <aside className="glass-panel rounded-[32px] p-6">
                <div className="flex items-center gap-4">
                  <div className="relative h-20 w-20 overflow-hidden rounded-full">
                    <Image
                      src={
                        athlete.media && athlete.media[0]
                          ? athlete.media[0].url
                          : "/assets/1.jpg"
                      }
                      alt={athlete.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <div className="text-sm text-slate-500">Age</div>
                    <div className="font-semibold text-secondary">
                      {athlete.age ?? "—"}
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div>
                    <div className="text-sm text-slate-500">Position</div>
                    <div className="font-semibold text-secondary">
                      {athlete.position ?? "—"}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-slate-500">Location</div>
                    <div className="font-semibold text-secondary">
                      {athlete.county ?? athlete.location ?? "—"}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-slate-500">Sport</div>
                    <div className="font-semibold text-secondary">{athlete.sport}</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setContactOpen(true)}
                  className="mt-8 w-full rounded-2xl bg-secondary px-4 py-3 text-sm font-semibold text-white transition hover:bg-secondary-hover"
                >
                  Contact / Enquire
                </button>
              </aside>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-secondary" />
            </div>
          ) : null}
        </div>
      </div>

      {contactOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-xl rounded-[32px] bg-white">
            <div className="flex items-start justify-between border-b border-slate-200/70 px-6 py-5">
              <div>
                <h3 className="text-lg font-semibold text-secondary">
                  Contact about {athlete?.name}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Send an enquiry and the admin team will follow up with you.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setContactOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close enquiry form"
              >
                <MdClose size={18} />
              </button>
            </div>

            <div className="grid gap-4 px-6 py-5">
              <label className="block text-sm font-medium text-slate-700">
                Name
                <input
                  type="text"
                  value={contactName}
                  onChange={(event) => setContactName(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-secondary/20 focus:ring-2 focus:ring-secondary/10"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Email
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(event) => setContactEmail(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-secondary/20 focus:ring-2 focus:ring-secondary/10"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Phone
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(event) => setContactPhone(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-secondary/20 focus:ring-2 focus:ring-secondary/10"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Message
                <textarea
                  rows={4}
                  value={contactMessage}
                  onChange={(event) => setContactMessage(event.target.value)}
                  className="mt-2 w-full rounded-[24px] border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-secondary/20 focus:ring-2 focus:ring-secondary/10"
                />
              </label>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200/70 px-6 py-4">
              <button
                type="button"
                onClick={() => setContactOpen(false)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleEnquirySubmit()}
                disabled={contactSubmitting || !contactName.trim()}
                className="rounded-2xl bg-secondary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-secondary-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                {contactSubmitting ? "Sending..." : "Send Enquiry"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
