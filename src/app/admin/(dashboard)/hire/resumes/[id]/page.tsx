import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { resumeVariants } from "@/db/schema";
import { deleteResumeVariant, updateResumeVariant } from "@/app/admin/actions";
import { ResumeVariantEditor } from "@/components/admin/resume-variant-editor";

export default async function EditResumeVariantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [resume] = await db.select().from(resumeVariants).where(eq(resumeVariants.id, id)).limit(1);
  if (!resume) notFound();
  return <ResumeVariantEditor resume={resume} action={updateResumeVariant.bind(null, id)} deleteAction={deleteResumeVariant.bind(null, id)} />;
}
