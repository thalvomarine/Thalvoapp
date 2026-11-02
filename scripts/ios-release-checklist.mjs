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
const camera = readFileSync(join(root, "ios/App/App/Info.plist"), "utf8").includes(
  "NSCameraUsageDescription",
);

console.log("THALVO iOS release preflight");
console.log(`  version: ${marketing} (${build})`);
console.log(`  team:    ${team}`);
console.log(`  bundle:  com.thalvo.marineos`);
console.log(`  public/: ${publicIndex ? "synced" : "MISSING — run npm run build && npx cap sync ios"}`);
console.log(`  camera:  ${camera ? "Info.plist OK" : "MISSING privacy string"}`);
console.log("");
console.log("On a Mac with Xcode + your Apple team:");
console.log("  1) git pull && npm ci && npm run build:mobile");
console.log("  2) npx cap open ios");
console.log("  3) Select a device or Any iOS Device → Product → Archive");
console.log("  4) Distribute to TestFlight (or Run on a paired iPhone)");
console.log("");
console.log("OTA (optional, needs CAPGO_API_KEY):");
console.log("  npx @capgo/cli login");
console.log("  npx @capgo/cli bundle upload com.thalvo.marineos --path dist --channel production --bundle " + marketing);
console.log("  (also set CapacitorUpdater.autoUpdate=true once the uploaded bundle is verified)");
