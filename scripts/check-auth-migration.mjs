import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const schema = fs.readFileSync(path.join(root, "src/db/schema.ts"), "utf8");
let failed = false;
function fail(message) { console.error(`Schema check failed: ${message}`); failed = true; }

for (const token of ["authSessions", "authAccounts", "authVerifications", "emailVerified"]) {
  if (!schema.includes(token)) fail(`src/db/schema.ts is missing ${token}.`);
}
if (/passwordHash\s*:/.test(schema)) fail("runtime schema still defines users.passwordHash.");

for (const token of [
  "availabilityProfiles",
  "availabilityTargetRoles",
  "availabilityWorkModes",
  "siteProfiles",
  "profileAboutParagraphs",
  "focusAreas",
  "focusAreaTags",
  "skillGroups",
  "skillItems",
  "educationEntries",
  "askStarterPrompts",
  "navigationItems",
  "projectTechnologies",
  "projectMetrics",
  "experienceHighlights",
  "experienceImpactAreas",
]) {
  if (!schema.includes(`export const ${token}`)) fail(`normalized portfolio schema is missing ${token}.`);
}

if (failed) process.exit(1);
console.log("Runtime schema integrity check passed.");
