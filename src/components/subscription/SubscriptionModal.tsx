import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Loader2, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { functions } from "@/firebaseConfig";
import { httpsCallable } from "firebase/functions";

interface SubscriptionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentUsage: number;
}

export function SubscriptionModal({ open, onOpenChange, currentUsage }: SubscriptionModalProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleUpgrade = async () => {
        setIsLoading(true);
        try {
            const createCheckoutSession = httpsCallable(functions, 'createStripeCheckoutSession');
            const { data } = await createCheckoutSession({
                plan: 'pro',
                origin: window.location.origin
            }) as { data: { url: string } };
            if (data.url) {
                window.location.href = data.url;
            }
        } catch (error: any) {
            console.error(error);
            toast.error("Failed to start checkout process. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader className="text-center pb-6">
                    <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <Zap className="w-6 h-6 text-primary" />
                    </div>
                    <DialogTitle className="text-2xl font-bold">Start Your Free Trial</DialogTitle>
                    <DialogDescription className="text-lg mt-2">
                        You've reached your weekly limit. <br />
                        Try Authrax Pro free for 10 days to unlock unlimited power.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid md:grid-cols-2 gap-6 py-4">
                    {/* Free Plan */}
                    <div className="p-6 rounded-xl border border-border bg-card/50 opacity-70">
                        <h3 className="font-bold text-xl mb-2">Free</h3>
                        <div className="text-3xl font-bold mb-4">$0 <span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                        <ul className="space-y-3 mb-6">
                            <li className="flex items-center gap-2 text-sm">
                                <Check className="w-4 h-4 text-primary" />
                                <span>1 AI Post / Week</span>
                            </li>
                            <li className="flex items-center gap-2 text-sm">
                                <Check className="w-4 h-4 text-primary" />
                                <span>No Scheduling</span>
                            </li>
                            <li className="flex items-center gap-2 text-sm">
                                <Check className="w-4 h-4 text-primary" />
                                <span>Standard analytics</span>
                            </li>
                        </ul>
                        <div className="w-full py-2 px-4 bg-secondary/50 rounded-lg text-center text-sm font-medium">
                            Current Plan ({currentUsage}/1 used)
                        </div>
                    </div>

                    {/* Pro Plan */}
                    <div className="p-6 rounded-xl border-2 border-primary bg-card relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
                            RECOMMENDED
                        </div>
                        <h3 className="font-bold text-xl mb-2">Pro</h3>
                        <div className="text-3xl font-bold mb-1">$19.90 <span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                        <p className="text-xs text-primary font-medium mb-4">10 Days Free • Cancel Anytime</p>
                        <ul className="space-y-3 mb-6">
                            <li className="flex items-center gap-2 text-sm">
                                <Check className="w-4 h-4 text-primary" />
                                <span>Unlimited AI Posts</span>
                            </li>
                            <li className="flex items-center gap-2 text-sm">
                                <Check className="w-4 h-4 text-primary" />
                                <span>Unlimited Scheduling</span>
                            </li>
                            <li className="flex items-center gap-2 text-sm">
                                <Check className="w-4 h-4 text-primary" />
                                <span>Advanced Voice Cloning</span>
                            </li>
                            <li className="flex items-center gap-2 text-sm">
                                <Check className="w-4 h-4 text-primary" />
                                <span>Priority Support</span>
                            </li>
                        </ul>
                        <Button
                            className="w-full"
                            onClick={handleUpgrade}
                            disabled={isLoading}
                            variant="gradient"
                        >
                            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Start 10-Day Free Trial
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
