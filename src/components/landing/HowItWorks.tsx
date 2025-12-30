import { useRef } from "react";
import { Mic, PenSquare, Share2, ArrowRight } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const steps = [
    {
        icon: Mic,
        title: "Capture Your Voice",
        description: "Upload a voice note, paste a link, or just start typing. Our AI analyzes your unique style instantly.",
        color: "text-primary",
        bg: "bg-primary/20",
    },
    {
        icon: PenSquare,
        title: "AI Writes Like You",
        description: "Get 5+ viral-ready post variations in seconds. No robotic generic text—just your best self, magnified.",
        color: "text-accent",
        bg: "bg-accent/20",
    },
    {
        icon: Share2,
        title: "Schedule & Grow",
        description: "Post instantly or schedule for peak engagement times. Watch your LinkedIn presence compound daily.",
        color: "text-green-500",
        bg: "bg-green-500/20",
    }
];

export const HowItWorks = () => {
    const containerRef = useRef<HTMLElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);
    const stepsRef = useRef<HTMLDivElement>(null);

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

        gsap.from(stepsRef.current!.children, {
            scrollTrigger: {
                trigger: stepsRef.current,
                start: "top 70%",
            },
            y: 50,
            opacity: 0,
            stagger: 0.25,
            duration: 1,
            ease: "back.out(1.7)"
        });
    }, { scope: containerRef });

    return (
        <section ref={containerRef} id="how-it-works" className="py-24 bg-card/50 relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div ref={headerRef} className="text-center mb-20">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">From Idea to Viral <br /><span className="text-primary">in 3 Steps</span></h2>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Forget the 2-hour writing block. Here is how your new workflow looks.
                    </p>
                </div>

                <div ref={stepsRef} className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                    {/* Connecting Line (Desktop) */}
                    <div className="hidden md:block absolute top-[2.5rem] left-[16.666%] right-[16.666%] h-0.5 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 -z-10" />

                    {steps.map((step, index) => (
                        <div key={step.title} className="relative flex flex-col items-center text-center">
                            <div className={`w-20 h-20 rounded-2xl ${step.bg} flex items-center justify-center mb-8 shadow-glow transition-transform hover:scale-110 duration-300 relative bg-background border border-border`}>
                                <div className={`absolute inset-0 rounded-2xl ${step.bg} opacity-50 blur-lg -z-10`} />
                                <step.icon className={`w-8 h-8 ${step.color}`} />
                                <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center font-bold text-sm shadow-sm">
                                    {index + 1}
                                </div>
                            </div>

                            <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                {step.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
