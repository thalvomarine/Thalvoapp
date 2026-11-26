# Arayüz, harita, AI

## Kokpit

Oturumlu sayfalar `MissionShell` (`src/components/mission/`). Ortak primitifler `src/components/core/`: `CockpitPage`, `CockpitHeader`, `StatusBadge`, `EmptyState`, `RiskBanner`, `MoneyAmount`, `EtaBadge`, `TrustBadge`. Yeni kod bu barrel’dan ve `src/lib/formatters.ts`, `src/lib/marine.ts`, `src/types/marine.ts` üzerinden gider. Eski `mission/StatusChip` durur; toplu import değişimi yapılmaz.

Bileşen aileleri: `mission`, `marketplace`, `orders`, `passport`, `trust`, `security`, `admin`, `payments`, `map`, `public`, `auth`, `brand`, `transfer-captain`, `ui` (Radix sarmalları). Katalog `docs/COMPONENT_CATALOG.md`.

Hata kabı `CockpitErrorBoundary` ve authenticated route’taki `AuthErrorBoundary`. Denizde boş ekran yerine yeniden dene ve haritaya dön.

## Harita

`src/components/LiveMap.tsx`, tembel `LiveMapLazy.tsx`. Karolar `src/lib/chart-tiles.ts`. Katman bus `src/lib/map-layers-bus.ts`, odak `src/lib/map-focus-bus.ts`. Karo önbelleği `src/lib/map/tileCache.ts`. Kuzey hesabı `src/lib/chart-north.ts` bir kilit kontrolü değildir.

Herkese açık güverte `src/components/public/ChartDeck.tsx` ve `/chart`. Gece tabanı Esri World Dark Gray, üstte OpenSeaMap. Canlı tekne ve teknisyen pinleri bu sayfada yoktur.

`src/lib/sea-route/` koridor ve kara maskesi geometrisi tutar. Kokpit kullanıcıya rota çizdirmez. Bu modülü ürün özelliği gibi yeni bir çizim aracı yapmak için kullanma.

## Tema ve dil

`src/lib/theme.ts`: `system` `#0A192F`, `day` `#f4f7fb`, `night` `#000000`. Anahtar `thalvo-theme`.

Metinler `src/i18n/locales/tr.json`, `en.json`, `el.json`. Yükleyici `src/i18n/index.ts`. Profil `preferred_language` tiplerde `tr | en`.

## AI

İstemci `src/components/ThalvoChat.tsx`, `ThalvoAiFab.tsx`, `src/lib/thalvo-ai/`. Sistem metni `system-prompt.ts`. Hava `marine-weather.ts` ve `sea-state.ts` (Open-Meteo). Eğitim yedeği `domain.ts` / `answerFromTraining`. Rota açma `platform-routes.ts`. Kota ve bellek sunucu RPC’leri. Ağ geçidi `src/lib/ai-gateway.server.ts`.

Kaptan bağlamı `src/lib/ai-captain-context-bus.ts`. Model dalga yüksekliği, resmi bülten veya snippet’te olmayan parça fiyatı üretmez.

## PWA ve yerli

`src/lib/pwa.ts`, `src/lib/native.ts`, `src/lib/capgo.ts`. Uyanık tutma `@capacitor-community/keep-awake`. Mağaza metinleri `store/listing.tr.md` ve `store/listing.en.md`. Ödeme inceleme notlarında da simüle olarak yazar (`store/review-notes.md`).
