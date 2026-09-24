# Release checklist

Use this checklist for every `ugbanawaji.com` release. A release is ready only after all required checks have passed for that build.

## Schema strategy

The portfolio content model is intentionally a clean rebuild. Backward compatibility with the previous content schema is not preserved. For local/recreated databases use `npm run db:reset`. For production, create and review a fresh migration baseline from the current `src/db/schema.ts`; do not replay the retired historical content schema.

## Public content gate

Run:

```bash
npm run content:audit
```

This fails when public components introduce raw hard-coded visitor copy, literal public accessibility/form labels, hard-coded search-result labels or invented image-alt fallback text. Public content should be edited through database-backed records and seeded from `src/db/seed-content.ts`.

## Dependency gate

The repository uses strict npm peer dependency resolution. Do not use `--legacy-peer-deps` or `--force`.

After any dependency change, run on a machine with npm registry access:

```bash
npm install
npm run lockfile:check
npm ci
npm audit
npm audit --omit=dev
```

`npm run lockfile:check` fails when the lockfile differs from `package.json`, legacy `next-auth` is still resolved, Nodemailer is below major version 9, or the pinned Better Auth packages are missing or incorrect.

A failed or unavailable audit is not equivalent to a clean audit.

## Source and build gates

Run:

```bash
npm run content:audit
npm run typecheck
npm run lint
npm run build
```

Or, after the production environment file has been prepared:

```bash
RELEASE_ENV_FILE=.env.production.local npm run release:check
```

The release environment gate also verifies:

- Node.js 22.13 or newer
- production HTTPS origins
- distinct `APP_KEY` and `BETTER_AUTH_SECRET`
- a dedicated non-root database account
- production media storage
- transactional mail configuration
- separate scheduler secrets
- provider-specific AI settings

Warnings are emitted for review-required choices such as a private non-TLS database network or newsletter delivery remaining in log mode.

## Database validation

For a recreated development database:

```bash
npm run db:reset
```

This runs the current schema push, truncation and canonical content seed. For production, back up first and deploy a reviewed fresh migration baseline generated from the current schema. Do not use `db:push` against production.

Database verification should include:

1. the administrator account can sign in and sign out;
2. all seeded `site_pages` and their ordered sections/items/actions exist;
3. profile, navigation, experience, project, availability and résumé records are present;
4. public pages render their copy from the database;
5. scheduled/draft/private content remains excluded from public queries.

## Release smoke tests

After deployment, verify:

1. `GET /api/health` returns HTTP 200.
2. Existing administrator credentials can sign in and sign out.
3. Public signup remains unavailable.
4. An image upload stores an absolute URL and remains readable.
5. A draft post can be created, previewed and published.
6. Transactional Zoho mail is delivered.
7. Newsletter confirmation/campaign delivery uses the separately configured newsletter transport.
8. The protected scheduler endpoint accepts only the configured bearer secret.
9. AI provider health and indexing commands succeed when AI is enabled.
10. Scheduled/draft/private content does not appear in public search or Ask Ugbanawaji retrieval.

## Packaging gate

The Namecheap package script refuses to package a stale dependency lockfile and requires an existing production build. Generated release archives must not contain real environment files, secrets, local uploads, `node_modules`, `.next` cache/dev artifacts, logs, `.DS_Store`, or TypeScript build caches.
