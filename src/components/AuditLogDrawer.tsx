import { useState, useEffect } from "react";
import { ScrollText, X } from "lucide-react";
import { api } from "@/services/mockApi";
import type { AuditEntry } from "@/types";

export function AuditLogDrawer() {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<AuditEntry[]>([]);

  useEffect(() => {
    if (open) {
      api.getAuditLog().then(setEntries);
    }
  }, [open]);

  return (
    <>
      <button onClick={() => setOpen(true)} className="sidebar-nav-item sidebar-nav-item-inactive text-foreground border rounded-md px-3 py-1.5 text-xs">
        <ScrollText className="w-3.5 h-3.5" />
        Audit Log
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-foreground/20" onClick={() => setOpen(false)} />
          <div className="relative w-96 bg-card border-l shadow-xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold">Audit Log</h3>
              <button onClick={() => setOpen(false)}><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {entries.length === 0 && <p className="text-sm text-muted-foreground">No entries yet.</p>}
              {entries.map((e) => (
                <div key={e.id} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-sm font-medium">{e.action}</span>
                    <span className="text-xs text-muted-foreground">{new Date(e.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{e.detail}</p>
                  <p className="text-xs text-muted-foreground mt-1">By: {e.actor}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
