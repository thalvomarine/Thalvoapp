# Technical Debt Register

Tracks known deficiencies after M6 Architecture Freeze so future phases
can pick them up without re-discovering.

## Security

- **Server-side leak enforcement.** DB `mask_job_message` rejects high-risk
  chat. Client `recordSecurityEvent` now also writes `security_events` for
  preflight blocks that never reach the table. AdminSecurityPanel merges both.
- **`MaskedContact` reveal.** Still UI-only; must be gated by a server RPC
  that checks role and logs the reveal.
- **Simulated payments.** `record_payment_intent` still writes
  `status='secured'` with `provider='simulated'`. Acceptable for pilot
  while UI labels demo mode; replace with PSP webhook before real money.
  See migration `20261013213000_launch_security_hardening.sql`.
- **CSP.** Report-Only CSP ships on Vercel (`Content-Security-Policy-Report-Only`)
  covering Leaflet tiles, Supabase, and self assets. Promote to enforcing
  after a quiet report window.

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

- Client `emitEvent` prefers `emit_platform_event` SECURITY DEFINER RPC
  (migration `20261103040000_quality_pass_security_audit.sql`) with
  direct-insert fallback. Privileged RPCs (`accept_offer`, checkout, etc.)
  should call the same SQL function server-side and drop duplicate client emits.

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
