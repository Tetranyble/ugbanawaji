import type { Metadata } from "next";
import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { availabilityProfiles,availabilityTargetRoles,availabilityWorkModes } from "@/db/schema";
import { getPublicPortfolioData,getSitePage } from "@/lib/data";
import { actionTarget,itemValue,pageMetadata,sectionAction } from "@/lib/page-content";
import { getPublishedResumes } from "@/lib/platform-data";
import { PageHero } from "@/components/site/page-hero";
import { Card,CardContent,CardHeader,CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
export const dynamic="force-dynamic";
export async function generateMetadata():Promise<Metadata>{return pageMetadata(await getSitePage("hire"))}
export default async function HirePage(){const[data,resumes,page,[availabilityRow],targetRoleRows,workModeRows]=await Promise.all([getPublicPortfolioData(),getPublishedResumes().catch(()=>[]),getSitePage("hire"),db.select().from(availabilityProfiles).limit(1).catch(()=>[]),db.select().from(availabilityTargetRoles).orderBy(desc(availabilityTargetRoles.sortOrder)).catch(()=>[]),db.select().from(availabilityWorkModes).orderBy(desc(availabilityWorkModes.sortOrder)).catch(()=>[])]);if(!page)return null;const profile=data.profile;return <main className="section-space"><div className="container-shell flex flex-col gap-10">{page.sections.map(section=>{
  if(section.component==="PAGE_HERO")return <PageHero key={section.id} section={section}/>;
  if(section.component==="AVAILABILITY"){if(!availabilityRow?.visible)return null;return <Card key={section.id} className="border-primary/25"><CardContent className="p-6"><p className="text-sm font-bold text-primary">{availabilityRow.status}</p><div className="mt-3 flex flex-wrap gap-2">{targetRoleRows.map(item=><Badge key={item.id}>{item.label}</Badge>)}{workModeRows.map(item=><Badge key={item.id}>{item.label}</Badge>)}</div>{availabilityRow.relocation?<p className="mt-3 text-sm text-muted-foreground">{itemValue(section,"relocationPrefix")}: {availabilityRow.relocation}</p>:null}{availabilityRow.note?<p className="mt-2 text-sm text-muted-foreground">{availabilityRow.note}</p>:null}</CardContent></Card>}
  if(section.component==="FOCUS_AREAS"){const action=sectionAction(section,"work");return <Card key={section.id}><CardHeader><CardTitle>{section.title}</CardTitle></CardHeader><CardContent className="space-y-4">{data.focusAreas.slice(0,section.itemLimit??data.focusAreas.length).map(area=><div key={area.id}><p className="font-semibold">{area.title}</p><p className="mt-1 text-sm leading-6 text-muted-foreground">{area.description}</p></div>)}{action?<Button asChild className="mt-3"><Link href={action.href} {...actionTarget(action)}>{action.label}</Link></Button>:null}</CardContent></Card>}
  if(section.component==="SKILL_GROUPS"){const action=sectionAction(section,"contact");return <Card key={section.id}><CardHeader><CardTitle>{section.title}</CardTitle></CardHeader><CardContent className="space-y-5">{data.skillGroups.slice(0,section.itemLimit??data.skillGroups.length).map(group=><div key={group.id}><p className="text-xs font-bold uppercase tracking-[.12em] text-primary">{group.title}</p><div className="mt-2 flex flex-wrap gap-2">{group.items.map(item=><Badge key={item}>{item}</Badge>)}</div></div>)}{action?<Button asChild variant="secondary"><Link href={action.href||`mailto:${profile.email}`} {...actionTarget(action)}>{action.label}</Link></Button>:null}</CardContent></Card>}
  if(section.component==="RESUME_LIST")return <section key={section.id}><h2 className="text-2xl font-extrabold">{section.title}</h2>{section.description?<p className="mt-2 text-muted-foreground">{section.description}</p>:null}<div className="mt-5 grid gap-4 md:grid-cols-2">{resumes.slice(0,section.itemLimit??resumes.length).map(resume=><Card key={resume.id}><CardHeader><CardTitle>{resume.name}</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">{resume.summary||resume.targetRole}</p><Button asChild variant="outline" className="mt-4"><Link href={resume.fileUrl} target="_blank">{itemValue(section,"openLabel")}</Link></Button></CardContent></Card>)}</div></section>;
  if(section.component==="RICH_TEXT")return <section key={section.id}>{section.title?<h2 className="text-2xl font-extrabold">{section.title}</h2>:null}{section.body?<div className="prose-portfolio mt-5" dangerouslySetInnerHTML={{__html:section.body}}/>:null}</section>;
  return null;
})}</div></main>}
