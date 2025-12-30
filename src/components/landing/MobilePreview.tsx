import { Mic, PenSquare, Sparkles, Wifi } from "lucide-react";

export const MobilePreview = () => {
    return (
        <div className="relative w-[280px] h-[580px] bg-background rounded-[3rem] border-[8px] border-slate-900 shadow-2xl overflow-hidden backdrop-blur-xl">
            {/* Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-2xl z-20"></div>

            {/* Status Bar Mock */}
            <div className="flex justify-between items-center px-6 pt-3 pb-2 text-[10px] font-medium text-muted-foreground">
                <span>9:41</span>
                <div className="flex gap-1.5">
                    <Wifi className="w-3 h-3" />
                    <div className="w-4 h-2.5 bg-foreground rounded-[2px]" />
                </div>
            </div>

            {/* App Content */}
            <div className="p-4 flex flex-col h-full bg-gradient-to-b from-background to-secondary/10">
                {/* Header */}
                <div className="flex items-center justify-between mb-6 pt-2">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-bold text-lg">Authrax</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-accent border border-white/20" />
                </div>

                {/* Main Action Card */}
                <div className="bg-gradient-primary rounded-2xl p-5 text-white mb-6 shadow-lg shadow-primary/25 relative overflow-hidden group">
                    <div className="relative z-10">
                        <h3 className="font-bold text-xl mb-1">New Post</h3>
                        <p className="text-white/80 text-xs mb-4">What's on your mind?</p>
                        <div className="flex gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors">
                                <Mic className="w-5 h-5" />
                            </div>
                            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors">
                                <PenSquare className="w-5 h-5" />
                            </div>
                        </div>
                    </div>
                    <Sparkles className="absolute -bottom-4 -right-4 w-24 h-24 text-white/10 rotate-12" />
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-card border border-border/50 p-3 rounded-xl">
                        <p className="text-[10px] text-muted-foreground uppercase mb-1">Views</p>
                        <p className="text-lg font-bold">12.5k</p>
                        <p className="text-[10px] text-green-500">+12%</p>
                    </div>
                    <div className="bg-card border border-border/50 p-3 rounded-xl">
                        <p className="text-[10px] text-muted-foreground uppercase mb-1">Scheduled</p>
                        <p className="text-lg font-bold">4</p>
                        <p className="text-[10px] text-muted-foreground">Next: 2pm</p>
                    </div>
                </div>

                {/* Recent Drafts */}
                <div className="flex-1">
                    <h4 className="font-semibold text-sm mb-3">Recent Drafts</h4>
                    <div className="space-y-3">
                        <div className="p-3 bg-secondary/30 rounded-xl border border-border/40">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                                <span className="text-[10px] text-muted-foreground">Draft • Just now</span>
                            </div>
                            <div className="h-1.5 w-3/4 bg-muted-foreground/20 rounded-full mb-2" />
                            <div className="h-1.5 w-1/2 bg-muted-foreground/20 rounded-full" />
                        </div>
                        <div className="p-3 bg-secondary/30 rounded-xl border border-border/40">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                <span className="text-[10px] text-muted-foreground">Ready • 2h ago</span>
                            </div>
                            <div className="h-1.5 w-5/6 bg-muted-foreground/20 rounded-full mb-2" />
                            <div className="h-1.5 w-2/3 bg-muted-foreground/20 rounded-full" />
                        </div>
                    </div>
                </div>

                {/* Bottom Nav Mock */}
                <div className="bg-card/80 backdrop-blur-md p-2 rounded-2xl flex justify-around items-center border border-border/30 mt-auto mb-2">
                    <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center text-primary">
                        <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="w-8 h-8 flex items-center justify-center text-muted-foreground">
                        <div className="w-5 h-5 rounded bg-muted-foreground/20" />
                    </div>
                    <div className="w-8 h-8 flex items-center justify-center text-muted-foreground">
                        <div className="w-5 h-5 rounded bg-muted-foreground/20" />
                    </div>
                </div>
            </div>
        </div>
    );
};
