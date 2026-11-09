#!/usr/bin/env node
/**
 * Preflight for Google Play AAB uploads.
 * This environment can assemble Gradle when the SDK is present; signing keys
 * stay on the maintainer machine (see android/keystore.properties.example).
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const gradle = readFileSync(join(root, "android/app/build.gradle"), "utf8");
const manifest = readFileSync(
  join(root, "android/app/src/main/AndroidManifest.xml"),
  "utf8",
);
const strings = readFileSync(
  join(root, "android/app/src/main/res/values/strings.xml"),
  "utf8",
);
const variables = readFileSync(join(root, "android/variables.gradle"), "utf8");

const applicationId = /applicationId\s+"([^"]+)"/.exec(gradle)?.[1] ?? "?";
const versionName = /versionName\s+"([^"]+)"/.exec(gradle)?.[1] ?? "?";
const versionCode = /versionCode\s+(\d+)/.exec(gradle)?.[1] ?? "?";
const targetSdk = /targetSdkVersion\s*=\s*(\d+)/.exec(variables)?.[1] ?? "?";
const appName = /name="app_name">([^<]+)</.exec(strings)?.[1] ?? "?";
const hasLocation = manifest.includes("ACCESS_FINE_LOCATION");
const hasCamera = manifest.includes("android.permission.CAMERA");
const hasInternet = manifest.includes("android.permission.INTERNET");
const publicIndex = existsSync(
  join(root, "android/app/src/main/assets/public/index.html"),
);
const keystoreProps = existsSync(join(root, "android/keystore.properties"));
const signingWired = /signingConfigs/.test(gradle) && /storeFile/.test(gradle);

const capPath = join(root, "android/app/src/main/assets/capacitor.config.json");
let autoUpdate = "(missing — run cap sync)";
let capgoSafe = false;
if (existsSync(capPath)) {
  const capConfig = JSON.parse(readFileSync(capPath, "utf8"));
  autoUpdate = capConfig?.plugins?.CapacitorUpdater?.autoUpdate;
  capgoSafe = autoUpdate === false;
}

let failed = false;
function check(ok, label, detail) {
  const mark = ok ? "OK" : "FAIL";
  if (!ok) failed = true;
  console.log(`  ${mark.padEnd(4)} ${label}${detail ? ` — ${detail}` : ""}`);
}

console.log("THALVO Android release preflight");
console.log(`  app:     ${appName}`);
console.log(`  id:      ${applicationId}`);
console.log(`  version: ${versionName} (${versionCode})`);
console.log(`  target:  SDK ${targetSdk}`);
console.log("");

check(applicationId === "com.thalvo.marineos", "applicationId", applicationId);
check(hasInternet, "INTERNET permission");
check(hasLocation, "location permissions");
check(hasCamera, "CAMERA permission");
if (publicIndex) {
  check(true, "synced web assets", "assets/public");
} else {
  console.log("  WARN synced web assets — run npm run build:mobile before AAB");
}
if (autoUpdate === "(missing — run cap sync)") {
  console.log(`  WARN Capgo autoUpdate — ${autoUpdate}`);
} else {
  check(capgoSafe, "Capgo autoUpdate", `autoUpdate=${String(autoUpdate)}`);
}
if (keystoreProps && signingWired) {
  check(true, "upload keystore", "keystore.properties present");
} else {
  console.log(
    "  WARN copy android/keystore.properties.example before npm run android:bundle",
  );
}

console.log("");
console.log("Play Console upload:");
console.log("  1) npm run build:mobile");
console.log("  2) Fill android/keystore.properties from the example");
console.log("  3) npm run android:bundle");
console.log("  4) Upload android/app/build/outputs/bundle/release/app-release.aab");
console.log("  5) Paste store/listing.*.md + store/google-data-safety.md");
console.log("");
console.log("See docs/STORE_LAUNCH.md for the full gate list.");

if (failed) process.exitCode = 1;
