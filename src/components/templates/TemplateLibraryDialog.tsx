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
  DialogDescription,
} from "@/components/ui/dialog";
import { Search, Plus, X, Users, Palette, Target, FileType, ChevronLeft, ChevronRight, ArrowLeft, CheckCircle2, LayoutTemplate, Sparkles } from "lucide-react";
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

// Template Preview Component
function TemplatePreview({ 
  template, 
  onSelect, 
  onBack 
}: { 
  template: Template; 
  onSelect: () => void; 
  onBack: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-border">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <DialogTitle className="text-xl text-foreground">{template.name}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {template.category} • {userTypeLabels[template.userType]}
            </DialogDescription>
          </div>
          {template.isTrending && (
            <Badge variant="default" className="bg-primary/20 text-primary">
              <Sparkles className="w-3 h-3 mr-1" />
              Trending
            </Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 px-6 py-6">
        <div className="space-y-6">
          {/* Description */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
            <p className="text-foreground">{template.description}</p>
          </div>

          {/* Structure - Main Highlight */}
          <div className="p-5 rounded-xl bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-2 mb-3">
              <LayoutTemplate className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Post Structure</h3>
            </div>
            <div className="space-y-3">
              {template.structure.split("→").map((step, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">{index + 1}</span>
                  </div>
                  <p className="text-foreground">{step.trim()}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Example (if available) */}
          {template.example && (
            <div className="p-4 rounded-lg bg-secondary/50 border border-border">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Example</h3>
              <p className="text-foreground text-sm whitespace-pre-wrap">{template.example}</p>
            </div>
          )}

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Themes */}
            <div className="p-4 rounded-lg bg-secondary/30 border border-border">
              <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <Palette className="w-3 h-3" />
                Themes
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {template.themes.map((theme) => (
                  <Badge 
                    key={theme} 
                    variant="outline" 
                    className={cn("text-xs", themeFilterColors[theme])}
                  >
                    {themeLabels[theme] || theme}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Formats */}
            <div className="p-4 rounded-lg bg-secondary/30 border border-border">
              <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <FileType className="w-3 h-3" />
                Formats
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {template.formats.map((format) => (
                  <Badge 
                    key={format} 
                    variant="outline" 
                    className={cn("text-xs", formatFilterColors[format])}
                  >
                    {formatLabels[format] || format}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Objectives */}
            <div className="p-4 rounded-lg bg-secondary/30 border border-border col-span-2">
              <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <Target className="w-3 h-3" />
                Best For
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {template.objectives.map((objective) => (
                  <Badge 
                    key={objective} 
                    variant="outline" 
                    className={cn("text-xs", objectiveFilterColors[objective])}
                  >
                    {objectiveLabels[objective] || objective}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* User Type */}
          <div className="p-4 rounded-lg bg-muted/30 border border-border">
            <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <Users className="w-3 h-3" />
              Recommended For
            </h4>
            <Badge 
              variant="outline" 
              className={cn("text-sm", userTypeFilterColors[template.userType])}
            >
              {userTypeLabels[template.userType]}
            </Badge>
          </div>
        </div>
      </ScrollArea>

      {/* Footer Actions */}
      <div className="px-6 py-4 border-t border-border flex gap-3">
        <Button variant="outline" className="flex-1" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Library
        </Button>
        <Button variant="gradient" className="flex-1" onClick={onSelect}>
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Use This Template
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
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  const hasActiveFilters = selectedUserTypes.length > 0 || selectedThemes.length > 0 || selectedFormats.length > 0 || selectedObjectives.length > 0;

  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      const matchesSearch = 
        template.name.toLowerCase().includes(search.toLowerCase()) ||
        template.description.toLowerCase().includes(search.toLowerCase()) ||
        template.category.toLowerCase().includes(search.toLowerCase()) ||
        template.themes.some(t => t.toLowerCase().includes(search.toLowerCase())) ||
        template.formats.some(f => f.toLowerCase().includes(search.toLowerCase())) ||
        template.objectives.some(o => o.toLowerCase().includes(search.toLowerCase()));
      
      const matchesUserType = 
        selectedUserTypes.length === 0 || 
        selectedUserTypes.includes(template.userType);

      const matchesTheme = 
        selectedThemes.length === 0 || 
        template.themes.some(t => selectedThemes.includes(t));

      const matchesFormat = 
        selectedFormats.length === 0 || 
        template.formats.some(f => selectedFormats.includes(f));

      const matchesObjective = 
        selectedObjectives.length === 0 || 
        template.objectives.some(o => selectedObjectives.includes(o));

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

  const handleTemplateClick = (template: Template) => {
    setPreviewTemplate(template);
  };

  const handleSelectTemplate = () => {
    if (previewTemplate) {
      onSelectTemplate(previewTemplate);
      setPreviewTemplate(null);
    }
  };

  const handleCloseDialog = (open: boolean) => {
    if (!open) {
      setPreviewTemplate(null);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleCloseDialog}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 bg-background border-border">
        {previewTemplate ? (
          <TemplatePreview 
            template={previewTemplate} 
            onSelect={handleSelectTemplate}
            onBack={() => setPreviewTemplate(null)}
          />
        ) : (
          <>
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
                      onClick={() => handleTemplateClick(template)}
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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}