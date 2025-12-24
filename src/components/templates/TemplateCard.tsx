import { Template } from "@/hooks/useTemplates";
import {
  themeColors,
  formatColors,
  objectiveColors,
  themeLabels,
  formatLabels,
  objectiveLabels
} from "@/data/templateConstants";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Briefcase, User, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface TemplateCardProps {
  template: Template;
  onClick?: () => void;
  selected?: boolean;
  compact?: boolean;
  showBadges?: boolean;
}

const userTypeIcons = {
  founder: Briefcase,
  executive: TrendingUp,
  professional: User,
};

const userTypeColors = {
  founder: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  executive: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  professional: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
};

export function TemplateCard({ template, onClick, selected, compact, showBadges = true }: TemplateCardProps) {
  const Icon = userTypeIcons[template.userType];

  if (compact) {
    return (
      <button
        onClick={onClick}
        className={cn(
          "w-full text-left p-3 rounded-xl border transition-all hover:shadow-md",
          selected
            ? "border-primary bg-primary/5 ring-2 ring-primary/20"
            : "border-border bg-card/50 hover:border-primary/50 hover:bg-card"
        )}
      >
        <div className="flex items-start gap-3">
          <div className={cn("p-2 rounded-lg", userTypeColors[template.userType])}>
            <FileText className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm text-foreground truncate">{template.name}</h4>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{template.description}</p>
          </div>
        </div>
      </button>
    );
  }

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-elevated hover:scale-[1.02] bg-[#0A0A0B] border-white/5",
        selected && "ring-2 ring-primary border-primary"
      )}
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-start gap-3">
            <div className={cn("p-2.5 rounded-xl", userTypeColors[template.userType])}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground line-clamp-1">{template.name}</h3>
              <p className="text-xs text-muted-foreground capitalize mt-0.5">{template.userType}</p>
            </div>
          </div>
          {template.isTrending && (
            <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 h-10">
          {template.description}
        </p>

        {showBadges && (
          <div className="flex flex-wrap gap-2">
            {template.themes.slice(0, 1).map((theme) => (
              <Badge
                key={theme}
                variant="outline"
                className={cn("text-[10px] px-2 py-0.5 h-6 rounded-full border", themeColors[theme] || "bg-muted/50 text-muted-foreground")}
              >
                {themeLabels[theme] || theme}
              </Badge>
            ))}
            {template.objectives.slice(0, 1).map((objective) => (
              <Badge
                key={objective}
                variant="outline"
                className={cn("text-[10px] px-2 py-0.5 h-6 rounded-full border", objectiveColors[objective] || "bg-muted/50 text-muted-foreground")}
              >
                {objectiveLabels[objective] || objective}
              </Badge>
            ))}
            {template.formats.slice(0, 1).map((format) => (
              <Badge
                key={format}
                variant="outline"
                className={cn("text-[10px] px-2 py-0.5 h-6 rounded-full border", formatColors[format] || "bg-muted/50 text-muted-foreground")}
              >
                {formatLabels[format] || format}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
