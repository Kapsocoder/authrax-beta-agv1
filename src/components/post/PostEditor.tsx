import { useState, useRef } from "react";
import { Bold, List, Hash, Smile, AtSign, Image as ImageIcon, Sparkles, X, Upload, Wand2, Camera } from "lucide-react";
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
  // onGenerateAI removed
  isGenerating?: boolean;
  placeholder?: string;
  maxLength?: number;
  media?: Array<{ url: string; type: 'image' | 'video' }>;
  onAddMedia?: (file: File, source?: "upload" | "camera") => void;
  onRemoveMedia?: (index: number) => void;
  onGenerateImage?: () => void;
}

export function PostEditor({
  value,
  onChange,
  isGenerating,
  placeholder = "What do you want to share?",
  maxLength = 3000,
  media,
  onAddMedia,
  onRemoveMedia,
  onGenerateImage
}: PostEditorProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
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

  /* Drag and Drop Handlers */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0] && onAddMedia) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        onAddMedia(file, "upload");
      }
    }
  };

  /* Paste Handler */
  const handlePaste = (e: React.ClipboardEvent) => {
    // Check for clipboard items directly
    if (e.clipboardData.files && e.clipboardData.files.length > 0) {
      const file = e.clipboardData.files[0];
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        e.preventDefault(); // Prevent pasting file name text
        if (onAddMedia) {
          onAddMedia(file, "upload"); // Treat paste as upload
        }
        return;
      }
    }
    // Otherwise let normal text paste happen via Textarea
  };

  return (
    <div
      className={cn(
        "flex flex-col border rounded-xl overflow-hidden bg-card transition-all relative",
        isFocused ? "ring-2 ring-primary border-transparent" : "border-border",
        isDragging && "ring-2 ring-primary border-dashed bg-primary/5",
        isOverLimit && "border-destructive ring-destructive"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag Overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-primary animate-in fade-in duration-200">
          <Upload className="w-12 h-12 mb-4" />
          <p className="font-medium text-lg">Drop media here</p>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-border bg-muted/30">
        {formatActions.map((action, i) => (
          <Button
            key={i}
            variant="ghost"
            size="sm"
            onClick={action.action}
            title={action.label}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          >
            <action.icon className="w-4 h-4" />
          </Button>
        ))}
      </div>

      {/* Media Preview */}
      {media && media.length > 0 && (
        <div className="p-4 flex gap-2 overflow-x-auto">
          {media.map((item, index) => (
            <div key={index} className="relative group flex-shrink-0">
              {item.type === 'video' ? (
                <video src={item.url} className="h-24 w-auto rounded-lg object-cover border border-border" />
              ) : (
                <img src={item.url} alt="Media" className="h-24 w-auto rounded-lg object-cover border border-border" />
              )}
              <Button
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
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
        onPaste={handlePaste}
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
                onAddMedia(file, "upload");
                // Reset value to allow selecting same file again
                e.target.value = "";
              }
            }}
          />
          <input
            type="file"
            ref={cameraInputRef}
            className="hidden"
            accept="image/*"
            capture="environment"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file && onAddMedia) {
                onAddMedia(file, "camera");
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
              <DropdownMenuItem onClick={() => cameraInputRef.current?.click()}>
                <Camera className="w-4 h-4 mr-2" />
                Take Photo
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
