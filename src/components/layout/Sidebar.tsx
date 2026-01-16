import { Home, PenSquare, Calendar, BarChart3, User, Settings, LogOut, TrendingUp, FileText, Sparkles, Lightbulb } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useNavigationGuard } from "@/contexts/NavigationGuardContext";
import { SubscriptionBadge } from "@/hooks/useProfile";
import logo from "@/assets/logo.png";

const navItems = [
  { icon: Home, label: "Dashboard", path: "/dashboard" },
  { icon: PenSquare, label: "Create Post", path: "/create" },
  { icon: FileText, label: "Drafts", path: "/drafts" },
  { icon: TrendingUp, label: "Trending", path: "/trending" },
  { icon: Lightbulb, label: "Recommended", path: "/recommendations" },
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
    <aside className="hidden md:flex flex-col w-64 h-screen bg-card/60 backdrop-blur-xl border-r border-border/40 p-4 fixed left-0 top-0 z-40 supports-[backdrop-filter]:bg-card/40">
      <div className="flex items-center gap-3 px-2 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center shadow-glow overflow-hidden border border-white/10 backdrop-blur-sm">
          <img src={logo} alt="Authrax Logo" className="w-full h-full object-cover" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-lg text-foreground tracking-tight">Authrax</h1>
            <SubscriptionBadge />
          </div>
          <p className="text-xs text-muted-foreground font-medium">Personal Branding</p>
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
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 text-left group relative overflow-hidden",
                isActive
                  ? "text-primary font-medium bg-primary/10 shadow-[0_0_20px_-5px_rgba(var(--primary),0.3)]"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              )}
            >
              {isActive && (
                <div className="absolute inset-y-0 left-0 w-1 bg-primary rounded-r-full shadow-[0_0_10px_2px_rgba(var(--primary),0.5)]" />
              )}
              <Icon className={cn("w-5 h-5 transition-transform duration-300 group-hover:scale-110", isActive && "text-primary")} />
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
