import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);
const companies = ["Banking", "Real Estate", "Digital Marketing", "Healthcare", "Education", "Retail", "Media", "Entertainment"];

export const SocialProof = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const marqueeInnerRef = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        // Use xPercent for robust infinite scrolling regardless of content width
        gsap.to(marqueeInnerRef.current, {
            xPercent: -50,
            duration: 20,
            ease: "linear",
            repeat: -1,
        });
    }, { scope: containerRef });

    return (
        <section ref={containerRef} className="py-10 border-y border-white/5 bg-white/5 backdrop-blur-sm overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-8">
                <p className="text-sm font-medium text-muted-foreground tracking-widest uppercase">
                    Trusted by professionals across Industries and Sectors
                </p>
            </div>

            <div className="relative flex w-full overflow-hidden mask-gradient-x">
                {/* Mask for fading edges */}
                <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
                <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

                {/* Marquee Inner Container */}
                <div ref={marqueeInnerRef} className="flex gap-16 items-center whitespace-nowrap pl-4 w-max hover:[animation-play-state:paused]">
                    {/* Triple the list for seamless loop and safety on wide screens */}
                    {[...companies, ...companies, ...companies].map((company, i) => (
                        <div key={`${company}-${i}`} className="flex items-center justify-center opacity-60 grayscale transition-all duration-500 hover:grayscale-0 hover:opacity-100 cursor-default select-none">
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                                {company}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
