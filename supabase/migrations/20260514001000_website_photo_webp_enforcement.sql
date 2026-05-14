-- Website photo canonicalization.
--
-- Raw/source images may exist for intake or debugging, but rows marked as
-- website-eligible must point at optimized WebP objects with size metadata.

ALTER TABLE public.business_photos
  ADD COLUMN IF NOT EXISTS original_url text,
  ADD COLUMN IF NOT EXISTS content_type text,
  ADD COLUMN IF NOT EXISTS byte_size integer,
  ADD COLUMN IF NOT EXISTS width integer,
  ADD COLUMN IF NOT EXISTS height integer,
  ADD COLUMN IF NOT EXISTS optimized_at timestamptz,
  ADD COLUMN IF NOT EXISTS is_website_eligible boolean NOT NULL DEFAULT false;

ALTER TABLE public.business_photos
  DROP CONSTRAINT IF EXISTS business_photos_website_webp_chk;

ALTER TABLE public.business_photos
  DROP CONSTRAINT IF EXISTS business_photos_storage_webp_chk;

ALTER TABLE public.business_photos
  ADD CONSTRAINT business_photos_storage_webp_chk
  CHECK (
    storage_path IS NULL
    OR (
      lower(storage_path) LIKE '%.webp'
      AND url IS NOT NULL
      AND lower(split_part(url, '?', 1)) LIKE '%.webp'
      AND content_type = 'image/webp'
    )
  ) NOT VALID;

ALTER TABLE public.business_photos
  ADD CONSTRAINT business_photos_website_webp_chk
  CHECK (
    is_website_eligible IS NOT TRUE
    OR (
      storage_path IS NOT NULL
      AND lower(storage_path) LIKE '%.webp'
      AND url IS NOT NULL
      AND lower(split_part(url, '?', 1)) LIKE '%.webp'
      AND content_type = 'image/webp'
      AND byte_size BETWEEN 1 AND 102400
      AND width IS NOT NULL
      AND width > 0
      AND height IS NOT NULL
      AND height > 0
      AND optimized_at IS NOT NULL
    )
  ) NOT VALID;

CREATE INDEX IF NOT EXISTS idx_business_photos_website_eligible
  ON public.business_photos (business_id, is_website_eligible)
  WHERE is_website_eligible IS TRUE;
