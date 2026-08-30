# Ugbanawaji — Engineering Portfolio & First-Party CMS

A Next.js portfolio/CMS for **ugbanawaji.com**, positioned around **Software Engineering · Fintech Infrastructure · Applied AI**.

The project is a ground-up Next.js App Router implementation inspired by the purchased InBio design. It does not depend on Gatsby or GraphQL.

## Stack

- Next.js 16 / App Router / React 19 / TypeScript
- Tailwind CSS + Shadcn-style/Radix UI primitives
- Better Auth email/password authentication with MySQL-backed sessions and public signup disabled
- MySQL + Drizzle ORM
- TipTap WYSIWYG article and newsletter editor
- Local, Amazon S3 and Google Drive media providers
- First-party newsletter subscriber/campaign/delivery database
- Nodemailer SMTP transport
- Zoho Mail SMTP support for transactional application email
- First-party analytics, site search and contact CRM-lite
- Evidence-grounded Ask Ugbanawaji retrieval/AI layer
- PWA/offline support, dynamic OpenGraph images and topic RSS feeds

## Requirements

- Node.js **22.13+** (`.nvmrc` currently uses Node 22.16.0)
- npm
- MySQL 8+ **or** Docker Desktop for the included local MySQL service
- A modern browser

Optional integrations:

- AWS account/bucket for S3 media
- Google Cloud OAuth client + Google Drive API for Drive media
- Zoho Mail SMTP credentials for transactional messages
- A newsletter-capable/self-hosted SMTP server for campaign delivery
- OpenAI API key (optional) for Ask Ugbanawaji generation and semantic embeddings

## 1. Install

```bash
nvm install
nvm use

# Normal path once a validated lockfile is present:
npm ci

# If package-lock.json is absent because dependencies were just changed:
# npm install
# npm run lockfile:check
```

## 2. Environment

Create the local environment file:

```bash
cp .env.example .env.local
```

The application deliberately uses explicit Laravel-like DB variables rather than a single `DATABASE_URL`.

Example local MySQL configuration:

```env
APP_NAME="Ugbanawaji"
APP_ENV=local
APP_URL=http://localhost:3000
APP_LOCALE=en
APP_TIMEZONE=Africa/Lagos
APP_KEY=
BCRYPT_ROUNDS=12

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=ugbanawaji
DB_USERNAME=root
DB_PASSWORD=your-local-password
DB_SSL=false
DB_POOL_LIMIT=10

BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000
ADMIN_NAME="Leonard Ekenekiso"
ADMIN_EMAIL=u.ekenekiso@ugbanawaji.com
ADMIN_PASSWORD=

FILESYSTEM_DISK=local
UPLOAD_MAX_MB=10

NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_LINKEDIN_URL=https://www.linkedin.com/in/ugbanawaji
```

Generate secrets:

```bash
openssl rand -base64 32   # APP_KEY
openssl rand -base64 32   # BETTER_AUTH_SECRET
```

Use a strong `ADMIN_PASSWORD` of at least 12 characters. The seed process hashes it with bcrypt before it is persisted.

`APP_TIMEZONE` is also the timezone used by the CMS scheduling UI. Timestamps are normalized to UTC for database connections so a post scheduled for a Lagos wall-clock time is not shifted just because the production server runs in UTC.

## 3. Database

If the `ugbanawaji` database does not exist:

```sql
CREATE DATABASE ugbanawaji
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

For the fastest local development path, sync the current Drizzle schema directly:

```bash
npm run db:push
npm run db:seed
```

The seed creates/updates the credential admin, profile starter data, case studies and three technical article **drafts**. Drafts are not public.

If you are upgrading an already-seeded local database from an earlier copy of this project, run:

```bash
npm run content:cleanup
```

That command only replaces the earlier generated default wording when it still exactly matches the old defaults. It does **not** overwrite profile copy you have customized in the CMS.

A fresh baseline SQL migration is also included under `drizzle/0000_initial.sql`. During active local development, `db:push` is the canonical workflow. Before a production schema change, use `npm run db:generate`, review the generated SQL, back up the database, then apply the reviewed migration.

### One-command Docker setup

If Docker Desktop is installed and you want the bundled MySQL instead of your existing local MySQL:

```bash
npm run setup:local
```

That command creates `.env.local`, generates secrets/admin password, starts MySQL, pushes the schema and seeds the CMS. It uses the Docker database user defined in `docker-compose.yml`, not your `root` account.

## 4. Run

Development:

```bash
npm run dev
```

Open:

- Site: `http://localhost:3000`
- CMS: `http://localhost:3000/admin/login`

