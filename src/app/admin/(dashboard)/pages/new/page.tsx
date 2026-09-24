import { createSitePage } from "@/app/admin/actions";
import { NewPageForm } from "@/components/admin/page-editor";
export default function NewPageAdminPage() { return <NewPageForm action={createSitePage} />; }
