import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Eye, Wand2, Save, Send, Clock, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/AppLayout";
import { PostEditor } from "@/components/post/PostEditor";
import { LinkedInPreview } from "@/components/post/LinkedInPreview";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Create() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [content, setContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("write");

  const initialTopic = searchParams.get("topic") || "";

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    toast.info("AI generation will be enabled after voice training setup");
    setTimeout(() => {
      setIsGenerating(false);
    }, 1500);
  };

  const handleSaveDraft = () => {
    if (!content.trim()) {
      toast.error("Write something first!");
      return;
    }
    toast.success("Draft saved!");
  };

  const handleSchedule = () => {
    if (!content.trim()) {
      toast.error("Write something first!");
      return;
    }
    navigate("/schedule", { state: { content } });
  };

  const handlePostNow = () => {
    if (!content.trim()) {
      toast.error("Write something first!");
      return;
    }
    toast.info("Direct posting requires LinkedIn API setup. Use 'Copy & Post' for now.");
  };

  const handleCopyToClipboard = async () => {
    if (!content.trim()) {
      toast.error("Write something first!");
      return;
    }
    await navigator.clipboard.writeText(content);
    toast.success("Copied! Open LinkedIn to paste your post.");
  };

  const userName = user?.user_metadata?.full_name || "Your Name";

  return (
    <AppLayout onLogout={handleLogout}>
      <div className="min-h-screen animate-fade-in">
        {/* Header */}
        <header className="sticky top-0 z-40 glass-strong border-b border-border/50 px-4 py-3">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/dashboard")}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="font-semibold text-foreground">Create Post</h1>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleSaveDraft}>
                <Save className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Save</span>
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="gradient" size="sm">
                    Publish
                    <ChevronDown className="w-4 h-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={handleCopyToClipboard}>
                    <Send className="w-4 h-4 mr-2" />
                    Copy & Post
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSchedule}>
                    <Clock className="w-4 h-4 mr-2" />
                    Schedule
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handlePostNow} disabled>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Post Now (Soon)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <div className="max-w-6xl mx-auto p-4 md:p-8">
          {initialTopic && (
            <div className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-sm text-primary">
                <Wand2 className="w-4 h-4 inline mr-2" />
                Writing about: <strong>{initialTopic}</strong>
              </p>
            </div>
          )}

          {/* Mobile Tabs */}
          <div className="md:hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="write">Write</TabsTrigger>
                <TabsTrigger value="preview" className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Preview
                </TabsTrigger>
              </TabsList>
              <TabsContent value="write">
                <PostEditor
                  value={content}
                  onChange={setContent}
                  onGenerateAI={handleGenerateAI}
                  isGenerating={isGenerating}
                  placeholder={initialTopic ? `Share your thoughts on ${initialTopic}...` : "What do you want to share?"}
                />
              </TabsContent>
              <TabsContent value="preview">
                <LinkedInPreview
                  content={content}
                  authorName={userName}
                  authorTitle="Professional Title"
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Desktop Split View */}
          <div className="hidden md:grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-sm font-medium text-muted-foreground mb-3">Editor</h2>
              <PostEditor
                value={content}
                onChange={setContent}
                onGenerateAI={handleGenerateAI}
                isGenerating={isGenerating}
                placeholder={initialTopic ? `Share your thoughts on ${initialTopic}...` : "What do you want to share?"}
              />
            </div>
            <div>
              <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4" />
                LinkedIn Preview
              </h2>
              <LinkedInPreview
                content={content}
                authorName={userName}
                authorTitle="Professional Title"
              />
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
