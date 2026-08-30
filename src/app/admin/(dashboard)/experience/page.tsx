import { desc } from "drizzle-orm";
import { db } from "@/db";
import { experiences } from "@/db/schema";
import { createExperience, deleteExperience, updateExperience } from "@/app/admin/actions";
import { ExperienceForm } from "@/components/admin/experience-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
export default async function ExperienceAdminPage(){const items=await db.select().from(experiences).orderBy(desc(experiences.sortOrder));return <div className="max-w-5xl"><p className="section-kicker">Career</p><h1 className="mt-2 text-3xl font-extrabold">Experience</h1><p className="mt-2 text-muted-foreground">Control the timeline and achievement bullets shown on the homepage.</p><Card className="mt-8"><CardHeader><CardTitle>Add experience</CardTitle></CardHeader><CardContent><ExperienceForm action={createExperience} compact/></CardContent></Card><div className="mt-8 space-y-6">{items.map(item=><Card key={item.id}><CardHeader><CardTitle>{item.role} · {item.company}</CardTitle></CardHeader><CardContent><ExperienceForm value={item} action={updateExperience.bind(null,item.id)} deleteAction={deleteExperience.bind(null,item.id)} compact/></CardContent></Card>)}</div></div>}
