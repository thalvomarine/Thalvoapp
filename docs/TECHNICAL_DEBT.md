# Technical Debt Register

Tracks known deficiencies after M6 Architecture Freeze so future phases
can pick them up without re-discovering.

## Security

- **Server-side leak enforcement.** DB `mask_job_message` rejects high-risk
  chat. Client `recordSecurityEvent` also writes `security_events` for
  preflight blocks. AdminSecurityPanel merges both.
- **`MaskedContact` reveal.** Still UI-only; must be gated by a server RPC
  that checks role and logs the reveal.
- **Simulated payments (gated).** Mode in `platform_settings.payments.mode`
  (`simulated` default). Client must pass `_demo_ack` from CheckoutModal.
  Live mode stays `pending` until a PSP webhook. See
  `20261103053000_payment_security_gates.sql`.
- **CSP.** Enforcing CSP ships on Vercel (`Content-Security-Policy`). Inline boot
  scripts live in `/thalvo-boot.js` so `script-src` can omit `'unsafe-inline'`.
  Re-check Google Ads / map tile hosts if a new third-party script is added.
- **Auth leaked-password protection.** Enable HaveIBeenPwned in Supabase Auth
  dashboard (not controllable from app migrations).
- **Deploy env.** `/admin` uses `is_platform_operator()` RPC (operator `user_id`
  in `platform_settings`). Remove obsolete `VITE_SUPERADMIN_EMAIL` from Vercel
  if still set — it must not appear in the client bundle.
- **SPA HTTP status.** Unknown paths still rewrite to `index.html` (200) for
  client routing; the in-app 404 sets `noindex,nofollow`. True HTTP 404 needs
  SSR or a path allowlist middleware.
- **THALVO AI on Vercel.** Static `dist/` SPA cannot run TanStack server
  functions. Live chat uses bundled `api/chat.js` + `api/assistant.js`
  (from `serverless/*.ts` via `scripts/bundle-api.mjs`). Set
  `THALVO_AI_API_KEY` (and Supabase URL/anon) on the Vercel project or the
  endpoints return training-only / `ai_not_configured`.
- **Admin job status shortcut.** Control Tower can still `UPDATE jobs.status`
  directly (trigger allows admin). Prefer `admin_close_job` / ledger RPCs
  before treating completion as financial truth.

## Reputation

- **Event-sourced reputation.** `provider_trust_signals` RPC already feeds
  arrival / response / dispute samples into `computeTrust`. Scores stay
  "Building" until providers have timed arrivals and completed missions —
  that is data, not a wiring gap. Cert action opens Vessel Passport.

## Orders / logistics

- **Multi-dealer cart.** `checkout_parts_cart` splits one order per dealer
  (see `20261006152000_leak_trust_cart.sql`). Keep UI copy honest about the split.
- **Payment + escrow.** No real payment capture. Escrow release on
  delivery is a UI state, not a ledger event.
- **Courier / service-boat dispatch.** Delivery ETA is a heuristic;
  no dispatcher assignment or GPS tracking yet.
- **Boat brokerage contact.** Marketplace listings no longer expose
  WhatsApp/`tel:`; in-app inquire toast only. A real inquire/job thread
  is the next vertical step.

## Admin

- **Admin RLS override.** Cross-tenant visibility relies on existing
  policies; dedicated `admin`-only override policies + richer
  `admin_events` audit log can still deepen.
- **Incident actions.** Flag for review (`flag_mission_for_review`) and
  resolve dispute (`resolve_job_dispute`) are live from IncidentDetailPanel.
  Provider profile deep-link uses `/app/reputation` when `provider_id` is set.

## Platform events

- Client `emitEvent` only calls `emit_platform_event` (allowlisted types for
  non-admins). Direct `INSERT` on `platform_events` is revoked for
  `authenticated` (`20261103053000_payment_security_gates.sql`). Privileged
  financial events are written inside `record_payment_intent` /
  `confirm_payment_intent_from_provider` / `complete_job`.

## Push

- Foreground Web Notification + `useNotificationPermission` /
  optional `subscribeWebPush` (VAPID via `VITE_VAPID_PUBLIC_KEY` only).
  Background FCM/APNs still needs provider credentials outside the repo.

## Design system

- The legacy `mission/StatusChip`, `security/SecurityWarningBanner`
  and `admin/AdminKpiRail` cells duplicate the new
  `core/StatusBadge`, `core/RiskBanner` and `core/MetricCard`
  respectively. Removal is deferred until every call site has been
  migrated during normal feature work.
- Some panels still hand-format currency via `.toFixed(2)`. Migrate
  to `formatMoney` from `@/lib/formatters` when touched.

## Performance

- `MissionShell` re-queries `user_roles` on every mount; a cached
  role hook in `src/hooks/` would cut a round-trip per navigation.
- The admin `LiveMap` re-renders on every provider list change; a
  memoized selector on the tower shell would help at scale.
