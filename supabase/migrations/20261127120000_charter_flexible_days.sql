-- Charter availability is any calendar day, not Saturday weeks.
-- Guests inquire with a check-in and check-out. Every night in the stay must be open.

ALTER TABLE public.charter_weeks
  DROP CONSTRAINT IF EXISTS charter_weeks_saturday;

ALTER TABLE public.charter_inquiries
  DROP CONSTRAINT IF EXISTS charter_inquiries_saturday;

ALTER TABLE public.charter_inquiries
  ADD COLUMN IF NOT EXISTS end_iso date;

UPDATE public.charter_inquiries
  SET end_iso = start_iso + 7
  WHERE end_iso IS NULL;

ALTER TABLE public.charter_inquiries
  ALTER COLUMN end_iso SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'charter_inquiries_stay'
      AND conrelid = 'public.charter_inquiries'::regclass
  ) THEN
    ALTER TABLE public.charter_inquiries
      ADD CONSTRAINT charter_inquiries_stay
      CHECK (end_iso > start_iso AND end_iso <= start_iso + 60);
  END IF;
END $$;

DROP POLICY IF EXISTS "charter_inquiries: guest insert" ON public.charter_inquiries;
CREATE POLICY "charter_inquiries: guest insert"
  ON public.charter_inquiries FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    status = 'new'
    AND end_iso > start_iso
    AND EXISTS (
      SELECT 1 FROM public.charter_yachts y
      WHERE y.id = yacht_id
        AND y.listed
    )
    AND NOT EXISTS (
      SELECT 1
      FROM generate_series(start_iso, end_iso - 1, interval '1 day') AS night(day)
      WHERE NOT EXISTS (
        SELECT 1 FROM public.charter_weeks w
        WHERE w.yacht_id = charter_inquiries.yacht_id
          AND w.start_iso = night.day::date
          AND w.status = 'open'
      )
    )
  );
