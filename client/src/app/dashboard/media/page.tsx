"use client";

import dynamic from "next/dynamic";
import MediaAuthGuard from "@/components/auth/MediaAuthGuard";

const MediaDashboard = dynamic(() => import("./MediaDashboard"), {
  ssr: false,
});

export default function MediaPage() {
  return (
    <MediaAuthGuard>
      <MediaDashboard />
    </MediaAuthGuard>
  );
}
