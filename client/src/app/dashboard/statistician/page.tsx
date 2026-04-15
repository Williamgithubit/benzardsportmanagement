"use client";

import dynamic from "next/dynamic";
import StatisticianAuthGuard from "@/components/auth/StatisticianAuthGuard";

const StatisticianDashboard = dynamic(() => import("./StatisticianDashboard"), {
  ssr: false,
});

export default function StatisticianPage() {
  return (
    <StatisticianAuthGuard>
      <StatisticianDashboard />
    </StatisticianAuthGuard>
  );
}
