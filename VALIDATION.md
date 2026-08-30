# Release checklist

Use this checklist for every `ugbanawaji.com` release. A release is ready only after all required checks have passed for that build.

## Authentication migration status

The application uses Better Auth email/password credentials with public signup disabled. Existing CMS user IDs remain unchanged. The migration chain is:

- `drizzle/0000_release_baseline.sql` — the original application baseline.
- `drizzle/0001_better_auth.sql` — adds Better Auth session/account/verification storage, backfills each existing `users.password_hash` into a credential account using the same user ID, marks existing users as email-verified, and only then removes the legacy password column.

Before production deployment, rehearse the complete migration chain against an isolated copy of the production database and verify that the administrator can sign in with the existing password after migration. Back up the production database immediately before the cutover.

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

For a fresh database or an upgrade rehearsal:

```bash
npm run db:migrate
npm run db:seed
```

For an existing production database, back it up first and apply only unapplied migrations. Use `db:generate` plus reviewed migration SQL for future schema changes. Do not use `db:push` against production.

Migration verification must include:

1. The existing user ID is unchanged.
2. A credential row exists with `provider_id = 'credential'`, `issuer = 'local:credential'` and `account_id` equal to that user ID.
3. The credential password remains a bcrypt hash and existing credentials can sign in.
4. `users.password_hash` no longer exists after the backfill succeeds.
5. Session creation, session expiry and sign-out work with the new MySQL-backed session table.

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
