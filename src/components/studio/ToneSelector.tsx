import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ToneOption = "professional" | "witty" | "inspiring" | "casual" | "educational";

interface ToneSelectorProps {
  selected: ToneOption;
  onChange: (tone: ToneOption) => void;
}

const tones: { value: ToneOption; label: string; emoji: string; description: string }[] = [
  { value: "professional", label: "Professional", emoji: "💼", description: "Polished and business-like" },
  { value: "witty", label: "Witty", emoji: "😄", description: "Clever with subtle humor" },
  { value: "inspiring", label: "Inspiring", emoji: "✨", description: "Motivational and uplifting" },
  { value: "casual", label: "Casual", emoji: "👋", description: "Friendly and conversational" },
  { value: "educational", label: "Educational", emoji: "📚", description: "Teaching and informative" },
];

export function ToneSelector({ selected, onChange }: ToneSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">Tone</label>
      <div className="flex flex-wrap gap-2">
        {tones.map((tone) => (
          <Button
            key={tone.value}
            type="button"
            variant={selected === tone.value ? "default" : "outline"}
            size="sm"
            onClick={() => onChange(tone.value)}
            className={cn(
              "transition-all",
              selected === tone.value 
                ? "ring-2 ring-primary/20 text-primary-foreground" 
                : "text-foreground hover:text-foreground"
            )}
            title={tone.description}
          >
            <span className="mr-1">{tone.emoji}</span>
            {tone.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
