---
name: thalvo-launch-ready
description: >-
  Orchestrates Thalvo MarineOS launch readiness: one design language, working
  surface motors, real usta/servis/bayi onboarding, store submission gates.
  Use when preparing app stores, partner intake, surface polish, or fixing
  broken product engines before advertising.
---

# Thalvo launch-ready

Read with `.cursor/skills/thalvo-marineos/SKILL.md`, `docs/STORE_LAUNCH.md`, and `docs/LAUNCH_READY.md`.

## Phase goal

Ship a coherent MarineOS product that a captain, technician (usta), and dealer (bayi) can trust — then App Store / Play + ads. No artificial “AI demo” look. No half-working motors.

## Skills to apply together

| Skill / doc | When |
| --- | --- |
| `thalvo-marineos` | Every UI, chart, auth, charter, cockpit change |
| This skill (`thalvo-launch-ready`) | Launch sequencing, partner intake, store gates |
| `docs/STORE_LAUNCH.md` + `store/` | Store listing, review notes, Capgo, bundle id |
| Supabase agent skill + postgres best practices | Any schema, RLS, RPC, migration |
| Frontend design user rules | Brand-first public surfaces; cockpit stays ECDIS |

## One design language

- **Cockpit / signed-in:** `.thalvo-dark` + `.thalvo-cockpit` — navy `#0A192F`, cyan `#00F0FF`, amber `#F5B942`, danger red only for destructive/SOS.
- **Marketplace desks:** `.thalvo-desk` tokens (parts + boats). Day/night via `thalvo-theme`.
- **Public brand:** Concept B landing / charter Piri craft — brand hero, no purple gradients, no glow stacks, no emoji decoration, no generic SaaS cards in heroes.
- Typography: `thalvo-display` for brand/section titles; mono only for coords/IDs.
- Every surface: real empty states, labelled simulated payments, mobile + desktop, no skeleton flash where avoidable.
- When polishing, match the strongest desks (guest charter, day parts desk). Sibling surfaces must not look weaker.

## Surface motors (must work)

1. SOS · 2. Fault/missions · 3. Chart (marinas + coves as layers) · 4. Boat marketplace · 5. Spare parts + dealer + orders · 6. Guest charter · 7. Firm charter · 8. Passport · 9. THALVO AI · 10. Transfer captain

Blockers first (apply only with explicit ship approval if touching live DB):

- `boat_listings` (+ feed view) for boat marketplace
- AI core: `user_boats`, `ai_memories`, `chat_messages`, `match_ai_memories`, quota path
- Client types aligned (`charter_inquiries.end_iso`, listing columns)

## Partner intake (usta / servis / bayi)

- **Usta / teknisyen:** Provider signup → stays Client until `approve_role_request` → missions/SOS radar.
- **Bayi:** Multi-step `dealer_applications` → admin approve → `/app/dealer`. Never auto-insert verified dealers.
- **Servis paketleri:** `provider_service_packages` must be creatable by approved providers; empty catalogue is empty state, not error.
- Do not invite paid ads until motors above are green and store preflight passes.

## Sequencing

1. Integrate skills + freeze design contract (this file + LAUNCH_READY).
2. Fix blocker motors (schema + types + silent empty catches that hide outages).
3. Surface-by-surface professional pass (SOS → chart → marketplaces → charter → passport → AI → transfer).
4. Partner onboarding UX polish (signup → pending → approved desks).
5. `npm run store:preflight` + screenshots + review notes; Capgo stays `autoUpdate: false`.
6. Strip sample/simulated placeholders only when the owner declares launch cleanup.

## Do not

- Ship to `main` mid-polish without a clear checkpoint the owner can review.
- Claim real payments in store copy.
- Force-push published history.
- Leave one surface looking like a prototype while ads run.
