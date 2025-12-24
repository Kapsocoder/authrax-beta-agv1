import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTrendingTemplates, Template } from "@/hooks/useTemplates";
import { TemplateCard } from "./TemplateCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LayoutTemplate, ArrowRight } from "lucide-react";
import { TemplateLibraryDialog } from "./TemplateLibraryDialog";

interface TrendingTemplatesProps {
  onSelectTemplate?: (template: Template) => void;
  showViewAll?: boolean;
  maxItems?: number;
  showPreviewFirst?: boolean;
}

export function TrendingTemplates({
  onSelectTemplate,
  showViewAll = true,
  maxItems = 6,
  showPreviewFirst = false
}: TrendingTemplatesProps) {
  const navigate = useNavigate();
  const [showLibrary, setShowLibrary] = useState(false);
  const { data: trendingTemplates, isLoading } = useTrendingTemplates(maxItems);

  const handleTemplateClick = (template: Template) => {
    if (onSelectTemplate) {
      onSelectTemplate(template);
    } else {
      navigate("/create", {
        state: {
          mode: "template",
          templateId: template.id
        }
      });
    }
  };

  const handleLibrarySelect = (template: Template) => {
    setShowLibrary(false);
    if (onSelectTemplate) {
      onSelectTemplate(template);
    } else {
      navigate("/create", {
        state: {
          mode: "template",
          templateId: template.id
        }
      });
    }
  };

  return (
    <>
      <Card className="bg-transparent border-none shadow-none p-0">
        <CardHeader className="px-1 pb-4 pt-0">
          <CardTitle className="text-lg flex items-center justify-between font-normal">
            <span className="flex items-center gap-2">
              <LayoutTemplate className="w-5 h-5 text-emerald-400" />
              Trending Templates
            </span>
            {showViewAll && (
              <Button
                variant="ghost"
                size="sm"
                className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                onClick={() => setShowLibrary(true)}
              >
                View All
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: maxItems }).map((_, i) => (
                <Skeleton key={i} className="h-40 rounded-xl bg-white/5" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {trendingTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onClick={() => handleTemplateClick(template)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <TemplateLibraryDialog
        open={showLibrary}
        onOpenChange={setShowLibrary}
        onSelectTemplate={handleLibrarySelect}
      />
    </>
  );
}
