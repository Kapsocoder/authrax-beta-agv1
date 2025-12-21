import { useNavigate } from "react-router-dom";
import { useNavigationGuard } from "@/contexts/NavigationGuardContext";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useState } from "react";

export function UnsavedChangesDialog() {
  const navigate = useNavigate();
  const { showDialog, setShowDialog, pendingPath, setPendingPath, onSaveRef, setHasUnsavedChanges } = useNavigationGuard();
  const [isSaving, setIsSaving] = useState(false);

  const handleDiscard = () => {
    setShowDialog(false);
    setHasUnsavedChanges(false);
    if (pendingPath) {
      navigate(pendingPath);
      setPendingPath(null);
    }
  };

  const handleSave = async () => {
    if (onSaveRef.current) {
      setIsSaving(true);
      try {
        await onSaveRef.current();
        setShowDialog(false);
        setHasUnsavedChanges(false);
        if (pendingPath) {
          navigate(pendingPath);
          setPendingPath(null);
        }
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleCancel = () => {
    setShowDialog(false);
    setPendingPath(null);
  };

  return (
    <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
          <AlertDialogDescription>
            You have unsaved changes. Would you like to save your draft before leaving?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDiscard}>
            Discard
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !onSaveRef.current}>
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save & Leave"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
