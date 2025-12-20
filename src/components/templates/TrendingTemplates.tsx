import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getTrendingTemplates, Template } from "@/data/templates";
import { TemplateCard } from "./TemplateCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutTemplate, ArrowRight } from "lucide-react";
import { TemplateLibraryDialog } from "./TemplateLibraryDialog";

interface TrendingTemplatesProps {
  onSelectTemplate?: (template: Template) => void;
  showViewAll?: boolean;
  maxItems?: number;
}

export function TrendingTemplates({ 
  onSelectTemplate, 
  showViewAll = true,
  maxItems = 6 
}: TrendingTemplatesProps) {
  const navigate = useNavigate();
  const [showLibrary, setShowLibrary] = useState(false);
  const trendingTemplates = getTrendingTemplates().slice(0, maxItems);

  const handleTemplateClick = (template: Template) => {
    if (onSelectTemplate) {
      onSelectTemplate(template);
    } else {
      // Navigate to create with template
      navigate(`/create?template=${template.id}`);
    }
  };

  return (
    <>
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            <span className="flex items-center gap-2">
              <LayoutTemplate className="w-5 h-5 text-primary" />
              Trending Templates
            </span>
            {showViewAll && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-primary"
                onClick={() => setShowLibrary(true)}
              >
                View All
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {trendingTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onClick={() => handleTemplateClick(template)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <TemplateLibraryDialog 
        open={showLibrary} 
        onOpenChange={setShowLibrary}
        onSelectTemplate={(template) => {
          handleTemplateClick(template);
          setShowLibrary(false);
        }}
      />
    </>
  );
}
