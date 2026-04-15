"use client";

import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import {
  FaFacebook,
  FaInstagram,
  FaMapMarkerAlt,
  FaTwitter,
} from "react-icons/fa";
import { BsGlobe } from "react-icons/bs";
import { HiMail, HiPhone } from "react-icons/hi";
import { IoMdTime } from "react-icons/io";
import { MdMailOutline } from "react-icons/md";
import PublicPageCanvas from "@/components/shared/PublicPageCanvas";
import PublicPageHero from "@/components/shared/PublicPageHero";

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
  [key: string]: string | undefined;
}

export default function ContactPage() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">(
    "idle",
  );
  const [submitMessage, setSubmitMessage] = useState("");

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));

    if (errors[name as keyof FormErrors]) {
      setErrors((current) => ({ ...current, [name]: "" }));
    }
  };

  const validateForm = (): FormErrors => {
    const nextErrors: FormErrors = {};

    if (!formData.name.trim()) {
      nextErrors.name = "Name is required";
    }
    if (!formData.email.trim()) {
      nextErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      nextErrors.email = "Email is invalid";
    }
    if (!formData.subject) {
      nextErrors.subject = "Please select a subject";
    }
    if (!formData.message.trim()) {
      nextErrors.message = "Message is required";
    }

    return nextErrors;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const nextErrors = validateForm();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus("idle");
    setSubmitMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = (await response.json()) as { error?: string };

      if (response.ok) {
        setSubmitStatus("success");
        setSubmitMessage(
          "Thank you for your message. The Benzard team will get back to you within 24 to 48 hours.",
        );
        setFormData({
          name: "",
          email: "",
          subject: "",
          message: "",
        });
        setErrors({});
      } else {
        setSubmitStatus("error");
        setSubmitMessage(result.error || "Failed to send message. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setSubmitStatus("error");
      setSubmitMessage("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactItems = useMemo(
    () => [
      {
        title: "Address",
        content: "Paynesville City, Montserrado County, Liberia",
        icon: <FaMapMarkerAlt className="text-xl text-primary" />,
      },
      {
        title: "Email",
        content: "info@benzardsportsmanagement.com",
        icon: <HiMail className="text-xl text-primary" />,
      },
      {
        title: "Phone",
        content: "+231 777 123 456",
        icon: <HiPhone className="text-xl text-primary" />,
      },
    ],
    [],
  );

  return (
    <PublicPageCanvas>
      <PublicPageHero
        badge="Open Channel"
        badgeIcon={<MdMailOutline size={16} />}
        title="Reach Benzard Sports Management for scouting, events, partnerships, and athlete enquiries."
        description="Whether you are asking about athlete pathways, community events, club collaboration, or broader support for the program, this is the fastest way to get the right team involved."
        stats={[
          {
            value: "24-48h",
            label: "Reply Window",
            accentClassName: "text-primary",
          },
          {
            value: "6 days",
            label: "Office Coverage",
            accentClassName: "text-secondary",
          },
          {
            value: "3 channels",
            label: "Direct Contact Routes",
            accentClassName: "text-emerald-600",
          },
        ]}
        aside={
          <div className="glass-panel rounded-[32px] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Office Hours
            </p>
            <div className="mt-4 rounded-[26px] border border-slate-200/80 bg-white/80 p-4">
              <div className="flex items-center gap-2 text-secondary">
                <IoMdTime size={20} />
                <p className="font-semibold">Weekly Availability</p>
              </div>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="flex items-center justify-between gap-4">
                  <span>Monday - Friday</span>
                  <span className="font-semibold text-secondary">8:00 AM - 4:00 PM</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Saturday</span>
                  <span className="font-semibold text-secondary">10:00 AM - 2:00 PM</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Sunday</span>
                  <span className="font-semibold text-secondary">Closed</span>
                </div>
              </div>
            </div>
          </div>
        }
      />

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
          <div className="space-y-6">
            <div className="glass-panel rounded-[32px] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                Direct Details
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-secondary">
                Get in touch
              </h2>
              <div className="mt-6 space-y-4">
                {contactItems.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-[26px] border border-slate-200/80 bg-white/80 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="rounded-2xl bg-primary/10 p-3">
                        {item.icon}
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          {item.title}
                        </p>
                        <p className="mt-2 text-sm font-semibold text-secondary">
                          {item.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel rounded-[32px] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                Social
              </p>
              <h3 className="mt-3 text-2xl font-semibold text-secondary">
                Stay connected
              </h3>
              <div className="mt-5 flex flex-wrap gap-3">
                {[
                  {
                    href: "https://www.facebook.com/benzardsports",
                    label: "Facebook",
                    icon: <FaFacebook size={18} />,
                  },
                  {
                    href: "https://twitter.com/BSM_Liberia",
                    label: "Twitter",
                    icon: <FaTwitter size={18} />,
                  },
                  {
                    href: "https://www.instagram.com/registabenzardinho/",
                    label: "Instagram",
                    icon: <FaInstagram size={18} />,
                  },
                  {
                    href: "https://benzardsportsmanagement.com",
                    label: "Website",
                    icon: <BsGlobe size={18} />,
                  },
                ].map((entry) => (
                  <a
                    key={entry.label}
                    href={entry.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-secondary/20 hover:text-secondary"
                  >
                    {entry.icon}
                    {entry.label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-[32px] p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Message Desk
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-secondary">
              Send us a message
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Tell us what you need and route the conversation to the right
              Benzard team from the start.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700">
                  Full name
                  <input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`mt-2 w-full rounded-[24px] border bg-white px-4 py-3 text-sm outline-none transition ${
                      errors.name
                        ? "border-rose-300"
                        : "border-slate-200 focus:border-secondary/20 focus:ring-2 focus:ring-secondary/10"
                    }`}
                    required
                  />
                  {errors.name ? (
                    <p className="mt-2 text-sm text-rose-600">{errors.name}</p>
                  ) : null}
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Email address
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`mt-2 w-full rounded-[24px] border bg-white px-4 py-3 text-sm outline-none transition ${
                      errors.email
                        ? "border-rose-300"
                        : "border-slate-200 focus:border-secondary/20 focus:ring-2 focus:ring-secondary/10"
                    }`}
                    required
                  />
                  {errors.email ? (
                    <p className="mt-2 text-sm text-rose-600">{errors.email}</p>
                  ) : null}
                </label>
              </div>

              <label className="block text-sm font-medium text-slate-700">
                Subject
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className={`mt-2 w-full rounded-[24px] border bg-white px-4 py-3 text-sm outline-none transition ${
                    errors.subject
                      ? "border-rose-300"
                      : "border-slate-200 focus:border-secondary/20 focus:ring-2 focus:ring-secondary/10"
                  }`}
                  required
                >
                  <option value="">Select a subject</option>
                  <option value="scouting">Athlete scouting enquiry</option>
                  <option value="training">Training program information</option>
                  <option value="partnership">Partnership proposal</option>
                  <option value="event">Event registration</option>
                  <option value="other">Other</option>
                </select>
                {errors.subject ? (
                  <p className="mt-2 text-sm text-rose-600">{errors.subject}</p>
                ) : null}
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Message
                <textarea
                  id="message"
                  name="message"
                  rows={7}
                  value={formData.message}
                  onChange={handleChange}
                  className={`mt-2 w-full rounded-[24px] border bg-white px-4 py-3 text-sm leading-7 outline-none transition ${
                    errors.message
                      ? "border-rose-300"
                      : "border-slate-200 focus:border-secondary/20 focus:ring-2 focus:ring-secondary/10"
                  }`}
                  required
                />
                {errors.message ? (
                  <p className="mt-2 text-sm text-rose-600">{errors.message}</p>
                ) : null}
              </label>

              {submitStatus !== "idle" ? (
                <div
                  className={`rounded-[24px] border px-4 py-3 text-sm ${
                    submitStatus === "success"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-rose-200 bg-rose-50 text-rose-700"
                  }`}
                >
                  {submitMessage}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-secondary px-4 py-3 text-sm font-semibold text-white transition hover:bg-secondary-hover disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? "Sending..." : "Send message"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </PublicPageCanvas>
  );
}
