# RPC kataloğu

Çağrılar `supabase.rpc("ad", { ... })` şeklindedir. Gövde son migration’dadır. Denetim notu `docs/RPC_SECURITY_AUDIT.md` erken bir kesittir; 2026-10 ve 2026-11 dosyaları onu günceller.

## Kaptan ve iş

| RPC | Görev |
| --- | --- |
| `cancel_own_call(_job_id)` | Kaptan kendi açık çağrısını iptal eder |
| `refresh_own_call_position(...)` | Açık çağrının konumunu günceller |
| `accept_offer(_job_id, _offer_id)` | Teklifi kabul, işi bağlar |
| `record_payment_intent(_job_id, _offer_id)` | Ödeme niyeti ve escrow `secure` |
| `complete_job(_job_id)` | Tamamlama, release, komisyon, payout satırı |
| `set_sail(_job_id)` | Yola çıkış |
| `mark_arrived(_job_id)` | Varış |
| `claim_open_job(_job_id)` | Açık işi üstlenme |
| `add_extra_part(...)` | İşe ek parça |
| `book_service_package(...)` | Paket rezervasyonu |
| `accept_emergency_request(_id)` | Acil servis isteğini kabul |
| `accept_transfer_captain_application(p_application_id)` | Transfer başvurusunu kabul |
| `is_captain_client(uid)` | Kaptan istemcisi mi |

## Konum

`refresh_own_provider_position(...)` teknisyen canlı konumu. `thalvo_haversine_nm(...)` deniz mili. İstemci ETA `src/lib/geo-eta.ts` ve `src/lib/marine.ts`.

## Marketplace

`checkout_parts_cart(...)` sepeti bayi başına siparişe böler (`20261006152000_leak_trust_cart.sql`). `approve_part`, `reject_part`.

## Ödeme kapıları

`payment_mode()` — `platform_settings` içinden; varsayılan simülasyon. `confirm_payment_intent_from_provider(...)` canlı modda niyeti kuruluş onayına bağlamak içindir. Simülasyonda niyet `record_payment_intent` ile `secured` açılır. Ayrıntı `20261103053000_payment_security_gates.sql`.

## Rol ve admin

`claim_signup_role()`, `approve_role_request(_user_id, _role)`, `has_role`, `is_provider`, `is_verified_dealer`, `is_verified_provider`, `admin_list_users`, `admin_set_user_available`, `admin_set_directory_role`, `admin_reassign_job`, `admin_close_job`, `admin_delete_job`, `ensure_superadmin`.

## Güven ve sohbet

`mask_job_message`, `reveal_contact_allowed`, `provider_trust_signals`, `record_security_event`, `emit_platform_event`, `resolve_job_dispute`, `flag_mission_for_review`.

## AI

`consume_captain_ai_quota`, `match_ai_memories`. Bellek tablosu `ai_memories`. Kota `ai_request_log` ile birlikte `20260925235000_close_audit_gaps.sql` civarındadır.

Yeni RPC eklerken `SECURITY DEFINER` ise `PUBLIC` ve `anon` execute kapatılır, gövde `auth.uid()` veya `has_role` ile kendini sınırlar, mali yazma istemci `UPDATE`'ine bırakılmaz.
