#!/usr/bin/env node
/**
 * Capacitor writes `capacitor-cordova-android-plugins/src/main/res/.gitkeep`
 * so the empty folder is tracked locally. AGP then treats `.gitkeep` as a
 * file-based resource whose name is empty / invalid ("'" character error).
 * Delete it after every `cap sync`.
 */
import { existsSync, unlinkSync } from "node:fs";
import { join } from "node:path";

const keep = join(
  process.cwd(),
  "android/capacitor-cordova-android-plugins/src/main/res/.gitkeep",
);

if (existsSync(keep)) {
  unlinkSync(keep);
  console.log("[android] removed cordova plugins res/.gitkeep (invalid AAPT name)");
}
