import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { Sidebar } from "./Sidebar";
import { UnsavedChangesDialog } from "./UnsavedChangesDialog";

interface AppLayoutProps {
  children: ReactNode;
  onLogout?: () => void;
}

export function AppLayout({ children, onLogout }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background dark">
      <Sidebar onLogout={onLogout} />
      <main className="md:ml-64 min-h-screen pb-20 md:pb-0">
        {children}
      </main>
      <BottomNav />
      <UnsavedChangesDialog />
    </div>
  );
}
