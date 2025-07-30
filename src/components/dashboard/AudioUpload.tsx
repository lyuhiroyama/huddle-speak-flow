import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Upload, FileAudio, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const AudioUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [enableDubbing, setEnableDubbing] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState("es");
  const [voiceId, setVoiceId] = useState("default");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check file type
      if (!selectedFile.type.startsWith('audio/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an audio file",
          variant: "destructive",
        });
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Upload file to Supabase Storage
      const fileName = `${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from('audio-files')
        .upload(fileName, file);

      clearInterval(progressInterval);
      setProgress(100);

      if (error) {
        throw error;
      }

      // Start transcription process
      setTranscribing(true);
      await processTranscription(fileName);

      toast({
        title: "Success",
        description: "Audio uploaded and transcription started",
      });

    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setTranscribing(false);
      setProgress(0);
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const processTranscription = async (fileName: string) => {
    // This would typically call OpenAI Whisper API
    // For now, we'll simulate the process
    return new Promise(resolve => setTimeout(resolve, 3000));
  };

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="audio-file">Audio File</Label>
        <div className="mt-2">
          <Input
            id="audio-file"
            type="file"
            accept="audio/*"
            onChange={handleFileSelect}
            ref={fileInputRef}
            className="cursor-pointer"
          />
        </div>
      </div>

      {file && (
        <div className="p-4 border border-border rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <FileAudio className="w-4 h-4" />
            <span className="text-sm font-medium">{file.name}</span>
            <span className="text-xs text-muted-foreground">
              ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </span>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="enable-dubbing"
            checked={enableDubbing}
            onCheckedChange={setEnableDubbing}
          />
          <Label htmlFor="enable-dubbing">Enable AI dubbing/translation</Label>
        </div>

        {enableDubbing && (
          <div className="space-y-4 pl-6 border-l-2 border-border">
            <div>
              <Label htmlFor="target-language">Target Language</Label>
              <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                  <SelectItem value="it">Italian</SelectItem>
                  <SelectItem value="pt">Portuguese</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="voice">Voice</Label>
              <Select value={voiceId} onValueChange={setVoiceId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select voice" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="energetic">Energetic</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      {(uploading || transcribing) && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">
              {uploading ? "Uploading..." : "Transcribing..."}
            </span>
          </div>
          {uploading && <Progress value={progress} />}
        </div>
      )}

      <Button
        onClick={handleUpload}
        disabled={!file || uploading || transcribing}
        className="w-full"
      >
        <Upload className="w-4 h-4 mr-2" />
        {uploading ? "Uploading..." : transcribing ? "Processing..." : "Upload & Transcribe"}
      </Button>
    </div>
  );
};