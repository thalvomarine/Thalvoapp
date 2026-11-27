-- Battery boost and tow are usta jobs, not a separate electrician trade.
-- The opener can also cancel a service call that has no marketplace job yet.

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
  IF NOT FOUND THEN
    UPDATE public.emergency_service_requests
      SET status = 'cancelled'
      WHERE id = _job_id
        AND user_id = auth.uid()
        AND status IN ('pending', 'en_route', 'on_scene');
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Not authorized';
    END IF;
    RETURN;
  END IF;

  IF _job.client_id IS DISTINCT FROM auth.uid() THEN
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

REVOKE ALL ON FUNCTION public.cancel_own_call(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancel_own_call(uuid) TO authenticated, service_role;
