#!/usr/bin/env node
/**
 * Bundle Vercel /api handlers to CommonJS so production does not depend on
 * TypeScript path aliases (`@/*`) or ESM `type: module` at the function edge.
 */
import { build } from "esbuild";
import { mkdirSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "api");
const entries = [
  { src: join(root, "serverless", "chat.ts"), name: "chat" },
  { src: join(root, "serverless", "assistant.ts"), name: "assistant" },
];

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "package.json"), JSON.stringify({ type: "commonjs" }, null, 2) + "\n");

for (const entry of entries) {
  if (!existsSync(entry.src)) {
    console.error(`[bundle-api] missing ${entry.src}`);
    process.exit(1);
  }
  const outfile = join(outDir, `${entry.name}.js`);
  await build({
    entryPoints: [entry.src],
    outfile,
    bundle: true,
    platform: "node",
    target: "node20",
    format: "cjs",
    legalComments: "none",
    sourcemap: false,
    logLevel: "info",
    alias: { "@": join(root, "src") },
    // Ensure Vercel sees a function export, not only `.default`.
    footer: {
      js: "module.exports = module.exports.default || module.exports;",
    },
  });
  console.log(`[bundle-api] wrote ${outfile}`);
}

// Drop any leftover TypeScript API sources so Vercel does not dual-build them.
for (const name of ["chat.ts", "assistant.ts"]) {
  const leftover = join(outDir, name);
  if (existsSync(leftover)) {
    rmSync(leftover);
    console.log(`[bundle-api] removed ${leftover}`);
  }
}
