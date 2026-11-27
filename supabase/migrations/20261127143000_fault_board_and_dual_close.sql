-- Fault board: any registered master can read an open call (Pending or Offered).
-- Bidding stays behind is_verified_provider inside submit_offer.
-- Close pays out only after both the captain and the master confirm.
-- Payments remain simulated.

DROP POLICY IF EXISTS "jobs: providers read open pool (role)" ON public.jobs;
DROP POLICY IF EXISTS "jobs: providers read open pool" ON public.jobs;
CREATE POLICY "jobs: providers read open pool"
ON public.jobs
FOR SELECT
TO authenticated
USING (
  provider_id IS NULL
  AND status IN ('Pending'::public.job_status, 'Offered'::public.job_status)
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role::text = 'Provider'
  )
);

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS client_closed_at timestamptz,
  ADD COLUMN IF NOT EXISTS provider_closed_at timestamptz;

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
  _client uuid;
  _status public.job_status;
  _client_ready timestamptz;
  _provider_ready timestamptz;
  _gross bigint;
  _fee bigint;
  _net bigint;
  _intent_id uuid;
  _commission_id uuid;
  _secured record;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT total_escrow_pool, provider_id, client_id, status, client_closed_at, provider_closed_at
    INTO total, prov, _client, _status, _client_ready, _provider_ready
  FROM public.jobs
  WHERE id = _job_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF _status = 'Completed'::public.job_status
     AND (auth.uid() = _client OR auth.uid() = prov) THEN
    RETURN jsonb_build_object('status', 'already_completed', 'job_id', _job_id);
  END IF;

  IF auth.uid() IS DISTINCT FROM _client AND auth.uid() IS DISTINCT FROM prov THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF _status NOT IN ('OnSite'::public.job_status, 'InProgress'::public.job_status) THEN
    RAISE EXCEPTION 'Mission is not ready to close';
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

  IF auth.uid() = _client THEN
    _client_ready := coalesce(_client_ready, now());
    UPDATE public.jobs SET client_closed_at = _client_ready WHERE id = _job_id;
  END IF;
  IF auth.uid() = prov THEN
    _provider_ready := coalesce(_provider_ready, now());
    UPDATE public.jobs SET provider_closed_at = _provider_ready WHERE id = _job_id;
  END IF;

  IF _client_ready IS NULL OR _provider_ready IS NULL OR prov IS NULL THEN
    RETURN jsonb_build_object(
      'status', 'awaiting_counterpart',
      'job_id', _job_id,
      'client_ready', _client_ready IS NOT NULL,
      'provider_ready', _provider_ready IS NOT NULL
    );
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
      'Both parties confirmed mission completion'
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
