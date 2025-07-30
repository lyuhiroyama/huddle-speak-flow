import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Download, Volume2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AudioUpload {
  id: string;
  filename: string;
  original_audio_url: string;
  transcription_text?: string;
  status: 'uploading' | 'transcribing' | 'completed' | 'failed';
  duration_seconds?: number;
  file_size_bytes?: number;
  created_at: string;
}

interface Dubbing {
  id: string;
  target_language: string;
  voice_id: string;
  dubbed_audio_url?: string;
  status: 'processing' | 'completed' | 'failed';
  created_at: string;
}

interface AudioPlaybackProps {
  upload: AudioUpload;
  onDeleteUpload?: (uploadId: string) => void;
}

const LANGUAGE_NAMES: { [key: string]: string } = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
};

export const AudioPlayback = ({ upload, onDeleteUpload }: AudioPlaybackProps) => {
  const [dubbings, setDubbings] = useState<Dubbing[]>([]);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [audioElements, setAudioElements] = useState<{ [key: string]: HTMLAudioElement }>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchDubbings();
    // Poll for dubbing updates
    const interval = setInterval(fetchDubbings, 3000);
    return () => clearInterval(interval);
  }, [upload.id]);

  const fetchDubbings = async () => {
    const { data } = await supabase
      .from('dubbings')
      .select('*')
      .eq('audio_upload_id', upload.id)
      .order('created_at', { ascending: false });
    
    if (data) {
      setDubbings(data as Dubbing[]);
    }
  };

  const handlePlay = (audioUrl: string, key: string) => {
    // Stop any currently playing audio
    Object.values(audioElements).forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });

    if (playingAudio === key) {
      setPlayingAudio(null);
      return;
    }

    let audio = audioElements[key];
    if (!audio) {
      audio = new Audio(audioUrl);
      audio.onended = () => setPlayingAudio(null);
      setAudioElements(prev => ({ ...prev, [key]: audio }));
    }

    audio.play();
    setPlayingAudio(key);
  };

  const handleDownload = (audioUrl: string, filename: string) => {
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = filename;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDeleteDubbing = async (dubbingId: string) => {
    try {
      const { error } = await supabase
        .from('dubbings')
        .delete()
        .eq('id', dubbingId);

      if (error) throw error;

      toast({
        title: "Dubbing deleted",
        description: "The dubbed audio has been removed.",
      });

      fetchDubbings(); // Refresh the list
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteUpload = async () => {
    try {
      // Delete all dubbings first
      await supabase
        .from('dubbings')
        .delete()
        .eq('audio_upload_id', upload.id);

      // Delete the upload
      const { error } = await supabase
        .from('audio_uploads')
        .delete()
        .eq('id', upload.id);

      if (error) throw error;

      toast({
        title: "Upload deleted",
        description: "The audio file and all its dubbings have been removed.",
      });

      // Notify parent component
      onDeleteUpload?.(upload.id);
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Audio Playback</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDeleteUpload}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Original Audio */}
        <div className="flex items-center justify-between p-3 border border-border rounded-lg">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="font-medium">Original Audio</span>
              <span className="text-sm text-muted-foreground">{upload.filename}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePlay(upload.original_audio_url, 'original')}
            >
              {playingAudio === 'original' ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownload(upload.original_audio_url, upload.filename)}
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Dubbed Audio */}
        {dubbings.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Dubbed Versions</h4>
            {dubbings.map((dubbing) => (
              <div
                key={dubbing.id}
                className="flex items-center justify-between p-3 border border-border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Volume2 className="w-4 h-4 text-primary" />
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {LANGUAGE_NAMES[dubbing.target_language] || dubbing.target_language}
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          dubbing.status === 'completed' ? 'default' :
                          dubbing.status === 'processing' ? 'secondary' : 'destructive'
                        }
                      >
                        {dubbing.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                {dubbing.status === 'completed' && dubbing.dubbed_audio_url && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePlay(dubbing.dubbed_audio_url!, `dubbing-${dubbing.id}`)}
                    >
                      {playingAudio === `dubbing-${dubbing.id}` ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(
                        dubbing.dubbed_audio_url!,
                        `${upload.filename.replace(/\.[^/.]+$/, '')}-${dubbing.target_language}.mp3`
                      )}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteDubbing(dubbing.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                
                {dubbing.status === 'processing' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteDubbing(dubbing.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};