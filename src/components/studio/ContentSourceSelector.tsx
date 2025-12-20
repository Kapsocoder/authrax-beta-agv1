import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Lightbulb, 
  Link2, 
  FileText, 
  Mic,
  Youtube,
  ArrowRight,
  Loader2,
  X
} from "lucide-react";
import { VoiceInputButton } from "./VoiceInputButton";

export type ContentSource = 
  | { type: "idea"; content: string }
  | { type: "url"; url: string; urlType: "youtube" | "article" }
  | { type: "file"; content: string }
  | { type: "voice"; transcript: string };

interface ContentSourceSelectorProps {
  onSelect: (source: ContentSource) => void;
  onCancel: () => void;
  isLoading?: boolean;
  prefilledTopic?: string;
}

export function ContentSourceSelector({ 
  onSelect, 
  onCancel, 
  isLoading = false,
  prefilledTopic 
}: ContentSourceSelectorProps) {
  const [activeTab, setActiveTab] = useState<string>(prefilledTopic ? "idea" : "idea");
  const [ideaText, setIdeaText] = useState(prefilledTopic || "");
  const [urlInput, setUrlInput] = useState("");
  const [voiceTranscript, setVoiceTranscript] = useState("");

  const handleSubmit = () => {
    switch (activeTab) {
      case "idea":
        if (ideaText.trim()) {
          onSelect({ type: "idea", content: ideaText.trim() });
        }
        break;
      case "url":
        if (urlInput.trim()) {
          const isYouTube = urlInput.includes("youtube.com") || urlInput.includes("youtu.be");
          onSelect({ 
            type: "url", 
            url: urlInput.trim(),
            urlType: isYouTube ? "youtube" : "article"
          });
        }
        break;
      case "voice":
        if (voiceTranscript.trim()) {
          onSelect({ type: "voice", transcript: voiceTranscript.trim() });
        }
        break;
    }
  };

  const handleVoiceTranscript = (text: string) => {
    setVoiceTranscript(prev => prev + (prev ? " " : "") + text);
  };

  const isValid = () => {
    switch (activeTab) {
      case "idea": return ideaText.trim().length > 10;
      case "url": return urlInput.trim().length > 10;
      case "voice": return voiceTranscript.trim().length > 10;
      default: return false;
    }
  };

  return (
    <Card className="border-border w-full max-w-2xl mx-auto">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-xl">What do you want to post about?</CardTitle>
        <CardDescription>
          Choose how you want to start your content
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="idea" className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              <span className="hidden sm:inline">Idea</span>
            </TabsTrigger>
            <TabsTrigger value="url" className="flex items-center gap-2">
              <Link2 className="w-4 h-4" />
              <span className="hidden sm:inline">URL</span>
            </TabsTrigger>
            <TabsTrigger value="voice" className="flex items-center gap-2">
              <Mic className="w-4 h-4" />
              <span className="hidden sm:inline">Voice</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="idea" className="space-y-4">
            <div>
              <Textarea
                placeholder="Type your idea, notes, or bullet points here...

Example:
- Just closed a big deal
- Learned that persistence pays off
- Want to share lessons about B2B sales"
                value={ideaText}
                onChange={(e) => setIdeaText(e.target.value)}
                className="min-h-[150px] resize-none"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Don't worry about formatting - just get your thoughts down
              </p>
            </div>
          </TabsContent>

          <TabsContent value="url" className="space-y-4">
            <div>
              <Input
                type="url"
                placeholder="Paste a YouTube link or article URL..."
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="mb-2"
              />
              <div className="flex gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Youtube className="w-3 h-3 text-red-500" />
                  YouTube
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  Articles
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                We'll summarize and remix the content in your voice
              </p>
            </div>
          </TabsContent>

          <TabsContent value="voice" className="space-y-4">
            <div className="text-center py-4">
              <VoiceInputButton 
                onTranscript={handleVoiceTranscript}
                size="lg"
                className="mb-4"
              />
              <p className="text-sm text-muted-foreground mb-4">
                Click to talk and share your thoughts naturally
              </p>
              
              {voiceTranscript && (
                <div className="relative bg-muted rounded-lg p-4 text-left">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="absolute top-2 right-2"
                    onClick={() => setVoiceTranscript("")}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                  <p className="text-sm pr-8">{voiceTranscript}</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-3 mt-6 pt-4 border-t border-border">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!isValid() || isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                Generate Post
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
