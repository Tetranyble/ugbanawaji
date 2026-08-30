import Link from "next/link";
import {
  ArrowRight,
  Blocks,
  Bot,
  Braces,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  CloudCog,
  Code2,
  Database,
  Download,
  ExternalLink,
  GitBranch,
  Mail,
  Network,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";
import { LinkedInIcon } from "@/components/site/brand-icons";
import { getPublicPortfolioData } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ContactForm } from "@/components/site/contact-form";
import { formatDate } from "@/lib/utils";
import { ExperienceImpact } from "@/components/site/experience-impact";

export const dynamic = "force-dynamic";

const specialtyIcons = [Building2, Network, CloudCog, Sparkles];

const engineeringPrinciples = [
  [ShieldCheck, "Design for failure", "Retries, idempotency, fault isolation, explicit failure states and safe recovery paths are part of the design — not production patches."],
  [Database, "Protect financial invariants", "Money movement and critical business state deserve clear ownership, auditability, transactional boundaries and tests around the things that must never drift."],
  [Workflow, "Make operations observable", "Structured logs, metrics, alerts and traceable state transitions turn production systems from black boxes into systems teams can operate confidently."],
  [GitBranch, "Prefer evolvable boundaries", "I use modular service boundaries and integration contracts that let systems change incrementally without forcing unnecessary rewrites."],
] as const;

