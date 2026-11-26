# Thalvo MarineOS — yerel model anayasası

Bu dosya, depoyu tarayan yerel modelin çalışma kuralıdır. Ürünün kendisi deponun geri kalanıdır: `src/`, `supabase/migrations/`, `serverless/`, `docs/`, `store/`. `ollama/corpus/` haritadır; çelişki olursa kaynak dosya ve zaman sırasındaki son migration geçerlidir.

Cevabı kullanıcının dilinde ver. Dosya yolu ve sembol adlarını olduğu gibi yaz. Snippet’te olmayan tablo, RPC, rota veya hava değerini uydurma. Emin değilsen açılacak dosyayı söyle.

## Ürün

THALVO MarineOS, Ege ve Akdeniz kıyısı için seyir, marina bilgisi ve talep üzerine acil müdahale platformudur. Canlı site `thalvo.org`, bu deponun `main` dalından yayınlanır. Görünür marka dilleri: Türkçe, İngilizce, Yunanca (`src/i18n`, `supportedLngs`: `tr`, `en`, `el`).

Kapsam metni Ege ve Akdeniz’dir. Marina adları gerçek yer adlarıdır.

## Yığın

React 19, Vite, TanStack Start / TanStack Router, Tailwind 4, Leaflet, Supabase (Postgres, Auth, Storage). Mobil kabuk Capacitor; bundle id `com.thalvo.marineos`. Mağaza notları `docs/STORE_LAUNCH.md` ve `store/`. Capgo `autoUpdate` üretim OTA doğrulanana kadar kapalı kalır.

Rotalar `src/routes/` altındaki dosya adlarından gelir. `src/routeTree.gen.ts` üretilir; elle düzenlenmez.

## Ölçü ve görünüm

Hız knot, mesafe deniz mili, derinlik metre. Koordinat `formatDm` (`src/lib/formatters.ts`): `DD°MM.MM'`. Para birimi TRY; tutarlar sunucuda kuruş cinsindendir (`src/lib/payments.ts`). Komisyon oranı `THALVO_COMMISSION_RATE` (0.1).

Tema anahtarı `thalvo-theme`: `system` bu kokpit, `day` beyaz, `night` siyah (`src/lib/theme.ts`). Kokpit zemini `#0A192F`. Anlamlı renkler `docs/DESIGN_TOKENS.md` ve `src/styles.css` içindedir. SOS gradyanı kokpitteki tek doygun çağrıdır.

Harita karoları: Esri World Dark Gray taban (`MARINE_PUBLIC_BASE_URL`) ve OpenSeaMap seamark (`src/lib/chart-tiles.ts`). Gece haritasında CSS `invert()` kullanılmaz. Eski CartoDB anahtarlı uçlar kullanılmaz.

Kokpit rota çizmez ve kuzey kilidi taşımaz. Katman menüsü masaüstünde kontrol panelidir; katman düğmesi dar ekran içindir. Herkese açık harita `/chart` üzerindedir. Canlı tekne ve teknisyen pinleri bu herkese açık haritaya konmaz.

## Kimlik

`profiles.role` canlı veritabanında metindir. İstemci bunu `normalizeUserRole` ile `Client`, `Provider` veya `Supplier` yapar (`src/lib/session.ts`). Kaptan `Client`, teknisyen `Provider`, bayi `Supplier`. Yönetici bayrağı `user_roles` satırında `app_role = admin` değeridir; profil rolü değildir.

Kayıt ayrıcalık yükseltmez. `claim_signup_role` istenen rolü metadata’dan yazar. `verified_dealers` ve `verified_providers` kaydolunca otomatik dolmaz. Bayi çok adımlı başvurudur (`dealer_applications`); admin `approve_role_request` ile onaylar, sonra `/app/dealer` açılır. Bayi formuna denizcilik lisansı konmaz. Teknisyen kaydı teknisyen formudur. Kaptan kaydı tekne akışıdır.

Supabase e-posta doğrulaması açıktır. Doğrulanmamış ziyaretçi herkese açık haritaya uyarıyla girer. Kokpit, doğrulama bağlantısından sonra açılır. `/_authenticated` oturumsuz isteği `/auth` adresine `next` ile yollar; `sanitizeNext` yalnız aynı kökten göreli yol kabul eder.

`/app/admin` kontrol kulesi `user_roles.admin` ister. `/admin` platform operatörü e-postası (`VITE_SUPERADMIN_EMAIL`) ve admin satırı ister (`src/lib/superadmin.ts`). Kişisel e-posta istemci paketine yazılmaz.

## Operasyon kuralları

Açık SOS, kaptan iptal edene veya iş tamamlanana kadar Görevler’de kalır. İptal `cancel_own_call`, canlı konum `refresh_own_call_position` (`supabase/migrations/20261008143000_cancel_and_live_call.sql`).

Boş katalog bir boş durumdur, yükleme hatası değildir.

THALVO AI denizcilik, makine ve hava cevaplar. Dalga yüksekliği uydurulmaz. Canlı hava Open-Meteo’dur; resmî MGİM bülteni değildir. Sunucu fonksiyonu düşerse istemci `answerFromTraining` ile cevap vermeye devam eder. Sohbet uçları `serverless/chat.ts` ve `serverless/assistant.ts` kaynaklıdır; canlıda `api/chat.js` ve `api/assistant.js` olarak paketlenir. Statik `dist/` TanStack sunucu fonksiyonu çalıştıramaz.

Ödeme defteri gerçektir (`payment_intents`, `escrow_transactions`, `commission_records`, `provider_payouts`). Kart çekimi ve payout rayı simüle ve etiketlidir. `CheckoutModal` kart alanlarını bir ödeme kuruluşuna göndermez. Metin “simüle” olarak kalır; sigorta veya banka garantisi iddiası yazılmaz.

`platform_events` telemetridir, kuyruk değildir. İstemci `emitEvent` beklenmez ve hata fırlatmaz. Ayrıcalıklı mali olaylar RPC içinde yazılır. `metadata` içine sır, telefon, IBAN veya tam adres konmaz.

İş sohbetinde sızıntı `mask_job_message` ve `src/lib/security.ts` ile kesilir.

## Şema

İstemci tipleri `src/integrations/supabase/types.ts` dosyasındadır. Bu dosya migration’ların gerisinde kalabilir. Yeni kolon ve RPC için `supabase/migrations/` zaman damgası sırasıyla son tanımdır. `CREATE OR REPLACE` zincirinde en sondaki gövde geçerlidir.

## Gizlilik

`.env`, servis rolü anahtarı, `SUPABASE_ACCESS_TOKEN`, `THALVO_AI_API_KEY` ve kişisel operatör e-postası ne cevaba ne corpus’a yazılır. Değişken adları `.env.example` içindedir. Anahtar değeri istenirse dur ve adın nereye konacağını söyle.

## Bu depoda yapılmayan iş

`print/`, whitepaper taslakları, rota çizim artıkları ve yerel config kopyaları commit edilmez. Cove dosyaları ve Charter operatör masası bu ağaçta sürdürülmez.

## Cevap biçimi

Önce hangi dosyanın ve hangi fonksiyonun işi yaptığını söyle. Sonra değişiklik gerekiyorsa dokunulacak dosyaları sırala. Migration gerekiyorsa yeni bir zaman damgalı SQL dosyası öner; eski migration’ı yeniden yazma.
