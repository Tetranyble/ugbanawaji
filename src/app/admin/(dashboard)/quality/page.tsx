import { eq } from "drizzle-orm";
import { CheckCircle2, CircleAlert, FileCheck2, Gauge, ShieldCheck } from "lucide-react";
import { db } from "@/db";
import { posts, projects } from "@/db/schema";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type QualityIssue = {
  kind: "Post" | "Case study";
  title: string;
  message: string;
};

export default async function QualityPage() {
  const [publishedPosts, publishedProjects] = await Promise.all([
    db.select().from(posts).where(eq(posts.status, "PUBLISHED")).catch(() => []),
    db.select().from(projects).where(eq(projects.status, "PUBLISHED")).catch(() => []),
  ]);

  const issues: QualityIssue[] = [];

  for (const post of publishedPosts) {
    if (!post.seoDescription?.trim()) issues.push({ kind: "Post", title: post.title, message: "Missing SEO description" });
    if (!post.excerpt?.trim()) issues.push({ kind: "Post", title: post.title, message: "Missing excerpt" });
    if (!post.content?.trim()) issues.push({ kind: "Post", title: post.title, message: "Published without article content" });
  }

  for (const project of publishedProjects) {
    if (!project.problem?.trim()) issues.push({ kind: "Case study", title: project.title, message: "Missing problem statement" });
    if (!project.constraints?.trim()) issues.push({ kind: "Case study", title: project.title, message: "Missing constraints" });
    if (!project.tradeoffs?.trim()) issues.push({ kind: "Case study", title: project.title, message: "Missing trade-offs" });
    if (!project.reliabilitySecurity?.trim()) issues.push({ kind: "Case study", title: project.title, message: "Missing reliability/security section" });
    if (!project.lessonsLearned?.trim()) issues.push({ kind: "Case study", title: project.title, message: "Missing lessons learned" });
  }

  const guardrails = [
    "Keyboard-friendly navigation and native form controls",
    "Visible shared focus states and reduced-motion CSS",
    "Stable article heading anchors and generated table of contents",
    "Image alt text requested during WYSIWYG uploads",
    "Custom 404 and error recovery routes",
    "Privacy, responsible-disclosure and security.txt routes",
    "PWA caching excludes admin, API, previews and newsletter-token routes",
    "Draft and scheduled content remain outside public search and AI retrieval until public",
  ];

  const readiness = issues.length === 0 ? "Ready" : `${issues.length} issue${issues.length === 1 ? "" : "s"}`;

  return (
    <div className="max-w-7xl">
      <AdminPageHeader
        eyebrow="Release quality"
        title="Accessibility & publication readiness"
        description="A focused pre-flight view for content completeness and implementation guardrails. It complements—not replaces—browser-level accessibility, performance and security testing on the deployed build."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="shadow-none">
          <CardContent className="flex items-center justify-between gap-4 p-5">
            <div><p className="text-3xl font-extrabold">{publishedPosts.length}</p><p className="mt-1 text-sm font-semibold">Published articles</p></div>
            <div className="grid size-11 place-items-center rounded-xl bg-muted"><FileCheck2 className="size-4 text-primary" /></div>
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardContent className="flex items-center justify-between gap-4 p-5">
            <div><p className="text-3xl font-extrabold">{publishedProjects.length}</p><p className="mt-1 text-sm font-semibold">Published case studies</p></div>
            <div className="grid size-11 place-items-center rounded-xl bg-muted"><Gauge className="size-4 text-primary" /></div>
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardContent className="flex items-center justify-between gap-4 p-5">
            <div><p className="text-3xl font-extrabold">{readiness}</p><p className="mt-1 text-sm font-semibold">Content readiness</p></div>
            <div className="grid size-11 place-items-center rounded-xl bg-muted"><ShieldCheck className="size-4 text-primary" /></div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
        <Card className="shadow-none">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><CardTitle>Published-content checks</CardTitle><CardDescription className="mt-1">Only public content is evaluated here.</CardDescription></div>
              <Badge variant={issues.length ? "secondary" : "outline"}>{readiness}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {issues.length ? (
              <div className="divide-y divide-border rounded-xl border border-border">
                {issues.map((issue, index) => (
                  <div key={`${issue.kind}-${issue.title}-${issue.message}-${index}`} className="flex gap-3 p-4">
                    <CircleAlert className="mt-0.5 size-4 shrink-0 text-amber-500" />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2"><span className="font-semibold">{issue.title}</span><Badge variant="outline">{issue.kind}</Badge></div>
                      <p className="mt-1 text-sm text-muted-foreground">{issue.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex gap-3 rounded-xl border border-border bg-muted/25 p-5">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-500" />
                <div><p className="font-semibold">No obvious publication gaps detected</p><p className="mt-1 text-sm leading-6 text-muted-foreground">Published articles and case studies satisfy the structured checks currently enforced by the CMS.</p></div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader><CardTitle>Engineering guardrails</CardTitle><CardDescription>Implementation choices already present in the platform.</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            {guardrails.map((item) => <div key={item} className="flex gap-3 text-sm leading-6 text-muted-foreground"><CheckCircle2 className="mt-1 size-4 shrink-0 text-primary" /><span>{item}</span></div>)}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 rounded-xl border border-border bg-muted/20 p-5 text-sm leading-6 text-muted-foreground">
        Before production releases, run <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">npm run check</code> and browser-level checks such as Lighthouse/axe against the deployed site. This screen intentionally reports only checks the application can establish from its own data and implementation.
      </div>
    </div>
  );
}
