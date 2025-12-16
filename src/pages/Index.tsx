import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, ArrowRight, Check, Linkedin, Shield, Smartphone, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export default function Index() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });
  }, [navigate]);

  const features = [
    {
      icon: Sparkles,
      title: "AI That Sounds Like You",
      description: "Train on your posts to match your authentic voice",
    },
    {
      icon: Shield,
      title: "LinkedIn Safe",
      description: "Official APIs only. Zero account risk.",
    },
    {
      icon: Smartphone,
      title: "Mobile-First",
      description: "Create content anywhere, even offline",
    },
    {
      icon: Zap,
      title: "One-Tap Workflow",
      description: "Generate → Edit → Schedule in seconds",
    },
  ];

  return (
    <div className="min-h-screen bg-background dark">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="absolute inset-0 bg-noise opacity-[0.02]" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-accent/15 rounded-full blur-[80px]" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 py-20 md:py-32">
          {/* Nav */}
          <nav className="flex items-center justify-between mb-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">Authrax</span>
            </div>
            <Button variant="outline" onClick={() => navigate("/auth")}>
              Sign In
            </Button>
          </nav>

          {/* Hero Content */}
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
              <Linkedin className="w-4 h-4" />
              LinkedIn Personal Branding Platform
            </div>

            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              Your authentic voice,{" "}
              <span className="text-gradient-primary">amplified by AI</span>
            </h1>

            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Create LinkedIn content that sounds like you. No robotic AI, no account risks. 
              Mobile-first, works offline, and 100% LinkedIn compliant.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Button
                variant="gradient"
                size="xl"
                onClick={() => navigate("/auth")}
                className="w-full sm:w-auto"
              >
                Start Free
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                size="xl"
                className="w-full sm:w-auto"
              >
                Watch Demo
              </Button>
            </div>

            {/* Social Proof */}
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-success" />
                Free tier available
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-success" />
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-success" />
                LinkedIn ToS safe
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="py-20 px-4 bg-card/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground text-center mb-4">
            Built Different
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Unlike generic tools, Authrax learns YOUR voice and keeps your account safe
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="p-6 rounded-2xl bg-card border border-border hover:border-primary/50 hover:shadow-glow transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Ready to build your personal brand?
          </h2>
          <p className="text-muted-foreground mb-8">
            Join thousands of professionals using Authrax to grow their LinkedIn presence
          </p>
          <Button
            variant="gradient"
            size="xl"
            onClick={() => navigate("/auth")}
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">Authrax</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 Authrax. Built for LinkedIn creators.
          </p>
        </div>
      </footer>
    </div>
  );
}
