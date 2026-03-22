import { useState, useEffect } from "react";
import { X, CheckCircle } from "lucide-react";
import type { ReviewRequest, ChecklistItem } from "@/types";
import { api } from "@/services/mockApi";

interface Props {
  request: ReviewRequest;
  onClose: () => void;
  onUpdate: (req: ReviewRequest) => void;
}

export function JobChecklistModal({ request, onClose, onUpdate }: Props) {
  const [checklist, setChecklist] = useState<ChecklistItem[]>(request.checklist);

  useEffect(() => {
    setChecklist(request.checklist);
  }, [request]);

  const toggle = async (id: string) => {
    const updated = checklist.map((c) => c.id === id ? { ...c, checked: !c.checked } : c);
    setChecklist(updated);
    const updatedReq = { ...request, checklist: updated };
    await api.saveChecklist(request.id, updated);
    await api.addAuditEntry({
      id: `a-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: "Checklist Updated",
      detail: `Toggled checklist item for Job ${request.jobNo}`,
      actor: "ChandravadhanaTK",
    });
    onUpdate(updatedReq);
  };

  const manualItems = checklist.filter((c) => c.section === "manual");
  const autoItems = checklist.filter((c) => c.section === "auto");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40">
      <div className="bg-card rounded-xl border shadow-lg w-full max-w-lg mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-foreground">Job Checklist – {request.jobNo}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-5 max-h-[60vh] overflow-y-auto">
          {/* Manual Review */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">For manual review</h3>
            <div className="space-y-2">
              {manualItems.map((item) => (
                <label key={item.id} className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-muted/50">
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => toggle(item.id)}
                    className="w-4 h-4 rounded border-border text-primary accent-primary"
                  />
                  <span className={`text-sm ${item.checked ? "line-through text-muted-foreground" : "text-foreground"}`}>
                    {item.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Auto */}
          <div className="bg-success/10 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-success" />
              Done by ContractCoPilot – Your AI Agent
            </h3>
            <p className="text-xs text-muted-foreground mb-3">These tasks have been automatically completed by the AI agent.</p>
            <div className="space-y-2">
              {autoItems.map((item) => (
                <label key={item.id} className="flex items-center gap-3 p-2">
                  <input type="checkbox" checked={item.checked} readOnly className="w-4 h-4 rounded accent-success" />
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end p-4 border-t">
          <button onClick={onClose} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
