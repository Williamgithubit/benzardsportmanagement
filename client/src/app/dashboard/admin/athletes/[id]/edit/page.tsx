import AdminAuthGuard from "@/components/auth/AdminAuthGuard";
import AthleteStepFormPage from "@/components/athletes/AthleteStepFormPage";

interface EditAthletePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditAthletePage({
  params,
}: EditAthletePageProps) {
  const { id } = await params;

  return (
    <AdminAuthGuard>
      <AthleteStepFormPage mode="edit" athleteId={id} />
    </AdminAuthGuard>
  );
}
