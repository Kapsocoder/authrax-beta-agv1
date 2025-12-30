import { useState, useRef } from "react";
import { Bold, List, Hash, Smile, AtSign, Image as ImageIcon, Sparkles, X, Upload, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface PostEditorProps {
  value: string;
  onChange: (value: string) => void;
  onGenerateAI?: () => void;
  isGenerating?: boolean;
  placeholder?: string;
  maxLength?: number;
  media?: Array<{ url: string; type: 'image' | 'video' }>;
  onAddMedia?: (file: File) => void;
  onRemoveMedia?: (index: number) => void;
  onGenerateImage?: () => void;
}

export function PostEditor({
  value,
  onChange,
  onGenerateAI,
  isGenerating,
  placeholder = "What do you want to share?",
  maxLength = 3000,
  media = [],
  onAddMedia,
  onRemoveMedia,
  onGenerateImage
}: PostEditorProps) {
  const [isFocused, setIsFocused] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const charCount = value.length;
  const isNearLimit = charCount > maxLength * 0.9;
  const isOverLimit = charCount > maxLength;

  const insertText = (before: string, after: string = "") => {
    const textarea = document.querySelector('textarea');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
    onChange(newText);
  };

  const formatActions = [
    { icon: Bold, label: "Bold", action: () => insertText("**", "**") },
    { icon: List, label: "List", action: () => insertText("\n• ") },
    { icon: Hash, label: "Hashtag", action: () => insertText("#") },
    { icon: AtSign, label: "Mention", action: () => insertText("@") },
    { icon: Smile, label: "Emoji", action: () => insertText("😊") },
  ];

  return (
    <div className={cn(
      "rounded-xl border transition-all duration-200",
      isFocused ? "border-primary shadow-glow" : "border-border",
      "bg-card"
    )}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-border">
        {formatActions.map((action) => (
          <Button
            key={action.label}
            variant="ghost"
            size="icon-sm"
            onClick={action.action}
            className="text-muted-foreground hover:text-foreground"
            title={action.label}
          >
            <action.icon className="w-4 h-4" />
          </Button>
        ))}
        <div className="flex-1" />
        {onGenerateAI && (
          <Button
            variant="gradient"
            size="sm"
            onClick={onGenerateAI}
            disabled={isGenerating}
            className="gap-2"
          >
            <Sparkles className={cn("w-4 h-4", isGenerating && "animate-spin")} />
            {isGenerating ? "Generating..." : "AI Assist"}
          </Button>
        )}
      </div>

      {/* Media Previews */}
      {media.length > 0 && (
        <div className="p-4 grid grid-cols-2 gap-2">
          {media.map((item, index) => (
            <div key={index} className="relative group rounded-lg overflow-hidden border border-border bg-muted/50 aspect-video">
              {item.type === 'image' ? (
                <img src={item.url} alt="Post media" className="w-full h-full object-cover" />
              ) : (
                <video src={item.url} className="w-full h-full object-cover" controls />
              )}
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onRemoveMedia?.(index)}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Editor */}
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className="min-h-[200px] border-0 focus-visible:ring-0 resize-none text-base leading-relaxed p-4 bg-transparent text-foreground"
      />

      {/* Footer */}
      <div className="flex items-center justify-between p-3 border-t border-border">
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*,video/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file && onAddMedia) {
                onAddMedia(file);
                // Reset value to allow selecting same file again
                e.target.value = "";
              }
            }}
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-muted-foreground gap-2">
                <ImageIcon className="w-4 h-4" />
                Add Media
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                Upload Image/Video
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onGenerateImage}>
                <Wand2 className="w-4 h-4 mr-2" />
                Generate with AI
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <span className={cn(
          "text-xs font-medium",
          isOverLimit ? "text-destructive" : isNearLimit ? "text-warning" : "text-muted-foreground"
        )}>
          {charCount.toLocaleString()} / {maxLength.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
