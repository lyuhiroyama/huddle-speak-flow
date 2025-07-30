import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, FileText, Loader2 } from "lucide-react";
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

interface TranscriptionDisplayProps {
  upload: AudioUpload;
}

export const TranscriptionDisplay = ({ upload }: TranscriptionDisplayProps) => {
  const [currentUpload, setCurrentUpload] = useState(upload);
  const { toast } = useToast();

  useEffect(() => {
    setCurrentUpload(upload);
  }, [upload]);

  useEffect(() => {
    if (currentUpload.status === 'transcribing') {
      const interval = setInterval(async () => {
        const { data } = await supabase
          .from('audio_uploads')
          .select('*')
          .eq('id', currentUpload.id)
          .single();
        
        if (data && data.status !== 'transcribing') {
          setCurrentUpload(data as AudioUpload);
          clearInterval(interval);
        }
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [currentUpload.id, currentUpload.status]);

  const copyToClipboard = () => {
    if (currentUpload.transcription_text) {
      navigator.clipboard.writeText(currentUpload.transcription_text);
      toast({
        title: "Copied to clipboard",
        description: "Transcription text has been copied",
      });
    }
  };

  const downloadTranscript = () => {
    if (!currentUpload.transcription_text) return;
    
    const blob = new Blob([currentUpload.transcription_text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentUpload.filename.replace(/\.[^/.]+$/, '')}-transcript.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Transcription
        </CardTitle>
        <CardDescription>
          {currentUpload.status === 'transcribing' && 'Processing your audio...'}
          {currentUpload.status === 'completed' && 'Transcription complete'}
          {currentUpload.status === 'failed' && 'Transcription failed'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentUpload.status === 'transcribing' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Transcribing audio...
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        )}

        {currentUpload.status === 'failed' && (
          <div className="text-center py-8">
            <p className="text-destructive">Failed to transcribe audio. Please try again.</p>
          </div>
        )}

        {currentUpload.status === 'completed' && currentUpload.transcription_text && (
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {currentUpload.transcription_text}
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copyToClipboard}>
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
              <Button variant="outline" size="sm" onClick={downloadTranscript}>
                <FileText className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>

            <div className="text-xs text-muted-foreground">
              {currentUpload.transcription_text.length} characters
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};