Production validation:

```bash
npm run check
```

After a successful build:

```bash
npm start
```

`npm start` requires a completed `npm run build` first.

---

# Editorial tone

The public site is intentionally written to **show engineering level through the work rather than announce it**. Avoid self-assigned labels such as “senior”, “expert”, “guru” or “thought leader” in general portfolio copy. Prefer concrete language about systems, decisions, reliability, leadership and measurable outcomes.

Role titles and recruiter-facing target roles may still use formal market titles when they are genuinely useful (for example, a résumé variant targeted at a Senior Backend Engineer vacancy).

---

# CMS features

## WYSIWYG article editing

Posts are written with TipTap instead of a raw Markdown textarea. The editor supports:

- headings
- bold / italic / underline / strike
- bullet and numbered lists
- blockquotes
- code blocks
- links
- uploaded images
- tables
- undo/redo
- YouTube embeds in articles

The CMS stores sanitized HTML for rendering and also keeps TipTap JSON where available. Legacy seed articles can still be stored as Markdown and are converted to rich HTML when edited.

An article can also have an optional **featured YouTube URL** outside the article body. Public rendering uses YouTube's privacy-enhanced `youtube-nocookie.com` embed form when possible.

## Categories and tags

Categories and tags are normalized data, not comma-separated fields:

- `post_categories`
- `tags`
- `post_category_assignments`
- `post_tag_assignments`

Inside the post editor, type to search existing values. If a value does not exist, press Enter or choose **Create**. Saving the post creates missing taxonomy records and synchronizes the many-to-many assignments.

Public `/blog` supports category/tag filtering.

## Scheduled publishing

Post states:

- `DRAFT`
- `SCHEDULED`
- `PUBLISHED`
- `ARCHIVED`

Choose **Scheduled** and a future date/time. A post becomes publicly readable when `published_at <= current time`; no background task has to mutate its row from `SCHEDULED` to `PUBLISHED`.

The same visibility rule is used by:

- `/blog`
- direct `/blog/[slug]` access
- homepage article queries
- RSS feed
- sitemap

The blog routes are dynamic so a future post is not permanently hidden by a static build cache.

## Theme preference

The site and admin both support:

- System
- Light
- Dark

Anonymous visitors are remembered by `next-themes` in that browser/device. A truly cross-device preference needs an identity to attach it to.

For the authenticated administrator, the selected theme is also written to `users.theme_preference` in MySQL. Signing into the CMS on another device therefore restores the same account preference, and that preference follows the admin while viewing the public site while signed in.

---

# Media storage

`FILESYSTEM_DISK` selects the default provider:

```env
FILESYSTEM_DISK=local
```

Accepted values:

```text
local
s3
google_drive
```

The WYSIWYG editor and Media Library can override the provider per upload.

Only JPEG, PNG, WebP, GIF and AVIF uploads are accepted. The default maximum size is controlled by `UPLOAD_MAX_MB`.

Every upload stores an absolute URL in `media_assets.public_url`. Local and private-provider objects use the absolute application endpoint (`https://your-domain/api/media/{id}`), while public S3/CDN objects can use `AWS_PUBLIC_URL` directly. Editors therefore persist absolute image URLs consistently.

## Local disk

No additional setup:

```env
FILESYSTEM_DISK=local
```

Files are stored under `.storage/media` and streamed through the application.

**Production note:** ephemeral/serverless filesystems are not durable. Use S3 or Google Drive when deploying to infrastructure where local disk is ephemeral.

## Amazon S3

```env
FILESYSTEM_DISK=s3
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=...
AWS_ENDPOINT=
AWS_FORCE_PATH_STYLE=false
AWS_PUBLIC_URL=https://media.ugbanawaji.com
```

`AWS_ENDPOINT` and path-style mode support S3-compatible services. `AWS_PUBLIC_URL` is optional; leave it empty for a private bucket streamed through the application, or set it to a public bucket/CDN origin.

