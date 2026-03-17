import { useState, useEffect } from "react";
import { api } from "@/services/mockApi";
import { Timeline } from "@/components/Timeline";
import { toast } from "sonner";
import type { Contract, WorkflowStage } from "@/types";

const STAGES: WorkflowStage[] = ["Draft", "Review", "Redline", "Approval", "Signature", "Published"];

export default function WorkflowPage() {
  const [contract, setContract] = useState<Contract | null>(null);

  useEffect(() => {
    api.getContract().then(setContract);
  }, []);

  if (!contract) {
    return <div className="page-container"><h1 className="page-header">Workflow</h1><p className="text-muted-foreground">No contract uploaded.</p></div>;
  }

  const wf = contract.workflow;
  const currentIdx = STAGES.indexOf(wf.stage);

  const canAdvance = () => {
    const stageTasks = wf.tasks.filter((t) => {
      const tIdx = STAGES.indexOf(wf.stage);
      return tIdx >= 0;
    });
    return true; // Demo: always allow
  };

  const advanceStage = async () => {
    if (currentIdx >= STAGES.length - 1) return;
    const nextStage = STAGES[currentIdx + 1];
    const updated = {
      ...contract,
      workflow: {
        ...wf,
        stage: nextStage,
        history: [...wf.history, {
          time: new Date().toISOString(),
          stage: nextStage,
          actor: "Current User",
          note: `Advanced to ${nextStage}`,
        }],
      },
    };
    await api.saveContract(updated);
    setContract(updated);
    await api.addAuditEntry({ id: `a-${Date.now()}`, timestamp: new Date().toISOString(), action: "Workflow Advanced", detail: `Moved to ${nextStage}`, actor: "Current User" });
    toast.success(`Workflow advanced to ${nextStage}`);
  };

  const toggleTask = async (taskId: string) => {
    const updated = {
      ...contract,
      workflow: {
        ...wf,
        tasks: wf.tasks.map((t) =>
          t.id === taskId ? { ...t, status: t.status === "Done" ? "Todo" as const : t.status === "Todo" ? "Doing" as const : "Done" as const } : t
        ),
      },
    };
    await api.saveContract(updated);
    setContract(updated);
  };

  return (
    <div className="page-container">
      <h1 className="page-header">Workflow Automation</h1>

      {/* Stage Progress */}
      <div className="bg-card border rounded-lg p-5">
        <div className="flex items-center gap-1">
          {STAGES.map((stage, i) => (
            <div key={stage} className="flex items-center flex-1">
              <div className={`flex-1 text-center py-2 rounded-md text-xs font-semibold transition-colors ${
                i < currentIdx ? "bg-success/20 text-success" :
                i === currentIdx ? "bg-secondary text-secondary-foreground" :
                "bg-muted text-muted-foreground"
              }`}>
                {stage}
              </div>
              {i < STAGES.length - 1 && <div className={`w-4 h-0.5 ${i < currentIdx ? "bg-success" : "bg-muted"}`} />}
            </div>
          ))}
        </div>
        {currentIdx < STAGES.length - 1 && (
          <button onClick={advanceStage} className="mt-4 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:opacity-90">
            Advance to {STAGES[currentIdx + 1]}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks */}
        <div className="bg-card border rounded-lg overflow-hidden">
          <div className="p-4 border-b bg-muted/50">
            <h3 className="font-semibold text-sm">Tasks</h3>
          </div>
          <div className="divide-y">
            {wf.tasks.map((t) => (
              <div key={t.id} className="p-3 flex items-center gap-3">
                <button onClick={() => toggleTask(t.id)} className={`w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center text-xs ${
                  t.status === "Done" ? "bg-success border-success text-success-foreground" :
                  t.status === "Doing" ? "bg-warning border-warning text-warning-foreground" :
                  "border-border"
                }`}>
                  {t.status === "Done" ? "✓" : t.status === "Doing" ? "●" : ""}
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.assignee} · Due {t.dueDate}</p>
                </div>
                <span className={`status-chip ${t.status === "Done" ? "status-chip-success" : t.status === "Doing" ? "status-chip-warning" : "status-chip-info"}`}>
                  {t.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-card border rounded-lg p-4">
          <h3 className="font-semibold text-sm mb-4">Timeline</h3>
          <Timeline events={wf.history} />
        </div>
      </div>
    </div>
  );
}
