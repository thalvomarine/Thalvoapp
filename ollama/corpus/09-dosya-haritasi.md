# Dosya haritası

Bu liste `node ollama/scripts/build-filemap.mjs` ile üretilir. İkili dosyalar, `node_modules`, `dist`, `.env` ve kilit dosyaları yoktur. `android/` ve `ios/` Capacitor kabuğudur; satır indeksi `capacitor.config.ts` ve `docs/STORE_LAUNCH.md` üzerinden gider. `src/routeTree.gen.ts` üretilir.

Dosya sayısı: 449.

## .cursor/skills/thalvo-marineos

- `.cursor/skills/thalvo-marineos/SKILL.md` — -

## docs

- `docs/ARCHITECTURE_FREEZE.md` — M6 — Architecture Freeze
- `docs/AUTH_EMAIL.md` — Auth email & confirm redirects
- `docs/COMPONENT_CATALOG.md` — Component Catalog
- `docs/DESIGN_TOKENS.md` — MarineOS Design Tokens
- `docs/EVENT_MODEL.md` — M7 — Event Model
- `docs/PAYMENT_ARCHITECTURE.md` — M9 — Real Payment / Escrow Architecture v1
- `docs/RPC_SECURITY_AUDIT.md` — RPC Security Audit — THALVO (public schema, SECURITY DEFINER)
- `docs/STORE_LAUNCH.md` — Thalvo MarineOS — App Store & Google Play launch
- `docs/TECHNICAL_DEBT.md` — Technical Debt Register
- `docs/UI_CONSISTENCY_PASS.md` — M8 — UI Consistency Pass

## ollama

- `ollama/README.md` — Thalvo’yu yerelde Ollama ile taramak
- `ollama/SYSTEM.md` — Thalvo MarineOS — yerel model anayasası

## ollama/corpus

- `ollama/corpus/00-indeks.md` — Corpus indeksi
- `ollama/corpus/01-calistirma.md` — Çalıştırma ve yayın
- `ollama/corpus/02-rotalar.md` — Rotalar
- `ollama/corpus/03-roller.md` — Roller ve auth
- `ollama/corpus/04-veri.md` — Veri modeli
- `ollama/corpus/05-rpc.md` — RPC kataloğu
- `ollama/corpus/06-akislar.md` — İş akışları
- `ollama/corpus/07-arayuz.md` — Arayüz, harita, AI
- `ollama/corpus/08-sinirlar.md` — Sınırlar

## ollama/scripts

- `ollama/scripts/ask.mjs` — Ask a local Ollama model about this repo.
- `ollama/scripts/build-filemap.mjs` — Rebuild ollama/corpus/09-dosya-haritasi.md from the source tree.
- `ollama/scripts/lib.mjs` — Shared scan helpers for the local Ollama pack.
- `ollama/scripts/lib.test.mjs`

## scripts

- `scripts/android-release-checklist.mjs` — Preflight for Google Play AAB uploads.
- `scripts/apply-auth-url-config.mjs` — Patch hosted Supabase Auth URL + confirmation email branding.
- `scripts/assert-tanstack-start.mjs` — Fail the build if TanStack Start is below the XSS fix (1.168.60)
- `scripts/bundle-api.mjs` — Bundle Vercel /api handlers to CommonJS so production does not depend on
- `scripts/fix-android-cordova-res.mjs` — Remove illegal Android resource filenames that AGP 8+/9 reject.
- `scripts/generate-native-assets.mjs` — Branded MarineOS splash + launcher icons for Capacitor shells.
- `scripts/generate-store-assets.mjs` — Play / App Store marketing bitmaps from resources/icon.png.
- `scripts/ios-release-checklist.mjs` — Preflight for cutting / installing Thalvo MarineOS on a Mac.
- `scripts/prepare-capacitor-www.mjs` — Capacitor `webDir` helper. Delegates to the shared static SPA assembler.
- `scripts/prepare-web-spa.mjs` — Assembles a bootable static SPA in `dist/` from TanStack Start / Nitro
- `scripts/store-release-preflight.mjs` — Combined App Store + Play launch preflight.

## serverless

- `serverless/assistant.ts` — JSON assistant turn for the in-app FAB / chat panel on the static Vercel SPA.
- `serverless/chat.ts` — Vercel Node serverless entry for THALVO AI HTTP chat.

## src

- `src/client.tsx` — Capgo live-update handshake — fire as the very first work in the entry
- `src/router.tsx` — Show pending UI quickly on slow networks; keep shell chrome mounted.
- `src/routeTree.gen.ts` — Üretilir. Elle düzenlenmez.
- `src/server.ts` — h3 swallows in-handler throws into a normal 500 Response with body
- `src/start.ts`
- `src/styles.css` — Leaflet CSS loads with LiveMap / CoverageChart / ReportMiniMap chunks
- `src/vite-env.d.ts` — Classic Supabase anon JWT — accepted as a fallback for VITE_SUPABASE_PUBLISHABLE_KEY.

## src/components

