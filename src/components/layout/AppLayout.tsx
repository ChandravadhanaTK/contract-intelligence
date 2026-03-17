import { AppSidebar } from "./AppSidebar";
import { AuditLogDrawer } from "../AuditLogDrawer";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-12 flex items-center justify-between px-6 border-b bg-card">
          <div />
          <div className="flex items-center gap-3">
            <span className="status-chip status-chip-success">● Running</span>
            <AuditLogDrawer />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
