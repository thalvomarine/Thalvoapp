-- Marketplace-grade dealer onboarding (TR marketplace parity).
-- Captures company / tax / bank / address / ops fields before admin approval.
-- No maritime license fields — those stay out of dealer signup by product rule.

CREATE TABLE IF NOT EXISTS public.dealer_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('draft', 'submitted', 'needs_info', 'approved', 'rejected')),
  entity_type text NOT NULL
    CHECK (entity_type IN ('sole_proprietorship', 'limited', 'joint_stock', 'artisan')),
  legal_name text NOT NULL CHECK (char_length(legal_name) BETWEEN 2 AND 200),
  store_name text NOT NULL CHECK (char_length(store_name) BETWEEN 2 AND 120),
  tax_id text NOT NULL CHECK (tax_id ~ '^\d{10,11}$'),
  tax_office text NOT NULL CHECK (char_length(tax_office) BETWEEN 2 AND 120),
  mersis_number text CHECK (mersis_number IS NULL OR mersis_number ~ '^\d{16}$'),
  kep_address text NOT NULL CHECK (kep_address ~* '^[^\s@]+@[^\s@]+\.kep\.tr$'),
  invoice_type text NOT NULL DEFAULT 'e_archive'
    CHECK (invoice_type IN ('paper', 'e_archive', 'e_invoice')),
  iban text NOT NULL CHECK (iban ~ '^TR[0-9]{24}$'),
  iban_account_name text NOT NULL CHECK (char_length(iban_account_name) BETWEEN 2 AND 200),
  authorized_name text NOT NULL CHECK (char_length(authorized_name) BETWEEN 2 AND 120),
  authorized_title text CHECK (authorized_title IS NULL OR char_length(authorized_title) BETWEEN 1 AND 80),
  registered_address text NOT NULL CHECK (char_length(registered_address) BETWEEN 8 AND 500),
  billing_address text NOT NULL CHECK (char_length(billing_address) BETWEEN 8 AND 500),
  ship_from_address text NOT NULL CHECK (char_length(ship_from_address) BETWEEN 8 AND 500),
  return_address text NOT NULL CHECK (char_length(return_address) BETWEEN 8 AND 500),
  home_marina text NOT NULL CHECK (char_length(home_marina) BETWEEN 2 AND 80),
  ops_contact_name text CHECK (ops_contact_name IS NULL OR char_length(ops_contact_name) BETWEEN 2 AND 120),
  ops_contact_phone text CHECK (ops_contact_phone IS NULL OR char_length(ops_contact_phone) BETWEEN 7 AND 32),
  finance_contact_name text CHECK (finance_contact_name IS NULL OR char_length(finance_contact_name) BETWEEN 2 AND 120),
  finance_contact_phone text CHECK (finance_contact_phone IS NULL OR char_length(finance_contact_phone) BETWEEN 7 AND 32),
  product_focus text NOT NULL CHECK (char_length(product_focus) BETWEEN 2 AND 400),
  brands_carried text CHECK (brands_carried IS NULL OR char_length(brands_carried) BETWEEN 1 AND 400),
  estimated_sku_count int CHECK (estimated_sku_count IS NULL OR (estimated_sku_count > 0 AND estimated_sku_count <= 1000000)),
  delivery_mode text NOT NULL DEFAULT 'both'
    CHECK (delivery_mode IN ('marina_pickup', 'courier', 'both')),
  tax_plate_path text CHECK (
    tax_plate_path IS NULL
    OR (
      char_length(tax_plate_path) BETWEEN 8 AND 300
      AND tax_plate_path LIKE (user_id::text || '/%')
      AND tax_plate_path !~ '\.\.'
    )
  ),
  signature_doc_path text CHECK (
    signature_doc_path IS NULL
    OR (
      char_length(signature_doc_path) BETWEEN 8 AND 300
      AND signature_doc_path LIKE (user_id::text || '/%')
      AND signature_doc_path !~ '\.\.'
    )
  ),
  trade_registry_path text CHECK (
    trade_registry_path IS NULL
    OR (
      char_length(trade_registry_path) BETWEEN 8 AND 300
      AND trade_registry_path LIKE (user_id::text || '/%')
      AND trade_registry_path !~ '\.\.'
    )
  ),
  activity_certificate_path text CHECK (
    activity_certificate_path IS NULL
    OR (
      char_length(activity_certificate_path) BETWEEN 8 AND 300
      AND activity_certificate_path LIKE (user_id::text || '/%')
      AND activity_certificate_path !~ '\.\.'
    )
  ),
  partner_terms_accepted_at timestamptz,
  review_note text CHECK (review_note IS NULL OR char_length(review_note) <= 1000),
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  submitted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT dealer_applications_mersis_required CHECK (
    entity_type NOT IN ('limited', 'joint_stock') OR mersis_number IS NOT NULL
  ),
  CONSTRAINT dealer_applications_one_open UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS dealer_applications_status_idx
  ON public.dealer_applications (status, submitted_at DESC NULLS LAST);

