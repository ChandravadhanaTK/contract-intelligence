import { useState, useEffect } from "react";
import { Play, FileText, ChevronDown } from "lucide-react";
import { api } from "@/services/mockApi";
import type { AgentLog, Contract } from "@/types";
import { toast } from "sonner";

export default function AgentWorkspace() {
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [running, setRunning] = useState(false);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedContractId, setSelectedContractId] = useState<string>("all");

  useEffect(() => {
    api.getContracts().then(c => {
      setContracts(c);
    });
  }, []);

  const selectedContract = selectedContractId === "all" ? null : contracts.find(c => c.id === selectedContractId);

  const handleRun = async () => {
    setRunning(true);
    setLogs([]);
    await api.simulateAgents((log) => {
      setLogs((prev) => {
        const idx = prev.findIndex((l) => l.id === log.id);
        if (idx >= 0) { const n = [...prev]; n[idx] = log; return n; }
        return [...prev, log];
      });
    });
    setRunning(false);
    await api.addAuditEntry({ id: `a-${Date.now()}`, timestamp: new Date().toISOString(), action: "Agents Executed", detail: `All 5 agents completed processing on ${selectedContractId === "all" ? "all contracts" : selectedContract?.name || "contract"}`, actor: "System" });
    toast.success("All agents completed!");
  };

  const agents = ["Intake Agent", "Clause Matching Agent", "Redlining Agent", "Workflow Agent", "Compliance Agent"];

  return (
    <div className="page-container">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="page-header">Agent Workspace</h1>
        <button
          onClick={handleRun}
          disabled={running}
          className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          <Play className="w-4 h-4" /> {running ? "Running..." : "Run Agents"}
        </button>
      </div>

      {/* Document selector */}
      <div className="bg-card border rounded-lg p-4 flex items-center gap-3 flex-wrap">
        <FileText className="w-4 h-4 text-secondary" />
        <span className="text-sm font-medium text-foreground">Contract:</span>
        <div className="relative flex-1 max-w-md">
          <select
            value={selectedContractId}
            onChange={e => setSelectedContractId(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm bg-background appearance-none pr-8"
          >
            <option value="all">All Contracts</option>
            {contracts.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
        </div>
        {selectedContract && (
          <span className="text-xs text-muted-foreground">Uploaded: {selectedContract.uploadDate} · Status: {selectedContract.status}</span>
        )}
        {selectedContractId === "all" && (
          <span className="text-xs text-muted-foreground">Agents will run across all {contracts.length} contracts</span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-3">
          {agents.map((name) => {
            const agentLogs = logs.filter((l) => l.agentName === name);
            const isDone = agentLogs.some((l) => l.status === "DONE");
            const isRunning = agentLogs.some((l) => l.status === "RUNNING");
            return (
              <div key={name} className="bg-card border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm">{name}</span>
                  {isDone && <span className="status-chip status-chip-success">DONE</span>}
                  {isRunning && !isDone && <span className="status-chip status-chip-running">RUNNING</span>}
                  {!isRunning && !isDone && <span className="status-chip bg-muted text-muted-foreground">PENDING</span>}
                </div>
                {agentLogs.length > 0 && (
                  <div className="space-y-1 mt-2">
                    {agentLogs.map((l) => (
                      <p key={l.id} className="text-xs text-muted-foreground flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground">{new Date(l.timestamp).toLocaleTimeString()}</span>
                        {l.message}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="bg-card border rounded-lg overflow-hidden">
          <div className="p-4 border-b bg-muted/50">
            <h3 className="font-semibold text-sm">Run Logs {selectedContract ? `— ${selectedContract.name}` : ""}</h3>
          </div>
          <div className="p-4 max-h-[500px] overflow-y-auto font-mono text-xs space-y-1">
            {logs.length === 0 && <p className="text-muted-foreground">Click "Run Agents" to start...</p>}
            {logs.map((l) => (
              <div key={l.id + l.status} className="flex gap-2">
                <span className="text-muted-foreground w-20 flex-shrink-0">{new Date(l.timestamp).toLocaleTimeString()}</span>
                <span className={`w-16 flex-shrink-0 ${l.status === "DONE" ? "text-emerald-600" : l.status === "RUNNING" ? "text-indigo-600" : "text-muted-foreground"}`}>[{l.status}]</span>
                <span className="text-foreground">{l.agentName}: {l.message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
