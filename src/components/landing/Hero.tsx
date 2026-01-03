import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Linkedin, PlayCircle } from "lucide-react";
import { DashboardPreview } from "@/components/landing/DashboardPreview";
import { MobilePreview } from "@/components/landing/MobilePreview";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import TextPlugin from "gsap/TextPlugin"; // Changed to default import

gsap.registerPlugin(useGSAP, TextPlugin);

export const Hero = () => {
    const navigate = useNavigate();
    const containerRef = useRef<HTMLDivElement>(null);
    const heroContentRef = useRef<HTMLDivElement>(null);
    const dashboardRef = useRef<HTMLDivElement>(null);
    const mobileRef = useRef<HTMLDivElement>(null);
    const bgGlowRef1 = useRef<HTMLDivElement>(null);
    const bgGlowRef2 = useRef<HTMLDivElement>(null);
    const textRevealRef = useRef<HTMLSpanElement>(null);

    useGSAP(() => {
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

        // Floating Background - Independent of main timeline
        gsap.to(bgGlowRef1.current, {
            x: "20%",
            y: "20%",
            duration: 8,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
        });
        gsap.to(bgGlowRef2.current, {
            x: "-20%",
            y: "-10%",
            duration: 10,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            delay: 1
        });

        // Main Entrance Sequence using .from() for safety
        // Only run if refs exist
        if (heroContentRef.current && dashboardRef.current && mobileRef.current) {
            tl.from(heroContentRef.current.children, {
                y: 30,
                opacity: 0,
                duration: 0.8,
                stagger: 0.1,
                clearProps: "all"
            })
                .from(dashboardRef.current, {
                    y: 100,
                    opacity: 0,
                    scale: 0.95,
                    rotationX: 10,
                    duration: 1.2,
                    ease: "elastic.out(1, 0.75)",
                    clearProps: "all"
                }, "-=0.4")
                .from(mobileRef.current, {
                    x: 50,
                    y: 50,
                    opacity: 0,
                    rotation: -5,
                    duration: 1,
                    ease: "power2.out",
                    clearProps: "all"
                }, "-=0.8");

            // Text Scramble Effect
            if (textRevealRef.current) {
                gsap.to(textRevealRef.current, {
                    duration: 1.5,
                    text: {
                        value: "Professional Reputation.",
                        delimiter: ""
                    },
                    ease: "none",
                    delay: 0.5 // Start slightly after initial reveal
                });
            }
        }

        // Parallax Effect
        const handleMouseMove = (e: MouseEvent) => {
            if (!dashboardRef.current || !mobileRef.current) return;

            const { clientX, clientY } = e;
            const x = (clientX / window.innerWidth - 0.5) * 20;
            const y = (clientY / window.innerHeight - 0.5) * 20;

            gsap.to(dashboardRef.current, {
                rotationY: x,
                rotationX: -y,
                duration: 1,
                ease: "power2.out",
                overwrite: "auto"
            });
            gsap.to(mobileRef.current, {
                x: x * 1.5,
                y: y * 1.5,
                duration: 1.2,
                ease: "power2.out",
                overwrite: "auto"
            });
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);

    }, { scope: containerRef });

    return (
        <div ref={containerRef} className="relative overflow-hidden pt-20 pb-16 md:pt-24 md:pb-24 perspective-1000">
            {/* Background Elements */}
            <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] pointer-events-none" />
            <div ref={bgGlowRef1} className="absolute top-20 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none opacity-30" />
            <div ref={bgGlowRef2} className="absolute bottom-20 right-1/4 w-80 h-80 bg-accent/15 rounded-full blur-[80px] pointer-events-none" />

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <div ref={heroContentRef}>
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8 backdrop-blur-sm">
                        <Linkedin className="w-4 h-4" />
                        <span>The Personal Brand Operating System</span>
                    </div>

                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight tracking-tight">
                        The Operating System for Your <br />
                        <span ref={textRevealRef} className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent min-h-[1.2em] inline-block">
                            {/* Professional Reputation. */}
                        </span>
                    </h1>

                    <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
                        Build a personal brand that reflects your real expertise.
                        Authrax learns how your thinking shows up in writing, so you can publish consistently — without compromising credibility.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
                        <Button
                            size="xl"
                            onClick={() => navigate("/waitlist")}
                            className="w-full sm:w-auto text-lg px-8 py-6 h-auto shadow-[0_0_30px_-10px_rgba(var(--primary),0.5)] hover:shadow-[0_0_50px_-10px_rgba(var(--primary),0.6)] transition-all duration-300 transform hover:scale-105"
                        >
                            Join Private Beta
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                        <Button
                            variant="outline"
                            size="xl"
                            onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                            className="w-full sm:w-auto text-lg px-8 py-6 h-auto backdrop-blur-sm bg-background/50 hover:bg-background/80 transform hover:scale-105 transition-all"
                        >
                            How Authrax Works
                        </Button>
                    </div>
                </div>

                {/* Product Hero Shot */}
                <div className="relative max-w-5xl mx-auto perspective-1000">
                    <div className="relative">
                        {/* Desktop View */}
                        <div ref={dashboardRef} className="rounded-xl bg-gradient-to-b from-border/50 to-border/10 p-2 backdrop-blur-xl border border-white/10 shadow-2xl relative z-10 transform-style-3d will-change-transform">
                            <div className="rounded-lg overflow-hidden bg-background aspect-auto md:aspect-[16/10] border border-border/50 relative group shadow-inner">
                                <DashboardPreview />
                            </div>
                        </div>

                        {/* Mobile View - Responsive Positioning */}
                        <div
                            ref={mobileRef}
                            className="relative mt-12 w-full flex justify-center md:w-auto md:block md:mx-0 md:absolute md:mt-0 md:-right-12 md:-bottom-20 z-20 will-change-transform origin-center md:origin-bottom-right"
                        >
                            <div className="transform hover:rotate-0 transition-transform duration-500">
                                <MobilePreview />
                            </div>
                        </div>
                    </div>

                    {/* Decorative glow behind the hero shot */}
                    <div className="absolute -inset-4 bg-primary/20 blur-3xl -z-10 rounded-[2rem] opacity-50" />
                </div>
            </div>
        </div>
    );
};
