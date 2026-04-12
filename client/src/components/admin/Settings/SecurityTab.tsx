import React, { useState, useEffect } from "react";
import {
  MdLock,
  MdNotifications,
  MdDeviceHub,
  MdShield,
  MdWarning,
} from "react-icons/md";
import { useAppSelector } from "@/store/store";
import { SettingsService } from "@/services/settingsService";

interface SecuritySettings {
  twoFactorEnabled: boolean;
  sessionTimeout: number;
  passwordExpiry: number;
  loginNotifications: boolean;
  deviceTracking: boolean;
  ipWhitelist: string;
  lastPasswordChange: string;
  activeSessions: number;
  trustedDevices: number;
}

interface SecurityTabProps {
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

const SecurityTab: React.FC<SecurityTabProps> = ({ onSuccess, onError }) => {
  // Security settings state
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    sessionTimeout: 30,
    passwordExpiry: 90,
    loginNotifications: true,
    deviceTracking: true,
    ipWhitelist: "",
    lastPasswordChange: "30 days ago",
    activeSessions: 2,
    trustedDevices: 3,
  });

  const [loading, setLoading] = useState(false);
  const currentUser = useAppSelector((s) => s.auth.user);

  useEffect(() => {
    // Load security settings from localStorage
    let mounted = true;
    const load = async () => {
      try {
        const savedSecurity = localStorage.getItem("securitySettings");
        if (savedSecurity) {
          const parsed = JSON.parse(savedSecurity);
          if (mounted) setSecuritySettings((prev) => ({ ...prev, ...parsed }));
        } else if (currentUser && currentUser.uid) {
          const svcSettings = await SettingsService.getSecuritySettings(
            currentUser.uid
          );
          if (svcSettings && mounted) {
            // Map fields from service to local shape
            setSecuritySettings((prev) => ({
              ...prev,
              twoFactorEnabled: svcSettings.twoFactorEnabled,
              sessionTimeout: svcSettings.sessionTimeout,
              passwordExpiry: prev.passwordExpiry,
              loginNotifications:
                svcSettings.loginAlerts?.emailOnNewDevice ??
                prev.loginNotifications,
              deviceTracking: (svcSettings.allowedDevices?.length ?? 0) > 0,
              ipWhitelist: (svcSettings.trustedIPs || []).join("\n"),
              lastPasswordChange:
                svcSettings.lastPasswordChange || prev.lastPasswordChange,
            }));
          }
        }
      } catch {
        console.error("Error loading security settings");
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [currentUser]);

  const saveSettings = async (newSettings: SecuritySettings) => {
    try {
      setLoading(true);
      // Save to localStorage immediately
      localStorage.setItem("securitySettings", JSON.stringify(newSettings));

      // Save to backend if user is authenticated
      if (currentUser && currentUser.uid) {
        await SettingsService.updateSecuritySettings(currentUser.uid, {
          twoFactorEnabled: newSettings.twoFactorEnabled,
          loginAlerts: {
            emailOnNewDevice: newSettings.loginNotifications,
            emailOnSuspiciousActivity: newSettings.loginNotifications,
            showLastLoginInfo: true,
          },
          sessionTimeout: newSettings.sessionTimeout,
          allowedDevices: newSettings.deviceTracking ? ["*"] : [],
          lastPasswordChange: newSettings.lastPasswordChange,
          trustedIPs: newSettings.ipWhitelist
            ? newSettings.ipWhitelist
                .split("\n")
                .map((s) => s.trim())
                .filter(Boolean)
            : [],
        });
      }

      setSecuritySettings(newSettings);
      onSuccess("Security settings updated successfully!");
    } catch {
      onError("Failed to update security settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSecurityChange = <K extends keyof SecuritySettings>(
    setting: K
  ) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    let value: SecuritySettings[K];
    
    if (event.target.type === 'checkbox') {
      value = (event.target as HTMLInputElement).checked as SecuritySettings[K];
    } else if (event.target.type === 'number') {
      value = Number((event.target as HTMLInputElement).value) as SecuritySettings[K];
    } else {
      value = event.target.value as SecuritySettings[K];
    }
    
    const newSettings = { ...securitySettings, [setting]: value };

    // Auto-save for switches, manual save for text inputs
    if (event.target.type === "checkbox") {
      saveSettings(newSettings);
    } else {
      setSecuritySettings(newSettings);
    }
  };

  const handleTextFieldSave = (field: keyof SecuritySettings) => {
    // Only save if the field value is valid
    if (field in securitySettings) {
      const value = securitySettings[field];
      // Ensure the value is a valid type before saving
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        saveSettings(securitySettings);
      }
    }
  };

  const getSecurityScore = (): number => {
    let score = 0;
    if (securitySettings.twoFactorEnabled) score += 25;
    if (securitySettings.loginNotifications) score += 15;
    if (securitySettings.deviceTracking) score += 15;
    if (securitySettings.sessionTimeout <= 60) score += 20;
    if (securitySettings.passwordExpiry <= 90) score += 15;
    if (securitySettings.ipWhitelist.length > 0) score += 10;
    return score;
  };

  const getSecurityLevel = (score: number) => {
    if (score >= 80) return { level: "Excellent", colorClass: "text-emerald-500", bgClass: "bg-emerald-50" };
    if (score >= 60) return { level: "Good", colorClass: "text-blue-500", bgClass: "bg-blue-50" };
    if (score >= 40) return { level: "Fair", colorClass: "text-amber-500", bgClass: "bg-amber-50" };
    return { level: "Poor", colorClass: "text-red-500", bgClass: "bg-red-50" };
  };

  const securityScore = getSecurityScore();
  const securityLevel = getSecurityLevel(securityScore);

  return (
    <div className="flex flex-wrap gap-6">
      {/* Security Overview */}
      <div className="w-full">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
             <h3 className="text-lg font-bold text-[#000054]">Security Overview</h3>
          </div>
          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="flex-1 w-full">
                <div className="flex items-center gap-4">
                  <div className={`p-4 rounded-xl ${securityLevel.bgClass} ${securityLevel.colorClass}`}>
                     <MdShield size={48} />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-slate-800">
                      Security Level: <span className={securityLevel.colorClass}>{securityLevel.level}</span>
                    </h4>
                    <p className="text-slate-500 font-medium">
                      Security Score: {securityScore}/100
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 w-full grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-2xl font-extrabold text-[#000054] mb-1">
                      {securitySettings.activeSessions}
                    </p>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Active Sessions
                    </p>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-2xl font-extrabold text-[#000054] mb-1">
                      {securitySettings.trustedDevices}
                    </p>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Trusted Devices
                    </p>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-lg font-extrabold text-[#000054] mb-1 h-8 flex items-center justify-center">
                      {securitySettings.lastPasswordChange}
                    </p>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Last Password Change
                    </p>
                  </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Authentication Settings */}
      <div className="w-full md:w-[calc(50%-12px)]">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-full">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
             <h3 className="text-lg font-bold text-[#000054]">Security Settings</h3>
          </div>
          <div className="p-6 flex flex-col gap-6">
            
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                     <MdLock size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">Two-Factor Authentication</p>
                    <p className="text-sm text-slate-500">Add an extra layer of security to your account</p>
                  </div>
               </div>
               <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={securitySettings.twoFactorEnabled} onChange={handleSecurityChange("twoFactorEnabled")} disabled={loading} />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#000054]"></div>
               </label>
            </div>

            <div className="flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                     <MdNotifications size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">Login Notifications</p>
                    <p className="text-sm text-slate-500">Get notified of new sign-ins to your account</p>
                  </div>
               </div>
               <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={securitySettings.loginNotifications} onChange={handleSecurityChange("loginNotifications")} disabled={loading} />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#000054]"></div>
               </label>
            </div>

            <div className="flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                     <MdDeviceHub size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">Device Tracking</p>
                    <p className="text-sm text-slate-500">Track and monitor devices that access your account</p>
                  </div>
               </div>
               <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={securitySettings.deviceTracking} onChange={handleSecurityChange("deviceTracking")} disabled={loading} />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#000054]"></div>
               </label>
            </div>

            {!securitySettings.twoFactorEnabled && (
              <div className="mt-2 bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg flex gap-3">
                 <MdWarning className="text-amber-500 shrink-0 mt-0.5" size={20} />
                 <p className="text-sm text-amber-800">
                    <strong>Recommended:</strong> Enable Two-Factor Authentication for better security.
                 </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Session Management */}
      <div className="w-full md:w-[calc(50%-12px)]">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-full">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
             <h3 className="text-lg font-bold text-[#000054]">Session Management</h3>
          </div>
          <div className="p-6 flex flex-col gap-6">
            
            <div className="space-y-1">
               <label className="text-sm font-bold text-slate-800">Session Timeout (minutes)</label>
               <input 
                  type="number"
                  min={5}
                  max={240}
                  value={securitySettings.sessionTimeout}
                  onChange={handleSecurityChange("sessionTimeout")}
                  onBlur={() => handleTextFieldSave("sessionTimeout")}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#000054]/50 focus:border-[#000054] transition-colors"
               />
               <p className="text-xs text-slate-500 font-medium">How long until inactive sessions are logged out</p>
            </div>

            <div className="space-y-1">
               <label className="text-sm font-bold text-slate-800">Password Expiry (days)</label>
               <input 
                  type="number"
                  min={30}
                  max={365}
                  value={securitySettings.passwordExpiry}
                  onChange={handleSecurityChange("passwordExpiry")}
                  onBlur={() => handleTextFieldSave("passwordExpiry")}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#000054]/50 focus:border-[#000054] transition-colors"
               />
               <p className="text-xs text-slate-500 font-medium">How often passwords must be changed</p>
            </div>

            <div className="space-y-1">
               <label className="text-sm font-bold text-slate-800">IP Whitelist</label>
               <textarea 
                  rows={3}
                  value={securitySettings.ipWhitelist}
                  onChange={handleSecurityChange("ipWhitelist")}
                  onBlur={() => handleTextFieldSave("ipWhitelist")}
                  placeholder="192.168.1.1&#10;10.0.0.1&#10;203.0.113.1"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#000054]/50 focus:border-[#000054] transition-colors resize-none font-mono text-sm"
               />
               <p className="text-xs text-slate-500 font-medium">Enter IP addresses, one per line. Leave empty to allow all IPs.</p>
            </div>

          </div>
        </div>
      </div>

      {/* Security Recommendations */}
      <div className="w-full">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
             <h3 className="text-lg font-bold text-[#000054]">Security Recommendations</h3>
          </div>
          <div className="p-6">
            <div className="flex flex-wrap gap-4">
               {!securitySettings.twoFactorEnabled && (
                  <div className="w-full sm:w-[calc(50%-8px)] md:w-[calc(33.33%-11px)] bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-3">
                     <MdWarning className="text-amber-500 shrink-0" size={24} />
                     <p className="text-sm font-medium text-amber-800">Enable Two-Factor Authentication</p>
                  </div>
               )}

               {securitySettings.sessionTimeout > 120 && (
                  <div className="w-full sm:w-[calc(50%-8px)] md:w-[calc(33.33%-11px)] bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-3">
                     <MdWarning className="text-amber-500 shrink-0" size={24} />
                     <p className="text-sm font-medium text-amber-800">Consider shorter session timeout</p>
                  </div>
               )}

               {securitySettings.passwordExpiry > 90 && (
                  <div className="w-full sm:w-[calc(50%-8px)] md:w-[calc(33.33%-11px)] bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-3">
                     <MdWarning className="text-amber-500 shrink-0" size={24} />
                     <p className="text-sm font-medium text-amber-800">Consider shorter password expiry</p>
                  </div>
               )}

               {securitySettings.twoFactorEnabled &&
                securitySettings.sessionTimeout <= 60 &&
                securitySettings.passwordExpiry <= 90 && (
                  <div className="w-full bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center gap-3">
                     <MdShield className="text-emerald-500 shrink-0" size={24} />
                     <p className="font-bold text-emerald-800">Your security settings look great! Keep up the good work.</p>
                  </div>
               )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="w-full">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
             <h3 className="text-lg font-bold text-[#000054]">Quick Actions</h3>
          </div>
          <div className="p-6">
            <div className="flex flex-wrap gap-3">
               <button 
                  onClick={() => onSuccess("Session management coming soon!")}
                  className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition-colors w-full sm:w-auto"
               >
                  {window.innerWidth < 640 ? "Active Sessions" : "View Active Sessions"}
               </button>
               <button 
                  onClick={() => onSuccess("Device management coming soon!")}
                  className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition-colors w-full sm:w-auto"
               >
                  {window.innerWidth < 640 ? "Trusted Devices" : "Manage Trusted Devices"}
               </button>
               <button 
                  onClick={() => onSuccess("Activity log coming soon!")}
                  className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition-colors w-full sm:w-auto"
               >
                  {window.innerWidth < 640 ? "Security Log" : "View Security Log"}
               </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default SecurityTab;
