import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { uploadId, targetLanguage, voiceId } = await req.json();
    
    if (!uploadId || !targetLanguage || !voiceId) {
      throw new Error('uploadId, targetLanguage, and voiceId are required');
    }

    console.log(`Starting dubbing for upload ${uploadId} to ${targetLanguage} with voice ${voiceId}`);

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the original upload data
    const { data: upload, error: fetchError } = await supabase
      .from('audio_uploads')
      .select('*')
      .eq('id', uploadId)
      .single();

    if (fetchError || !upload) {
      throw new Error(`Failed to fetch upload: ${fetchError?.message || 'Upload not found'}`);
    }

    if (!upload.transcription_text) {
      throw new Error('No transcription available for dubbing');
    }

    // Create dubbing record
    const { data: dubbing, error: dubbingError } = await supabase
      .from('dubbings')
      .insert({
        audio_upload_id: uploadId,
        target_language: targetLanguage,
        voice_id: voiceId,
        status: 'processing'
      })
      .select()
      .single();

    if (dubbingError) {
      throw new Error(`Failed to create dubbing record: ${dubbingError.message}`);
    }

    console.log('Created dubbing record:', dubbing.id);

    // Translate the text if needed (for non-English targets)
    let textToSpeak = upload.transcription_text;
    
    if (targetLanguage !== 'en') {
      const translateResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4.1-2025-04-14',
          messages: [
            {
              role: 'system',
              content: `Translate the following text to ${getLanguageName(targetLanguage)}. Preserve the tone and meaning while making it sound natural in the target language.`
            },
            {
              role: 'user',
              content: upload.transcription_text
            }
          ],
          max_tokens: 1000
        }),
      });

      if (translateResponse.ok) {
        const translateResult = await translateResponse.json();
        textToSpeak = translateResult.choices[0].message.content;
        console.log('Translated text:', textToSpeak);
      } else {
        console.warn('Translation failed, using original text');
      }
    }

    // Generate speech with ElevenLabs
    const elevenLabsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': Deno.env.get('ELEVENLABS_API_KEY'),
      },
      body: JSON.stringify({
        text: textToSpeak,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        }
      }),
    });

    if (!elevenLabsResponse.ok) {
      const errorText = await elevenLabsResponse.text();
      console.error('ElevenLabs error:', errorText);
      throw new Error(`ElevenLabs TTS failed: ${errorText}`);
    }

    // Upload the dubbed audio to Supabase Storage
    const audioBuffer = await elevenLabsResponse.arrayBuffer();
    const fileName = `dubbed/${dubbing.id}-${Date.now()}.mp3`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('audio-files')
      .upload(fileName, audioBuffer, {
        contentType: 'audio/mpeg'
      });

    if (uploadError) {
      throw new Error(`Failed to upload dubbed audio: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('audio-files')
      .getPublicUrl(fileName);

    // Update dubbing record with the audio URL
    const { error: updateError } = await supabase
      .from('dubbings')
      .update({
        dubbed_audio_url: urlData.publicUrl,
        status: 'completed'
      })
      .eq('id', dubbing.id);

    if (updateError) {
      throw new Error(`Failed to update dubbing record: ${updateError.message}`);
    }

    console.log(`Dubbing completed for ${dubbing.id}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        dubbingId: dubbing.id,
        audioUrl: urlData.publicUrl
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Dubbing error:', error);

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function getLanguageName(code: string): string {
  const languages: Record<string, string> = {
    'en': 'English',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'pt': 'Portuguese'
  };
  return languages[code] || 'English';
}