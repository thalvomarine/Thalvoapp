# İş akışları

## SOS ve görev

Kaptan `src/components/mission/SosSheet.tsx` ile iş açar. Olay `sos.created`. İş `jobs` satırıdır. Durumlar `job_status` enum’undadır. Açık SOS, `cancel_own_call` veya tamamlanana kadar Görevler listesinde kalır. Konum tazeleme `refresh_own_call_position`. Teknisyen yola çıkınca `set_sail`, varınca `mark_arrived`. Canlı ETA `20261106070000_auto_live_eta_track.sql`.

Teklif `job_offers`. Kabul `app.job.$id.tsx` içinde `accept_offer`, ardından `record_payment_intent`. Tamamlama `complete_job`.

Sohbet `src/components/JobChat.tsx`. Yüksek riskli mesaj `mask_job_message` ve `src/lib/security.ts` ile düşer; olay `chat.high_risk_blocked`.

## Ödeme

Kabul, niyeti ve `escrow_transactions.kind = secure` satırını açar. Kaptan tamamlayınca `complete_job` niyeti `released` yapar, `release` satırı, `commission_records` ve `pending` payout yazar. Komisyon emeğin 0.1’idir. Kart verisi bir kuruluşa gitmez. Arayüz simülasyonu etiketler. Yönetici paneli `src/components/admin/AdminPaymentOpsPanel.tsx` ve `EscrowOpsPanel.tsx`. Elle verify/release/refund/payout, gerçek kuruluş bağlanana kadar kapalıdır. Yeni tüketiciler `platform_ledger` yerine `commission_records` ve `provider_payouts` okur.

## Parça siparişi

Katalog `parts_catalog`, herkese açık görünüm `public_parts_catalog`. Sepet `src/lib/cart.ts`. Ödeme `checkout_parts_cart`; bir sepette birden fazla bayi varsa sipariş bayi başına bölünür. Sipariş durumu ilerlemesi `src/components/orders/`. Boş katalog boş durumdur.

## Bayi ve tekne ilanı

Onaylı bayi `/app/dealer`, stok `DealerStockPanel`. Tekne ilanları `boat_listings` ve `src/lib/boat-listings.ts`. İlan WhatsApp veya `tel:` açmaz; uygulama içi sorgu gösterilir.

## Pasaport

`/app/passport` ve `src/components/passport/`: tekne kimliği, takılı parçalar, bakım, `vessel_documents`.

## Transfer kaptan

`/app/transfer-captain`, tablolar `transfer_captain_*`, kabul `accept_transfer_captain_application`. Rol metin düzeltmesi `20261013011500_transfer_captain_role_text_fix.sql`.

## Boat show

`/boatshow`, `boatshow_leads`, `src/lib/boatshow-leads.ts`.

## Topluluk ve bölge

`marine_zones`, `community_reports`. Admin `MarineZoneTable`, `CommunityReportDesk`.

## İtibar

`src/lib/trust.ts` ve `provider_trust_signals`. Skor puan ve hacimden gelir; olay sayıları henüz skora katılmaz. Ayrıntı `docs/TECHNICAL_DEBT.md`.

## Olaylar

Sözlük `src/lib/events.ts`. Üreten yerler dokümanda: SOS, görev, teklif, sipariş, sohbet, admin, ödeme. `emitEvent` ateşle-unut. Mali olayın denetim kopyası RPC içindedir.
