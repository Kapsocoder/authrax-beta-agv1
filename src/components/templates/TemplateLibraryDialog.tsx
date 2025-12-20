import { useState, useMemo } from "react";
import { templates, Template, getUniqueThemes, getUniqueFormats, getUniqueObjectives, themeColors, formatColors, objectiveColors } from "@/data/templates";
import { TemplateCard } from "./TemplateCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, Briefcase, TrendingUp, User, Plus, X, Filter, Palette, Target, FileType } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface TemplateLibraryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (template: Template) => void;
}

export function TemplateLibraryDialog({
  open,
  onOpenChange,
  onSelectTemplate,
}: TemplateLibraryDialogProps) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
  const [selectedObjectives, setSelectedObjectives] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const themes = useMemo(() => getUniqueThemes(), []);
  const formats = useMemo(() => getUniqueFormats(), []);
  const objectives = useMemo(() => getUniqueObjectives(), []);

  const hasActiveFilters = selectedThemes.length > 0 || selectedFormats.length > 0 || selectedObjectives.length > 0;

  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      const matchesSearch = 
        template.name.toLowerCase().includes(search.toLowerCase()) ||
        template.description.toLowerCase().includes(search.toLowerCase()) ||
        template.category.toLowerCase().includes(search.toLowerCase()) ||
        template.theme.toLowerCase().includes(search.toLowerCase()) ||
        template.format.toLowerCase().includes(search.toLowerCase()) ||
        template.objective.toLowerCase().includes(search.toLowerCase());
      
      const matchesTab = 
        activeTab === "all" || 
        template.userType === activeTab;

      const matchesTheme = 
        selectedThemes.length === 0 || 
        selectedThemes.includes(template.theme);

      const matchesFormat = 
        selectedFormats.length === 0 || 
        selectedFormats.includes(template.format);

      const matchesObjective = 
        selectedObjectives.length === 0 || 
        selectedObjectives.includes(template.objective);

      return matchesSearch && matchesTab && matchesTheme && matchesFormat && matchesObjective;
    });
  }, [search, activeTab, selectedThemes, selectedFormats, selectedObjectives]);

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
    setSelectedThemes([]);
    setSelectedFormats([]);
    setSelectedObjectives([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="text-xl">Template Library</DialogTitle>
          <div className="flex gap-2 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button 
              variant={showFilters ? "default" : "outline"} 
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              className="relative"
            >
              <Filter className="w-4 h-4" />
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full" />
              )}
            </Button>
          </div>
        </DialogHeader>

        {/* Filters Section */}
        <Collapsible open={showFilters} onOpenChange={setShowFilters}>
          <CollapsibleContent className="px-6 py-4 border-b border-border bg-muted/30">
            <div className="space-y-4">
              {/* Active filters */}
              {hasActiveFilters && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-muted-foreground">Active:</span>
                  {selectedThemes.map(theme => (
                    <Badge 
                      key={theme} 
                      variant="outline" 
                      className={cn("text-xs cursor-pointer border", themeColors[theme])}
                      onClick={() => toggleFilter(theme, selectedThemes, setSelectedThemes)}
                    >
                      {theme} <X className="w-3 h-3 ml-1" />
                    </Badge>
                  ))}
                  {selectedFormats.map(format => (
                    <Badge 
                      key={format} 
                      variant="outline" 
                      className={cn("text-xs cursor-pointer border", formatColors[format])}
                      onClick={() => toggleFilter(format, selectedFormats, setSelectedFormats)}
                    >
                      {format} <X className="w-3 h-3 ml-1" />
                    </Badge>
                  ))}
                  {selectedObjectives.map(objective => (
                    <Badge 
                      key={objective} 
                      variant="outline" 
                      className={cn("text-xs cursor-pointer border", objectiveColors[objective])}
                      onClick={() => toggleFilter(objective, selectedObjectives, setSelectedObjectives)}
                    >
                      {objective} <X className="w-3 h-3 ml-1" />
                    </Badge>
                  ))}
                  <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-xs h-6">
                    Clear all
                  </Button>
                </div>
              )}

              {/* Theme filters */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Palette className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Themes</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {themes.slice(0, 12).map(theme => (
                    <Badge
                      key={theme}
                      variant="outline"
                      className={cn(
                        "text-xs cursor-pointer transition-all border",
                        selectedThemes.includes(theme) 
                          ? themeColors[theme] 
                          : "bg-transparent hover:bg-muted"
                      )}
                      onClick={() => toggleFilter(theme, selectedThemes, setSelectedThemes)}
                    >
                      {theme}
                    </Badge>
                  ))}
                  {themes.length > 12 && (
                    <Badge variant="outline" className="text-xs bg-muted/50">
                      +{themes.length - 12} more
                    </Badge>
                  )}
                </div>
              </div>

              {/* Format filters */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileType className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Formats</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {formats.map(format => (
                    <Badge
                      key={format}
                      variant="outline"
                      className={cn(
                        "text-xs cursor-pointer transition-all border",
                        selectedFormats.includes(format) 
                          ? formatColors[format] 
                          : "bg-transparent hover:bg-muted"
                      )}
                      onClick={() => toggleFilter(format, selectedFormats, setSelectedFormats)}
                    >
                      {format}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Objective filters */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Objectives</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {objectives.slice(0, 12).map(objective => (
                    <Badge
                      key={objective}
                      variant="outline"
                      className={cn(
                        "text-xs cursor-pointer transition-all border",
                        selectedObjectives.includes(objective) 
                          ? objectiveColors[objective] 
                          : "bg-transparent hover:bg-muted"
                      )}
                      onClick={() => toggleFilter(objective, selectedObjectives, setSelectedObjectives)}
                    >
                      {objective}
                    </Badge>
                  ))}
                  {objectives.length > 12 && (
                    <Badge variant="outline" className="text-xs bg-muted/50">
                      +{objectives.length - 12} more
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-4 mx-6 mt-4" style={{ width: "calc(100% - 3rem)" }}>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="founder" className="flex items-center gap-1">
              <Briefcase className="w-3 h-3" />
              <span className="hidden sm:inline">Founder</span>
            </TabsTrigger>
            <TabsTrigger value="executive" className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span className="hidden sm:inline">Executive</span>
            </TabsTrigger>
            <TabsTrigger value="professional" className="flex items-center gap-1">
              <User className="w-3 h-3" />
              <span className="hidden sm:inline">Professional</span>
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 px-6 py-4">
            <TabsContent value={activeTab} className="m-0">
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
            </TabsContent>
          </ScrollArea>
        </Tabs>

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
