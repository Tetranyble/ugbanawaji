# Security notes

Complete this checklist before the first production release and review it again after infrastructure or authentication changes:

- [ ] Use a production MySQL user with only the permissions this app needs.
- [ ] Keep the database on a private network or provider allowlist.
- [ ] Use a unique `BETTER_AUTH_SECRET` generated for production and keep it separate from `APP_KEY`.
- [ ] Use a unique admin password (16+ characters recommended).
- [ ] Do not commit `.env` or `.env.local`.
- [ ] Rate-limit `/api/auth/sign-in/email` at the host/WAF layer in addition to Better Auth's application controls.
- [ ] Rate-limit contact submissions and add CAPTCHA only if abuse becomes a real issue.
- [ ] Enable automated database backups.
- [ ] Add uptime/error monitoring for the public site and server actions.
- [ ] Review portfolio case studies for confidentiality before publishing.
- [ ] Run dependency and secret scanning in CI.
- [ ] Protect the GitHub repository with 2FA and branch protections.

Authentication uses Better Auth with email and password. Public signup is disabled. Password hashes live in Better Auth account rows, sessions are stored in MySQL with an eight-hour non-rolling lifetime, and every protected CMS route still checks for the `ADMIN` role.

## AI provider boundaries

Ask Ugbanawaji supports OpenAI, Ollama and OpenAI-compatible inference servers. Provider credentials and base URLs stay in server-only environment variables and are never sent to browser JavaScript. Only published portfolio content is included in retrieval. Rebuild the AI index after changing the embedding provider or model so stored vectors match the active configuration. If dimensions do not match, retrieval falls back to keyword scoring.

For self-hosted providers, bind inference servers to a trusted network interface or protect them with authentication/reverse-proxy controls. Do not expose an unauthenticated Ollama, vLLM or SGLang endpoint directly to the public internet.

## Background scheduler

The unified `/api/cron/scheduler` endpoint requires `SCHEDULER_CRON_SECRET` (falling back to `NEWSLETTER_CRON_SECRET` only for compatibility). Prefer an `Authorization: Bearer ...` header instead of query-string secrets so credentials are less likely to appear in access logs. The AI index worker also uses a MySQL advisory lock plus per-job lock metadata, retry limits and stale-lock recovery to prevent overlapping workers from doing the same background rebuild.

The manual **Re-index now** action requires an authenticated admin session and runs immediately instead of joining the queue. It can index only content that is already public or due for publication.

## Form boundaries

Public contact and newsletter forms use React Hook Form for immediate feedback, then validate again with Zod on the server. CMS editors follow the same pattern, while authenticated server actions enforce authorization and persistence rules. Form errors and toast messages must never include credentials, tokens or other secrets.
