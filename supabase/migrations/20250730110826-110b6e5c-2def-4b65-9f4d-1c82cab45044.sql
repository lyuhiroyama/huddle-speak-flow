-- Ensure the audio_uploads table has completely public access
DROP POLICY IF EXISTS "Anyone can create audio uploads" ON public.audio_uploads;
DROP POLICY IF EXISTS "Anyone can view audio uploads" ON public.audio_uploads;
DROP POLICY IF EXISTS "Anyone can update audio uploads" ON public.audio_uploads;

-- Create new public policies for audio_uploads
CREATE POLICY "Public can create audio uploads" 
ON public.audio_uploads 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Public can view audio uploads" 
ON public.audio_uploads 
FOR SELECT 
USING (true);

CREATE POLICY "Public can update audio uploads" 
ON public.audio_uploads 
FOR UPDATE 
USING (true);

CREATE POLICY "Public can delete audio uploads" 
ON public.audio_uploads 
FOR DELETE 
USING (true);

-- Also ensure the dubbings table is public
DROP POLICY IF EXISTS "Anyone can create dubbings" ON public.dubbings;
DROP POLICY IF EXISTS "Anyone can view dubbings" ON public.dubbings;
DROP POLICY IF EXISTS "Anyone can update dubbings" ON public.dubbings;

CREATE POLICY "Public can create dubbings" 
ON public.dubbings 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Public can view dubbings" 
ON public.dubbings 
FOR SELECT 
USING (true);

CREATE POLICY "Public can update dubbings" 
ON public.dubbings 
FOR UPDATE 
USING (true);

CREATE POLICY "Public can delete dubbings" 
ON public.dubbings 
FOR DELETE 
USING (true);