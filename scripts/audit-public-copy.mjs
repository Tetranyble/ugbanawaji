import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const roots = ["src/app", "src/components/site", "src/components/newsletter"];
const explicitFiles = ["src/lib/knowledge-base.ts", "src/lib/content.ts"];
const excluded = [
  `${path.sep}admin${path.sep}`,
  `${path.sep}api${path.sep}`,
];

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const files = [
  ...roots.flatMap((dir) => walk(path.join(root, dir))),
  ...explicitFiles.map((file) => path.join(root, file)),
].filter((file) => /\.(ts|tsx)$/.test(file) && !excluded.some((part) => file.includes(part)));

const violations = [];
for (const file of files) {
  const source = fs.readFileSync(file, "utf8");
  const rel = path.relative(root, file);
  const lines = source.split(/\r?\n/);
  lines.forEach((line, index) => {
    const n = index + 1;
    // Raw user-facing JSX text should come from DB-backed variables/records.
    if (/<([A-Za-z][A-Za-z0-9.]*)\b[^>]*>\s*[A-Za-z][^<{]*<\/\1>/.test(line)) {
      violations.push(`${rel}:${n}: raw JSX text`);
    }
    // Accessibility/form copy must not be hard-coded in public components.
    if (/\b(?:aria-label|placeholder|alt|title)=["'][^"']*[A-Za-z][^"']*["']/.test(line)) {
      violations.push(`${rel}:${n}: literal public attribute text`);
    }
    // Search/AI result labels are visible in the UI and must be DB-backed.
    if ((rel.endsWith("knowledge-base.ts") || rel.endsWith("platform-data.ts")) && /\blabel:\s*["'][A-Za-z]/.test(line)) {
      violations.push(`${rel}:${n}: literal result label`);
    }
    // Sanitizers must preserve authored alt copy or use an empty decorative alt, not invent UI copy.
    if (rel.endsWith("content.ts") && /\balt:\s*[^,]+\|\|\s*["'][^"']*[A-Za-z]/.test(line)) {
      violations.push(`${rel}:${n}: hard-coded image alt fallback`);
    }
  });
}

if (violations.length) {
  console.error("Public copy audit failed. Move the following public-facing text into database-backed content:");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log(`Public copy audit passed (${files.length} source files checked).`);
