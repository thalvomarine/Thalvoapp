#!/usr/bin/env node
/**
 * Capacitor writes `capacitor-cordova-android-plugins/src/main/res/.gitkeep`
 * so the empty folder exists after sync. AGP then treats `.gitkeep` as a
 * file-based resource with an empty/invalid name (apostrophe / quote error
 * in mergeResources). Delete invalid names after every `cap sync`.
 *
 * `android/build.gradle` also strips these before mergeResources so Android
 * Studio Run works even without re-running this script.
 */
import { existsSync, readdirSync, statSync, unlinkSync } from "node:fs";
import { join } from "node:path";

const resRoot = join(
  process.cwd(),
  "android/capacitor-cordova-android-plugins/src/main/res",
);

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
      console.log("[android] removed invalid cordova res file:", full);
    }
  }
}

walk(resRoot);