## Google Drive from the CMS

Environment:

```env
GOOGLE_DRIVE_CLIENT_ID=...
GOOGLE_DRIVE_CLIENT_SECRET=...
GOOGLE_DRIVE_REDIRECT_URI=http://localhost:3000/api/admin/storage/google/callback
GOOGLE_DRIVE_FOLDER_NAME="Ugbanawaji Portfolio Media"
```

Google Cloud setup:

1. Create/select a Google Cloud project.
2. Enable the **Google Drive API**.
3. Configure the OAuth consent screen.
4. Create an **OAuth 2.0 Web application** client.
5. Add the local authorized redirect URI exactly as:
   `http://localhost:3000/api/admin/storage/google/callback`
6. For production also add:
   `https://ugbanawaji.com/api/admin/storage/google/callback`
7. Put the client ID/secret in `.env.local`.
8. In the CMS open **Media → Connect Google Drive** and authorize the Google account that should own the uploaded files.

The app requests `drive.file`, not unrestricted Drive access. It creates/uses its own media folder and stores the Google refresh token encrypted with AES-256-GCM using the independent `APP_KEY`.

If the OAuth application is still in Google's testing mode, add the Google account you intend to use as a test user.

---

# Transactional email with Zoho Mail SMTP

This application has two intentionally separate mail channels.

