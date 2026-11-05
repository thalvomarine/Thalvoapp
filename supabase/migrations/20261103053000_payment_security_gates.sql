-- Payment security gates + audit hardening (pre–real PSP).
-- Simulated mode stays available for pilot with explicit _demo_ack.
-- Live mode: client cannot mark funds secured; webhook/service_role only.

-- ---------- platform payment mode ----------
CREATE TABLE IF NOT EXISTS public.platform_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "platform_settings: admin read" ON public.platform_settings;
CREATE POLICY "platform_settings: admin read"
  ON public.platform_settings FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Anyone authenticated may read the payments mode (needed by clients).
DROP POLICY IF EXISTS "platform_settings: auth read payments" ON public.platform_settings;
CREATE POLICY "platform_settings: auth read payments"
  ON public.platform_settings FOR SELECT TO authenticated
  USING (key = 'payments');

GRANT SELECT ON public.platform_settings TO authenticated;
GRANT ALL ON public.platform_settings TO service_role;

INSERT INTO public.platform_settings (key, value)
VALUES ('payments', jsonb_build_object('mode', 'simulated'))
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.payment_mode()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    NULLIF(trim(value->>'mode'), ''),
    'simulated'
  )
  FROM public.platform_settings
  WHERE key = 'payments'
$$;

REVOKE ALL ON FUNCTION public.payment_mode() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.payment_mode() TO authenticated, service_role;

