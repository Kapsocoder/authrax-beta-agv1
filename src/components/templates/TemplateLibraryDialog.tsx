import { useState, useMemo, useRef } from "react";
import { 
  templates, 
  Template, 
  userTypeLabels,
  themeLabels,
  formatLabels,
  objectiveLabels,
  userTypeFilterColors,
  themeFilterColors,
  formatFilterColors,
  objectiveFilterColors,
  userTypeFilters,
  themeFilters,
  formatFilters,
  objectiveFilters,
  themeColors, 
  formatColors, 
  objectiveColors 
} from "@/data/templates";
import { TemplateCard } from "./TemplateCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, Plus, X, Users, Palette, Target, FileType, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface TemplateLibraryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (template: Template) => void;
}

interface ScrollableFilterRowProps {
  label: string;
  icon: React.ReactNode;
  options: readonly string[];
  labels: Record<string, string>;
  colors: Record<string, string>;
  selected: string[];
  onToggle: (value: string) => void;
}

function ScrollableFilterRow({ 
  label, 
  icon, 
  options, 
  labels, 
  colors, 
  selected, 
  onToggle 
}: ScrollableFilterRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm font-medium text-foreground">{label}</span>
      </div>
      <div className="relative flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
          onClick={() => scroll('left')}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div 
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto scrollbar-hide scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {options.map(option => (
            <Badge
              key={option}
              variant="outline"
              className={cn(
                "whitespace-nowrap cursor-pointer transition-all border shrink-0 px-3 py-1",
                selected.includes(option) 
                  ? colors[option] 
                  : "bg-muted/30 text-muted-foreground border-border hover:bg-muted/50"
              )}
              onClick={() => onToggle(option)}
            >
              {labels[option] || option}
            </Badge>
          ))}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
          onClick={() => scroll('right')}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function TemplateLibraryDialog({
  open,
  onOpenChange,
  onSelectTemplate,
}: TemplateLibraryDialogProps) {
  const [search, setSearch] = useState("");
  const [selectedUserTypes, setSelectedUserTypes] = useState<string[]>([]);
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
  const [selectedObjectives, setSelectedObjectives] = useState<string[]>([]);

  const hasActiveFilters = selectedUserTypes.length > 0 || selectedThemes.length > 0 || selectedFormats.length > 0 || selectedObjectives.length > 0;

  // Map template fields to filter codes
  const getThemeCode = (theme: string): string => {
    const themeMapping: Record<string, string> = {
      "Leadership & Vision": "TL",
      "Industry Trends": "TL",
      "Business Performance": "SP",
      "Authenticity": "PCD",
      "Culture & Values": "CC",
      "Growth Mindset": "PCD",
      "Transparency": "CC",
      "Social Proof": "SP",
      "Thought Leadership": "TL",
      "Community": "CR",
      "Innovation": "TL",
      "Resourcefulness": "PCD",
      "Values": "CC",
      "Strategy": "TL",
      "Opportunity": "PSS",
      "Operations": "TL",
      "Collaboration": "CR",
      "Work Habits": "PCD",
      "Achievement": "SP",
      "Differentiation": "PSS",
      "Management": "TL",
      "Trends": "TL",
      "Recognition": "CC",
      "Direction": "TL",
      "Growth": "PCD",
      "Change": "TL",
      "Resilience": "PCD",
      "Inclusion": "CC",
      "Technology": "TL",
      "Corporate": "TL",
      "Journey": "PCD",
      "Service": "PSS",
      "Excellence": "TL",
      "International": "TL",
      "Development": "PCD",
      "Integration": "TL",
      "Review": "SP",
      "Balance": "PCD",
      "Learning": "EC",
      "Success": "SP",
      "Expertise": "EC",
      "Skills": "EC",
      "Identity": "PCD",
      "Insights": "EC",
      "Problem-Solving": "EC",
      "Milestones": "SP",
      "Networking": "CR",
      "Reflection": "PCD",
      "Opinion": "TL",
      "Celebration": "CC",
      "Future": "TL",
      "Engagement": "CR",
      "Tips": "EC",
      "Questions": "CR",
    };
    return themeMapping[theme] || "TL";
  };

  const getFormatCode = (format: string): string => {
    const formatMapping: Record<string, string> = {
      "Story": "T",
      "Opinion": "T",
      "Data/Stats": "I",
      "Behind-the-scenes": "V",
      "Framework": "T",
      "List": "T",
      "Update": "T",
      "Case Study": "T",
      "Prediction": "T",
      "Advice": "T",
      "Announcement": "T",
      "Manifesto": "T",
      "Analysis": "T",
      "Problem/Solution": "T",
      "How-to": "A",
      "Reflection": "T",
      "Celebration": "I",
      "Vision": "T",
      "Commitment": "T",
      "Journey": "T",
      "Insight": "T",
      "Summary": "T",
      "Philosophy": "T",
      "Lessons": "T",
      "Personal": "T",
      "Poll": "Po",
      "Carousel": "C",
      "Tutorial": "V",
      "Tips": "T",
      "Quick Win": "T",
      "Discussion": "T",
      "Question": "Po",
    };
    return formatMapping[format] || "T";
  };

  const getObjectiveCode = (objective: string): string => {
    const objectiveMapping: Record<string, string> = {
      "Thought Leadership": "PB",
      "Engagement": "AE",
      "Credibility Building": "RM",
      "Community Building": "NB",
      "Talent Attraction": "TA",
      "Relatability": "PB",
      "Investor Relations": "RM",
      "Lead Generation": "LG",
      "Authority Building": "PB",
      "Network Building": "NB",
      "Awareness": "PB",
      "Inspiration": "AE",
      "Employer Branding": "TA",
      "Learning Share": "AE",
      "Credibility": "RM",
      "Personal Branding": "PB",
      "Celebration": "AE",
      "Positioning": "PB",
      "Authority": "PB",
      "Culture Building": "TA",
      "Alignment": "NB",
      "Influence": "PB",
      "Trust Building": "RM",
      "Values": "PB",
      "Modernization": "PB",
      "Trust": "RM",
      "Brand Values": "PB",
      "Standards": "RM",
      "Perspective": "PB",
      "Legacy": "PB",
      "Expertise": "PB",
      "Transparency": "RM",
      "Authenticity": "PB",
      "Portfolio Building": "PB",
      "Discussion": "AE",
      "Visibility": "PB",
      "Milestone": "PB",
      "Relationship Building": "NB",
    };
    return objectiveMapping[objective] || "PB";
  };

  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      const matchesSearch = 
        template.name.toLowerCase().includes(search.toLowerCase()) ||
        template.description.toLowerCase().includes(search.toLowerCase()) ||
        template.category.toLowerCase().includes(search.toLowerCase()) ||
        template.theme.toLowerCase().includes(search.toLowerCase()) ||
        template.format.toLowerCase().includes(search.toLowerCase()) ||
        template.objective.toLowerCase().includes(search.toLowerCase());
      
      const matchesUserType = 
        selectedUserTypes.length === 0 || 
        selectedUserTypes.includes(template.userType);

      const templateThemeCode = getThemeCode(template.theme);
      const matchesTheme = 
        selectedThemes.length === 0 || 
        selectedThemes.includes(templateThemeCode);

      const templateFormatCode = getFormatCode(template.format);
      const matchesFormat = 
        selectedFormats.length === 0 || 
        selectedFormats.includes(templateFormatCode);

      const templateObjectiveCode = getObjectiveCode(template.objective);
      const matchesObjective = 
        selectedObjectives.length === 0 || 
        selectedObjectives.includes(templateObjectiveCode);

      return matchesSearch && matchesUserType && matchesTheme && matchesFormat && matchesObjective;
    });
  }, [search, selectedUserTypes, selectedThemes, selectedFormats, selectedObjectives]);

  const toggleFilter = (
    value: string, 
    selected: string[], 
    setSelected: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (selected.includes(value)) {
      setSelected(selected.filter(v => v !== value));
    } else {
      setSelected([...selected, value]);
    }
  };

  const clearAllFilters = () => {
    setSelectedUserTypes([]);
    setSelectedThemes([]);
    setSelectedFormats([]);
    setSelectedObjectives([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 bg-background border-border">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="text-xl text-foreground">Template Library</DialogTitle>
          <div className="flex gap-2 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-muted/30 border-border"
              />
            </div>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearAllFilters} className="text-xs">
                <X className="w-3 h-3 mr-1" />
                Clear filters
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* Filters Section - Always visible */}
        <div className="px-6 py-4 border-b border-border bg-muted/10 space-y-4">
          <ScrollableFilterRow
            label="User Types"
            icon={<Users className="w-4 h-4 text-muted-foreground" />}
            options={userTypeFilters}
            labels={userTypeLabels}
            colors={userTypeFilterColors}
            selected={selectedUserTypes}
            onToggle={(value) => toggleFilter(value, selectedUserTypes, setSelectedUserTypes)}
          />
          
          <ScrollableFilterRow
            label="Themes"
            icon={<Palette className="w-4 h-4 text-muted-foreground" />}
            options={themeFilters}
            labels={themeLabels}
            colors={themeFilterColors}
            selected={selectedThemes}
            onToggle={(value) => toggleFilter(value, selectedThemes, setSelectedThemes)}
          />
          
          <ScrollableFilterRow
            label="Formats"
            icon={<FileType className="w-4 h-4 text-muted-foreground" />}
            options={formatFilters}
            labels={formatLabels}
            colors={formatFilterColors}
            selected={selectedFormats}
            onToggle={(value) => toggleFilter(value, selectedFormats, setSelectedFormats)}
          />
          
          <ScrollableFilterRow
            label="Objectives"
            icon={<Target className="w-4 h-4 text-muted-foreground" />}
            options={objectiveFilters}
            labels={objectiveLabels}
            colors={objectiveFilterColors}
            selected={selectedObjectives}
            onToggle={(value) => toggleFilter(value, selectedObjectives, setSelectedObjectives)}
          />
        </div>

        <ScrollArea className="flex-1 px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} found
            </p>
          </div>
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No templates found matching your filters.</p>
              {hasActiveFilters && (
                <Button variant="link" onClick={clearAllFilters} className="mt-2">
                  Clear all filters
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onClick={() => onSelectTemplate(template)}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="px-6 py-4 border-t border-border">
          <Button variant="outline" className="w-full" disabled>
            <Plus className="w-4 h-4 mr-2" />
            Create Custom Template (Coming Soon)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}