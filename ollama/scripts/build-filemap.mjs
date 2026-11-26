#!/usr/bin/env node
/**
 * Rebuild ollama/corpus/09-dosya-haritasi.md from the source tree.
 */
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { ROOT, shouldSkip } from "./lib.mjs";

const INDEX_EXT = new Set([".ts", ".tsx", ".js", ".mjs", ".sql", ".md", ".css", ".html"]);
const ROOTS = ["src", "supabase", "docs", "serverless", "api", "scripts", "store", "ollama", ".cursor/skills"];

async function walk(dir, out) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const abs = path.join(dir, entry.name);
    const rel = path.relative(ROOT, abs).split(path.sep).join("/");
    if (shouldSkip(rel)) continue;
    if (entry.isDirectory()) {
      await walk(abs, out);
      continue;
    }
    if (!entry.isFile()) continue;
    if (!INDEX_EXT.has(path.extname(entry.name).toLowerCase())) continue;
    out.push({ abs, rel });
  }
}

function blurb(text) {
  const lines = text.split(/\r?\n/).slice(0, 35);
  const block = lines.join("\n").match(/\/\*\*?([\s\S]*?)\*\//);
  if (block) {
    const line = block[1]
      .split("\n")
      .map((row) => row.replace(/^\s*\*\s?/, "").trim())
      .find((row) => row && !row.startsWith("@"));
    if (line) return clip(line);
  }
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("//")) return clip(trimmed.replace(/^\/\/\s?/, ""));
    if (trimmed.startsWith("--")) return clip(trimmed.replace(/^--\s?/, ""));
    if (trimmed.startsWith("# ")) return clip(trimmed.replace(/^#\s?/, ""));
  }
  return "";
}

function clip(value) {
  const clean = value.replace(/\s+/g, " ").trim();
  if (clean.length <= 96) return clean;
  return `${clean.slice(0, 93)}...`;
}

const files = [];
for (const root of ROOTS) await walk(path.join(ROOT, root), files);
files.push({ abs: path.join(ROOT, "src/routeTree.gen.ts"), rel: "src/routeTree.gen.ts", forced: "Üretilir. Elle düzenlenmez." });
files.sort((a, b) => a.rel.localeCompare(b.rel));

const groups = new Map();
for (const file of files) {
  let info;
  try {
    info = await stat(file.abs);
  } catch {
    continue;
  }
  if (!file.forced && (info.size === 0 || info.size > 400_000)) continue;
  let note = file.forced ?? "";
  if (!note) {
    try {
      note = blurb(await readFile(file.abs, "utf8"));
    } catch {
      note = "";
    }
  }
  const dir = path.posix.dirname(file.rel);
  if (!groups.has(dir)) groups.set(dir, []);
  groups.get(dir).push(`- \`${file.rel}\`${note ? ` — ${note}` : ""}`);
}

const body = [
  "# Dosya haritası",
  "",
  "Bu liste `node ollama/scripts/build-filemap.mjs` ile üretilir. İkili dosyalar, `node_modules`, `dist`, `.env` ve kilit dosyaları yoktur. `android/` ve `ios/` Capacitor kabuğudur; satır indeksi `capacitor.config.ts` ve `docs/STORE_LAUNCH.md` üzerinden gider. `src/routeTree.gen.ts` üretilir.",
  "",
  `Dosya sayısı: ${[...groups.values()].reduce((sum, rows) => sum + rows.length, 0)}.`,
  "",
];
for (const dir of [...groups.keys()].sort()) {
  body.push(`## ${dir}`, "", ...groups.get(dir), "");
}

const out = path.join(ROOT, "ollama/corpus/09-dosya-haritasi.md");
await writeFile(out, body.join("\n"));
console.log(`wrote ${path.relative(ROOT, out)} (${body.length} lines)`);
