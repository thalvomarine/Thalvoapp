import assert from "node:assert/strict";
import test from "node:test";
import { collectHits, redact, shouldSkip, tokenize } from "./lib.mjs";

test("tokenize keeps rpc names and drops filler", () => {
  const tokens = tokenize("Açık SOS hangi RPC ile cancel_own_call edilir?");
  assert.ok(tokens.includes("cancel_own_call"));
  assert.ok(tokens.includes("sos"));
  assert.equal(tokens.includes("hangi"), false);
  assert.equal(tokens.includes("thalvo"), false);
});

test("env files and route tree stay out of the scan", () => {
  assert.equal(shouldSkip(".env"), true);
  assert.equal(shouldSkip(".env.local"), true);
  assert.equal(shouldSkip("secrets/service.json"), true);
  assert.equal(shouldSkip("src/routeTree.gen.ts"), true);
  assert.equal(shouldSkip("src/lib/events.ts"), false);
  assert.equal(shouldSkip("supabase/migrations/20261008143000_cancel_and_live_call.sql"), false);
});

test("redact strips secret-shaped assignments", () => {
  const clean = redact("THALVO_AI_API_KEY=sk-live-example\nsb_secret_abc.def");
  assert.equal(clean.includes("sk-live"), false);
  assert.equal(clean.includes("sb_secret_abc"), false);
  assert.match(clean, /THALVO_AI_API_KEY=\[redacted\]/);
});

test("cancel_own_call resolves to the live-call migration", async () => {
  const { hits } = await collectHits("cancel_own_call açık SOS iptali");
  assert.ok(hits.length > 0);
  assert.ok(
    hits.some((hit) => hit.path.includes("20261008143000_cancel_and_live_call.sql")),
    hits.map((hit) => hit.path).join("\n"),
  );
});

test("a Turkish SOS question still opens the cancel migration", async () => {
  const { hits } = await collectHits("Açık SOS hangi RPC ile iptal edilir?");
  assert.ok(
    hits.some((hit) => hit.path.includes("20261008143000_cancel_and_live_call.sql")),
    hits.map((hit) => hit.path).join("\n"),
  );
});
