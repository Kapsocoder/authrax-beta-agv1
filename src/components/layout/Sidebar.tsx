import { Home, PenSquare, Calendar, BarChart3, User, Settings, LogOut, TrendingUp, FileText, Sparkles, Lightbulb } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useNavigationGuard } from "@/contexts/NavigationGuardContext";
import { SubscriptionBadge } from "@/hooks/useProfile";

const navItems = [
  { icon: Home, label: "Dashboard", path: "/dashboard" },
  { icon: PenSquare, label: "Create Post", path: "/create" },
  { icon: FileText, label: "Drafts", path: "/drafts" },
  { icon: Lightbulb, label: "Recommended", path: "/recommendations" },
  { icon: TrendingUp, label: "Trending", path: "/trending" },
  { icon: Calendar, label: "Schedule", path: "/schedule" },
  { icon: BarChart3, label: "Analytics", path: "/analytics" },
  { icon: User, label: "Profile", path: "/profile" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

interface SidebarProps {
  onLogout?: () => void;
}

export function Sidebar({ onLogout }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { requestNavigation } = useNavigationGuard();

  const handleNavigation = (path: string) => {
    if (location.pathname === path) return;
    if (requestNavigation(path)) {
      navigate(path);
    }
  };

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen bg-card border-r border-border p-4 fixed left-0 top-0">
      <div className="flex items-center gap-3 px-2 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
          <Sparkles className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-lg text-foreground">Authrax</h1>
            <SubscriptionBadge />
          </div>
          <p className="text-xs text-muted-foreground">LinkedIn Branding</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              onClick={() => handleNavigation(item.path)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-left",
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="pt-4 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
          onClick={onLogout}
        >
          <LogOut className="w-5 h-5" />
          <span>Log out</span>
        </Button>
      </div>
    </aside>
  );
}
