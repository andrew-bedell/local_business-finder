-- Track images that contain prominent readable text so website generation can
-- exclude stale or visually noisy photos from hero/background usage.

ALTER TABLE public.business_photos
ADD COLUMN IF NOT EXISTS has_text_overlay boolean;

CREATE INDEX IF NOT EXISTS idx_business_photos_business_text_overlay
ON public.business_photos (business_id, has_text_overlay);
