"use client";
import React, { useState, useEffect } from "react";

// Import Admin Components
import UserManagement from "@/components/admin/UserManagement";
import AthleteManagement from "@/components/admin/AthleteManagement";
import EventManagement from "@/components/admin/EventManagement/EventManagement";
import Settings from "@/components/admin/Settings/Settings";
import Dashboard from "@/components/admin/Dashboard";
import Reports from "@/components/admin/Reports";
import ContactManagement from "@/components/admin/ContactManagement";
import BlogManagement from "@/components/admin/BlogManagement";
import BSMMediaLibrary from "@/components/admin/BSMMediaLibrary";
import AttendanceOverview from "@/components/admin/AttendanceOverview";
import AdminNotificationsPanel from "@/components/admin/AdminNotificationsPanel";
import AdminProfilePanel from "@/components/admin/AdminProfilePanel";

import AdminDashboardShell from "@/components/dashboard/AdminDashboardShell";
import { AdminTabId, isAdminTab } from "@/components/dashboard/admin-navigation";

export default function AdminDashboard() {
  const [tab, setTab] = useState<AdminTabId>(() => {
    if (typeof window === "undefined") {
      return "dashboard";
    }

    const initialHash = window.location.hash.replace("#", "");
    return isAdminTab(initialHash) ? initialHash : "dashboard";
  });
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [athleteDialogOpen, setAthleteDialogOpen] = useState(false);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [blogDialogOpen, setBlogDialogOpen] = useState(false);

  useEffect(() => {
    const syncFromHash = () => {
      const nextHash = window.location.hash.replace("#", "");

      if (isAdminTab(nextHash)) {
        setTab(nextHash);
      }
    };

    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);

    return () => {
      window.removeEventListener("hashchange", syncFromHash);
    };
  }, []);

  // Listen for custom event to change tab (from notifications)
  useEffect(() => {
    const handleTabChange = (event: CustomEvent) => {
      if (event.detail && isAdminTab(event.detail)) {
        setTab(event.detail);
      }
    };
    
    window.addEventListener("changeTab", handleTabChange as EventListener);
    
    return () => {
      window.removeEventListener("changeTab", handleTabChange as EventListener);
    };
  }, []);

  useEffect(() => {
    const nextUrl =
      tab === "dashboard" ? "/dashboard/admin" : `/dashboard/admin#${tab}`;

    window.history.replaceState(null, "", nextUrl);
  }, [tab]);

  const handleAddNew = (currentTab: string) => {
    switch (currentTab) {
      case "users":
        setUserDialogOpen(true);
        break;
      case "athletes":
        setAthleteDialogOpen(true);
        break;
      case "events":
        setEventDialogOpen(true);
        break;
      case "contacts":
        setContactDialogOpen(true);
        break;
      case "blog":
        setBlogDialogOpen(true);
        break;
      default:
        // Handled via the Layout's showToaster optionally, but for now we just log
        console.info(`Add new functionality coming soon for ${currentTab}!`);
    }
  };

  const canCreateFromHeader = ["athletes", "events", "blog", "users", "contacts"].includes(tab);

  return (
    <AdminDashboardShell
      activeTab={tab}
      onTabChange={setTab}
      onAddNew={canCreateFromHeader ? () => handleAddNew(tab) : undefined}
    >
      {tab === "dashboard" && <Dashboard />}
      {tab === "athletes" && (
        <AthleteManagement
          openDialog={athleteDialogOpen}
          onCloseDialog={() => setAthleteDialogOpen(false)}
        />
      )}
      {tab === "events" && (
        <EventManagement
          openDialog={eventDialogOpen}
          onCloseDialog={() => setEventDialogOpen(false)}
        />
      )}
      {tab === "blog" && (
        <BlogManagement
          openDialog={blogDialogOpen}
          onCloseDialog={() => setBlogDialogOpen(false)}
        />
      )}
      {tab === "media" && <BSMMediaLibrary />}
      {tab === "users" && (
        <UserManagement
          openDialog={userDialogOpen}
          onCloseDialog={() => setUserDialogOpen(false)}
        />
      )}
      {tab === "contacts" && (
        <ContactManagement
          openDialog={contactDialogOpen}
          onCloseDialog={() => setContactDialogOpen(false)}
        />
      )}
      {tab === "attendance" && <AttendanceOverview />}
      {tab === "reports" && <Reports />}
      {tab === "notifications" && <AdminNotificationsPanel />}
      {tab === "profile" && <AdminProfilePanel />}
      {tab === "settings" && <Settings />}
    </AdminDashboardShell>
  );
}
