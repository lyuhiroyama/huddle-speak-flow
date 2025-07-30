-- Create policies for the audio-files storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('audio-files', 'audio-files', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop any existing policies
DROP POLICY IF EXISTS "Public can upload to audio-files" ON storage.objects;
DROP POLICY IF EXISTS "Public can view audio files" ON storage.objects;
DROP POLICY IF EXISTS "Public can update audio files" ON storage.objects;
DROP POLICY IF EXISTS "Public can delete audio files" ON storage.objects;

-- Create new public policies for storage.objects
CREATE POLICY "Public can upload to audio-files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'audio-files');

CREATE POLICY "Public can view audio files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'audio-files');

CREATE POLICY "Public can update audio files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'audio-files');

CREATE POLICY "Public can delete audio files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'audio-files');