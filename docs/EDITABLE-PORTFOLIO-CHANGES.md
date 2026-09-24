# Fully Database-Backed Portfolio Refactor

This refactor rebuilds the portfolio content model so the **public-facing UI has no source-code copy as its source of truth**. The database is expected to be recreated, so backward compatibility with the previous content model is intentionally not preserved.

## What “fully editable” means

Every public-facing word that belongs to the portfolio experience is stored in the database or in a database-backed content record. Source code now provides component structure and behavior only.

Database-backed public content includes:

- profile identity, headline, introduction, current focus, contact details and assets
- homepage hero, snapshot, headings, descriptions, labels, CTAs, empty states, visibility and section ordering
- focus-area cards and tags
- About paragraphs
- skill groups and skills
- education and certifications
- experience entries, highlights and impact areas
- projects/case studies, narrative sections, technologies, metrics, diagrams and code samples
- header/mobile/footer navigation
- Work, Blog, Series, Ask, Hire, Privacy, Security, Now, Uses, Search, newsletter and all other public page/template copy
- project lifecycle labels and post/content-type labels
- article code-toolbar copy and diagram loading copy
- accessibility labels, placeholders, form labels and public validation/error messages
- contact/newsletter transactional messages that are displayed to visitors
- 404, error and offline copy
- manifest/feed/security.txt public text
- search-result source labels
- Ask AI starter prompts and public assistant error/status text
- recruiter availability, target roles, work modes and résumé descriptions

There are **no hard-coded public-copy fallbacks**. If a required database copy record is missing, the public UI does not silently substitute a sentence from source code.

The `/admin` workspace itself remains application chrome implemented in code. Its own editor-control labels such as “Save page”, “Sections” and “Delete” are not portfolio content and are intentionally not part of the editable public-content model. Everything a public visitor reads is database-backed.

## Source of truth

Initial public content is seeded from `src/db/seed-content.ts`. `src/db/seed.ts` is persistence wiring only: it writes the canonical seed content into the normalized schema and creates the configured administrator account.

The seed contains the current professional positioning established for Leonard Ekenekiso:

- Backend Software Engineer as the public identity
- Java / Spring Boot as the current primary professional stack
- PHP / Laravel as established backend depth
- financial systems, payments, integrations and transaction-heavy services as core domain evidence
- GlobalPath as the delivered Java/Spring Boot + LangChain4j AI backend
- Credense as the multi-tenant PHP/Laravel credit and risk platform
- AI Learn as public Java/Spring Boot durable-AI architecture evidence
- Airvend, Boctrust, Scnip, Harde and Pensuh experience with the corrected positioning

`src/db/seed-content.ts` also contains the initial posts, availability content and résumé-variant content so the actual public seed copy is centralized in one file.

## Editable admin areas

- `/admin/profile` — identity, contact details, hero positioning, portrait and default résumé
- `/admin/homepage` — reusable About copy, focus areas, skill groups and education/certifications
- `/admin/pages` — **every public route/template**, including homepage section copy, snapshot values, section order/visibility, repeated labels, system copy and CTAs
- `/admin/projects` — full case-study content, technologies, metrics, diagrams, code samples, URLs and publishing state
- `/admin/experience` — experience entries, highlights and impact areas
- `/admin/navigation` — header, mobile, footer and header-CTA links
- `/admin/content` — engineering principles, ADRs, open-source notes, recommendations, changelog, reading notes and other knowledge content
- `/admin/ask-content` — Ask AI starter prompts
- `/admin/hire` — availability, target roles, work modes and résumé variants
- existing admin areas continue to manage posts, series, media, newsletter, analytics, messages and AI indexing

## Normalized content model

Dedicated tables cover:

- `site_profiles`
- `profile_about_paragraphs`
- `site_pages`
- `page_sections`
- `page_section_items`
- `page_section_actions`
- `focus_areas`
- `focus_area_tags`
- `skill_groups`
- `skill_items`
- `education_entries`
- `navigation_items`
- normalized experience/highlight/impact records
- normalized project/technology/metric records
- availability profile/target-role/work-mode records
- Ask AI starter prompts
- posts, series, newsletter campaigns and knowledge-content records

Page sections are ordered records and can be enabled/disabled independently. Section items and actions are also ordered and editable. Component names stay in source code because they select rendering behavior; their visitor-facing text comes from database records.

## Public-copy regression gate

A source audit was added:

```bash
npm run content:audit
```

It checks the public app/components for raw JSX copy, literal public accessibility/form labels, hard-coded search/knowledge labels and invented image-alt fallbacks. `npm run check` now runs this audit before TypeScript, lint and build checks.

## Database reset

For a clean local database after configuring `.env`:

```bash
npm run db:reset
```

Equivalent sequence:

```bash
npm run db:push
npm run db:truncate -- --yes
npm run db:seed
```

This is a clean-schema workflow. The old migration baseline is intentionally not preserved. Generate a fresh reviewed migration baseline from the current schema before deployment to an environment that uses migration files.

## Validation in this environment

- public-copy audit passes
- TypeScript/TSX syntax transpile scan passes across the source tree
- seed-content and seeder syntax checks pass
- public-route seed coverage was reviewed
- no old profile fallback is used for public copy

A complete dependency-aware `npm run typecheck`, lint and Next.js build could not be completed here because the local `node_modules` installation was incomplete and registry installation did not finish. Run `npm ci && npm run check` in your normal development environment before deployment.
