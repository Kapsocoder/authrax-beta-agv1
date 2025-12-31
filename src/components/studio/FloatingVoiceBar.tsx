import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface FloatingVoiceBarProps {
  onTranscriptUpdate: (text: string) => void;
  autoStart?: boolean;
  transcript?: string;
}

export function FloatingVoiceBar({ onTranscriptUpdate, autoStart = true, transcript }: FloatingVoiceBarProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [interimText, setInterimText] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const fullTranscriptRef = useRef("");
  const chunkTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event) => {
        let finalTranscript = "";
        let currentInterim = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            currentInterim += result[0].transcript;
          }
        }

        if (finalTranscript) {
          // Append to full transcript and update parent immediately
          fullTranscriptRef.current = fullTranscriptRef.current
            ? fullTranscriptRef.current + " " + finalTranscript.trim()
            : finalTranscript.trim();
          onTranscriptUpdate(fullTranscriptRef.current);
        }
        setInterimText(currentInterim);
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        if (event.error !== "aborted") {
          setIsListening(false);
          let errorMessage = "Voice input error";
          switch (event.error) {
            case "not-allowed":
              errorMessage = "Microphone access denied. Please enable microphone permissions.";
              break;
            case "no-speech":
              // Restart on no-speech to keep continuous listening
              if (isListening) {
                try {
                  recognition.start();
                } catch (e) {
                  // Already running
                }
              }
              return;
            case "audio-capture":
              errorMessage = "No microphone found. Please check your device.";
              break;
            case "network":
              errorMessage = "Network error. Please check your connection.";
              break;
          }
          toast.error(errorMessage);
        }
      };

      recognition.onend = () => {
        // Restart if we're still supposed to be listening (browser stops after ~15s of silence)
        if (isListening) {
          try {
            recognition.start();
          } catch (e) {
            setIsListening(false);
          }
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (chunkTimerRef.current) {
        clearInterval(chunkTimerRef.current);
      }
    };
  }, []);

  // Sync internal transcript ref with external edits
  useEffect(() => {
    if (transcript !== undefined) {
      fullTranscriptRef.current = transcript;
    }
  }, [transcript]);

  // Auto-start on mount
  useEffect(() => {
    if (autoStart && isSupported && !isListening) {
      const timer = setTimeout(() => {
        startListening();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoStart, isSupported]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error("Failed to start recognition:", error);
        toast.error("Failed to start voice input");
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      setIsListening(false);
      setInterimText("");
    }
  }, []);

  if (!isSupported) {
    return (
      <div className="fixed bottom-0 left-0 right-0 p-4 glass-strong border-t border-border/50 safe-area-bottom">
        <div className="max-w-4xl mx-auto flex items-center justify-center gap-3 text-muted-foreground">
          <MicOff className="w-5 h-5" />
          <span className="text-sm">Voice input not supported in this browser</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 glass-strong border-t border-border/50 safe-area-bottom z-50">
      <div className="max-w-4xl mx-auto">
        {/* Interim text display */}
        {interimText && (
          <div className="mb-3 px-4 py-2 bg-secondary/50 rounded-lg">
            <p className="text-sm text-muted-foreground italic">{interimText}</p>
          </div>
        )}

        <div className="flex items-center justify-center gap-4">
          {isListening ? (
            <>
              {/* Recording indicator */}
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="text-sm text-foreground">Recording...</span>
              </div>

              {/* Stop button */}
              <Button
                variant="destructive"
                size="lg"
                className={cn("h-14 w-14 rounded-full", "animate-pulse")}
                onClick={stopListening}
              >
                <Square className="w-6 h-6" />
              </Button>
            </>
          ) : (
            <>
              <span className="text-sm text-muted-foreground">Tap to start speaking</span>
              <Button
                variant="gradient"
                size="lg"
                className="h-14 w-14 rounded-full"
                onClick={startListening}
              >
                <Mic className="w-6 h-6" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Add types for Web Speech API
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

interface SpeechRecognitionConstructor {
  new(): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}