- `src/components/AboutThalvo.tsx` — AboutThalvo — compact "About THALVO" card for the profile page.
- `src/components/AppShell.tsx` — AppShell — thin compatibility wrapper.
- `src/components/CheckoutModal.tsx` — Simulated / test-mode checkout.
- `src/components/ClientOnly.tsx` — Renders `fallback` on the server and on the client's first paint, then
- `src/components/CockpitErrorBoundary.tsx` — Isolates chart / Leaflet failures from the mission dock so SOS stays
- `src/components/ImageUploader.tsx` — Smaller tile for a listing gallery.
- `src/components/JobChat.tsx`
- `src/components/LanguageSwitcher.tsx`
- `src/components/LiveMap.tsx`
- `src/components/LiveMapLazy.tsx` — Code-split Leaflet chart — keeps non-map routes free of the map bundle.
- `src/components/MockMap.tsx` — M9.2 — evaluate providers and jobs independently so a single real-degree
- `src/components/ReportModal.tsx` — Passage / bay note sheet. Portaled onto `document.body` so it sits above
- `src/components/ThalvoAiFab.tsx`
- `src/components/ThalvoChat.tsx`
- `src/components/ThalvoLoader.tsx` — Full-screen splash (cold boot) vs soft in-shell pending for tab switches.
- `src/components/Wordmark.tsx` — THALVO brand mark.

## src/components/admin

- `src/components/admin/AdminConfirmDialog.tsx` — Already-localised title naming the person or listing affected.
- `src/components/admin/AdminControlTowerShell.tsx` — Portal-rendered overlays (confirmation dialogs) owned by the page.
- `src/components/admin/AdminKpiRail.tsx` — AdminKpiRail — dense top KPI strip for the control tower.
- `src/components/admin/AdminOpsTabs.tsx` — AdminOpsTabs — the 3 operational desks of the Control Tower, unified
- `src/components/admin/AdminPaymentOpsPanel.tsx`
- `src/components/admin/AdminPoiDialog.tsx` — Manual chart-point entry — the Control Tower counterpart to the on-map
- `src/components/admin/CommunityReportDesk.tsx` — Captain advice approval desk — nothing reaches the chart without a click here.
- `src/components/admin/EscrowOpsPanel.tsx` — EscrowOpsPanel — money-in-flight overview.
- `src/components/admin/IncidentDetailPanel.tsx` — IncidentDetailPanel — right rail focus view for the selected mission.
- `src/components/admin/MarineZoneTable.tsx` — Full chart-point data table: every lighthouse, mooring and shoal in one list.
- `src/components/admin/MarketplaceOpsPanel.tsx` — Dealer / supplier that owns the listing, so the operator knows whose it is.
- `src/components/admin/MissionCommandBoard.tsx` — Live dispatch route lines — responding boat to assigned job.
- `src/components/admin/MissionDispatchPanel.tsx` — Operational statuses an admin can force from the tower.
- `src/components/admin/PanelLoadState.tsx` — PanelLoadState — the single piece of UI every Control Tower panel uses
- `src/components/admin/PendingRoleRequests.tsx`
- `src/components/admin/PilotReadinessPanel.tsx` — Until a PSP is wired, always false.
- `src/components/admin/PlatformEventFeed.tsx` — PlatformEventFeed — chronological network activity.
- `src/components/admin/ProviderOpsList.tsx` — true/false from a real read; null when the verification read failed.
- `src/components/admin/ReportMiniMap.tsx` — Read-only chart preview focused on a single coordinate — used by the
- `src/components/admin/SuperadminDesk.tsx`
- `src/components/admin/TrustWatchlist.tsx` — `null` when verification could not be read — rendered as unknown, never as false.

## src/components/auth

- `src/components/auth/DealerApplicationWizard.tsx`

## src/components/brand

- `src/components/brand/AuthPassageBackdrop.tsx` — AuthPassageBackdrop — D4 “Yıldız Geçidi” for /auth.
- `src/components/brand/CompassMark.tsx` — Primary needle color (north). Defaults to THALVO gold.
- `src/components/brand/PiriChartBackdrop.tsx` — THALVO-exclusive hero atmosphere inspired by Piri Reis portolan charts.
- `src/components/brand/ProductMarks.tsx` — THALVO product icon family.
- `src/components/brand/SeaBackdrop.tsx` — SeaBackdrop — purely decorative brand atmosphere.

## src/components/core

- `src/components/core/CockpitHeader.tsx` — CockpitHeader — the standard MarineOS page/section header.
- `src/components/core/CockpitPage.tsx` — CockpitPage — spacing shell used inside MissionShell for feature routes.
- `src/components/core/DataPill.tsx` — DataPill — compact key/value pill used in cockpit headers, cards and
- `src/components/core/EmptyState.tsx` — EmptyState — calm placeholder used in feeds/queues/tables.
- `src/components/core/EtaBadge.tsx` — EtaBadge — normalized "ETA · 18 min" pill.
- `src/components/core/index.ts` — THALVO Core Primitives — M6 Architecture Freeze.
- `src/components/core/MetricCard.tsx` — MetricCard — single-cell KPI tile. Aligns visually with the AdminKpiRail
- `src/components/core/MoneyAmount.tsx` — MoneyAmount — tabular value with consistent formatting. Defaults to TRY.
- `src/components/core/RiskBanner.tsx`
- `src/components/core/SectionHeader.tsx` — Compact section header used inside GlassPanel bodies.
- `src/components/core/StatusBadge.tsx` — StatusBadge — canonical MarineOS pill.
- `src/components/core/Timeline.tsx` — TimelineStep — single row inside a Timeline.
- `src/components/core/TrustBadge.tsx` — TrustBadge — normalized trust pill for provider/dealer surfaces.

## src/components/map

