import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, FileAudio, X } from "lucide-react";
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

interface UploadPanelProps {
  onUploadComplete: (upload: AudioUpload) => void;
}

export const UploadPanel = ({ onUploadComplete }: UploadPanelProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const validateFile = (file: File): string | null => {
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/m4a'];
    if (!validTypes.includes(file.type)) {
      return 'Invalid file type. Please upload MP3, WAV, or M4A files.';
    }
    
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (file.size > maxSize) {
      return 'File too large. Maximum size is 25MB.';
    }
    
    return null;
  };

  const handleFileSelect = useCallback((selectedFile: File) => {
    const validation = validateFile(selectedFile);
    if (validation) {
      toast({
        title: "Invalid file",
        description: validation,
        variant: "destructive",
      });
      return;
    }
    setFile(selectedFile);
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, [handleFileSelect]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const uploadFile = async () => {
    if (!file) return;

    setUploading(true);
    setProgress(0);

    try {
      // Generate unique filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `${timestamp}-${file.name}`;
      const filePath = `originals/${fileName}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('audio-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('audio-files')
        .getPublicUrl(filePath);

      // Create database record
      const { data: dbData, error: dbError } = await supabase
        .from('audio_uploads')
        .insert({
          filename: file.name,
          original_audio_url: urlData.publicUrl,
          file_size_bytes: file.size,
          status: 'transcribing'
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Start transcription
      await supabase.functions.invoke('transcribe-audio', {
        body: { uploadId: dbData.id, audioUrl: urlData.publicUrl }
      });

      onUploadComplete(dbData as AudioUpload);
      setFile(null);
      setProgress(0);

      toast({
        title: "Upload successful",
        description: "Your audio is being transcribed...",
      });

    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Audio</CardTitle>
        <CardDescription>
          Upload MP3, WAV, or M4A files up to 25MB for transcription
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!file && (
          <div
            className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary/50 transition-colors cursor-pointer"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">Drop your audio file here</p>
            <p className="text-muted-foreground">or click to browse</p>
            <input
              id="file-input"
              type="file"
              accept="audio/*"
              onChange={handleFileInput}
              className="hidden"
            />
          </div>
        )}

        {file && (
          <div className="border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileAudio className="w-8 h-8 text-primary" />
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              {!uploading && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFile(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            {uploading && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} />
              </div>
            )}

            {!uploading && (
              <Button onClick={uploadFile} className="w-full mt-4">
                <Upload className="w-4 h-4 mr-2" />
                Upload & Transcribe
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};