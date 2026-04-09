import React, { useState, useEffect } from "react";
import {
  MdEdit,
  MdSave,
  MdCancel,
  MdVisibility,
  MdVisibilityOff,
  MdPhotoCamera,
  MdAccountCircle,
  MdEmail,
  MdPhone,
  MdClose
} from "react-icons/md";
import { useAppSelector, useAppDispatch } from "@/store/store";
import { updateUser } from "@/store/Auth/authSlice";
import { SettingsService } from "@/services/settingsService";

interface ProfileTabProps {
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

const ProfileTab: React.FC<ProfileTabProps> = ({ onSuccess, onError }) => {
  const currentUser = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();

  // Profile settings state
  const [profileData, setProfileData] = useState({
    name: currentUser?.name || "",
    email: currentUser?.email || "",
    phone: "",
    bio: "",
    location: "",
    website: "",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [loading, setLoading] = useState(false);

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  const handleProfileSave = async () => {
    try {
      setLoading(true);
      if (!currentUser) throw new Error("No authenticated user");

      // Update backend profile
      await SettingsService.updateTeacherProfile(currentUser.uid, {
        firstName: profileData.name.split(" ")[0] || profileData.name,
        lastName: profileData.name.split(" ").slice(1).join(" ") || "",
        phoneNumber: profileData.phone,
        bio: profileData.bio,
        officeLocation: profileData.location,
      });

      // Update Redux store
      dispatch(
        updateUser({
          ...currentUser,
          name: profileData.name,
          email: profileData.email,
        })
      );

      setEditingProfile(false);
      onSuccess("Profile updated successfully!");
    } catch (err) {
      onError("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  // Load profile from service on mount
  useEffect(() => {
    let mounted = true;
    
    const loadProfile = async () => {
      if (!currentUser?.uid) {
        console.warn("No current user available to load profile");
        return;
      }
      
      try {
        const profile = await SettingsService.getTeacherProfile(currentUser.uid);
        
        if (!mounted) return;
        
        if (profile) {
          setProfileData({
            name:
              `${profile.firstName || ""} ${profile.lastName || ""}`.trim() ||
              currentUser.name ||
              "",
            email: profile.email || currentUser.email || "",
            phone: profile.phoneNumber || "",
            bio: profile.bio || "",
            location: profile.officeLocation || "",
            website: "",
          });
        }
      } catch (error) {
        console.error("Failed to load profile", error);
        onError("Failed to load profile. Please refresh the page or try again later.");
      }
    };

    loadProfile();
    return () => {
      mounted = false;
    };
  }, [currentUser, onError]);

  const handleAvatarSelect = (file?: File) => {
    if (!file) return;
    setAvatarFile(file);
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile || !currentUser) {
      onError("No file selected or no authenticated user");
      return;
    }
    try {
      setLoading(true);
      const url = await SettingsService.uploadAvatar({
        file: avatarFile,
        userId: currentUser.uid,
      });
      onSuccess("Avatar uploaded");
      // update Redux user avatar if present
      dispatch(updateUser({ ...currentUser, photoURL: url }));
      setAvatarFile(null);
    } catch (err) {
      console.error(err);
      onError("Failed to upload avatar");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      onError("New passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      onError("Password must be at least 8 characters long");
      return;
    }

    if (!passwordData.currentPassword) {
      onError("Current password is required");
      return;
    }

    try {
      setLoading(true);
      if (!currentUser) throw new Error("No authenticated user");
      await SettingsService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword,
      });

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordDialogOpen(false);
      onSuccess("Password changed successfully!");
    } catch (err) {
      console.error(err);
      onError((err as Error)?.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (field: "current" | "new" | "confirm") => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Profile Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:col-span-1 h-fit">
        <div className="text-center">
            <div className="w-28 h-28 bg-[#000054] text-white rounded-full flex items-center justify-center mx-auto mb-4 text-4xl font-bold shadow-md shadow-[#000054]/20 relative object-cover overflow-hidden">
                {currentUser?.photoURL ? (
                    <img src={currentUser.photoURL} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                    currentUser?.name?.charAt(0).toUpperCase() || "A"
                )}
            </div>
            
            <h3 className="text-xl font-bold text-slate-800 mb-1">
                {currentUser?.name || "Admin User"}
            </h3>
            <p className="text-sm font-medium text-slate-500 mb-4">
                {currentUser?.role || "Administrator"}
            </p>
            
            <div className="inline-block px-3 py-1 bg-green-50 text-green-600 border border-green-200 rounded-full text-xs font-bold mb-6">
                Active
            </div>
            
            <div className="border-t border-slate-100 pt-6">
                <button
                className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-bold transition-colors"
                onClick={() => document.getElementById("avatar-input")?.click()}
                >
                <MdPhotoCamera size={20} />
                Change Photo
                </button>
                <input
                id="avatar-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleAvatarSelect(e.target.files?.[0])}
                />
                
                {avatarFile && (
                <div className="mt-4 flex gap-2">
                    <button
                        className="flex-1 py-2 bg-[#000054] text-white font-bold rounded-lg hover:bg-[#1a1a6e] transition-colors disabled:opacity-50 flex items-center justify-center"
                        onClick={handleAvatarUpload}
                        disabled={loading}
                    >
                    {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : "Upload"}
                    </button>
                    <button
                        className="flex-1 py-2 bg-white text-slate-700 border border-slate-300 font-bold rounded-lg hover:bg-slate-50 transition-colors"
                        onClick={() => setAvatarFile(null)}
                    >
                    Cancel
                    </button>
                </div>
                )}
            </div>
        </div>
      </div>

      {/* Profile Information */}
      <div className="md:col-span-2 flex flex-col gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
             <h3 className="text-lg font-bold text-[#000054]">Profile Information</h3>
             <button 
                onClick={() => setEditingProfile(!editingProfile)}
                className={`p-2 rounded-lg transition-colors ${editingProfile ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
             >
                {editingProfile ? <MdCancel size={20} /> : <MdEdit size={20} />}
             </button>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
               <div className="space-y-1">
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                 <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <MdAccountCircle size={20} />
                    </div>
                    <input 
                      type="text" 
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      disabled={!editingProfile}
                      className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#000054]/50 focus:border-[#000054] disabled:bg-slate-50 disabled:text-slate-500 transition-colors"
                    />
                 </div>
               </div>

               <div className="space-y-1">
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email</label>
                 <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <MdEmail size={20} />
                    </div>
                    <input 
                      type="email" 
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      disabled={!editingProfile}
                      className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#000054]/50 focus:border-[#000054] disabled:bg-slate-50 disabled:text-slate-500 transition-colors"
                    />
                 </div>
               </div>

               <div className="space-y-1">
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone</label>
                 <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <MdPhone size={20} />
                    </div>
                    <input 
                      type="tel" 
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      disabled={!editingProfile}
                      className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#000054]/50 focus:border-[#000054] disabled:bg-slate-50 disabled:text-slate-500 transition-colors"
                    />
                 </div>
               </div>

               <div className="space-y-1">
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Location</label>
                 <input 
                    type="text" 
                    value={profileData.location}
                    onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                    disabled={!editingProfile}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#000054]/50 focus:border-[#000054] disabled:bg-slate-50 disabled:text-slate-500 transition-colors"
                 />
               </div>

               <div className="col-span-1 sm:col-span-2 space-y-1">
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bio</label>
                 <textarea 
                    rows={3}
                    value={profileData.bio}
                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                    disabled={!editingProfile}
                    placeholder="Tell us about yourself..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#000054]/50 focus:border-[#000054] disabled:bg-slate-50 disabled:text-slate-500 transition-colors resize-none"
                 />
               </div>

               <div className="col-span-1 sm:col-span-2 space-y-1">
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Website</label>
                 <input 
                    type="url" 
                    value={profileData.website}
                    onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                    disabled={!editingProfile}
                    placeholder="https://example.com"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#000054]/50 focus:border-[#000054] disabled:bg-slate-50 disabled:text-slate-500 transition-colors"
                 />
               </div>
            </div>

            {editingProfile && (
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  onClick={handleProfileSave}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-6 py-2 bg-[#ADF802] text-[#000054] font-bold rounded-lg hover:bg-[#9DE002] transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-[#000054] border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <MdSave size={20} />
                      Save Changes
                    </>
                  )}
                </button>
                <button
                  onClick={() => setEditingProfile(false)}
                  className="px-6 py-2 bg-white text-slate-700 border border-slate-300 font-bold rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Password & Security Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
             <h3 className="text-lg font-bold text-[#000054]">Password & Security</h3>
          </div>
          <div className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-bold text-slate-800">Password</p>
                <p className="text-sm font-medium text-slate-500">Last changed 30 days ago</p>
              </div>
              <button
                onClick={() => setPasswordDialogOpen(true)}
                className="px-4 py-2 border border-[#000054] text-[#000054] font-bold rounded-lg hover:bg-slate-50 transition-colors"
              >
                Change Password
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Password Change Dialog */}
      {passwordDialogOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/80 backdrop-blur-sm animate-in fade-in" onClick={() => setPasswordDialogOpen(false)}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
               <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                  <h3 className="text-xl font-bold text-[#000054]">Change Password</h3>
                  <button onClick={() => setPasswordDialogOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                     <MdClose size={24} />
                  </button>
               </div>
               <div className="p-6 space-y-4">
                  <div className="space-y-1">
                     <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Password</label>
                     <div className="relative">
                        <input 
                           type={showPasswords.current ? "text" : "password"}
                           value={passwordData.currentPassword}
                           onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                           className="w-full pl-3 pr-10 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#000054]/50 focus:border-[#000054] transition-colors"
                        />
                        <button 
                           onClick={() => togglePasswordVisibility("current")}
                           className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                        >
                           {showPasswords.current ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
                        </button>
                     </div>
                  </div>

                  <div className="space-y-1">
                     <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">New Password</label>
                     <div className="relative">
                        <input 
                           type={showPasswords.new ? "text" : "password"}
                           value={passwordData.newPassword}
                           onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                           className="w-full pl-3 pr-10 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#000054]/50 focus:border-[#000054] transition-colors"
                        />
                        <button 
                           onClick={() => togglePasswordVisibility("new")}
                           className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                        >
                           {showPasswords.new ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
                        </button>
                     </div>
                     <p className="text-xs text-slate-500 font-medium">Password must be at least 8 characters long</p>
                  </div>

                  <div className="space-y-1">
                     <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Confirm New Password</label>
                     <div className="relative">
                        <input 
                           type={showPasswords.confirm ? "text" : "password"}
                           value={passwordData.confirmPassword}
                           onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                           className="w-full pl-3 pr-10 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#000054]/50 focus:border-[#000054] transition-colors"
                        />
                        <button 
                           onClick={() => togglePasswordVisibility("confirm")}
                           className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                        >
                           {showPasswords.confirm ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
                        </button>
                     </div>
                  </div>
               </div>
               <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
                  <button 
                     onClick={() => setPasswordDialogOpen(false)} 
                     disabled={loading}
                     className="px-5 py-2 font-bold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                     Cancel
                  </button>
                  <button 
                     onClick={handlePasswordChange}
                     disabled={loading}
                     className="px-6 py-2 font-bold text-white bg-[#E32845] rounded-lg hover:bg-[#c41e3a] transition-colors flex items-center justify-center min-w-[120px]"
                  >
                     {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : "Change Password"}
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default ProfileTab;
