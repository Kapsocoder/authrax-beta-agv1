
import { PenTool, MessageSquare, Mic, Shield } from "lucide-react";

export const Capabilities = () => {
    const capabilities = [
        {
            icon: <PenTool className="w-6 h-6" />,
            title: "Capture your thinking",
            description: "Turn rough notes and half-formed ideas into structured thoughts."
        },
        {
            icon: <MessageSquare className="w-6 h-6" />,
            title: "Shape clear narratives",
            description: "See your ideas transformed into clear, professional narratives."
        },
        {
            icon: <Mic className="w-6 h-6" />,
            title: "Develop a consistent voice",
            description: "Train an AI that authentically reflects your judgment and style."
        },
        {
            icon: <Shield className="w-6 h-6" />,
            title: "Stay in control",
            description: "You decide what gets published and how. No autopilot."
        }
    ];

    return (
        <section className="py-24 bg-card/30 relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">What you can do with Authrax</h2>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Powerful tools for professional expression.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    {capabilities.map((cap, index) => (
                        <div key={index} className="p-8 rounded-2xl bg-background border border-border/50 hover:border-primary/50 transition-colors duration-300 shadow-sm">
                            <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-6">
                                {cap.icon}
                            </div>
                            <h3 className="text-xl font-bold mb-3">{cap.title}</h3>
                            <p className="text-muted-foreground text-lg leading-relaxed">
                                {cap.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