- `src/components/map/AdminZoneDialog.tsx` — Coordinate of the admin's chart click; the form never invents one.
- `src/components/map/ChartDetailSheet.tsx` — The captain's own GPS fix, kept for callers that already pass it.
- `src/components/map/ChartHud.tsx` — Approved captain-advice pins ("Kullanıcı Tavsiye Noktaları").
- `src/components/map/ChartSearchBar.tsx` — Optional strip rendered directly under the input (geo permission, etc.).
- `src/components/map/MetoceanHud.tsx` — Instant sea-state widget — follows appearance tokens via thalvo-chart-sheet

## src/components/marketplace

- `src/components/marketplace/BoatsTendersBoard.tsx`
- `src/components/marketplace/CartSheet.tsx` — Called after an OUT_OF_STOCK checkout error so callers can refetch.
- `src/components/marketplace/CompatibilityBadge.tsx` — CompatibilityBadge — does this part match the captain's vessel?
- `src/components/marketplace/CreateBoatListingSheet.tsx`
- `src/components/marketplace/DealerStockPanel.tsx` — DealerStockPanel — dealer-side inventory row list with quick stock adjust.
- `src/components/marketplace/DealerTrustBadge.tsx` — Optional 0..100 dealer trust score (null = building).
- `src/components/marketplace/DeliveryEtaBadge.tsx` — DeliveryEtaBadge — logistics-first ETA hint.
- `src/components/marketplace/FloatingCartBar.tsx` — Marketplace spare-parts cart — viewport-fixed above the dock, never inside
- `src/components/marketplace/MarketplaceShell.tsx` — Full-width strip under the title/actions (e.g. location warning).
- `src/components/marketplace/PartCard.tsx` — Public catalogue: var / az / yok. Hides counts and same-day berth copy.
- `src/components/marketplace/PartsCatalogBoard.tsx` — Default marketplace catalogue = Design C (day desk).
- `src/components/marketplace/PartsCatalogDayDesk.tsx`
- `src/components/marketplace/PartsCatalogShowroom.tsx` — Web desktop: side drawer. Native app / narrow viewports: bottom sheet.
- `src/components/marketplace/StockStatusBadge.tsx` — StockStatusBadge — In stock / Low stock / Out of stock.
- `src/components/marketplace/useMarketplaceMobileSheet.ts` — Narrow / native → bottom sheet; wide web → docked left rail.

## src/components/mission

- `src/components/mission/AccountMenuButton.tsx` — Smaller trigger button for tight floating chrome (map cockpit top bar).
- `src/components/mission/ActionTile.tsx` — Operational action tile — Linear/Raycast feel. Reusable across screens.
- `src/components/mission/ActiveJobPool.tsx` — Pending job pool for divers / technicians — realtime + claim.
- `src/components/mission/ActiveMissionCard.tsx`
- `src/components/mission/AiAdvisor.tsx` — Calm AI recommendation surface. Never a modal. Never blocking.
- `src/components/mission/EmergencyCallRadar.tsx` — Provider Missions radar — realtime pending calls + accept → en_route + chart route.
- `src/components/mission/EmergencyServiceSheet.tsx` — Captain intake for the technical / underwater service network
- `src/components/mission/EscrowPanel.tsx`
- `src/components/mission/GlassPanel.tsx` — MarineOS reusable glass surface. Use for every panel/card on dark cockpit.
- `src/components/mission/LiveOpsPanel.tsx`
- `src/components/mission/MissionShell.tsx`
- `src/components/mission/MissionStatusTrack.tsx` — Map a Supabase jobs.status + offer count to a MissionStage.
- `src/components/mission/OfferCard.tsx` — OfferCard — MarineOS offer surface (simplified).
- `src/components/mission/PaymentTimeline.tsx`
- `src/components/mission/ProviderTrustBadge.tsx` — ProviderTrustBadge — compact trust signal cluster for offer cards.
- `src/components/mission/SosDock.tsx` — SOS dock — always-accessible emergency affordance. Reserved bright color.
- `src/components/mission/SosSheet.tsx`
- `src/components/mission/StatusChip.tsx` — Compact operational status pill — used in headers, map overlays, cards.
- `src/components/mission/VesselRange.tsx`

## src/components/navigation

- `src/components/navigation/RouteDeck.tsx` — Deep Navy Route Deck — NM / ETA / speed dial / legs / lock controls.
- `src/components/navigation/RouteInteractionLayer.tsx` — Interactive sea-route overlay: cyan polyline, large-hitbox pins, mid-leg + handles.

## src/components/onboarding

- `src/components/onboarding/OnboardingOverlay.tsx` — OnboardingOverlay — full-screen MarineOS first-run experience.
- `src/components/onboarding/useFirstRun.ts` — Survives Capacitor WebView / localStorage wipes — written into auth user_metadata.

## src/components/orders

- `src/components/orders/DealerOrderQueue.tsx`
- `src/components/orders/DeliveryMethodSelector.tsx` — Segmented control between marina pickup and service boat delivery.
- `src/components/orders/FulfillmentStatusBadge.tsx`
- `src/components/orders/LogisticsOrderCard.tsx` — Compact captain-side card summarising a fulfillment order.
- `src/components/orders/OrderSecurityNotice.tsx` — Persistent reminder that communication + payment for this order
- `src/components/orders/OrderTimeline.tsx` — Vertical mission-dispatch timeline for a marketplace order.

## src/components/passport

