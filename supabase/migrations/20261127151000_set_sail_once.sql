-- A second tap after the job is already underway must not raise.
-- The first Accepted + secured escrow transition still sets EnRoute.

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
    IF j.status IN (
      'EnRoute'::public.job_status,
      'OnSite'::public.job_status,
      'InProgress'::public.job_status,
      'PartsPending'::public.job_status,
      'Completed'::public.job_status
    ) THEN
      RETURN;
    END IF;
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

REVOKE ALL ON FUNCTION public.set_sail(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_sail(uuid) TO authenticated, service_role;
