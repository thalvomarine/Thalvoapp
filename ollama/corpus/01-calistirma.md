# Çalıştırma ve yayın

Kök `package.json`. Paket adı tarihsel olarak `tanstack_start_ts`.

```bash
npm ci
npm run dev          # vite dev
npm test             # node:test, listedeki src/lib/*.test.ts dosyaları
npm run typecheck    # tsc --noEmit
npm run lint
npm run build        # prebuild assert + vite build + SPA hazırlığı + api paketi
```

`prebuild`, `scripts/assert-tanstack-start.mjs` ile eski bir Start sürümünün yayınlanmasını keser. Canlı site GitHub üzerinden `thalvo.org` olur. Eski bir TanStack Start artefaktı yeniden yayınlanmaz.

`postbuild`: `scripts/prepare-web-spa.mjs` ve `scripts/bundle-api.mjs`. İkinci betik `serverless/*.ts` kaynaklarını `api/chat.js` ve `api/assistant.js` haline getirir. Vercel statik `dist/` üzerinde TanStack sunucu fonksiyonu çalıştırmaz; canlı sohbet bu iki uçtan gider.

Mobil:

```bash
npm run build:mobile     # ikon, mağaza varlığı, cap sync
npm run store:preflight
npm run ios:preflight
npm run android:preflight
```

`capacitor.config.ts`: `appId` `com.thalvo.marineos`, `webDir` `dist`, zemin `#0A192F`. `CAPACITOR_LIVE_URL` yalnız geliştirme içindir; cihaz ve TestFlight derlemesinde boş kalır. Sürüm numarası `docs/STORE_LAUNCH.md` içindedir.

Auth yönlendirme URL’leri: `docs/AUTH_EMAIL.md` ve `npm run auth:apply-urls`. Betik `scripts/apply-auth-url-config.mjs`. Site URL `https://thalvo.org` olur.

## Ortam değişkeni adları

Değerler `.env` içindedir ve bu pakete yazılmaz. Adlar `.env.example` dosyasındadır.

İstemciye gömülebilir (publishable):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY` (yoksa `VITE_SUPABASE_ANON_KEY`)
- `VITE_SUPABASE_PROJECT_ID`
- `VITE_SUPERADMIN_EMAIL` — `/admin` kilidi; kişisel adres kaynakta durmaz
- `VITE_GOOGLE_ADS_ID` ve dönüşüm etiketleri — boşsa ölçüm kapalı
- `VITE_VAPID_PUBLIC_KEY` — isteğe bağlı web push
- `VITE_CARTO_DARK_TILE_URL` — boş bırakılır; kokpit Esri Dark Gray kullanır

Yalnızca sunucu:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ACCESS_TOKEN` — yalnız auth URL betiği
- `THALVO_AI_API_KEY`, `THALVO_AI_BASE_URL`, `THALVO_AI_MODEL`, `THALVO_AI_EMBEDDING_MODEL`

Anahtar yokken AI uçları `answerFromTraining` ile cevap verir; 503 dönmez.

## Test dosyaları

`package.json` içindeki `test` betiği şu aileleri çalıştırır: geolocation, nav, payments, sea-route, tile-cache, trust, digit-format, thalvo-ai domain, capgo, ai-lang, geo-eta, dealer-application, google-ads, signup-welcome, ve `ollama/scripts/lib.test.mjs`.
