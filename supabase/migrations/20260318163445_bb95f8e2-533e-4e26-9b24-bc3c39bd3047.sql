
-- Add intro_video_url to listings
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS intro_video_url text;

-- Add intro_video_url to profiles (for sub-lessee intro videos)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS intro_video_url text;

-- Create intro-videos storage bucket (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('intro-videos', 'intro-videos', false, 52428800)
ON CONFLICT (id) DO NOTHING;

-- RLS: authenticated users can upload their own videos
CREATE POLICY "Users can upload own intro videos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'intro-videos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS: authenticated users can read any intro video
CREATE POLICY "Authenticated users can view intro videos"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'intro-videos');

-- RLS: users can update/delete own videos
CREATE POLICY "Users can update own intro videos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'intro-videos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own intro videos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'intro-videos' AND (storage.foldername(name))[1] = auth.uid()::text);
