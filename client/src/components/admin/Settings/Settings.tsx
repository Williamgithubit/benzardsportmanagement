import React, { useState } from 'react';
import {
  MdAccountCircle,
  MdSecurity,
  MdNotifications,
  MdSettings,
  MdBusiness,
  MdRefresh,
} from 'react-icons/md';

// Import components
import ProfileTab from './ProfileTab';
import SecurityTab from './SecurityTab';
import toast, { Toaster } from 'react-hot-toast';

const Settings: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);

  const showSuccess = (message: string) => {
    toast.success(message);
  };

  const showError = (message: string) => {
    toast.error(message);
  };

  const handleRefresh = () => {
    // Refresh settings from localStorage or API
    window.location.reload();
  };

  const tabs = [
    { id: 0, label: 'Profile', icon: <MdAccountCircle size={24} />, disabled: false },
    { id: 1, label: 'Security', icon: <MdSecurity size={24} />, disabled: false },
    { id: 2, label: 'Notifications', icon: <MdNotifications size={24} />, disabled: true },
    { id: 3, label: 'System', icon: <MdSettings size={24} />, disabled: true },
    { id: 4, label: 'Organization', icon: <MdBusiness size={24} />, disabled: true },
  ];

  return (
    <div className="w-full mt-10">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#000054]">
          Settings
        </h2>
        <button
          onClick={handleRefresh}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border-2 border-[#000054] text-[#000054] hover:bg-[#000054] hover:text-white transition-colors font-bold w-full sm:w-auto"
        >
          <MdRefresh size={20} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Settings Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
        <div className="flex overflow-x-auto hide-scrollbar border-b border-slate-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && setTabValue(tab.id)}
              disabled={tab.disabled}
              className={`flex items-center gap-2 px-6 py-4 font-bold text-sm whitespace-nowrap border-b-2 transition-colors ${
                 tab.disabled ? 'opacity-50 cursor-not-allowed text-slate-400 border-transparent' :
                 tabValue === tab.id
                  ? 'border-[#E32845] text-[#E32845]'
                  : 'border-transparent text-[#000054] hover:text-red-500 hover:border-red-200'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Panels */}
      <div className="p-0 sm:p-2">
        <div className={tabValue === 0 ? "block" : "hidden"}>
          <ProfileTab onSuccess={showSuccess} onError={showError} />
        </div>

        <div className={tabValue === 1 ? "block" : "hidden"}>
          <SecurityTab onSuccess={showSuccess} onError={showError} />
        </div>

        <div className={tabValue === 2 ? "block" : "hidden"}>
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-xl font-bold text-slate-600 mb-2">Notifications Settings</h3>
            <p className="text-slate-500">Coming soon...</p>
          </div>
        </div>

        <div className={tabValue === 3 ? "block" : "hidden"}>
           <div className="text-center py-16 bg-white rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-xl font-bold text-slate-600 mb-2">System Settings</h3>
            <p className="text-slate-500">Coming soon...</p>
          </div>
        </div>

        <div className={tabValue === 4 ? "block" : "hidden"}>
           <div className="text-center py-16 bg-white rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-xl font-bold text-slate-600 mb-2">Organization Settings</h3>
            <p className="text-slate-500">Coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
