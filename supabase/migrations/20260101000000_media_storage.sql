-- Public media bucket for admin-managed website images.
-- Binary files live in Storage; PostgreSQL stores URL/path only.

INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Public read for media objects (website + admin previews).
CREATE POLICY "Public read media objects"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'media');

-- Writes are app-mediated via the service-role key (server only).
-- No anon/authenticated insert/update/delete policies for media.
