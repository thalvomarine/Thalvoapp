import test from "node:test";
import assert from "node:assert/strict";
import { isStaleChunkError } from "./stale-chunk.ts";

test("isStaleChunkError detects MIME-type module failures", () => {
  assert.equal(
    isStaleChunkError(
      new Error(
        "'text/html' is not a valid JavaScript MIME type for module script 'https://thalvo.org/assets/app.services-CRkuScTA.js'.",
      ),
    ),
    true,
  );
});

test("isStaleChunkError detects dynamic import fetch failures", () => {
  assert.equal(
    isStaleChunkError(
      new TypeError(
        "Failed to fetch dynamically imported module: https://thalvo.org/assets/app.services-BThGn-Ds.js",
      ),
    ),
    true,
  );
  assert.equal(
    isStaleChunkError(new Error("error loading dynamically imported module")),
    true,
  );
});

test("isStaleChunkError ignores unrelated errors", () => {
  assert.equal(isStaleChunkError(new Error("Map container not found")), false);
  assert.equal(isStaleChunkError("network offline"), false);
  assert.equal(isStaleChunkError(null), false);
  assert.equal(isStaleChunkError(undefined), false);
});
