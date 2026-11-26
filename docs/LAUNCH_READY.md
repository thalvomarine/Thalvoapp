# Thalvo MarineOS — Launch-ready playbook

Goal: one professional design language, working product motors, real usta / servis / bayi intake, then App Store / Play and ads.

Companion docs: `.cursor/skills/thalvo-marineos/SKILL.md`, `.cursor/skills/thalvo-launch-ready/SKILL.md`, `docs/STORE_LAUNCH.md`, `store/`.

## Checkpoint A — Skills & contract

- [x] MarineOS product skill present
- [x] Launch-ready orchestration skill present
- [x] Design tokens corrected (`--mos-cyan` = cyan, not amber)
- [ ] Design language applied across all signed-in + public surfaces
- [ ] Owner reviewed checkpoint build (preview) before `main`

## Checkpoint B — Motors green

| Surface | Motor gate | Status |
| --- | --- | --- |
| SOS | Create call, live position, cancel | Live schema OK |
| Arıza / görevler | Report → offers → accept → complete | Live; packages may be empty |
| Harita | Marinas + coves layers load; no crash on empty | Live zones |
| Tekne pazar yeri | `boat_listings` live; create + list | **Schema applied** |
| Yedek parça + bayi | Catalogue, cart, dealer desk, orders | Live; thin stock |
| Charter misafir | Any open stay inquiry (`end_iso`) | Flexible days live |
| Charter firma | Publish yacht, day toggles, inbox | Live fleet editor |
| Pasaport | Vessel + documents vault | Live |
| THALVO AI | Answer path + memory/quota when schema live | **Core schema applied** |
| Transfer kaptan | Request / apply / accept | Live; empty marketplace OK |

## Checkpoint C — Partner intake

- [ ] Technician signup → pending → admin approve → missions desk
- [ ] Dealer application → docs → approve → `/app/dealer`
- [ ] Provider can publish at least one service package
- [ ] Empty states honest (no silent swallow of schema miss)

## Checkpoint D — Store & ads

- [ ] `npm run store:preflight` green
- [ ] Screenshots in `store/assets/screenshots/`
- [ ] Review notes say payments simulated
- [ ] Capgo `autoUpdate` still false until OTA verified
- [ ] Owner says go for ads only after A–C

## Sample content

Keep labelled sample fleets until official launch cleanup. Strip all sample / simulated placeholders in one pass when the owner asks — not earlier.
