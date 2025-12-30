import { useState, useMemo, useRef } from "react";
import { Wand2, LayoutTemplate, Loader2, ArrowRight, ArrowLeft, ChevronRight, Search, X, Users, Palette, Target, FileType, ChevronLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ToneSelector, ToneOption } from "@/components/studio/ToneSelector";
import { Template, useTemplates } from "@/hooks/useTemplates";
import { TemplateCard } from "../templates/TemplateCard";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  userTypeLabels, themeLabels, formatLabels, objectiveLabels,
  userTypeFilterColors, themeFilterColors, formatFilterColors, objectiveFilterColors,
  userTypeFilters, themeFilters, formatFilters, objectiveFilters,
} from "@/data/templateConstants";

interface AIAssistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTone: ToneOption;
  onToneChange: (tone: ToneOption) => void;
  onRegenerate: (params: {
    changeRequest: string;
    template: Template | null;
    tone: ToneOption;
  }) => void;
  isGenerating: boolean;
}

interface FilterOptionsProps {
  options: readonly string[];
  labels: Record<string, string>;
  colors: Record<string, string>;
  selected: string[];
  onToggle: (value: string) => void;
}

function FilterOptionsList({
  options,
  labels,
  colors,
  selected,
  onToggle
}: FilterOptionsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="relative flex items-center gap-1 group flex-1 min-w-0">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground hidden md:flex"
        onClick={() => scroll('left')}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide scroll-smooth py-1 px-1 w-full"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {options.map(option => (
          <Badge
            key={option}
            variant="outline"
            className={cn(
              "whitespace-nowrap cursor-pointer transition-all border shrink-0 px-3 py-1.5 text-sm font-normal",
              selected.includes(option)
                ? colors[option]
                : "bg-muted/30 text-muted-foreground border-border hover:bg-muted/50 hover:text-foreground"
            )}
            onClick={() => onToggle(option)}
          >
            {labels[option] || option}
            {selected.includes(option) && <CheckCircle2 className="ml-2 w-3 h-3" />}
          </Badge>
        ))}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground hidden md:flex"
        onClick={() => scroll('right')}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function AIAssistDialog({
  open,
  onOpenChange,
  selectedTone,
  onToneChange,
  onRegenerate,
  isGenerating,
}: AIAssistDialogProps) {
  const [changeRequest, setChangeRequest] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [viewMode, setViewMode] = useState<"main" | "all-templates" | "template-detail">("main");
  const { data: allTemplates = [] } = useTemplates();

  // Filter states
  const [search, setSearch] = useState("");
  const [selectedUserTypes, setSelectedUserTypes] = useState<string[]>([]);
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
  const [selectedObjectives, setSelectedObjectives] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<'userType' | 'theme' | 'format' | 'objective'>('userType');

  const hasActiveFilters = selectedUserTypes.length > 0 || selectedThemes.length > 0 || selectedFormats.length > 0 || selectedObjectives.length > 0;

  const filteredTemplates = useMemo(() => {
    return allTemplates.filter((template) => {
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
  }, [allTemplates, search, selectedUserTypes, selectedThemes, selectedFormats, selectedObjectives]);

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
    setSearch("");
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setChangeRequest("");
      setSelectedTemplate(null);
      setPreviewTemplate(null);
      setViewMode("main");
    }
    onOpenChange(open);
  };

  const handleRegenerate = () => {
    if (!changeRequest.trim()) return;
    onRegenerate({
      changeRequest,
      template: selectedTemplate,
      tone: selectedTone,
    });
    // Reset after submission
    setChangeRequest("");
    setSelectedTemplate(null);
    setPreviewTemplate(null);
    setViewMode("main");
  };

  const handleTemplateClick = (template: Template) => {
    setPreviewTemplate(template);
    setViewMode("template-detail");
  };

  const handleSelectTemplate = () => {
    if (previewTemplate) {
      setSelectedTemplate(previewTemplate);
      setPreviewTemplate(null);
      setViewMode("main");
    }
  };

  const handleBackToMain = () => {
    setPreviewTemplate(null);
    setViewMode("main");
  };

  const handleBackToAllTemplates = () => {
    setPreviewTemplate(null);
    setViewMode("all-templates");
  };

  // Template detail view
  if (viewMode === "template-detail" && previewTemplate) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBackToAllTemplates}
                className="h-8 w-8"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <DialogTitle>{previewTemplate.name}</DialogTitle>
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4 pt-2">
              <div>
                <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded-full">
                  {previewTemplate.category}
                </span>
              </div>

              <p className="text-sm text-muted-foreground">
                {previewTemplate.description}
              </p>

              <div>
                <Label className="text-xs text-muted-foreground">Structure</Label>
                <p className="text-sm mt-1 whitespace-pre-wrap">{previewTemplate.structure}</p>
              </div>

              {previewTemplate.example && (
                <div>
                  <Label className="text-xs text-muted-foreground">Example</Label>
                  <div className="mt-1 p-3 bg-secondary/30 rounded-lg text-sm whitespace-pre-wrap">
                    {previewTemplate.example}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="pt-4 border-t border-border mt-4">
            <Button
              variant="gradient"
              className="w-full"
              onClick={handleSelectTemplate}
            >
              <LayoutTemplate className="w-4 h-4 mr-2" />
              Use This Template
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // All templates view
  if (viewMode === "all-templates") {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 bg-background border-border">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
            <div className="flex items-center gap-3 mb-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBackToMain}
                className="h-8 w-8"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <DialogTitle>All Templates</DialogTitle>
                <DialogDescription>
                  Choose a template to guide the regeneration
                </DialogDescription>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-muted/30 border-border"
              />
            </div>
          </DialogHeader>

          {/* Filters Section */}
          <div className="flex flex-col border-b border-border bg-muted/10">
            {/* Row 1: Category Tabs */}
            <div className="flex items-center gap-1 px-6 pt-3 pb-0 border-b border-border/50 overflow-x-auto scrollbar-hide">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveCategory('userType')}
                className={cn(
                  "rounded-b-none border-b-2 border-transparent hover:bg-transparent hover:text-primary px-4 pb-3 pt-2 h-auto text-muted-foreground",
                  activeCategory === 'userType' && "border-primary text-primary font-medium bg-background/50"
                )}
              >
                <Users className="w-4 h-4 mr-2" />
                User Types
                {selectedUserTypes.length > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 min-w-5 px-1 rounded-full text-[10px] flex items-center justify-center bg-primary/10 text-primary">
                    {selectedUserTypes.length}
                  </Badge>
                )}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveCategory('theme')}
                className={cn(
                  "rounded-b-none border-b-2 border-transparent hover:bg-transparent hover:text-primary px-4 pb-3 pt-2 h-auto text-muted-foreground",
                  activeCategory === 'theme' && "border-primary text-primary font-medium bg-background/50"
                )}
              >
                <Palette className="w-4 h-4 mr-2" />
                Themes
                {selectedThemes.length > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 min-w-5 px-1 rounded-full text-[10px] flex items-center justify-center bg-primary/10 text-primary">
                    {selectedThemes.length}
                  </Badge>
                )}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveCategory('format')}
                className={cn(
                  "rounded-b-none border-b-2 border-transparent hover:bg-transparent hover:text-primary px-4 pb-3 pt-2 h-auto text-muted-foreground",
                  activeCategory === 'format' && "border-primary text-primary font-medium bg-background/50"
                )}
              >
                <FileType className="w-4 h-4 mr-2" />
                Formats
                {selectedFormats.length > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 min-w-5 px-1 rounded-full text-[10px] flex items-center justify-center bg-primary/10 text-primary">
                    {selectedFormats.length}
                  </Badge>
                )}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveCategory('objective')}
                className={cn(
                  "rounded-b-none border-b-2 border-transparent hover:bg-transparent hover:text-primary px-4 pb-3 pt-2 h-auto text-muted-foreground",
                  activeCategory === 'objective' && "border-primary text-primary font-medium bg-background/50"
                )}
              >
                <Target className="w-4 h-4 mr-2" />
                Objectives
                {selectedObjectives.length > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 min-w-5 px-1 rounded-full text-[10px] flex items-center justify-center bg-primary/10 text-primary">
                    {selectedObjectives.length}
                  </Badge>
                )}
              </Button>

              <div className="flex-1" />

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="mb-2 h-8 px-2 text-muted-foreground hover:text-destructive text-xs"
                >
                  Reset All
                  <X className="ml-1.5 h-3 w-3" />
                </Button>
              )}
            </div>

            {/* Row 2: Options for Active Category */}
            <div className="px-6 py-3 bg-muted/20 min-h-[60px] flex items-center">
              {activeCategory === 'userType' && (
                <FilterOptionsList
                  options={userTypeFilters}
                  labels={userTypeLabels}
                  colors={userTypeFilterColors}
                  selected={selectedUserTypes}
                  onToggle={(value) => toggleFilter(value, selectedUserTypes, setSelectedUserTypes)}
                />
              )}

              {activeCategory === 'theme' && (
                <FilterOptionsList
                  options={themeFilters}
                  labels={themeLabels}
                  colors={themeFilterColors}
                  selected={selectedThemes}
                  onToggle={(value) => toggleFilter(value, selectedThemes, setSelectedThemes)}
                />
              )}

              {activeCategory === 'format' && (
                <FilterOptionsList
                  options={formatFilters}
                  labels={formatLabels}
                  colors={formatFilterColors}
                  selected={selectedFormats}
                  onToggle={(value) => toggleFilter(value, selectedFormats, setSelectedFormats)}
                />
              )}

              {activeCategory === 'objective' && (
                <FilterOptionsList
                  options={objectiveFilters}
                  labels={objectiveLabels}
                  colors={objectiveFilterColors}
                  selected={selectedObjectives}
                  onToggle={(value) => toggleFilter(value, selectedObjectives, setSelectedObjectives)}
                />
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} found
              </p>
            </div>

            {filteredTemplates.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No templates found matching your filters.</p>
                {hasActiveFilters && (
                  <Button variant="link" onClick={clearAllFilters} className="mt-2 text-primary">
                    Clear all filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onClick={() => handleTemplateClick(template)}
                    compact={false}
                  />
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Main view
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-primary" />
            AI Assist
          </DialogTitle>
          <DialogDescription>
            Describe what changes you'd like and let AI create a new version.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {/* Mandatory change request */}
          <div>
            <Label htmlFor="ai-prompt">
              What would you like to change? <span className="text-destructive">*</span>
            </Label>
            <Input
              id="ai-prompt"
              placeholder="e.g., 'Make it more punchy' or 'Add a call to action'"
              value={changeRequest}
              onChange={(e) => setChangeRequest(e.target.value)}
              className="mt-2"
            />
          </div>

          {/* Tone Selector */}
          <div>
            <Label className="mb-2 block">Tone</Label>
            <ToneSelector selected={selectedTone} onChange={onToneChange} />
          </div>

          {/* Template Selection (Optional) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Template (optional)</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("all-templates")}
                className="text-xs text-primary hover:text-primary"
              >
                View all
                <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </div>

            {selectedTemplate ? (
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <LayoutTemplate className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{selectedTemplate.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTemplate(null)}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto p-1">
                {allTemplates.slice(0, 6).map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateClick(template)}
                    className="p-3 text-left rounded-lg border border-border bg-secondary/30 hover:border-primary/50 hover:bg-secondary/50 transition-all"
                  >
                    <p className="text-sm font-medium text-foreground line-clamp-1">
                      {template.name}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {template.category}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <Button
            variant="gradient"
            className="w-full"
            onClick={handleRegenerate}
            disabled={isGenerating || !changeRequest.trim()}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Regenerating...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                Regenerate
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
