import { useRef } from "react";
import { Sparkles, Shield, Smartphone, PenTool, BarChart3, Clock, ArrowRight } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const mainFeatures = [
    {
        icon: Shield,
        title: "Authenticity, without the overhead",
        description: "Authrax is not a content generator. It's a system for translating your judgment into clear, professional narratives.",
        color: "text-primary",
        bg: "bg-primary/10",
        border: "border-primary/20",
    },
    {
        icon: Sparkles,
        title: "Signal over noise",
        description: "It works with unfinished thoughts, rough notes, and real-world complexity — then shapes them into posts that sound like you on your best day.",
        color: "text-accent",
        bg: "bg-accent/10",
        border: "border-accent/20",
    },
    {
        icon: PenTool,
        title: "No templates. No gimmicks.",
        description: "We don't just mimic words; we capture your intent. No growth hacks or engagement farming—just your expertise, clear and amplified.",
        color: "text-sky-500",
        bg: "bg-sky-500/10",
        border: "border-sky-500/20",
    }
];

// Removed secondaryFeatures for now or we can use them for 'Trust & Safety' later
const secondaryFeatures: any[] = [];

export const Features = () => {
    const containerRef = useRef<HTMLElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);
    const mainGridRef = useRef<HTMLDivElement>(null);
    const secondaryGridRef = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        // Animate Header
        if (headerRef.current) {
            gsap.fromTo(headerRef.current,
                { y: 50, opacity: 0 },
                {
                    y: 0,
                    opacity: 1,
                    duration: 1,
                    ease: "power3.out",
                    scrollTrigger: {
                        trigger: headerRef.current,
                        start: "top 80%",
                    }
                }
            );
        }

        // Animate Main Grid Cards
        if (mainGridRef.current?.children) {
            gsap.fromTo(Array.from(mainGridRef.current.children),
                { y: 100, opacity: 0 },
                {
                    y: 0,
                    opacity: 1,
                    stagger: 0.2,
                    duration: 1,
                    ease: "power4.out",
                    scrollTrigger: {
                        trigger: mainGridRef.current,
                        start: "top 75%",
                    }
                }
            );
        }

        // Animate Secondary Grid Items
        if (secondaryGridRef.current?.children) {
            gsap.fromTo(Array.from(secondaryGridRef.current.children),
                { x: -30, opacity: 0 },
                {
                    x: 0,
                    opacity: 1,
                    stagger: 0.1,
                    duration: 0.8,
                    ease: "power2.out",
                    scrollTrigger: {
                        trigger: secondaryGridRef.current,
                        start: "top 85%",
                    }
                }
            );
        }

    }, { scope: containerRef });

    return (
        <section ref={containerRef} id="features" className="py-24 bg-background relative overflow-hidden">
            <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div ref={headerRef} className="text-center max-w-3xl mx-auto mb-20">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
                        Your expertise is valuable. <br />
                        <span className="text-primary">Sharing it shouldn’t feel risky.</span>
                    </h2>
                    <p className="text-xl text-muted-foreground leading-relaxed">
                        Generic AI sounds inauthentic. Ghostwriters dilute your voice. Writing from scratch takes time you don’t have.
                        <br />
                        <span className="text-foreground font-medium mt-2 block">Authrax exists to remove that trade-off.</span>
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

                {/* Secondary Features Grid - Hidden for now */}

            </div>
        </section >
    );
};
