# Rotalar

TanStack Router dosya tabanlıdır. Kök kabuk `src/routes/__root.tsx`. Ağaç `src/routeTree.gen.ts` içine üretilir.

## Herkese açık

| URL | Dosya | İş |
| --- | --- | --- |
| `/` | `src/routes/index.tsx` | Marka inişi (Concept B), `BrandLanding` |
| `/chart` | `src/routes/chart.tsx` | Herkese açık kıyı haritası |
| `/auth` | `src/routes/auth.tsx` | Giriş ve kayıt |
| `/about` | `src/routes/about.tsx` | Hakkında |
| `/services` | `src/routes/services.tsx` | Herkese açık hizmetler |
| `/marketplace` | `src/routes/marketplace.tsx` | Herkese açık parça kataloğu |
| `/marketplace-preview` | `src/routes/marketplace-preview.tsx` | Katalog önizlemesi |
| `/boatshow` | `src/routes/boatshow.tsx` | Boat show lead formu |
| `/coverage` | `src/routes/coverage.tsx` | Kapsam |
| `/privacy` | `src/routes/privacy.tsx` | Gizlilik |
| `/terms` | `src/routes/terms.tsx` | Koşullar |
| `/delivery-returns` | `src/routes/delivery-returns.tsx` | Teslimat ve iade |
| `/distance-sales` | `src/routes/distance-sales.tsx` | Mesafeli satış |
| `/offline` | `src/routes/offline.tsx` | Çevrimdışı kabuk |

Partner ol, inişin altında bir bölüm açmaz; partner masasını modal olarak açar.

## Oturum zorunlu

Kapı `src/routes/_authenticated/route.tsx`. Oturum yoksa `/auth?next=`. Kabuk `MissionShell`; `/app` üzerinde kaptan ve teknisyen tam ekran haritadır.

| URL | Dosya | İş |
| --- | --- | --- |
| `/app` | `app.index.tsx` | Canlı kokpit ve harita |
| `/app/marketplace` | `app.marketplace.tsx` | Parça ve ilan masası |
| `/app/shop` | `app.shop.tsx` | Eski link; `/app/marketplace` adresine döner |
| `/app/services` | `app.services.tsx` | Bakım hizmetleri |
| `/app/orders` | `app.orders.tsx` | Sipariş ve escrow |
| `/app/passport` | `app.passport.tsx` | Tekne pasaportu |
| `/app/profile` | `app.profile.tsx` | Profil |
| `/app/report` | `app.report.tsx` | Destek / arıza bildirimi |
| `/app/reputation` | `app.reputation.tsx` | İtibar |
| `/app/supplier` | `app.supplier.tsx` | Tedarikçi masası |
| `/app/dealer` | `app.dealer.tsx` | Onaylı bayi masası |
| `/app/admin` | `app.admin.tsx` | Kontrol kulesi (`user_roles.admin`) |
| `/app/job/$id` | `app.job.$id.tsx` | İş, teklif, sohbet, escrow |
| `/app/transfer-captain` | `app.transfer-captain.tsx` | Kaptan transferi |
| `/admin` | `admin.tsx` | Operatör masası (`ensureSuperadminRouteAccess`) |

THALVO AI’nin açmasına izin verilen sayfalar `src/lib/thalvo-ai/platform-routes.ts` içindeki `PLATFORM_ROUTES` listesidir. `/escrow` → `/app/orders`, `/support` → `/app/report`, `/app/shop` → `/app/marketplace`. Liste dışı yol sunucuda ve arayüzde reddedilir.