- `src/components/passport/BoatPassportShell.tsx` — BoatPassportShell — luxury dark cockpit wrapper for the vessel passport.
- `src/components/passport/DocumentVaultPanel.tsx`
- `src/components/passport/InstalledPartsCard.tsx` — Installed parts — pulled from completed job_parts for the vessel owner.
- `src/components/passport/MaintenanceDueCard.tsx` — Maintenance-due panel. Placeholder-friendly for vessels without records.
- `src/components/passport/VesselAiPanel.tsx` — VesselAiPanel — calm AI advisor grounded in vessel data.
- `src/components/passport/VesselHealthTimeline.tsx` — Health timeline — living log of vessel events.
- `src/components/passport/VesselIdentityCard.tsx`
- `src/components/passport/VesselSpecForm.tsx`

## src/components/payments

- `src/components/payments/CommissionBreakdown.tsx` — CommissionBreakdown — inline 3-row breakdown showing gross → fee → net.
- `src/components/payments/EscrowLedgerPanel.tsx` — EscrowLedgerPanel — append-only view of every escrow movement for a job.
- `src/components/payments/PaymentIntentPanel.tsx`
- `src/components/payments/PaymentMarks.tsx` — Card / PSP marks required for İyzico merchant review.
- `src/components/payments/PaymentStatusBadge.tsx` — PaymentStatusBadge — canonical pill for a payment_intents row.
- `src/components/payments/ProviderPayoutPanel.tsx` — ProviderPayoutPanel — provider-facing view of what THALVO owes them

## src/components/profile

- `src/components/profile/AccountSettings.tsx` — Shared account desk: language, appearance, signed-in email, sign out.

## src/components/public

- `src/components/public/BrandLanding.tsx` — Concept B — brand-first public home.
- `src/components/public/ChartDeck.tsx`
- `src/components/public/CoverageChart.tsx` — Same OSM template the cockpit prefetches for the Aegean corridor.
- `src/components/public/LegalPolicyBody.tsx` — Shared privacy / terms body — product-behaviour copy provided by ops.
- `src/components/public/LegalSections.tsx` — Renders prose sections from an i18n object array: [{ title, body }] or [{ title, paragraphs }].
- `src/components/public/PublicBrowseShell.tsx` — Shell for the signed-out browsing surfaces (catalogue, service packages).
- `src/components/public/PublicDocument.tsx` — Signed-out frame for privacy, terms, and other prose pages.
- `src/components/public/PublicFooter.tsx` — Shared signed-out footer: coverage, legal, and payment marks for PSP review.
- `src/components/public/ServicePackageCard.tsx` — ServicePackageCard — shared presentation for a service package row.

## src/components/pwa

- `src/components/pwa/InstallAppButton.tsx` — Install THALVO row for Profile > Settings.
- `src/components/pwa/NetworkStatusBanner.tsx` — Slim top-of-screen banner that surfaces offline / reconnected state.

## src/components/security

- `src/components/security/AdminSecurityPanel.tsx` — AdminSecurityPanel — anti-leak visibility for admin/operator role.
- `src/components/security/MaskedContact.tsx` — When true, reveal the actual value (admin surfaces only).
- `src/components/security/MessageLeakGuard.tsx` — When true (default) high-risk messages cannot be sent.
- `src/components/security/SecurityEventCard.tsx` — SecurityEventCard — compact row for detected risky activity.
- `src/components/security/SecurityWarningBanner.tsx` — Calm inline security banner. Reused by MessageLeakGuard + admin panels.

## src/components/transfer-captain

- `src/components/transfer-captain/TransferCaptainPanel.tsx`

## src/components/trust

- `src/components/trust/ReputationPanel.tsx` — ReputationPanel — full operator reputation surface. Composable.
- `src/components/trust/TrustBreakdown.tsx` — TrustBreakdown — grid of TrustMetricRow. Reusable across provider + dealer.
- `src/components/trust/TrustExplanationSheet.tsx` — TrustExplanationSheet — bottom sheet answering "Why this score?"
- `src/components/trust/TrustMetricRow.tsx` — TrustMetricRow — a single row inside the breakdown list.
- `src/components/trust/TrustScoreCard.tsx` — TrustScoreCard — aviation-safety style aggregate readout. Reusable.
- `src/components/trust/VerificationBadge.tsx` — VerificationBadge — compact chip for KYC / document status.

## src/components/ui

- `src/components/ui/accordion.tsx`
- `src/components/ui/alert-dialog.tsx`
- `src/components/ui/alert.tsx`
- `src/components/ui/aspect-ratio.tsx`
- `src/components/ui/avatar.tsx`
- `src/components/ui/badge.tsx`
- `src/components/ui/breadcrumb.tsx`
- `src/components/ui/button.tsx`
- `src/components/ui/calendar.tsx`
- `src/components/ui/card.tsx`
- `src/components/ui/carousel.tsx`
- `src/components/ui/chart.tsx` — Format: { THEME_NAME: CSS_SELECTOR }
- `src/components/ui/checkbox.tsx`
- `src/components/ui/collapsible.tsx`
- `src/components/ui/command.tsx`
- `src/components/ui/context-menu.tsx`
- `src/components/ui/dialog.tsx`
- `src/components/ui/drawer.tsx`
- `src/components/ui/dropdown-menu.tsx`
- `src/components/ui/form.tsx`
- `src/components/ui/hover-card.tsx`
- `src/components/ui/input-otp.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/label.tsx`
- `src/components/ui/menubar.tsx`
- `src/components/ui/navigation-menu.tsx`
- `src/components/ui/pagination.tsx`
- `src/components/ui/popover.tsx`
- `src/components/ui/progress.tsx`
- `src/components/ui/radio-group.tsx`
- `src/components/ui/resizable.tsx`
- `src/components/ui/scroll-area.tsx`
- `src/components/ui/select.tsx`
- `src/components/ui/separator.tsx`
- `src/components/ui/sheet.tsx`
- `src/components/ui/sidebar.tsx`
- `src/components/ui/skeleton.tsx`
- `src/components/ui/slider.tsx`
- `src/components/ui/sonner.tsx`
- `src/components/ui/switch.tsx`
- `src/components/ui/table.tsx`
- `src/components/ui/tabs.tsx`
- `src/components/ui/textarea.tsx`
- `src/components/ui/toggle-group.tsx`
- `src/components/ui/toggle.tsx`
- `src/components/ui/tooltip.tsx`

