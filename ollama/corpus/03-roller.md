# Roller ve auth

## Üç ürün rolü

`user_role`: `Client` | `Provider` | `Supplier`.

`normalizeUserRole` (`src/lib/session.ts`) serbest metni katlar:

- `provider`, `mechanic`, `diver` → `Provider` (teknisyen)
- `supplier`, `dealer` → `Supplier` (bayi)
- diğer her şey → `Client` (kaptan)

Canlı `profiles.role` metindir. Üretilmiş `types.ts` aynı kolonu enum diye tarif eder. Okurken `normalizeUserRole` kullan. Ayrıcalık yazma istemciden `profiles` güncellemesiyle yapılmaz; `prevent_profile_privilege_escalation` ve insert tetikleri bunu keser.

## Yönetici

`app_role`: `admin` | `user`, tablo `user_roles`. Kontrol kulesi `has_role` / `userHasAdminRole`. `ensure_superadmin` istemciden e-posta ile admin açmaz. `/admin` hem operatör e-postası hem admin satırı ister.

## Kayıt

E-posta doğrulaması açık. Akış `src/routes/auth.tsx`.

- Kaptan: tekne akışı.
- Teknisyen: teknisyen formu.
- Bayi: `src/components/auth/DealerApplicationWizard.tsx` ve `src/lib/dealer-application.ts`. Alanlar: tüzel tür, yasal/mağaza adı, vergi no ve dairesi, gerekiyorsa MERSİS, KEP, fatura türü, ticaret unvanıyla eşleşen IBAN, kayıt/fatura/sevk/iade adresleri, ana marina, operasyon ve finans kişileri, ürün odağı, belgeler `dealer-documents` kovasında. Başvuru `dealer_applications` satırı ve `requested_role` olarak durur. Onaya kadar rol `Client` kalır.

`claim_signup_role` istenen rolü signup metadata’sından profile işler; `verified_dealers` / `verified_providers` eklemez. Onay `approve_role_request(_user_id, _role)`.

Doğrulanmamış hesap herkese açık haritaya uyarıyla girer. Kokpit doğrulama linkinden sonra.

Oturum `useSessionUser` / `useProfile`. Profil gecikince kaptan ile teknisyen yer değiştirilmesin diye yavaş fetch’te uydurma `Client` profili üretilmez. `profile_contacts` telefonu ayrı tablodadır. Şema eksiği `src/lib/schema-gap.ts` ile not edilir; eksik `profiles` tablosunda kokpit düşmesin diye `cockpitFallbackProfile` vardır.

Yönlendirme sonrası `sanitizeNext` (`src/lib/nav.ts`) yalnız tek eğik çizgiyle başlayan göreli yol kabul eder. `/auth` ve `*.html` hedefleri kapalıdır.
