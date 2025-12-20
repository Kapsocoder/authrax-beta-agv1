import { useState, useCallback, useRef, useEffect } from "react";

interface UseVoiceInputOptions {
  onTranscript?: (text: string) => void;
  onError?: (error: string) => void;
  language?: string;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

export function useVoiceInput(options: UseVoiceInputOptions = {}) {
  const { onTranscript, onError, language = "en-US" } = options;
  
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    // Check for browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);
    
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language;
      
      recognition.onresult = (event: SpeechRecognitionEvent) => {
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
          setTranscript((prev) => prev + finalTranscript);
          onTranscript?.(finalTranscript);
        }
        setInterimTranscript(currentInterim);
      };
      
      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        
        let errorMessage = "Voice input error";
        switch (event.error) {
          case "not-allowed":
            errorMessage = "Microphone access denied. Please enable microphone permissions.";
            break;
          case "no-speech":
            errorMessage = "No speech detected. Please try again.";
            break;
          case "audio-capture":
            errorMessage = "No microphone found. Please check your device.";
            break;
          case "network":
            errorMessage = "Network error. Please check your connection.";
            break;
        }
        onError?.(errorMessage);
      };
      
      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript("");
      };
      
      recognitionRef.current = recognition;
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [language, onTranscript, onError]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      setTranscript("");
      setInterimTranscript("");
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error("Failed to start recognition:", error);
        onError?.("Failed to start voice input");
      }
    }
  }, [isListening, onError]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const clearTranscript = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
  }, []);

  return {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    fullTranscript: transcript + interimTranscript,
    startListening,
    stopListening,
    toggleListening,
    clearTranscript,
  };
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

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}
