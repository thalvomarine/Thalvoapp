-- App Store 5.1.1(v): the signed-in person can delete their own account
-- and the personal data tied to it. No argument is accepted, so the
-- caller cannot name another user.

CREATE OR REPLACE FUNCTION public.delete_own_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, storage
AS $$
DECLARE
  _uid uuid := auth.uid();
  _email text;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT email INTO _email FROM auth.users WHERE id = _uid;

  -- These two foreign keys do not cascade or null on profile delete.
  UPDATE public.job_disputes SET resolved_by = NULL WHERE resolved_by = _uid;
  DELETE FROM public.job_disputes WHERE opened_by = _uid;

  -- storage.protect_delete blocks a raw DELETE unless this flag is set.
  -- The same flag is what storage.delete_lifecycle_objects uses.
  PERFORM set_config('storage.allow_delete_query', 'true', true);

  -- Uploads are stored under the account id as the first folder.
  DELETE FROM storage.objects
  WHERE owner = _uid
     OR owner_id = _uid::text
     OR (storage.foldername(name))[1] = _uid::text;

  DELETE FROM storage.s3_multipart_uploads_parts WHERE owner_id = _uid::text;
  DELETE FROM storage.s3_multipart_uploads WHERE owner_id = _uid::text;

  IF _email IS NOT NULL AND position('@' in _email) > 0 THEN
    DELETE FROM public.boatshow_leads WHERE lower(email) = lower(_email);
  END IF;

  -- Cascades profile, vessels, calls opened by this account, and auth sessions.
  DELETE FROM auth.users WHERE id = _uid;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_own_account() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_own_account() TO authenticated;
