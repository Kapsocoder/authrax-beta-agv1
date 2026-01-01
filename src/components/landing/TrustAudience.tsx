import { useRef } from "react";
import { Shield, Lock, Database, CheckCircle2 } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const trustFeatures = [
    {
        icon: Shield,
        title: "LinkedIn-Safe",
        description: "Authrax uses only official LinkedIn APIs.",
    },
    {
        icon: Lock,
        title: "No Automation Risk",
        description: "No browser extensions. No behaviour that puts accounts at risk.",
    },
    {
        icon: Database,
        title: "Data Ownership",
        description: "Your Brand DNA remains yours — always.",
    },
];

const audienceBuiltFor = [
    "Founders building long-term authority",
    "Executives shaping industry conversations",
    "Advisors demonstrating judgment and experience"
];

export const TrustAudience = () => {
    const containerRef = useRef<HTMLElement>(null);
    const trustRef = useRef<HTMLDivElement>(null);
    const audienceRef = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        // ... (standard animations can be added later if needed, lightweight for now) ...
    }, { scope: containerRef });

    return (
        <section ref={containerRef} id="trust" className="py-24 bg-background border-t border-border/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Trust Section */}
                <div ref={trustRef} className="mb-32">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold mb-6">Built with Reputation in Mind.</h2>
                        <p className="text-xl text-muted-foreground">Your professional identity isn’t something to experiment with.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {trustFeatures.map((feat) => (
                            <div key={feat.title} className="p-8 rounded-2xl bg-card border border-border/50">
                                <feat.icon className="w-8 h-8 text-primary mb-4" />
                                <h3 className="text-lg font-bold mb-2">{feat.title}</h3>
                                <p className="text-muted-foreground">{feat.description}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Audience Section */}
                <div ref={audienceRef} className="bg-secondary/10 rounded-[3rem] p-12 lg:p-20 text-center">
                    <div className="max-w-2xl mx-auto mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold">Designed for professionals who take their voice seriously.</h2>
                    </div>

                    <div className="inline-block text-left">
                        <h3 className="text-lg font-semibold mb-6 text-foreground flex items-center justify-center gap-2">
                            <CheckCircle2 className="w-6 h-6 text-green-500" /> Built for:
                        </h3>
                        <ul className="space-y-4">
                            {audienceBuiltFor.map(item => (
                                <li key={item} className="text-muted-foreground text-lg flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-green-500/50 shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

            </div>
        </section>
    );
};
