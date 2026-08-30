import "@/lib/load-env";
import { randomUUID } from "crypto";
import { hash } from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { db, pool } from "@/db";
import { authAccounts, contentEntries, experiences, postTagAssignments, posts, projects, resumeVariants, siteSettings, users } from "@/db/schema";
import { fallbackExperiences, fallbackProjects, profile } from "@/content/profile";
import { estimateReadingMinutes } from "@/lib/utils";
import { syncPostTaxonomy } from "@/lib/taxonomy";
import { env } from "@/lib/env";

const starterPosts = [
  {
    title: "Designing Financial Integrations That Fail Safely",
    slug: "designing-financial-integrations-that-fail-safely",
    excerpt: "A practical framework for retries, idempotency, reconciliation and observable failure states when an external financial system becomes part of your transaction path.",
    categories: ["Fintech Infrastructure"],
    tags: ["Fintech", "Reliability", "Distributed Systems", "Integrations"],
    status: "DRAFT" as const,
    content: `# Designing Financial Integrations That Fail Safely

A successful API call is not the same thing as a successful financial transaction. Once your system depends on a core-banking provider, payment processor, identity service or another external financial system, you have to design for ambiguity.

## Start with the state machine

Before choosing retry policies, make transaction states explicit. A request can be accepted locally while the provider is still processing it. A timeout can happen after the provider has committed the transaction. A reversal can arrive after the user has already seen a success state.

The important question is not \"did the HTTP request return 200?\" It is \"what do we know about the financial state, and what evidence lets us move it safely to the next state?\"

## Idempotency is a business invariant

Every operation that can be retried needs a stable business identifier. The same command should not create a second debit because a client retried after a timeout or because a worker was restarted.

I prefer to persist the intent before making the external call, use an idempotency key that survives retries, and record the provider reference separately from the internal transaction reference.

## Treat timeouts as unknown, not failed

A timeout tells you that your system stopped waiting. It does not prove that the provider did nothing. Marking every timeout as a hard failure is one of the easiest ways to create duplicate financial effects.

A safer flow is to move the transaction into a pending or unknown state, then requery or reconcile using the provider's reference and your own idempotency key.

## Build reconciliation from day one

Reconciliation should not be the emergency script written after the first incident. Store enough information to compare internal state with provider state, make the process repeatable, and keep a clear audit trail of corrections.

Reliable integrations are less about optimistic happy paths and more about making uncertainty explicit, recoverable and observable.
`,
  },
  {
    title: "Idempotency Is More Than a Header",
    slug: "idempotency-is-more-than-a-header",
    excerpt: "Why idempotency in payment and banking systems has to be enforced by storage, state transitions and business invariants — not just an HTTP header.",
    categories: ["Backend Engineering"],
    tags: ["Backend", "Payments", "Architecture", "API Design"],
    status: "DRAFT" as const,
    content: `# Idempotency Is More Than a Header

It is common to describe idempotency as adding an \`Idempotency-Key\` header to an API. The header is useful, but the real guarantee lives deeper in the system.

## The key has to map to durable state

If a process crashes after performing a debit but before writing the response, a retry must be able to discover the original operation. That means the idempotency key needs a durable relationship with the transaction or command it represents.

## Define what \"same request\" means

Two requests with the same idempotency key but different amounts should not silently share a result. Persist a request fingerprint or the fields that define the business command and reject conflicting reuse.

## Make concurrency boring

Two instances can receive the same request at nearly the same time. A unique database constraint or another atomic ownership mechanism should decide which one creates the operation. Application-level \"check then insert\" logic alone is vulnerable to races.

## Preserve the first terminal result

Once an idempotent operation reaches a terminal state, later retries should return the same business outcome instead of re-running side effects.

The goal is not merely to make an endpoint look idempotent. The goal is to make duplicate delivery unable to violate the underlying business invariant.
`,
  },
  {
    title: "From Rules to Auditable AI in Financial Workflows",
    slug: "from-rules-to-auditable-ai-in-financial-workflows",
    excerpt: "A product and architecture perspective on introducing AI into financial decisions without giving up traceability, controls or systems of record.",
    categories: ["Applied AI"],
    tags: ["Applied AI", "Fintech", "Decision Systems", "Architecture"],
    status: "DRAFT" as const,
    content: `# From Rules to Auditable AI in Financial Workflows

Financial institutions already make thousands of decisions through policies, thresholds, manual reviews and operational playbooks. AI can improve some of those workflows, but the useful question is not simply where to add a model.

The harder question is how to introduce adaptive decision support without losing the ability to explain what happened, who or what acted, and which data influenced the outcome.

## Keep systems of record authoritative

An AI layer should not require a bank to replace its core banking, ledger or payment infrastructure. It should integrate with those systems through explicit contracts and treat them as authoritative sources for financial state.

## Separate recommendation from action

A decision engine can produce an assessment. An agent can propose an action. The workflow should still define which actions are automatic, which need approval, and which are prohibited.

## Make every decision reconstructable

For critical workflows, store the inputs, policy version, model or agent version, decision result, confidence or rationale where available, approvals and final action. Auditability is a product feature, not only a compliance requirement.

## Use deterministic controls around probabilistic components

Models can be probabilistic. Financial invariants should not be. Limits, permissions, ledger rules and irreversible actions need deterministic enforcement around AI-assisted reasoning.

This is the direction behind the work I am doing with Credense: decision infrastructure that helps institutions introduce AI into operational workflows while keeping the surrounding controls explicit and reviewable.
`,
  },
];