-- ---------- harden record_security_event ----------
CREATE OR REPLACE FUNCTION public.record_security_event(
  _job_id uuid,
  _risk text,
  _source text,
  _categories text[] DEFAULT '{}',
  _summary text DEFAULT NULL,
  _metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED';
  END IF;
  IF _risk IS NULL OR _risk NOT IN ('low', 'medium', 'high') THEN
    RAISE EXCEPTION 'INVALID_RISK';
  END IF;
  IF _job_id IS NULL THEN
    RAISE EXCEPTION 'JOB_REQUIRED';
  END IF;

  -- Caller must be a job party (or admin). Prevents forged audit spam on foreign jobs.
  IF NOT public.has_role(auth.uid(), 'admin')
     AND NOT EXISTS (
       SELECT 1 FROM public.jobs j
       WHERE j.id = _job_id
         AND (j.client_id = auth.uid() OR j.provider_id = auth.uid())
     )
  THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  INSERT INTO public.security_events (
    actor_id, job_id, risk, source, categories, summary, metadata
  ) VALUES (
    auth.uid(),
    _job_id,
    _risk,
    COALESCE(NULLIF(trim(_source), ''), 'client'),
    COALESCE(_categories, '{}'),
    left(COALESCE(_summary, ''), 500),
    COALESCE(_metadata, '{}'::jsonb)
  )
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

-- ---------- harden emit_platform_event (client allowlist) ----------
CREATE OR REPLACE FUNCTION public.emit_platform_event(
  _event_type text,
  _subject_type text,
  _subject_id uuid DEFAULT NULL,
  _severity text DEFAULT 'info',
  _metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id uuid;
  is_service boolean := COALESCE(auth.role(), '') = 'service_role';
  is_admin boolean := (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'));
  allowed text[] := ARRAY[
    'sos.created',
    'mission.created',
    'offer.submitted',
    'offer.accepted',
    'escrow.viewed',
    'escrow.release_requested',
    'order.submitted',
    'order.status_advanced',
    'chat.high_risk_blocked',
    'payment.intent_created'
  ];
BEGIN
  IF _event_type IS NULL OR length(trim(_event_type)) = 0 THEN
    RAISE EXCEPTION 'INVALID_EVENT_TYPE';
  END IF;
  IF _subject_type IS NULL OR length(trim(_subject_type)) = 0 THEN
    RAISE EXCEPTION 'INVALID_SUBJECT_TYPE';
  END IF;

  IF NOT is_service AND NOT is_admin AND NOT (_event_type = ANY (allowed)) THEN
    RAISE EXCEPTION 'EVENT_TYPE_FORBIDDEN';
  END IF;

  INSERT INTO public.platform_events (
    actor_id, subject_type, subject_id, event_type, severity, metadata
  ) VALUES (
    auth.uid(),
    _subject_type,
    _subject_id,
    _event_type,
    COALESCE(NULLIF(trim(_severity), ''), 'info'),
    COALESCE(_metadata, '{}'::jsonb)
  )
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

-- ---------- record_payment_intent (demo ack + live pending) ----------
CREATE OR REPLACE FUNCTION public.record_payment_intent(
  _job_id uuid,
  _offer_id uuid,
  _demo_ack boolean DEFAULT false
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _job public.jobs%ROWTYPE;
  _offer public.job_offers%ROWTYPE;
  _amount bigint;
  _intent_id uuid;
  _mode text := public.payment_mode();
BEGIN
  SELECT * INTO _job FROM public.jobs WHERE id = _job_id;
  IF NOT FOUND OR _job.client_id <> auth.uid() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  SELECT * INTO _offer FROM public.job_offers WHERE id = _offer_id AND job_id = _job_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'offer missing';
  END IF;

  _amount := (round(_offer.price * 100))::bigint;

  IF _mode = 'live' THEN
    -- Client may only open a pending intent. Webhook confirms secured.
    INSERT INTO public.payment_intents(
      job_id, offer_id, captain_id, provider_id,
      amount_cents, currency, status, provider
    ) VALUES (
      _job_id, _offer_id, _job.client_id, _offer.provider_id,
      _amount, 'TRY', 'pending', 'pending_psp'
    )
    RETURNING id INTO _intent_id;

    INSERT INTO public.platform_events (
      actor_id, subject_type, subject_id, event_type, severity, metadata
    ) VALUES (
      auth.uid(), 'job', _job_id, 'payment.intent_created', 'info',
      jsonb_build_object('intent_id', _intent_id, 'mode', 'live', 'status', 'pending')
    );

    RETURN _intent_id;
  END IF;

  -- Simulated pilot path — requires conscious demo ack from the client modal.
  IF NOT COALESCE(_demo_ack, false) THEN
    RAISE EXCEPTION 'DEMO_ACK_REQUIRED';
  END IF;

  INSERT INTO public.payment_intents(
    job_id, offer_id, captain_id, provider_id,
    amount_cents, currency, status, provider, secured_at
  ) VALUES (
    _job_id, _offer_id, _job.client_id, _offer.provider_id,
    _amount, 'TRY', 'secured', 'simulated', now()
  )
  RETURNING id INTO _intent_id;

  INSERT INTO public.escrow_transactions(
    job_id, payment_intent_id, kind, amount_cents, currency, actor_id, notes
  ) VALUES (
    _job_id, _intent_id, 'secure', _amount, 'TRY', auth.uid(),
    'Simulated funding — payment provider not yet connected'
  );

  INSERT INTO public.platform_events (
    actor_id, subject_type, subject_id, event_type, severity, metadata
  ) VALUES
    (auth.uid(), 'job', _job_id, 'payment.intent_created', 'info',
      jsonb_build_object('intent_id', _intent_id, 'mode', 'simulated')),
    (auth.uid(), 'job', _job_id, 'payment.secured', 'success',
      jsonb_build_object('intent_id', _intent_id, 'amount_cents', _amount, 'simulated', true)),
    (auth.uid(), 'escrow', _job_id, 'escrow.secured', 'success',
      jsonb_build_object('intent_id', _intent_id, 'amount_cents', _amount, 'simulated', true));

  RETURN _intent_id;
END;
$$;

REVOKE ALL ON FUNCTION public.record_payment_intent(uuid, uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_payment_intent(uuid, uuid, boolean) TO authenticated;

-- Keep old 2-arg signature callable but force DEMO_ACK_REQUIRED / live pending via wrapper.
CREATE OR REPLACE FUNCTION public.record_payment_intent(_job_id uuid, _offer_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.record_payment_intent(_job_id, _offer_id, false);
END;
$$;

REVOKE ALL ON FUNCTION public.record_payment_intent(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_payment_intent(uuid, uuid) TO authenticated;

-- Webhook / ops: promote pending → secured (service_role only).
CREATE OR REPLACE FUNCTION public.confirm_payment_intent_from_provider(
  _intent_id uuid,
  _provider text,
  _provider_ref text DEFAULT NULL,
  _metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _pi public.payment_intents%ROWTYPE;
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role' THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  SELECT * INTO _pi FROM public.payment_intents WHERE id = _intent_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND';
  END IF;
  IF _pi.status = 'secured' THEN
    RETURN; -- idempotent
  END IF;
  IF _pi.status <> 'pending' THEN
    RAISE EXCEPTION 'INVALID_STATUS';
  END IF;

  UPDATE public.payment_intents
    SET status = 'secured',
        provider = COALESCE(NULLIF(trim(_provider), ''), provider),
        secured_at = now(),
        metadata = COALESCE(metadata, '{}'::jsonb) || COALESCE(_metadata, '{}'::jsonb)
          || CASE WHEN _provider_ref IS NOT NULL
               THEN jsonb_build_object('provider_ref', _provider_ref)
               ELSE '{}'::jsonb END
  WHERE id = _intent_id;

  INSERT INTO public.escrow_transactions(
    job_id, payment_intent_id, kind, amount_cents, currency, actor_id, notes
  ) VALUES (
    _pi.job_id, _intent_id, 'secure', _pi.amount_cents, _pi.currency, NULL,
    'Provider webhook confirmed funding'
  );

  INSERT INTO public.platform_events (
    actor_id, subject_type, subject_id, event_type, severity, metadata
  ) VALUES
    (NULL, 'job', _pi.job_id, 'payment.secured', 'success',
      jsonb_build_object('intent_id', _intent_id, 'provider', _provider)),
    (NULL, 'escrow', _pi.job_id, 'escrow.secured', 'success',
      jsonb_build_object('intent_id', _intent_id, 'provider', _provider));
END;
$$;

REVOKE ALL ON FUNCTION public.confirm_payment_intent_from_provider(uuid, text, text, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_payment_intent_from_provider(uuid, text, text, jsonb)
  TO service_role;

-- ---------- checkout_parts_cart: demo ack + live hard stop ----------
-- Legacy overloads returned uuid (single). Drop before recreating as uuid[].
DROP FUNCTION IF EXISTS public.checkout_parts_cart(jsonb, text);
DROP FUNCTION IF EXISTS public.checkout_parts_cart(jsonb, text, uuid, text, integer, text, text);

CREATE OR REPLACE FUNCTION public.checkout_parts_cart(
  _items jsonb,
  _delivery_marina text,
  _vessel_id uuid DEFAULT NULL,
  _delivery_method text DEFAULT 'service_boat',
  _delivery_eta_minutes integer DEFAULT NULL,
  _delivery_location_label text DEFAULT NULL,
  _notes text DEFAULT NULL,
  _demo_ack boolean DEFAULT false
)
RETURNS uuid[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  _order_id uuid;
  _ids uuid[] := '{}';
  _total numeric;
  _commission numeric;
  _item jsonb;
  _p public.parts_catalog%rowtype;
  _qty int;
  _dealer uuid;
  _mode text := public.payment_mode();
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;

  IF _mode = 'live' THEN
    RAISE EXCEPTION 'LIVE_CHECKOUT_REQUIRES_PSP';
  END IF;
  IF NOT COALESCE(_demo_ack, false) THEN
    RAISE EXCEPTION 'DEMO_ACK_REQUIRED';
  END IF;

  IF _items IS NULL OR jsonb_array_length(_items) = 0 THEN
    RAISE EXCEPTION 'OUT_OF_STOCK: empty cart';
  END IF;

  FOR _item IN SELECT * FROM jsonb_array_elements(_items) LOOP
    SELECT * INTO _p FROM public.parts_catalog
      WHERE id = (_item->>'part_id')::uuid
      FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'OUT_OF_STOCK: part missing';
    END IF;
    _qty := COALESCE((_item->>'qty')::int, 1);
    IF _qty <= 0 THEN
      RAISE EXCEPTION 'OUT_OF_STOCK: invalid qty for %', _p.name;
    END IF;
    IF _p.stock < _qty THEN
      RAISE EXCEPTION 'OUT_OF_STOCK: % (available %, requested %)',
        _p.name, _p.stock, _qty;
    END IF;
  END LOOP;

  FOR _dealer IN
    SELECT DISTINCT p.supplier_id
    FROM jsonb_array_elements(_items) AS item
    JOIN public.parts_catalog p ON p.id = (item->>'part_id')::uuid
  LOOP
    _total := 0;
    FOR _item IN SELECT * FROM jsonb_array_elements(_items) LOOP
      SELECT * INTO _p FROM public.parts_catalog
        WHERE id = (_item->>'part_id')::uuid;
      IF _p.supplier_id IS NOT DISTINCT FROM _dealer THEN
        _qty := COALESCE((_item->>'qty')::int, 1);
        _total := _total + _p.price * _qty;
      END IF;
    END LOOP;

    _commission := round(_total * 0.10, 2);
    INSERT INTO public.part_orders(
      buyer_id, dealer_id, vessel_id, total, subtotal, commission,
      delivery_marina, delivery_method, delivery_eta_minutes,
      delivery_location_label, notes, status
    ) VALUES (
      auth.uid(), _dealer, _vessel_id, _total, _total, _commission,
      _delivery_marina, COALESCE(_delivery_method, 'service_boat'),
      _delivery_eta_minutes, _delivery_location_label, _notes, 'Submitted'
    ) RETURNING id INTO _order_id;
    _ids := array_append(_ids, _order_id);

    FOR _item IN SELECT * FROM jsonb_array_elements(_items) LOOP
      SELECT * INTO _p FROM public.parts_catalog
        WHERE id = (_item->>'part_id')::uuid
        FOR UPDATE;
      IF _p.supplier_id IS NOT DISTINCT FROM _dealer THEN
        _qty := COALESCE((_item->>'qty')::int, 1);
        INSERT INTO public.part_order_items(order_id, part_id, qty, unit_price, name_snapshot)
          VALUES (_order_id, _p.id, _qty, _p.price, _p.name);
        UPDATE public.parts_catalog
          SET stock = stock - _qty
          WHERE id = _p.id;
      END IF;
    END LOOP;

    INSERT INTO public.platform_ledger(job_id, commission_amount, provider_payout)
      VALUES (NULL, _commission, _total - _commission);
  END LOOP;

  RETURN _ids;
END
$function$;

REVOKE ALL ON FUNCTION public.checkout_parts_cart(jsonb, text, uuid, text, integer, text, text, boolean)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.checkout_parts_cart(jsonb, text, uuid, text, integer, text, text, boolean)
  TO authenticated;

-- Legacy 7-arg form always fails closed without demo ack.
CREATE OR REPLACE FUNCTION public.checkout_parts_cart(
  _items jsonb,
  _delivery_marina text,
  _vessel_id uuid DEFAULT NULL,
  _delivery_method text DEFAULT 'service_boat',
  _delivery_eta_minutes integer DEFAULT NULL,
  _delivery_location_label text DEFAULT NULL,
  _notes text DEFAULT NULL
)
RETURNS uuid[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.checkout_parts_cart(
    _items, _delivery_marina, _vessel_id, _delivery_method,
    _delivery_eta_minutes, _delivery_location_label, _notes, false
  );
END;
$$;

REVOKE ALL ON FUNCTION public.checkout_parts_cart(jsonb, text, uuid, text, integer, text, text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.checkout_parts_cart(jsonb, text, uuid, text, integer, text, text)
  TO authenticated;

-- ---------- advisor hardening: revoke anon on sensitive DEFINER helpers ----------
REVOKE ALL ON FUNCTION public.has_role(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_role(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, text) TO authenticated, service_role;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'touch_transfer_captain_request'
      AND pg_get_function_identity_arguments(p.oid) = ''
  ) THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.touch_transfer_captain_request() FROM PUBLIC, anon';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.touch_transfer_captain_request() TO authenticated, service_role';
  END IF;
END $$;

-- Fix mutable search_path on role parser without changing its return type.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'thalvo_parse_user_role'
      AND pg_get_function_identity_arguments(p.oid) = 'raw text'
  ) THEN
    EXECUTE 'ALTER FUNCTION public.thalvo_parse_user_role(text) SET search_path = public';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'thalvo_parse_user_role skip: %', SQLERRM;
END $$;

-- Prefer invoker rights on public catalog views (PG15+).
DO $$
BEGIN
  IF to_regclass('public.public_parts_catalog') IS NOT NULL THEN
    EXECUTE 'ALTER VIEW public.public_parts_catalog SET (security_invoker = true)';
  END IF;
  IF to_regclass('public.provider_live_pins') IS NOT NULL THEN
    EXECUTE 'ALTER VIEW public.provider_live_pins SET (security_invoker = true)';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'view security_invoker skip: %', SQLERRM;
END $$;

-- Close direct INSERT bypass of emit_platform_event allowlist.
-- Writers must go through SECURITY DEFINER RPCs (or service_role).
REVOKE INSERT ON public.platform_events FROM authenticated;
DROP POLICY IF EXISTS "Users can insert events as themselves" ON public.platform_events;

-- complete_job: emit financial telemetry server-side (client can no longer forge these).
CREATE OR REPLACE FUNCTION public.complete_job(_job_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total numeric;
  commission numeric;
  payout numeric;
  prov uuid;
  _gross bigint;
  _fee bigint;
  _net bigint;
  _intent_id uuid;
  _commission_id uuid;
BEGIN
  SELECT total_escrow_pool, provider_id INTO total, prov
    FROM public.jobs
    WHERE id = _job_id
      AND client_id = auth.uid()
      AND status NOT IN ('Completed', 'Cancelled')
    FOR UPDATE;

  IF NOT FOUND THEN
    IF EXISTS (SELECT 1 FROM public.jobs WHERE id = _job_id AND client_id = auth.uid()) THEN
      RETURN jsonb_build_object('status', 'already_completed', 'job_id', _job_id);
    END IF;
    RAISE EXCEPTION 'Not authorized';
  END IF;

  commission := round(total * 0.10);
  payout := total - commission;

  UPDATE public.jobs SET status = 'Completed' WHERE id = _job_id;

  PERFORM set_config('thalvo.internal_wallet_credit', 'on', true);
  UPDATE public.profiles SET wallet_balance = wallet_balance + payout WHERE id = prov;
  PERFORM set_config('thalvo.internal_wallet_credit', 'off', true);

  INSERT INTO public.platform_ledger(job_id, commission_amount, provider_payout)
    VALUES (_job_id, commission, payout);

  _gross := (round(total * 100))::bigint;
  _fee   := (round(commission * 100))::bigint;
  _net   := _gross - _fee;

  SELECT id INTO _intent_id FROM public.payment_intents
    WHERE job_id = _job_id AND status = 'secured'
    ORDER BY created_at DESC LIMIT 1;

  IF _intent_id IS NOT NULL THEN
    UPDATE public.payment_intents
      SET status = 'released', released_at = now(), amount_cents = _gross
      WHERE id = _intent_id;

    INSERT INTO public.escrow_transactions(
      job_id, payment_intent_id, kind, amount_cents, currency, actor_id, notes
    ) VALUES (
      _job_id, _intent_id, 'release', _gross, 'TRY', auth.uid(),
      'Captain confirmed mission completion'
    );
  END IF;

  INSERT INTO public.commission_records(
    job_id, payment_intent_id, gross_cents, fee_cents, net_cents, rate, currency
  ) VALUES (_job_id, _intent_id, _gross, _fee, _net, 0.10, 'TRY')
  ON CONFLICT (job_id) DO NOTHING
  RETURNING id INTO _commission_id;

  IF _commission_id IS NULL THEN
    SELECT id INTO _commission_id FROM public.commission_records WHERE job_id = _job_id;
  END IF;

  IF prov IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.provider_payouts WHERE job_id = _job_id
  ) THEN
    INSERT INTO public.provider_payouts(
      provider_id, job_id, payment_intent_id, amount_cents, currency, status
    ) VALUES (prov, _job_id, _intent_id, _net, 'TRY', 'pending');
  END IF;

  INSERT INTO public.platform_events (
    actor_id, subject_type, subject_id, event_type, severity, metadata
  ) VALUES
    (auth.uid(), 'escrow', _job_id, 'escrow.release_requested', 'info',
      jsonb_build_object('amount_cents', _gross)),
    (auth.uid(), 'escrow', _job_id, 'escrow.released', 'success',
      jsonb_build_object('amount_cents', _gross, 'intent_id', _intent_id)),
    (auth.uid(), 'job', _job_id, 'commission.recorded', 'success',
      jsonb_build_object('fee_cents', _fee, 'net_cents', _net, 'commission_id', _commission_id)),
    (auth.uid(), 'job', _job_id, 'payout.requested', 'info',
      jsonb_build_object('amount_cents', _net, 'provider_id', prov));

  RETURN jsonb_build_object(
    'status', 'completed',
    'job_id', _job_id,
    'commission_id', _commission_id
  );
END $$;

REVOKE ALL ON FUNCTION public.complete_job(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_job(uuid) TO authenticated, service_role;

-- Remaining anon SECURITY DEFINER finding from advisors.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'boatshow_leads_guard'
      AND pg_get_function_identity_arguments(p.oid) = ''
  ) THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.boatshow_leads_guard() FROM PUBLIC, anon';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.boatshow_leads_guard() TO authenticated, service_role';
  END IF;
END $$;
