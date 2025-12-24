import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, Eye, ThumbsUp, MessageCircle, Share2, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { SocialAuthButtons } from "@/components/auth/SocialAuthButtons";

export default function Analytics() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isLinkedInLinked, isLoading: profileLoading } = useProfile();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/auth/login");
    } catch (error: any) {
      toast.error("Logout failed");
    }
  };

  useEffect(() => {
    if (!user) {
      // navigate("/auth"); // Handled by AppLayout
    }
  }, [user, navigate]);

  if (profileLoading) {
    return (
      <AppLayout onLogout={handleLogout}>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AppLayout>
    );
  }


  const stats = [
    { label: "Total Impressions", value: "0", icon: Eye, change: null },
    { label: "Likes", value: "0", icon: ThumbsUp, change: null },
    { label: "Comments", value: "0", icon: MessageCircle, change: null },
    { label: "Shares", value: "0", icon: Share2, change: null },
  ];

  return (
    <AppLayout onLogout={handleLogout}>
      <div className="p-4 md:p-8 max-w-6xl mx-auto animate-fade-in">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">Analytics</h1>
          <p className="text-muted-foreground">Track your LinkedIn performance</p>
        </div>

        {!isLinkedInLinked && (
          <Card className="mb-8 bg-blue-50/50 border-blue-200">
            <CardContent className="flex flex-col md:flex-row items-center justify-between p-6 gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Connect LinkedIn</h3>
                  <p className="text-sm text-muted-foreground">Link your account to see real-time analytics.</p>
                </div>
              </div>
              <div className="w-full md:w-auto min-w-[200px]">
                <SocialAuthButtons mode="signin" allowedProviders={["linkedin"]} />
              </div>
            </CardContent>
          </Card>
        )}


        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <Card key={stat.label} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <stat.icon className="w-5 h-5 text-primary" />
                  {stat.change && (
                    <span className="text-xs text-success flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {stat.change}
                    </span>
                  )}
                </div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Engagement Chart Placeholder */}
        <Card className="bg-card border-border mb-8">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Engagement Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="mb-2">No data yet</p>
                <p className="text-sm">Start posting to see your analytics</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Posts */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Top Performing Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Your top posts will appear here</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