const starterContent = [
  { type:"PRINCIPLE" as const, title:"Design for failure", slug:"design-for-failure", summary:"Retries, idempotency, fault isolation, explicit failure states and recovery paths belong in the design, not in incident patches.", status:"PUBLISHED" as const, featured:true, sortOrder:100, content:"<p>I assume dependencies will become slow, unavailable or ambiguous. Critical workflows should make uncertainty explicit, preserve enough evidence to recover safely, and distinguish retryable failures from terminal business outcomes.</p>" },
  { type:"PRINCIPLE" as const, title:"Protect financial invariants", slug:"protect-financial-invariants", summary:"Money movement deserves clear ownership, auditability, transactional boundaries and tests around the things that must never drift.", status:"PUBLISHED" as const, featured:true, sortOrder:90, content:"<p>Financial correctness is a domain property. Ledger rules, permissions, limits and state transitions should be deterministic even when surrounding integrations or AI-assisted decisions are probabilistic.</p>" },
  { type:"PRINCIPLE" as const, title:"Make operations observable", slug:"make-operations-observable", summary:"Structured logs, metrics, alerts and traceable state transitions make systems operable under pressure.", status:"PUBLISHED" as const, featured:true, sortOrder:80, content:"<p>Observability is part of the product surface for engineers. I want a production issue to leave enough evidence to reconstruct what happened, identify ownership and choose a safe recovery action.</p>" },
  { type:"PRINCIPLE" as const, title:"AI reasons; deterministic services decide", slug:"ai-reasons-deterministic-services-decide", summary:"Use AI for interpretation and reasoning, while keeping permissions, invariants and irreversible actions behind explicit deterministic controls.", status:"PUBLISHED" as const, featured:true, sortOrder:70, content:"<p>AI can interpret evidence and propose actions. Critical business rules, access control, financial invariants and irreversible side effects should still be enforced by deterministic services that are testable and auditable.</p>" },
  { type:"ADR" as const, title:"Why systems of record remain canonical", slug:"systems-of-record-remain-canonical", summary:"AI and search indexes are derived views; authoritative business state remains in the transactional system designed to own it.", status:"DRAFT" as const, featured:false, sortOrder:30, content:"<p>This decision record is a starter draft. Expand the context, alternatives, consequences and operational implications before publishing.</p>" },
];

const OLD_DEFAULT_COPY = {
  intro: "I am a software engineering and technology leader with 8+ years of experience across banking, payments, enterprise platforms and cloud infrastructure. My work sits at the intersection of backend architecture, regulated financial systems, DevOps and applied AI.",
  contactIntro: "I am open to conversations around senior software engineering, platform and fintech infrastructure, technical leadership, applied AI, and selected product collaborations.",
} as const;

function refreshKnownDefaultProfileCopy(value: Record<string, unknown>) {
  const next = { ...value };
  if (next.intro === OLD_DEFAULT_COPY.intro) next.intro = profile.intro;
  if (next.contactIntro === OLD_DEFAULT_COPY.contactIntro) next.contactIntro = profile.contactIntro;
  return next;
}

