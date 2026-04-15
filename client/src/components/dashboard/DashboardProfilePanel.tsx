"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  MdBadge,
  MdCloudUpload,
  MdEmail,
  MdLocationOn,
  MdPhone,
  MdSave,
} from "react-icons/md";
import { updateUser } from "@/store/Auth/authSlice";
import { useAppDispatch, useAppSelector } from "@/store/store";
import { ProfileService } from "@/services/profileService";

interface DashboardProfilePanelProps {
  variant: "admin" | "statistician";
}

const variantStyles = {
  admin: {
    badge: "bg-red-500/10 text-red-500",
    button: "bg-red-500 hover:bg-red-600",
    ring: "ring-red-500/20",
  },
  statistician: {
    badge: "bg-primary/10 text-primary",
    button: "bg-primary hover:bg-primary-hover",
    ring: "ring-primary/20",
  },
} as const;

const formatDate = (value?: string) => {
  if (!value) {
    return "Not available";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
};

export default function DashboardProfilePanel({
  variant,
}: DashboardProfilePanelProps) {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.user);
  const [form, setForm] = useState({
    name: "",
    phoneNumber: "",
    address: "",
    bio: "",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      name: currentUser?.name || currentUser?.displayName || "",
      phoneNumber: currentUser?.phoneNumber || "",
      address: currentUser?.address || "",
      bio: currentUser?.bio || "",
    });
  }, [currentUser?.address, currentUser?.bio, currentUser?.displayName, currentUser?.name, currentUser?.phoneNumber]);

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview(null);
      return;
    }

    const previewUrl = URL.createObjectURL(avatarFile);
    setAvatarPreview(previewUrl);

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [avatarFile]);

  const style = variantStyles[variant];
  const joinedDate = useMemo(
    () => formatDate(typeof currentUser?.createdAt === "string" ? currentUser.createdAt : undefined),
    [currentUser?.createdAt],
  );
  const lastSeen = useMemo(
    () =>
      formatDate(
        typeof currentUser?.metadata?.lastSignInTime === "string"
          ? currentUser.metadata.lastSignInTime
          : undefined,
      ),
    [currentUser?.metadata?.lastSignInTime],
  );

  const handleSave = async () => {
    if (!currentUser?.uid) {
      toast.error("You need to be signed in to update your profile.");
      return;
    }

    try {
      setSaving(true);

      const trimmedName = form.name.trim();
      if (!trimmedName) {
        throw new Error("Full name is required.");
      }

      let uploadedAvatar = {
        url: currentUser.photoURL,
        publicId: currentUser.photoPublicId,
      };

      if (avatarFile) {
        uploadedAvatar = await ProfileService.uploadAvatar(
          avatarFile,
          currentUser.photoPublicId,
        );
      }

      await dispatch(
        updateUser({
          name: trimmedName,
          displayName: trimmedName,
          phoneNumber: form.phoneNumber.trim() || undefined,
          address: form.address.trim() || undefined,
          bio: form.bio.trim() || undefined,
          photoURL: uploadedAvatar.url || undefined,
          photoPublicId: uploadedAvatar.publicId || undefined,
        }),
      ).unwrap();

      setAvatarFile(null);
      toast.success("Profile updated successfully.");
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to update your profile right now.",
      );
    } finally {
      setSaving(false);
    }
  };

  const currentAvatar =
    avatarPreview || currentUser?.photoURL || null;

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <section className="glass-panel rounded-[32px] p-6">
        <span
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${style.badge}`}
        >
          <MdBadge size={14} />
          {variant === "admin" ? "Control identity" : "Performance identity"}
        </span>

        <div className="mt-6 flex flex-col items-center text-center">
          <div className={`h-28 w-28 overflow-hidden rounded-[32px] bg-slate-100 ring-4 ${style.ring}`}>
            {currentAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentAvatar}
                alt={currentUser?.name || "Profile"}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-4xl font-semibold text-slate-500">
                {(currentUser?.name || currentUser?.email || "U")
                  .slice(0, 1)
                  .toUpperCase()}
              </div>
            )}
          </div>

          <h2 className="mt-5 text-2xl font-semibold text-secondary">
            {currentUser?.name || "Signed-in user"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {currentUser?.email || "No email on file"}
          </p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            {currentUser?.role || variant}
          </p>
        </div>

        <div className="mt-6 grid gap-3">
          <div className="rounded-[24px] border border-white/70 bg-white/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Last sign-in
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-800">{lastSeen}</p>
          </div>
          <div className="rounded-[24px] border border-white/70 bg-white/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Joined
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-800">{joinedDate}</p>
          </div>
          <div className="rounded-[24px] border border-white/70 bg-white/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Profile photo
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Uploads are stored in Cloudinary and mirrored into your Firebase profile.
            </p>
          </div>
        </div>
      </section>

      <section className="glass-panel rounded-[32px] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-secondary">Profile details</h3>
            <p className="mt-2 text-sm text-slate-500">
              Keep your dashboard identity current for headers, activity logs, and notifications.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="rounded-[24px] border border-white/70 bg-white/80 p-4">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Full name
            </span>
            <input
              type="text"
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              className="mt-3 w-full bg-transparent text-sm font-medium text-slate-800 outline-none"
              placeholder="Enter your full name"
            />
          </label>

          <label className="rounded-[24px] border border-white/70 bg-white/80 p-4">
            <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              <MdEmail size={14} />
              Email
            </span>
            <input
              type="email"
              value={currentUser?.email || ""}
              disabled
              className="mt-3 w-full bg-transparent text-sm font-medium text-slate-500 outline-none"
            />
          </label>

          <label className="rounded-[24px] border border-white/70 bg-white/80 p-4">
            <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              <MdPhone size={14} />
              Phone
            </span>
            <input
              type="tel"
              value={form.phoneNumber}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  phoneNumber: event.target.value,
                }))
              }
              className="mt-3 w-full bg-transparent text-sm font-medium text-slate-800 outline-none"
              placeholder="Add a contact number"
            />
          </label>

          <label className="rounded-[24px] border border-white/70 bg-white/80 p-4">
            <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              <MdLocationOn size={14} />
              Location
            </span>
            <input
              type="text"
              value={form.address}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  address: event.target.value,
                }))
              }
              className="mt-3 w-full bg-transparent text-sm font-medium text-slate-800 outline-none"
              placeholder="City, county, or office base"
            />
          </label>
        </div>

        <label className="mt-4 block rounded-[24px] border border-white/70 bg-white/80 p-4">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Bio
          </span>
          <textarea
            value={form.bio}
            onChange={(event) =>
              setForm((current) => ({ ...current, bio: event.target.value }))
            }
            rows={6}
            className="mt-3 w-full resize-none bg-transparent text-sm leading-7 text-slate-700 outline-none"
            placeholder="Share a quick snapshot of your role, focus areas, or matchday responsibilities."
          />
        </label>

        <div className="mt-4 rounded-[24px] border border-dashed border-slate-300 bg-white/70 p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-800">Profile picture</p>
              <p className="mt-1 text-sm text-slate-500">
                Choose a JPG or PNG headshot. We’ll optimize it in Cloudinary before saving it.
              </p>
            </div>

            <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300">
              <MdCloudUpload size={18} />
              Choose image
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) =>
                  setAvatarFile(event.target.files?.[0] || null)
                }
              />
            </label>
          </div>

          {avatarFile ? (
            <p className="mt-3 text-sm text-slate-500">
              Selected: <span className="font-medium text-slate-700">{avatarFile.name}</span>
            </p>
          ) : null}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            Email and role stay locked to your authenticated account.
          </p>

          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-70 ${style.button}`}
          >
            <MdSave size={18} />
            {saving ? "Saving..." : "Save profile"}
          </button>
        </div>
      </section>
    </div>
  );
}
