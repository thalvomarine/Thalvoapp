---
name: thalvo-marineos
description: >-
  Thalvo MarineOS product rules for the Turkish-coast chart, dealer desk, auth,
  and live site. Use when changing thalvo.org UI, Supabase auth, the public
  chart, dealer or captain flows, or shipping to main.
---

# Thalvo MarineOS

- Stack: React, Vite, Tailwind, Leaflet, Supabase. Cockpit colours are navy `#0A192F`, cyan `#00F0FF`, amber `#F5B942`.
- Units: knots, nautical miles, metres. Coordinates use `formatDm` (`DD°MM.MM'`).
- Public home `/` is the brand landing (Concept B). The public coast chart lives at `/chart`. Chart tiles: Esri World Dark Gray plus OpenSeaMap. Do not use deprecated CartoDB key endpoints. Do not put live boat or technician pins on the public chart. Partner ol opens the partner desk as a modal (not an inline section under the landing).
- The cockpit does not draw routes and has no north-lock control. The desktop control panel is the only layer menu; the layers button is for narrow screens.
- Chart, SOS and the parts pilot describe the coast those tools cover. Marina names stay as real places. Charter home ports are the place a firm names; the guest catalogue is not limited to the Aegean or the Mediterranean.
- An open SOS stays on Görevler until the captain cancels it or it is completed. Cancel and live position use `cancel_own_call` and `refresh_own_call_position` in `20261008143000_cancel_and_live_call.sql`.
- Appearance: `system` keeps this cockpit, `day` is white, `night` is black. Stored in `thalvo-theme`.
- Captain signup stays the boat flow. Provider signup is the technician form. Dealer signup is a multi-step marketplace application (`dealer_applications`: entity type, legal/store name, tax ID + office, MERSİS when required, KEP, invoice type, IBAN matching trade name, registered/billing/ship-from/return addresses, home marina, ops/finance contacts, product focus, verification docs in `dealer-documents`). It stores `requested_role` and stays `Client` until an admin approves via `approve_role_request` — then the dealer desk (`/app/dealer`) opens. Never auto-insert into `verified_dealers` / `verified_providers` on signup. Do not put maritime licenses on the dealer form.
- Supabase email confirmation stays on. After signup the visitor enters the public chart with an unverified-email warning. The cockpit opens after the confirmation link.
- An empty catalogue is an empty state, not a load error.
- THALVO AI answers seamanship, machinery, and weather without inventing wave heights. Live weather is Open-Meteo (not an official MGİM bulletin). If the server function fails, the client still answers from `answerFromTraining`.
- Do not commit route-drawing leftovers, `print/`, whitepaper drafts, or local config copies. Do not print Supabase keys. Payments stay simulated and labelled.
- Charter has two doors. Guests browse `/charter` in the MarineOS dark catalogue: brand-first Piri hero, place/stay/party search with the dual-month stay picker (draft→Save, embark/disembark times), guest/owner door cards, a sticky search summary after scroll, an isolated static home-port chart (Esri dark + OpenSeaMap, no live boats), hull/cabin/budget filters (mobile sticky rail under the map; desktop sticky sidebar) without skeleton flashes or bareboat/kind chips, cinematic cards with coloured next-open chips, then a detail sheet with coloured open-day board and a sticky inquiry command module (gallery keeps the module). Inquiry only — any open check-in→check-out. A signed-in firm uses `/app/charter` as a MarineOS desk: Publish / Fleet / Inbox tabs, listing score, port hints, hull chips, coloured day toggles, radar empty states, toast feedback. The sample fleet stays labelled. Payments stay simulated. `/charter-preview` is the operations sheet.
- Until official launch, keep sample fleets and labelled simulated demo content on the site so the catalogue and desks are not empty. At launch, strip every sample / simulated placeholder site-wide when the owner asks — do not remove them early.
- Quality bar for every product surface: SOS, fault/missions, coast chart (marinas + coves as layers), boat marketplace, spare-parts marketplace, guest charter rent, firm charter desk, boat passport, plus THALVO AI and transfer captain. Each must look and behave first-class — MarineOS craft, no half-finished or tacky UI, clear empty/error states, mobile and desktop, labelled simulated money where payments are not live. When polishing one surface, match the bar of the strongest desks (charter guest catalogue, day marketplace desk); do not leave sibling surfaces looking weaker.
- Launch-ready phase: follow `.cursor/skills/thalvo-launch-ready/SKILL.md` and `docs/LAUNCH_READY.md`. Bring real usta (Provider), servis packages, and bayi (Dealer) through approval — never auto-verify. One design language (cockpit `.thalvo-dark` / marketplace `.thalvo-desk` / public brand Concept B). Fix motors before ads.
- `routeTree.gen.ts` is generated. Do not hand-edit it.
- Live site: push `main`. GitHub deploys thalvo.org. Do not redeploy an old TanStack Start build.
- App Store / Play launch package: `docs/STORE_LAUNCH.md` and `store/`. Bundle id `com.thalvo.marineos`. Keep Capgo `autoUpdate` false until a production OTA is verified. Payments stay simulated in review notes.
- Account deletion stays in Profile → Account settings and calls `delete_own_account`. Do not replace it with an email-only request.
