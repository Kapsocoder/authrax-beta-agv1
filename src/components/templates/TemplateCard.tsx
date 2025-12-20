import { Template } from "@/data/templates";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Briefcase, User, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface TemplateCardProps {
  template: Template;
  onClick?: () => void;
  selected?: boolean;
  compact?: boolean;
}

const userTypeIcons = {
  founder: Briefcase,
  executive: TrendingUp,
  professional: User,
};

const userTypeColors = {
  founder: "bg-primary/10 text-primary",
  executive: "bg-accent/10 text-accent-foreground",
  professional: "bg-secondary text-secondary-foreground",
};

export function TemplateCard({ template, onClick, selected, compact }: TemplateCardProps) {
  const Icon = userTypeIcons[template.userType];

  if (compact) {
    return (
      <button
        onClick={onClick}
        className={cn(
          "w-full text-left p-3 rounded-xl border transition-all hover:shadow-md",
          selected 
            ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
            : "border-border bg-card hover:border-primary/50"
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
        "cursor-pointer transition-all hover:shadow-elevated hover:scale-[1.02]",
        selected && "ring-2 ring-primary border-primary"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className={cn("p-2 rounded-lg", userTypeColors[template.userType])}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">{template.name}</h3>
            <p className="text-sm text-muted-foreground capitalize">{template.userType}</p>
          </div>
          {template.isTrending && (
            <Badge variant="secondary" className="text-xs">
              <TrendingUp className="w-3 h-3 mr-1" />
              Trending
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {template.description}
        </p>
        <div className="flex flex-wrap gap-1">
          <Badge variant="outline" className="text-xs">{template.format}</Badge>
          <Badge variant="outline" className="text-xs">{template.category}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
