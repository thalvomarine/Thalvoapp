#!/usr/bin/env node
/**
 * Patch hosted Supabase Auth URL, confirmation email branding, and optional SMTP.
 *
 * Requires a personal access token with auth_config_write:
 *   https://supabase.com/dashboard/account/tokens
 *
 * Usage:
 *   SUPABASE_ACCESS_TOKEN=sbp_… node scripts/apply-auth-url-config.mjs
 *   SUPABASE_ACCESS_TOKEN=sbp_… node scripts/apply-auth-url-config.mjs --dry-run
 *
 * Optional SMTP (changes From away from noreply@mail.app.supabase.io):
 *   SMTP_HOST=smtp.resend.com
 *   SMTP_PORT=465
 *   SMTP_USER=resend
 *   SMTP_PASS=re_…
 *   SMTP_ADMIN_EMAIL=noreply@thalvo.org
 *   SMTP_SENDER_NAME=THALVO
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || "vofjektddsxmavghlerj";
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const dryRun = process.argv.includes("--dry-run");
const templatesOnly = process.argv.includes("--templates-only");

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
  mailer_subjects_confirmation: "THALVO — e-postanı onayla",
  mailer_templates_confirmation_content: confirmHtml,
  mailer_subjects_recovery: "THALVO — şifreni yenile",
  mailer_templates_recovery_content: recoveryHtml,
  mailer_subjects_magic_link: "THALVO — giriş bağlantın",
  mailer_subjects_email_change: "THALVO — yeni e-postanı onayla",
};

if (!templatesOnly) {
  payload.site_url = "https://thalvo.org";
  payload.uri_allow_list = ALLOW_LIST;
}

const smtpHost = process.env.SMTP_HOST?.trim();
const smtpUser = process.env.SMTP_USER?.trim();
const smtpPass = process.env.SMTP_PASS?.trim();
const smtpAdmin = process.env.SMTP_ADMIN_EMAIL?.trim();
const smtpPort = (process.env.SMTP_PORT || "465").trim();
const smtpSender = (process.env.SMTP_SENDER_NAME || "THALVO").trim();

const smtpReady = Boolean(smtpHost && smtpUser && smtpPass && smtpAdmin);
if (smtpReady) {
  Object.assign(payload, {
    external_email_enabled: true,
    smtp_host: smtpHost,
    smtp_port: smtpPort,
    smtp_user: smtpUser,
    smtp_pass: smtpPass,
    smtp_admin_email: smtpAdmin,
    smtp_sender_name: smtpSender,
  });
}

const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`;
const summary = {
  ...payload,
  mailer_templates_confirmation_content: `[${confirmHtml.length} chars]`,
  mailer_templates_recovery_content: `[${recoveryHtml.length} chars]`,
  ...(smtpReady
    ? { smtp_pass: "[redacted]", smtp_configured: true }
    : { smtp_configured: false }),
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
      "Create a token: https://supabase.com/dashboard/account/tokens",
      "Or apply manually:",
      "  Templates → https://supabase.com/dashboard/project/vofjektddsxmavghlerj/auth/templates",
      "  SMTP      → https://supabase.com/dashboard/project/vofjektddsxmavghlerj/settings/auth",
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

console.log("Auth mail config updated.");
console.log(
  JSON.stringify(
    {
      site_url: parsed?.site_url,
      uri_allow_list: parsed?.uri_allow_list,
      mailer_subjects_confirmation: parsed?.mailer_subjects_confirmation,
      mailer_subjects_recovery: parsed?.mailer_subjects_recovery,
      smtp_host: parsed?.smtp_host || null,
      smtp_admin_email: parsed?.smtp_admin_email || null,
      smtp_sender_name: parsed?.smtp_sender_name || null,
      smtp_configured: smtpReady,
    },
    null,
    2,
  ),
);

if (!smtpReady) {
  console.log(
    "\nSMTP not applied (set SMTP_HOST/USER/PASS/ADMIN_EMAIL to send as @thalvo.org).",
  );
}
