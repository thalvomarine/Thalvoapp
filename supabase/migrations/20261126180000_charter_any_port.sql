-- Charter home port is the place the firm writes, not a closed coast list.
-- Hull is how guests search: sail, catamaran, motor, gulet.

ALTER TABLE public.charter_yachts
  DROP CONSTRAINT IF EXISTS charter_yachts_base_check;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'charter_yachts_base_len'
      AND conrelid = 'public.charter_yachts'::regclass
  ) THEN
    ALTER TABLE public.charter_yachts
      ADD CONSTRAINT charter_yachts_base_len
      CHECK (char_length(btrim(base)) BETWEEN 2 AND 80);
  END IF;
END $$;

ALTER TABLE public.charter_yachts
  ADD COLUMN IF NOT EXISTS hull text;

UPDATE public.charter_yachts
  SET hull = 'gulet'
  WHERE hull IS NULL AND model ILIKE '%gulet%';

UPDATE public.charter_yachts
  SET hull = 'catamaran'
  WHERE hull IS NULL
    AND (
      model ILIKE '%lagoon%'
      OR model ILIKE '%excess%'
      OR model ILIKE '%catamaran%'
      OR model ILIKE '%bali %'
    );

UPDATE public.charter_yachts
  SET hull = 'motor'
  WHERE hull IS NULL
    AND (
      model ILIKE '%motor%'
      OR model ILIKE '%princess%'
      OR model ILIKE '%azimut%'
      OR model ILIKE '%sunseeker%'
    );

UPDATE public.charter_yachts
  SET hull = 'sail'
  WHERE hull IS NULL;

ALTER TABLE public.charter_yachts
  ALTER COLUMN hull SET DEFAULT 'sail';

ALTER TABLE public.charter_yachts
  ALTER COLUMN hull SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'charter_yachts_hull_check'
      AND conrelid = 'public.charter_yachts'::regclass
  ) THEN
    ALTER TABLE public.charter_yachts
      ADD CONSTRAINT charter_yachts_hull_check
      CHECK (hull IN ('sail', 'catamaran', 'motor', 'gulet'));
  END IF;
END $$;
