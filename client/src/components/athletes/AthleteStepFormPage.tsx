"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MdArrowBack,
  MdArrowForward,
  MdCheckCircle,
  MdCloudUpload,
  MdLocationOn,
  MdOutlineAccessTime,
  MdOutlineContactMail,
  MdOutlineEmojiEvents,
  MdOutlinePersonAdd,
  MdOutlineSportsSoccer,
  MdPhotoCamera,
  MdSave,
  MdSportsScore,
  MdVideoCall,
} from "react-icons/md";
import toast from "react-hot-toast";
import AdminDashboardShell from "@/components/dashboard/AdminDashboardShell";
import { type AdminTabId } from "@/components/dashboard/admin-navigation";
import { useAppSelector } from "@/store/store";
import AthleteService from "@/services/athleteService";
import TeamService from "@/services/teamService";
import {
  type Athlete,
  type AthleteContact,
  type AthleteFormData,
  FOOTBALL_POSITIONS,
  LIBERIA_COUNTIES,
  SPORTS,
} from "@/types/athlete";

interface AthleteStepFormPageProps {
  mode: "add" | "edit";
  athleteId?: string;
}

interface StepDefinition {
  id: string;
  label: string;
  description: string;
}

const initialFormData: AthleteFormData = {
  name: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  age: "",
  dateOfBirth: "",
  position: "",
  bio: "",
  goals: "",
  assists: "",
  matches: "",
  location: "",
  county: "",
  sport: "football",
  level: "grassroots",
  scoutingStatus: "active",
  trainingProgram: "",
  performanceNotes: "",
  height: "",
  weight: "",
  preferredFoot: "",
  nationality: "Liberian",
  previousClubs: "",
  achievements: "",
  instagram: "",
  twitter: "",
  facebook: "",
};

const steps: StepDefinition[] = [
  {
    id: "identity",
    label: "Player Identity",
    description: "Capture the core profile and first impression.",
  },
  {
    id: "sport",
    label: "Sport Profile",
    description: "Record position, level, and current performance baseline.",
  },
  {
    id: "contact",
    label: "Contact & Reach",
    description: "Add location details and contact channels for follow-up.",
  },
  {
    id: "finish",
    label: "Finish & Review",
    description: "Upload media, review the record, and publish the athlete.",
  },
];

const inputClassName =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10";

const errorInputClassName =
  "w-full rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-rose-500 focus:ring-4 focus:ring-rose-100";

const normalizeCsvList = (value: string) =>
  value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

const toAdminPath = (tab: AdminTabId) =>
  tab === "dashboard" ? "/dashboard/admin" : `/dashboard/admin#${tab}`;

const getFullName = (athlete: Athlete | null) => {
  if (!athlete) {
    return "";
  }

  return (
    athlete.name ||
    [athlete.firstName, athlete.lastName].filter(Boolean).join(" ").trim()
  );
};

const stepFields: Record<number, Array<keyof AthleteFormData>> = {
  0: ["name", "firstName", "lastName", "dateOfBirth", "age", "nationality", "bio"],
  1: [
    "sport",
    "level",
    "position",
    "scoutingStatus",
    "height",
    "weight",
    "preferredFoot",
    "trainingProgram",
    "goals",
    "assists",
    "matches",
    "performanceNotes",
  ],
  2: ["email", "phone", "county", "location", "instagram", "twitter", "facebook"],
  3: ["previousClubs", "achievements"],
};

