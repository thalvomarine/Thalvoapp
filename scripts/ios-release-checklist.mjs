#!/usr/bin/env node
/**
 * Preflight for cutting / installing Thalvo MarineOS on a Mac.
 * This Linux Cloud Agent can build the web SPA and `cap sync ios`, but cannot
 * run Xcode, codesign, or install to a device/TestFlight.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const pbx = readFileSync(join(root, "ios/App/App.xcodeproj/project.pbxproj"), "utf8");
const marketing = /MARKETING_VERSION = ([^;]+);/.exec(pbx)?.[1] ?? "?";
const build = /CURRENT_PROJECT_VERSION = ([^;]+);/.exec(pbx)?.[1] ?? "?";
const team = /DEVELOPMENT_TEAM = ([^;]+);/.exec(pbx)?.[1] ?? "(missing)";
const publicIndex = existsSync(join(root, "ios/App/App/public/index.html"));
const infoPlist = readFileSync(join(root, "ios/App/App/Info.plist"), "utf8");
const camera = infoPlist.includes("NSCameraUsageDescription");
const exportCompliance = infoPlist.includes("ITSAppUsesNonExemptEncryption");
const privacyManifest = existsSync(join(root, "ios/App/App/PrivacyInfo.xcprivacy"));
const capConfigPath = join(root, "ios/App/App/capacitor.config.json");
let autoUpdate = "(not synced)";
let capgoSafe = true;
if (existsSync(capConfigPath)) {
  const capConfig = JSON.parse(readFileSync(capConfigPath, "utf8"));
  autoUpdate = capConfig?.plugins?.CapacitorUpdater?.autoUpdate;
  capgoSafe = autoUpdate === false;
}

console.log("THALVO iOS release preflight");
console.log(`  version: ${marketing} (${build})`);
console.log(`  team:    ${team}`);
console.log(`  bundle:  com.thalvo.marineos`);
console.log(`  public/: ${publicIndex ? "synced" : "MISSING — run npm run build && npx cap sync ios"}`);
console.log(`  camera:  ${camera ? "Info.plist OK" : "MISSING privacy string"}`);
console.log(`  export:  ${exportCompliance ? "ITSAppUsesNonExemptEncryption set" : "MISSING export compliance key"}`);
console.log(`  privacy: ${privacyManifest ? "PrivacyInfo.xcprivacy present" : "MISSING PrivacyInfo.xcprivacy"}`);
console.log(
  `  Capgo:   autoUpdate=${String(autoUpdate)} ${
    autoUpdate === "(not synced)"
      ? "(run build:mobile before Archive)"
      : capgoSafe
        ? "(safe — leave off until verified OTA)"
        : "⚠ MUST be false until a production bundle is verified"
  }`,
);
console.log("");
console.log("On a Mac with Xcode + your Apple team:");
console.log("  1) Wait until Apple Developer membership is Active (Enrollment Pending blocks Connect)");
console.log("  2) git pull && npm ci && npm run build:mobile && npm run store:preflight");
console.log("  3) npx cap open ios");
console.log("  4) Signing → your Individual team (replace stale DEVELOPMENT_TEAM if needed)");
console.log("  5) Any iOS Device → Product → Archive → TestFlight / App Store Connect");
console.log("  6) Paste store/listing.*.md, store/apple-app-privacy.md, store/review-notes.md");
console.log("");
console.log("OTA (optional, needs CAPGO_API_KEY) — do not enable autoUpdate first:");
console.log("  npx @capgo/cli login");
console.log("  npx @capgo/cli bundle upload com.thalvo.marineos --path dist --channel production --bundle " + marketing);
console.log("  (only then set CapacitorUpdater.autoUpdate=true after the uploaded bundle is verified)");
console.log("Full gate list: docs/STORE_LAUNCH.md");
if ((!capgoSafe && autoUpdate !== "(not synced)") || !exportCompliance || !privacyManifest) {
  process.exitCode = 1;
}
