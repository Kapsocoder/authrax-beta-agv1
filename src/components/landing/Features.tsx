import { useRef } from "react";
import { Sparkles, Shield, Smartphone, PenTool, BarChart3, Clock, ArrowRight } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const mainFeatures = [
    {
        icon: Sparkles,
        title: "AI Voice Cloning 2.0",
        description: "Stop sounding like default ChatGPT. Our AI analyzes your previous successful posts to learn your unique sentence structure, vocabulary, and tone. It's not just 'polite' or 'witty'—it's YOU.",
        color: "text-primary",
        bg: "bg-primary/10",
        border: "border-primary/20",
    },
    {
        icon: PenTool,
        title: "Viral Hook Optimization",
        description: "Your first line decides everything. Authrax scores your hooks in real-time against millions of viral posts, suggesting specific edits to stop the scroll and explode your engagement.",
        color: "text-accent",
        bg: "bg-accent/10",
        border: "border-accent/20",
    },
    {
        icon: Smartphone,
        title: "True Mobile-First Experience",
        description: "Inspiration strikes anywhere. Record voice notes, jot down ideas, or edit full drafts from our dedicated mobile interface. It works offline and syncs seamlessly when you're back.",
        color: "text-sky-500",
        bg: "bg-sky-500/10",
        border: "border-sky-500/20",
    }
];

const secondaryFeatures = [
    {
        icon: Shield,
        title: "100% LinkedIn Safe",
        description: "We strictly use official LinkedIn APIs. No sketchy chrome extensions, no automation risks, no bans."
    },
    {
        icon: Clock,
        title: "Smart Scheduling",
        description: "Auto-queue your posts for when your specific audience is most active online."
    },
    {
        icon: BarChart3,
        title: "Deep Analytics",
        description: "Track conversion, not just impressions. See which topics actually drive profile views."
    },
];

export const Features = () => {
    const containerRef = useRef<HTMLElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);
    const mainGridRef = useRef<HTMLDivElement>(null);
    const secondaryGridRef = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        // Animate Header
        gsap.from(headerRef.current, {
            scrollTrigger: {
                trigger: headerRef.current,
                start: "top 80%",
            },
            y: 50,
            opacity: 0,
            duration: 1,
            ease: "power3.out"
        });

        // Animate Main Grid Cards
        gsap.from(mainGridRef.current!.children, {
            scrollTrigger: {
                trigger: mainGridRef.current,
                start: "top 75%",
            },
            y: 100,
            opacity: 0,
            stagger: 0.2,
            duration: 1,
            ease: "power4.out"
        });

        // Animate Secondary Grid Items
        gsap.from(secondaryGridRef.current!.children, {
            scrollTrigger: {
                trigger: secondaryGridRef.current,
                start: "top 85%",
            },
            x: -30,
            opacity: 0,
            stagger: 0.1,
            duration: 0.8,
            ease: "power2.out"
        });

    }, { scope: containerRef });

    return (
        <section ref={containerRef} id="features" className="py-24 bg-background relative overflow-hidden">
            <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div ref={headerRef} className="text-center max-w-3xl mx-auto mb-20">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
                        Built for the modern <br />
                        <span className="text-primary">LinkedIn Creator</span>
                    </h2>
                    <p className="text-xl text-muted-foreground leading-relaxed">
                        We've packed everything you need to build a personal brand that drives revenue,
                        without spending hours every day fighting with blank pages.
                    </p>
                </div>

                {/* Main Feature Cards */}
                <div ref={mainGridRef} className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
                    {mainFeatures.map((feature) => (
                        <div
                            key={feature.title}
                            className={`p-8 rounded-[2rem] bg-card border ${feature.border} hover:shadow-2xl transition-all duration-300 group relative overflow-hidden h-full flex flex-col`}
                        >
                            <div className={`absolute top-0 right-0 p-32 ${feature.bg} blur-3xl rounded-full opacity-20 -mr-16 -mt-16 group-hover:opacity-40 transition-opacity`} />

                            <div className={`w-14 h-14 rounded-2xl ${feature.bg} flex items-center justify-center mb-6 border ${feature.border} group-hover:scale-110 transition-transform duration-300`}>
                                <feature.icon className={`w-7 h-7 ${feature.color}`} />
                            </div>

                            <h3 className="text-2xl font-bold mb-4 text-foreground">{feature.title}</h3>
                            <p className="text-muted-foreground leading-relaxed text-base flex-1">
                                {feature.description}
                            </p>

                            <div className="mt-8 pt-6 border-t border-border flex items-center text-sm font-medium text-foreground group-hover:text-primary transition-colors cursor-pointer">
                                Learn more <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Secondary Features Grid */}
                <div ref={secondaryGridRef} className="grid grid-cols-1 md:grid-cols-3 gap-8 p-10 bg-secondary/20 rounded-[2.5rem] border border-border/50">
                    {secondaryFeatures.map((feature) => (
                        <div
                            key={feature.title}
                            className="flex gap-4 items-start"
                        >
                            <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center border border-border shrink-0 shadow-sm group-hover:bg-primary/10 transition-colors">
                                <feature.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                            <div>
                                <h4 className="font-bold text-lg mb-1">{feature.title}</h4>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
