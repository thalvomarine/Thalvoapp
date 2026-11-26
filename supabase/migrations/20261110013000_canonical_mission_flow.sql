-- Canonical mission flow:
-- SOS → Pending → Offered (bid) → Accepted + escrow → EnRoute → OnSite
-- → PartsPending (extras) → InProgress → Completed (commission + payout).
-- Payments remain simulated. Direct claim / ESR accept-without-bid are closed.

-- ---------------------------------------------------------------------------
-- 1. Link emergency_service_requests to jobs
-- ---------------------------------------------------------------------------
ALTER TABLE public.emergency_service_requests
  ADD COLUMN IF NOT EXISTS job_id uuid REFERENCES public.jobs(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS emergency_service_requests_job_idx
  ON public.emergency_service_requests (job_id)
  WHERE job_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 2. submit_offer — sole provider bid path; first bid → Offered
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_offer(
  _job_id uuid,
  _price numeric,
  _eta_minutes integer,
  _note text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _offer_id uuid;
  _job public.jobs%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role::text = 'Provider'
  ) THEN
    RAISE EXCEPTION 'Not a provider';
  END IF;
  IF NOT public.is_verified_provider(auth.uid()) THEN
    RAISE EXCEPTION 'Provider not verified';
  END IF;
  IF _price IS NULL OR _price <= 0 OR _price > 1000000 THEN
    RAISE EXCEPTION 'Invalid offer price';
  END IF;
  IF _eta_minutes IS NULL OR _eta_minutes < 1 OR _eta_minutes > 1440 THEN
    RAISE EXCEPTION 'Invalid ETA';
  END IF;

  SELECT * INTO _job FROM public.jobs WHERE id = _job_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Job not found';
  END IF;
  IF _job.provider_id IS NOT NULL THEN
    RAISE EXCEPTION 'Job already assigned';
  END IF;
  IF _job.status NOT IN ('Pending'::public.job_status, 'Offered'::public.job_status) THEN
    RAISE EXCEPTION 'Job not open for offers';
  END IF;

  INSERT INTO public.job_offers (job_id, provider_id, price, eta_minutes, note)
  VALUES (
    _job_id,
    auth.uid(),
    _price,
    _eta_minutes,
    NULLIF(left(trim(coalesce(_note, '')), 500), '')
  )
  ON CONFLICT (job_id, provider_id) DO UPDATE
    SET price = EXCLUDED.price,
        eta_minutes = EXCLUDED.eta_minutes,
        note = EXCLUDED.note
  RETURNING id INTO _offer_id;

  IF _job.status = 'Pending'::public.job_status THEN
    UPDATE public.jobs
      SET status = 'Offered'::public.job_status
      WHERE id = _job_id;
  END IF;

  INSERT INTO public.platform_events (
    actor_id, subject_type, subject_id, event_type, severity, metadata
  ) VALUES (
    auth.uid(), 'offer', _offer_id, 'offer.submitted', 'info',
    jsonb_build_object(
      'job_id', _job_id,
      'price', _price,
      'eta_minutes', _eta_minutes
    )
  );

  RETURN _offer_id;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_offer(uuid, numeric, integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_offer(uuid, numeric, integer, text) TO authenticated;

-- Block direct INSERT into job_offers for authenticated (RPC only).
DROP POLICY IF EXISTS "offers: providers insert" ON public.job_offers;
DROP POLICY IF EXISTS "Providers can insert offers" ON public.job_offers;
DROP POLICY IF EXISTS "job_offers insert provider" ON public.job_offers;

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'job_offers'
      AND cmd = 'INSERT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.job_offers', r.policyname);
  END LOOP;
END $$;

REVOKE INSERT ON public.job_offers FROM authenticated;

-- ---------------------------------------------------------------------------
-- 3. claim_open_job — admin only (no unpaid InProgress shortcut)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.claim_open_job(_job_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'auth required';
  END IF;
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'BID_REQUIRED: providers must submit an offer';
  END IF;

  UPDATE public.jobs
    SET provider_id = coalesce(provider_id, auth.uid()),
        status = 'Accepted'::public.job_status
    WHERE id = _job_id
      AND status IN ('Pending'::public.job_status, 'Offered'::public.job_status);

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Job is no longer available';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_open_job(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_open_job(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 4. accept_emergency_request — closed; bid on linked job instead
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.accept_emergency_request(_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _job uuid;
BEGIN
  SELECT job_id INTO _job
  FROM public.emergency_service_requests
  WHERE id = _id AND status = 'pending';

  RAISE EXCEPTION 'BID_REQUIRED: submit an offer on job %', coalesce(_job::text, 'linked mission');
END;
$$;

REVOKE ALL ON FUNCTION public.accept_emergency_request(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_emergency_request(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 5. Sync ESR status from jobs (when linked)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_esr_from_job()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.status = 'Cancelled'::public.job_status THEN
    UPDATE public.emergency_service_requests
      SET status = 'cancelled'
      WHERE job_id = NEW.id
        AND status IN ('pending', 'en_route', 'on_scene');
  ELSIF NEW.status = 'Completed'::public.job_status THEN
    UPDATE public.emergency_service_requests
      SET status = 'completed',
          assigned_provider_id = coalesce(assigned_provider_id, NEW.provider_id)
      WHERE job_id = NEW.id
        AND status IN ('pending', 'en_route', 'on_scene');
  ELSIF NEW.status = 'EnRoute'::public.job_status THEN
    UPDATE public.emergency_service_requests
      SET status = 'en_route',
          assigned_provider_id = coalesce(NEW.provider_id, assigned_provider_id)
      WHERE job_id = NEW.id
        AND status IN ('pending', 'en_route');
  ELSIF NEW.status IN (
    'OnSite'::public.job_status,
    'InProgress'::public.job_status,
    'PartsPending'::public.job_status
  ) THEN
    UPDATE public.emergency_service_requests
      SET status = 'on_scene',
          assigned_provider_id = coalesce(NEW.provider_id, assigned_provider_id)
      WHERE job_id = NEW.id
        AND status IN ('pending', 'en_route', 'on_scene');
  ELSIF NEW.status = 'Accepted'::public.job_status THEN
    UPDATE public.emergency_service_requests
      SET assigned_provider_id = coalesce(NEW.provider_id, assigned_provider_id)
      WHERE job_id = NEW.id
        AND status = 'pending';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS jobs_sync_esr ON public.jobs;
CREATE TRIGGER jobs_sync_esr
  AFTER UPDATE OF status, provider_id ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_esr_from_job();

-- Prefer job-scoped ESR updates on cancel / live position.
CREATE OR REPLACE FUNCTION public.cancel_own_call(_job_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _job public.jobs%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  SELECT * INTO _job FROM public.jobs WHERE id = _job_id;
  IF NOT FOUND OR _job.client_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF _job.status IN ('Completed', 'Cancelled') THEN
    RAISE EXCEPTION 'Call already closed';
  END IF;
  UPDATE public.jobs
    SET status = 'Cancelled'::public.job_status
    WHERE id = _job_id;
  UPDATE public.emergency_service_requests
    SET status = 'cancelled'
    WHERE status IN ('pending', 'en_route', 'on_scene')
      AND (
        job_id = _job_id
        OR (job_id IS NULL AND user_id = auth.uid())
      );
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_own_call_position(
  _job_id uuid,
  _lat numeric,
  _lng numeric,
  _accuracy_m numeric DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF _lat IS NULL OR _lng IS NULL OR _lat NOT BETWEEN -90 AND 90 OR _lng NOT BETWEEN -180 AND 180 THEN
    RAISE EXCEPTION 'Invalid position';
  END IF;
  UPDATE public.jobs
    SET lat = _lat,
        lng = _lng,
        location_accuracy_m = _accuracy_m,
        location_captured_at = now()
    WHERE id = _job_id
      AND client_id = auth.uid()
      AND status NOT IN ('Completed', 'Cancelled');
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  UPDATE public.emergency_service_requests
    SET lat = _lat,
        lng = _lng
    WHERE status IN ('pending', 'en_route', 'on_scene')
      AND (
        job_id = _job_id
        OR (job_id IS NULL AND user_id = auth.uid())
      );
END;
$$;

-- ---------------------------------------------------------------------------
-- 6. set_sail — only after Accepted + secured escrow
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_sail(_job_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  j public.jobs%ROWTYPE;
  plat numeric;
  plng numeric;
  dist_nm numeric;
  speed_kts numeric := 18;
  mins integer;
BEGIN
  SELECT * INTO j FROM public.jobs WHERE id = _job_id FOR UPDATE;
  IF NOT FOUND OR j.provider_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF j.status IS DISTINCT FROM 'Accepted'::public.job_status THEN
    RAISE EXCEPTION 'Job must be Accepted before sailing';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.payment_intents
    WHERE job_id = _job_id AND status = 'secured'
  ) THEN
    RAISE EXCEPTION 'Escrow not secured';
  END IF;

  SELECT pd.lat, pd.lng INTO plat, plng
  FROM public.provider_details pd
  WHERE pd.id = auth.uid();

  IF plat IS NULL OR plng IS NULL THEN
    SELECT p.home_lat, p.home_lng INTO plat, plng
    FROM public.profiles p
    WHERE p.id = auth.uid();
  END IF;

  mins := j.eta_minutes;
  IF mins IS NULL AND plat IS NOT NULL AND plng IS NOT NULL
     AND j.lat IS NOT NULL AND j.lng IS NOT NULL THEN
    dist_nm := public.thalvo_haversine_nm(plat, plng, j.lat, j.lng);
    IF dist_nm IS NOT NULL AND dist_nm >= 0 THEN
      mins := LEAST(1440, GREATEST(1, ceil((dist_nm / speed_kts) * 60)::integer));
    END IF;
  END IF;

  UPDATE public.jobs
    SET status = 'EnRoute'::public.job_status,
        dispatched_at = now(),
        eta_minutes = coalesce(mins, eta_minutes)
    WHERE id = _job_id
      AND provider_id = auth.uid()
      AND status = 'Accepted'::public.job_status;
END;
$$;

-- ---------------------------------------------------------------------------
-- 7. approve_part — simulated extra escrow (demo ack)
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.approve_part(uuid);

CREATE OR REPLACE FUNCTION public.approve_part(
  _part_id uuid,
  _demo_ack boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  p public.job_parts%ROWTYPE;
  j public.jobs%ROWTYPE;
  _amount bigint;
  _intent_id uuid;
  _mode text := public.payment_mode();
BEGIN
  SELECT * INTO p FROM public.job_parts WHERE id = _part_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Part not found';
  END IF;
  IF p.payment_status IS DISTINCT FROM 'Pending' THEN
    RAISE EXCEPTION 'Part already settled';
  END IF;

  SELECT * INTO j FROM public.jobs WHERE id = p.job_id FOR UPDATE;
  IF NOT FOUND OR j.client_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  _amount := (round(p.part_price * 100))::bigint;

  IF _mode = 'live' THEN
    INSERT INTO public.payment_intents(
      job_id, offer_id, captain_id, provider_id,
      amount_cents, currency, status, provider, metadata
    ) VALUES (
      j.id, NULL, j.client_id, j.provider_id,
      _amount, 'TRY', 'pending', 'pending_psp',
      jsonb_build_object('kind', 'extra_part', 'part_id', p.id)
    )
    RETURNING id INTO _intent_id;

    UPDATE public.job_parts SET payment_status = 'Paid' WHERE id = _part_id;
    UPDATE public.jobs
      SET extra_parts_cost = coalesce(extra_parts_cost, 0) + p.part_price,
          total_escrow_pool = coalesce(total_escrow_pool, 0) + p.part_price,
          status = (CASE
            WHEN EXISTS (
              SELECT 1 FROM public.job_parts
              WHERE job_id = p.job_id AND payment_status = 'Pending' AND id <> _part_id
            ) THEN 'PartsPending'
            ELSE 'InProgress'
          END)::public.job_status
      WHERE id = p.job_id;

    INSERT INTO public.platform_events (
      actor_id, subject_type, subject_id, event_type, severity, metadata
    ) VALUES (
      auth.uid(), 'job', j.id, 'payment.intent_created', 'info',
      jsonb_build_object('intent_id', _intent_id, 'kind', 'extra_part', 'mode', 'live')
    );
    RETURN;
  END IF;

  IF NOT coalesce(_demo_ack, false) THEN
    RAISE EXCEPTION 'DEMO_ACK_REQUIRED';
  END IF;

  INSERT INTO public.payment_intents(
    job_id, offer_id, captain_id, provider_id,
    amount_cents, currency, status, provider, secured_at, metadata
  ) VALUES (
    j.id, NULL, j.client_id, j.provider_id,
    _amount, 'TRY', 'secured', 'simulated', now(),
    jsonb_build_object('kind', 'extra_part', 'part_id', p.id)
  )
  RETURNING id INTO _intent_id;

  INSERT INTO public.escrow_transactions(
    job_id, payment_intent_id, kind, amount_cents, currency, actor_id, notes
  ) VALUES (
    j.id, _intent_id, 'extra_secure', _amount, 'TRY', auth.uid(),
    'Simulated extra-part funding'
  );

  UPDATE public.job_parts SET payment_status = 'Paid' WHERE id = _part_id;
  UPDATE public.jobs
    SET extra_parts_cost = coalesce(extra_parts_cost, 0) + p.part_price,
        total_escrow_pool = coalesce(total_escrow_pool, 0) + p.part_price,
        status = (CASE
          WHEN EXISTS (
            SELECT 1 FROM public.job_parts
            WHERE job_id = p.job_id AND payment_status = 'Pending' AND id <> _part_id
          ) THEN 'PartsPending'
          ELSE 'InProgress'
        END)::public.job_status
    WHERE id = p.job_id;

  INSERT INTO public.platform_events (
    actor_id, subject_type, subject_id, event_type, severity, metadata
  ) VALUES
    (auth.uid(), 'job', j.id, 'payment.secured', 'success',
      jsonb_build_object('intent_id', _intent_id, 'kind', 'extra_part', 'simulated', true)),
    (auth.uid(), 'escrow', j.id, 'escrow.secured', 'success',
      jsonb_build_object('intent_id', _intent_id, 'kind', 'extra_secure', 'amount_cents', _amount));
END;
$$;

REVOKE ALL ON FUNCTION public.approve_part(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_part(uuid, boolean) TO authenticated;

-- ---------------------------------------------------------------------------
-- 8. complete_job — block unpaid extras; release all secured intents
-- ---------------------------------------------------------------------------
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
  _secured record;
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

  IF EXISTS (
    SELECT 1 FROM public.job_parts
    WHERE job_id = _job_id AND payment_status = 'Pending'
  ) THEN
    RAISE EXCEPTION 'Pending extras must be approved or rejected first';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.payment_intents
    WHERE job_id = _job_id AND status = 'secured'
  ) THEN
    RAISE EXCEPTION 'Escrow not secured';
  END IF;

  commission := round(coalesce(total, 0) * 0.10);
  payout := coalesce(total, 0) - commission;

  UPDATE public.jobs SET status = 'Completed' WHERE id = _job_id;

  PERFORM set_config('thalvo.internal_wallet_credit', 'on', true);
  UPDATE public.profiles SET wallet_balance = wallet_balance + payout WHERE id = prov;
  PERFORM set_config('thalvo.internal_wallet_credit', 'off', true);

  INSERT INTO public.platform_ledger(job_id, commission_amount, provider_payout)
    VALUES (_job_id, commission, payout);

  _gross := (round(coalesce(total, 0) * 100))::bigint;
  _fee   := (round(commission * 100))::bigint;
  _net   := _gross - _fee;

  FOR _secured IN
    SELECT id, amount_cents
    FROM public.payment_intents
    WHERE job_id = _job_id AND status = 'secured'
    ORDER BY created_at
  LOOP
    UPDATE public.payment_intents
      SET status = 'released', released_at = now()
      WHERE id = _secured.id;

    INSERT INTO public.escrow_transactions(
      job_id, payment_intent_id, kind, amount_cents, currency, actor_id, notes
    ) VALUES (
      _job_id, _secured.id,
      CASE
        WHEN EXISTS (
          SELECT 1 FROM public.escrow_transactions et
          WHERE et.payment_intent_id = _secured.id AND et.kind = 'extra_secure'
        ) THEN 'extra_release'
        ELSE 'release'
      END,
      _secured.amount_cents, 'TRY', auth.uid(),
      'Captain confirmed mission completion'
    );

    _intent_id := _secured.id;
  END LOOP;

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
END;
$$;

REVOKE ALL ON FUNCTION public.complete_job(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_job(uuid) TO authenticated, service_role;
