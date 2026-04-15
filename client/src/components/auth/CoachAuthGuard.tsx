"use client";

import RoleAuthGuard from "@/components/auth/RoleAuthGuard";

interface CoachAuthGuardProps {
  children: React.ReactNode;
}

export default function CoachAuthGuard({ children }: CoachAuthGuardProps) {
  return (
    <RoleAuthGuard role="coach" roleLabel="coach">
      {children}
    </RoleAuthGuard>
  );
}
