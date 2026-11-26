/**
 * Shared scan helpers for the local Ollama pack.
 * Reads the Thalvo tree. Never opens env files or secret-shaped names.
 */
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

export const ROOT = path.resolve(import.meta.dirname, "../..");

const SKIP_DIRS = new Set([
  "node_modules",
  "dist",
  "dist-ssr",
  ".output",
  ".git",
  ".tanstack",
  ".nitro",
  ".vinxi",
  ".vercel",
  ".tmp",
  "coverage",
  "Pods",
  ".gradle",
  "build",
  "DerivedData",
]);

const SKIP_EXT = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".ico",
  ".pdf",
  ".mp4",
  ".zip",
  ".jar",
  ".aar",
  ".so",
  ".dylib",
  ".lock",
  ".map",
]);

const TEXT_EXT = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".mjs",
  ".sql",
  ".md",
  ".css",
  ".json",
  ".html",
  ".txt",
]);

const STOP = new Set([
  "bir",
  "icin",
  "için",
  "ile",
  "olan",
  "gibi",
  "nasil",
  "nasıl",
  "nedir",
  "the",
  "and",
  "for",
  "how",
  "what",
  "kod",
  "kodu",
  "thalvo",
  "marineos",
  "dosya",
  "nerede",
  "hangi",
]);

const SEARCH_ROOTS = [
  "src",
  "supabase",
  "docs",
  "serverless",
  "api",
  "scripts",
  "store",
  "ollama",
  ".cursor/skills",
];

export function shouldSkip(relPath) {
  const rel = relPath.split(path.sep).join("/");
  const base = path.posix.basename(rel);
  if (base === ".env" || base.startsWith(".env.") || base.endsWith(".local")) return true;
  if (/(^|\/)(credentials|secrets?)(\/|$)/i.test(rel)) return true;
  if (/\.(pem|p12|jks|keystore)$/i.test(base)) return true;
  if (base === "package-lock.json" || base === "routeTree.gen.ts") return true;
  const parts = rel.split("/");
  if (parts.some((part) => SKIP_DIRS.has(part))) return true;
  const ext = path.posix.extname(base).toLowerCase();
  if (SKIP_EXT.has(ext)) return true;
  return false;
}

export function tokenize(question) {
  const raw = String(question ?? "").toLocaleLowerCase("tr");
  const parts = raw.match(/[\p{L}\p{N}_.:/-]+/gu) ?? [];
  const tokens = [];
  for (const part of parts) {
    const token = part.replace(/^[^a-z0-9çğıöşü]+|[^a-z0-9çğıöşü]+$/giu, "");
    if (token.length < 3) continue;
    if (STOP.has(token)) continue;
    if (!tokens.includes(token)) tokens.push(token);
  }
  return tokens;
}

export function redact(text) {
  return String(text)
    .replace(/sb_secret_[A-Za-z0-9._-]+/g, "sb_secret_[redacted]")
    .replace(/sbp_[A-Za-z0-9]+/g, "sbp_[redacted]")
    .replace(/eyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g, "[jwt]")
    .replace(
      /(SERVICE_ROLE_KEY|SUPABASE_ACCESS_TOKEN|THALVO_AI_API_KEY|PUBLISHABLE_KEY|ANON_KEY)\s*=\s*\S+/gi,
      "$1=[redacted]",
    );
}

async function walk(dir, out) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const abs = path.join(dir, entry.name);
    const rel = path.relative(ROOT, abs);
    if (shouldSkip(rel)) continue;
    if (entry.isDirectory()) {
      await walk(abs, out);
      continue;
    }
    if (!entry.isFile()) continue;
    const ext = path.extname(entry.name).toLowerCase();
    if (!TEXT_EXT.has(ext)) continue;
    out.push({ abs, rel: rel.split(path.sep).join("/") });
  }
}

function countToken(hay, token) {
  const ident = token.includes("_");
  let hits = 0;
  if (ident) {
    let from = 0;
    while (hits < 8) {
      const at = hay.indexOf(token, from);
      if (at < 0) break;
      hits += 1;
      from = at + token.length;
    }
    return hits;
  }
  const pattern = new RegExp(
    `(?:^|[^\\p{L}\\p{N}_])${token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:$|[^\\p{L}\\p{N}_])`,
    "gu",
  );
  while (hits < 6 && pattern.exec(hay)) hits += 1;
  return hits;
}

function pathHit(rel, token) {
  const parts = rel.toLocaleLowerCase("tr").split(/[^a-z0-9çğıöşü]+/i);
  return parts.some((part) => part === token || part.startsWith(`${token}_`) || part.endsWith(`_${token}`));
}

function scoreText(rel, text, tokens) {
  const hay = text.toLocaleLowerCase("tr");
  let score = 0;
  for (const token of tokens) {
    if (pathHit(rel, token)) score += 16;
    const hits = countToken(hay, token);
    if (token.includes("_")) score += (hits > 0 ? 28 : 0) + hits * 4;
    else score += hits;
  }
  return score;
}

