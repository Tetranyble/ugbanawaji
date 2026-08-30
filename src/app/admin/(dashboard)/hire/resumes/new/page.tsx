import { createResumeVariant } from "@/app/admin/actions";
import { ResumeVariantEditor } from "@/components/admin/resume-variant-editor";

export default function NewResumeVariantPage() {
  return <ResumeVariantEditor action={createResumeVariant} />;
}
