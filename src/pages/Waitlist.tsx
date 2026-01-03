
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import logo from "@/assets/logo.png";

export default function Waitlist() {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        linkedinUrl: "",
        interestReason: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await addDoc(collection(db, "waitlist_entries"), {
                ...formData,
                createdAt: serverTimestamp(),
                status: "pending",
            });
            setIsSuccess(true);
            toast.success("You've been added to the waitlist!");
        } catch (error: any) {
            console.error("Error submitting waitlist:", error);
            toast.error(error.message || "Something went wrong. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-background dark flex items-center justify-center p-4">
                <div className="w-full max-w-md text-center space-y-6 animate-in fade-in zoom-in duration-500">
                    <div className="w-20 h-20 rounded-full bg-green-500/10 text-green-500 mx-auto flex items-center justify-center">
                        <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h2 className="text-3xl font-bold text-foreground">You're on the list</h2>
                    <p className="text-muted-foreground text-lg">
                        Thanks — we'll be in touch soon regarding your beta access.
                    </p>
                    <Button
                        variant="outline"
                        onClick={() => navigate("/")}
                        className="mt-8"
                    >
                        Return Home
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background dark flex">
            {/* Left Panel - Branding (Same as Auth for consistency) */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-hero relative overflow-hidden">
                <div className="absolute inset-0 bg-noise opacity-[0.03]" />
                <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl" />

                <div className="relative z-10 flex flex-col justify-center px-16">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-glow overflow-hidden">
                            <img src={logo} alt="Authrax Logo" className="w-full h-full object-cover p-1" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold text-foreground">Authrax</h1>
                            <p className="text-muted-foreground">Private Beta</p>
                        </div>
                    </div>

                    <h2 className="text-3xl font-bold text-foreground mb-4 leading-tight">
                        Signal, Credibility, <br />
                        <span className="text-gradient-primary">and Control.</span>
                    </h2>

                    <p className="text-muted-foreground text-lg max-w-md">
                        Join a select group of professionals using AI to amplify their authentic voice, not replace it.
                    </p>
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
                        <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-glow overflow-hidden">
                            <img src={logo} alt="Authrax Logo" className="w-full h-full object-cover p-1" />
                        </div>
                        <h1 className="text-2xl font-bold text-foreground">Authrax</h1>
                    </div>

                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-foreground mb-2">
                            Request Access
                        </h2>
                        <p className="text-muted-foreground">
                            Secure your spot in the private beta.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Full Name</Label>
                            <Input
                                id="fullName"
                                placeholder="Jane Doe"
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="jane@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="linkedin">LinkedIn Profile URL</Label>
                            <Input
                                id="linkedin"
                                placeholder="https://linkedin.com/in/janedoe"
                                value={formData.linkedinUrl}
                                onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="reason">What prompted your interest?</Label>
                            <Textarea
                                id="reason"
                                placeholder="I want to build my personal brand..."
                                value={formData.interestReason}
                                onChange={(e) => setFormData({ ...formData, interestReason: e.target.value })}
                                className="resize-none"
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            variant="gradient"
                            size="lg"
                            className="w-full"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Submitting..." : "Join Waitlist"}
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <Button variant="link" className="text-muted-foreground" onClick={() => navigate("/")}>
                            Back to Home
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
