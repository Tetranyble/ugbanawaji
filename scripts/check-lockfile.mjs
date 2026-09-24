import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const packagePath = path.join(root, "package.json");
const lockPath = path.join(root, "package-lock.json");

function fail(message) {
  console.error(`Lockfile check failed: ${message}`);
  process.exitCode = 1;
}

if (!fs.existsSync(lockPath)) {
  fail("package-lock.json is missing. Run npm install on a networked machine and commit the generated lockfile before release.");
  process.exit();
}

const manifest = JSON.parse(fs.readFileSync(packagePath, "utf8"));
const lock = JSON.parse(fs.readFileSync(lockPath, "utf8"));
const rootPackage = lock.packages?.[""];

if (lock.lockfileVersion !== 3) fail(`expected lockfileVersion 3, found ${lock.lockfileVersion ?? "unknown"}.`);
if (!rootPackage) {
  fail("package-lock.json does not contain the root package entry.");
  process.exit();
}

function compareSection(section) {
  const expected = manifest[section] ?? {};
  const actual = rootPackage[section] ?? {};
  const names = new Set([...Object.keys(expected), ...Object.keys(actual)]);

  for (const name of [...names].sort()) {
    if (!(name in expected)) fail(`${name} is present in lockfile root ${section} but not package.json.`);
    else if (!(name in actual)) fail(`${name}@${expected[name]} is missing from lockfile root ${section}.`);
    else if (actual[name] !== expected[name]) {
      fail(`${name} is ${expected[name]} in package.json but ${actual[name]} in package-lock.json.`);
    }
  }
}

compareSection("dependencies");
compareSection("devDependencies");

if (lock.packages?.["node_modules/next-auth"]) fail("legacy next-auth is still present in the resolved dependency graph.");

for (const packagePath of Object.keys(lock.packages ?? {})) {
  if (packagePath.startsWith("node_modules/@auth/")) {
    fail(`legacy Auth.js package ${packagePath.slice("node_modules/".length)} is still present in the resolved dependency graph.`);
  }
}

if (lock.packages?.["node_modules/nodemailer"]) fail("nodemailer must not be present; mail uses the vendor-neutral emailjs SMTP transport.");

for (const name of ["better-auth", "@better-auth/drizzle-adapter"]) {
  const resolved = lock.packages?.[`node_modules/${name}`]?.version;
  const expected = manifest.dependencies?.[name];
  if (!resolved) fail(`${name} is missing from the resolved dependency graph.`);
  else if (expected && resolved !== expected) fail(`${name} resolved to ${resolved}; expected exact version ${expected}.`);
}

if (!process.exitCode) console.log("Lockfile check passed.");
