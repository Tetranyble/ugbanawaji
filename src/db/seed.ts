import "@/lib/load-env";
import { randomUUID } from "crypto";
import { hash } from "bcryptjs";
import { db, pool } from "@/db";
import {
  authAccounts,
  askStarterPrompts,
  availabilityProfiles,
  availabilityTargetRoles,
  availabilityWorkModes,
  contentEntries,
  educationEntries,
  experienceHighlights,
  experienceImpactAreas,
  experiences,
  focusAreas,
  focusAreaTags,
  pageSectionActions,
  pageSectionItems,
  pageSections,
  sitePages,
  navigationItems,
  posts,
  profileAboutParagraphs,
  projectMetrics,
  projects,
  projectTechnologies,
  resumeVariants,
  siteProfiles,
  skillGroups,
  skillItems,
  users,
} from "@/db/schema";
import { env } from "@/lib/env";
import { estimateReadingMinutes } from "@/lib/utils";
import { syncPostTaxonomy } from "@/lib/taxonomy";
import {
  seededAbout,
  seededAvailability,
  seededAskStarterPrompts,
  seededEducation,
  seededExperiences,
  seededFocusAreas,
  seededNavigation,
  seededPrinciples,
  seededProfile,
  seededProjects,
  seededResumeVariants,
  seededStarterPosts,
  seededSkillGroups,
  seededPages,
} from "@/db/seed-content";

function itemText(item: object, key: string) {
  const value = (item as Record<string, unknown>)[key];
  return typeof value === "string" ? value : null;
}

