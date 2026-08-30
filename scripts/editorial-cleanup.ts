import "@/lib/load-env";

import { eq } from "drizzle-orm";
import { db, pool } from "@/db";
import { resumeVariants, siteSettings } from "@/db/schema";
import { profile } from "@/content/profile";

const OLD_PROFILE_COPY = {
  intro:
    "I am a software engineering and technology leader with 8+ years of experience across banking, payments, enterprise platforms and cloud infrastructure. My work sits at the intersection of backend architecture, regulated financial systems, DevOps and applied AI.",
  contactIntro:
    "I am open to conversations around senior software engineering, platform and fintech infrastructure, technical leadership, applied AI, and selected product collaborations.",
} as const;

async function run() {
  const [setting] = await db.select().from(siteSettings).where(eq(siteSettings.key, "profile")).limit(1);

  if (setting) {
    const value = { ...setting.value } as Record<string, unknown>;
    let changed = false;

    if (value.intro === OLD_PROFILE_COPY.intro) {
      value.intro = profile.intro;
      changed = true;
    }

    if (value.contactIntro === OLD_PROFILE_COPY.contactIntro) {
      value.contactIntro = profile.contactIntro;
      changed = true;
    }

    if (changed) {
      await db.update(siteSettings).set({ value, updatedAt: new Date() }).where(eq(siteSettings.id, setting.id));
      console.log("Updated legacy default profile copy.");
    } else {
      console.log("Profile copy already uses custom or current wording; no profile fields were overwritten.");
    }
  }

  const [resume] = await db.select().from(resumeVariants).where(eq(resumeVariants.slug, "main-resume")).limit(1);
  if (resume?.targetRole === "Senior Software / Platform Engineering") {
    await db.update(resumeVariants).set({ targetRole: "Software / Platform Engineering", updatedAt: new Date() }).where(eq(resumeVariants.id, resume.id));
    console.log("Updated the generated default résumé target label.");
  }

  console.log("Editorial cleanup complete. Restart the app if cached public copy is still visible.");
}

run().finally(async () => {
  await pool.end();
});
