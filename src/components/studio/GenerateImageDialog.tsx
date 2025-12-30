import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Sparkles, Loader2, Image as ImageIcon, Wand2, Monitor, Smartphone, Square } from "lucide-react";
import { functions } from "@/firebaseConfig";
import { httpsCallable } from "firebase/functions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface GenerateImageDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    postContent?: string;
    onGenerate: (url: string) => void;
}

export function GenerateImageDialog({
    open,
    onOpenChange,
    postContent,
    onGenerate
}: GenerateImageDialogProps) {
    const [prompt, setPrompt] = useState("");
    const [aspectRatio, setAspectRatio] = useState<"1:1" | "16:9" | "9:16">("1:1");
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSuggesting, setIsSuggesting] = useState(false);

    // Auto-suggest prompt when dialog opens if post content exists
    useEffect(() => {
        const suggestPrompt = async () => {
            if (open && postContent && !prompt) {
                setIsSuggesting(true);
                try {
                    const suggestImagePromptFn = httpsCallable(functions, 'suggestImagePrompt');
                    const result = await suggestImagePromptFn({ postContent });
                    // @ts-ignore
                    if (result.data?.prompt) {
                        // @ts-ignore
                        setPrompt(result.data.prompt);
                    }
                } catch (error) {
                    console.error("Failed to suggest prompt:", error);
                    // Silent fail - user can interpret
                } finally {
                    setIsSuggesting(false);
                }
            }
        };

        if (open) {
            suggestPrompt();
        }
    }, [open, postContent]);

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            toast.error("Please enter a prompt");
            return;
        }

        setIsGenerating(true);
        try {
            const generateImageFn = httpsCallable(functions, 'generateImage');
            const result = await generateImageFn({ prompt, aspectRatio });

            // @ts-ignore
            if (result.data?.imageUrl) {
                // @ts-ignore
                onGenerate(result.data.imageUrl);
                onOpenChange(false);
                toast.success("Image generated successfully!");
            } else {
                throw new Error("No image URL returned");
            }
        } catch (error: any) {
            console.error("Image generation failed:", error);
            toast.error(error.message || "Failed to generate image");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        Generate AI Image
                    </DialogTitle>
                    <DialogDescription>
                        Create a unique image for your post using AI.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label>Image Prompt</Label>
                            {isSuggesting && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1 animate-pulse">
                                    <Wand2 className="w-3 h-3" />
                                    Creating best prompt...
                                </span>
                            )}
                        </div>
                        <Textarea
                            placeholder="Describe the image you want to generate..."
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className={cn("min-h-[120px] resize-none", isSuggesting && "opacity-50")}
                            disabled={isSuggesting || isGenerating}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Aspect Ratio</Label>
                        <ToggleGroup
                            type="single"
                            value={aspectRatio}
                            onValueChange={(val) => val && setAspectRatio(val as any)}
                            className="justify-start"
                        >
                            <ToggleGroupItem value="1:1" aria-label="Square" className="gap-2">
                                <Square className="w-4 h-4" />
                                <span className="text-xs">Square (1:1)</span>
                            </ToggleGroupItem>
                            <ToggleGroupItem value="16:9" aria-label="Landscape" className="gap-2">
                                <Monitor className="w-4 h-4" />
                                <span className="text-xs">Landscape (16:9)</span>
                            </ToggleGroupItem>
                            <ToggleGroupItem value="9:16" aria-label="Portrait" className="gap-2">
                                <Smartphone className="w-4 h-4" />
                                <span className="text-xs">Portrait (9:16)</span>
                            </ToggleGroupItem>
                        </ToggleGroup>
                    </div>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isGenerating}>
                        Cancel
                    </Button>
                    <Button
                        variant="gradient"
                        onClick={handleGenerate}
                        disabled={isGenerating || isSuggesting || !prompt.trim()}
                        className="gap-2"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <ImageIcon className="w-4 h-4" />
                                Generate Image
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
