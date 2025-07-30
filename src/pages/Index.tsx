import { useState } from "react";
import { UploadPanel } from "@/components/UploadPanel";
import { TranscriptionDisplay } from "@/components/TranscriptionDisplay";
import { DubbingPanel } from "@/components/DubbingPanel";
import { AudioPlayback } from "@/components/AudioPlayback";
import { RecentHistory } from "@/components/RecentHistory";

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

const Index = () => {
  const [currentUpload, setCurrentUpload] = useState<AudioUpload | null>(null);
  const [refreshHistory, setRefreshHistory] = useState(0);

  const handleUploadComplete = (upload: AudioUpload) => {
    setCurrentUpload(upload);
    setRefreshHistory(prev => prev + 1);
  };

  const handleSelectFromHistory = (upload: AudioUpload) => {
    setCurrentUpload(upload);
  };

  const handleDeleteUpload = (uploadId: string) => {
    // Clear current upload if it was deleted
    if (currentUpload?.id === uploadId) {
      setCurrentUpload(null);
    }
    // Refresh the history list
    setRefreshHistory(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">Huddle Transcriber</h1>
          <p className="text-muted-foreground mt-2">Upload audio, get transcriptions, and dub to any language</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Upload & Controls */}
          <div className="lg:col-span-2 space-y-6">
            <UploadPanel onUploadComplete={handleUploadComplete} />
            
            {currentUpload && (
              <>
                <TranscriptionDisplay upload={currentUpload} />
                {/* Debug: Check if transcription_text exists */}
                {console.log('Current upload:', currentUpload)}
                {console.log('Transcription text:', currentUpload.transcription_text)}
                {console.log('Status:', currentUpload.status)}
                {currentUpload.transcription_text && (
                  <DubbingPanel uploadId={currentUpload.id} />
                )}
                <AudioPlayback upload={currentUpload} onDeleteUpload={handleDeleteUpload} />
              </>
            )}
          </div>

          {/* Right Column - Recent History */}
          <div>
            <RecentHistory 
              refreshTrigger={refreshHistory}
              onSelectUpload={handleSelectFromHistory}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
