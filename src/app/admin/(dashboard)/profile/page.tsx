import { updateProfile } from "@/app/admin/actions";
import { ProfileForm } from "@/components/admin/profile-form";
import { getPublicProfile } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ProfileAdminPage() {
  const profile = await getPublicProfile();
  return <ProfileForm profile={profile} action={updateProfile} />;
}
