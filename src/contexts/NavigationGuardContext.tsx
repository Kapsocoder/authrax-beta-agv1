import { createContext, useContext, useState, useCallback, ReactNode, useRef } from "react";

interface NavigationGuardContextType {
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: (value: boolean) => void;
  pendingPath: string | null;
  setPendingPath: (path: string | null) => void;
  showDialog: boolean;
  setShowDialog: (value: boolean) => void;
  onSaveRef: React.MutableRefObject<(() => Promise<void>) | null>;
  setOnSave: (fn: (() => Promise<void>) | null) => void;
  requestNavigation: (path: string) => boolean;
}

const NavigationGuardContext = createContext<NavigationGuardContextType | null>(null);

export function NavigationGuardProvider({ children }: { children: ReactNode }) {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const onSaveRef = useRef<(() => Promise<void>) | null>(null);

  const setOnSave = useCallback((fn: (() => Promise<void>) | null) => {
    onSaveRef.current = fn;
  }, []);

  const requestNavigation = useCallback((path: string): boolean => {
    if (hasUnsavedChanges) {
      setPendingPath(path);
      setShowDialog(true);
      return false;
    }
    return true;
  }, [hasUnsavedChanges]);

  return (
    <NavigationGuardContext.Provider
      value={{
        hasUnsavedChanges,
        setHasUnsavedChanges,
        pendingPath,
        setPendingPath,
        showDialog,
        setShowDialog,
        onSaveRef,
        setOnSave,
        requestNavigation,
      }}
    >
      {children}
    </NavigationGuardContext.Provider>
  );
}

export function useNavigationGuard() {
  const context = useContext(NavigationGuardContext);
  if (!context) {
    throw new Error("useNavigationGuard must be used within NavigationGuardProvider");
  }
  return context;
}
