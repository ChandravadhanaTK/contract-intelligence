import { AppSidebar } from "./AppSidebar";
import { AuditLogDrawer } from "../AuditLogDrawer";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { ChevronDown, Activity, LogOut } from "lucide-react";

interface Props {
  children: React.ReactNode;
  onLogout: () => void;
}

export function AppLayout({ children, onLogout }: Props) {
  const { currentUser, currentRole, users, switchUser } = useCurrentUser();

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-12 flex items-center justify-between px-6 border-b bg-card">
          <div />
          <div className="flex items-center gap-3">
            <div className="relative flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                  {currentUser?.name?.charAt(0) || "?"}
                </div>
                <div className="relative">
                  <select
                    value={currentUser?.id || ""}
                    onChange={e => switchUser(e.target.value)}
                    className="appearance-none bg-transparent text-xs font-medium text-foreground pr-5 cursor-pointer focus:outline-none"
                  >
                    {users.filter(u => u.status === "Active").map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-3 h-3 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
                </div>
              </div>
              {currentRole && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary/20 text-secondary-foreground font-medium">{currentRole.name}</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
              <Activity className="w-3.5 h-3.5 animate-pulse" />
            </div>
            <AuditLogDrawer />
            <button onClick={onLogout} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground" title="Sign Out">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