`MAIL_*` is for transactional messages such as newsletter confirmation links and contact-form notifications:

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.zoho.com
MAIL_PORT=587
MAIL_SCHEME=tls
MAIL_USERNAME=your-zoho-mail-address-or-smtp-user
MAIL_PASSWORD=YOUR_ZOHO_APP_PASSWORD_OR_SMTP_PASSWORD
MAIL_FROM_ADDRESS=u.ekenekiso@ugbanawaji.com
MAIL_FROM_NAME="Ekenekiso Ugbanawaji"
MAIL_TO_ADDRESS=u.ekenekiso@ugbanawaji.com
```

Use the SMTP credentials for the Zoho Mail account that sends transactional application email. For accounts protected by MFA, use the appropriate Zoho app password. Keep campaign delivery on the separate `NEWSLETTER_MAIL_*` transport.

For local development keep:

```env
MAIL_MAILER=log
```

The confirmation email is then logged to the terminal instead of sent, including the local confirmation URL so you can test double opt-in end to end. Contact-form notifications are also logged while `MAIL_MAILER=log`.

## Why newsletter campaigns have separate SMTP settings

Zoho Mail is used only for transactional application mail here. The newsletter campaign system deliberately refuses `zoho`/`zeptomail` hosts so bulk campaigns cannot accidentally reuse the transactional mailbox.

Configure a newsletter-capable SMTP service or SMTP infrastructure you operate yourself:

```env
NEWSLETTER_MAILER=smtp
NEWSLETTER_MAIL_HOST=mail.example.net
NEWSLETTER_MAIL_PORT=587
NEWSLETTER_MAIL_SCHEME=tls
NEWSLETTER_MAIL_USERNAME=...
NEWSLETTER_MAIL_PASSWORD=...
NEWSLETTER_MAIL_FROM_ADDRESS=u.ekenekiso@ugbanawaji.com
NEWSLETTER_MAIL_FROM_NAME="Ekenekiso Ugbanawaji"
NEWSLETTER_BATCH_SIZE=25
NEWSLETTER_CRON_SECRET=...
```

For local development:

```env
NEWSLETTER_MAILER=log
```

---

# First-party newsletter

No Mailchimp/Substack-style application owns the list. MySQL stores:

- subscriber identity/status
- double-opt-in state
- confirmation expiry/send time
- unsubscribe state
- campaigns
- recipient delivery snapshots
- attempts/errors/message IDs

Flow:

1. Visitor submits the newsletter form.
2. Application writes/updates a `PENDING` subscriber.
3. A hashed, expiring confirmation token is created.
4. Transactional `MAIL_*` sends the confirmation message.
5. The confirmation route activates the subscriber.
6. An administrator drafts/schedules a campaign in the WYSIWYG CMS.
7. The newsletter worker snapshots active subscribers into delivery records and sends in batches.
8. Every email gets application-owned unsubscribe links and one-click unsubscribe headers.
9. Failed recipients can be retried from the campaign screen without resending to recipients who already succeeded.

Run one newsletter batch manually:

```bash
npm run newsletter:run
```

For production, the preferred single scheduler command processes both due newsletter delivery and AI indexing work:

```bash
npm run scheduler:run
```

Or call the protected worker endpoint:

```text
GET /api/cron/newsletter
Authorization: Bearer $NEWSLETTER_CRON_SECRET
```

On a server you operate, prefer one cron entry once per minute:

```cron
* * * * * cd /path/to/ugbanawaji && npm run scheduler:run >> /var/log/ugbanawaji-scheduler.log 2>&1
```

For a serverless deployment, call the unified protected endpoint instead:

```text
GET /api/cron/scheduler
Authorization: Bearer $SCHEDULER_CRON_SECRET
```

The older `/api/cron/newsletter` endpoint and `newsletter:run` command remain available when newsletter delivery needs to be operated independently.

---


## Form validation and submission feedback

Public and CMS forms use **React Hook Form** with Zod-backed client validation for immediate field feedback while server-side validation remains authoritative. The site uses the **Shadcn Toast** pattern backed by Radix Toast primitives, not Sonner.

Covered flows include newsletter signup, contact, admin sign-in, posts, case studies, article series, structured content, résumé variants, experience, availability, profile/homepage content, contact CRM and newsletter campaigns. Remaining server-action forms use pending submit controls and the same Shadcn toast listener after successful redirects, so save/send operations no longer feel silent.

Submission UX follows the same pattern:

- invalid fields are shown next to the field before submission
- submit buttons show a loading state
- successful public submissions show a Shadcn success toast
- server failures show destructive toasts and preserve the form where practical
- successful CMS actions redirect back with a one-time notice rendered as a Shadcn toast

---

# Blog empty state

When there are no public posts, `/blog` does not render an empty grid. It explains that technical notes are being prepared, describes the intended subjects, provides paths into selected work/experience, and offers newsletter signup.

A filter that returns no matches has a different recovery state with a **Clear filters** action.

---

# Engineering platform enrichment

The CMS is designed as a personal engineering publication platform, not only a portfolio. The enriched release adds:

- deep case studies with problem, constraints, architecture, decisions, trade-offs, reliability/security, measurable impact, lessons and retrospective notes
- Mermaid architecture diagrams and curated code samples without requiring public access to private repositories
- project lifecycle badges: Production, Active Development, Research, Open Source and Archived
- a CMS-managed **How I Engineer Systems** / engineering-principles library
- ADRs, system-design/engineering notes, open-source entries, speaking/teaching, recommendations, changelog, uses, now and reading notes
- post series/collections, related content, reading time, table of contents and stable heading anchors
- WYSIWYG autosave, revisions/rollback and expiring preview links for posts and case studies
- canonical slug redirects for renamed posts/projects
- dynamic article OpenGraph images and per-topic RSS feeds
- recruiter `/hire` view, availability controls and multiple CMS-managed résumé variants
- first-party site search, privacy-conscious analytics, subscriber/contact/newsletter signals and a contact CRM-lite workflow
- PWA manifest/service worker, offline recovery, custom error pages, privacy/security pages and `security.txt`
- an admin quality dashboard for content/accessibility readiness

## Ask Ugbanawaji

Ask Ugbanawaji is intentionally evidence-grounded. It indexes only public portfolio material: published/due posts, published case studies, public experience, published structured content and the public profile. Drafts, admin data, subscribers and contact messages are excluded. Answers link back to their supporting public sources and return an evidence-gap response when the portfolio cannot establish a claim.

### AI providers

Chat generation and embeddings are configured independently. This lets the site use one provider for the answer model and another for embeddings without changing application code.

Supported provider values:

- `openai` — OpenAI Responses API for chat and OpenAI embeddings.
- `ollama` — native Ollama `/api/chat` and `/api/embed` endpoints.
- `openai_compatible` — generic OpenAI-compatible `/chat/completions` and `/embeddings` endpoints.
- `kimi` — convenience alias for self-hosted Kimi chat served through an OpenAI-compatible vLLM/SGLang endpoint.
- `disabled` — disables that part of the AI stack. If embeddings are disabled, retrieval falls back to keyword scoring. If chat is disabled, evidence can still be found but generated answers are unavailable.

`AI_PROVIDER` remains supported as a backward-compatible fallback. New deployments should use `AI_CHAT_PROVIDER` and `AI_EMBEDDING_PROVIDER`.

#### OpenAI for chat and embeddings

```env
AI_CHAT_PROVIDER=openai
AI_EMBEDDING_PROVIDER=openai

