import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AudioUpload } from "./AudioUpload";
import { TranscriptionList } from "./TranscriptionList";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, Upload, History } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<"upload" | "history">("upload");
  const { toast } = useToast();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Huddle Speak Flow</h1>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex gap-4 mb-8">
          <Button
            variant={activeTab === "upload" ? "default" : "outline"}
            onClick={() => setActiveTab("upload")}
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </Button>
          <Button
            variant={activeTab === "history" ? "default" : "outline"}
            onClick={() => setActiveTab("history")}
          >
            <History className="w-4 h-4 mr-2" />
            History
          </Button>
        </div>

        {activeTab === "upload" && (
          <Card>
            <CardHeader>
              <CardTitle>Upload Huddle Audio</CardTitle>
              <CardDescription>
                Upload your Slack huddle recording to transcribe and optionally dub it
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AudioUpload />
            </CardContent>
          </Card>
        )}

        {activeTab === "history" && (
          <Card>
            <CardHeader>
              <CardTitle>Transcription History</CardTitle>
              <CardDescription>
                View and manage your previous transcriptions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TranscriptionList />
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};