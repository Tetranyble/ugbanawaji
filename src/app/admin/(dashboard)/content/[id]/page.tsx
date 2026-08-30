import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { contentEntries } from "@/db/schema";
import { deleteContentEntry, updateContentEntry } from "@/app/admin/actions";
import { ContentEntryEditor } from "@/components/admin/content-entry-editor";
export default async function EditContentPage({params}:{params:Promise<{id:string}>}){const {id}=await params;const [entry]=await db.select().from(contentEntries).where(eq(contentEntries.id,id)).limit(1);if(!entry)notFound();return <ContentEntryEditor entry={entry} action={updateContentEntry.bind(null,id)} deleteAction={deleteContentEntry.bind(null,id)}/>}
