import { useState } from "react";
import { Wand2, LayoutTemplate, Loader2, ArrowRight, ArrowLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ToneSelector, ToneOption } from "@/components/studio/ToneSelector";
import { Template, useTemplates } from "@/hooks/useTemplates";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

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
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBackToMain}
                className="h-8 w-8"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <DialogTitle>All Templates</DialogTitle>
            </div>
            <DialogDescription>
              Choose a template to guide the regeneration
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="flex-1 pr-4">
            <div className="grid grid-cols-2 gap-3 pt-2">
              {allTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateClick(template)}
                  className={cn(
                    "p-4 text-left rounded-lg border transition-all",
                    "border-border bg-secondary/30 hover:border-primary/50 hover:bg-secondary/50"
                  )}
                >
                  <p className="text-sm font-medium text-foreground line-clamp-1">
                    {template.name}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                    {template.category}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-2">
                    {template.description}
                  </p>
                </button>
              ))}
            </div>
          </ScrollArea>
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
