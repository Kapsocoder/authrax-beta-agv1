import { useRef } from "react";
import { Fingerprint, AlignLeft, BrainCircuit, GitBranch } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const dnaFeatures = [
    {
        icon: AlignLeft,
        title: "Sentence Rhythm",
        description: "The natural cadence of how you write and speak.",
    },
    {
        icon: GitBranch,
        title: "Framing Defaults",
        description: "How you structure arguments, explain trade-offs, and land insights.",
    },
    {
        icon: BrainCircuit,
        title: "Intellectual Values",
        description: "What you consistently prioritise, emphasise, or avoid.",
    },
];

export const BrandDNA = () => {
    const containerRef = useRef<HTMLElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        if (contentRef.current) {
            gsap.from(contentRef.current.children, {
                scrollTrigger: {
                    trigger: contentRef.current,
                    start: "top 80%",
                },
                y: 50,
                opacity: 0,
                duration: 1,
                stagger: 0.2,
                ease: "power3.out"
            });
        }
    }, { scope: containerRef });

    return (
        <section ref={containerRef} className="py-24 bg-card/30 border-y border-border/50 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div ref={contentRef} className="flex flex-col lg:flex-row gap-16 items-center">

                    {/* Left: Headline context */}
                    <div className="lg:w-1/2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-semibold uppercase tracking-wider mb-6">
                            <Fingerprint className="w-3 h-3" />
                            <span>Key Differentiator</span>
                        </div>
                        <h2 className="text-4xl font-bold mb-6">Your Brand DNA.</h2>
                        <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                            Most tools imitate style. <span className="text-foreground font-medium">It captures intent — based on the patterns already present in your writing.</span>
                        </p>
                        <p className="text-lg text-muted-foreground leading-relaxed">
                            Your Brand DNA reflects the deep patterns behind your communication — not just the surface tone.
                            This isn’t prompt engineering. <br />
                            <span className="text-foreground font-bold mt-2 block">It’s identity preservation.</span>
                        </p>
                    </div>

                    {/* Right: The 3 Pillars */}
                    <div className="lg:w-1/2 space-y-6">
                        {dnaFeatures.map((feat) => (
                            <div key={feat.title} className="flex gap-4 items-start p-6 rounded-2xl bg-background border border-border/50 shadow-sm hover:border-primary/30 transition-colors">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                                    <feat.icon className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold mb-1">{feat.title}</h3>
                                    <p className="text-muted-foreground">{feat.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};
