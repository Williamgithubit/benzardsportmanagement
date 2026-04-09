"use client";
import React, { useState } from "react";
import {
  MdClose,
  MdEdit,
  MdLocationOn,
  MdEmail,
  MdPhone,
  MdCake,
  MdHeight,
  MdFitnessCenter,
  MdSportsSoccer,
  MdEmojiEvents,
  MdSchool,
  MdPerson,
  MdDownload,
  MdPhotoLibrary
} from "react-icons/md";
import { FaInstagram, FaTwitter, FaFacebook } from "react-icons/fa";
import { Athlete, UserRole } from "@/types/athlete";

interface AthleteProfileProps {
  athlete: Athlete | null;
  open: boolean;
  onClose: () => void;
  onEdit: (athlete: Athlete) => void;
  userRole: UserRole;
}

export default function AthleteProfile({
  athlete,
  open,
  onClose,
  onEdit,
  userRole,
}: AthleteProfileProps) {
  const [activeTab, setActiveTab] = useState(0);

  if (!open || !athlete) return null;

  const tabs = ["Overview", "Statistics", "Media", "Contact", "History"];

  const getProfileImage = () => {
    const profilePhoto = athlete.media?.find((m) => m.type === "photo");
    return profilePhoto?.url;
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const photos = athlete.media?.filter((m) => m.type === "photo") || [];
  const videos = athlete.media?.filter((m) => m.type === "video") || [];

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 sm:p-6 bg-[#03045e]/80 backdrop-blur-sm">
      <div 
        className="bg-slate-50 w-full max-w-5xl h-[90vh] sm:h-auto sm:max-h-[85vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Section */}
        <div className="bg-gradient-to-r from-[#03045e] to-[#000054] text-white p-6 relative shrink-0">
          <div className="absolute top-4 right-4 flex gap-2">
            {userRole.permissions.canEdit && (
              <button
                onClick={() => onEdit(athlete)}
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                title="Edit Athlete"
              >
                <MdEdit size={22} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
              title="Close"
            >
              <MdClose size={24} />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mt-4 sm:mt-0">
            {/* Avatar */}
            <div className="shrink-0">
              {getProfileImage() ? (
                <img
                  src={getProfileImage()}
                  alt={athlete.name}
                  className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-[#E32845] shadow-lg"
                />
              ) : (
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-[#E32845] text-[#03045e] flex items-center justify-center border-4 border-[#E32845] shadow-[0_0_20px_rgba(173,248,2,0.3)]">
                  <MdPerson size={64} />
                </div>
              )}
            </div>

            {/* Basic Info */}
            <div className="flex-grow">
              <h1 className="text-3xl font-extrabold mb-1">{athlete.name}</h1>
              <p className="text-lg text-white/80 font-medium mb-3 flex items-center gap-2">
                <MdSportsSoccer className="text-[#E32845]" />
                {athlete.position} • <span className="capitalize">{athlete.sport}</span>
              </p>
              
              <div className="flex flex-wrap gap-2">
                <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase border ${getLevelStyle(athlete.level)}`}>
                  {athlete.level}
                </span>
                <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase border ${getStatusStyle(athlete.scoutingStatus)}`}>
                  {athlete.scoutingStatus}
                </span>
                {athlete.county && (
                  <span className="px-2.5 py-1 rounded border border-white/30 bg-white/10 text-white text-xs font-medium flex items-center gap-1 backdrop-blur-sm">
                    <MdLocationOn />
                    {athlete.county}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto bg-white border-b border-slate-200 shrink-0 hide-scrollbar pt-2 px-4">
          {tabs.map((tab, idx) => (
            <button
              key={tab}
              onClick={() => setActiveTab(idx)}
              className={`px-5 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                activeTab === idx
                  ? "border-[#03045e] text-[#03045e]"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50">
          
          {/* Overview Tab */}
          {activeTab === 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Personal Information */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                <h3 className="text-lg font-bold text-[#03045e] mb-4 border-b border-slate-100 pb-2">
                  Personal Information
                </h3>
                <div className="space-y-3">
                  {athlete.age && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-slate-50 text-slate-500 rounded-lg shrink-0 mt-0.5"><MdCake size={18} /></div>
                      <div>
                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Age</p>
                        <p className="text-slate-800 font-medium">{athlete.age} years</p>
                      </div>
                    </div>
                  )}
                  {athlete.dateOfBirth && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-slate-50 text-slate-500 rounded-lg shrink-0 mt-0.5"><MdCake size={18} /></div>
                      <div>
                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Date of Birth</p>
                        <p className="text-slate-800 font-medium">{formatDate(athlete.dateOfBirth)}</p>
                      </div>
                    </div>
                  )}
                  {athlete.height && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-slate-50 text-slate-500 rounded-lg shrink-0 mt-0.5"><MdHeight size={18} /></div>
                      <div>
                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Height</p>
                        <p className="text-slate-800 font-medium">{athlete.height} cm</p>
                      </div>
                    </div>
                  )}
                  {athlete.weight && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-slate-50 text-slate-500 rounded-lg shrink-0 mt-0.5"><MdFitnessCenter size={18} /></div>
                      <div>
                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Weight</p>
                        <p className="text-slate-800 font-medium">{athlete.weight} kg</p>
                      </div>
                    </div>
                  )}
                  {athlete.preferredFoot && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-slate-50 text-slate-500 rounded-lg shrink-0 mt-0.5"><MdSportsSoccer size={18} /></div>
                      <div>
                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Preferred Foot</p>
                        <p className="text-slate-800 font-medium capitalize">{athlete.preferredFoot}</p>
                      </div>
                    </div>
                  )}
                  {athlete.nationality && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-slate-50 text-slate-500 rounded-lg shrink-0 mt-0.5"><MdLocationOn size={18} /></div>
                      <div>
                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Nationality</p>
                        <p className="text-slate-800 font-medium">{athlete.nationality}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Bio and Training */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-[#03045e] mb-4 border-b border-slate-100 pb-2">
                    Bio & Training
                  </h3>
                  {athlete.bio ? (
                    <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{athlete.bio}</p>
                  ) : (
                    <p className="text-slate-400 text-sm italic">No bio available.</p>
                  )}
                </div>

                {athlete.trainingProgram && (
                  <div>
                    <h4 className="text-sm font-bold text-[#03045e] mb-1 flex items-center gap-1.5 break-words">
                      <span className="w-1.5 h-1.5 bg-[#E32845] rounded-full"></span>
                      Training Program
                    </h4>
                    <p className="text-slate-600 text-sm leading-relaxed">{athlete.trainingProgram}</p>
                  </div>
                )}
                
                {athlete.performanceNotes && (
                  <div>
                    <h4 className="text-sm font-bold text-[#03045e] mb-1 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-accent rounded-full"></span>
                      Performance Notes
                    </h4>
                    <p className="text-slate-600 text-sm leading-relaxed">{athlete.performanceNotes}</p>
                  </div>
                )}
              </div>

              {/* Achievements */}
              {athlete.achievements && athlete.achievements.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 lg:col-span-2">
                  <h3 className="text-lg font-bold text-[#03045e] mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
                    <MdEmojiEvents className="text-[#E32845]" />
                    Achievements
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {athlete.achievements.map((achievement, index) => (
                      <span
                        key={index}
                        className="px-3 py-1.5 bg-[#E32845]/10 border border-[#E32845]/30 text-[#03045e] text-sm font-medium rounded-full flex items-center gap-1.5"
                      >
                        <span className="w-1.5 h-1.5 bg-[#E32845] rounded-full"></span>
                        {achievement}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Statistics Tab */}
          {activeTab === 1 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden max-w-3xl mx-auto">
              <div className="p-5 border-b border-slate-100 bg-slate-50">
                <h3 className="text-lg font-bold text-[#03045e]">
                  Performance Statistics
                </h3>
              </div>
              
              {athlete.stats ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3 shrink-0">Metric</th>
                        <th className="px-6 py-3">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {Object.entries(athlete.stats).map(([key, value]) => (
                        <tr key={key} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-3.5 font-medium text-slate-800 capitalize">
                            {key.replace(/([A-Z])/g, " $1").trim()}
                          </td>
                          <td className="px-6 py-3.5 text-[#03045e] font-bold text-base">
                            {value}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-10 text-center">
                  <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
                    <MdSportsSoccer size={32} />
                  </div>
                  <p className="text-slate-500">No statistics available for this athlete.</p>
                </div>
              )}
            </div>
          )}

          {/* Media Tab */}
          {activeTab === 2 && (
            <div className="space-y-8">
              {/* Photos */}
              {photos.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-[#03045e] mb-4 border-b border-slate-200 pb-2">
                    Photos ({photos.length})
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {photos.map((photo) => (
                      <div key={photo.id} className="group relative rounded-xl overflow-hidden shadow-sm border border-slate-200 aspect-square bg-slate-100">
                        <img
                          src={photo.url}
                          alt={photo.caption || "Athlete photo"}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        {photo.caption && (
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-8 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                            <p className="text-white text-xs font-medium truncate">{photo.caption}</p>
                          </div>
                        )}
                        <a 
                          href={photo.url} 
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute top-2 right-2 p-1.5 bg-black/40 hover:bg-[#E32845] hover:text-[#03045e] text-white rounded-full opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"
                          title="Download"
                        >
                          <MdDownload size={18} />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Videos */}
              {videos.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-[#03045e] mb-4 border-b border-slate-200 pb-2">
                    Videos ({videos.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {videos.map((video) => (
                      <div key={video.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="aspect-video bg-black relative">
                          <video
                            controls
                            className="absolute inset-0 w-full h-full"
                          >
                            <source src={video.url} type={video.mimeType} />
                            Your browser does not support the video tag.
                          </video>
                        </div>
                        {video.caption && (
                          <div className="p-3 bg-white">
                            <p className="text-sm text-slate-700 font-medium">{video.caption}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {photos.length === 0 && videos.length === 0 && (
                <div className="p-12 text-center bg-white rounded-xl shadow-sm border border-slate-200 max-w-2xl mx-auto mt-8">
                  <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MdPhotoLibrary size={32} />
                  </div>
                  <h4 className="text-lg font-bold text-slate-700 mb-1">No Media Found</h4>
                  <p className="text-slate-500">There are no photos or videos available for this athlete yet.</p>
                </div>
              )}
            </div>
          )}

          {/* Contact Tab */}
          {activeTab === 3 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {/* Primary Contact */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-full">
                <h3 className="text-lg font-bold text-[#03045e] mb-5 border-b border-slate-100 pb-2">
                  Contact Information
                </h3>
                
                <div className="space-y-4 flex-grow">
                  {athlete.contact?.email ? (
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <MdEmail size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Email Address</p>
                        <a href={`mailto:${athlete.contact.email}`} className="text-[#03045e] font-medium hover:text-blue-600 transition-colors">
                          {athlete.contact.email}
                        </a>
                      </div>
                    </div>
                  ) : null}

                  {athlete.contact?.phone ? (
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                        <MdPhone size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Phone Number</p>
                        <a href={`tel:${athlete.contact.phone}`} className="text-[#03045e] font-medium hover:text-green-600 transition-colors">
                          {athlete.contact.phone}
                        </a>
                      </div>
                    </div>
                  ) : null}

                  {athlete.contact?.address ? (
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                        <MdLocationOn size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Mailing Address</p>
                        <p className="text-slate-700 text-sm leading-relaxed">
                          {athlete.contact.address.street && `${athlete.contact.address.street}, `}
                          <br className="hidden sm:block" />
                          {athlete.contact.address.city && `${athlete.contact.address.city}, `}
                          {athlete.contact.address.county && `${athlete.contact.address.county}, `}
                          {athlete.contact.address.country}
                        </p>
                      </div>
                    </div>
                  ) : null}

                  {!athlete.contact?.email && !athlete.contact?.phone && !athlete.contact?.address && (
                    <p className="text-slate-500 italic text-sm">No primary contact information provided.</p>
                  )}
                </div>
              </div>

              {/* Emergency Contact & Socials */}
              <div className="space-y-6 flex flex-col">
                {/* Emergency Contact */}
                {athlete.contact?.emergencyContact && (
                  <div className="bg-white rounded-xl shadow-sm border border-red-100 p-6 relative overflow-hidden flex-grow">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-bl-full -mr-4 -mt-4 z-0"></div>
                    <h3 className="text-lg font-bold text-red-700 mb-4 border-b border-red-100 pb-2 relative z-10 flex items-center gap-2">
                       Emergency Contact
                    </h3>
                    
                    <div className="space-y-3 relative z-10">
                      <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                        <span className="text-slate-500 text-sm font-medium">Name</span>
                        <span className="font-bold text-slate-800">{athlete.contact.emergencyContact.name}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                        <span className="text-slate-500 text-sm font-medium">Relationship</span>
                        <span className="font-medium text-slate-700 capitalize">{athlete.contact.emergencyContact.relationship}</span>
                      </div>
                      <div className="flex justify-between items-center pt-1">
                        <span className="text-slate-500 text-sm font-medium">Phone</span>
                        <a href={`tel:${athlete.contact.emergencyContact.phone}`} className="font-bold text-[#03045e] hover:text-[#E32845] transition-colors flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                           <MdPhone size={14}/> {athlete.contact.emergencyContact.phone}
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* Social Media */}
                {(athlete.socialMedia?.instagram || athlete.socialMedia?.twitter || athlete.socialMedia?.facebook) && (
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 shrink-0">
                    <h3 className="text-lg font-bold text-[#03045e] mb-4 border-b border-slate-100 pb-2">
                      Social Media
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {athlete.socialMedia.instagram && (
                        <a
                          href={athlete.socialMedia.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 text-white rounded-lg hover:shadow-md hover:-translate-y-0.5 transition-all text-sm font-medium"
                        >
                          <FaInstagram size={18} /> Instagram
                        </a>
                      )}
                      {athlete.socialMedia.twitter && (
                        <a
                          href={athlete.socialMedia.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 bg-[#1DA1F2] text-white rounded-lg hover:shadow-md hover:-translate-y-0.5 transition-all text-sm font-medium"
                        >
                          <FaTwitter size={18} /> Twitter
                        </a>
                      )}
                      {athlete.socialMedia.facebook && (
                        <a
                          href={athlete.socialMedia.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 bg-[#4267B2] text-white rounded-lg hover:shadow-md hover:-translate-y-0.5 transition-all text-sm font-medium"
                        >
                          <FaFacebook size={18} /> Facebook
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 4 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              
              {/* Previous Clubs */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 lg:col-span-2">
                <h3 className="text-lg font-bold text-[#03045e] mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
                  <MdSchool className="text-slate-400" />
                  Previous Clubs
                </h3>
                {athlete.previousClubs && athlete.previousClubs.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {athlete.previousClubs.map((club, index) => (
                      <span key={index} className="px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg">
                        {club}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm italic">No previous clubs listed.</p>
                )}
              </div>

               {/* Medical Information */}
               {athlete.medicalInfo && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 lg:col-span-2">
                  <h3 className="text-lg font-bold text-[#03045e] mb-4 border-b border-slate-100 pb-2">
                    Medical Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {athlete.medicalInfo.allergies && athlete.medicalInfo.allergies.length > 0 && (
                      <div>
                        <h4 className="text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Allergies</h4>
                        <div className="flex flex-wrap gap-2">
                          {athlete.medicalInfo.allergies.map((item, idx) => (
                            <span key={idx} className="px-2.5 py-1 bg-red-50 text-red-700 border border-red-100 rounded text-xs font-medium">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {athlete.medicalInfo.conditions && athlete.medicalInfo.conditions.length > 0 && (
                      <div>
                        <h4 className="text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Conditions</h4>
                        <div className="flex flex-wrap gap-2">
                          {athlete.medicalInfo.conditions.map((item, idx) => (
                            <span key={idx} className="px-2.5 py-1 bg-orange-50 text-orange-700 border border-orange-100 rounded text-xs font-medium">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {athlete.medicalInfo.bloodType && (
                       <div>
                        <h4 className="text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Blood Type</h4>
                        <span className="px-3 py-1.5 bg-red-600 text-white rounded font-bold">
                           {athlete.medicalInfo.bloodType}
                        </span>
                      </div>
                    )}
                    
                    {athlete.medicalInfo.notes && (
                      <div className="md:col-span-2 mt-2">
                        <h4 className="text-sm font-bold text-slate-700 mb-1 uppercase tracking-wide">Medical Notes</h4>
                        <p className="text-slate-600 text-sm bg-slate-50 p-3 rounded-lg border border-slate-200">{athlete.medicalInfo.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* System Information */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 lg:col-span-2">
                <h3 className="text-lg font-bold text-[#03045e] mb-4 border-b border-slate-100 pb-2">
                  System Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Created</span>
                    <span className="text-slate-800 font-medium">{formatDate(athlete.createdAt)}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Last Updated</span>
                    <span className="text-slate-800 font-medium">{formatDate(athlete.updatedAt)}</span>
                  </div>
                  {athlete.createdBy && (
                    <div>
                      <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Created By</span>
                      <span className="text-slate-800 font-medium text-xs break-all">{athlete.createdBy}</span>
                    </div>
                  )}
                </div>
              </div>
              
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
