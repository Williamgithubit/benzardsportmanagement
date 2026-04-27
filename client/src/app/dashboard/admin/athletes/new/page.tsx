import AdminAuthGuard from "@/components/auth/AdminAuthGuard";
import AthleteStepFormPage from "@/components/athletes/AthleteStepFormPage";

export default function NewAthletePage() {
  return (
    <AdminAuthGuard>
      <AthleteStepFormPage mode="add" />
    </AdminAuthGuard>
  );
}
