import { notFound } from "next/navigation";
import { PageEditor } from "@/components/admin/page-editor";
import { getAdminSitePage } from "@/lib/data";

export const dynamic = "force-dynamic";
export default async function EditPageAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const page = await getAdminSitePage(id);
  if (!page) notFound();
  return <PageEditor page={page} />;
}
