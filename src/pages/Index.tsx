import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
// Components
import { Hero } from "@/components/landing/Hero";
import { SocialProof } from "@/components/landing/SocialProof";
import { Features } from "@/components/landing/Features";
import { BrandDNA } from "@/components/landing/BrandDNA";
// import { HowItWorks } from "@/components/landing/HowItWorks";
import { GettingStarted } from "@/components/landing/GettingStarted";
import { TrustAudience } from "@/components/landing/TrustAudience";
// import { Pricing } from "@/components/landing/Pricing";
import { Capabilities } from "@/components/landing/Capabilities";
import { FAQ } from "@/components/landing/FAQ";
import { Sparkles, ArrowRight, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

export default function Index() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-background dark">
      {/* Navbar - Kept here for global context or could move to layout */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/10 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-glow overflow-hidden">
              <img src={logo} alt="Authrax Logo" className="w-full h-full object-cover p-0.5" />
            </div>
            <span className="text-xl font-bold text-foreground">Authrax</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => navigate("/why")} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Why Authrax</button>
            <button onClick={() => scrollToSection("features")} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</button>
            <button onClick={() => scrollToSection("getting-started")} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Getting Started</button>
            {/* <button onClick={() => scrollToSection("pricing")} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Pricing</button> */}
          </div>

          <div className="hidden md:block">
            <Button variant="outline" size="sm" onClick={() => navigate("/auth")}>
              Sign In
            </Button>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-foreground p-2">
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 bg-background/95 backdrop-blur-md pt-24 px-6 md:hidden">
          <div className="flex flex-col gap-6 text-xl">
            <button onClick={() => navigate("/why")} className="text-left font-medium text-foreground py-2 border-b border-border/10">Why Authrax</button>
            <button onClick={() => { scrollToSection("features"); setIsMenuOpen(false); }} className="text-left font-medium text-foreground py-2 border-b border-border/10">Features</button>
            <button onClick={() => { scrollToSection("getting-started"); setIsMenuOpen(false); }} className="text-left font-medium text-foreground py-2 border-b border-border/10">Getting Started</button>
            {/* <button onClick={() => { scrollToSection("pricing"); setIsMenuOpen(false); }} className="text-left font-medium text-foreground py-2 border-b border-border/10">Pricing</button> */}
            <Button className="w-full mt-4" size="lg" onClick={() => navigate("/auth")}>
              Sign In
            </Button>
          </div>
        </div>
      )}

      <main>
        <Hero />
        <SocialProof />
        <div id="features">
          <Features />
        </div>
        <BrandDNA />
        <div id="getting-started">
          <GettingStarted />
        </div>
        <TrustAudience />
        <div id="capabilities">
          <Capabilities />
        </div>

        {/* Final CTA Section */}
        <section className="py-24 bg-background text-center px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Be Intentional About How You Show Up.</h2>
            <p className="text-xl text-muted-foreground mb-10 leading-relaxed">
              Your reputation is forming whether you post or not.
              <br />
              Authrax helps ensure it reflects your true standard.
            </p>
            <Button size="xl" onClick={() => navigate("/waitlist")} className="text-lg px-8 py-6 h-auto">
              Join Private Beta
            </Button>
          </div>
        </section>

        <FAQ />
      </main>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border bg-card/20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center overflow-hidden">
                <img src={logo} alt="Authrax Logo" className="w-full h-full object-cover p-0.5" />
              </div>
              <span className="font-semibold text-foreground text-lg">Authrax</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              Built for creators who value their time and authenticity. 100% Safe. 100% You.
            </p>
          </div>

          <div className="flex items-center gap-8 text-sm text-muted-foreground">
            <a href="/privacy" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Twitter</a>
            <a href="#" className="hover:text-foreground transition-colors">LinkedIn</a>
          </div>

          <p className="text-sm text-muted-foreground">
            © 2025 Authrax. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
