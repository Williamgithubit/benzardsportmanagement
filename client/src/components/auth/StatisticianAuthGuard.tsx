"use client";

import RoleAuthGuard from "@/components/auth/RoleAuthGuard";

interface StatisticianAuthGuardProps {
  children: React.ReactNode;
}

export default function StatisticianAuthGuard({
  children,
}: StatisticianAuthGuardProps) {
  return (
    <RoleAuthGuard role="statistician" roleLabel="statistician">
      {children}
    </RoleAuthGuard>
  );
}
