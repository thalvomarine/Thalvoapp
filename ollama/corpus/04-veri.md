# Veri modeli

Şema kaynağı `supabase/migrations/`, dosya adı zaman sırasıdır. Aynı fonksiyon birden fazla dosyada `CREATE OR REPLACE` ise en sondaki gövde geçerlidir. `src/integrations/supabase/types.ts` istemci sözleşmesidir ve son migration’lardan geri kalabilir. Tabloda olup tiplerde yoksa önce migration’a bak.

## Tiplerde duran tablolar

`ai_memories`, `boat_listings`, `chat_messages`, `commission_records`, `community_reports`, `dealer_applications`, `emergency_service_requests`, `escrow_transactions`, `job_messages`, `job_offers`, `job_parts`, `jobs`, `marine_zones`, `part_order_items`, `part_orders`, `parts_catalog`, `payment_intents`, `platform_events`, `platform_ledger`, `profile_contacts`, `profiles`, `provider_details`, `provider_payouts`, `provider_service_packages`, `service_packages`, `user_boats`, `user_roles`, `verified_dealers`, `verified_providers`, `vessel_documents`, `vessels`.

Görünümler: `public_parts_catalog`, `provider_live_pins`. İkincisi kokpit içindir; herkese açık `/chart` canlı pin çizmez.

## Migration’da olup üretilmiş tiplerde görünmeyenler

Bunlar canlı şemada vardır; tipler yenilenmeden istemci `from()` tipi eksik kalabilir:

- `security_events` — `20261103040000_quality_pass_security_audit.sql`
- `job_disputes` — aynı dosya ve daha önceki `20261006152000_leak_trust_cart.sql`
- `platform_settings` — `20261103053000_payment_security_gates.sql` (`payments.mode`)
- `boatshow_leads` — `20261012040000_boatshow_leads.sql`
- `transfer_captain_requests`, `transfer_captain_applications` — `20261013010000_transfer_captain.sql`
- `ai_request_log` — `20260925235000_close_audit_gaps.sql`

## Enumlar (`types.ts`)

- `job_status`: Pending, Offered, Accepted, EnRoute, OnSite, PartsPending, InProgress, Completed, Cancelled
- `service_type`: Marine Mechanic, Underwater Diver
- `part_status`: Pending, Paid, Rejected
- `provider_status`: Available, Busy, Offline
- `language_code`: tr, en (arayüz ayrıca `el` yükler)
- `user_role`: Client, Provider, Supplier
- `app_role`: admin, user

## Depolama kovaları

`part-images`, `job-photos`, `vessel-documents`, `dealer-documents`.

## Para satırları

`payment_intents`, `escrow_transactions` (`secure`, `release`, `refund`, `extra_secure`, `extra_release`), `commission_records`, `provider_payouts` (`pending`, `processing`, `completed`, `failed`). Para birimi kolonu TRY. Ayrıntı `docs/PAYMENT_ARCHITECTURE.md` ve `src/lib/payments.ts`.

## Olay satırı

`platform_events`: actor, subject_type, subject_id, event_type, severity, metadata. Sözlük `src/lib/events.ts`. Doğrudan `INSERT` authenticated rolünden alınmıştır; istemci `emit_platform_event` kullanır.
