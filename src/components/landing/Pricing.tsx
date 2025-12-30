import { useRef } from "react";
import { Check, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const tiers = [
    {
        name: "Starter",
        price: "$0",
        period: "forever",
        description: "Perfect for testing the waters.",
        features: ["5 AI Post Generations/mo", "Basic Voice Training", "Mobile App Access", "Preview & Edit"],
        cta: "Start Free",
        popular: false,
    },
    {
        name: "Pro",
        price: "$29",
        period: "/month",
        description: "For creators serious about growth.",
        features: ["Unlimited AI Generations", "Advanced Voice Cloning", "Viral Hook Scoring", "Smart Scheduling", "Analytics Dashboard"],
        cta: "Start 7-Day Trial",
        popular: true,
        highlight: "Most Popular",
    },
    {
        name: "Agency",
        price: "$99",
        period: "/month",
        description: "Manage multiple personal brands.",
        features: ["5 User Profiles", "Team Collaboration", "Priority Support", "Custom API Access", "White-label Reports"],
        cta: "Contact Sales",
        popular: false,
    },
];

export const Pricing = () => {
    const containerRef = useRef<HTMLElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);
    const cardsRef = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        gsap.from(headerRef.current, {
            scrollTrigger: {
                trigger: headerRef.current,
                start: "top 80%",
            },
            y: 30,
            opacity: 0,
            duration: 1,
            ease: "power3.out"
        });

        gsap.from(cardsRef.current!.children, {
            scrollTrigger: {
                trigger: cardsRef.current,
                start: "top 75%",
            },
            y: 50,
            opacity: 0,
            stagger: 0.15,
            duration: 1,
            ease: "power3.out"
        });
    }, { scope: containerRef });

    return (
        <section ref={containerRef} id="pricing" className="py-24 bg-background relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div ref={headerRef} className="text-center mb-20">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">Simple, Transparent <br /><span className="text-primary">Pricing</span></h2>
                    <p className="text-xl text-muted-foreground">
                        Stop paying for 5 different tools. Get everything you need in one.
                    </p>
                </div>

                <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    {tiers.map((tier) => (
                        <div
                            key={tier.name}
                            className={`relative rounded-3xl p-8 border ${tier.popular ? "border-primary shadow-glow bg-card" : "border-border bg-card/50"} flex flex-col h-full`}
                        >
                            {tier.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-sm font-bold rounded-full flex items-center gap-1 shadow-lg">
                                    <Sparkles className="w-3 h-3" /> {tier.highlight}
                                </div>
                            )}

                            <div className="mb-8">
                                <h3 className="text-lg font-medium text-muted-foreground mb-2">{tier.name}</h3>
                                <div className="flex items-baseline gap-1 mb-4">
                                    <span className="text-5xl font-bold tracking-tight">{tier.price}</span>
                                    <span className="text-muted-foreground">{tier.period}</span>
                                </div>
                                <p className="text-sm text-foreground/80">{tier.description}</p>
                            </div>

                            <div className="flex-1 space-y-4 mb-8">
                                {tier.features.map((feature) => (
                                    <div key={feature} className="flex items-center gap-3">
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${tier.popular ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"}`}>
                                            <Check className="w-3 h-3" />
                                        </div>
                                        <span className="text-sm">{feature}</span>
                                    </div>
                                ))}
                            </div>

                            <Button
                                variant={tier.popular ? "default" : "outline"}
                                className={`w-full py-6 text-base ${tier.popular ? "shadow-lg shadow-primary/20" : ""}`}
                            >
                                {tier.cta}
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
