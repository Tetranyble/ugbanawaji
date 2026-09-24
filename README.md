# Ugbanawaji

This repository contains the code for [ugbanawaji.com](https://ugbanawaji.com), my personal website and publishing platform.

I built it to keep my work, technical writing and experiments in one place. The public site is backed by a private CMS where I manage case studies, articles, newsletters, media and the information shown across the portfolio.

## What is included

- A portfolio for projects, experience and technical writing
- A private CMS with rich-text editing, drafts, previews, revisions and scheduled publishing
- A media library with local, Amazon S3 and Google Drive storage
- A newsletter with double opt-in, scheduling and delivery tracking
- Site search, lightweight analytics and contact management
- Ask Ugbanawaji, which answers questions from published portfolio content
- PWA support, offline recovery, RSS feeds and dynamic Open Graph images

## Tech stack

- Next.js 16, React 19 and TypeScript
- Tailwind CSS and Radix UI
- MySQL and Drizzle ORM
- Better Auth
- TipTap
- React Hook Form and Zod
- Vendor-neutral SMTP through emailjs
- OpenAI-compatible and local AI providers

## Run it locally

You will need Node.js 22.13 or newer, npm and either MySQL 8+ or Docker Desktop.

### Quick setup with Docker

The setup script creates `.env.local`, generates local secrets, starts MySQL, applies the schema and seeds the CMS:

```bash
nvm install
nvm use
npm ci
npm run setup:local
npm run dev
```

Open [localhost:3000](http://localhost:3000) for the website or [localhost:3000/admin/login](http://localhost:3000/admin/login) for the CMS. The setup script prints the generated admin credentials when it finishes.

### Use an existing MySQL installation

Install the project and create your local environment file:

```bash
nvm install
nvm use
npm ci
cp .env.example .env.local
```

Create the database:

```sql
CREATE DATABASE ugbanawaji
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

Add your database credentials to `.env.local`, then generate two secrets:

```bash
openssl rand -base64 32
openssl rand -base64 32
```

Use one value for `APP_KEY` and the other for `BETTER_AUTH_SECRET`. Set an `ADMIN_PASSWORD` of at least 12 characters, then prepare the database and start the site:

```bash
npm run db:push
npm run db:seed
npm run dev
```

The seed command creates the admin account and loads the current portfolio content: profile positioning, homepage sections, navigation, experience, projects, skills, education, availability and résumé variants. Seeded articles remain drafts until they are reviewed and published from the CMS.

## Environment variables

[`.env.example`](.env.example) lists every available setting. A basic local setup needs the following values:

```env
APP_URL=http://localhost:3000
APP_TIMEZONE=Africa/Lagos
APP_KEY=

DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=ugbanawaji
DB_USERNAME=root
DB_PASSWORD=

BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000
ADMIN_NAME="Leonard Ekenekiso"
ADMIN_EMAIL=u.ekenekiso@ugbanawaji.com
ADMIN_PASSWORD=

FILESYSTEM_DISK=local
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

The publishing interface uses `APP_TIMEZONE`, while database timestamps are stored in UTC. Do not commit `.env.local` or a populated production environment file.

## Editable portfolio content

The public portfolio is fully database-backed. Source code defines rendering behavior; public-facing copy does not live in page/component literals or source-code fallbacks. The admin workspace includes dedicated editors for:

- profile identity, positioning, contact details and assets
- homepage sections, snapshot items, About copy, focus areas, skill groups and education
- every public page/template through **Pages & sections**, including section order, visibility, labels, empty states, CTAs, SEO copy and system copy
- projects and normalized project technologies/metrics
- experience and normalized highlights/impact areas
- header, mobile, footer and header-CTA navigation
- content pages such as Work, Blog, Series, Ask, Hire, Privacy, Security, Uses, Now, Search, newsletter and error/offline pages
- recruiter availability and résumé variants
- posts, knowledge entries, newsletter content and media

Initial public content is centralized in `src/db/seed-content.ts`; `src/db/seed.ts` only persists that canonical seed into a clean database. Run `npm run content:audit` to guard against accidentally reintroducing hard-coded public UI copy.

## Publishing

The CMS lives under `/admin`, and public registration is disabled. Posts and case studies can be saved as drafts, scheduled, previewed through expiring links and restored from earlier revisions.

The TipTap editor supports headings, lists, links, images, tables, code blocks, blockquotes and YouTube embeds. Published pages can include reading time, related content and a table of contents.

Posts use four states:

- `DRAFT`
- `SCHEDULED`
- `PUBLISHED`
- `ARCHIVED`

A scheduled post becomes public when its publishing time arrives. The blog, article pages, homepage, RSS feeds and sitemap all use the same visibility rule.

## Media storage

Set `FILESYSTEM_DISK` to `local`, `s3` or `google_drive`. The editor can also choose a provider for an individual upload.

Local uploads are stored in `.storage/media` and served through the application. This is useful during development, but production environments with an ephemeral filesystem should use S3 or Google Drive.

S3-compatible services are supported through `AWS_ENDPOINT` and `AWS_FORCE_PATH_STYLE`. Google Drive uses OAuth with the limited `drive.file` scope, and stored refresh tokens are encrypted with `APP_KEY`.

## Email and newsletter

The project keeps transactional mail and newsletter delivery separate:

- `MAIL_*` sends contact notifications and subscription confirmation emails through any standard SMTP provider.
- `NEWSLETTER_MAIL_*` can use separate SMTP credentials for newsletter campaigns.

Both use `log` mode by default during local development, so messages and confirmation links appear in the terminal. Subscriber data, confirmation state, campaigns and delivery attempts are stored in MySQL. Production credentials remain server-only environment variables.

Run one newsletter delivery batch with:

```bash
npm run newsletter:run
```

## Ask Ugbanawaji

Ask Ugbanawaji answers questions using material already published on the site. It does not index drafts, admin data, subscriber records or contact messages. Answers include links to the pages used as sources.

Chat and embeddings can use different providers. The project supports OpenAI, Ollama, OpenAI-compatible endpoints and self-hosted Kimi for chat. Provider settings are documented in `.env.example`.

Check the configured providers with:

```bash
npm run ai:check
```

Rebuild the public content index with:

```bash
npm run ai:index:queue-all
npm run ai:index:work
```

## Background jobs

The scheduler processes newsletter deliveries, AI indexing jobs and newly due content:

```bash
npm run scheduler:run
```

Run it once per minute with cron, or call `/api/cron/scheduler` from a hosted scheduler using `SCHEDULER_CRON_SECRET` as a bearer token.

## Database workflow

During local development, sync the database from the Drizzle schema:

```bash
npm run db:push
```

The portfolio content schema has been intentionally reset to a clean normalized model. For a recreated database, use `npm run db:push` followed by `npm run db:seed`.

Before applying this schema to an environment that already uses migration history, generate and review a new baseline from the current schema:

```bash
npm run db:generate
```

The removed legacy baseline must not be applied to this normalized content model.

To reset local application data and seed it again:

```bash
npm run db:reset
```

The reset command refuses to run in production and does not remove uploaded media.

## Checks and deployment

Run the complete local check before a release:

```bash
npm run check
```

For production, copy `.env.production.example` to a private environment file, fill in the production values and run:

```bash
RELEASE_ENV_FILE=.env.production.local npm run release:check
```

The release check validates the lockfile, authentication migration, environment, types, lint rules and production build. Runtime secrets must come from the server or hosting platform; they are not copied into the Docker image.

Deployment notes are in [DEPLOY-NAMECHEAP.md](DEPLOY-NAMECHEAP.md). Security and validation details are in [SECURITY.md](SECURITY.md) and [VALIDATION.md](VALIDATION.md).

## Useful commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm start` | Run the completed production build |
| `npm run check` | Run type checking, linting and a build |
| `npm run db:push` | Sync the schema during local development |
| `npm run db:generate` | Generate a database migration |
| `npm run db:migrate` | Apply reviewed migrations |
| `npm run db:seed` | Seed the admin account and starter content |
| `npm run db:studio` | Open Drizzle Studio |
| `npm run scheduler:run` | Process scheduled background work |
| `npm run release:check` | Validate a production release |
