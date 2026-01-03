
import { CheckCircle2 } from "lucide-react";

export const GettingStarted = () => {
    const steps = [
        {
            title: "Join the waitlist",
            description: "Sign up for the private beta to secure your spot."
        },
        {
            title: "Selected users receive beta access",
            description: "We are onboarding users in small batches to ensure quality."
        },
        {
            title: "Review your Brand DNA",
            description: "Our AI analyzes your public writing to understand your voice."
        },
        {
            title: "Start Authraxing",
            description: "Create content that sounds like you, effortlessly."
        }
    ];

    return (
        <section className="py-24 bg-background relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">Getting Started with Authrax</h2>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Your journey to a scalable personal brand starts here.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
                    {steps.map((step, index) => (
                        <div key={index} className="flex flex-col items-center text-center group">
                            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                <span className="text-2xl font-bold text-primary">{index + 1}</span>
                            </div>
                            <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                            <p className="text-muted-foreground">{step.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
