
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

export default function Privacy() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background flex flex-col relative overflow-hidden text-foreground">
            {/* Navbar (Minimal) */}
            <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/10 bg-background/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
                        <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow overflow-hidden">
                            <img src={logo} alt="Authrax Logo" className="w-full h-full object-cover" />
                        </div>
                        <span className="text-xl font-bold text-foreground">Authrax</span>
                    </div>

                    <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
                    </Button>
                </div>
            </nav>

            <main className="flex-1 max-w-4xl mx-auto px-6 py-32 animate-fade-in">
                <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>

                <div className="prose prose-invert max-w-none space-y-8 text-muted-foreground">
                    <p>
                        <strong>Effective date:</strong> 15 December 2025<br />
                        <strong>Last updated:</strong> 15 December 2025
                    </p>

                    <p>
                        Authrax (“Authrax”, “we”, “us”, “our”) respects your privacy and is committed to protecting personal information.
                    </p>
                    <p>
                        This Privacy Policy applies to the Authrax website, web application, and mobile applications (collectively, the “Services”).
                    </p>
                    <p>
                        By accessing or using Authrax, you acknowledge that you have read and understood this Privacy Policy and consent to the collection, use, and disclosure of your information as described below.
                    </p>

                    <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">1. Regulatory Context</h2>
                    <p>Authrax is designed for a global audience and follows privacy practices consistent with:</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Australian Privacy Act 1988 (Cth)</li>
                        <li>EU General Data Protection Regulation (GDPR)</li>
                        <li>California Consumer Privacy Act (CCPA), where applicable</li>
                        <li>Apple App Store and Google Play data protection requirements</li>
                    </ul>
                    <p>Where local law provides additional rights, those rights apply.</p>

                    <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">2. Information We Collect</h2>

                    <h3 className="text-xl font-medium text-foreground mt-6 mb-2">Personal Information You Provide</h3>
                    <p>We may collect:</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Name</li>
                        <li>Email address</li>
                        <li>LinkedIn profile URL</li>
                        <li>Writing samples, notes, or other content you submit</li>
                        <li>Communications you send to us</li>
                    </ul>

                    <h3 className="text-xl font-medium text-foreground mt-6 mb-2">Automatically Collected Information</h3>
                    <p>We may collect:</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Device type, operating system, and browser type</li>
                        <li>IP address and general location data</li>
                        <li>App usage and interaction data</li>
                        <li>Crash logs and performance data</li>
                    </ul>

                    <h3 className="text-xl font-medium text-foreground mt-6 mb-2">Authentication Information</h3>
                    <p>If you sign in using Apple, Google, or LinkedIn, we receive limited account information provided by those services. We do not receive or store your passwords.</p>

                    <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">3. How We Use Your Information</h2>
                    <p>We use personal information to:</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Provide, operate, and improve Authrax</li>
                        <li>Personalise your experience and outputs</li>
                        <li>Enable authentication and account access</li>
                        <li>Communicate service-related messages</li>
                        <li>Monitor performance and stability</li>
                        <li>Comply with legal obligations</li>
                    </ul>
                    <p>We do not sell personal information.</p>

                    <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">4. App Store and Platform Disclosures</h2>
                    <p>In accordance with Apple App Store and Google Play requirements:</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Authrax collects personal data only to support core app functionality</li>
                        <li>Data is not used for third-party advertising</li>
                        <li>Data is not sold to data brokers</li>
                        <li>Data is used for app functionality, personalisation, analytics, and security</li>
                        <li>You may request deletion of your data at any time</li>
                    </ul>
                    <p>When required, we provide accurate disclosures in app store listings regarding data collected, data usage, and data retention.</p>

                    <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">5. Legal Bases for Processing</h2>
                    <p>Depending on your location, we process data based on:</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Your consent</li>
                        <li>Performance of a contract (providing the Services)</li>
                        <li>Legitimate interests (improving product quality and safety)</li>
                        <li>Legal compliance</li>
                    </ul>

                    <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">6. Sharing of Information</h2>
                    <p>We may share information with:</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Cloud hosting and infrastructure providers</li>
                        <li>Analytics and monitoring services</li>
                        <li>Authentication providers</li>
                        <li>Legal authorities where required by law</li>
                    </ul>
                    <p>All service providers are bound by confidentiality and data protection obligations.</p>

                    <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">7. Data Storage and International Transfers</h2>
                    <p>Data may be stored and processed in Australia and other jurisdictions where our service providers operate.</p>
                    <p>By using Authrax, you consent to the transfer of your data across borders where required to operate the Services.</p>

                    <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">8. Data Security</h2>
                    <p>We use reasonable administrative, technical, and organisational safeguards to protect your data. No system is completely secure, and you should avoid submitting highly sensitive information.</p>

                    <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">9. Data Retention</h2>
                    <p>We retain personal information only for as long as necessary to provide the Services or meet legal requirements.</p>
                    <p>You may request deletion of your account and associated data at any time.</p>

                    <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">10. User Rights</h2>
                    <p>Depending on your jurisdiction, you may have the right to:</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Access your personal information</li>
                        <li>Correct inaccurate data</li>
                        <li>Request deletion</li>
                        <li>Restrict or object to processing</li>
                        <li>Request data portability</li>
                    </ul>
                    <p>Requests can be made using the contact details below.</p>

                    <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">11. Children’s Privacy</h2>
                    <p>Authrax is not intended for users under 16 years of age. We do not knowingly collect personal information from children.</p>

                    <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">12. Changes to This Policy</h2>
                    <p>We may update this Privacy Policy from time to time. Continued use of the Services after changes take effect constitutes acceptance of the updated policy.</p>

                    <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">13. Contact Information</h2>
                    <p>For privacy-related questions or requests:</p>
                    <p>Email: <a href="mailto:support@authrax.com" className="text-primary hover:underline">support@authrax.com</a></p>
                </div>
            </main>

            {/* Footer (Minimal) */}
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
