import { useState } from "react";
import { Bold, List, Hash, Smile, AtSign, Image, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface PostEditorProps {
  value: string;
  onChange: (value: string) => void;
  onGenerateAI?: () => void;
  isGenerating?: boolean;
  placeholder?: string;
  maxLength?: number;
}

export function PostEditor({
  value,
  onChange,
  onGenerateAI,
  isGenerating,
  placeholder = "What do you want to share?",
  maxLength = 3000,
}: PostEditorProps) {
  const [isFocused, setIsFocused] = useState(false);
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
        <Button variant="ghost" size="sm" className="text-muted-foreground gap-2">
          <Image className="w-4 h-4" />
          Add Media
        </Button>
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
