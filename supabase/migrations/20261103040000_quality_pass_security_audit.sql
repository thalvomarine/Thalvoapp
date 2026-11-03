-- Quality pass: durable security audit, platform event RPC, dispute resolve.

-- ---------- security_events ----------
CREATE TABLE IF NOT EXISTS public.security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  risk text NOT NULL CHECK (risk IN ('low', 'medium', 'high')),
  source text NOT NULL DEFAULT 'client',
  categories text[] NOT NULL DEFAULT '{}',
  summary text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS security_events_created_at_idx
  ON public.security_events (created_at DESC);
CREATE INDEX IF NOT EXISTS security_events_job_id_idx
  ON public.security_events (job_id);

ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "security_events: actor insert" ON public.security_events;
CREATE POLICY "security_events: actor insert"
  ON public.security_events FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid());

DROP POLICY IF EXISTS "security_events: admin read" ON public.security_events;
CREATE POLICY "security_events: admin read"
  ON public.security_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

GRANT SELECT, INSERT ON public.security_events TO authenticated;
GRANT ALL ON public.security_events TO service_role;

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
  IF _risk IS NULL OR _risk NOT IN ('low', 'medium', 'high') THEN
    RAISE EXCEPTION 'INVALID_RISK';
  END IF;

  INSERT INTO public.security_events (
    actor_id, job_id, risk, source, categories, summary, metadata
  ) VALUES (
    auth.uid(),
    _job_id,
    _risk,
    COALESCE(NULLIF(trim(_source), ''), 'client'),
    COALESCE(_categories, '{}'),
    _summary,
    COALESCE(_metadata, '{}'::jsonb)
  )
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

REVOKE ALL ON FUNCTION public.record_security_event(uuid, text, text, text[], text, jsonb)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_security_event(uuid, text, text, text[], text, jsonb)
  TO authenticated;

-- ---------- emit_platform_event (single write path) ----------
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
BEGIN
  IF _event_type IS NULL OR length(trim(_event_type)) = 0 THEN
    RAISE EXCEPTION 'INVALID_EVENT_TYPE';
  END IF;
  IF _subject_type IS NULL OR length(trim(_subject_type)) = 0 THEN
    RAISE EXCEPTION 'INVALID_SUBJECT_TYPE';
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

REVOKE ALL ON FUNCTION public.emit_platform_event(text, text, uuid, text, jsonb)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.emit_platform_event(text, text, uuid, text, jsonb)
  TO authenticated;

-- ---------- job_disputes (create if older leak_trust migration never ran) ----------
CREATE TABLE IF NOT EXISTS public.job_disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  opened_by uuid NOT NULL REFERENCES public.profiles(id),
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.job_disputes
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS resolved_by uuid REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS resolved_at timestamptz,
  ADD COLUMN IF NOT EXISTS resolution text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'job_disputes_status_check'
  ) THEN
    ALTER TABLE public.job_disputes
      ADD CONSTRAINT job_disputes_status_check
      CHECK (status IN ('open', 'resolved', 'dismissed'));
  END IF;
END $$;

ALTER TABLE public.job_disputes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "job_disputes: parties read" ON public.job_disputes;
CREATE POLICY "job_disputes: parties read"
  ON public.job_disputes FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = job_id
        AND (j.client_id = auth.uid() OR j.provider_id = auth.uid())
    )
    OR public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "job_disputes: parties insert" ON public.job_disputes;
CREATE POLICY "job_disputes: parties insert"
  ON public.job_disputes FOR INSERT TO authenticated
  WITH CHECK (
    opened_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = job_id
        AND (j.client_id = auth.uid() OR j.provider_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "job_disputes: admin update" ON public.job_disputes;
CREATE POLICY "job_disputes: admin update"
  ON public.job_disputes FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT SELECT, INSERT, UPDATE ON public.job_disputes TO authenticated;
GRANT ALL ON public.job_disputes TO service_role;

CREATE OR REPLACE FUNCTION public.resolve_job_dispute(
  _dispute_id uuid,
  _resolution text,
  _status text DEFAULT 'resolved'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;
  IF _status IS NULL OR _status NOT IN ('resolved', 'dismissed') THEN
    RAISE EXCEPTION 'INVALID_STATUS';
  END IF;

  UPDATE public.job_disputes
    SET status = _status,
        resolution = NULLIF(trim(_resolution), ''),
        resolved_by = auth.uid(),
        resolved_at = now()
  WHERE id = _dispute_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.resolve_job_dispute(uuid, text, text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.resolve_job_dispute(uuid, text, text)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.flag_mission_for_review(
  _job_id uuid,
  _note text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  INSERT INTO public.platform_events (
    actor_id, subject_type, subject_id, event_type, severity, metadata
  ) VALUES (
    auth.uid(),
    'mission',
    _job_id,
    'admin.mission_flagged',
    'warning',
    jsonb_build_object('note', COALESCE(NULLIF(trim(_note), ''), 'Flagged for review'))
  )
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

REVOKE ALL ON FUNCTION public.flag_mission_for_review(uuid, text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.flag_mission_for_review(uuid, text)
  TO authenticated;
