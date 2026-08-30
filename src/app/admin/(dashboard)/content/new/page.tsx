import { createContentEntry } from "@/app/admin/actions";
import { ContentEntryEditor } from "@/components/admin/content-entry-editor";
export default function NewContentPage(){return <ContentEntryEditor action={createContentEntry}/>}
