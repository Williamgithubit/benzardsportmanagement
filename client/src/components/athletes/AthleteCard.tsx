"use client";
import React, { useState, useRef, useEffect } from "react";
import {
  MdMoreVert,
  MdEdit,
  MdDelete,
  MdVisibility,
  MdLocationOn,
  MdEmail,
  MdPhone,
  MdSportsSoccer,
  MdPerson,
  MdPhotoLibrary,
} from "react-icons/md";
import { Athlete, UserRole } from "@/types/athlete";
import toast, { Toaster } from "react-hot-toast";

interface AthleteCardProps {
  athlete: Athlete;
  userRole: UserRole;
  onView: (athlete: Athlete) => void;
  onEdit: (athlete: Athlete) => void;
  onDelete: (athleteId: string) => void;
  onSelect?: (athleteId: string, selected: boolean) => void;
  selected?: boolean;
  showSelection?: boolean;
}

export default function AthleteCard({
  athlete,
  userRole,
  onView,
  onEdit,
  onDelete,
  onSelect,
  selected = false,
  showSelection = false,
}: AthleteCardProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setDropdownOpen((prev) => !prev);
  };

  const handleMenuClose = () => {
    setDropdownOpen(false);
  };

  const handleCardClick = () => {
    if (showSelection && onSelect) {
      onSelect(athlete.id, !selected);
    } else {
      onView(athlete);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700 border-green-200";
      case "scouted":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "signed":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "inactive":
        return "bg-slate-100 text-slate-700 border-slate-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getLevelStyle = (level: string) => {
    switch (level) {
      case "grassroots":
        return "bg-blue-50 text-blue-600 border-blue-200";
      case "semi-pro":
        return "bg-yellow-50 text-yellow-600 border-yellow-200";
      case "professional":
        return "bg-green-50 text-green-600 border-green-200";
      default:
        return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  const getSportIcon = (sport: string) => {
    switch (sport) {
      case "football":
        return <MdSportsSoccer className="text-current" />;
      default:
        return <MdSportsSoccer className="text-current" />;
    }
  };

  const getProfileImage = () => {
    const profilePhoto = athlete.media?.find((m) => m.type === "photo");
    return profilePhoto?.url;
  };

  const formatAge = (age?: number, dateOfBirth?: string) => {
    if (age) return `${age} years`;
    if (dateOfBirth) {
      const birthDate = new Date(dateOfBirth);
      const today = new Date();
      const calculatedAge = today.getFullYear() - birthDate.getFullYear();
      return `${calculatedAge} years`;
    }
    return "Age unknown";
  };

  const handleViewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast.loading("Loading athlete details...");
    setTimeout(() => {
      onView(athlete);
      toast.dismiss();
    }, 1000);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast.loading("Loading edit form...");
    setTimeout(() => {
      onEdit(athlete);
      toast.dismiss();
    }, 1000);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast.loading("Deleting athlete...");
    setTimeout(() => {
      onDelete(athlete.id);
      toast.dismiss();
    }, 1000);
  };

  return (
    <>
      <Toaster position="top-right" />
      <div
        className={`group relative flex flex-col h-full w-[300px] bg-white rounded-xl shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 cursor-pointer overflow-hidden border-2 ${
          selected ? "border-[#E32845] bg-[#E32845]/5" : "border-transparent"
        }`}
        onClick={handleCardClick}
      >
        {/* Selection Checkbox/Badge */}
        {showSelection && (
          <div className="absolute top-2 left-2 z-10">
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selected ? "border-[#E32845] bg-[#E32845]" : "border-black/30 bg-transparent"
              }`}
            >
              {selected && <div className="w-2.5 h-2.5 bg-[#03045e] rounded-full"></div>}
            </div>
          </div>
        )}

        {/* Profile Image */}
        <div className="relative h-[180px] overflow-hidden bg-gradient-to-br from-[#03045e] to-[#000054] flex items-center justify-center">
          {getProfileImage() ? (
            <>
              <img
                src={getProfileImage()}
                alt={athlete.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#03045e]/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </>
          ) : (
            <>
              <div className="w-[70px] h-[70px] rounded-full bg-[#E32845] flex items-center justify-center text-[#03045e] shadow-[0_4px_20px_rgba(173,248,2,0.3)] z-10">
                <MdPerson size={36} />
              </div>
              <div className="absolute top-5 right-5 w-[60px] h-[60px] rounded-full border-2 border-[#E32845]/20 animate-pulse opacity-75" />
            </>
          )}

          {/* Media Count Badge */}
          {athlete.media && athlete.media.length > 0 && (
            <div className="absolute top-3 right-3 bg-[#E32845]/90 text-[#03045e] font-bold px-2 py-1 flex items-center gap-1 rounded backdrop-blur text-xs border border-white/20">
              <MdPhotoLibrary size={14} />
              <span>{athlete.media.length}</span>
            </div>
          )}

          {/* Actions Menu Trigger */}
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 -translate-y-2 group-hover:translate-y-0 transition-all duration-300">
            <div ref={dropdownRef} className="relative">
              <button
                onClick={handleMenuClick}
                className="bg-white/95 backdrop-blur border border-white/20 shadow rounded p-1 hover:bg-white hover:scale-110 transition-all"
              >
                <MdMoreVert size={20} className="text-[#03045e]" />
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 top-0 mt-8 w-40 bg-white rounded-md shadow-lg z-20 py-1 overflow-hidden border border-slate-100 text-sm">
                  <button
                    onClick={(e) => {
                      handleViewClick(e);
                      handleMenuClose();
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                  >
                    <MdVisibility size={16} /> View Details
                  </button>
                  {(userRole.role === "admin" || userRole.permissions.canEdit) && (
                    <button
                      onClick={(e) => {
                        handleEditClick(e);
                        handleMenuClose();
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                    >
                      <MdEdit size={16} /> Edit
                    </button>
                  )}
                  {(userRole.role === "admin" || userRole.permissions.canDelete) && (
                    <button
                      onClick={(e) => {
                        handleDeleteClick(e);
                        handleMenuClose();
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-red-50 flex items-center gap-2 text-red-600"
                    >
                      <MdDelete size={16} /> Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 pt-3 flex flex-col flex-grow">
          {/* Name and Basic Info */}
          <h3 className="font-bold text-[#03045e] text-[1.1rem] leading-tight mb-2">
            {athlete.name}
          </h3>

          <div className="flex items-center gap-2 mb-3">
            <div className="p-1 rounded bg-[#E32845]/10 text-[#03045e] flex items-center">
              {getSportIcon(athlete.sport)}
            </div>
            <p className="text-slate-500 font-medium text-sm">
              {athlete.position} • {formatAge(athlete.age, athlete.dateOfBirth)}
            </p>
          </div>

          {/* Location */}
          {(athlete.location || athlete.county) && (
            <div className="flex items-center gap-1.5 mb-2 text-slate-500 text-sm">
              <MdLocationOn size={16} />
              <span>
                {athlete.county ? `${athlete.county}${athlete.location ? `, ${athlete.location}` : ""}` : athlete.location}
              </span>
            </div>
          )}

          {/* Bio */}
          {athlete.bio && (
            <p className="mb-3 text-[0.8rem] text-slate-500 line-clamp-2 min-h-[32px]">
              {athlete.bio}
            </p>
          )}

          {/* Status Chips */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            <span className={`capitalize px-2 py-0.5 text-xs font-semibold rounded border ${getLevelStyle(athlete.level)}`}>
              {athlete.level}
            </span>
            <span className={`capitalize px-2 py-0.5 text-xs font-semibold rounded border ${getStatusStyle(athlete.scoutingStatus)}`}>
              {athlete.scoutingStatus}
            </span>
          </div>

          {/* Stats */}
          {athlete.stats && (
            <div className="grid grid-cols-3 gap-2 p-3 bg-[#E32845]/10 rounded-xl mb-4 border border-[#E32845]/20">
              <div className="text-center">
                <p className="text-[#03045e] font-extrabold text-xl leading-none mb-1">{athlete.stats.goals || 0}</p>
                <p className="text-slate-500 font-semibold text-[0.65rem] uppercase tracking-wider">Goals</p>
              </div>
              <div className="text-center">
                <p className="text-[#03045e] font-extrabold text-xl leading-none mb-1">{athlete.stats.assists || 0}</p>
                <p className="text-slate-500 font-semibold text-[0.65rem] uppercase tracking-wider">Assists</p>
              </div>
              <div className="text-center">
                <p className="text-[#03045e] font-extrabold text-xl leading-none mb-1">{athlete.stats.matches || 0}</p>
                <p className="text-slate-500 font-semibold text-[0.65rem] uppercase tracking-wider">Matches</p>
              </div>
            </div>
          )}

          <div className="mt-auto">
            {/* Contact Info */}
            <div className="flex justify-center gap-2 mb-3">
              {athlete.contact?.email && (
                <button title={athlete.contact.email} className="p-1 text-[#03045e] hover:bg-slate-100 rounded-full transition-colors">
                  <MdEmail size={18} />
                </button>
              )}
              {athlete.contact?.phone && (
                <button title={athlete.contact.phone} className="p-1 text-[#03045e] hover:bg-slate-100 rounded-full transition-colors">
                  <MdPhone size={18} />
                </button>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleViewClick}
                className="flex-1 py-1.5 text-sm font-semibold rounded-md border border-[#03045e] text-[#03045e] hover:border-[#E32845] hover:bg-[#E32845]/10 hover:-translate-y-[1px] hover:shadow-[0_2px_8px_rgba(173,248,2,0.2)] transition-all"
              >
                View
              </button>
              {userRole.permissions.canEdit && (
                <button
                  onClick={handleEditClick}
                  className="flex-1 py-1.5 text-sm font-bold rounded-md bg-secondary text-white hover:bg-secondary-hover hover:-translate-y-[1px] shadow-[0_1px_4px_rgba(173,248,2,0.3)] hover:shadow-[0_3px_8px_rgba(173,248,2,0.4)] transition-all"
                >
                  Edit
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}