export default async function HomePage() {
  const data = await getPublicPortfolioData();
  const p = data.profile;
  const currentlyBuilding = data.projects.filter((project) => ["ACTIVE_DEVELOPMENT", "RESEARCH"].includes(project.lifecycleStatus ?? ""));

  return (
    <main>
      <section className="relative overflow-hidden border-b border-border grid-noise">
        <div className="gradient-orb pointer-events-none absolute -right-32 top-16 size-[34rem] rounded-full" />
        <div className="container-shell grid min-h-[760px] items-center gap-14 py-24 lg:grid-cols-[1.15fr_.85fr]">
          <div className="relative z-10">
            <p className="section-kicker mb-5">{String(p.eyebrow)}</p>
            <h1 className="max-w-4xl text-balance text-5xl font-extrabold leading-[1.02] tracking-[-.055em] sm:text-6xl lg:text-7xl">
              {String(p.headline)}
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-muted-foreground">{String(p.intro)}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg"><Link href="#work">View selected work <ArrowRight className="size-4" /></Link></Button>
              <Button asChild size="lg" variant="secondary"><Link href={String(p.resume)} target="_blank">Download CV <Download className="size-4" /></Link></Button>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-5 text-sm text-muted-foreground">
              <Link href={String(p.linkedin)} target="_blank" className="inline-flex items-center gap-2 hover:text-primary"><LinkedInIcon className="size-4" /> LinkedIn</Link>
              <Link href={`mailto:${String(p.email)}`} className="inline-flex items-center gap-2 hover:text-primary"><Mail className="size-4" /> {String(p.email)}</Link>
              <span>{String(p.location)}</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-neuro">
              <div className="relative aspect-[1.05/1] overflow-hidden bg-muted sm:aspect-[1.12/1]">
                <img
                  src={String(p.portrait)}
                  alt={`Portrait of ${String(p.displayName)}`}
                  width={640}
                  height={610}
                  loading="eager"
                  fetchPriority="high"
                  className="absolute inset-0 h-full w-full object-cover object-[50%_35%]"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent px-6 pb-6 pt-20 text-white sm:px-7">
                  <p className="text-2xl font-extrabold tracking-tight">{String(p.displayName)}</p>
                  <p className="mt-1 text-sm font-medium text-white/80">{String(p.eyebrow)}</p>
                </div>
              </div>
              <div className="p-5 sm:p-7">
                <div className="mb-5 flex items-center justify-between border-b border-border pb-4">
                  <div className="flex gap-2"><span className="size-2.5 rounded-full bg-primary" /><span className="size-2.5 rounded-full bg-amber-400" /><span className="size-2.5 rounded-full bg-emerald-500" /></div>
                  <span className="font-mono text-xs text-muted-foreground">engineering.snapshot</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {["Java / Spring Boot", "Financial systems", "AWS / Kubernetes", "Applied AI"].map((item) => (
                    <div key={item} className="rounded-xl border border-border bg-background/45 px-3 py-3 font-medium text-muted-foreground">{item}</div>
                  ))}
                </div>
                <div className="mt-5 rounded-2xl border border-border bg-background/55 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[.14em] text-primary">Current focus</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{String(p.currentFocus)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border py-10">
        <div className="container-shell grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {(p.metrics as Array<{ value: string; label: string }>).map((metric) => (
            <div key={metric.label} className="rounded-2xl border border-border/70 bg-card p-5 shadow-neuro">
              <div className="text-3xl font-extrabold tracking-tight text-primary">{metric.value}</div>
              <p className="mt-2 text-sm leading-5 text-muted-foreground">{metric.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="expertise" className="section-space scroll-mt-20">
        <div className="container-shell">
          <p className="section-kicker">What I work on</p>
          <div className="mt-3 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <h2 className="section-title max-w-3xl text-balance">Engineering across the layers that make critical systems dependable.</h2>
            <p className="max-w-xl text-base leading-7 text-muted-foreground">My work often sits where application architecture meets real operational constraints: transactions, integrations, reliability, infrastructure, security and teams that need to ship safely.</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {(p.specialties as Array<{ title: string; description: string; tags: string[] }>).map((item, index) => {
              const Icon = specialtyIcons[index] ?? Blocks;
              return (
                <Card key={item.title} className="group transition-transform hover:-translate-y-1">
                  <CardHeader>
                    <div className="mb-5 grid size-12 place-items-center rounded-xl bg-muted text-primary"><Icon className="size-5" /></div>
                    <CardTitle>{item.title}</CardTitle>
                    <CardDescription className="text-[15px]">{item.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2">{item.tags.map((tag) => <Badge key={tag}>{tag}</Badge>)}</CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section id="work" className="section-space scroll-mt-20 border-y border-border bg-muted/20">
        <div className="container-shell">
          <p className="section-kicker">Selected work</p>
          <h2 className="section-title mt-3 max-w-3xl text-balance">Case studies that show the systems thinking behind the code.</h2>
          <p className="mt-5 max-w-3xl leading-7 text-muted-foreground">Some production systems are private. These case studies focus on the engineering problem, architecture, constraints and measurable outcome without exposing confidential implementation details.</p>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {data.projects.slice(0, 3).map((project) => (
              <Card key={project.id} className="flex h-full flex-col overflow-hidden transition-transform hover:-translate-y-1">
                <div className="h-1 bg-primary" />
                <CardHeader className="flex-1">
                  <p className="text-xs font-bold uppercase tracking-[.12em] text-primary">{project.kind}</p>
                  <CardTitle className="mt-2 text-2xl">{project.title}</CardTitle>
                  <CardDescription className="mt-3 text-[15px]">{project.summary}</CardDescription>
                  <div className="mt-5 flex flex-wrap gap-2">{(project.techStack ?? []).slice(0, 5).map((tech: string) => <Badge key={tech}>{tech}</Badge>)}</div>
                </CardHeader>
                <CardContent>
                  <div className="mb-5 grid grid-cols-2 gap-3">
                    {(project.metrics ?? []).slice(0, 2).map((metric) => (
                      <div key={metric.label} className="rounded-xl bg-muted p-3"><div className="font-bold text-foreground">{metric.value}</div><div className="mt-1 text-xs text-muted-foreground">{metric.label}</div></div>
                    ))}
                  </div>
                  <Button asChild variant="outline" className="w-full"><Link href={`/work/${project.slug}`}>Read case study <ArrowRight className="size-4" /></Link></Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="section-space">
        <div className="container-shell">
          <div className="grid gap-14 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
            <div className="lg:sticky lg:top-28">
              <p className="section-kicker">Engineering approach</p>
              <h2 className="section-title mt-3 text-balance">The habits I bring to production systems.</h2>
              <p className="mt-5 leading-7 text-muted-foreground">Good engineering is more than choosing frameworks. It means making trade-offs visible, protecting invariants, leaving systems easier to operate and helping a team reason clearly about what happens when things go wrong.</p>
            </div>
            <div className="space-y-5">
              {engineeringPrinciples.map(([Icon, title, copy]) => (
                <Card key={title}>
                  <CardContent className="grid gap-4 p-6 sm:grid-cols-[48px_1fr]">
                    <div className="grid size-12 place-items-center rounded-xl bg-muted text-primary"><Icon className="size-5" /></div>
                    <div><h3 className="text-lg font-bold">{title}</h3><p className="mt-2 leading-7 text-muted-foreground">{copy}</p></div>
                  </CardContent>
                </Card>
              ))}
              <Button asChild variant="outline"><Link href="/principles">How I engineer systems <ArrowRight className="size-4" /></Link></Button>
            </div>
          </div>
        </div>
      </section>

      {currentlyBuilding.length ? <section className="section-space"><div className="container-shell"><p className="section-kicker">Currently building</p><h2 className="section-title mt-3 max-w-3xl">Projects and systems that are actively taking shape.</h2><div className="mt-8 grid gap-5 lg:grid-cols-2">{currentlyBuilding.slice(0,4).map((project)=><Card key={project.id}><CardHeader><div className="flex items-center gap-2"><Badge>{String(project.lifecycleStatus).replaceAll("_"," ")}</Badge><span className="text-xs text-muted-foreground">{project.kind}</span></div><CardTitle className="mt-3 text-2xl">{project.title}</CardTitle><CardDescription>{project.summary}</CardDescription></CardHeader><CardContent><Button asChild variant="outline"><Link href={`/work/${project.slug}`}>See current direction <ArrowRight className="size-4"/></Link></Button></CardContent></Card>)}</div></div></section> : null}

      <section id="experience" className="section-space scroll-mt-20 border-y border-border bg-muted/20">
        <div className="container-shell">
          <p className="section-kicker">Experience</p>
          <h2 className="section-title mt-3 max-w-3xl">From hands-on backend engineering to technology leadership.</h2>
          <div className="mt-12"><ExperienceImpact experiences={data.experiences} /></div>
        </div>
      </section>

      <section id="about" className="section-space scroll-mt-20">
        <div className="container-shell grid gap-12 lg:grid-cols-[1.15fr_.85fr] lg:items-start">
          <div>
            <p className="section-kicker">About</p>
            <h2 className="section-title mt-3 text-balance">An engineer shaped by both systems and the environments they operate in.</h2>
            <div className="mt-6 max-w-3xl space-y-5 text-base leading-8 text-muted-foreground">
              {(p.about as string[]).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
          </div>
          <Card>
            <CardHeader><CardTitle>Background</CardTitle><CardDescription>Education, certification and the stack I reach for most often.</CardDescription></CardHeader>
            <CardContent className="space-y-6">
              <div><p className="text-xs font-bold uppercase tracking-[.12em] text-primary">Education</p><p className="mt-2 font-semibold">{p.education.degree}</p><p className="text-sm text-muted-foreground">{p.education.school} · {p.education.year}</p></div>
              <div><p className="text-xs font-bold uppercase tracking-[.12em] text-primary">Certification</p><p className="mt-2 font-semibold">{p.education.certification}</p></div>
              <div><p className="text-xs font-bold uppercase tracking-[.12em] text-primary">Working stack</p><div className="mt-3 flex flex-wrap gap-2">{(p.stack as string[]).map((item) => <Badge key={item}>{item}</Badge>)}</div></div>
              <Button asChild variant="secondary" className="w-full"><Link href={String(p.resume)} target="_blank">Full résumé <ExternalLink className="size-4" /></Link></Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <section id="writing" className="section-space border-y border-border bg-muted/20">
        <div className="container-shell">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="section-kicker">Technical writing</p><h2 className="section-title mt-3">Notes from building and operating systems.</h2></div>
            <Button asChild variant="outline"><Link href="/blog">All writing <ArrowRight className="size-4" /></Link></Button>
          </div>
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {data.posts.length ? data.posts.map((post) => (
              <Card key={post.id} className="transition-transform hover:-translate-y-1">
                <CardHeader><div className="flex items-center justify-between text-xs text-muted-foreground"><span>{formatDate(post.publishedAt)}</span><span>{post.readingMinutes} min read</span></div><CardTitle className="mt-3"><Link href={`/blog/${post.slug}`} className="hover:text-primary">{post.title}</Link></CardTitle><CardDescription>{post.excerpt}</CardDescription></CardHeader>
                <CardContent className="flex flex-wrap gap-2">{(post.tags ?? []).slice(0, 4).map((tag: string) => <Badge key={tag}>{tag}</Badge>)}</CardContent>
              </Card>
            )) : (
              <Card className="lg:col-span-3"><CardContent className="flex flex-col items-start gap-4 p-8"><Braces className="size-7 text-primary" /><div><h3 className="text-xl font-bold">Writing workspace is ready.</h3><p className="mt-2 max-w-2xl leading-7 text-muted-foreground">The CMS includes draft and publish workflows for technical articles. After the database seed runs, starter drafts on financial integrations, idempotency and auditable AI are available in the admin area to edit and publish.</p></div><Button asChild variant="outline"><Link href="/blog">Open blog</Link></Button></CardContent></Card>
            )}
          </div>
        </div>
      </section>

      <section className="section-space border-y border-border bg-muted/20">
        <div className="container-shell">
          <Card className="overflow-hidden">
            <CardContent className="grid gap-8 p-8 sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl bg-muted text-primary"><Bot className="size-5" /></span><p className="section-kicker">Applied AI in practice</p></div>
                <h2 className="mt-4 text-3xl font-extrabold tracking-tight">Ask Ugbanawaji about my engineering work.</h2>
                <p className="mt-4 max-w-3xl leading-7 text-muted-foreground">The assistant is grounded only in published case studies, experience, principles and technical writing. Answers link back to supporting evidence instead of inventing claims.</p>
              </div>
              <Button asChild size="lg"><Link href="/ask">Ask about my work <ArrowRight className="size-4" /></Link></Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <section id="contact" className="section-space scroll-mt-20">
        <div className="container-shell grid gap-10 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <p className="section-kicker">Contact</p>
            <h2 className="section-title mt-3 text-balance">Let&apos;s talk about systems worth building well.</h2>
            <p className="mt-5 max-w-xl leading-7 text-muted-foreground">{String(p.contactIntro)}</p>
            <div className="mt-7 space-y-3 text-sm text-muted-foreground"><p><strong className="text-foreground">Email:</strong> {String(p.email)}</p><p><strong className="text-foreground">Location:</strong> {String(p.location)}</p></div>
          </div>
          <Card><CardContent className="p-6 sm:p-8"><ContactForm /></CardContent></Card>
        </div>
      </section>
    </main>
  );
}
