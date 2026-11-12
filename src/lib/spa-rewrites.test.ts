import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

type Rewrite = { source: string; destination: string };

test("vercel SPA rewrites are an allowlist, not a catch-all", () => {
  const raw = JSON.parse(readFileSync(join(root, "vercel.json"), "utf8")) as {
    rewrites?: Rewrite[];
  };
  const rewrites = raw.rewrites ?? [];
  assert.ok(rewrites.length > 0, "expected SPA rewrites");

  for (const rule of rewrites) {
    assert.equal(rule.destination, "/index.html");
    assert.doesNotMatch(
      rule.source,
      /\(\(\?!/,
      `catch-all negative-lookahead rewrite is forbidden: ${rule.source}`,
    );
    assert.doesNotMatch(
      rule.source,
      /^\/\(\.\*\)$/,
      `unscoped wildcard rewrite is forbidden: ${rule.source}`,
    );
  }

  const sources = new Set(rewrites.map((r) => r.source));
  for (const required of ["/", "/chart", "/auth", "/app", "/app/:path*", "/admin"]) {
    assert.ok(sources.has(required), `missing rewrite for ${required}`);
  }
  // Public leaf routes stay exact so /chart/<payload> is HTTP 404.
  assert.ok(!sources.has("/chart/:path*"));
  assert.ok(!sources.has("/chart/(.*)"));
});
