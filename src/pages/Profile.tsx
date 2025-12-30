import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router-dom";
import { User, Mail, Briefcase, MapPin, Link as LinkIcon, Edit2, Save, Hash, Bell, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AppLayout } from "@/components/layout/AppLayout";
import { VoiceTrainingSection, VoiceTrainingSectionRef } from "@/components/profile/VoiceTrainingSection";
import { useUserTopics } from "@/hooks/useUserTopics";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { functions } from "@/firebaseConfig";
import { httpsCallable } from "firebase/functions";
import { LinkedInConnect } from "@/components/integrations/LinkedInConnect";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function Profile() {
  const navigate = useNavigate();
  const location = useLocation();
  const voiceSectionRef = useRef<VoiceTrainingSectionRef>(null);
  const voiceContainerRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);

  const { user, signOut } = useAuth();
  const { topics, addTopic, removeTopic } = useUserTopics();
  const { profile: userProfile, isLoading: isProfileLoading, updateProfile } = useProfile();

  const [newTopic, setNewTopic] = useState("");
  const [profile, setProfile] = useState({
    fullName: "",
    title: "",
    company: "",
    location: "",
    bio: "",
    linkedinUrl: "",
  });
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setProfile({
        fullName: userProfile.full_name || user?.displayName || "",
        title: userProfile.headline || "",
        company: userProfile.company || "",
        location: userProfile.location || "",
        bio: userProfile.bio || "",
        linkedinUrl: userProfile.linkedin_profile_url || (userProfile as any).linkedinUrl || "", // handled inconsistency in field naming
      });
    } else if (user) {
      // Fallback if profile doc not created yet
      setProfile(prev => ({ ...prev, fullName: user.displayName || user.email || "" }));
    }
  }, [userProfile, user]);

  // Handle scroll to voice training section
  useEffect(() => {
    const state = location.state as { scrollToVoice?: boolean } | null;
    if (state?.scrollToVoice) {
      // Clear the state to prevent re-scrolling on navigation
      window.history.replaceState({}, document.title);

      // Wait for render then scroll and expand
      setTimeout(() => {
        voiceSectionRef.current?.expand();
        voiceContainerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [location.state]);

  const queryClient = useQueryClient();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/auth/login");
    } catch (error: any) {
      toast.error("Logout failed");
    }
  };

  const handleSave = () => {
    updateProfile.mutate({
      updates: {
        full_name: profile.fullName,
        headline: profile.title,
        company: profile.company,
        location: profile.location,
        bio: profile.bio,
        linkedin_profile_url: profile.linkedinUrl
      }
    }, {
      onSuccess: () => {
        setIsEditing(false);
      }
    });
  };

  const handleSyncLinkedIn = async () => {
    if (!profile.linkedinUrl) {
      toast.error("Please enter your LinkedIn URL first");
      return;
    }

    setIsSyncing(true);
    const toastId = toast.loading("Syncing profile from LinkedIn...");

    try {
      // 1. Auto-save the URL first so the backend scraper can find it
      await updateProfile.mutateAsync({
        updates: { linkedin_profile_url: profile.linkedinUrl },
        silent: true
      });

      // 2. Trigger the sync function
      const syncFn = httpsCallable(functions, 'syncLinkedInProfile', { timeout: 120000 }); // Increase client timeout to 2 min
      // @ts-ignore
      const result = await syncFn({ mode: 'profile' });
      // @ts-ignore
      const data: any = result.data;

      if (data.profile) {
        setProfile(prev => ({
          ...prev,
          fullName: data.profile.fullName || prev.fullName,
          title: data.profile.headline || prev.title,
          bio: data.profile.bio || prev.bio,
        }));

        // Refresh stale data in background
        queryClient.invalidateQueries({ queryKey: ["profile", user?.uid] });

        toast.success("Profile synced successfully!");
      } else {
        toast.warning(data.warning || "Could not extract details. Check permissions.");
      }

      toast.dismiss(toastId);
    } catch (error: any) {
      console.error("Sync error:", error);
      toast.dismiss(toastId);
      toast.error("Sync failed: " + error.message);
    } finally {
      setIsSyncing(false);
    }
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
      <ErrorBoundary>
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
                  {updateProfile.isPending ? "Saving..." : "Save"}
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

          {/* LinkedIn Integration */}
          <div className="mb-6">
            <LinkIcon className="w-5 h-5 mb-2 text-primary" />
            <LinkedInConnect />
          </div>

          {/* Public Profile Settings (Sync) */}
          <Card className="bg-card border-border mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-primary" />
                Smart Sync
              </CardTitle>
              <CardDescription>
                Provide your public profile URL to sync your bio and posts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="linkedinUrl" className="flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-muted-foreground" />
                  Public LinkedIn URL
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="linkedinUrl"
                    value={profile.linkedinUrl}
                    onChange={(e) => setProfile({ ...profile, linkedinUrl: e.target.value })}
                    placeholder="https://linkedin.com/in/yourprofile"
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    type="button"
                    onClick={handleSyncLinkedIn}
                    disabled={isSyncing || !profile.linkedinUrl}
                    title="Sync Profile Info"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                    Sync Profile
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Form */}
          <Card className="bg-card border-border mb-6">
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

              {/* LinkedIn URL moved to separate card */}

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

          {/* Voice Training Section */}
          <div className="mb-6" ref={voiceContainerRef}>
            <VoiceTrainingSection ref={voiceSectionRef} />
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

        </div>
      </ErrorBoundary>
    </AppLayout>
  );
}
