import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Play, FileAudio, Clock } from "lucide-react";
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

interface RecentHistoryProps {
  refreshTrigger: number;
  onSelectUpload: (upload: AudioUpload) => void;
}

export const RecentHistory = ({ refreshTrigger, onSelectUpload }: RecentHistoryProps) => {
  const [uploads, setUploads] = useState<AudioUpload[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUploads();
  }, [refreshTrigger]);

  const fetchUploads = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('audio_uploads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (data) {
      setUploads(data as AudioUpload[]);
    }
    setLoading(false);
  };

  const filteredUploads = uploads.filter(upload =>
    upload.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
    upload.transcription_text?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'transcribing': return 'secondary';
      case 'uploading': return 'secondary';
      case 'failed': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle>Recent Uploads</CardTitle>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search uploads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : filteredUploads.length === 0 ? (
          <div className="text-center py-8">
            <FileAudio className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchTerm ? 'No uploads found' : 'No uploads yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredUploads.map((upload) => (
              <div
                key={upload.id}
                className="border border-border rounded-lg p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => onSelectUpload(upload)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <FileAudio className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="font-medium text-sm truncate">
                        {upload.filename}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={getStatusColor(upload.status)} className="text-xs">
                        {upload.status}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {formatDate(upload.created_at)}
                      </div>
                    </div>

                    {upload.transcription_text && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                        {upload.transcription_text.substring(0, 100)}...
                      </p>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectUpload(upload);
                    }}
                  >
                    <Play className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};