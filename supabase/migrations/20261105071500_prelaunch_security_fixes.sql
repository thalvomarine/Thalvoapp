-- Pre-launch security fixes (no PSP). Closes wallet credit break, order
-- forgery, profile PII broadcast, and payment_intents privilege leftovers.

-- ---------- 1) Restore wallet credit path for complete_job ----------
-- signup_role migration dropped the thalvo.internal_wallet_credit escape
-- hatch that complete_job still sets, so mission completion could not
-- credit the provider wallet.
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_setting('thalvo.role_claim', true) = '1' THEN
    RETURN NEW;
  END IF;
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Not allowed to change role';
  END IF;
  IF NEW.wallet_balance IS DISTINCT FROM OLD.wallet_balance THEN
    IF current_setting('thalvo.internal_wallet_credit', true) IS DISTINCT FROM 'on' THEN
      RAISE EXCEPTION 'Not allowed to change wallet_balance';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.prevent_profile_privilege_escalation() FROM PUBLIC, anon, authenticated;

-- ---------- 2) part_orders: force checkout RPC; lock dealer financial edits ----------
REVOKE INSERT, DELETE, TRUNCATE ON public.part_orders FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.part_orders FROM anon;
GRANT SELECT, UPDATE ON public.part_orders TO authenticated;
GRANT ALL ON public.part_orders TO service_role;

DROP POLICY IF EXISTS "orders_buyer_insert" ON public.part_orders;

-- Line items must come from checkout_parts_cart (SECURITY DEFINER), not PostgREST.
DO $$
BEGIN
  IF to_regclass('public.part_order_items') IS NOT NULL THEN
    EXECUTE 'REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.part_order_items FROM PUBLIC, anon, authenticated';
    EXECUTE 'GRANT SELECT ON public.part_order_items TO authenticated';
    EXECUTE 'GRANT ALL ON public.part_order_items TO service_role';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.prevent_part_order_direct_tamper()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF current_user IS DISTINCT FROM 'authenticated' THEN
    RETURN NEW;
  END IF;
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  -- Dealers may only advance status / notes — not rewrite money or parties.
  IF NEW.buyer_id IS DISTINCT FROM OLD.buyer_id
     OR NEW.dealer_id IS DISTINCT FROM OLD.dealer_id
     OR NEW.total IS DISTINCT FROM OLD.total
     OR NEW.subtotal IS DISTINCT FROM OLD.subtotal
     OR NEW.commission IS DISTINCT FROM OLD.commission
     OR NEW.vessel_id IS DISTINCT FROM OLD.vessel_id
  THEN
    RAISE EXCEPTION 'ORDER_FINANCIAL_FIELDS_RPC_ONLY';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS part_orders_prevent_direct_tamper ON public.part_orders;
CREATE TRIGGER part_orders_prevent_direct_tamper
BEFORE UPDATE ON public.part_orders
FOR EACH ROW EXECUTE FUNCTION public.prevent_part_order_direct_tamper();

REVOKE ALL ON FUNCTION public.prevent_part_order_direct_tamper() FROM PUBLIC, anon, authenticated;

-- ---------- 3) Profiles: stop anon/public full-table read ----------
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
REVOKE ALL ON public.profiles FROM anon;
-- authenticated keeps existing own / admin / job-participant policies.

-- ---------- 4) payment_intents: no client write path ----------
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.payment_intents FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.payment_intents TO authenticated;
GRANT ALL ON public.payment_intents TO service_role;

-- ---------- 5) Boat listings: mask seller phone for non-owners ----------
-- Table may not exist yet on every environment; only wire the feed when present.
DO $$
BEGIN
  IF to_regclass('public.boat_listings') IS NULL THEN
    RAISE NOTICE 'boat_listings missing — skip feed view';
    RETURN;
  END IF;

  EXECUTE $v$
    CREATE OR REPLACE VIEW public.boat_listings_feed
    WITH (security_invoker = true) AS
    SELECT
      id, owner_id, title, year, price, currency, marina, region, hull,
      loa_m, beam_m, draft_m, engine_brand, engine_hp, engine_hours, fuel,
      flag, cabins, berths, cruise_kn, fuel_tank_l, water_tank_l, lat, lng,
      equipment, description, seller_name,
      CASE
        WHEN owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin')
          THEN seller_phone
        ELSE NULL
      END AS seller_phone,
      hue, photos, status, created_at, updated_at
    FROM public.boat_listings
  $v$;

  EXECUTE 'GRANT SELECT ON public.boat_listings_feed TO authenticated';
  EXECUTE 'REVOKE ALL ON public.boat_listings_feed FROM PUBLIC, anon';
END $$;
