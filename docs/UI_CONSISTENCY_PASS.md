# M8 — UI Consistency Pass

Goal: make every authenticated THALVO route feel like one premium MarineOS
product without adding features, changing schema, or breaking flows.

## Reference language

Mission Control (`/app`) is the visual reference. All dark cockpit surfaces
now share the same header typography, glass panels, radii and spacing via
`src/components/core/*` primitives.

## Header unification

`MarketplaceShell` and `BoatPassportShell` now delegate their header markup to
`CockpitHeader`. That makes the eyebrow / title / subtitle typography
identical across:

- `/app/marketplace`, `/app/shop`, `/app/dealer` — MarketplaceShell
- `/app/orders` — MarketplaceShell
- `/app/passport`, `/app/reputation` — BoatPassportShell
- `/app` (Mission Control), `/app/admin` — MissionShell / AdminControlTowerShell

Both shells gained an optional `subtitle` prop that maps directly to
`CockpitHeader.subtitle` for one-line context lines.

## Route-level primitive swaps

`/app/orders`:

- Empty state (`GlassPanel` + ad-hoc markup) → `EmptyState` from core.
- Top-right count chip (`StatusChip`) → `StatusBadge` from core.
- Order total in detail sheet (`formatTL` + span) → `MoneyAmount`.
- Marketplace CTA switched from `<a href>` to typed `<Link to>`.

## Colour discipline

The pass reinforces the M6 colour rules:

- Sky / blue → operational (LIVE ticks, active status, primary CTAs).
- Emerald → completed, delivered, protected.
- Amber → pending, warning, low stock.
- Rose / red → SOS emergency and blocked leaks only.

No component was migrated onto a stronger tone than it previously used.

## Not touched (intentional)

- No schema, RLS, RPC, auth or SOS payment-provider changes.
- `MissionShell` navigation, SOS dock and Thalvo AI fab untouched.

## Follow-up (cockpit surface polish)

Authenticated routes already mount inside dark `MissionShell`. Remaining
light-token islands (`PackageOffers` sheet, `JobChat`, `CheckoutModal`,
profile `Field`) and the legacy `/app/shop` twin were cleaned up in a later
pass: shop now redirects to `/app/marketplace`, and sheets use navy cockpit
tokens.

## Verification

- Typecheck: passes.
- All authenticated routes still resolve to the same components and data
  loaders as before M8.
- Mission Control, Job detail, Marketplace, Dealer, Orders, Passport,
  Reputation and Admin Tower all render on the same dark cockpit surface
  with matching header typography.

## Remaining debt

- Retire `mission/StatusChip` in favour of `core/StatusBadge` opportunistically.
- Retire ad-hoc `.text-white/…` chip markup inside `admin/*` panels once the
  admin tower gets its next data pass.
- Delete unused `AppShell` compatibility wrapper when no route imports remain.
