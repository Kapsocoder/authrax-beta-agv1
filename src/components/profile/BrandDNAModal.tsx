import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Brain, Sparkles, MessageSquare, AlignLeft, Smile, PenTool, Edit3,
    RotateCcw, Scale, ShieldBan, ThumbsUp, ThumbsDown, Quote, ListChecks
} from "lucide-react";
import { VoiceProfile, useVoiceProfile, isVoiceProfileReady } from "@/hooks/useVoiceProfile";
import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

interface BrandDNAModalProps {
    isOpen: boolean;
    onClose: () => void;
    voiceProfile: VoiceProfile | null | undefined;
}

export function BrandDNAModal({ isOpen, onClose, voiceProfile }: BrandDNAModalProps) {
    const { updateVoiceProfile } = useVoiceProfile();
    const [isEditingPrompt, setIsEditingPrompt] = useState(false);
    const [editedPrompt, setEditedPrompt] = useState("");

    useEffect(() => {
        if (isOpen && voiceProfile) {
            setEditedPrompt(voiceProfile.system_prompt || "");
        }
    }, [isOpen, voiceProfile]);

    const handleSavePrompt = async () => {
        if (!voiceProfile) return;
        try {
            await updateVoiceProfile.mutateAsync({ system_prompt: editedPrompt });
            setIsEditingPrompt(false);
            toast.success("System prompt updated successfully");
        } catch (error) {
            // Error handled by hook
        }
    };

    const handleResetPrompt = () => {
        if (voiceProfile) {
            setEditedPrompt(voiceProfile.system_prompt || "");
        }
    }

    // Debug logging for missing layers
    useEffect(() => {
        if (voiceProfile) {
            console.log("Brand DNA Modal - Active Profile Data:", voiceProfile);
            console.log("Has Expression:", !!voiceProfile.expression_layer);
            console.log("Has Belief:", !!voiceProfile.belief_layer);
            console.log("Has Judgement:", !!voiceProfile.judgement_layer);
            console.log("Has Governance:", !!voiceProfile.governance_layer);
        }
    }, [voiceProfile]);

    if (!voiceProfile) return null;

    // Expression Layer Data
    const toSentenceCase = (str: string | null | undefined) => {
        if (!str) return str;
        return str.charAt(0).toUpperCase() + str.slice(1);
    };

    // Expression Layer Data
    const traits = [
        {
            icon: <MessageSquare className="w-5 h-5 text-blue-500" />,
            label: "Tone",
            value: toSentenceCase(voiceProfile.expression_layer?.primary_tone
                ? `${voiceProfile.expression_layer.primary_tone}, ${voiceProfile.expression_layer.secondary_tone}`
                : (voiceProfile.tone || "Not analyzed")),
            bg: "bg-blue-500/10",
            border: "border-blue-500/20"
        },
        {
            icon: <AlignLeft className="w-5 h-5 text-purple-500" />,
            label: "Sentence Structure",
            value: toSentenceCase(voiceProfile.expression_layer?.sentence_style
                || voiceProfile.sentence_length
                || "Not analyzed"),
            bg: "bg-purple-500/10",
            border: "border-purple-500/20"
        },
        {
            icon: <Smile className="w-5 h-5 text-yellow-500" />,
            label: "Emoji Usage",
            value: toSentenceCase(voiceProfile.expression_layer?.emoji_policy
                || voiceProfile.emoji_usage
                || "Not analyzed"),
            bg: "bg-yellow-500/10",
            border: "border-yellow-500/20"
        },
        {
            icon: <PenTool className="w-5 h-5 text-green-500" />,
            label: "Writing Style",
            value: toSentenceCase((Array.isArray(voiceProfile.expression_layer?.formatting_habits)
                ? voiceProfile.expression_layer?.formatting_habits.join(", ")
                : voiceProfile.expression_layer?.formatting_habits)
                || voiceProfile.writing_style
                || "Not analyzed"),
            bg: "bg-green-500/10",
            border: "border-green-500/20"
        }
    ];

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-3xl h-[85vh] flex flex-col p-0 gap-0 overflow-hidden bg-background border-border">
                {/* Header with visual flair */}
                <div className="p-6 bg-gradient-to-r from-primary/10 via-background to-background border-b border-border flex-shrink-0">
                    <DialogHeader className="mb-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 mb-1">
                                <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-lg shadow-primary/20">
                                    <Brain className="w-6 h-6 text-primary-foreground" />
                                </div>
                                <div>
                                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                        Brand DNA Profile
                                        {isVoiceProfileReady(voiceProfile) && (
                                            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 gap-1 pl-1">
                                                <Sparkles className="w-3 h-3 fill-current" />
                                                Active
                                            </Badge>
                                        )}
                                    </DialogTitle>
                                    <DialogDescription className="text-muted-foreground">
                                        Comprehensive analysis of your brand's unique voice and style
                                    </DialogDescription>
                                </div>
                            </div>
                            {/* Version and Date */}
                            <div className="text-right hidden sm:block">
                                <Badge variant="secondary" className="mb-1 font-mono text-xs">
                                    {voiceProfile.version ? `v${voiceProfile.version}` : 'v1.0'}
                                </Badge>
                                <p className="text-xs text-muted-foreground">
                                    Created: {voiceProfile.created_at ? format(new Date(voiceProfile.created_at), 'MMM d, yyyy') : 'N/A'}
                                </p>
                            </div>
                        </div>
                    </DialogHeader>
                </div>

                <ScrollArea className="flex-1">
                    <div className="p-6 space-y-8">

                        {/* 1. Expression Layer (The How) */}
                        <section>
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                                <MessageSquare className="w-4 h-4" /> Expression Layer
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {traits.map((trait, i) => (
                                    <div key={i} className={`p-4 rounded-xl border ${trait.border} ${trait.bg} transition-all hover:bg-opacity-50`}>
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className={`p-2 rounded-lg bg-background/50 backdrop-blur-sm`}>
                                                {trait.icon}
                                            </div>
                                            <span className="font-semibold text-foreground/90">{trait.label}</span>
                                        </div>
                                        <p className="text-sm text-foreground/80 leading-relaxed pl-[3.25rem]">
                                            {trait.value}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <Separator />

                        {/* 2. Belief Layer (The Why) */}
                        {voiceProfile.belief_layer && (
                            <section>
                                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Scale className="w-4 h-4" /> Belief Layer
                                </h3>

                                {voiceProfile.belief_layer.moral_posture && (
                                    <div className="mb-4 p-4 rounded-xl border border-primary/20 bg-primary/5 flex gap-3">
                                        <Quote className="w-6 h-6 text-primary/60 flex-shrink-0" />
                                        <div>
                                            <h4 className="font-medium text-primary mb-1 text-sm">Moral Posture</h4>
                                            <p className="text-sm text-foreground/90 italic">"{voiceProfile.belief_layer.moral_posture}"</p>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-3">
                                    {voiceProfile.belief_layer.core_beliefs_list?.map((belief, i) => (
                                        <div key={i} className="p-4 rounded-lg bg-secondary/30 border border-border">
                                            <div className="flex items-start gap-3">
                                                <div className="p-1.5 rounded bg-primary/10 mt-1">
                                                    <Brain className="w-3 h-3 text-primary" />
                                                </div>
                                                <div>
                                                    <h4 className="font-medium text-foreground text-sm">{belief.trait}</h4>
                                                    <p className="text-xs text-muted-foreground mt-1">{belief.rationale}</p>
                                                    {belief.evidence && (
                                                        <div className="mt-2 text-xs italic text-muted-foreground/80 pl-2 border-l-2 border-primary/20">
                                                            "{belief.evidence}"
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {voiceProfile.belief_layer && <Separator />}

                        {/* 3. Judgement Layer (The What) */}
                        {voiceProfile.judgement_layer && (
                            <section>
                                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <ListChecks className="w-4 h-4" /> Judgement Layer
                                </h3>

                                <div className="grid md:grid-cols-2 gap-6">
                                    {/* Supports */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-green-600 dark:text-green-500">
                                            <ThumbsUp className="w-4 h-4" />
                                            <h4 className="font-medium text-sm">Champions & Supports</h4>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {voiceProfile.judgement_layer.supports?.length > 0 ? (
                                                voiceProfile.judgement_layer.supports.map((item, i) => (
                                                    <Badge key={i} variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
                                                        {item}
                                                    </Badge>
                                                ))
                                            ) : (<span className="text-xs text-muted-foreground">None defined</span>)}
                                        </div>
                                    </div>

                                    {/* Opposes */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-red-600 dark:text-red-500">
                                            <ThumbsDown className="w-4 h-4" />
                                            <h4 className="font-medium text-sm">Opposes & Dislikes</h4>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {voiceProfile.judgement_layer.opposes?.length > 0 ? (
                                                voiceProfile.judgement_layer.opposes.map((item, i) => (
                                                    <Badge key={i} variant="outline" className="bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20">
                                                        {item}
                                                    </Badge>
                                                ))
                                            ) : (<span className="text-xs text-muted-foreground">None defined</span>)}
                                        </div>
                                    </div>
                                </div>

                                {voiceProfile.judgement_layer.disliked_styles?.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-dashed border-border">
                                        <h4 className="text-xs font-medium text-muted-foreground mb-2">Avoided Styles:</h4>
                                        <p className="text-sm text-foreground/80">
                                            {voiceProfile.judgement_layer.disliked_styles.join(", ")}
                                        </p>
                                    </div>
                                )}
                            </section>
                        )}

                        {voiceProfile.judgement_layer && <Separator />}

                        {/* 4. Governance Layer (The Rules) */}
                        {voiceProfile.governance_layer && (
                            <section>
                                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <ShieldBan className="w-4 h-4" /> Governance Layer
                                </h3>

                                <div className="space-y-4">
                                    {/* Hard Constraints */}
                                    {voiceProfile.governance_layer.hard_constraints?.length > 0 && (
                                        <div className="p-4 rounded-lg bg-orange-500/5 border border-orange-500/20">
                                            <h4 className="text-sm font-semibold text-orange-700 dark:text-orange-400 mb-2">Hard Constraints</h4>
                                            <ul className="list-disc list-inside space-y-1 text-sm text-foreground/80">
                                                {voiceProfile.governance_layer.hard_constraints.map((constraint, i) => (
                                                    <li key={i}>{constraint}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Forbidden Zones */}
                                    {voiceProfile.governance_layer.forbidden_zones?.length > 0 && (
                                        <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/20">
                                            <h4 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-2">Forbidden Zones</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {voiceProfile.governance_layer.forbidden_zones.map((zone, i) => (
                                                    <Badge key={i} variant="secondary" className="bg-background border border-red-500/20 text-red-600 dark:text-red-400">
                                                        {zone}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}

                        {(voiceProfile.belief_layer || voiceProfile.judgement_layer || voiceProfile.governance_layer) && <Separator />}

                        {/* System Prompt Section */}
                        <section className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">System Prompt</h3>
                                    <p className="text-sm text-muted-foreground mt-1">The active instruction set used by AI to generate your content.</p>
                                </div>
                                {!isEditingPrompt && (
                                    <Button variant="outline" size="sm" onClick={() => setIsEditingPrompt(true)} className="gap-2">
                                        <Edit3 className="w-4 h-4" />
                                        Edit Prompt
                                    </Button>
                                )}
                            </div>

                            <div className="relative rounded-xl border border-border bg-secondary/20 overflow-hidden">
                                {isEditingPrompt ? (
                                    <div className="p-4 space-y-4 bg-background">
                                        <div className="flex items-center gap-2 mb-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-600 dark:text-yellow-400 text-xs">
                                            <Sparkles className="w-4 h-4 flex-shrink-0" />
                                            <p>Tip: Tweaking your system prompt significantly impacts how AI writes for you. Be specific.</p>
                                        </div>
                                        <Textarea
                                            value={editedPrompt}
                                            onChange={(e) => setEditedPrompt(e.target.value)}
                                            className="min-h-[200px] font-mono text-sm leading-relaxed resize-y focus-visible:ring-primary"
                                            placeholder="Enter your custom system prompt..."
                                        />
                                        <div className="flex justify-between items-center pt-2">
                                            <Button variant="ghost" size="sm" onClick={handleResetPrompt} title="Reset to original">
                                                <RotateCcw className="w-4 h-4 mr-2" /> Reset
                                            </Button>
                                            <div className="flex gap-2">
                                                <Button variant="ghost" onClick={() => { setIsEditingPrompt(false); handleResetPrompt(); }}>
                                                    Cancel
                                                </Button>
                                                <Button onClick={handleSavePrompt} disabled={updateVoiceProfile.isPending}>
                                                    {updateVoiceProfile.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                                    Save Changes
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4">
                                        <pre className="whitespace-pre-wrap font-mono text-sm text-foreground/90 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                            {voiceProfile.system_prompt || "No system prompt generated yet."}
                                        </pre>
                                        <div className="absolute top-2 right-2 opacity-10 pointer-events-none">
                                            <Brain className="w-24 h-24" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                </ScrollArea>

                <div className="p-4 border-t border-border bg-muted/20 flex justify-end">
                    <Button variant="secondary" onClick={onClose}>Close</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
