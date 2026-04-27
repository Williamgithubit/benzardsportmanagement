"use client";

import AthleteDirectory from "@/components/athletes/AthleteDirectory";
import useUserRole from "@/hooks/useUserRole";

export default function AthleteManagement() {
  const userRole = useUserRole();

  return <AthleteDirectory userRole={userRole} />;
}
