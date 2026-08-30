#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"
command -v node >/dev/null 2>&1 || { echo "Node.js >=22.13 is required."; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "npm is required."; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "Docker Desktop / Docker Engine is required for the one-command local setup."; exit 1; }
node -e 'const [major,minor]=process.versions.node.split(".").map(Number); if (major < 22 || (major === 22 && minor < 13)) { console.error(`Node ${process.versions.node} is too old. Use Node >=22.13 (the project .nvmrc uses 22.23.1).`); process.exit(1); }'

if [[ ! -f .env.local ]]; then
  BETTER_AUTH_SECRET="$(node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))")"
  APP_KEY="$(node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))")"
  ADMIN_PASSWORD="$(node -e "console.log(require('crypto').randomBytes(18).toString('base64url'))")"
  NEWSLETTER_CRON_SECRET="$(node -e "console.log(require('crypto').randomBytes(24).toString('base64url'))")"
  SCHEDULER_CRON_SECRET="$(node -e "console.log(require('crypto').randomBytes(24).toString('base64url'))")"
  cat > .env.local <<ENV
APP_NAME="Ugbanawaji"
APP_ENV=local
APP_URL=http://localhost:3000
APP_LOCALE=en
APP_TIMEZONE=Africa/Lagos
APP_KEY="$APP_KEY"
BCRYPT_ROUNDS=12

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=ugbanawaji
DB_USERNAME=portfolio
DB_PASSWORD=portfolio
DB_SSL=false
DB_POOL_LIMIT=10

BETTER_AUTH_SECRET="$BETTER_AUTH_SECRET"
BETTER_AUTH_URL=http://localhost:3000
ADMIN_NAME="Leonard Ekenekiso"
ADMIN_EMAIL=u.ekenekiso@ugbanawaji.com
ADMIN_PASSWORD="$ADMIN_PASSWORD"

FILESYSTEM_DISK=local
UPLOAD_MAX_MB=10
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=
AWS_ENDPOINT=
AWS_FORCE_PATH_STYLE=false
AWS_PUBLIC_URL=
GOOGLE_DRIVE_CLIENT_ID=
GOOGLE_DRIVE_CLIENT_SECRET=
GOOGLE_DRIVE_REDIRECT_URI=http://localhost:3000/api/admin/storage/google/callback
GOOGLE_DRIVE_FOLDER_NAME="Ugbanawaji Portfolio Media"

MAIL_MAILER=log
MAIL_HOST=smtp.zoho.com
MAIL_PORT=587
MAIL_SCHEME=tls
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_FROM_ADDRESS=u.ekenekiso@ugbanawaji.com
MAIL_FROM_NAME="Ekenekiso Ugbanawaji"
MAIL_TO_ADDRESS=u.ekenekiso@ugbanawaji.com

NEWSLETTER_MAILER=log
NEWSLETTER_MAIL_HOST=127.0.0.1
NEWSLETTER_MAIL_PORT=587
NEWSLETTER_MAIL_SCHEME=tls
NEWSLETTER_MAIL_USERNAME=
NEWSLETTER_MAIL_PASSWORD=
NEWSLETTER_MAIL_FROM_ADDRESS=u.ekenekiso@ugbanawaji.com
NEWSLETTER_MAIL_FROM_NAME="Ekenekiso Ugbanawaji"
NEWSLETTER_BATCH_SIZE=25
NEWSLETTER_CRON_SECRET="$NEWSLETTER_CRON_SECRET"
SCHEDULER_CRON_SECRET="$SCHEDULER_CRON_SECRET"

AI_CHAT_PROVIDER=openai
AI_EMBEDDING_PROVIDER=openai
AI_PROVIDER=openai
OPENAI_API_KEY=
OPENAI_CHAT_MODEL=gpt-5.6-luna
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_API_KEY=
OLLAMA_CHAT_MODEL=qwen3:8b
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
AI_COMPATIBLE_BASE_URL=http://127.0.0.1:8000/v1
AI_COMPATIBLE_API_KEY=EMPTY
AI_COMPATIBLE_CHAT_MODEL=moonshotai/Kimi-K2.6
AI_COMPATIBLE_EMBEDDING_MODEL=
KIMI_BASE_URL=http://127.0.0.1:8000/v1
KIMI_API_KEY=EMPTY
KIMI_CHAT_MODEL=moonshotai/Kimi-K2.6
AI_REQUEST_TIMEOUT_MS=180000
AI_MAX_QUESTIONS_PER_HOUR=20
AI_MAX_CONVERSATION_MESSAGES=10
AI_MAX_CONTEXT_CHUNKS=8
AI_MIN_RETRIEVAL_SCORE=0.18
AI_INDEX_BATCH_SIZE=2
AI_INDEX_MAX_ATTEMPTS=5
AI_INDEX_RETRY_DELAY_SECONDS=60
AI_INDEX_STALE_LOCK_MINUTES=20

NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_LINKEDIN_URL=https://www.linkedin.com/in/ugbanawaji
ENV
  echo "Created .env.local"
  echo ""
  echo "Local admin login"
  echo "Email:    u.ekenekiso@ugbanawaji.com"
  echo "Password: $ADMIN_PASSWORD"
  echo ""
  echo "Save that password somewhere private."
else
  echo ".env.local already exists; leaving it unchanged."
fi

echo "Starting MySQL..."
docker compose up -d mysql
for i in {1..30}; do
  if docker compose exec -T mysql mysqladmin ping -h localhost -uportfolio -pportfolio --silent >/dev/null 2>&1; then break; fi
  if [[ "$i" == "30" ]]; then echo "MySQL did not become ready in time. Run 'docker compose logs mysql' for details."; exit 1; fi
  sleep 2
done

if [[ -f package-lock.json ]]; then
  echo "Validating dependency lockfile..."; npm run lockfile:check
  echo "Installing dependencies from package-lock.json..."; npm ci
else
  echo "package-lock.json is absent; generating it with strict peer dependency checks..."; npm install
  npm run lockfile:check
fi
echo "Applying database migrations..."; npm run db:migrate
echo "Seeding administrator and portfolio starter content..."; npm run db:seed

echo ""
echo "Setup complete. Start the portfolio with: npm run dev"
echo "Public site: http://localhost:3000"
echo "Admin:       http://localhost:3000/admin/login"
