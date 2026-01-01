import { useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Why() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background dark flex flex-col relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />

            {/* Navbar (Minimal) */}
            <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/10 bg-background/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
                        <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow">
                            <Sparkles className="w-4 h-4 text-primary-foreground" />
                        </div>
                        <span className="text-xl font-bold text-foreground">Authrax</span>
                    </div>

                    <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
                    </Button>
                </div>
            </nav>

            <main className="flex-1 flex items-center justify-center px-4 py-32 z-10">
                <div className="max-w-2xl mx-auto text-center space-y-12 animate-fade-in">

                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
                        Why Authrax Exists
                    </h1>

                    <div className="space-y-8 text-xl md:text-2xl text-muted-foreground leading-relaxed font-light">
                        <p>
                            Most AI writing tools optimise for output.
                        </p>

                        <p>
                            That works — until professionals realise something subtle has been lost:<br />
                            <span className="text-foreground font-medium">judgment, restraint, and a recognisable voice.</span>
                        </p>

                        <p>
                            Authrax was built to solve that problem.
                        </p>

                        <p>
                            We believe professionals shouldn’t have to choose between consistency and authenticity — or between visibility and credibility in their work.
                        </p>

                        <p>
                            So we built a system that learns how people think, not just how they write.
                        </p>

                        <p>
                            LinkedIn is simply the first place this matters today.
                        </p>

                        <p className="pt-8 text-foreground font-medium italic">
                            That’s it. No unnecessary vision sprawl.
                        </p>
                    </div>

                    <div className="pt-12">
                        <Button size="xl" onClick={() => navigate("/auth")} className="text-lg px-8 py-6 h-auto">
                            Start Your Free Trial
                        </Button>
                    </div>

                </div>
            </main>

            {/* Footer (Minimal) */}
            <footer className="py-8 bg-background border-t border-border/10 text-center text-sm text-muted-foreground">
                <p>© 2025 Authrax. Built for credibility-first professionals.</p>
            </footer>
        </div>
    );
}
