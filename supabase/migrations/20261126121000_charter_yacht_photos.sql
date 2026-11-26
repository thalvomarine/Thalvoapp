ALTER TABLE public.charter_yachts
  ADD COLUMN IF NOT EXISTS photos text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.charter_yachts
  DROP CONSTRAINT IF EXISTS charter_yachts_photos_limit;

ALTER TABLE public.charter_yachts
  ADD CONSTRAINT charter_yachts_photos_limit CHECK (cardinality(photos) <= 8);
