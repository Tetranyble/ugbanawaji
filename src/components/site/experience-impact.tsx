"use client";
import { useMemo, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { PublicExperience } from "@/lib/portfolio-types";

export function ExperienceImpact({ experiences, allLabel, presentLabel }: { experiences: PublicExperience[]; allLabel: string; presentLabel: string }) {
  const areas = [allLabel, ...Array.from(new Set(experiences.flatMap((item) => item.impactAreas)))];
  const [active, setActive] = useState(allLabel);
  const rows = useMemo(() => active === allLabel ? experiences : experiences.filter((item) => item.impactAreas.includes(active)), [active, allLabel, experiences]);
  return <div>{areas.length > 1 ? <div className="mb-7 flex flex-wrap gap-2">{areas.map((area) => <Button key={area} type="button" size="sm" variant={active === area ? "default" : "outline"} onClick={() => setActive(area)}>{area}</Button>)}</div> : null}<div className="space-y-5">{rows.map((experience) => <Card key={experience.id}><CardContent className="grid gap-6 p-6 lg:grid-cols-[260px_1fr] lg:p-8"><div><p className="text-sm font-bold text-primary">{experience.startDate} — {experience.current ? presentLabel : experience.endDate}</p><h3 className="mt-2 text-xl font-bold">{experience.role}</h3><p className="mt-1 text-sm text-muted-foreground">{experience.company} · {experience.location}</p><div className="mt-3 flex flex-wrap gap-1">{experience.impactAreas.map((area) => <span key={area} className="rounded-full bg-muted px-2 py-1 text-[10px] font-semibold text-muted-foreground">{area}</span>)}</div></div><div><p className="leading-7 text-muted-foreground">{experience.summary}</p>{experience.highlights.length ? <ul className="mt-5 grid gap-3">{experience.highlights.map((highlight) => <li key={highlight} className="flex gap-3 text-sm leading-6 text-muted-foreground"><CheckCircle2 className="mt-1 size-4 shrink-0 text-primary" />{highlight}</li>)}</ul> : null}</div></CardContent></Card>)}</div></div>;
}
