"use client";
import React, { useState, useEffect } from "react";
import { MdClose, MdPhotoCamera, MdVideoCall } from "react-icons/md";
import {
  Athlete,
  AthleteFormData,
  AthleteContact,
  UserRole,
  LIBERIA_COUNTIES,
  SPORTS,
  FOOTBALL_POSITIONS,
} from "@/types/athlete";
import toast from "react-hot-toast";

interface AthleteFormProps {
  athlete: Athlete | null;
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    data: Partial<Athlete>;
    photos?: File[];
    videos?: File[];
  }) => void;
  mode: "add" | "edit";
  userRole: UserRole;
}

export default function AthleteForm({
  athlete,
  open,
  onClose,
  onSubmit,
  mode,
}: AthleteFormProps) {
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState<AthleteFormData>({
    name: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    age: "",
    dateOfBirth: "",
    position: "",
    bio: "",
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
  });

  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const calculateAge = (dateOfBirth: string): number => {
    if (!dateOfBirth) return 0;
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  const validateAgeAndDateOfBirth = (
    age: string,
    dateOfBirth: string,
  ): boolean => {
    if (!age || !dateOfBirth) return true;
    const enteredAge = parseInt(age);
    const calculatedAge = calculateAge(dateOfBirth);
    const ageDifference = Math.abs(enteredAge - calculatedAge);
    return ageDifference <= 1;
  };

  useEffect(() => {
    if (athlete && mode === "edit") {
      setFormData({
        name: athlete.name || "",
        firstName: athlete.firstName || "",
        lastName: athlete.lastName || "",
        email: athlete.contact?.email || "",
        phone: athlete.contact?.phone || "",
        age: athlete.age?.toString() || "",
        dateOfBirth: athlete.dateOfBirth || "",
        position: athlete.position || "",
        bio: athlete.bio || "",
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
    } else {
      setFormData({
        name: "",
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        age: "",
        dateOfBirth: "",
        position: "",
        bio: "",
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
      });
    }
    setErrors({});
    setTabValue(0);
  }, [athlete, mode, open]);

  const handleInputChange = (field: keyof AthleteFormData, value: string) => {
    const updatedFormData = { ...formData, [field]: value };

    if (field === "dateOfBirth" && value) {
      const calculatedAge = calculateAge(value);
      if (calculatedAge > 0) {
        updatedFormData.age = calculatedAge.toString();
      }
    }

    if (field === "age" || field === "dateOfBirth") {
      const ageToCheck = field === "age" ? value : updatedFormData.age;
      const dobToCheck =
        field === "dateOfBirth" ? value : updatedFormData.dateOfBirth;

      if (ageToCheck && dobToCheck) {
        const isValid = validateAgeAndDateOfBirth(ageToCheck, dobToCheck);
        if (!isValid) {
          const calculatedAge = calculateAge(dobToCheck);
          toast.error(
            `Age doesn't match date of birth. Based on date of birth, age should be ${calculatedAge}.`,
          );
          setErrors((prev) => ({
            ...prev,
            age: `Should be ${calculatedAge}`,
            dateOfBirth: `Age mismatch`,
          }));
        } else {
          setErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors.age;
            delete newErrors.dateOfBirth;
            return newErrors;
          });
        }
      }
    }

    setFormData(updatedFormData);

    if (errors[field] && field !== "age" && field !== "dateOfBirth") {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Invalid email format";
    if (
      formData.age &&
      (isNaN(Number(formData.age)) ||
        Number(formData.age) < 0 ||
        Number(formData.age) > 100)
    ) {
      newErrors.age = "Must be a valid number between 0-100";
    }

    if (formData.age && formData.dateOfBirth) {
      if (!validateAgeAndDateOfBirth(formData.age, formData.dateOfBirth)) {
        newErrors.age = `Doesn't match date of birth`;
        newErrors.dateOfBirth = `Age mismatch`;
        toast.error("Please correct age and date of birth.");
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const athleteData: Partial<Athlete> = {
      name: formData.name.trim(),
      sport: formData.sport,
      level: formData.level as "grassroots" | "semi-pro" | "professional",
      scoutingStatus: formData.scoutingStatus as
        | "active"
        | "scouted"
        | "signed"
        | "inactive",
    };

    if (formData.firstName.trim())
      athleteData.firstName = formData.firstName.trim();
    if (formData.lastName.trim())
      athleteData.lastName = formData.lastName.trim();
    if (formData.age && !isNaN(parseInt(formData.age)))
      athleteData.age = parseInt(formData.age);
    if (formData.dateOfBirth) athleteData.dateOfBirth = formData.dateOfBirth;
    if (formData.position) athleteData.position = formData.position;
    if (formData.bio.trim()) athleteData.bio = formData.bio.trim();
    if (formData.location.trim())
      athleteData.location = formData.location.trim();
    if (formData.county) athleteData.county = formData.county;
    if (formData.trainingProgram.trim())
      athleteData.trainingProgram = formData.trainingProgram.trim();
    if (formData.performanceNotes.trim())
      athleteData.performanceNotes = formData.performanceNotes.trim();
    if (formData.height && !isNaN(parseInt(formData.height)))
      athleteData.height = parseInt(formData.height);
    if (formData.weight && !isNaN(parseInt(formData.weight)))
      athleteData.weight = parseInt(formData.weight);
    if (formData.preferredFoot)
      athleteData.preferredFoot = formData.preferredFoot as
        | "left"
        | "right"
        | "both";
    if (formData.nationality.trim())
      athleteData.nationality = formData.nationality.trim();
    if (formData.previousClubs.trim())
      athleteData.previousClubs = formData.previousClubs
        .split(",")
        .map((s) => s.trim());
    if (formData.achievements.trim())
      athleteData.achievements = formData.achievements
        .split(",")
        .map((s) => s.trim());

    const contact: AthleteContact = {};
    if (formData.email.trim()) contact.email = formData.email.trim();
    if (formData.phone.trim()) contact.phone = formData.phone.trim();
    if (Object.keys(contact).length > 0) athleteData.contact = contact;

    const socialMedia: Record<string, string> = {};
    if (formData.instagram.trim())
      socialMedia.instagram = formData.instagram.trim();
    if (formData.twitter.trim()) socialMedia.twitter = formData.twitter.trim();
    if (formData.facebook.trim())
      socialMedia.facebook = formData.facebook.trim();
    if (Object.keys(socialMedia).length > 0)
      athleteData.socialMedia = socialMedia;

    const stats: Record<string, number> = {};
    if (formData.goals) stats.goals = parseInt(formData.goals || "0");
    if (formData.assists) stats.assists = parseInt(formData.assists || "0");
    if (formData.matches) stats.matches = parseInt(formData.matches || "0");
    if (Object.keys(stats).length > 0) athleteData.stats = stats;

    onSubmit({
      data: athleteData,
      photos: photoFiles.length > 0 ? photoFiles : undefined,
      videos: videoFiles.length > 0 ? videoFiles : undefined,
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

  if (!open) return null;

  const tabs = ["Basic Info", "Sports Details", "Contact", "Additional"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/80 backdrop-blur-sm">
      <div
        className="bg-white w-full max-w-4xl h-[90vh] sm:h-auto sm:max-h-[85vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#03045e] text-white px-6 py-4 flex items-center justify-between shrink-0">
          <h2 className="text-xl font-bold">
            {mode === "add" ? "Add New Athlete" : "Edit Athlete"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <MdClose size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto bg-slate-50 border-b border-slate-200 shrink-0 hide-scrollbar pt-2 px-4 shadow-sm z-10 w-full">
          {tabs.map((tab, idx) => (
            <button
              key={tab}
              onClick={() => setTabValue(idx)}
              className={`px-6 py-3 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${
                tabValue === idx
                  ? "border-[#03045e] text-[#03045e]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-white min-h-100">
          {tabValue === 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
              <div className="md:col-span-2 space-y-1">
                <label className="text-sm font-semibold text-slate-700">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className={`w-full p-2.5 rounded-lg border bg-slate-50 focus:bg-white transition-colors focus:ring-2 focus:ring-primary/20 ${errors.name ? "border-red-500 focus:border-red-500" : "border-slate-200 focus:border-primary outline-none"}`}
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">
                  First Name
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) =>
                    handleInputChange("firstName", e.target.value)
                  }
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white transition-colors focus:ring-2 focus:ring-primary/20 outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">
                  Last Name
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) =>
                    handleInputChange("lastName", e.target.value)
                  }
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white transition-colors focus:ring-2 focus:ring-primary/20 outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">
                  Age
                </label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => handleInputChange("age", e.target.value)}
                  placeholder="Will auto-calculate..."
                  className={`w-full p-2.5 rounded-lg border bg-slate-50 focus:bg-white transition-colors focus:ring-2 focus:ring-primary/20 ${errors.age ? "border-red-500 focus:border-red-500" : "border-slate-200 focus:border-primary outline-none"}`}
                />
                {errors.age && (
                  <p className="text-red-500 text-xs mt-1">{errors.age}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) =>
                    handleInputChange("dateOfBirth", e.target.value)
                  }
                  className={`w-full p-2.5 rounded-lg border bg-slate-50 focus:bg-white transition-colors focus:ring-2 focus:ring-primary/20 ${errors.dateOfBirth ? "border-red-500 focus:border-red-500" : "border-slate-200 focus:border-primary outline-none"}`}
                />
                {errors.dateOfBirth && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.dateOfBirth}
                  </p>
                )}
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="text-sm font-semibold text-slate-700">
                  Bio
                </label>
                <textarea
                  rows={3}
                  value={formData.bio}
                  onChange={(e) => handleInputChange("bio", e.target.value)}
                  placeholder="Brief description of the athlete..."
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white transition-colors focus:ring-2 focus:ring-primary/20 outline-none focus:border-primary resize-y"
                />
              </div>

              <div className="md:col-span-2 grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">
                    Goals
                  </label>
                  <input
                    type="number"
                    value={formData.goals || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        goals: e.target.value,
                      }))
                    }
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-primary/20 outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">
                    Assists
                  </label>
                  <input
                    type="number"
                    value={formData.assists || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        assists: e.target.value,
                      }))
                    }
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-primary/20 outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">
                    Matches
                  </label>
                  <input
                    type="number"
                    value={formData.matches || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        matches: e.target.value,
                      }))
                    }
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-primary/20 outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>
          )}

          {tabValue === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">
                  Sport
                </label>
                <select
                  value={formData.sport}
                  onChange={(e) => handleInputChange("sport", e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white transition-colors focus:ring-2 focus:ring-primary/20 outline-none focus:border-primary appearance-none"
                >
                  {SPORTS.map((sport) => (
                    <option key={sport} value={sport}>
                      {sport.charAt(0).toUpperCase() + sport.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">
                  Level
                </label>
                <select
                  value={formData.level}
                  onChange={(e) => handleInputChange("level", e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white transition-colors focus:ring-2 focus:ring-primary/20 outline-none focus:border-primary appearance-none"
                >
                  <option value="grassroots">Grassroots</option>
                  <option value="semi-pro">Semi-Pro</option>
                  <option value="professional">Professional</option>
                </select>
              </div>

              {getPositionOptions().length > 0 && (
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">
                    Position
                  </label>
                  <select
                    value={formData.position}
                    onChange={(e) =>
                      handleInputChange("position", e.target.value)
                    }
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white transition-colors focus:ring-2 focus:ring-primary/20 outline-none focus:border-primary appearance-none"
                  >
                    <option value="">Select Position</option>
                    {getPositionOptions().map((pos) => (
                      <option key={pos} value={pos}>
                        {pos}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">
                  Scouting Status
                </label>
                <select
                  value={formData.scoutingStatus}
                  onChange={(e) =>
                    handleInputChange("scoutingStatus", e.target.value)
                  }
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white transition-colors focus:ring-2 focus:ring-primary/20 outline-none focus:border-primary appearance-none"
                >
                  <option value="active">Active</option>
                  <option value="scouted">Scouted</option>
                  <option value="signed">Signed</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">
                  Height (cm)
                </label>
                <input
                  type="number"
                  value={formData.height}
                  onChange={(e) => handleInputChange("height", e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white transition-colors focus:ring-2 focus:ring-primary/20 outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  value={formData.weight}
                  onChange={(e) => handleInputChange("weight", e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white transition-colors focus:ring-2 focus:ring-primary/20 outline-none focus:border-primary"
                />
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="text-sm font-semibold text-slate-700">
                  Training Program
                </label>
                <input
                  type="text"
                  value={formData.trainingProgram}
                  onChange={(e) =>
                    handleInputChange("trainingProgram", e.target.value)
                  }
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white transition-colors focus:ring-2 focus:ring-primary/20 outline-none focus:border-primary"
                />
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="text-sm font-semibold text-slate-700">
                  Performance Notes
                </label>
                <textarea
                  rows={3}
                  value={formData.performanceNotes}
                  onChange={(e) =>
                    handleInputChange("performanceNotes", e.target.value)
                  }
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white transition-colors focus:ring-2 focus:ring-primary/20 outline-none focus:border-primary resize-y"
                />
              </div>
            </div>
          )}

          {tabValue === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={`w-full p-2.5 rounded-lg border bg-slate-50 focus:bg-white transition-colors focus:ring-2 focus:ring-primary/20 ${errors.email ? "border-red-500 focus:border-red-500" : "border-slate-200 focus:border-primary outline-none"}`}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">
                  Phone
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white transition-colors focus:ring-2 focus:ring-primary/20 outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">
                  County
                </label>
                <select
                  value={formData.county}
                  onChange={(e) => handleInputChange("county", e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white transition-colors focus:ring-2 focus:ring-primary/20 outline-none focus:border-primary appearance-none"
                >
                  <option value="">Select County</option>
                  {LIBERIA_COUNTIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">
                  City/Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) =>
                    handleInputChange("location", e.target.value)
                  }
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white transition-colors focus:ring-2 focus:ring-primary/20 outline-none focus:border-primary"
                />
              </div>

              <div className="md:col-span-2 pt-2 pb-1 border-b border-slate-100">
                <h3 className="font-bold text-slate-800">Social Media</h3>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">
                  Instagram
                </label>
                <input
                  type="text"
                  placeholder="@username"
                  value={formData.instagram}
                  onChange={(e) =>
                    handleInputChange("instagram", e.target.value)
                  }
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white transition-colors focus:ring-2 focus:ring-primary/20 outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">
                  Twitter
                </label>
                <input
                  type="text"
                  placeholder="@username"
                  value={formData.twitter}
                  onChange={(e) => handleInputChange("twitter", e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white transition-colors focus:ring-2 focus:ring-primary/20 outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">
                  Facebook
                </label>
                <input
                  type="text"
                  placeholder="Profile URL"
                  value={formData.facebook}
                  onChange={(e) =>
                    handleInputChange("facebook", e.target.value)
                  }
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white transition-colors focus:ring-2 focus:ring-primary/20 outline-none focus:border-primary"
                />
              </div>
            </div>
          )}

          {tabValue === 3 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">
                  Nationality
                </label>
                <input
                  type="text"
                  value={formData.nationality}
                  onChange={(e) =>
                    handleInputChange("nationality", e.target.value)
                  }
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white transition-colors focus:ring-2 focus:ring-primary/20 outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">
                  Preferred Foot
                </label>
                <select
                  value={formData.preferredFoot}
                  onChange={(e) =>
                    handleInputChange("preferredFoot", e.target.value)
                  }
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white transition-colors focus:ring-2 focus:ring-primary/20 outline-none focus:border-primary appearance-none"
                >
                  <option value="">Not specified</option>
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                  <option value="both">Both</option>
                </select>
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="text-sm font-semibold text-slate-700">
                  Previous Clubs (Comma separated)
                </label>
                <input
                  type="text"
                  value={formData.previousClubs}
                  onChange={(e) =>
                    handleInputChange("previousClubs", e.target.value)
                  }
                  placeholder="Club A, Club B"
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white transition-colors focus:ring-2 focus:ring-primary/20 outline-none focus:border-primary"
                />
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="text-sm font-semibold text-slate-700">
                  Achievements (Comma separated)
                </label>
                <input
                  type="text"
                  value={formData.achievements}
                  onChange={(e) =>
                    handleInputChange("achievements", e.target.value)
                  }
                  placeholder="Award A, Award B"
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white transition-colors focus:ring-2 focus:ring-primary/20 outline-none focus:border-primary"
                />
              </div>

              <div className="md:col-span-2 pt-2 border-t border-slate-100">
                <label className="block text-sm font-bold text-slate-800 mb-3">
                  Upload Media
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-dashed border-slate-300 hover:bg-slate-100 transition-colors">
                    <label className="flex flex-col items-center justify-center cursor-pointer min-h-25">
                      <MdPhotoCamera
                        size={32}
                        className="text-slate-400 mb-2"
                      />
                      <span className="text-sm font-medium text-slate-600">
                        Select Photos
                      </span>
                      <span className="text-xs text-slate-400 mt-1">
                        {photoFiles.length} file(s) chosen
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) =>
                          setPhotoFiles(
                            e.target.files ? Array.from(e.target.files) : [],
                          )
                        }
                      />
                    </label>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-dashed border-slate-300 hover:bg-slate-100 transition-colors">
                    <label className="flex flex-col items-center justify-center cursor-pointer min-h-25">
                      <MdVideoCall size={32} className="text-slate-400 mb-2" />
                      <span className="text-sm font-medium text-slate-600">
                        Select Videos
                      </span>
                      <span className="text-xs text-slate-400 mt-1">
                        {videoFiles.length} file(s) chosen
                      </span>
                      <input
                        type="file"
                        accept="video/*"
                        multiple
                        className="hidden"
                        onChange={(e) =>
                          setVideoFiles(
                            e.target.files ? Array.from(e.target.files) : [],
                          )
                        }
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 bg-white font-medium hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-5 py-2.5 rounded-lg bg-primary text-navy font-bold hover:bg-primary-hover transition-colors shadow-sm"
          >
            {mode === "add" ? "Add Athlete" : "Update Athlete"}
          </button>
        </div>
      </div>
    </div>
  );
}
