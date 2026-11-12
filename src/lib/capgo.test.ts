import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { assertCapgoAutoUpdateOff } from "./capgo.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

test("assertCapgoAutoUpdateOff accepts false", () => {
  assert.equal(assertCapgoAutoUpdateOff({ plugins: { CapacitorUpdater: { autoUpdate: false } } }), true);
});

test("assertCapgoAutoUpdateOff rejects true / missing", () => {
  assert.equal(assertCapgoAutoUpdateOff({ plugins: { CapacitorUpdater: { autoUpdate: true } } }), false);
  assert.equal(assertCapgoAutoUpdateOff({}), false);
  assert.equal(assertCapgoAutoUpdateOff({ plugins: {} }), false);
});

test("capacitor.config.ts keeps Capgo autoUpdate off", () => {
  const src = readFileSync(join(root, "capacitor.config.ts"), "utf8");
  assert.match(src, /autoUpdate:\s*false/);
  assert.doesNotMatch(src, /autoUpdate:\s*true/);
});

test("native synced Capgo configs keep autoUpdate off", () => {
  for (const rel of [
    "android/app/src/main/assets/capacitor.config.json",
    "ios/App/App/capacitor.config.json",
  ]) {
    let rawText: string;
    try {
      rawText = readFileSync(join(root, rel), "utf8");
    } catch (err) {
      const code = err && typeof err === "object" && "code" in err ? (err as NodeJS.ErrnoException).code : "";
      if (code === "ENOENT") {
        // Cloud/agent checkouts may omit native sync artifacts until `cap sync`.
        continue;
      }
      throw err;
    }
    const raw = JSON.parse(rawText) as {
      plugins?: { CapacitorUpdater?: { autoUpdate?: boolean } };
    };
    assert.equal(assertCapgoAutoUpdateOff(raw), true, rel);
  }
});
