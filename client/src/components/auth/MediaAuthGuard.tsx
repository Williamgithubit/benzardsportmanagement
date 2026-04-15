"use client";

import RoleAuthGuard from "@/components/auth/RoleAuthGuard";

interface MediaAuthGuardProps {
  children: React.ReactNode;
}

export default function MediaAuthGuard({ children }: MediaAuthGuardProps) {
  return (
    <RoleAuthGuard role="media" roleLabel="media">
      {children}
    </RoleAuthGuard>
  );
}
