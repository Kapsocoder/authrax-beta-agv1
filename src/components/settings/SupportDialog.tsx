import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { toast } from "sonner";
import { Loader2, Mail } from "lucide-react";

export function SupportDialog() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        try {
            await addDoc(collection(db, "support_requests"), {
                user_id: user.uid,
                email: user.email,
                subject,
                message,
                status: "open",
                created_at: new Date().toISOString(),
            });

            toast.success("Support request sent successfully");
            setOpen(false);
            setSubject("");
            setMessage("");
        } catch (error: any) {
            toast.error("Failed to send request: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-secondary/50 transition-colors flex items-center justify-between group">
                    <span className="text-foreground">Contact Support</span>
                    <Mail className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Contact Support</DialogTitle>
                    <DialogDescription>
                        Need help? Fill out the form below and our team will get back to you securely.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="subject">Subject</Label>
                        <Input
                            id="subject"
                            placeholder="How can we help?"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="message">Message</Label>
                        <Textarea
                            id="message"
                            placeholder="Describe your issue..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            required
                            className="min-h-[100px]"
                        />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Send Request
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