function windows(text, tokens, maxLines) {
  const lines = text.split(/\r?\n/);
  const lower = lines.map((line) => line.toLocaleLowerCase("tr"));
  const hot = [];
  for (let i = 0; i < lower.length; i += 1) {
    if (tokens.some((token) => lower[i].includes(token))) hot.push(i);
  }
  if (hot.length === 0) return "";
  const ranges = [];
  for (const line of hot) {
    const start = Math.max(0, line - 1);
    const end = Math.min(lines.length - 1, line + 1);
    const last = ranges[ranges.length - 1];
    if (last && start <= last.end + 1) last.end = Math.max(last.end, end);
    else ranges.push({ start, end });
    if (ranges.length === 4) break;
  }
  const chunks = [];
  let used = 0;
  for (const range of ranges) {
    const slice = lines.slice(range.start, range.end + 1);
    const block = slice.map((line, index) => `${range.start + index + 1}| ${line}`).join("\n");
    if (used + block.length > maxLines) break;
    chunks.push(block);
    used += block.length;
  }
  return chunks.join("\n…\n");
}

export async function collectHits(question, { limit = 6, fileCap = 180_000 } = {}) {
  const tokens = tokenize(question);
  if (tokens.length === 0) return { tokens, hits: [] };
  const files = [];
  for (const root of SEARCH_ROOTS) await walk(path.join(ROOT, root), files);
  const catalog = [];
  for (const file of files) {
    let info;
    try {
      info = await stat(file.abs);
    } catch {
      continue;
    }
    if (info.size > fileCap || info.size === 0) continue;
    let text;
    try {
      text = await readFile(file.abs, "utf8");
    } catch {
      continue;
    }
    const score = scoreText(file.rel, text, tokens);
    catalog.push({ ...file, score, text });
  }
  const ranked = catalog.filter((hit) => hit.score > 0);
  ranked.sort((a, b) => b.score - a.score || a.rel.localeCompare(b.rel));
  const seeds = ranked
    .filter((hit) => hit.rel.startsWith("ollama/") || hit.rel.startsWith("docs/") || hit.rel.includes("SKILL.md"))
    .slice(0, 3);
  const strong = tokens.filter((token) => token.length >= 4);
  const extra = [];
  for (const seed of seeds) {
    for (const line of seed.text.split("\n")) {
      const lower = line.toLocaleLowerCase("tr");
      const matched = strong.filter((token) => lower.includes(token));
      if (matched.length < 2) continue;
      for (const match of line.matchAll(/`([a-z][a-z0-9]*_[a-z0-9_]{8,})/g)) {
        const name = match[1];
        if (name.length < 12 || tokens.includes(name) || extra.includes(name)) continue;
        extra.push(name);
        if (extra.length === 4) break;
      }
      if (extra.length === 4) break;
    }
    if (extra.length === 4) break;
  }
  if (extra.length > 0) {
    for (const hit of catalog) {
      let bonus = 0;
      for (const token of extra) {
        if (!hit.text.includes(token)) continue;
        bonus += 36;
        if (hit.rel.endsWith(".sql")) bonus += 12;
      }
      hit.score += bonus;
    }
  }
  const pool = catalog.filter((hit) => hit.score > 0);
  pool.sort((a, b) => b.score - a.score || a.rel.localeCompare(b.rel));
  const source = pool.filter((hit) => !hit.rel.startsWith("ollama/"));
  const guide = pool.filter((hit) => hit.rel.startsWith("ollama/"));
  const picked = source.slice(0, Math.max(1, limit - 1));
  for (const hit of guide) {
    if (picked.length >= limit) break;
    picked.push(hit);
  }
  const shown = extra.length > 0 ? [...tokens, ...extra.slice(0, 4)] : tokens;
  const windowTokens = extra.length > 0 ? [...tokens, ...extra] : tokens;
  const hits = picked.map((hit) => ({
    path: hit.rel,
    score: hit.score,
    excerpt: redact(windows(hit.text, windowTokens, 3500)),
  }));
  return { tokens: shown, hits };
}

export async function readSystem() {
  const abs = path.join(ROOT, "ollama", "SYSTEM.md");
  return redact(await readFile(abs, "utf8"));
}

export function renderPrompt(question, system, tokens, hits) {
  const blocks = hits
    .filter((hit) => hit.excerpt)
    .map((hit) => `## ${hit.path}\n${hit.excerpt}`)
    .join("\n\n");
  return [
    system.trim(),
    "",
    "# Eşleşen kaynak",
    tokens.length ? `Anahtarlar: ${tokens.join(", ")}` : "Anahtar çıkmadı.",
    "",
    blocks || "(Bu soru için dosya penceresi bulunamadı. Corpus ve SYSTEM yeterliyse cevapla; değilse hangi dosyanın açılacağını söyle.)",
    "",
    "# Soru",
    String(question).trim(),
    "",
    "Cevabı kullanıcının dilinde ver. Dosya yolu yaz. Uydurma.",
    "",
  ].join("\n");
}
