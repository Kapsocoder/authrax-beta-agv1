import {
    PenSquare,
    TrendingUp,
    Calendar,
    Sparkles,
    Zap,
    Clock,
    Target,
    Mic,
    Edit3,
    Link2,
    Video,
    FileText,
    Newspaper,
    MessageCircle,
    ExternalLink,
    Home,
    User,
    Settings,
    Lightbulb,
    Search,
    Bell,
    Menu
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

// Static Sidebar for Preview
const PreviewSidebar = () => {
    const navItems = [
        { icon: Home, label: "Dashboard", active: true },
        { icon: PenSquare, label: "Create Post" },
        { icon: FileText, label: "Drafts" },
        { icon: Lightbulb, label: "Recommended" },
        { icon: TrendingUp, label: "Trending" },
        { icon: Calendar, label: "Schedule" },
        { icon: User, label: "Profile" },
    ];

    return (
        <aside className="hidden md:flex flex-col w-64 h-full bg-card border-r border-border p-4 absolute left-0 top-0 bottom-0 z-20">
            <div className="flex items-center gap-3 px-2 mb-8">
                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-glow overflow-hidden">
                    <img src={logo} alt="Authrax Logo" className="w-full h-full object-cover p-0.5" />
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="font-bold text-lg text-foreground">Authrax</h1>
                        <Badge variant="outline" className="text-[10px] py-0 h-4 border-primary/30 text-primary bg-primary/5">PRO</Badge>
                    </div>
                </div>
            </div>

            <nav className="flex-1 space-y-1">
                {navItems.map((item) => (
                    <div
                        key={item.label}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${item.active
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground"
                            }`}
                    >
                        <item.icon className="w-4 h-4" />
                        <span>{item.label}</span>
                    </div>
                ))}
            </nav>

            <div className="p-3 mt-auto bg-gradient-to-br from-primary/10 to-transparent rounded-xl border border-primary/10">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-medium text-primary">Voice Training Active</span>
                </div>
                <div className="h-1.5 w-full bg-background rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[85%]" />
                </div>
            </div>
        </aside>
    );
};

export const DashboardPreview = () => {
    // Static data for 'perfect' state
    const captureOptions = [
        { icon: Mic, label: "Capture Idea", gradient: "bg-gradient-primary" },
        { icon: Edit3, label: "Draft Post", gradient: "bg-gradient-accent" },
        { icon: Link2, label: "Import Link", gradient: "from-blue-500 to-cyan-500" },
    ];

    const stats = [
        { label: "Posts This Week", value: "12", icon: PenSquare },
        { label: "Total Impressions", value: "45.2k", icon: TrendingUp },
        { label: "Scheduled", value: "8", icon: Clock },
        { label: "Voice Score", value: "98%", icon: Target },
    ];

    return (
        <div className="relative w-full h-full bg-background/50 backdrop-blur-sm overflow-hidden flex text-left select-none pointer-events-none rounded-xl">
            <PreviewSidebar />

            {/* Main Content Area */}
            <main className="flex-1 md:ml-64 p-4 md:p-6 h-full overflow-hidden relative">
                {/* Fake Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground mb-1">Good morning, Alex! 👋</h1>
                        <p className="text-muted-foreground text-sm">Your personal brand is growing.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-card border border-border rounded-lg text-sm text-muted-foreground w-64">
                            <Search className="w-4 h-4" />
                            <span>Search...</span>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center relative">
                            <Bell className="w-4 h-4 text-muted-foreground" />
                            <div className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-card" />
                        </div>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-accent border-2 border-background shadow-lg" />
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {stats.map((stat) => (
                        <div key={stat.label} className="bg-card border border-border p-4 rounded-xl shadow-sm">
                            <div className="flex justify-between items-start mb-2">
                                <stat.icon className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* Content Layout */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="col-span-1 md:col-span-2 space-y-6">
                        {/* Capture Card */}
                        <div className="bg-card border border-border rounded-xl p-5">
                            <div className="flex items-center gap-2 mb-4 font-semibold">
                                <Sparkles className="w-4 h-4 text-primary" />
                                <span>Create New Content</span>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                {captureOptions.map((opt) => (
                                    <div key={opt.label} className="bg-secondary/30 border border-border/50 rounded-lg p-3 flex flex-col items-center gap-2 text-center">
                                        <div className={`w-8 h-8 rounded-md ${opt.gradient} flex items-center justify-center text-white`}>
                                            <opt.icon className="w-4 h-4" />
                                        </div>
                                        <span className="text-xs font-medium">{opt.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Trending News Mock */}
                        <div className="bg-card border border-border rounded-xl p-5">
                            <div className="flex items-center justify-between mb-4">
                                <span className="font-semibold flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-primary" /> Trending Now
                                </span>
                                <span className="text-xs text-primary">View All</span>
                            </div>
                            <div className="space-y-3">
                                <div className="p-3 bg-secondary/20 rounded-lg border border-border/50 flex gap-3">
                                    <div className="flex-1">
                                        <div className="text-xs text-primary mb-1">AI & Tech</div>
                                        <div className="text-sm font-medium leading-tight">GPT-5 Rumors: Everything we know so far about the updated model</div>
                                        <div className="text-[10px] text-muted-foreground mt-2">2h ago • TechCrunch</div>
                                    </div>
                                </div>
                                <div className="p-3 bg-secondary/20 rounded-lg border border-border/50 flex gap-3">
                                    <div className="flex-1">
                                        <div className="text-xs text-primary mb-1">Leadership</div>
                                        <div className="text-sm font-medium leading-tight">Why remote work culture is shifting back to hybrid in 2025</div>
                                        <div className="text-[10px] text-muted-foreground mt-2">5h ago • Forbes</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Drafts */}
                    <div className="col-span-1 space-y-6">
                        <div className="bg-card border border-border rounded-xl p-5 h-full">
                            <div className="flex items-center justify-between mb-4">
                                <span className="font-semibold">Drafts</span>
                            </div>
                            <div className="space-y-3">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="p-3 bg-secondary/20 rounded-lg border border-border/50">
                                        <div className="h-2 w-3/4 bg-muted-foreground/20 rounded-full mb-2" />
                                        <div className="h-2 w-1/2 bg-muted-foreground/20 rounded-full mb-3" />
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] text-muted-foreground">Draft • 2d ago</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};
