# Deploy to Namecheap shared hosting

Ugbanawaji runs as a Node.js application in cPanel. It is not a static export and should not be placed in `public_html`.

## 1. Prepare DNS and SSL

Point the domain to Namecheap Web Hosting DNS:

- `dns1.namecheaphosting.com`
- `dns2.namecheaphosting.com`

Wait until the domain resolves to the hosting account and the cPanel SSL installation completes. Enable **Force HTTPS Redirect** only after HTTPS works.

## 2. Create the database

In cPanel, create a MySQL database and a dedicated user, add the user to the database, and grant **All Privileges**. cPanel prefixes both names with the account username, for example:

```text
unitxcqu_ugbanawaji
```

Keep the actual database name, username, and password for the environment variables below.

## 3. Build and package locally

Use Node 22.13 or newer:

```bash
nvm use
npm ci --include=dev
npm run release:check
npm run deploy:namecheap
```

For `release:check`, point `RELEASE_ENV_FILE` at a completed private production environment file if those variables are not already exported:

```bash
RELEASE_ENV_FILE=.env.production npm run release:check
```

The upload archive is created at:

```text
release/namecheap/ugbanawaji-cpanel.zip
```

The archive contains the standalone production runtime under `runtime/`, including the modules traced by Next.js. It does not include secrets, build caches or local media. The deployment command sets the public production URL during the build, so browser-visible `NEXT_PUBLIC_*` values do not come from `.env.local`.

## 4. Upload the application

Open cPanel **File Manager**, enter `/home/unitxcqu/ugbanawaji`, upload the ZIP, and extract it directly into that directory. Enable **Show Hidden Files** so the `.next` directory is visible.

Do not upload `.env.local`. Create a private `.env.production` separately as described below. The deployment ZIP does not include it.

## 5. Configure Setup Node.js App

Use these values in cPanel’s **Setup Node.js App** screen:

| Field | Value |
| --- | --- |
| Node.js version | `22.23.2` |
| Application mode | `Production` |
| Application root | `ugbanawaji` |
| Application URL | `ugbanawaji.com` with the suffix blank |
| Application startup file | `server.js` |

Do not add `PORT`; cPanel assigns it to the application.

The application can read its variables directly from `/home/unitxcqu/ugbanawaji/.env.production`. Copy `.env.production.example` to that filename in cPanel File Manager, edit it with the real values, and set its permissions to `600` if File Manager exposes permissions. Do not leave the example placeholders unchanged.

Alternatively, add the same variables individually in cPanel's **Environment variables** section. Values configured by cPanel take precedence over values in the file.

In particular, configure:

```env
APP_ENV=production
APP_URL=https://ugbanawaji.com
NEXT_PUBLIC_SITE_URL=https://ugbanawaji.com
BETTER_AUTH_URL=https://ugbanawaji.com
DB_HOST=localhost
DB_PORT=3306
DB_SSL=false
DB_POOL_LIMIT=5
FILESYSTEM_DISK=local
LOCAL_STORAGE_ROOT=/home/unitxcqu/ugbanawaji-storage/media
```

Use the real cPanel-prefixed database/user names and private secrets. Generate separate secrets with:

```bash
openssl rand -base64 48
```

Create `/home/unitxcqu/ugbanawaji-storage/media` in File Manager. Keep this directory when replacing application builds and include it in hosting backups. When S3 is ready, switch `FILESYSTEM_DISK` and fill the `AWS_*` variables; uploaded URLs already use the public site origin/provider URL.

Click **Create**, stop the application, and then start it. The root `server.js` automatically loads the bundled `runtime/server.js`; the application does not depend on cPanel's copy of Next.js. Restart the application whenever `.env.production` changes.

The uploaded archive already contains the locally generated standalone production build and runtime dependencies. Do not run `npm run build` in cPanel. Namecheap's older glibc and its package installation no longer participate in compiling or starting Next.js.

If an emergency server-side rebuild is unavoidable, install build-time dependencies explicitly before building, although rebuilding locally and uploading a new standalone archive remains preferred:

```bash
npm ci --include=dev
npm ls @tailwindcss/postcss tailwindcss typescript
NODE_ENV=production npm run build
```

Do not use `npm ci --omit=dev` or cPanel's production-only **Run NPM Install** immediately before a server-side build. Those modes intentionally omit Tailwind, PostCSS, and TypeScript build packages.

## 6. Initialize the database

Open cPanel **Terminal** and copy the virtual-environment activation command displayed at the top of the Node application page. Then run:

```bash
cd /home/unitxcqu/ugbanawaji
npm ci --include=dev
NODE_ENV=production npm run db:migrate
NODE_ENV=production npm run db:seed
```

Run the seed on the first deployment. Run it again only when you want to update its idempotent starter records. Restart the application from **Setup Node.js App** after migration.

## 7. Verify the release

Check these URLs:

```text
https://ugbanawaji.com/api/health
https://ugbanawaji.com/
https://ugbanawaji.com/admin/login
```

Sign in with `ADMIN_EMAIL` and `ADMIN_PASSWORD`, upload a small image, create a draft post, and confirm the stored image URL begins with `https://ugbanawaji.com/`.

For later releases: make a database and media backup, upload/extract the new archive over the app directory, run migrations when the archive contains new migrations, and restart the app. The bundled runtime does not require `npm install`. Never delete `LOCAL_STORAGE_ROOT` during deployment.
