-- Ensure every client upload target exists on the live project.
-- Policies existed for part-images, but the bucket row was never inserted.
-- job-photos and vessel-documents were also missing from production storage.

-- ---------------------------------------------------------------------------
-- part-images: public product / boat listing photos (ImageUploader)
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'part-images',
  'part-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET public = true,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Own-folder uploads for verified dealers (catalogue) and authenticated
-- boat sellers (CreateBoatListingSheet reuses the same uploader).
DROP POLICY IF EXISTS "part_images_owner_insert" ON storage.objects;
CREATE POLICY "part_images_owner_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'part-images'
    AND (storage.foldername(name))[1] = (auth.uid())::text
    AND lower(name) ~ '\.(jpg|jpeg|png|webp)$'
  );

DROP POLICY IF EXISTS "part_images_owner_update" ON storage.objects;
CREATE POLICY "part_images_owner_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'part-images'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  )
  WITH CHECK (
    bucket_id = 'part-images'
    AND (storage.foldername(name))[1] = (auth.uid())::text
    AND lower(name) ~ '\.(jpg|jpeg|png|webp)$'
  );

DROP POLICY IF EXISTS "part_images_owner_delete" ON storage.objects;
CREATE POLICY "part_images_owner_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'part-images'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );

-- Keep listing closed: public CDN URLs still work without a SELECT policy.
DROP POLICY IF EXISTS "part_images_public_read" ON storage.objects;

-- ---------------------------------------------------------------------------
-- job-photos: private SOS / job card attachments
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'job-photos',
  'job-photos',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET public = false,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "job_photos_owner_insert" ON storage.objects;
CREATE POLICY "job_photos_owner_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'job-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND lower(name) ~ '\.(jpg|jpeg|png|webp)$'
  );

DROP POLICY IF EXISTS "job_photos_party_select" ON storage.objects;
CREATE POLICY "job_photos_party_select"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'job-photos'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.has_role(auth.uid(), 'admin')
      OR EXISTS (
        SELECT 1 FROM public.jobs j
        WHERE j.photo_url = name
          AND (j.client_id = auth.uid() OR j.provider_id = auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "job_photos_owner_delete" ON storage.objects;
CREATE POLICY "job_photos_owner_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'job-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------------
-- vessel-documents: passport document vault
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vessel_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slot text NOT NULL CHECK (slot IN ('registration', 'insurance', 'transit_log', 'survey')),
  storage_path text NOT NULL CHECK (
    char_length(storage_path) BETWEEN 8 AND 300
    AND storage_path LIKE (owner_id::text || '/%')
    AND storage_path !~ '\.\.'
  ),
  file_name text NOT NULL CHECK (char_length(file_name) BETWEEN 1 AND 180),
  mime text NOT NULL CHECK (mime IN ('application/pdf', 'image/jpeg', 'image/png', 'image/webp')),
  byte_size int NOT NULL CHECK (byte_size > 0 AND byte_size <= 10485760),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id, slot)
);

ALTER TABLE public.vessel_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vessel_documents: owner all" ON public.vessel_documents;
CREATE POLICY "vessel_documents: owner all"
  ON public.vessel_documents FOR ALL TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "vessel_documents: admin read" ON public.vessel_documents;
CREATE POLICY "vessel_documents: admin read"
  ON public.vessel_documents FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

REVOKE ALL ON public.vessel_documents FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vessel_documents TO authenticated;
GRANT ALL ON public.vessel_documents TO service_role;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vessel-documents',
  'vessel-documents',
  false,
  10485760,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET public = false,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "vessel_docs_owner_select" ON storage.objects;
CREATE POLICY "vessel_docs_owner_select"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'vessel-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "vessel_docs_owner_insert" ON storage.objects;
CREATE POLICY "vessel_docs_owner_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'vessel-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "vessel_docs_owner_update" ON storage.objects;
CREATE POLICY "vessel_docs_owner_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'vessel-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'vessel-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "vessel_docs_owner_delete" ON storage.objects;
CREATE POLICY "vessel_docs_owner_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'vessel-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