OPENAI_API_KEY=
OPENAI_CHAT_MODEL=gpt-5.6-luna
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
```

#### Fully local Ollama

Pull the models in Ollama first, for example:

```bash
ollama pull qwen3:8b
ollama pull nomic-embed-text
```

Then configure:

```env
AI_CHAT_PROVIDER=ollama
AI_EMBEDDING_PROVIDER=ollama

OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_API_KEY=
OLLAMA_CHAT_MODEL=qwen3:8b
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
```

If Next.js is running inside Docker on macOS/Windows while Ollama is running on the host, use:

```env
OLLAMA_BASE_URL=http://host.docker.internal:11434
```

#### Self-hosted Kimi for chat + Ollama for embeddings

A self-hosted Kimi model served through an OpenAI-compatible server such as vLLM can be used for answer generation while a smaller Ollama model handles embeddings:

```env
AI_CHAT_PROVIDER=kimi
AI_EMBEDDING_PROVIDER=ollama

KIMI_BASE_URL=http://127.0.0.1:8000/v1
KIMI_API_KEY=EMPTY
KIMI_CHAT_MODEL=moonshotai/Kimi-K2.6

OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
```

Kimi is treated as a chat/generation model here, not as an embedding model. The `kimi` alias uses `KIMI_BASE_URL`, `KIMI_API_KEY` and `KIMI_CHAT_MODEL`. If your OpenAI-compatible server exposes a separate embedding model, you can instead configure:

```env
AI_EMBEDDING_PROVIDER=openai_compatible
AI_COMPATIBLE_EMBEDDING_MODEL=your-embedding-model
```

The compatible server and chat model are shared through `AI_COMPATIBLE_BASE_URL` and `AI_COMPATIBLE_CHAT_MODEL`.

### Provider health check

After configuring `.env.local`, test the selected providers without starting the web application:

```bash
npm run ai:check
```

The command prints the active chat and embedding providers, creates one test embedding, and sends a minimal chat health-check request. It does not read or transmit portfolio/database content.

### Indexing and provider changes

AI indexing supports both background and manual operation. Content mutations enqueue a coalesced background sync in `ai_index_jobs`; the scheduler processes due jobs with retry/backoff and stale-lock recovery. Newly due scheduled posts are also detected by the scheduler and queued without exposing them early.

Manual indexing is deliberately retained. In **Admin → Ask AI**, **Re-index now** rebuilds the public knowledge index immediately, while **Queue background re-index** hands the work to the scheduler. You can also run:

```bash
npm run ai:index:queue-all
npm run ai:index:work
```

If you change the embedding provider or embedding model, queue or manually run a full re-index so stored vectors match the new query-vector dimensions. The re-indexer compares content hashes and provider/model metadata, skips unchanged documents, and safely falls back to lexical scoring when embeddings are unavailable or incompatible.

General controls:

```env
AI_REQUEST_TIMEOUT_MS=180000
AI_MAX_QUESTIONS_PER_HOUR=20
AI_MAX_CONVERSATION_MESSAGES=10
AI_MAX_CONTEXT_CHUNKS=8
AI_MIN_RETRIEVAL_SCORE=0.18
AI_INDEX_BATCH_SIZE=2
AI_INDEX_MAX_ATTEMPTS=5
AI_INDEX_RETRY_DELAY_SECONDS=60
AI_INDEX_STALE_LOCK_MINUTES=20
```

## Database upgrade from the pre-enrichment local copy

### Truncate or reset the local database

For a clean local database without dropping the schema, use:

```bash
npm run db:truncate -- --yes
```

This truncates only the application tables defined by the project. It refuses to run when `APP_ENV=production` or `NODE_ENV=production`, preserves Drizzle migration metadata, and does **not** delete uploaded files from local storage, S3, or Google Drive.

To truncate and immediately reseed the application:

```bash
npm run db:reset
```

`db:reset` recreates seeded application data such as the admin user and starter content after truncation.

For the current development database, the simplest path remains:

```bash
npm run db:push
```

The release migration directory contains the application baseline plus reviewed forward migrations (including the Better Auth credential/session cutover) and Drizzle migration metadata. Apply pending migrations with `npm run db:migrate`. Future schema changes should be generated with `npm run db:generate`, reviewed, backed up and then applied with `db:migrate`; do not use `db:push` against production.

# Four-phase platform scope

The current source combines the agreed four implementation phases in one application:

1. **Engineering authority & content platform** — deep case studies, How I Engineer Systems, ADRs, system-design/engineering notes, Mermaid architecture diagrams, curated code samples, lifecycle statuses, open-source/currently-building content and experience-by-impact.
2. **Publishing & CMS maturity** — TipTap, categories/tags, series, scheduling, YouTube, autosave recovery, post/project revisions, rollback, expiring previews, slug redirects, topic RSS, dynamic OpenGraph images, newsletter archive, résumé variants, media providers and account-backed admin theme preference.
3. **Audience, recruiter & intelligence layer** — `/hire`, availability, first-party search, privacy-conscious analytics, admin analytics, newsletter signals, CRM-lite contact workflow, anti-spam/rate limiting and a shared public knowledge-source layer.
4. **Ask Ugbanawaji & production hardening** — grounded AI retrieval with citations and feedback, evidence-gap analytics, PWA/offline behavior, accessibility guardrails, privacy/security/error routes, quality checks and safer public/private cache boundaries.

The CMS design intentionally uses a restrained admin visual system: clear page hierarchy, flat bordered surfaces, limited shadow use and consistent actions. The public site keeps the InBio-inspired personality without making the administration experience decorative or noisy.

# Production deployment checklist

Before pointing `ugbanawaji.com` at production:

1. Use Node 22.13+.
2. Create a production MySQL database and a dedicated non-root application user.
3. Copy `.env.production.example` to a private `.env.production.local` for a self-hosted deployment, or configure the same values in your hosting platform. Never commit the populated file.
4. Set all `DB_*` variables.
5. Use new random values for `APP_KEY`, `BETTER_AUTH_SECRET`, `ADMIN_PASSWORD`, `NEWSLETTER_CRON_SECRET` and `SCHEDULER_CRON_SECRET`. Keep `APP_KEY` and `BETTER_AUTH_SECRET` different.
6. Set `APP_URL=https://ugbanawaji.com`, `BETTER_AUTH_URL=https://ugbanawaji.com` and `NEXT_PUBLIC_SITE_URL=https://ugbanawaji.com`.
7. Set `APP_TIMEZONE=Africa/Lagos` (or intentionally change it).
8. Run `npm run release:check`; it fails on unsafe/missing production configuration and then runs typecheck, lint and the production build.
9. Apply the reviewed baseline with `npm run db:migrate`, then run `npm run db:seed` once.
10. Use S3 or Google Drive instead of local disk. Set `AWS_PUBLIC_URL` when using a public bucket or CDN.
11. Configure Google OAuth's production redirect URI if Drive storage is enabled.
12. Configure Zoho Mail SMTP/DNS authentication for transactional email.
13. Configure the separate newsletter SMTP transport and scheduler.
14. Verify `/api/health`, admin sign-in, one media upload, contact mail and newsletter confirmation in the release environment.
15. Keep the seeded technical articles as drafts until you personally review and publish them.

For a self-hosted environment file:

```bash
cp .env.production.example .env.production.local
RELEASE_ENV_FILE=.env.production.local npm run release:check
```

The Docker image uses the same production build and exposes `/api/health` as its container health check. Runtime secrets must be injected by the deployment platform; they are not copied into the image.

## Useful commands

```bash
npm run dev
npm run build
npm start
npm run typecheck
npm run lint
npm run check
npm run release:check
npm run db:push
npm run db:generate
npm run db:migrate
npm run db:seed
npm run db:studio
npm run newsletter:run
```
