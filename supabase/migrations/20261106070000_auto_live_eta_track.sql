-- Live provider position + auto ETA when sailing without an offer ETA.

-- Provider pushes a validated device fix while on a mission (mirrors refresh_own_call_position).
CREATE OR REPLACE FUNCTION public.refresh_own_provider_position(
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
  IF _lat IS NULL OR _lng IS NULL
     OR _lat NOT BETWEEN -90 AND 90
     OR _lng NOT BETWEEN -180 AND 180
     OR (abs(_lat) < 0.0001 AND abs(_lng) < 0.0001) THEN
    RAISE EXCEPTION 'Invalid position';
  END IF;

  -- Only verified providers may broadcast a live fix.
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role::text = 'Provider'
  ) THEN
    RAISE EXCEPTION 'Not a provider';
  END IF;

  INSERT INTO public.provider_details (id, service_type, marina, lat, lng)
  VALUES (
    auth.uid(),
    'Marine Mechanic'::public.service_type,
    coalesce((SELECT home_marina FROM public.profiles WHERE id = auth.uid()), ''),
    _lat,
    _lng
  )
  ON CONFLICT (id) DO UPDATE
    SET lat = EXCLUDED.lat,
        lng = EXCLUDED.lng,
        updated_at = now();
END;
$$;

REVOKE ALL ON FUNCTION public.refresh_own_provider_position(numeric, numeric, numeric)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.refresh_own_provider_position(numeric, numeric, numeric)
  TO authenticated;

-- Haversine in NM (great-circle) for dispatch ETA.
CREATE OR REPLACE FUNCTION public.thalvo_haversine_nm(
  lat1 numeric, lng1 numeric, lat2 numeric, lng2 numeric
)
RETURNS numeric
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN lat1 IS NULL OR lng1 IS NULL OR lat2 IS NULL OR lng2 IS NULL THEN NULL
    ELSE (
      2 * 3440.065 * asin(sqrt(
        power(sin(radians((lat2 - lat1) / 2)), 2)
        + cos(radians(lat1)) * cos(radians(lat2))
          * power(sin(radians((lng2 - lng1) / 2)), 2)
      ))
    )::numeric
  END;
$$;

REVOKE ALL ON FUNCTION public.thalvo_haversine_nm(numeric, numeric, numeric, numeric)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.thalvo_haversine_nm(numeric, numeric, numeric, numeric)
  TO authenticated, service_role;

-- When the provider sets sail, fill eta_minutes from live/home fix → job if missing.
CREATE OR REPLACE FUNCTION public.set_sail(_job_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  j public.jobs%rowtype;
  plat numeric;
  plng numeric;
  dist_nm numeric;
  speed_kts numeric := 18; -- DEFAULT_SERVICE_BOAT_KTS
  mins integer;
BEGIN
  SELECT * INTO j FROM public.jobs WHERE id = _job_id FOR UPDATE;
  IF NOT FOUND OR j.provider_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
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
      -- ceil to whole minutes, floor at 1, cap at 24h
      mins := LEAST(1440, GREATEST(1, ceil((dist_nm / speed_kts) * 60)::integer));
    END IF;
  END IF;

  UPDATE public.jobs
    SET status = 'EnRoute'::public.job_status,
        dispatched_at = now(),
        eta_minutes = coalesce(mins, eta_minutes)
    WHERE id = _job_id
      AND provider_id = auth.uid();
END;
$$;
