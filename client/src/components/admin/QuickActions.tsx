import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  MdPersonAdd,
  MdOutlineFitnessCenter,
  MdEvent,
  MdSportsSoccer,
  MdNotifications,
  MdCheckCircle,
  MdContactMail,
  MdCreate,
  MdWarning,
  MdRefresh,
  MdError,
} from "react-icons/md";
import { Skeleton } from "@/components/ui/Skeleton";

interface PendingItem {
  id: string;
  type: "athlete" | "user" | "event" | "contact" | "training";
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  createdAt: Date;
}

interface SystemHealth {
  database: "healthy" | "warning" | "error";
  storage: "healthy" | "warning" | "error";
  email: "healthy" | "warning" | "error";
  backup: "healthy" | "warning" | "error";
  lastUpdated: Date;
}

interface QuickActionsProps {
  onAddUser?: () => void;
  onAddAthlete?: () => void;
  onAddEvent?: () => void;
  onAddBlog?: () => void;
  onAddProgram?: () => void;
  onAddAdmission?: () => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({
  onAddUser,
  onAddAthlete,
  onAddEvent,
  onAddBlog,
}) => {
  const router = useRouter();
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const navigateToAdminTab = (tab: string) => {
    if (window.location.pathname === "/dashboard/admin") {
      window.dispatchEvent(new CustomEvent("changeTab", { detail: tab }));
      window.history.replaceState(
        null,
        "",
        tab === "dashboard" ? "/dashboard/admin" : `/dashboard/admin#${tab}`
      );
      return;
    }

    router.push(tab === "dashboard" ? "/dashboard/admin" : `/dashboard/admin#${tab}`);
  };

  const loadPendingItems = async () => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const mockPendingItems: PendingItem[] = [
      {
        id: "1",
        type: "athlete",
        title: "New Athlete Registration",
        description: "Samuel Johnson - Forward from Paynesville",
        priority: "high",
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), 
      },
      {
        id: "2",
        type: "contact",
        title: "Partnership Inquiry",
        description: "Local Sports Club - Training Collaboration",
        priority: "high",
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000), 
      },
      {
        id: "3",
        type: "event",
        title: "Event Registration Full",
        description: "Youth Tournament - Waiting list active",
        priority: "medium",
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), 
      },
      {
        id: "4",
        type: "training",
        title: "Training Session Review",
        description: "Elite Development - Performance Assessment",
        priority: "low",
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), 
      },
    ];

    setPendingItems(mockPendingItems);
  };

  const loadSystemHealth = async () => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800));

    const mockSystemHealth: SystemHealth = {
      database: "healthy",
      storage: "warning",
      email: "healthy",
      backup: "healthy",
      lastUpdated: new Date(),
    };

    setSystemHealth(mockSystemHealth);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadPendingItems(), loadSystemHealth()]);
    setRefreshing(false);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([loadPendingItems(), loadSystemHealth()]);
      setLoading(false);
    };

    loadData();
  }, []);

  const getHealthIcon = (status: "healthy" | "warning" | "error") => {
    switch (status) {
      case "healthy":
        return <MdCheckCircle className="text-green-500" size={24} />;
      case "warning":
        return <MdWarning className="text-amber-500" size={24} />;
      case "error":
        return <MdError className="text-red-500" size={24} />;
    }
  };

  const getPriorityClasses = (priority: "high" | "medium" | "low") => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-700 border-red-200";
      case "medium":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "low":
        return "bg-green-100 text-green-700 border-green-200";
    }
  };

  const getTypeIcon = (type: PendingItem["type"]) => {
    switch (type) {
      case "athlete":
        return <MdOutlineFitnessCenter size={20} className="text-slate-500" />;
      case "user":
        return <MdPersonAdd size={20} className="text-slate-500" />;
      case "event":
        return <MdEvent size={20} className="text-slate-500" />;
      case "contact":
        return <MdContactMail size={20} className="text-slate-500" />;
      case "training":
        return <MdSportsSoccer size={20} className="text-slate-500" />;
      default:
        return <MdEvent size={20} className="text-slate-500" />;
    }
  };

  const quickActionButtons = [
    {
      label: "Add Athlete",
      icon: <MdOutlineFitnessCenter size={18} />,
      colors: "text-navy border-navy hover:bg-navy/10",
      onClick: onAddAthlete || (() => router.push("/dashboard/admin/athletes/new")),
    },
    {
      label: "Add Event",
      icon: <MdEvent size={18} />,
      colors: "text-primary border-primary hover:bg-primary/10",
      onClick: onAddEvent || (() => navigateToAdminTab("events")),
    },
    {
      label: "Add Blog Post",
      icon: <MdCreate size={18} />,
      colors: "text-green-600 border-green-600 hover:bg-green-50",
      onClick: onAddBlog || (() => navigateToAdminTab("blog")),
    },
    {
      label: "Add User",
      icon: <MdPersonAdd size={18} />,
      colors: "text-purple-600 border-purple-600 hover:bg-purple-50",
      onClick: onAddUser || (() => navigateToAdminTab("users")),
    },
    {
      label: "View Contacts",
      icon: <MdContactMail size={18} />,
      colors: "text-orange-500 border-orange-500 hover:bg-orange-50",
      onClick: () => navigateToAdminTab("contacts"),
    },
  ];

  if (loading) {
    return (
      <div className="glass-panel rounded-[32px] p-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <Skeleton className="h-7 w-40" />
          <Skeleton variant="circular" className="h-9 w-9" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-12 rounded-2xl" />
          ))}
        </div>
        <div className="mt-6 space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex gap-3 rounded-2xl border border-slate-100 bg-white/70 p-3">
              <Skeleton variant="circular" className="h-10 w-10" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-[32px] p-4 sm:p-5">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-bold text-navy">Quick Actions</h3>
          <p className="mt-1 text-sm text-slate-500">
            Jump into the areas that need attention first.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="text-slate-500 hover:text-navy hover:bg-slate-100 p-2 rounded-full transition-colors disabled:opacity-50"
          aria-label="Refresh actions"
        >
          <MdRefresh size={20} className={refreshing ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-3 mb-6">
        {quickActionButtons.map((action, index) => (
          <button
            key={index}
            onClick={action.onClick}
            className={`flex items-center justify-center gap-2 border rounded-md py-2 px-3 text-xs sm:text-sm font-medium transition-colors ${action.colors}`}
          >
            {action.icon}
            <span className="truncate">{action.label}</span>
          </button>
        ))}
      </div>

      <hr className="border-slate-100 mb-5" />

      {/* Pending Approvals */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <h4 className="text-base font-bold text-navy">Pending Approvals</h4>
          <div className="relative flex items-center justify-center">
            <MdNotifications size={20} className="text-slate-500" />
            {pendingItems.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {pendingItems.length}
              </span>
            )}
          </div>
        </div>

        {pendingItems.length > 0 ? (
          <div className="space-y-3">
            {pendingItems.slice(0, 3).map((item) => (
              <div key={item.id} className="flex gap-3 rounded-2xl border border-slate-100 bg-white/70 px-3 py-3 last:border-slate-100 items-start">
                <div className="mt-1 flex-shrink-0 bg-slate-100 p-1.5 rounded-full">
                  {getTypeIcon(item.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {item.title}
                    </p>
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${getPriorityClasses(item.priority)}`}>
                      {item.priority}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">
                    {item.description}
                  </p>
                </div>
                <button 
                  className="text-green-500 hover:text-green-600 hover:bg-green-50 p-1 rounded transition-colors flex-shrink-0 mt-1"
                  aria-label={`approve-${item.id}`}
                >
                  <MdCheckCircle size={20} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No pending approvals</p>
        )}
      </div>

      <hr className="border-slate-100 mb-5" />

      {/* System Health */}
      <div>
        <h4 className="text-base font-bold text-navy mb-3">System Health</h4>

        {systemHealth && (
          <div className="grid grid-cols-4 gap-2">
            <div className="border border-slate-100 bg-slate-50 rounded-lg py-2 flex flex-col items-center justify-center gap-1">
              {getHealthIcon(systemHealth.database)}
              <span className="text-[10px] text-slate-600 font-medium">Database</span>
            </div>
            <div className="border border-slate-100 bg-slate-50 rounded-lg py-2 flex flex-col items-center justify-center gap-1">
              {getHealthIcon(systemHealth.storage)}
              <span className="text-[10px] text-slate-600 font-medium">Storage</span>
            </div>
            <div className="border border-slate-100 bg-slate-50 rounded-lg py-2 flex flex-col items-center justify-center gap-1">
              {getHealthIcon(systemHealth.email)}
              <span className="text-[10px] text-slate-600 font-medium">Email</span>
            </div>
            <div className="border border-slate-100 bg-slate-50 rounded-lg py-2 flex flex-col items-center justify-center gap-1">
              {getHealthIcon(systemHealth.backup)}
              <span className="text-[10px] text-slate-600 font-medium">Backup</span>
            </div>
          </div>
        )}

        <p className="text-xs text-slate-400 mt-3 text-right">
          Last updated: {systemHealth?.lastUpdated.toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
};

export default QuickActions;
