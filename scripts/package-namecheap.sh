#!/usr/bin/env bash
set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
artifact_dir="$project_root/release/namecheap"
artifact_path="$artifact_dir/ugbanawaji-cpanel.zip"
stage_dir="$(mktemp -d)"

cleanup() {
  rm -rf "$stage_dir"
}
trap cleanup EXIT

cd "$project_root"

if [[ -f next.config.js || -f next.config.mjs ]]; then
  echo "Multiple Next.js config files detected. Keep next.config.ts as the single source of truth."
  exit 1
fi

echo "Validating dependency lockfile..."
npm run lockfile:check

if [[ ! -f .next/standalone/server.js || ! -f .next/standalone/.next/BUILD_ID ]]; then
  echo "No standalone production build found. Run npm run deploy:namecheap."
  exit 1
fi

if [[ ! -f .next/standalone/node_modules/next/dist/compiled/cookie/index.js ]]; then
  echo "Standalone runtime is incomplete: Next's compiled cookie module is missing."
  exit 1
fi

mkdir -p "$artifact_dir" "$stage_dir/app/runtime/.next"

for file in package.json package-lock.json .npmrc .nvmrc server.js next.config.ts postcss.config.mjs tsconfig.json drizzle.config.ts .env.production.example; do
  cp "$file" "$stage_dir/app/$file"
done

cp -R public drizzle scripts src "$stage_dir/app/"
rsync -a \
  --exclude node_modules/sharp \
  --exclude node_modules/@img \
  .next/standalone/ "$stage_dir/app/runtime/"
rsync -a --delete public/ "$stage_dir/app/runtime/public/"
rsync -a --delete .next/static/ "$stage_dir/app/runtime/.next/static/"

for required in \
  runtime/server.js \
  runtime/.next/BUILD_ID \
  runtime/node_modules/next/dist/compiled/cookie/index.js \
  runtime/public/leonard-ekenekiso.jpg \
  runtime/.next/server/app/favicon.ico.body; do
  if [[ ! -f "$stage_dir/app/$required" ]]; then
    echo "Packaged standalone runtime is missing $required"
    exit 1
  fi
done

rm -f "$artifact_path"
(
  cd "$stage_dir/app"
  zip -qry "$artifact_path" .
)

echo "Created $artifact_path"
du -h "$artifact_path"
