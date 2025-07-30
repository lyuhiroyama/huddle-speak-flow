-- Create storage bucket for audio files (public access)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('audio-files', 'audio-files', true);

-- Create policies for public audio files storage
CREATE POLICY "Anyone can upload audio files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'audio-files');

CREATE POLICY "Anyone can view audio files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'audio-files');

CREATE POLICY "Anyone can delete audio files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'audio-files');

-- Create audio_uploads table (public access)
CREATE TABLE public.audio_uploads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  filename TEXT NOT NULL,
  original_audio_url TEXT NOT NULL,
  transcription_text TEXT,
  status TEXT NOT NULL DEFAULT 'uploading' CHECK (status IN ('uploading', 'transcribing', 'completed', 'failed')),
  duration_seconds INTEGER,
  file_size_bytes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS but allow public access
ALTER TABLE public.audio_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view audio uploads" 
ON public.audio_uploads 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create audio uploads" 
ON public.audio_uploads 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update audio uploads" 
ON public.audio_uploads 
FOR UPDATE 
USING (true);

-- Create dubbings table (public access)
CREATE TABLE public.dubbings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  audio_upload_id UUID NOT NULL REFERENCES public.audio_uploads(id) ON DELETE CASCADE,
  target_language TEXT NOT NULL,
  voice_id TEXT NOT NULL,
  dubbed_audio_url TEXT,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS but allow public access
ALTER TABLE public.dubbings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view dubbings" 
ON public.dubbings 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create dubbings" 
ON public.dubbings 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update dubbings" 
ON public.dubbings 
FOR UPDATE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_audio_uploads_updated_at
  BEFORE UPDATE ON public.audio_uploads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_audio_uploads_created_at ON public.audio_uploads(created_at DESC);
CREATE INDEX idx_audio_uploads_status ON public.audio_uploads(status);
CREATE INDEX idx_dubbings_audio_upload_id ON public.dubbings(audio_upload_id);