import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Play, Pause, FileText, Volume2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Transcription {
  id: string;
  filename: string;
  status: "processing" | "completed" | "failed";
  createdAt: string;
  transcriptText?: string;
  hasDubbing: boolean;
  language?: string;
}

export const TranscriptionList = () => {
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Mock data for now - would fetch from Supabase
    setTranscriptions([
      {
        id: "1",
        filename: "team-standup-2024-01-15.mp3",
        status: "completed",
        createdAt: "2024-01-15T10:30:00Z",
        transcriptText: "Good morning everyone. Let's start with our daily standup. Sarah, would you like to begin?",
        hasDubbing: true,
        language: "Spanish"
      },
      {
        id: "2",
        filename: "client-meeting-2024-01-14.wav",
        status: "processing",
        createdAt: "2024-01-14T14:20:00Z",
        hasDubbing: false
      },
      {
        id: "3",
        filename: "brainstorm-session.m4a",
        status: "completed",
        createdAt: "2024-01-13T16:45:00Z",
        transcriptText: "Today we're brainstorming ideas for the new product feature. Let's start by identifying the core user needs.",
        hasDubbing: false
      }
    ]);
  }, []);

  const handlePlay = (id: string) => {
    if (playingId === id) {
      setPlayingId(null);
    } else {
      setPlayingId(id);
      // Simulate playing for 3 seconds
      setTimeout(() => setPlayingId(null), 3000);
    }
  };

  const handleDownload = (type: "transcript" | "audio" | "dubbed", filename: string) => {
    toast({
      title: "Download started",
      description: `Downloading ${type} for ${filename}`,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "default";
      case "processing":
        return "secondary";
      case "failed":
        return "destructive";
      default:
        return "outline";
    }
  };

  if (transcriptions.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No transcriptions yet</p>
        <p className="text-sm text-muted-foreground">Upload an audio file to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {transcriptions.map((transcription) => (
        <Card key={transcription.id}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">{transcription.filename}</CardTitle>
                <CardDescription>
                  {new Date(transcription.createdAt).toLocaleString()}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {transcription.hasDubbing && (
                  <Badge variant="outline" className="gap-1">
                    <Volume2 className="w-3 h-3" />
                    {transcription.language}
                  </Badge>
                )}
                <Badge variant={getStatusColor(transcription.status)}>
                  {transcription.status}
                </Badge>
              </div>
            </div>
          </CardHeader>

          {transcription.status === "completed" && (
            <CardContent className="space-y-4">
              {transcription.transcriptText && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm">{transcription.transcriptText}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handlePlay(transcription.id)}
                >
                  {playingId === transcription.id ? (
                    <Pause className="w-4 h-4 mr-2" />
                  ) : (
                    <Play className="w-4 h-4 mr-2" />
                  )}
                  {playingId === transcription.id ? "Playing..." : "Play Original"}
                </Button>

                {transcription.hasDubbing && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePlay(`${transcription.id}-dubbed`)}
                  >
                    <Volume2 className="w-4 h-4 mr-2" />
                    Play Dubbed
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownload("transcript", transcription.filename)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Transcript
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownload("audio", transcription.filename)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Audio
                </Button>

                {transcription.hasDubbing && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload("dubbed", transcription.filename)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Dubbed Audio
                  </Button>
                )}
              </div>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
};