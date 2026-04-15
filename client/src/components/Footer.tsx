"use client";

import Image from "next/image";
import Link from "next/link";
import {
  FaFacebook,
  FaInstagram,
  FaMapMarkerAlt,
  FaPhone,
  FaTwitter,
} from "react-icons/fa";
import { HiMail } from "react-icons/hi";
import { MdArrowOutward, MdWbSunny } from "react-icons/md";
import logo from "../../public/assets/Benzard_Logo.png";

const footerLinks = [
  { label: "Home", href: "/" },
  { label: "Athletes", href: "/athletes" },
  { label: "Events", href: "/events" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative mt-20 overflow-hidden px-4 pb-8 pt-6 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-0 top-0 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-0 top-16 h-72 w-72 rounded-full bg-secondary/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        <div className="glass-panel overflow-hidden rounded-[40px] bg-secondary px-6 py-8 text-white sm:px-8 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
                <MdWbSunny size={15} />
                Grassroots To Glory
              </div>
              <h2 className="mt-5 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
                Benzard Sports Management keeps scouting, development, and community football moving in one rhythm.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-8 text-white/72 sm:text-base">
                Follow the athlete pipeline, explore upcoming events, and stay
                connected to the work happening across Liberia.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/athletes"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-semibold text-secondary transition hover:bg-slate-100"
                >
                  Explore athletes
                  <MdArrowOutward size={18} />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/8 px-5 text-sm font-semibold text-white transition hover:bg-white/12"
                >
                  Contact Benzard
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[28px] border border-white/12 bg-white/8 p-5 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/12">
                    <Image
                      src={logo}
                      alt="Benzard Sports Management"
                      width={34}
                      height={34}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Benzard Sports Management</p>
                    <p className="text-xs uppercase tracking-[0.16em] text-white/60">
                      Public site
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-3 text-sm text-white/75">
                  <p className="inline-flex items-center gap-2">
                    <FaMapMarkerAlt className="text-primary" />
                    Paynesville City, Montserrado County, Liberia
                  </p>
                  <p className="inline-flex items-center gap-2">
                    <FaPhone className="text-primary" />
                    +231 777 123 456
                  </p>
                  <p className="inline-flex items-center gap-2">
                    <HiMail className="text-primary" />
                    info@benzardsportsmanagement.com
                  </p>
                </div>
              </div>

              <div className="rounded-[28px] border border-white/12 bg-white/8 p-5 backdrop-blur-xl">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/60">
                  Quick links
                </p>
                <div className="mt-4 space-y-2">
                  {footerLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center justify-between rounded-2xl px-3 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
                    >
                      {item.label}
                      <MdArrowOutward size={16} />
                    </Link>
                  ))}
                </div>

                <div className="mt-5 flex items-center gap-3 px-3">
                  {[
                    {
                      href: "https://www.facebook.com/benzardsports",
                      icon: <FaFacebook size={18} />,
                      label: "Facebook",
                    },
                    {
                      href: "https://twitter.com/BSM_Liberia",
                      icon: <FaTwitter size={18} />,
                      label: "Twitter",
                    },
                    {
                      href: "https://www.instagram.com/registabenzardinho/",
                      icon: <FaInstagram size={18} />,
                      label: "Instagram",
                    },
                  ].map((entry) => (
                    <a
                      key={entry.label}
                      href={entry.href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={entry.label}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/12 bg-white/8 text-white/80 transition hover:bg-white hover:text-secondary"
                    >
                      {entry.icon}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-white/12 pt-5 text-sm text-white/60 sm:flex sm:items-center sm:justify-between">
            <p>{currentYear} Benzard Sports Management. All rights reserved.</p>
            <p className="mt-3 sm:mt-0">Built for athlete visibility, matchday rhythm, and community impact.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
