#!/usr/bin/env node
/**
 * Remove illegal Android resource filenames that AGP 8+/9 reject.
 *
 * Capacitor plugins (cordova bridge, keep-awake, Capgo updater, …) often ship
 * `src/main/res/.gitkeep`. AAPT then fails with:
 *   ' ' is not a valid file-based resource name character
 *
 * `android/build.gradle` also strips these in mergeResources doFirst so
 * Android Studio Run works even after a fresh `npm ci`.
 */
import { existsSync, readdirSync, statSync, unlinkSync } from "node:fs";
import { join } from "node:path";

const roots = [
  "android/capacitor-cordova-android-plugins/src/main/res",
  "node_modules/@capacitor-community/keep-awake/android/src/main/res",
  "node_modules/@capgo/capacitor-updater/android/src/main/res",
  "node_modules/@capacitor/app/android/src/main/res",
  "node_modules/@capacitor/status-bar/android/src/main/res",
  "node_modules/@capacitor/android/capacitor/src/main/res",
];

function walk(dir) {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      walk(full);
      continue;
    }
    const base = name.includes(".") ? name.slice(0, name.lastIndexOf(".")) : name;
    if (name === ".gitkeep" || !/^[a-z0-9_]+$/.test(base)) {
      unlinkSync(full);
      console.log("[android] removed invalid res file:", full);
    }
  }
}

for (const rel of roots) walk(join(process.cwd(), rel));