async function seed() {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME ?? seededProfile.displayName;

  if (!adminEmail || !adminPassword || adminPassword.length < 12) {
    throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD (minimum 12 characters) before running db:seed");
  }

  const now = new Date();
  const userId = randomUUID();
  const passwordHash = await hash(adminPassword, Math.min(15, Math.max(10, env.bcryptRounds)));

  await db.insert(users).values({
    id: userId,
    name: adminName,
    email: adminEmail,
    emailVerified: true,
    role: "ADMIN",
    createdAt: now,
    updatedAt: now,
  });

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

  await db.insert(siteProfiles).values({ ...seededProfile, createdAt: now, updatedAt: now });

  await db.insert(profileAboutParagraphs).values(
    seededAbout.map((body, index) => ({
      id: randomUUID(),
      profileId: seededProfile.id,
      body,
      sortOrder: 100 - index * 10,
      createdAt: now,
      updatedAt: now,
    })),
  );

  for (const [index, area] of seededFocusAreas.entries()) {
    const focusAreaId = randomUUID();
    await db.insert(focusAreas).values({
      id: focusAreaId,
      title: area.title,
      description: area.description,
      icon: area.icon,
      sortOrder: 100 - index * 10,
      createdAt: now,
      updatedAt: now,
    });
    await db.insert(focusAreaTags).values(
      area.tags.map((label, tagIndex) => ({ id: randomUUID(), focusAreaId, label, sortOrder: 100 - tagIndex * 10 })),
    );
  }

  for (const [index, group] of seededSkillGroups.entries()) {
    const groupId = randomUUID();
    await db.insert(skillGroups).values({ id: groupId, title: group.title, sortOrder: 100 - index * 10, createdAt: now, updatedAt: now });
    await db.insert(skillItems).values(group.items.map((label, itemIndex) => ({ id: randomUUID(), groupId, label, sortOrder: 100 - itemIndex * 10 })));
  }

  await db.insert(educationEntries).values(
    seededEducation.map((entry, index) => ({ id: randomUUID(), ...entry, sortOrder: 100 - index * 10, createdAt: now, updatedAt: now })),
  );

  await db.insert(navigationItems).values(
    seededNavigation.map((item) => ({ id: randomUUID(), ...item, enabled: true, createdAt: now, updatedAt: now })),
  );

  await db.insert(askStarterPrompts).values(
    seededAskStarterPrompts.map((item, index) => ({ id: randomUUID(), ...item, enabled: true, sortOrder: 100 - index * 10, createdAt: now, updatedAt: now })),
  );

  for (const page of seededPages) {
    const pageId = randomUUID();
    await db.insert(sitePages).values({
      id: pageId,
      slug: page.slug,
      route: page.route,
      title: page.title,
      seoTitle: page.seoTitle ?? null,
      seoDescription: page.seoDescription ?? null,
      status: "PUBLISHED",
      createdAt: now,
      updatedAt: now,
    });

    for (const section of page.sections) {
      const sectionId = randomUUID();
      await db.insert(pageSections).values({
        id: sectionId,
        pageId,
        key: section.key,
        component: section.component,
        eyebrow: "eyebrow" in section ? section.eyebrow ?? null : null,
        title: "title" in section ? section.title ?? null : null,
        description: "description" in section ? section.description ?? null : null,
        body: "body" in section ? section.body ?? null : null,
        enabled: true,
        sortOrder: section.sortOrder,
        itemLimit: "itemLimit" in section ? section.itemLimit ?? null : null,
        createdAt: now,
        updatedAt: now,
      });

      if ("items" in section && section.items?.length) {
        await db.insert(pageSectionItems).values(section.items.map((item, index) => ({
          id: randomUUID(),
          sectionId,
          key: itemText(item, "key"),
          title: itemText(item, "title"),
          subtitle: itemText(item, "subtitle"),
          description: itemText(item, "description"),
          value: itemText(item, "value"),
          href: itemText(item, "href"),
          icon: itemText(item, "icon"),
          enabled: true,
          sortOrder: 1000 - index * 10,
        })));
      }

      if ("actions" in section && section.actions?.length) {
        await db.insert(pageSectionActions).values(section.actions.map((action, index) => ({
          id: randomUUID(),
          sectionId,
          key: action.key ?? null,
          label: action.label,
          href: action.href,
          variant: action.variant,
          external: action.external,
          enabled: true,
          sortOrder: 1000 - index * 10,
        })));
      }
    }
  }

  for (const principle of seededPrinciples) {
    await db.insert(contentEntries).values({
      id: randomUUID(),
      type: "PRINCIPLE",
      title: principle.title,
      slug: principle.slug,
      summary: principle.summary,
      content: principle.content,
      data: {},
      status: "PUBLISHED",
      featured: true,
      sortOrder: principle.sortOrder,
      publishedAt: now,
      createdAt: now,
      updatedAt: now,
    });
  }

  for (const item of seededExperiences) {
    const id = randomUUID();
    await db.insert(experiences).values({
      id,
      company: item.company,
      role: item.role,
      location: item.location,
      startDate: item.startDate,
      endDate: item.endDate,
      current: item.current,
      summary: item.summary,
      sortOrder: item.sortOrder,
      createdAt: now,
      updatedAt: now,
    });
    await db.insert(experienceHighlights).values(item.highlights.map((body, index) => ({ id: randomUUID(), experienceId: id, body, sortOrder: 100 - index * 10 })));
    await db.insert(experienceImpactAreas).values(item.impactAreas.map((label, index) => ({ id: randomUUID(), experienceId: id, label, sortOrder: 100 - index * 10 })));
  }

  for (const item of seededProjects) {
    const id = randomUUID();
    const { techStack, metrics, ...project } = item;
    await db.insert(projects).values({ id, ...project, createdAt: now, updatedAt: now });
    if (techStack.length) {
      await db.insert(projectTechnologies).values(techStack.map((label, index) => ({ id: randomUUID(), projectId: id, label, sortOrder: 100 - index * 10 })));
    }
    const metricItems = metrics as readonly { label: string; value: string }[];
    if (metricItems.length) {
      await db.insert(projectMetrics).values(metricItems.map((metric, index) => ({ id: randomUUID(), projectId: id, label: metric.label, value: metric.value, sortOrder: 100 - index * 10 })));
    }
  }

  const availabilityId = seededAvailability.id;
  await db.insert(availabilityProfiles).values({
    id: availabilityId,
    visible: seededAvailability.visible,
    status: seededAvailability.status,
    relocation: seededAvailability.relocation,
    note: seededAvailability.note,
    createdAt: now,
    updatedAt: now,
  });
  await db.insert(availabilityTargetRoles).values(
    seededAvailability.targetRoles.map((label, index) => ({ id: randomUUID(), availabilityId, label, sortOrder: 100 - index * 10 })),
  );
  await db.insert(availabilityWorkModes).values(
    seededAvailability.workModes.map((label, index) => ({ id: randomUUID(), availabilityId, label, sortOrder: 100 - index * 10 })),
  );

  await db.insert(resumeVariants).values(
    seededResumeVariants.map((resume) => ({ id: randomUUID(), ...resume, createdAt: now, updatedAt: now })),
  );

  for (const post of seededStarterPosts) {
    const id = randomUUID();
    await db.insert(posts).values({
      id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      contentJson: null,
      contentFormat: "MARKDOWN",
      status: "DRAFT",
      contentType: "ARTICLE",
      seriesId: null,
      seriesOrder: 0,
      coverImage: null,
      youtubeUrl: null,
      seoTitle: post.title,
      seoDescription: post.excerpt,
      readingMinutes: estimateReadingMinutes(post.content),
      publishedAt: null,
      createdAt: now,
      updatedAt: now,
    });
    await syncPostTaxonomy(id, post.categories, post.tags);
  }

  console.log("Seed complete. All public portfolio copy, homepage sections, navigation, experience, projects and supporting content are database-backed and editable.");
}

seed().finally(async () => {
  await pool.end();
});