DROP TRIGGER IF EXISTS dealer_applications_set_updated_at ON public.dealer_applications;
CREATE TRIGGER dealer_applications_set_updated_at
  BEFORE UPDATE ON public.dealer_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.dealer_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dealer_applications: owner read" ON public.dealer_applications;
CREATE POLICY "dealer_applications: owner read"
  ON public.dealer_applications FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "dealer_applications: owner insert" ON public.dealer_applications;
CREATE POLICY "dealer_applications: owner insert"
  ON public.dealer_applications FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "dealer_applications: owner update draft" ON public.dealer_applications;
CREATE POLICY "dealer_applications: owner update draft"
  ON public.dealer_applications FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    AND status IN ('draft', 'needs_info', 'submitted')
  )
  WITH CHECK (
    user_id = auth.uid()
    AND status IN ('draft', 'needs_info', 'submitted')
  );

DROP POLICY IF EXISTS "dealer_applications: admin update" ON public.dealer_applications;
CREATE POLICY "dealer_applications: admin update"
  ON public.dealer_applications FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

REVOKE ALL ON public.dealer_applications FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE ON public.dealer_applications TO authenticated;
GRANT ALL ON public.dealer_applications TO service_role;

-- Private document bucket for tax plate / signature / registry scans.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'dealer-documents',
  'dealer-documents',
  false,
  10485760,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET public = false,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "dealer_docs_owner_select" ON storage.objects;
CREATE POLICY "dealer_docs_owner_select"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'dealer-documents'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.has_role(auth.uid(), 'admin')
    )
  );

DROP POLICY IF EXISTS "dealer_docs_owner_insert" ON storage.objects;
CREATE POLICY "dealer_docs_owner_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'dealer-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "dealer_docs_owner_update" ON storage.objects;
CREATE POLICY "dealer_docs_owner_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'dealer-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'dealer-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "dealer_docs_owner_delete" ON storage.objects;
CREATE POLICY "dealer_docs_owner_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'dealer-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- When a Supplier role request is approved/rejected, sync dealer_applications.
CREATE OR REPLACE FUNCTION public.approve_role_request(_user_id uuid, _role public.user_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.profiles
    SET role = _role, requested_role = NULL
    WHERE id = _user_id;

  IF _role::text = 'Provider' THEN
    INSERT INTO public.verified_providers (user_id, verified_by, notes)
      VALUES (_user_id, auth.uid(), 'Approved via approve_role_request')
      ON CONFLICT (user_id) DO NOTHING;
  ELSIF _role::text = 'Supplier' THEN
    INSERT INTO public.verified_dealers (user_id, verified_by, note)
      VALUES (_user_id, auth.uid(), 'Approved via approve_role_request')
      ON CONFLICT (user_id) DO NOTHING;

    UPDATE public.dealer_applications
      SET status = 'approved',
          reviewed_by = auth.uid(),
          reviewed_at = now(),
          updated_at = now()
    WHERE user_id = _user_id
      AND status IN ('submitted', 'needs_info', 'draft');
  ELSIF _role::text = 'Client' THEN
    -- Admin rejection path: keep the application record, mark rejected.
    UPDATE public.dealer_applications
      SET status = 'rejected',
          reviewed_by = auth.uid(),
          reviewed_at = now(),
          updated_at = now()
    WHERE user_id = _user_id
      AND status IN ('submitted', 'needs_info', 'draft');
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.approve_role_request(uuid, public.user_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_role_request(uuid, public.user_role) TO authenticated, service_role;
