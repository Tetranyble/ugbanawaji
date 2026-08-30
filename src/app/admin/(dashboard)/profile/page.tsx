import { eq } from "drizzle-orm";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { profile as defaults } from "@/content/profile";
import { updateProfile } from "@/app/admin/actions";
import { ProfileForm } from "@/components/admin/profile-form";

export default async function ProfileAdminPage() {
  const [setting] = await db.select().from(siteSettings).where(eq(siteSettings.key, "profile")).limit(1);
  const profile = { ...defaults, ...(setting?.value ?? {}) } as typeof defaults;
  return <ProfileForm profile={profile} action={updateProfile} />;
}
