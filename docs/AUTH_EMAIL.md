# Auth email & confirm redirects

## Problem we fixed

Hosted Auth had **Site URL = `http://localhost:3000`**. Confirmation mails
were sent from `noreply@mail.app.supabase.io`, and `/auth/v1/verify` redirected
captains to localhost after they clicked the link.

Auth logs (project `vofjektddsxmavghlerj`) showed:

- `referer: http://localhost:3000` on signup / verify
- `mail_from: noreply@mail.app.supabase.io`

## Live rules

1. **Site URL** must be `https://thalvo.org`
2. **Redirect allow list** must include `https://thalvo.org/**` (and local `http://localhost:8080/**` for Vite)
3. Client always passes `emailRedirectTo: https://thalvo.org/auth?confirmed=1` via `confirmationRedirect()` — never the current window origin
4. Templates use `{{ .ConfirmationURL }}` so GoTrue embeds the allow-listed redirect

## Apply hosted Auth config

Dashboard (manual):

1. [URL Configuration](https://supabase.com/dashboard/project/vofjektddsxmavghlerj/auth/url-configuration)  
   - Site URL → `https://thalvo.org`  
   - Redirect URLs → `https://thalvo.org/**`, `http://localhost:8080/**`
2. [Email Templates](https://supabase.com/dashboard/project/vofjektddsxmavghlerj/auth/templates)  
   - Paste `supabase/templates/confirm.html` / `recovery.html`  
   - Subjects: `THALVO — e-postanı onayla` / `THALVO — şifreni yenile`

Or Management API (preferred once you have a PAT):

```bash
SUPABASE_ACCESS_TOKEN=sbp_… node scripts/apply-auth-url-config.mjs
```

## Sender still says Supabase?

Subject/body branding does **not** change the From address. To send as
`noreply@thalvo.org` (or similar), configure **custom SMTP** under
Authentication → SMTP Settings (Resend / Postmark / SES). Until then the
platform mailer remains `noreply@mail.app.supabase.io`.
