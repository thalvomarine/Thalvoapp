-- Platform operator gate without shipping a personal email in the client bundle.
-- Stores operator user_id in platform_settings (not selectable via PostgREST).
-- Client calls is_platform_operator() → boolean only.

INSERT INTO public.platform_settings (key, value)
SELECT
  'platform_operator',
  jsonb_build_object('user_id', u.id::text)
FROM auth.users u
WHERE lower(trim(u.email)) = 'ismailtolgasler@gmail.com'
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    updated_at = now();

-- Admins may still read payments / other keys; operator row stays RPC-only.
DROP POLICY IF EXISTS "platform_settings: admin read" ON public.platform_settings;
CREATE POLICY "platform_settings: admin read"
  ON public.platform_settings FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    AND key <> 'platform_operator'
  );

CREATE OR REPLACE FUNCTION public.is_platform_operator()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    auth.uid() IS NOT NULL
    AND public.has_role(auth.uid(), 'admin')
    AND EXISTS (
      SELECT 1
      FROM public.platform_settings ps
      WHERE ps.key = 'platform_operator'
        AND nullif(trim(ps.value->>'user_id'), '')::uuid = auth.uid()
    );
$$;

REVOKE ALL ON FUNCTION public.is_platform_operator() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_platform_operator() TO authenticated, service_role;

COMMENT ON FUNCTION public.is_platform_operator() IS
  'True when the caller is the seeded platform operator (admin + operator user_id). Does not return the email.';
