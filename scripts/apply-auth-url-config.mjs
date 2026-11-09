#!/usr/bin/env node
/**
 * Patch hosted Supabase Auth URL + confirmation email branding.
 *
 * Requires a personal access token with auth_config_write:
 *   https://supabase.com/dashboard/account/tokens
 *
 * Usage:
 *   SUPABASE_ACCESS_TOKEN=sbp_… node scripts/apply-auth-url-config.mjs
 *   SUPABASE_ACCESS_TOKEN=sbp_… node scripts/apply-auth-url-config.mjs --dry-run
 *
 * Fixes the live Site URL stuck on http://localhost:3000 (confirmation
 * links were redirecting there) and installs THALVO-branded mail subjects
 * / bodies. Custom SMTP is still required to change the From address away
 * from noreply@mail.app.supabase.io.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || "vofjektddsxmavghlerj";
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const dryRun = process.argv.includes("--dry-run");

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const confirmHtml = readFileSync(join(root, "supabase/templates/confirm.html"), "utf8");
const recoveryHtml = readFileSync(join(root, "supabase/templates/recovery.html"), "utf8");

const ALLOW_LIST = [
  "https://thalvo.org",
  "https://thalvo.org/**",
  "https://www.thalvo.org",
  "https://www.thalvo.org/**",
  "http://localhost:8080/**",
  "http://127.0.0.1:8080/**",
].join(",");

const payload = {
  site_url: "https://thalvo.org",
  uri_allow_list: ALLOW_LIST,
  mailer_subjects_confirmation: "THALVO — e-postanı onayla",
  mailer_templates_confirmation_content: confirmHtml,
  mailer_subjects_recovery: "THALVO — şifreni yenile",
  mailer_templates_recovery_content: recoveryHtml,
  mailer_subjects_magic_link: "THALVO — giriş bağlantın",
  mailer_subjects_email_change: "THALVO — yeni e-postanı onayla",
};

const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`;
const summary = {
  ...payload,
  mailer_templates_confirmation_content: `[${confirmHtml.length} chars]`,
  mailer_templates_recovery_content: `[${recoveryHtml.length} chars]`,
};

if (dryRun) {
  console.log("DRY RUN — would PATCH", url);
  console.log(JSON.stringify(summary, null, 2));
  process.exit(0);
}

if (!TOKEN) {
  console.error(
    [
      "Missing SUPABASE_ACCESS_TOKEN.",
      "",
      "1. Create a token at https://supabase.com/dashboard/account/tokens",
      "2. Or set Site URL manually:",
      "   https://supabase.com/dashboard/project/vofjektddsxmavghlerj/auth/url-configuration",
      "   Site URL → https://thalvo.org",
      "   Redirect URLs → https://thalvo.org/**  (+ localhost:8080/** for local)",
      "",
      "Payload that would be applied:",
      JSON.stringify(summary, null, 2),
    ].join("\n"),
  );
  process.exit(1);
}

const res = await fetch(url, {
  method: "PATCH",
  headers: {
    Authorization: `Bearer ${TOKEN}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(payload),
});

const text = await res.text();
if (!res.ok) {
  console.error(`PATCH failed (${res.status}):`, text.slice(0, 2000));
  process.exit(1);
}

let parsed;
try {
  parsed = JSON.parse(text);
} catch {
  parsed = text;
}

console.log("Auth URL config updated.");
console.log(
  JSON.stringify(
    {
      site_url: parsed?.site_url,
      uri_allow_list: parsed?.uri_allow_list,
      mailer_subjects_confirmation: parsed?.mailer_subjects_confirmation,
      mailer_subjects_recovery: parsed?.mailer_subjects_recovery,
    },
    null,
    2,
  ),
);
