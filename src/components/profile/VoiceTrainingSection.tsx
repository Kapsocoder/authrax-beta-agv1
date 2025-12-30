import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Sparkles, FileText, Loader2, CheckCircle2, ArrowRight, Eye, ChevronUp, ChevronDown, Plus, Trash2, Brain, X, Save, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useVoiceProfile } from "@/hooks/useVoiceProfile";
import { toast } from "sonner";
import { BrandDNAModal } from "./BrandDNAModal";

export interface VoiceTrainingSectionRef {
    expand: () => void;
}

export const VoiceTrainingSection = forwardRef<VoiceTrainingSectionRef>(function VoiceTrainingSection(_, ref) {
    const { voiceProfile, isLoading, analyzeVoice, updateVoiceProfile } = useVoiceProfile();
    const [currentPost, setCurrentPost] = useState("");
    const [savedPosts, setSavedPosts] = useState<string[]>([]);
    const [isExpanded, setIsExpanded] = useState(false);

    // Post Edit State
    const [selectedPostIndex, setSelectedPostIndex] = useState<number | null>(null);
    const [editedPostContent, setEditedPostContent] = useState("");

    // Brand DNA State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisStartTime, setAnalysisStartTime] = useState<number | null>(null);
    const [analysisStep, setAnalysisStep] = useState(0);

    const analysisSteps = [
        "Understanding tone...",
        "Analyzing sentence structure...",
        "Identifying formatting preferences...",
        "Extracting core beliefs...",
        "Finalizing Brand DNA..."
    ];

    // Helper to check if profile is truly trained/active
    const isProfileActive = voiceProfile?.is_trained || voiceProfile?.isActive;

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isAnalyzing) {
            setAnalysisStep(0);
            interval = setInterval(() => {
                setAnalysisStep((prev) => (prev + 1) % analysisSteps.length);
            }, 2000); // 2 seconds per step
        }
        return () => clearInterval(interval);
    }, [isAnalyzing]);

    // Monitor database changes to stop analysis
    useEffect(() => {
        // Only stop analyzing if:
        // 1. We are currently analyzing
        // 2. The profile is active (has data)
        // 3. The profile has been updated AFTER we started analysis
        if (isAnalyzing && isProfileActive && voiceProfile?.updated_at && analysisStartTime) {
            const updatedAtTime = new Date(voiceProfile.updated_at).getTime();
            if (updatedAtTime > analysisStartTime) {
                setIsAnalyzing(false);
                setAnalysisStartTime(null);
                toast.success("Brand DNA analysis complete!");
            }
        }
    }, [isProfileActive, voiceProfile?.updated_at, isAnalyzing, analysisStartTime]);

    // Expose expand method via ref
    useImperativeHandle(ref, () => ({
        expand: () => setIsExpanded(true),
    }));

    // Sync saved posts with voice profile when it loads
    useEffect(() => {
        if (voiceProfile?.draft_posts) {
            setSavedPosts(voiceProfile.draft_posts);
        }
    }, [voiceProfile?.draft_posts]);

    const handleSavePost = async () => {
        if (!currentPost.trim()) {
            toast.error("Please enter a post to save");
            return;
        }

        if (currentPost.trim().length < 50) {
            toast.error("Post should be at least 50 characters");
            return;
        }

        if (savedPosts.length >= 20) {
            toast.error("Maximum 20 posts allowed. Remove one to add more.");
            return;
        }

        const newPosts = [...savedPosts, currentPost.trim()];
        setSavedPosts(newPosts); // Optimistic update
        setCurrentPost("");

        try {
            await updateVoiceProfile.mutateAsync({ draft_posts: newPosts });
        } catch (error) {
            // Error toast handled in hook
        }
    };

    const handleRemovePost = async (index: number) => {
        const newPosts = savedPosts.filter((_, i) => i !== index);
        setSavedPosts(newPosts); // Optimistic update

        // Close modal if open for this index
        if (selectedPostIndex === index) {
            setSelectedPostIndex(null);
        }

        try {
            await updateVoiceProfile.mutateAsync({ draft_posts: newPosts });
        } catch (error) {
            // Error handled in hook
        }
    };

    const handlePostClick = (index: number) => {
        setSelectedPostIndex(index);
        setEditedPostContent(savedPosts[index]);
    };

    const handleUpdatePost = async () => {
        if (selectedPostIndex === null) return;

        if (!editedPostContent.trim()) {
            toast.error("Post content cannot be empty.");
            return;
        }

        if (editedPostContent.trim().length < 50) {
            toast.error("Post should be at least 50 characters");
            return;
        }

        const newPosts = [...savedPosts];
        newPosts[selectedPostIndex] = editedPostContent.trim();
        setSavedPosts(newPosts); // Optimistic
        setSelectedPostIndex(null); // Close modal

        try {
            await updateVoiceProfile.mutateAsync({ draft_posts: newPosts });
            toast.success("Post updated successfully");
        } catch (error) {
            // Error handled in hook
        }
    };

    const handleDeleteFromModal = () => {
        if (selectedPostIndex !== null) {
            handleRemovePost(selectedPostIndex);
            setSelectedPostIndex(null);
        }
    };

    const handleAnalyze = async () => {
        if (savedPosts.length < 5) {
            toast.error("Please save at least 5 posts to analyze your brand");
            return;
        }

        setIsAnalyzing(true);
        setAnalysisStartTime(Date.now());

        try {
            // Trigger the backend process
            await analyzeVoice.mutateAsync(savedPosts);
        } catch (error) {
            console.error("Analysis trigger failed", error);
            setIsAnalyzing(false);
            setAnalysisStartTime(null);
        }
    };

    // Check if posts have changed since last training
    // Compare current savedPosts (drafts) with the posts used for training (sample_posts)
    const hasUnsavedChanges = !voiceProfile?.sample_posts ||
        JSON.stringify(savedPosts) !== JSON.stringify(voiceProfile.sample_posts);

    // Can analyze if:
    // 1. Enough posts (>= 5)
    // 2. AND logic: (Has unsaved changes OR Profile is not active yet)
    // If profile is active but posts are same as trained, hasUnsavedChanges is false -> canAnalyze is false.
    // If profile is active and posts differ, hasUnsavedChanges is true -> canAnalyze is true.
    const canAnalyze = savedPosts.length >= 5 && (hasUnsavedChanges || !isProfileActive);

    // Score calculation
    let calculatedScore = 0;
    if (voiceProfile?.expression_layer || voiceProfile?.tone) calculatedScore += 25;
    if (voiceProfile?.belief_layer) calculatedScore += 25;
    if (voiceProfile?.judgement_layer) calculatedScore += 25;
    if (voiceProfile?.governance_layer) calculatedScore += 25;

    const voiceScore = calculatedScore;

    return (
        <Card className="bg-card border-border">
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-secondary/30 transition-colors rounded-t-lg">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
                                    <Sparkles className="w-5 h-5 text-primary-foreground" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        Train Your Brand
                                        {isProfileActive && (
                                            <CheckCircle2 className="w-4 h-4 text-success" />
                                        )}
                                    </CardTitle>
                                    <CardDescription>
                                        AI learns to write in your unique style
                                    </CardDescription>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="text-right hidden sm:block">
                                    <span className="text-2xl font-bold text-gradient-primary">{voiceScore}%</span>
                                    <p className="text-xs text-muted-foreground">Brand DNA Score</p>
                                </div>
                                {isExpanded ? (
                                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                                ) : (
                                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                                )}
                            </div>
                        </div>
                        <Progress value={voiceScore} className="h-1.5 mt-3" />
                    </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                    <CardContent className="pt-0 space-y-6">
                        {/* Add New Post */}
                        <div className="p-4 rounded-xl bg-secondary/30 border border-border">
                            <div className="flex items-center gap-2 mb-3">
                                <FileText className="w-5 h-5 text-primary" />
                                <h4 className="font-medium text-foreground">Paste Your Best Posts</h4>
                            </div>
                            <Textarea
                                placeholder="Paste a LinkedIn post here..."
                                value={currentPost}
                                onChange={(e) => setCurrentPost(e.target.value)}
                                className="min-h-[100px] mb-3 text-foreground"
                            />
                            <div className="flex items-center justify-between">
                                <p className="text-xs text-muted-foreground">
                                    {savedPosts.length}/20 posts saved • Min 50 characters each
                                </p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleSavePost}
                                    disabled={!currentPost.trim() || updateVoiceProfile.isPending}
                                    className="gap-2"
                                >
                                    {updateVoiceProfile.isPending && currentPost ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Plus className="w-4 h-4" />
                                    )}
                                    Save Post
                                </Button>
                            </div>
                        </div>

                        {/* Saved Posts Cards */}
                        {savedPosts.length > 0 && (
                            <div className="space-y-3">
                                <h4 className="font-medium text-foreground text-sm">
                                    Saved Posts ({savedPosts.length})
                                </h4>

                                <div className="grid gap-3 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                                    {savedPosts.map((post, index) => (
                                        <div
                                            key={index}
                                            onClick={() => handlePostClick(index)}
                                            className="p-4 rounded-lg bg-secondary/50 border border-border group hover:border-primary/30 transition-colors cursor-pointer"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
                                                            Post {index + 1}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {post.length} chars
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-foreground line-clamp-3">
                                                        {post}
                                                    </p>
                                                </div>
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground">
                                                    <Edit3 className="w-4 h-4" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <p className="text-xs text-muted-foreground text-center">
                                    Tip: Include 5-10 of your best posts for optimal brand training
                                </p>
                            </div>
                        )}

                        {/* Analyze Button */}
                        <div className="flex flex-col items-center gap-3">
                            <Button
                                variant={canAnalyze ? "gradient" : "secondary"}
                                size="lg"
                                onClick={handleAnalyze}
                                disabled={isAnalyzing || !canAnalyze}
                                className={`gap-2 px-8 min-w-[200px] transition-all duration-300 ${!canAnalyze ? 'opacity-70 grayscale' : ''}`}
                            >
                                {isAnalyzing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        {analysisSteps[analysisStep]}
                                    </>
                                ) : !canAnalyze && isProfileActive ? (
                                    <>
                                        <CheckCircle2 className="w-4 h-4" />
                                        Brand DNA Active
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4" />
                                        Analyse My Brand
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </Button>

                            {!isAnalyzing && isProfileActive && (
                                <Button variant="outline" size="lg" onClick={() => setIsModalOpen(true)} className="gap-2 text-primary hover:text-primary/80 min-w-[200px]">
                                    <Eye className="w-4 h-4" />
                                    View My Brand DNA
                                </Button>
                            )}
                        </div>

                    </CardContent>
                </CollapsibleContent>
            </Collapsible>

            <BrandDNAModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                voiceProfile={voiceProfile}
            />

            <Dialog open={selectedPostIndex !== null} onOpenChange={(open) => !open && setSelectedPostIndex(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Edit Post {selectedPostIndex !== null ? selectedPostIndex + 1 : ''}</DialogTitle>
                        <DialogDescription>
                            Make changes to your saved post or delete it properly.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <Textarea
                            value={editedPostContent}
                            onChange={(e) => setEditedPostContent(e.target.value)}
                            className="min-h-[200px] font-mono text-sm leading-relaxed"
                            placeholder="Post content..."
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <Button
                            variant="destructive"
                            onClick={handleDeleteFromModal}
                            disabled={updateVoiceProfile.isPending}
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Post
                        </Button>
                        <div className="flex gap-2">
                            <Button variant="ghost" onClick={() => setSelectedPostIndex(null)}>
                                Cancel
                            </Button>
                            <Button onClick={handleUpdatePost} disabled={updateVoiceProfile.isPending}>
                                {updateVoiceProfile.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Save Changes
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </Card>
    );
});
