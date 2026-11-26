-- Charter guest catalogue and company fleet.
-- A signed-in firm owns its yachts, weekly price, and Saturday open/blocked weeks.
-- Guests can read listed boats and leave an inquiry. Payments stay out of this table.

CREATE TABLE IF NOT EXISTS public.charter_yachts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  operator_name text NOT NULL CHECK (char_length(operator_name) BETWEEN 2 AND 120),
  name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 80),
  model text NOT NULL CHECK (char_length(model) BETWEEN 2 AND 80),
  year int NOT NULL CHECK (year BETWEEN 1970 AND 2040),
  loa_m numeric(5,1) NOT NULL CHECK (loa_m > 0 AND loa_m <= 80),
  berths int NOT NULL CHECK (berths BETWEEN 1 AND 40),
  cabins int NOT NULL CHECK (cabins BETWEEN 1 AND 20),
  base text NOT NULL CHECK (base IN ('Göcek', 'Marmaris', 'Bodrum', 'Fethiye')),
  kind text NOT NULL CHECK (kind IN ('bareboat', 'crewed', 'cabin')),
  weekly_eur numeric(12,2) NOT NULL CHECK (weekly_eur >= 0 AND weekly_eur <= 500000),
  skipper text CHECK (skipper IS NULL OR char_length(skipper) BETWEEN 2 AND 80),
  listed boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS charter_yachts_owner_idx
  ON public.charter_yachts (owner_id, created_at DESC);

CREATE INDEX IF NOT EXISTS charter_yachts_listed_idx
  ON public.charter_yachts (base, name)
  WHERE listed;

CREATE TABLE IF NOT EXISTS public.charter_weeks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  yacht_id uuid NOT NULL REFERENCES public.charter_yachts(id) ON DELETE CASCADE,
  start_iso date NOT NULL,
  status text NOT NULL CHECK (status IN ('open', 'blocked')),
  CONSTRAINT charter_weeks_saturday CHECK (EXTRACT(ISODOW FROM start_iso) = 6),
  CONSTRAINT charter_weeks_unique UNIQUE (yacht_id, start_iso)
);

CREATE INDEX IF NOT EXISTS charter_weeks_yacht_idx
  ON public.charter_weeks (yacht_id, start_iso);

CREATE TABLE IF NOT EXISTS public.charter_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  yacht_id uuid NOT NULL REFERENCES public.charter_yachts(id) ON DELETE CASCADE,
  guest_name text NOT NULL CHECK (char_length(guest_name) BETWEEN 2 AND 80),
  contact text NOT NULL CHECK (char_length(contact) BETWEEN 5 AND 120),
  party int NOT NULL CHECK (party BETWEEN 1 AND 24),
  start_iso date NOT NULL,
  note text CHECK (note IS NULL OR char_length(note) <= 500),
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'quoted', 'hold', 'won', 'lost')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT charter_inquiries_saturday CHECK (EXTRACT(ISODOW FROM start_iso) = 6)
);

CREATE INDEX IF NOT EXISTS charter_inquiries_yacht_idx
  ON public.charter_inquiries (yacht_id, created_at DESC);

DROP TRIGGER IF EXISTS charter_yachts_set_updated_at ON public.charter_yachts;
CREATE TRIGGER charter_yachts_set_updated_at
  BEFORE UPDATE ON public.charter_yachts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.charter_yachts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charter_weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charter_inquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "charter_yachts: public listed or owner" ON public.charter_yachts;
CREATE POLICY "charter_yachts: public listed or owner"
  ON public.charter_yachts FOR SELECT
  TO anon, authenticated
  USING (
    listed
    OR owner_id = (SELECT auth.uid())
  );

DROP POLICY IF EXISTS "charter_yachts: owner insert" ON public.charter_yachts;
CREATE POLICY "charter_yachts: owner insert"
  ON public.charter_yachts FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "charter_yachts: owner update" ON public.charter_yachts;
CREATE POLICY "charter_yachts: owner update"
  ON public.charter_yachts FOR UPDATE
  TO authenticated
  USING (owner_id = (SELECT auth.uid()))
  WITH CHECK (owner_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "charter_yachts: owner delete" ON public.charter_yachts;
CREATE POLICY "charter_yachts: owner delete"
  ON public.charter_yachts FOR DELETE
  TO authenticated
  USING (owner_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "charter_weeks: listed yacht or owner" ON public.charter_weeks;
CREATE POLICY "charter_weeks: listed yacht or owner"
  ON public.charter_weeks FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.charter_yachts y
      WHERE y.id = yacht_id
        AND (y.listed OR y.owner_id = (SELECT auth.uid()))
    )
  );

DROP POLICY IF EXISTS "charter_weeks: owner write" ON public.charter_weeks;
CREATE POLICY "charter_weeks: owner write"
  ON public.charter_weeks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.charter_yachts y
      WHERE y.id = yacht_id
        AND y.owner_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "charter_weeks: owner update" ON public.charter_weeks;
CREATE POLICY "charter_weeks: owner update"
  ON public.charter_weeks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.charter_yachts y
      WHERE y.id = yacht_id
        AND y.owner_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.charter_yachts y
      WHERE y.id = yacht_id
        AND y.owner_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "charter_weeks: owner delete" ON public.charter_weeks;
CREATE POLICY "charter_weeks: owner delete"
  ON public.charter_weeks FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.charter_yachts y
      WHERE y.id = yacht_id
        AND y.owner_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "charter_inquiries: owner read" ON public.charter_inquiries;
CREATE POLICY "charter_inquiries: owner read"
  ON public.charter_inquiries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.charter_yachts y
      WHERE y.id = yacht_id
        AND y.owner_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "charter_inquiries: guest insert" ON public.charter_inquiries;
CREATE POLICY "charter_inquiries: guest insert"
  ON public.charter_inquiries FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    status = 'new'
    AND EXISTS (
      SELECT 1 FROM public.charter_yachts y
      WHERE y.id = yacht_id
        AND y.listed
    )
    AND EXISTS (
      SELECT 1 FROM public.charter_weeks w
      WHERE w.yacht_id = charter_inquiries.yacht_id
        AND w.start_iso = charter_inquiries.start_iso
        AND w.status = 'open'
    )
  );

DROP POLICY IF EXISTS "charter_inquiries: owner update" ON public.charter_inquiries;
CREATE POLICY "charter_inquiries: owner update"
  ON public.charter_inquiries FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.charter_yachts y
      WHERE y.id = yacht_id
        AND y.owner_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.charter_yachts y
      WHERE y.id = yacht_id
        AND y.owner_id = (SELECT auth.uid())
    )
  );

REVOKE ALL ON public.charter_yachts FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.charter_weeks FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.charter_inquiries FROM PUBLIC, anon, authenticated;

GRANT SELECT ON public.charter_yachts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.charter_yachts TO authenticated;
GRANT SELECT ON public.charter_weeks TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.charter_weeks TO authenticated;
GRANT INSERT ON public.charter_inquiries TO anon, authenticated;
GRANT SELECT, UPDATE ON public.charter_inquiries TO authenticated;
