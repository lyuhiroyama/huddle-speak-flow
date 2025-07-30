import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Volume2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface DubbingPanelProps {
  uploadId: string;
}

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
];

const VOICES = {
  en: [
    { id: '9BWtsMINqrJLrRacOk9x', name: 'Aria (Female)' },
    { id: 'CwhRBWXzGAHq8TQ4Fs17', name: 'Roger (Male)' },
    { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah (Female)' },
  ],
  es: [
    { id: 'cgSgspJ2msm6clMCkdW9', name: 'Jessica (Female)' },
    { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel (Male)' },
  ],
  fr: [
    { id: 'pFZP5JQG7iQjIQuC4Bku', name: 'Lily (Female)' },
    { id: 'nPczCjzI2devNBz1zQrb', name: 'Brian (Male)' },
  ],
  de: [
    { id: 'XB0fDUnXU5powFXDhCwa', name: 'Charlotte (Female)' },
    { id: 'bIHbv24MWmeRgasZH58o', name: 'Will (Male)' },
  ],
  it: [
    { id: 'XrExE9yKIg1WjnnlVkGX', name: 'Matilda (Female)' },
    { id: 'cjVigY5qzO86Huf0OWal', name: 'Eric (Male)' },
  ],
  pt: [
    { id: 'pqHfZKP75CvOlQylNhV4', name: 'Bill (Male)' },
    { id: 'TX3LPaxmHKxFdv7VOQHJ', name: 'Liam (Male)' },
  ],
};

export const DubbingPanel = ({ uploadId }: DubbingPanelProps) => {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  const handleCreateDubbing = async () => {
    if (!selectedLanguage || !selectedVoice) {
      toast({
        title: "Please select language and voice",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    try {
      const { error } = await supabase.functions.invoke('create-dubbing', {
        body: {
          uploadId,
          targetLanguage: selectedLanguage,
          voiceId: selectedVoice,
        }
      });

      if (error) throw error;

      toast({
        title: "Dubbing started",
        description: "Your audio is being dubbed. Check the playback section for results.",
      });

    } catch (error: any) {
      toast({
        title: "Dubbing failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const availableVoices = selectedLanguage ? VOICES[selectedLanguage as keyof typeof VOICES] || [] : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="w-5 h-5" />
          AI Dubbing
        </CardTitle>
        <CardDescription>
          Translate and dub your transcription into another language
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Target Language</label>
            <Select value={selectedLanguage} onValueChange={(value) => {
              setSelectedLanguage(value);
              setSelectedVoice(''); // Reset voice when language changes
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Voice</label>
            <Select 
              value={selectedVoice} 
              onValueChange={setSelectedVoice}
              disabled={!selectedLanguage}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select voice" />
              </SelectTrigger>
              <SelectContent>
                {availableVoices.map((voice) => (
                  <SelectItem key={voice.id} value={voice.id}>
                    {voice.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button 
          onClick={handleCreateDubbing} 
          disabled={!selectedLanguage || !selectedVoice || creating}
          className="w-full"
        >
          {creating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating Dubbing...
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4 mr-2" />
              Create Dubbing
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};