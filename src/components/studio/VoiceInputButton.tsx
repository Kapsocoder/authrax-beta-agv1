import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { toast } from "sonner";

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
}

export function VoiceInputButton({ onTranscript, className, size = "default" }: VoiceInputButtonProps) {
  const {
    isListening,
    isSupported,
    fullTranscript,
    toggleListening,
    clearTranscript,
  } = useVoiceInput({
    onError: (error) => toast.error(error),
  });

  // Send transcript when user stops speaking
  useEffect(() => {
    if (!isListening && fullTranscript.trim()) {
      onTranscript(fullTranscript);
      clearTranscript();
    }
  }, [isListening, fullTranscript, onTranscript, clearTranscript]);

  if (!isSupported) {
    return (
      <Button
        type="button"
        variant="outline"
        size={size}
        className={cn("cursor-not-allowed opacity-50", className)}
        disabled
        title="Voice input not supported in this browser"
      >
        <MicOff className="w-4 h-4" />
        {size !== "icon" && <span className="ml-2">Voice not supported</span>}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant={isListening ? "destructive" : "outline"}
      size={size}
      className={cn(
        isListening && "animate-pulse",
        className
      )}
      onClick={toggleListening}
    >
      {isListening ? (
        <>
          <div className="relative">
            <Mic className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
          </div>
          {size !== "icon" && <span className="ml-2">Listening...</span>}
        </>
      ) : (
        <>
          <Mic className="w-4 h-4" />
          {size !== "icon" && <span className="ml-2">Talk it out</span>}
        </>
      )}
    </Button>
  );
}
