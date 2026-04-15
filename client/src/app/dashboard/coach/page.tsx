"use client";

import dynamic from "next/dynamic";
import CoachAuthGuard from "@/components/auth/CoachAuthGuard";

const CoachDashboard = dynamic(() => import("./CoachDashboard"), {
  ssr: false,
});

export default function CoachPage() {
  return (
    <CoachAuthGuard>
      <CoachDashboard />
    </CoachAuthGuard>
  );
}