## src/hooks

- `src/hooks/use-mobile.tsx`
- `src/hooks/useOpsAlerts.ts` — Realtime job + SOS alerts for online divers / technicians.
- `src/hooks/useRouteSession.ts` — Editable coastal route session for LiveMap / Route Deck.

## src/i18n

- `src/i18n/index.ts` — Turkish is in the first bundle. English and Greek load on demand, still

## src/integrations/supabase

- `src/integrations/supabase/auth-attacher.ts` — This file is automatically generated. Do not edit it directly.
- `src/integrations/supabase/auth-middleware.ts` — This file is automatically generated. Do not edit it directly.
- `src/integrations/supabase/client.server.ts` — This file is automatically generated. Do not edit it directly.
- `src/integrations/supabase/client.ts` — Compile-time fallbacks from `.env` so Capacitor WebViews still boot when
- `src/integrations/supabase/types.ts` — Allows to automatically instantiate createClient with right options

## src/lib

- `src/lib/ai-captain-context-bus.ts` — LiveMap / Metocean / passport publish the latest cockpit facts here.
- `src/lib/ai-captain-types.ts`
- `src/lib/ai-gateway.server.ts` — OpenAI-compatible chat provider. Endpoint and key come from env so the
- `src/lib/ai-lang.test.ts`
- `src/lib/ai-lang.ts` — THALVO AI training and system prompts ship EN + TR.
- `src/lib/aiCaptainService.ts`
- `src/lib/auth-guard.ts` — Server-verified auth user, or null.
- `src/lib/boat-listings.ts`
- `src/lib/boatshow-leads.ts` — Persist a show-floor lead. Prefer Supabase; fall back to mailto if the table is not live yet.
- `src/lib/capgo.test.ts`
- `src/lib/capgo.ts` — Capgo CapacitorUpdater — safe diagnostics + notify handshake only.
- `src/lib/cart.ts`
- `src/lib/chart-north.ts` — ECDIS “north-up”: ease bearing and pitch back to 0.
- `src/lib/chart-pins.ts` — V4 Soft capsule pin — rounded body + tip disc.
- `src/lib/chart-tiles.ts` — Cockpit rasters shared with the public coverage chart.
- `src/lib/coast-marinas.ts` — Didim → Antalya marina roster for SOS / report pickers.
- `src/lib/dealer-application.test.ts`
- `src/lib/dealer-application.ts` — Marketplace-grade dealer onboarding — fields aligned with TR marketplaces
- `src/lib/digit-format.test.ts`
- `src/lib/digit-format.ts` — Turkish grouping: 1250000 → 1.250.000. The dot is only a thousands mark.
- `src/lib/emergency-service-bus.ts`
- `src/lib/emergency-service.ts`
- `src/lib/error-capture.ts` — Captures the original Error out-of-band so server.ts can recover the stack
- `src/lib/error-page.ts`
- `src/lib/events.ts` — THALVO event backbone — M7 Event Architecture v1.
- `src/lib/filter.ts` — Chat fraud/off-platform interception. Blocks Turkish + English tokens
- `src/lib/formatters.ts` — THALVO shared formatters — M6 Architecture Freeze.
- `src/lib/geo-eta.test.ts`
- `src/lib/geo-eta.ts` — Great-circle distance + ETA helpers for the live dispatch route line.
- `src/lib/geolocation.test.ts`
- `src/lib/geolocation.ts` — THALVO — single source of truth for device positioning.
- `src/lib/google-ads.test.ts`
- `src/lib/google-ads.ts` — Optional Google Ads (gtag) measurement for thalvo.org and the Capacitor webview.
- `src/lib/keep-awake.ts` — Screen wake lock for active passage / full-bleed chartplotter.
- `src/lib/leaflet-dom.tsx` — Stop Leaflet drag/zoom from eating HUD clicks and wheel.
- `src/lib/live-ops.ts` — Seeded live-ops board — keeps Missions from rendering as an empty cockpit.
- `src/lib/map-chrome.ts` — Global map-HUD chrome lock.
- `src/lib/map-focus-bus.ts` — Cross-route “focus the chart” trigger.
- `src/lib/map-layers-bus.ts`
- `src/lib/marine-catalog.ts` — Shared marine catalogue for the vessel passport, boat listings, and parts.
- `src/lib/marine-data.ts` — Chart point types stored in `marine_zones`.
- `src/lib/marine.ts` — THALVO shared marine helpers — M6 Architecture Freeze.
- `src/lib/metocean.ts` — Metocean (weather + sea state) snapshot for the HUD widget.
- `src/lib/native-app.ts` — Capacitor App plugin helpers — hardware back, settings deep-link.
- `src/lib/native-history.ts` — Capacitor / Cordova / file:// WebViews boot at `/index.html`, which is not
- `src/lib/native.ts` — Capacitor native-shell bootstrap.
- `src/lib/nav.test.ts`
- `src/lib/nav.ts` — Navigation guards.
- `src/lib/ops-alerts.ts` — permission prompt is best-effort
- `src/lib/orders.ts` — Marketplace logistics order vocabulary + helpers (Phase 9).
- `src/lib/parts-catalog-sort.ts`
- `src/lib/payments.test.ts`
- `src/lib/payments.ts` — THALVO M9 — Payment / Escrow helpers.
- `src/lib/public-catalog.ts` — Shared read layer for the anon-readable catalogue surfaces (`/`, `/marketplace`,
- `src/lib/pwa-register.ts` — Optional service-worker hook. The SW itself is not generated in the
- `src/lib/pwa.ts` — PWA install-prompt architecture.
- `src/lib/range.ts` — Great-circle distance in nautical miles.
- `src/lib/sanitize.ts` — Shared plaintext sanitizer for captain-facing forms (notes, profile, listings).
- `src/lib/schedule.ts` — Map / realtime scheduling — keep Leaflet off the React render path
- `src/lib/schema-gap.ts`
- `src/lib/sea-route.test.ts`
- `src/lib/security.ts` — THALVO Security Barrier — anti-leak utilities.
- `src/lib/session.ts`
- `src/lib/sheet-chrome.tsx` — Shared bottom-sheet chrome helpers for cockpit drawers
- `src/lib/signup-welcome.test.ts`
- `src/lib/signup-welcome.ts` — Live site origin used for every auth email redirect (confirm / recover).
- `src/lib/sonar.ts` — Cockpit "new contact" chime for the admin tower — a short synthesized
- `src/lib/sos-bus.ts` — Cross-route open trigger for the SOS emergency sheet.
- `src/lib/strip-vendor-badge.ts` — Remove leftover editor/badge nodes if a host page injected them.
- `src/lib/supabase-safe.ts` — Missing-relation / schema-cache failures from a fresh Supabase project
- `src/lib/superadmin.ts` — Public ops contact (mailto / partner + boatshow copy).
- `src/lib/thalvo-ai-bus.ts` — Cross-component open trigger for the THALVO Compass AI assistant.
- `src/lib/thalvo-ai.functions.ts`
- `src/lib/thalvo-chat.functions.ts`
- `src/lib/theme.ts` — night = black, day = white, system = the current Thalvo cockpit.
- `src/lib/tile-cache.test.ts`
- `src/lib/transfer-captain.ts`
- `src/lib/trust-signals.ts` — Aggregates a provider's trust inputs. Falls back to the profile row if the RPC is not deploye...
- `src/lib/trust.test.ts`
- `src/lib/trust.ts` — THALVO trust scoring — v1.
- `src/lib/utils.ts`

## src/lib/map

- `src/lib/map/tile-math.ts` — Pure Web-Mercator helpers for offline tile prefetch (no Leaflet dependency).
- `src/lib/map/tileCache.ts` — Offline map tile cache (Cache Storage) + corridor prefetch + Leaflet wrapper.

## src/lib/sea-route

- `src/lib/sea-route/corridors.ts` — Hand-curated fairway / channel nodes for precision Aegean routing.
- `src/lib/sea-route/geometry.ts` — Geometry helpers for coastal sea routing — land-segment tests and
- `src/lib/sea-route/index.ts` — Visibility graph + A* over the Aegean coastal waypoint mesh.
- `src/lib/sea-route/land-masks.ts` — Simplified land masks for Thalvo's operating theatre
- `src/lib/sea-route/simplify-route.ts` — Douglas–Peucker style simplification that refuses to cut corners across land.
- `src/lib/sea-route/waypoints.ts` — Navigable waypoint mesh for the Turkish SW Aegean theatre.

## src/lib/thalvo-ai

- `src/lib/thalvo-ai/browser-client.ts` — Browser → Vercel `/api/assistant` client for the static SPA deploy.
- `src/lib/thalvo-ai/chat-turn.ts`
- `src/lib/thalvo-ai/domain.test.ts`
- `src/lib/thalvo-ai/domain.ts`
- `src/lib/thalvo-ai/embedded-turn.ts`
- `src/lib/thalvo-ai/marine-weather.ts` — Resolve optional place name, then fetch live Open-Meteo marine weather.
- `src/lib/thalvo-ai/memory-store.ts`
- `src/lib/thalvo-ai/places.ts` — Named Turkish-coast waters for weather / seamanship answers.
- `src/lib/thalvo-ai/platform-routes.ts` — Pages the chief-engineer assistant is allowed to open.
- `src/lib/thalvo-ai/request-auth.ts`
- `src/lib/thalvo-ai/sea-state.ts` — Beaufort-style cockpit bands. WMO thunderstorm codes 95, 96, and 99
- `src/lib/thalvo-ai/system-prompt.ts`
- `src/lib/thalvo-ai/thalvo-ai.test.ts`

## src/routes

- `src/routes/__root.tsx`
- `src/routes/about.tsx`
- `src/routes/auth.tsx`
- `src/routes/boatshow.tsx`
- `src/routes/chart.tsx`
- `src/routes/coverage.tsx`
- `src/routes/delivery-returns.tsx`
- `src/routes/distance-sales.tsx`
- `src/routes/index.tsx` — Cap wait so a hung Supabase session check cannot blank the landing on
- `src/routes/marketplace-preview.tsx` — Local / PR review only — mock authorised-dealer catalogue + boat desk.
- `src/routes/marketplace.tsx`
- `src/routes/offline.tsx`
- `src/routes/privacy.tsx`
- `src/routes/README.md` — Routes
- `src/routes/services.tsx`
- `src/routes/terms.tsx`

## src/routes/_authenticated

- `src/routes/_authenticated/admin.tsx`
- `src/routes/_authenticated/app.admin.tsx`
- `src/routes/_authenticated/app.dealer.tsx` — Labels are resolved via i18n at render time (dealer.categories.<value>).
- `src/routes/_authenticated/app.index.tsx`
- `src/routes/_authenticated/app.job.$id.tsx`
- `src/routes/_authenticated/app.marketplace.tsx`
- `src/routes/_authenticated/app.orders.tsx`
- `src/routes/_authenticated/app.passport.tsx`
- `src/routes/_authenticated/app.profile.tsx`
- `src/routes/_authenticated/app.report.tsx`
- `src/routes/_authenticated/app.reputation.tsx`
- `src/routes/_authenticated/app.services.tsx`
- `src/routes/_authenticated/app.shop.tsx` — Legacy spare-parts path. The catalog lives on /app/marketplace;
- `src/routes/_authenticated/app.supplier.tsx`
- `src/routes/_authenticated/app.transfer-captain.tsx`
- `src/routes/_authenticated/route.tsx` — Keep MissionShell mounted across /app/* navigations so the dock, SOS host,

## src/types

- `src/types/leaflet-rotate.d.ts`
- `src/types/marine.ts` — THALVO shared marine vocabulary — M6 Architecture Freeze.

## store

- `store/apple-app-privacy.md` — Apple App Privacy (App Store Connect questionnaire)
- `store/google-data-safety.md` — Google Play Data safety form
- `store/listing.en.md` — Store listing copy — English
- `store/listing.tr.md` — Mağaza metinleri — Türkçe
- `store/README.md` — Store package
- `store/review-notes.md` — App Review / Play review notes

## store/assets/screenshots

- `store/assets/screenshots/README.md` — Screenshots

## supabase/migrations

- `supabase/migrations/20260701230657_896db2d8-a977-4293-ba9c-3ab8206b7779.sql` — =========================================
- `supabase/migrations/20260701230719_822c7611-f656-4e75-9d7e-40a1b661209b.sql` — Lock down SECURITY DEFINER RPCs to authenticated users only
- `supabase/migrations/20260701232600_071b5a02-fd88-4739-85d0-fafd4b8ea569.sql` — 1. Profiles SELECT hardening
- `supabase/migrations/20260701233012_478ac933-a22d-4530-9885-b13e4dffebf4.sql` — Ensure profile is auto-created on signup via trigger on auth.users
- `supabase/migrations/20260701233814_d4ea6f7f-f8fb-4cbe-8033-a2b606ceb683.sql`
- `supabase/migrations/20260702003227_0dd8814d-4d91-44db-abac-49060e76ae7d.sql` — 1. Extend profiles
- `supabase/migrations/20260702004506_bc5cefdf-ca55-4115-8678-da31b7b36e22.sql` — =========== Routine service packages ===========
- `supabase/migrations/20260702010230_acc156d4-4078-49b2-b303-1e06a84ef841.sql` — 1. Add Supplier to role enum
- `supabase/migrations/20260702200645_7966d5d4-b13f-408b-a323-261f88a4dc87.sql` — 1. Remove temporary permissive policies
- `supabase/migrations/20260702201108_3ac2fc3b-99f2-4fbc-999a-6139338e2b92.sql` — Forbidden keyword redaction (word-boundary, case-insensitive)
- `supabase/migrations/20260702220131_7d755535-17cd-49f8-9a93-834760b3e9c6.sql` — Extend part_orders with logistics fields
- `supabase/migrations/20260702222815_40946155-5a64-44d0-a9b3-bd39b5944770.sql` — M7 Event Architecture v1 — platform_events table.
- `supabase/migrations/20260702230818_03f39741-16ea-4398-83cd-3233467f7a1e.sql` — ============================================================
- `supabase/migrations/20260702233815_91ea9ebd-14a5-4890-a327-579280cb18ea.sql` — Revoke default PUBLIC execute on every SECURITY DEFINER function,
- `supabase/migrations/20260704180221_a11d8676-f66d-49ee-8d80-89cbe6d71523.sql` — Add a permissive SELECT policy so any Provider (with or without a
- `supabase/migrations/20260704181153_fb2ab6b7-641b-4e36-a3e9-6dde9589ea55.sql` — P0 fix: providers without a matching provider_details row (or with a
- `supabase/migrations/20260704184344_ab2b6ddc-8190-4257-89ab-66fe11cb3903.sql` — 1. Restrict is_provider() SECURITY DEFINER function to authenticated only
- `supabase/migrations/20260704194826_dde0613b-0ff5-443c-95b1-dba28c56fcba.sql` — Helpers to break RLS recursion between profiles → jobs → provider_details → jobs.
- `supabase/migrations/20260704200825_200a2701-fa36-4c87-99f8-ba9270b27c22.sql`
- `supabase/migrations/20260704201734_29a8c345-06c5-42d4-94ac-ac7441ddcda5.sql`
- `supabase/migrations/20260706135221_a2a8d1e9-1f7e-4dd7-af38-b07a589f6834.sql`
- `supabase/migrations/20260710113931_2c9923c6-dd56-4042-87c9-fde892d677ed.sql` — Public read for part-images bucket (bucket is public, but add explicit policy for clarity)
- `supabase/migrations/20260710122038_9494387f-3b87-4e90-b826-30cef22f8640.sql` — Prevent stock from ever going negative at the database level.
- `supabase/migrations/20260710123237_94462330-4579-4f8a-86c0-e10c386c0314.sql`
- `supabase/migrations/20260715150256_ed800e36-a681-42b7-b068-39bec630349a.sql` — Fix: Public bucket allows listing — drop broad SELECT policy on storage.objects for part-images.
- `supabase/migrations/20260729225749_43643ccb-80d6-4a88-804f-12db27223423.sql` — 1. Remove duplicate commission rows produced by the non-idempotent complete_job
- `supabase/migrations/20260729225821_04082a0f-d88b-465f-95fb-3885e716fb00.sql` — Grandfather every account that already has catalog rows.
- `supabase/migrations/20260729225835_6ef0875b-c295-489e-871b-af02a548d6a7.sql`
- `supabase/migrations/20260729225919_bcdf9a93-d55d-4780-8180-a80a12726a94.sql`
- `supabase/migrations/20260729225932_f6883766-d07b-4213-9794-8a9135de8a35.sql` — Demo seed rows: no dealer owns them. Guard against deleting anything ordered.
- `supabase/migrations/20260729230103_c199dfb9-ce99-4502-b703-eb89f8489577.sql`
- `supabase/migrations/20260729230713_9f9fd275-0488-457c-966d-ba94f600d68f.sql` — Public browsing surface: catalogue + service packages only.
- `supabase/migrations/20260729232802_9c15c57f-cd8a-454c-b460-60f4b91af6b8.sql` — ============ B) verified_providers ============
- `supabase/migrations/20260827075340_0f34e29a-aafe-494a-a802-10a0922c3169.sql` — 1. Remove self-declared-role based open pool visibility
- `supabase/migrations/20260905045602_2a48239d-dd18-49ad-93e3-93b0fb472046.sql`
- `supabase/migrations/20260905045700_aa935044-17bc-48df-9669-643ddf42275f.sql`
- `supabase/migrations/20260905053437_b256e9ae-1826-489b-9d19-b5f95c7d6896.sql`
- `supabase/migrations/20260905091500_3819832f-face-448e-815d-938a08e4f8d2.sql` — Report Modal phase: allow anonymous captain advice submissions and add
- `supabase/migrations/20260905093000_e7c1a2f4-6b3d-4a1e-9f2c-8d5e0b7a3c91.sql` — Live Ops phase: the admin tower and every open chart now listen for
- `supabase/migrations/20260909044500_f2d8b6c1-9a34-4e07-b6a0-1c1a8b5e6f2a.sql` — Navily-style seed: curated marinas, anchorages and one charted hazard
- `supabase/migrations/20260909083000_security_hardening.sql` — Static security audit follow-up (2026-09-09):
- `supabase/migrations/20260909084500_emergency_service_requests.sql` — Role-based emergency service & diver call network.
- `supabase/migrations/20260909181500_superadmin_ops.sql` — Superadmin bootstrap + provider claim-job + admin profile/job RPCs.
- `supabase/migrations/20260925235000_close_audit_gaps.sql` — Close the audit gaps that are not the payment simulator or the legal pages.
- `supabase/migrations/20260928153000_thalvo_ai_core.sql` — THALVO AI core: boat records, long-term memory, conversational log.
- `supabase/migrations/20261006152000_leak_trust_cart.sql` — Server-side leak rejection, timed arrivals, dispute log,
- `supabase/migrations/20261006170000_job_photos.sql` — Private photos attached to an SOS / job card.
- `supabase/migrations/20261008120000_signup_role.sql` — Signup was stored as Client and the chosen role sat in requested_role,
- `supabase/migrations/20261008143000_cancel_and_live_call.sql` — Captain can cancel an open call and keep the vessel fix live for the technician.
- `supabase/migrations/20261012040000_boatshow_leads.sql` — Boat-show / partner lead capture for QR landing (/boatshow).
- `supabase/migrations/20261013010000_transfer_captain.sql` — Transfer Captain desk: boat owners (Client / captain accounts) post an urgent
- `supabase/migrations/20261013011500_transfer_captain_role_text_fix.sql` — Repair: live profiles.role is text, not user_role. Re-define the helper so
- `supabase/migrations/20261013213000_launch_security_hardening.sql` — Launch security hardening (public open).
- `supabase/migrations/20261103040000_quality_pass_security_audit.sql` — Quality pass: durable security audit, platform event RPC, dispute resolve.
- `supabase/migrations/20261103053000_payment_security_gates.sql` — Payment security gates + audit hardening (pre–real PSP).
- `supabase/migrations/20261105071500_prelaunch_security_fixes.sql` — Pre-launch security fixes (no PSP). Closes wallet credit break, order
- `supabase/migrations/20261105080000_prelaunch_security_round2.sql` — Pre-launch security round 2: admin enumeration, forged audit/escrow rows,
- `supabase/migrations/20261106070000_auto_live_eta_track.sql` — Live provider position + auto ETA when sailing without an offer ETA.
- `supabase/migrations/20261106090000_dealer_applications.sql` — Marketplace-grade dealer onboarding (TR marketplace parity).
- `supabase/migrations/20261109204852_ensure_upload_storage_buckets.sql` — Ensure every client upload target exists on the live project.

## supabase/templates

- `supabase/templates/confirm.html`
- `supabase/templates/recovery.html`
