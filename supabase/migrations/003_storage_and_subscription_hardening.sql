-- Migration 003: reproducible storage setup for evidence bucket and policies

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'evidence',
  'evidence',
  false,
  52428800,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'video/mp4']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Client uploads own evidence files'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Client uploads own evidence files"
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'evidence'
        AND (storage.foldername(name))[1] = auth.uid()::text
        AND EXISTS (
          SELECT 1
          FROM public.cases c
          WHERE c.id::text = (storage.foldername(name))[2]
            AND c.client_id = auth.uid()
        )
      )
    $policy$;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Authorized users read evidence files'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Authorized users read evidence files"
      ON storage.objects
      FOR SELECT
      TO authenticated
      USING (
        bucket_id = 'evidence'
        AND EXISTS (
          SELECT 1
          FROM public.cases c
          WHERE c.id::text = (storage.foldername(name))[2]
            AND (
              c.client_id = auth.uid()
              OR c.asesor_id = auth.uid()
              OR public.get_my_role() = 'admin'
            )
        )
      )
    $policy$;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Client deletes own orphaned evidence files'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Client deletes own orphaned evidence files"
      ON storage.objects
      FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'evidence'
        AND (storage.foldername(name))[1] = auth.uid()::text
        AND EXISTS (
          SELECT 1
          FROM public.cases c
          WHERE c.id::text = (storage.foldername(name))[2]
            AND c.client_id = auth.uid()
        )
      )
    $policy$;
  END IF;
END $$;
