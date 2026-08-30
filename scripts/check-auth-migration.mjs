import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
let failed = false;

function fail(message) {
  console.error(`Auth migration check failed: ${message}`);
  failed = true;
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

const schema = read("src/db/schema.ts");
const baseline = read("drizzle/0000_release_baseline.sql");
const journal = JSON.parse(read("drizzle/meta/_journal.json"));
const baselineSnapshot = JSON.parse(read("drizzle/meta/0000_snapshot.json"));

for (const token of ["authSessions", "authAccounts", "authVerifications", "emailVerified"]) {
  if (!schema.includes(token)) fail(`src/db/schema.ts is missing ${token}.`);
}
if (/passwordHash\s*:/.test(schema)) fail("runtime schema still defines users.passwordHash.");

const requiredBaselineFragments = [
  "CREATE TABLE `users`",
  "`email_verified` boolean NOT NULL DEFAULT false",
  "`image` varchar(700)",
  "CREATE TABLE `auth_sessions`",
  "CREATE TABLE `auth_accounts`",
  "CREATE TABLE `auth_verifications`",
  "UNIQUE(`issuer`,`account_id`)",
];
for (const fragment of requiredBaselineFragments) {
  if (!baseline.includes(fragment)) fail(`drizzle/0000_release_baseline.sql is missing ${fragment}.`);
}

for (const forbidden of ["password_hash", "ALTER TABLE `users`", "INSERT INTO `auth_accounts`"]) {
  if (baseline.includes(forbidden)) fail(`squashed baseline must not contain ${forbidden}.`);
}
const columnPatch = baseline
  .split("--> statement-breakpoint")
  .map((statement) => statement.trim())
  .find((statement) => /^ALTER TABLE\b[\s\S]*\b(?:ADD|DROP|MODIFY|CHANGE)\s+(?!CONSTRAINT\b)/i.test(statement));
if (columnPatch) {
  fail("development baseline contains an incremental column patch; regenerate 0000 from the final schema instead.");
}

if (baselineSnapshot.prevId !== "00000000-0000-0000-0000-000000000000") {
  fail("0000_snapshot.json must be a root snapshot.");
}
if (baselineSnapshot.dialect !== "mysql") {
  fail("Drizzle baseline snapshot must remain a MySQL snapshot.");
}
for (const table of ["users", "auth_sessions", "auth_accounts", "auth_verifications"]) {
  if (!baselineSnapshot.tables?.[table]) fail(`0000_snapshot.json is missing ${table}.`);
}
for (const column of ["email_verified", "image"]) {
  if (!baselineSnapshot.tables?.users?.columns?.[column]) fail(`0000_snapshot.json users table is missing ${column}.`);
}
if (baselineSnapshot.tables?.users?.columns?.password_hash) {
  fail("0000_snapshot.json still contains users.password_hash.");
}

const entries = journal.entries ?? [];
if (entries.length !== 1 || entries[0]?.idx !== 0 || entries[0]?.tag !== "0000_release_baseline") {
  fail("Drizzle journal must contain only the squashed 0000_release_baseline entry.");
}
if (fs.existsSync(path.join(root, "drizzle/0001_better_auth.sql")) || fs.existsSync(path.join(root, "drizzle/meta/0001_snapshot.json"))) {
  fail("incremental Better Auth migration artifacts must be removed after squashing.");
}

if (failed) process.exit(1);
console.log("Auth migration check passed.");
