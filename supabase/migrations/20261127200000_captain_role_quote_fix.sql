-- Legacy profiles may store role as 'captain' while the UI normalizes that to Client.
-- Align is_captain_client + request_service_quote with normalizeUserRole.
-- Do not UPDATE profiles.role here: prevent_profile_privilege_escalation blocks it.

CREATE OR REPLACE FUNCTION public.is_captain_client(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = uid
      AND lower(trim(p.role::text)) IN ('client', 'captain')
  );
$$;

REVOKE ALL ON FUNCTION public.is_captain_client(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_captain_client(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.request_service_quote(
  _package_id uuid,
  _lat numeric,
  _lng numeric,
  _marina text DEFAULT 'Göcek',
  _description text DEFAULT NULL,
  _location_accuracy_m numeric DEFAULT NULL,
  _location_captured_at timestamptz DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  pkg public.service_packages%ROWTYPE;
  _id uuid;
  _svc public.service_type;
  _desc text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF NOT public.is_captain_client(auth.uid()) THEN
    RAISE EXCEPTION 'Only captains can request a quote';
  END IF;
  IF _lat IS NULL OR _lng IS NULL OR _lat < -90 OR _lat > 90 OR _lng < -180 OR _lng > 180 THEN
    RAISE EXCEPTION 'Invalid coordinates';
  END IF;

  SELECT * INTO pkg FROM public.service_packages WHERE id = _package_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Package not found';
  END IF;

  _svc := CASE
    WHEN pkg.category = 'diver' THEN 'Underwater Diver'::public.service_type
    ELSE 'Marine Mechanic'::public.service_type
  END;

  _desc := left(
    trim(
      both FROM coalesce(nullif(trim(coalesce(_description, '')), ''), '')
      || CASE
        WHEN coalesce(nullif(trim(coalesce(_description, '')), ''), '') = '' THEN ''
        ELSE E'\n'
      END
      || 'Paket: ' || pkg.title_tr || ' / ' || pkg.title_en
    ),
    400
  );

  INSERT INTO public.jobs (
    client_id,
    provider_id,
    service_type,
    problem_category,
    description,
    lat,
    lng,
    marina,
    status,
    initial_labor_cost,
    extra_parts_cost,
    total_escrow_pool,
    eta_minutes,
    location_accuracy_m,
    location_captured_at
  ) VALUES (
    auth.uid(),
    NULL,
    _svc,
    pkg.key,
    _desc,
    _lat,
    _lng,
    left(coalesce(nullif(trim(_marina), ''), 'Göcek'), 80),
    'Pending'::public.job_status,
    0,
    0,
    0,
    NULL,
    _location_accuracy_m,
    _location_captured_at
  )
  RETURNING id INTO _id;

  INSERT INTO public.platform_events (
    actor_id, subject_type, subject_id, event_type, severity, metadata
  ) VALUES (
    auth.uid(),
    'mission',
    _id,
    'mission.created',
    'info',
    jsonb_build_object(
      'source', 'service_package_quote',
      'package_id', pkg.id,
      'package_key', pkg.key,
      'category', pkg.category
    )
  );

  RETURN _id;
END;
$function$;

REVOKE ALL ON FUNCTION public.request_service_quote(uuid, numeric, numeric, text, text, numeric, timestamptz)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_service_quote(uuid, numeric, numeric, text, text, numeric, timestamptz)
  TO authenticated;
