import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Settings as SettingsIcon, Bell, Shield, Palette, HelpCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { SupportDialog } from "@/components/settings/SupportDialog";
import { BugReportDialog } from "@/components/settings/BugReportDialog";


export default function Settings() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  useEffect(() => {
    if (!user) {
      // navigate("/auth"); // useAuth should handle this or AppLayout
    }
  }, [user, navigate]);

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("Logged out successfully");
      navigate("/auth/login");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const settingsSections = [
    {
      icon: Bell,
      title: "Notifications",
      description: "Manage your notification preferences",
      status: "coming_soon",
      settings: [
        { label: "Push notifications", description: "Posting reminders", enabled: true },
        { label: "Email notifications", description: "Weekly analytics digest", enabled: false },
        { label: "Trending alerts", description: "When topics are trending", enabled: true },
      ],
    },
    {
      icon: Palette,
      title: "Appearance",
      description: "Customize how Authrax looks",
      status: "coming_soon",
      settings: [
        { label: "Dark mode", description: "Use dark theme", enabled: true },
        { label: "Compact mode", description: "Reduce spacing", enabled: false },
      ],
    },
  ];

  return (
    <AppLayout onLogout={handleLogout}>
      <div className="p-4 md:p-8 max-w-2xl mx-auto animate-fade-in">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1 flex items-center gap-3">
            <SettingsIcon className="w-8 h-8 text-primary" />
            Settings
          </h1>
          <p className="text-muted-foreground">Manage your preferences</p>
        </div>

        <div className="space-y-6">
          {/* Settings Sections */}
          {settingsSections.map((section) => (
            <Card key={section.title} className={`bg-card border-border ${section.status === 'coming_soon' ? 'opacity-75' : ''}`}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <section.icon className="w-5 h-5 text-primary" />
                  {section.title}
                  {section.status === 'coming_soon' && (
                    <Badge variant="secondary" className="ml-2 text-xs font-normal">Coming Soon</Badge>
                  )}
                </CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {section.settings.map((setting) => (
                  <div key={setting.label} className="flex items-center justify-between py-2">
                    <div>
                      <Label className="text-foreground">{setting.label}</Label>
                      <p className="text-sm text-muted-foreground">{setting.description}</p>
                    </div>
                    <Switch defaultChecked={setting.enabled} disabled={section.status === 'coming_soon'} />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}

          {/* Help & Support */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-primary" />
                Help & Support
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <button
                  onClick={() => toast.info("Documentation coming soon!")}
                  className="w-full text-left px-4 py-3 rounded-lg hover:bg-secondary/50 transition-colors flex items-center justify-between group"
                >
                  <span className="text-foreground">Documentation</span>
                </button>
                <SupportDialog />
                <BugReportDialog />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
