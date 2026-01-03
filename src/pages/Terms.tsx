
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

export default function Terms() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background dark flex flex-col relative overflow-hidden text-foreground">
            {/* Navbar (Minimal) */}
            <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/10 bg-background/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-glow overflow-hidden">
                            <img src={logo} alt="Authrax Logo" className="w-full h-full object-cover p-0.5" />
                        </div>
                        <span className="text-xl font-bold text-foreground">Authrax</span>
                    </div>

                    <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
                    </Button>
                </div>
            </nav>

            <main className="flex-1 max-w-4xl mx-auto px-6 py-32 animate-fade-in">
                <h1 className="text-4xl font-bold mb-8">Terms of Use</h1>

                <div className="prose prose-invert max-w-none space-y-8 text-muted-foreground">
                    <p>
                        <strong>Effective date:</strong> 15 December 2025<br />
                        <strong>Last updated:</strong> 15 December 2025
                    </p>

                    <p>
                        By accessing or using Authrax, you confirm that you have read, understood, and agree to be bound by these Terms of Use and the Privacy Policy.
                    </p>
                    <p>
                        If you do not agree, do not use the Services.
                    </p>

                    <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">1. Consent and Acceptance</h2>
                    <p>By creating an account, signing in, or using Authrax, you consent to:</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>the collection and use of information as described in the Privacy Policy</li>
                        <li>these Terms of Use</li>
                        <li>any additional policies referenced within the Services</li>
                    </ul>

                    <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">2. Purpose of the Service</h2>
                    <p>Authrax is a professional writing and thinking support tool. It assists with drafting and structuring content but does not replace professional judgment.</p>
                    <p>You are responsible for reviewing and approving all content before publishing.</p>

                    <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">3. Beta Status</h2>
                    <p>Authrax may be offered in beta or limited-access form. Features and availability may change without notice.</p>

                    <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">4. Accounts and Access</h2>
                    <p>Access may be limited or revoked at any time. You are responsible for maintaining the confidentiality of your login credentials.</p>

                    <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">5. Intellectual Property</h2>
                    <p>Authrax owns the platform, software, and underlying technology. You retain ownership of your content and ideas.</p>

                    <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">6. User Conduct</h2>
                    <p>You agree not to misuse the Services, including for unlawful, deceptive, or harmful purposes.</p>

                    <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">7. Third-Party Platforms</h2>
                    <p>Authrax may integrate with third-party platforms. Your use of those platforms is governed by their respective terms and policies.</p>

                    <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">8. Limitation of Liability</h2>
                    <p>To the maximum extent permitted by law, Authrax is not liable for indirect or consequential losses arising from your use of the Services.</p>
                    <p>Nothing in these Terms limits rights that cannot be excluded under applicable law.</p>

                    <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">9. Contact</h2>
                    <p>For questions regarding these Terms:</p>
                    <p>Email: <a href="mailto:legal@authrax.com" className="text-primary hover:underline">legal@authrax.com</a></p>
                </div>
            </main>

            {/* Footer */}
            <footer className="py-8 bg-background border-t border-border/10 text-center text-sm text-muted-foreground flex flex-col gap-2">
                <p>© 2025 Authrax. Built for credibility-first professionals.</p>
                <div className="flex justify-center gap-4">
                    <a href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</a>
                    <a href="/terms" className="hover:text-foreground transition-colors">Terms of Use</a>
                </div>
            </footer>
        </div>
    );
}
