#!/usr/bin/env node
/**
 * Combined App Store + Play launch preflight.
 * Runs native checklists and verifies paste-ready store package files.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();

const requiredFiles = [
  "docs/STORE_LAUNCH.md",
  "store/listing.tr.md",
  "store/listing.en.md",
  "store/apple-app-privacy.md",
  "store/google-data-safety.md",
  "store/review-notes.md",
  "store/assets/icon-512.png",
  "store/assets/icon-1024.png",
  "store/assets/feature-graphic.png",
  "android/keystore.properties.example",
  "ios/App/App/PrivacyInfo.xcprivacy",
];

console.log("THALVO store launch preflight\n");

let failed = false;
for (const rel of requiredFiles) {
  const ok = existsSync(join(root, rel));
  if (!ok) failed = true;
  console.log(`  ${ok ? "OK" : "FAIL"}  ${rel}`);
}

const infoPlist = readFileSync(join(root, "ios/App/App/Info.plist"), "utf8");
const exportOk = infoPlist.includes("ITSAppUsesNonExemptEncryption");
if (!exportOk) failed = true;
console.log(
  `  ${exportOk ? "OK" : "FAIL"}  Info.plist export compliance key`,
);

const privacyUrl = "https://thalvo.org/privacy";
const termsUrl = "https://thalvo.org/terms";
for (const url of [privacyUrl, termsUrl]) {
  const hit =
    readFileSync(join(root, "docs/STORE_LAUNCH.md"), "utf8").includes(url) &&
    readFileSync(join(root, "store/listing.tr.md"), "utf8").includes(url);
  if (!hit) failed = true;
  console.log(`  ${hit ? "OK" : "FAIL"}  listing references ${url}`);
}

const shotsDir = join(root, "store/assets/screenshots");
const hasShotsDir = existsSync(shotsDir);
const shotReadme = existsSync(join(shotsDir, "README.md"));
console.log(
  `  ${hasShotsDir ? "OK" : "WARN"}  store/assets/screenshots/ (${
    shotReadme
      ? "add device captures before submit"
      : "missing — run npm run store:assets"
  })`,
);

console.log("\n— iOS checklist —");
const ios = spawnSync(process.execPath, ["scripts/ios-release-checklist.mjs"], {
  cwd: root,
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"],
});
process.stdout.write(ios.stdout || "");
if (ios.stderr) process.stderr.write(ios.stderr);
if (ios.status) failed = true;

console.log("\n— Android checklist —");
const android = spawnSync(
  process.execPath,
  ["scripts/android-release-checklist.mjs"],
  {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  },
);
process.stdout.write(android.stdout || "");
if (android.stderr) process.stderr.write(android.stderr);
if (android.status) failed = true;

console.log(
  failed
    ? "\nStore preflight failed — fix FAIL lines before Archive / AAB."
    : "\nStore preflight passed. Capture screenshots, wait for Apple Active, then upload.",
);
if (failed) process.exitCode = 1;
