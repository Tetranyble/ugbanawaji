# Migration baseline

The portfolio content model was intentionally rebuilt as a clean schema. The previous release baseline was removed because it represented the old JSON-backed portfolio model.

For a recreated/local database, use:

```bash
npm run db:push
npm run db:seed
```

Before deploying this schema change to an environment that uses migration history, generate and review a new baseline from `src/db/schema.ts`:

```bash
npm run db:generate
```

Do not apply the removed legacy baseline to the normalized content model.