export default function AthleteStepFormPage({
  mode,
  athleteId,
}: AthleteStepFormPageProps) {
  const router = useRouter();
  const currentUser = useAppSelector((state) => state.auth.user);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<AthleteFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [existingAthlete, setExistingAthlete] = useState<Athlete | null>(null);
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [resolvedTeamId, setResolvedTeamId] = useState<string | null>(
    typeof currentUser?.teamId === "string" ? currentUser.teamId : null,
  );

  const pageTitle =
    mode === "add" ? "Register a New Athlete" : "Update Athlete Profile";
  const pageDescription =
    mode === "add"
      ? "Move through a cleaner multi-step registration flow built for fast player onboarding on desktop and mobile."
      : "Update the athlete profile with the same step-by-step flow so edits stay structured and easy to review.";

  const completedStepCount = useMemo(
    () => steps.filter((_, index) => index < currentStep).length,
    [currentStep],
  );

  const progressValue = Math.round(((currentStep + 1) / steps.length) * 100);
  const existingMediaCount = existingAthlete?.media?.length || 0;
  const totalMediaCount = existingMediaCount + photoFiles.length + videoFiles.length;

  useEffect(() => {
    let mounted = true;

    const fallbackTeamId =
      currentUser?.teamId ||
      currentUser?.teamIds?.find(
        (teamId): teamId is string =>
          typeof teamId === "string" && Boolean(teamId.trim()),
      ) ||
      null;

    setResolvedTeamId(fallbackTeamId);

    if (!currentUser) {
      return () => {
        mounted = false;
      };
    }

    void TeamService.ensureTeamContext(currentUser)
      .then((context) => {
        if (mounted) {
          setResolvedTeamId(context?.teamId || fallbackTeamId);
        }
      })
      .catch(() => {
        if (mounted) {
          setResolvedTeamId(fallbackTeamId);
        }
      });

    return () => {
      mounted = false;
    };
  }, [currentUser]);

  useEffect(() => {
    if (mode !== "edit" || !athleteId) {
      setExistingAthlete(null);
      setFormData(initialFormData);
      setErrors({});
      setPhotoFiles([]);
      setVideoFiles([]);
      setCurrentStep(0);
      return;
    }

    let mounted = true;

    const loadAthlete = async () => {
      setLoading(true);
      setPhotoFiles([]);
      setVideoFiles([]);
      setCurrentStep(0);

      try {
        const athlete = await AthleteService.getAthleteById(athleteId);

        if (!mounted) {
          return;
        }

        if (!athlete) {
          toast.error("Athlete not found.");
          router.push("/dashboard/admin#athletes");
          return;
        }

        setExistingAthlete(athlete);
        setFormData({
          name: getFullName(athlete),
          firstName: athlete.firstName || "",
          lastName: athlete.lastName || "",
          email: athlete.contact?.email || "",
          phone: athlete.contact?.phone || "",
          age: athlete.age?.toString() || "",
          dateOfBirth: athlete.dateOfBirth || "",
          position: athlete.position || "",
          bio: athlete.bio || "",
          goals: athlete.stats?.goals?.toString() || "",
          assists: athlete.stats?.assists?.toString() || "",
          matches: athlete.stats?.matches?.toString() || "",
          location: athlete.location || "",
          county: athlete.county || "",
          sport: athlete.sport || "football",
          level: athlete.level || "grassroots",
          scoutingStatus: athlete.scoutingStatus || "active",
          trainingProgram: athlete.trainingProgram || "",
          performanceNotes: athlete.performanceNotes || "",
          height: athlete.height?.toString() || "",
          weight: athlete.weight?.toString() || "",
          preferredFoot: athlete.preferredFoot || "",
          nationality: athlete.nationality || "Liberian",
          previousClubs: athlete.previousClubs?.join(", ") || "",
          achievements: athlete.achievements?.join(", ") || "",
          instagram: athlete.socialMedia?.instagram || "",
          twitter: athlete.socialMedia?.twitter || "",
          facebook: athlete.socialMedia?.facebook || "",
        });
        setErrors({});
      } catch (error) {
        console.error(error);
        toast.error("Unable to load athlete profile.");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadAthlete();

    return () => {
      mounted = false;
    };
  }, [athleteId, mode, router]);

  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) {
      return 0;
    }

    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age -= 1;
    }

    return age;
  };

  const validateAgeAndDob = (age: string, dateOfBirth: string) => {
    if (!age || !dateOfBirth) {
      return true;
    }

    return Math.abs(Number(age) - calculateAge(dateOfBirth)) <= 1;
  };

  const handleInputChange = (field: keyof AthleteFormData, value: string) => {
    setFormData((current) => {
      const next = { ...current, [field]: value };

      if (field === "dateOfBirth" && value) {
        const nextAge = calculateAge(value);
        if (nextAge > 0) {
          next.age = `${nextAge}`;
        }
      }

      return next;
    });

    setErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const next = { ...current };
      delete next[field];

      if (field === "age" || field === "dateOfBirth") {
        delete next.age;
        delete next.dateOfBirth;
      }

      return next;
    });
  };

  const getPositionOptions = () => {
    switch (formData.sport) {
      case "football":
        return FOOTBALL_POSITIONS;
      default:
        return [];
    }
  };

  const getStepErrors = (stepIndex: number) => {
    const nextErrors: Record<string, string> = {};

    if (stepIndex === 0) {
      if (!formData.name.trim()) {
        nextErrors.name = "Full name is required.";
      }

      if (
        formData.age &&
        (Number.isNaN(Number(formData.age)) ||
          Number(formData.age) < 0 ||
          Number(formData.age) > 100)
      ) {
        nextErrors.age = "Enter a valid age between 0 and 100.";
      }

      if (
        formData.age &&
        formData.dateOfBirth &&
        !validateAgeAndDob(formData.age, formData.dateOfBirth)
      ) {
        nextErrors.age = "Age does not match the selected date of birth.";
        nextErrors.dateOfBirth = "Date of birth does not match the age.";
      }
    }

    if (stepIndex === 1) {
      ["goals", "assists", "matches", "height", "weight"].forEach((field) => {
        const value = formData[field as keyof AthleteFormData];
        if (typeof value === "string" && value && Number(value) < 0) {
          nextErrors[field] = "This value cannot be negative.";
        }
      });
    }

    if (stepIndex === 2 && formData.email) {
      if (!/\S+@\S+\.\S+/.test(formData.email)) {
        nextErrors.email = "Enter a valid email address.";
      }
    }

    return nextErrors;
  };

  const validateStep = (stepIndex: number) => {
    const nextErrors = getStepErrors(stepIndex);

    setErrors((current) => {
      const updated = { ...current };

      (stepFields[stepIndex] || []).forEach((field) => {
        delete updated[field];
      });

      return { ...updated, ...nextErrors };
    });

    return Object.keys(nextErrors).length === 0;
  };

  const buildPayload = (): Partial<Athlete> => {
    const athleteData: Partial<Athlete> = {
      name: formData.name.trim(),
      sport: formData.sport,
      level: formData.level as Athlete["level"],
      scoutingStatus: formData.scoutingStatus as Athlete["scoutingStatus"],
    };

    if (resolvedTeamId) {
      athleteData.teamId = resolvedTeamId;
    }

    if (currentUser?.uid) {
      athleteData.updatedBy = currentUser.uid;
      if (mode === "add") {
        athleteData.createdBy = currentUser.uid;
      }
    }

    if (formData.firstName.trim()) athleteData.firstName = formData.firstName.trim();
    if (formData.lastName.trim()) athleteData.lastName = formData.lastName.trim();
    if (formData.age) athleteData.age = parseInt(formData.age, 10);
    if (formData.dateOfBirth) athleteData.dateOfBirth = formData.dateOfBirth;
    if (formData.position.trim()) athleteData.position = formData.position.trim();
    if (formData.bio.trim()) athleteData.bio = formData.bio.trim();
    if (formData.location.trim()) athleteData.location = formData.location.trim();
    if (formData.county) athleteData.county = formData.county;
    if (formData.trainingProgram.trim()) {
      athleteData.trainingProgram = formData.trainingProgram.trim();
    }
    if (formData.performanceNotes.trim()) {
      athleteData.performanceNotes = formData.performanceNotes.trim();
    }
    if (formData.height) athleteData.height = parseInt(formData.height, 10);
    if (formData.weight) athleteData.weight = parseInt(formData.weight, 10);
    if (formData.preferredFoot) {
      athleteData.preferredFoot = formData.preferredFoot as Athlete["preferredFoot"];
    }
    if (formData.nationality.trim()) {
      athleteData.nationality = formData.nationality.trim();
    }
    if (formData.previousClubs.trim()) {
      athleteData.previousClubs = normalizeCsvList(formData.previousClubs);
    }
    if (formData.achievements.trim()) {
      athleteData.achievements = normalizeCsvList(formData.achievements);
    }

    const contact: AthleteContact = {};
    if (formData.email.trim()) contact.email = formData.email.trim();
    if (formData.phone.trim()) contact.phone = formData.phone.trim();
    if (Object.keys(contact).length > 0) athleteData.contact = contact;

    const socialMedia: Record<string, string> = {};
    if (formData.instagram.trim()) socialMedia.instagram = formData.instagram.trim();
    if (formData.twitter.trim()) socialMedia.twitter = formData.twitter.trim();
    if (formData.facebook.trim()) socialMedia.facebook = formData.facebook.trim();
    if (Object.keys(socialMedia).length > 0) athleteData.socialMedia = socialMedia;

    const stats: Record<string, number> = {};
    if (formData.goals) stats.goals = parseInt(formData.goals, 10);
    if (formData.assists) stats.assists = parseInt(formData.assists, 10);
    if (formData.matches) stats.matches = parseInt(formData.matches, 10);
    if (Object.keys(stats).length > 0) athleteData.stats = stats;

    return athleteData;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) {
      toast.error("Please fix the highlighted fields before continuing.");
      return;
    }

    setCurrentStep((current) => Math.min(current + 1, steps.length - 1));
  };

  const handleBack = () => {
    setCurrentStep((current) => Math.max(current - 1, 0));
  };

  const handleSubmit = async () => {
    const aggregatedErrors = steps.reduce<Record<string, string>>((accumulator, _, index) => {
      return { ...accumulator, ...getStepErrors(index) };
    }, {});

    setErrors(aggregatedErrors);

    if (Object.keys(aggregatedErrors).length > 0) {
      toast.error("Please review the form before saving.");
      return;
    }

    setSaving(true);

    try {
      const athleteData = buildPayload();
      let targetAthleteId = athleteId;

      if (mode === "add") {
        targetAthleteId = await AthleteService.createAthlete(
          athleteData as Omit<Athlete, "id" | "createdAt" | "updatedAt">,
        );
      } else if (athleteId) {
        await AthleteService.updateAthlete(athleteId, athleteData);
      }

      if (!targetAthleteId) {
        throw new Error("Unable to resolve the athlete record.");
      }

      if (photoFiles.length > 0) {
        await Promise.all(
          photoFiles.map((file) =>
            AthleteService.uploadAthleteMedia(targetAthleteId as string, file, "photo"),
          ),
        );
      }

      if (videoFiles.length > 0) {
        await Promise.all(
          videoFiles.map((file) =>
            AthleteService.uploadAthleteMedia(targetAthleteId as string, file, "video"),
          ),
        );
      }

      toast.success(
        mode === "add"
          ? "Athlete registered successfully."
          : "Athlete updated successfully.",
      );
      router.push("/dashboard/admin#athletes");
    } catch (error) {
      console.error(error);
      toast.error(
        mode === "add" ? "Failed to register athlete." : "Failed to update athlete.",
      );
    } finally {
      setSaving(false);
    }
  };

  const renderField = (
    label: string,
    field: keyof AthleteFormData,
    options?: {
      type?: string;
      placeholder?: string;
      required?: boolean;
      textarea?: boolean;
    },
  ) => {
    const className = errors[field] ? errorInputClassName : inputClassName;

    return (
      <label className="space-y-2">
        <span className="text-sm font-semibold text-slate-700">
          {label}
          {options?.required ? " *" : ""}
        </span>
        {options?.textarea ? (
          <textarea
            rows={4}
            value={formData[field] || ""}
            onChange={(event) => handleInputChange(field, event.target.value)}
            placeholder={options.placeholder}
            className={`${className} min-h-[120px] resize-y`}
          />
        ) : (
          <input
            type={options?.type || "text"}
            value={formData[field] || ""}
            onChange={(event) => handleInputChange(field, event.target.value)}
            placeholder={options?.placeholder}
            className={className}
          />
        )}
        {errors[field] ? (
          <span className="text-xs font-medium text-rose-600">{errors[field]}</span>
        ) : null}
      </label>
    );
  };

  const positionOptions = getPositionOptions();

  const renderStepContent = () => {
    if (currentStep === 0) {
      return (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="lg:col-span-2">
            {renderField("Full name", "name", {
              required: true,
              placeholder: "Enter the athlete's full name",
            })}
          </div>

          {renderField("First name", "firstName", {
            placeholder: "Optional first name split",
          })}
          {renderField("Last name", "lastName", {
            placeholder: "Optional last name split",
          })}
          {renderField("Date of birth", "dateOfBirth", { type: "date" })}
          {renderField("Age", "age", {
            type: "number",
            placeholder: "Auto-calculated when date of birth is selected",
          })}
          {renderField("Nationality", "nationality", {
            placeholder: "Liberian",
          })}

          <div className="lg:col-span-2">
            {renderField("Bio", "bio", {
              textarea: true,
              placeholder:
                "Highlight style of play, standout traits, and the story that helps scouts understand this player quickly.",
            })}
          </div>
        </div>
      );
    }

    if (currentStep === 1) {
      return (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">Sport</span>
              <select
                value={formData.sport}
                onChange={(event) => handleInputChange("sport", event.target.value)}
                className={inputClassName}
              >
                {SPORTS.map((sport) => (
                  <option key={sport} value={sport}>
                    {sport.charAt(0).toUpperCase() + sport.slice(1)}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">Level</span>
              <select
                value={formData.level}
                onChange={(event) => handleInputChange("level", event.target.value)}
                className={inputClassName}
              >
                <option value="grassroots">Grassroots</option>
                <option value="semi-pro">Semi-Pro</option>
                <option value="professional">Professional</option>
              </select>
            </label>

            {positionOptions.length > 0 ? (
              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700">Position</span>
                <select
                  value={formData.position}
                  onChange={(event) =>
                    handleInputChange("position", event.target.value)
                  }
                  className={inputClassName}
                >
                  <option value="">Select position</option>
                  {positionOptions.map((position) => (
                    <option key={position} value={position}>
                      {position}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              renderField("Position", "position", {
                placeholder: "Add the player's role or position",
              })
            )}

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Scouting status
              </span>
              <select
                value={formData.scoutingStatus}
                onChange={(event) =>
                  handleInputChange("scoutingStatus", event.target.value)
                }
                className={inputClassName}
              >
                <option value="active">Active</option>
                <option value="scouted">Scouted</option>
                <option value="signed">Signed</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>

            {renderField("Height (cm)", "height", { type: "number" })}
            {renderField("Weight (kg)", "weight", { type: "number" })}

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Preferred foot
              </span>
              <select
                value={formData.preferredFoot}
                onChange={(event) =>
                  handleInputChange("preferredFoot", event.target.value)
                }
                className={inputClassName}
              >
                <option value="">Not specified</option>
                <option value="left">Left</option>
                <option value="right">Right</option>
                <option value="both">Both</option>
              </select>
            </label>

            {renderField("Training program", "trainingProgram", {
              placeholder: "Academy program, pathway, or focus group",
            })}
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                  Performance Baseline
                </p>
                <h3 className="mt-2 text-lg font-semibold text-secondary">
                  Manual snapshot
                </h3>
              </div>
              <p className="text-sm text-slate-500">
                These values act as a starting point until live match data syncs in.
              </p>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {renderField("Goals", "goals", { type: "number" })}
              {renderField("Assists", "assists", { type: "number" })}
              {renderField("Matches", "matches", { type: "number" })}
            </div>
          </div>

          <div>{renderField("Performance notes", "performanceNotes", { textarea: true })}</div>
        </div>
      );
    }

    if (currentStep === 2) {
      return (
        <div className="grid gap-6 lg:grid-cols-2">
          {renderField("Email", "email", {
            type: "email",
            placeholder: "athlete@example.com",
          })}
          {renderField("Phone", "phone", {
            placeholder: "Primary contact number",
          })}

          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">County</span>
            <select
              value={formData.county}
              onChange={(event) => handleInputChange("county", event.target.value)}
              className={inputClassName}
            >
              <option value="">Select county</option>
              {LIBERIA_COUNTIES.map((county) => (
                <option key={county} value={county}>
                  {county}
                </option>
              ))}
            </select>
          </label>

          {renderField("City / location", "location", {
            placeholder: "Monrovia, Paynesville, Buchanan...",
          })}

          {renderField("Instagram", "instagram", {
            placeholder: "@username",
          })}
          {renderField("Twitter / X", "twitter", {
            placeholder: "@username",
          })}

          <div className="lg:col-span-2">
            {renderField("Facebook", "facebook", {
              placeholder: "Profile URL or page name",
            })}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="lg:col-span-2">
            {renderField("Previous clubs", "previousClubs", {
              placeholder: "Club A, Club B, School Team",
            })}
          </div>
          <div className="lg:col-span-2">
            {renderField("Achievements", "achievements", {
              placeholder: "League winner, MVP, youth cup finalist",
            })}
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <label className="rounded-[28px] border border-dashed border-slate-300 bg-white/80 p-5 transition hover:border-primary/40 hover:bg-primary/5">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                <MdPhotoCamera size={24} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-secondary">Player photos</p>
                <p className="mt-1 text-sm text-slate-500">
                  Upload portraits, action shots, or scouting visuals.
                </p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {photoFiles.length} new file{photoFiles.length === 1 ? "" : "s"} selected
                </p>
              </div>
            </div>
            <input
              type="file"
              accept="image/*"
              multiple
              className="mt-4 block w-full text-sm text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-secondary file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-secondary-hover"
              onChange={(event) =>
                setPhotoFiles(event.target.files ? Array.from(event.target.files) : [])
              }
            />
          </label>

          <label className="rounded-[28px] border border-dashed border-slate-300 bg-white/80 p-5 transition hover:border-secondary/40 hover:bg-secondary/5">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-secondary/10 p-3 text-secondary">
                <MdVideoCall size={24} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-secondary">Player videos</p>
                <p className="mt-1 text-sm text-slate-500">
                  Add highlights, drills, or evaluation clips.
                </p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {videoFiles.length} new file{videoFiles.length === 1 ? "" : "s"} selected
                </p>
              </div>
            </div>
            <input
              type="file"
              accept="video/*"
              multiple
              className="mt-4 block w-full text-sm text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-primary-hover"
              onChange={(event) =>
                setVideoFiles(event.target.files ? Array.from(event.target.files) : [])
              }
            />
          </label>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white/90 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-600">
              <MdCheckCircle size={24} />
            </div>
            <div>
              <p className="text-sm font-semibold text-secondary">Review summary</p>
              <p className="text-sm text-slate-500">
                Double-check the essentials before saving the athlete record.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Name
              </p>
              <p className="mt-2 text-sm font-semibold text-secondary">
                {formData.name || "Not set"}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Sport / Position
              </p>
              <p className="mt-2 text-sm font-semibold text-secondary">
                {formData.sport} {formData.position ? `· ${formData.position}` : ""}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Location
              </p>
              <p className="mt-2 text-sm font-semibold text-secondary">
                {[formData.county, formData.location].filter(Boolean).join(", ") || "Not set"}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Media ready
              </p>
              <p className="mt-2 text-sm font-semibold text-secondary">
                {totalMediaCount} asset{totalMediaCount === 1 ? "" : "s"}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AdminDashboardShell
      activeTab="athletes"
      onTabChange={(tab) => router.push(toAdminPath(tab))}
    >
      <section className="glass-panel relative overflow-hidden rounded-[36px] px-6 py-7 sm:px-8">
        <div className="absolute -right-20 top-0 h-48 w-48 rounded-full bg-primary/14 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-secondary/12 blur-3xl" />

        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              <MdOutlinePersonAdd size={16} />
              Athlete Workflow
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-secondary sm:text-4xl">
              {pageTitle}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              {pageDescription}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[26px] border border-slate-200/80 bg-white/85 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Progress
              </p>
              <p className="mt-2 text-3xl font-semibold text-secondary">
                {progressValue}%
              </p>
              <p className="mt-2 text-sm text-slate-500">
                {completedStepCount} of {steps.length} steps completed
              </p>
            </div>
            <div className="rounded-[26px] border border-slate-200/80 bg-white/85 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Destination
              </p>
              <p className="mt-2 text-lg font-semibold text-secondary">
                Athlete Directory
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Save returns you to the athlete list with the latest record live.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-6">
          <div className="glass-panel rounded-[32px] p-5 sm:p-6 xl:sticky xl:top-28">
            <Link
              href="/dashboard/admin#athletes"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-secondary/20 hover:text-secondary"
            >
              <MdArrowBack size={18} />
              Back to athletes
            </Link>

            <div className="mt-6 space-y-4">
              {steps.map((step, index) => {
                const isActive = currentStep === index;
                const isComplete = currentStep > index;

                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => {
                      if (index <= currentStep || validateStep(currentStep)) {
                        setCurrentStep(index);
                      }
                    }}
                    className={`w-full rounded-[26px] border p-4 text-left transition ${
                      isActive
                        ? "border-secondary bg-secondary text-white shadow-[0_18px_42px_-28px_rgba(0,0,84,0.82)]"
                        : isComplete
                          ? "border-emerald-200 bg-emerald-50 text-secondary"
                          : "border-slate-200 bg-white/80 text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold ${
                          isActive
                            ? "bg-white/15 text-white"
                            : isComplete
                              ? "bg-emerald-500 text-white"
                              : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {isComplete ? <MdCheckCircle size={18} /> : index + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">{step.label}</p>
                        <p
                          className={`mt-1 text-sm ${
                            isActive ? "text-white/80" : "text-slate-500"
                          }`}
                        >
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 rounded-[28px] border border-slate-200 bg-white/90 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Live Snapshot
              </p>
              <p className="mt-2 text-xl font-semibold text-secondary">
                {formData.name || "New athlete profile"}
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Goals
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-secondary">
                    {formData.goals || "0"}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Assists
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-secondary">
                    {formData.assists || "0"}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Matches
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-secondary">
                    {formData.matches || "0"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <section className="glass-panel overflow-hidden rounded-[32px]">
          <div className="border-b border-slate-200/80 bg-white/80 px-6 py-5 sm:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  Step {currentStep + 1} of {steps.length}
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-secondary">
                  {steps[currentStep]?.label}
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-slate-500">
                  {steps[currentStep]?.description}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3">
                  <div className="flex items-center gap-2 text-slate-500">
                    <MdOutlineSportsSoccer size={18} />
                    <span className="text-xs font-semibold uppercase tracking-[0.16em]">
                      Sport
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-secondary">
                    {formData.sport || "football"}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3">
                  <div className="flex items-center gap-2 text-slate-500">
                    <MdLocationOn size={18} />
                    <span className="text-xs font-semibold uppercase tracking-[0.16em]">
                      County
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-secondary">
                    {formData.county || "Not set"}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3">
                  <div className="flex items-center gap-2 text-slate-500">
                    <MdOutlineAccessTime size={18} />
                    <span className="text-xs font-semibold uppercase tracking-[0.16em]">
                      Media
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-secondary">
                    {totalMediaCount} files ready
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 h-2 rounded-full bg-slate-200">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-primary via-secondary to-secondary"
                style={{ width: `${progressValue}%` }}
              />
            </div>
          </div>

          <div className="bg-slate-50/70 px-6 py-6 sm:px-8">
            {loading ? (
              <div className="space-y-4">
                <div className="h-12 rounded-2xl bg-slate-200/80 animate-pulse" />
                <div className="h-36 rounded-[28px] bg-slate-200/70 animate-pulse" />
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="h-12 rounded-2xl bg-slate-200/80 animate-pulse" />
                  <div className="h-12 rounded-2xl bg-slate-200/80 animate-pulse" />
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {currentStep === 0 ? (
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-[28px] border border-primary/15 bg-primary/5 p-5">
                      <div className="flex items-center gap-3 text-primary">
                        <MdOutlinePersonAdd size={24} />
                        <span className="text-sm font-semibold uppercase tracking-[0.16em]">
                          Identity
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-7 text-slate-600">
                        Start with the profile details coaches and scouts need first.
                      </p>
                    </div>
                    <div className="rounded-[28px] border border-secondary/15 bg-secondary/5 p-5">
                      <div className="flex items-center gap-3 text-secondary">
                        <MdOutlineEmojiEvents size={24} />
                        <span className="text-sm font-semibold uppercase tracking-[0.16em]">
                          Story
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-7 text-slate-600">
                        A short bio helps the athlete stand out before stats are even opened.
                      </p>
                    </div>
                    <div className="rounded-[28px] border border-emerald-200 bg-emerald-50 p-5">
                      <div className="flex items-center gap-3 text-emerald-600">
                        <MdSportsScore size={24} />
                        <span className="text-sm font-semibold uppercase tracking-[0.16em]">
                          Accuracy
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-7 text-slate-600">
                        Date of birth auto-aligns the age field to reduce entry mistakes.
                      </p>
                    </div>
                  </div>
                ) : null}

                {currentStep === 2 ? (
                  <div className="rounded-[28px] border border-slate-200 bg-white/80 p-5">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-sky-100 p-3 text-sky-600">
                        <MdOutlineContactMail size={24} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-secondary">
                          Contact details stay optional
                        </p>
                        <p className="text-sm text-slate-500">
                          Add whatever is available now and revisit later without blocking registration.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}

                {currentStep === 3 ? (
                  <div className="rounded-[28px] border border-slate-200 bg-white/80 p-5">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-amber-100 p-3 text-amber-600">
                        <MdCloudUpload size={24} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-secondary">
                          Existing media on file
                        </p>
                        <p className="text-sm text-slate-500">
                          {existingMediaCount > 0
                            ? `${existingMediaCount} media item${existingMediaCount === 1 ? "" : "s"} already attached to this profile.`
                            : "No existing media is attached yet."}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}

                {renderStepContent()}
              </div>
            )}
          </div>

          <div className="border-t border-slate-200/80 bg-white/85 px-6 py-5 sm:px-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-500">
                {mode === "edit" && existingAthlete ? (
                  <span>
                    Editing <span className="font-semibold text-secondary">{existingAthlete.name}</span>
                  </span>
                ) : (
                  <span>New athletes are saved directly into the directory after review.</span>
                )}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/dashboard/admin#athletes"
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Cancel
                </Link>
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={currentStep === 0 || saving}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <MdArrowBack size={18} />
                  Back
                </button>
                {currentStep < steps.length - 1 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-secondary px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_44px_-24px_rgba(0,0,84,0.75)] transition hover:bg-secondary-hover disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Continue
                    <MdArrowForward size={18} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={saving || loading}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_44px_-24px_rgba(227,40,69,0.55)] transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <MdSave size={18} />
                    {saving
                      ? mode === "add"
                        ? "Registering..."
                        : "Saving..."
                      : mode === "add"
                        ? "Register athlete"
                        : "Save changes"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </AdminDashboardShell>
  );
}
