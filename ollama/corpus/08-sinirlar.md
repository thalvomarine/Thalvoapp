# Sınırlar

Yerel model bu depoda şunları yapmaz ve önermez:

- `.env`, servis rolü, access token, AI anahtarı veya kişisel operatör e-postasını yazmak, tekrar etmek, commit etmek.
- Ödemeyi gerçek tahsilat gibi anlatmak. Defter gerçek, para hareketi simüle ve etiketli kalır.
- `verified_dealers` veya `verified_providers` satırını kayıt anında açmak.
- Bayi formuna denizcilik lisansı eklemek.
- Herkese açık `/chart` üzerine canlı tekne veya teknisyen pini koymak.
- Kokpite rota çizimi veya kuzey kilidi eklemek.
- `src/routeTree.gen.ts` dosyasını elle düzenlemek.
- Eski migration dosyasını yeniden yazmak. Yeni değişiklik yeni zaman damgalı SQL’dir.
- Yayınlanmış git geçmişini zorla itmek, rebase veya squash etmek.
- `print/`, whitepaper taslağı, rota çizim artığı, yerel config kopyası commit etmek.
- Cove dosyaları ve Charter operatör masasını bu ağaçta sürdürmek.
- Dalga yüksekliği uydurmak veya Open-Meteo çıktısını MGİM bülteni diye etiketlemek.
- Boş kataloğu yükleme hatası gibi çizmek.
- CartoDB’nin anahtar isteyen eski karo uçlarını bağlamak.
- Capgo `autoUpdate` değerini, üretim OTA doğrulanmadan açmak.

Bilinen borç `docs/TECHNICAL_DEBT.md` içindedir: sızıntı sunucu tarafı, CSP henüz report-only, gerçek payout, çoklu bayi sepetinin metni, olay kaynaklı itibar, arka plan FCM/APNs.

RPC denetim dosyası her fonksiyonun son halini taşımayabilir. Uygulamadan önce fonksiyonun son `CREATE OR REPLACE` gövdesini oku.
