import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { toast } from "sonner";
import { Bug, Loader2 } from "lucide-react";

export function BugReportDialog() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [steps, setSteps] = useState("");
    const [severity, setSeverity] = useState("normal");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        try {
            await addDoc(collection(db, "bug_reports"), {
                user_id: user.uid,
                email: user.email,
                title,
                description,
                steps,
                severity,
                status: "new",
                created_at: new Date().toISOString(),
            });

            toast.success("Bug report submitted. Thank you!");
            setOpen(false);
            setTitle("");
            setDescription("");
            setSteps("");
            setSeverity("normal");
        } catch (error: any) {
            toast.error("Failed to submit report: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-secondary/50 transition-colors flex items-center justify-between group">
                    <span className="text-foreground">Report a Bug</span>
                    <Bug className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Report a Bug</DialogTitle>
                    <DialogDescription>
                        Found something broken? Let us know so we can fix it.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Issue Title</Label>
                        <Input
                            id="title"
                            placeholder="Brief summary of the issue"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="severity">Severity</Label>
                            <Select value={severity} onValueChange={setSeverity}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select severity" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Low - Minor annoyance</SelectItem>
                                    <SelectItem value="normal">Normal - Standard issue</SelectItem>
                                    <SelectItem value="high">High - Feature broken</SelectItem>
                                    <SelectItem value="critical">Critical - App unusable</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="What happened?"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="steps">Steps to Reproduce</Label>
                        <Textarea
                            id="steps"
                            placeholder="1. Go to page...&#10;2. Click on..."
                            value={steps}
                            onChange={(e) => setSteps(e.target.value)}
                            className="min-h-[100px]"
                        />
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Submit Report
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