async function seed() {
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME ?? "Leonard Ekenekiso";

  if (!adminEmail || !adminPassword || adminPassword.length < 12) {
    throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD (minimum 12 characters) before running db:seed");
  }

  const now = new Date();
  const passwordHash = await hash(adminPassword, Math.min(15, Math.max(10, env.bcryptRounds)));
  const [existingUser] = await db.select().from(users).where(eq(users.email, adminEmail)).limit(1);
  const userId = existingUser?.id ?? randomUUID();

  if (existingUser) {
    await db.update(users).set({ name: adminName, emailVerified: true, updatedAt: now }).where(eq(users.id, userId));
  } else {
    await db.insert(users).values({ id: userId, name: adminName, email: adminEmail, emailVerified: true, role: "ADMIN", createdAt: now, updatedAt: now });
  }

  const [credentialAccount] = await db.select().from(authAccounts).where(and(eq(authAccounts.issuer, "local:credential"), eq(authAccounts.accountId, userId))).limit(1);
  if (credentialAccount) {
    await db.update(authAccounts).set({ issuer: "local:credential", providerId: "credential", password: passwordHash, updatedAt: now }).where(eq(authAccounts.id, credentialAccount.id));
  } else {
    await db.insert(authAccounts).values({
      id: randomUUID(),
      userId,
      issuer: "local:credential",
      accountId: userId,
      providerId: "credential",
      password: passwordHash,
      createdAt: now,
      updatedAt: now,
    });
  }

  const [existingProfile] = await db.select().from(siteSettings).where(eq(siteSettings.key, "profile")).limit(1);
  if (!existingProfile) {
    await db.insert(siteSettings).values({ id: randomUUID(), key: "profile", value: profile as unknown as Record<string, unknown>, updatedAt: now });
  } else {
    await db.update(siteSettings).set({
      value: { ...profile, ...refreshKnownDefaultProfileCopy(existingProfile.value) } as unknown as Record<string, unknown>,
      updatedAt: now,
    }).where(eq(siteSettings.id, existingProfile.id));
  }

  const [anyExperience] = await db.select({ id: experiences.id }).from(experiences).limit(1);
  if (!anyExperience) {
    await db.insert(experiences).values(fallbackExperiences.map((item) => ({ ...item, id: randomUUID(), createdAt: now, updatedAt: now })));
  }

  for (const item of fallbackProjects) {
    const [existing] = await db.select().from(projects).where(eq(projects.slug, item.slug)).limit(1);
    if (!existing) {
      await db.insert(projects).values({ ...item, id: randomUUID(), createdAt: now, updatedAt: now });
    } else {
      const backfill = {
        problem: existing.problem || item.problem,
        constraints: existing.constraints || item.constraints,
        challenge: existing.challenge || item.challenge,
        solution: existing.solution || item.solution,
        architecture: existing.architecture || item.architecture,
        decisions: existing.decisions || item.decisions,
        tradeoffs: existing.tradeoffs || item.tradeoffs,
        implementation: existing.implementation || item.implementation,
        reliabilitySecurity: existing.reliabilitySecurity || item.reliabilitySecurity,
        impact: existing.impact || item.impact,
        lessonsLearned: existing.lessonsLearned || item.lessonsLearned,
        whatDifferently: existing.whatDifferently || item.whatDifferently,
        confidentialityNote: existing.confidentialityNote || item.confidentialityNote,
        diagrams: existing.diagrams?.length ? existing.diagrams : item.diagrams,
        codeSamples: existing.codeSamples?.length ? existing.codeSamples : item.codeSamples,
        updatedAt: now,
      };
      await db.update(projects).set(backfill).where(eq(projects.id, existing.id));
    }
  }


  for (const item of starterContent) {
    const [existing] = await db.select().from(contentEntries).where(eq(contentEntries.slug, item.slug)).limit(1);
    if (!existing) await db.insert(contentEntries).values({ id: randomUUID(), ...item, data: {}, publishedAt: item.status === "PUBLISHED" ? now : null, createdAt: now, updatedAt: now });
  }

  const [existingResume] = await db.select().from(resumeVariants).where(eq(resumeVariants.slug, "main-resume")).limit(1);
  if (!existingResume && profile.resume) {
    await db.insert(resumeVariants).values({ id: randomUUID(), name: "Main Engineering Résumé", slug: "main-resume", targetRole: "Software / Platform Engineering", summary: "General engineering résumé covering fintech infrastructure, backend systems, cloud and technical leadership.", fileUrl: profile.resume, isDefault: true, status: "PUBLISHED", sortOrder: 100, createdAt: now, updatedAt: now });
  } else if (existingResume?.targetRole === "Senior Software / Platform Engineering") {
    await db.update(resumeVariants).set({ targetRole: "Software / Platform Engineering", updatedAt: now }).where(eq(resumeVariants.id, existingResume.id));
  }

  for (const item of starterPosts) {
    const [existing] = await db.select().from(posts).where(eq(posts.slug, item.slug)).limit(1);
    const { tags: postTags, categories, ...postData } = item;
    if (!existing) {
      const id = randomUUID();
      await db.insert(posts).values({
        id,
        ...postData,
        contentJson: null,
        contentFormat: "MARKDOWN",
        coverImage: null,
        youtubeUrl: null,
        legacyTags: postTags,
        seoTitle: item.title,
        seoDescription: item.excerpt,
        readingMinutes: estimateReadingMinutes(item.content),
        publishedAt: null,
        createdAt: now,
        updatedAt: now,
      });
      await syncPostTaxonomy(id, categories, postTags);
    } else {
      const [assignment] = await db.select({ postId: postTagAssignments.postId }).from(postTagAssignments).where(eq(postTagAssignments.postId, existing.id)).limit(1);
      if (!assignment) await syncPostTaxonomy(existing.id, categories, existing.legacyTags?.length ? existing.legacyTags : postTags);
    }
  }

  console.log("Seed complete. Admin user, portfolio content, engineering principles, résumé variant and three technical article drafts are ready.");
}

seed().finally(async () => {
  await pool.end();
});
