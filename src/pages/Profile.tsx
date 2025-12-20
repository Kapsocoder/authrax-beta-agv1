import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Mail, Briefcase, MapPin, Link as LinkIcon, Edit2, Save, Hash, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AppLayout } from "@/components/layout/AppLayout";
import { VoiceTrainingSection } from "@/components/profile/VoiceTrainingSection";
import { supabase } from "@/integrations/supabase/client";
import { useUserTopics } from "@/hooks/useUserTopics";
import { toast } from "sonner";

export default function Profile() {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { topics, addTopic, removeTopic } = useUserTopics();
  const [newTopic, setNewTopic] = useState("");
  const [profile, setProfile] = useState({
    fullName: "",
    title: "",
    company: "",
    location: "",
    bio: "",
    linkedinUrl: "",
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        setProfile({
          fullName: session.user.user_metadata?.full_name || "",
          title: "",
          company: "",
          location: "",
          bio: "",
          linkedinUrl: "",
        });
      }
    });
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleSave = () => {
    toast.success("Profile updated!");
    setIsEditing(false);
  };

  const handleAddTopic = () => {
    if (newTopic.trim()) {
      addTopic.mutate(newTopic.trim());
      setNewTopic("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTopic();
    }
  };

  return (
    <AppLayout onLogout={handleLogout}>
      <div className="p-4 md:p-8 max-w-3xl mx-auto animate-fade-in">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Profile</h1>
          <Button
            variant={isEditing ? "gradient" : "outline"}
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          >
            {isEditing ? (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save
              </>
            ) : (
              <>
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
              </>
            )}
          </Button>
        </div>

        {/* Avatar Section */}
        <Card className="bg-card border-border mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-primary flex items-center justify-center text-primary-foreground text-2xl font-bold shadow-glow">
                {profile.fullName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-foreground mb-1">
                  {profile.fullName || "Your Name"}
                </h2>
                <p className="text-muted-foreground">{user?.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Voice Training Section */}
        <div className="mb-6">
          <VoiceTrainingSection />
        </div>

        {/* Topics of Interest */}
        <Card className="bg-card border-border mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Hash className="w-5 h-5 text-primary" />
              Topics of Interest
            </CardTitle>
            <CardDescription>
              Topics you want to follow and get trending content about
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {topics.map((topic) => (
                <Badge 
                  key={topic.id} 
                  variant="secondary" 
                  className="px-3 py-1.5 cursor-pointer hover:bg-destructive/20 hover:text-destructive transition-colors"
                  onClick={() => removeTopic.mutate(topic.id)}
                >
                  {topic.name}
                  <span className="ml-2 opacity-60">×</span>
                </Badge>
              ))}
              {topics.length === 0 && (
                <p className="text-sm text-muted-foreground">No topics added yet</p>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add a topic (e.g., AI, Leadership)"
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1"
              />
              <Button 
                variant="outline" 
                onClick={handleAddTopic}
                disabled={!newTopic.trim() || addTopic.isPending}
              >
                Add
              </Button>
            </div>
            
            {/* Upcoming Feature: Notifications */}
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 mt-4">
              <div className="flex items-center gap-2 text-primary">
                <Bell className="w-4 h-4" />
                <span className="text-sm font-medium">Coming Soon</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Get notified about trending posts and topics based on your interests
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Profile Form */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                Full Name
              </Label>
              <Input
                id="fullName"
                value={profile.fullName}
                onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                disabled={!isEditing}
                placeholder="John Doe"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="title" className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-muted-foreground" />
                Professional Title
              </Label>
              <Input
                id="title"
                value={profile.title}
                onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                disabled={!isEditing}
                placeholder="Marketing Director"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company" className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-muted-foreground" />
                Company
              </Label>
              <Input
                id="company"
                value={profile.company}
                onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                disabled={!isEditing}
                placeholder="Acme Inc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                Location
              </Label>
              <Input
                id="location"
                value={profile.location}
                onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                disabled={!isEditing}
                placeholder="San Francisco, CA"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkedinUrl" className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-muted-foreground" />
                LinkedIn URL
              </Label>
              <Input
                id="linkedinUrl"
                value={profile.linkedinUrl}
                onChange={(e) => setProfile({ ...profile, linkedinUrl: e.target.value })}
                disabled={!isEditing}
                placeholder="https://linkedin.com/in/yourprofile"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                disabled={!isEditing}
                placeholder="Tell us about yourself..."
                className="min-h-[100px]"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
