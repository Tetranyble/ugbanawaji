import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const buildDependencies = [
  "@tailwindcss/postcss",
  "tailwindcss",
  "typescript",
];

const missingDependencies = buildDependencies.filter((dependency) => {
  try {
    require.resolve(dependency);
    return false;
  } catch {
    return true;
  }
});

if (missingDependencies.length > 0) {
  console.error(
    [
      "Cannot build because required build dependencies are missing:",
      ...missingDependencies.map((dependency) => `  - ${dependency}`),
      "",
      "Install the complete locked dependency set with:",
      "  npm ci --include=dev",
      "",
      "For a normal Namecheap deployment, upload the locally built cPanel archive instead of rebuilding on the server.",
    ].join("\n"),
  );
  process.exit(1);
}
