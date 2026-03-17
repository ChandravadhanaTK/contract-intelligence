import { useState, useEffect } from "react";
import { AlertTriangle, CheckCircle, Clock, ShieldCheck } from "lucide-react";
import { KPIStatCard } from "@/components/KPIStatCard";
import { api } from "@/services/mockApi";
import { toast } from "sonner";
import type { Contract, Obligation } from "@/types";

export default function ObligationCompliance() {
  const [contract, setContract] = useState<Contract | null>(null);
  const [filter, setFilter] = useState<"all" | "Open" | "InProgress" | "Compliant" | "Overdue">("all");
  const [evidenceInput, setEvidenceInput] = useState<Record<string, string>>({});

  useEffect(() => {
    api.getContract().then(setContract);
  }, []);

  if (!contract) {
    return <div className="page-container"><h1 className="page-header">Obligation Compliance</h1><p className="text-muted-foreground">No contract loaded.</p></div>;
  }

  const obligations = contract.obligations;
  const overdue = obligations.filter((o) => o.status === "Overdue");
  const open = obligations.filter((o) => o.status === "Open");
  const compliant = obligations.filter((o) => o.status === "Compliant");
  const inProgress = obligations.filter((o) => o.status === "InProgress");

  const filtered = filter === "all" ? obligations : obligations.filter((o) => o.status === filter);

  const markCompliant = async (oblId: string) => {
    const updated = {
      ...contract,
      obligations: contract.obligations.map((o) =>
        o.id === oblId ? { ...o, status: "Compliant" as const } : o
      ),
    };
    await api.saveContract(updated);
    setContract(updated);
    toast.success("Marked as compliant");
  };

  const addEvidence = async (oblId: string) => {
    const link = evidenceInput[oblId];
    if (!link) return;
    const updated = {
      ...contract,
      obligations: contract.obligations.map((o) =>
        o.id === oblId ? { ...o, evidenceLinks: [...o.evidenceLinks, link] } : o
      ),
    };
    await api.saveContract(updated);
    setContract(updated);
    setEvidenceInput((prev) => ({ ...prev, [oblId]: "" }));
    toast.success("Evidence link added");
  };

  return (
    <div className="page-container">
      <h1 className="page-header">Obligation Compliance</h1>

      {overdue.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" />
          <p className="text-sm font-medium text-destructive">{overdue.length} obligation(s) are overdue and require immediate attention</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPIStatCard title="Open" value={open.length} variant="default" icon={<Clock className="w-5 h-5" />} />
        <KPIStatCard title="In Progress" value={inProgress.length} variant="warning" icon={<Clock className="w-5 h-5" />} />
        <KPIStatCard title="Compliant" value={compliant.length} variant="success" icon={<CheckCircle className="w-5 h-5" />} />
        <KPIStatCard title="Overdue" value={overdue.length} variant="error" icon={<AlertTriangle className="w-5 h-5" />} />
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(["all", "Open", "InProgress", "Compliant", "Overdue"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {f === "all" ? "All" : f === "InProgress" ? "In Progress" : f}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-semibold">Title</th>
                <th className="text-left p-3 font-semibold">Owner</th>
                <th className="text-left p-3 font-semibold">Due Date</th>
                <th className="text-left p-3 font-semibold">Frequency</th>
                <th className="text-left p-3 font-semibold">Status</th>
                <th className="text-left p-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((o) => (
                <tr key={o.id} className="hover:bg-muted/20">
                  <td className="p-3">
                    <p className="font-medium">{o.title}</p>
                    <p className="text-xs text-muted-foreground">{o.description}</p>
                  </td>
                  <td className="p-3">{o.owner}</td>
                  <td className="p-3">{o.dueDate}</td>
                  <td className="p-3">{o.frequency}</td>
                  <td className="p-3">
                    <span className={`status-chip ${
                      o.status === "Compliant" ? "status-chip-success" :
                      o.status === "Overdue" ? "status-chip-error" :
                      o.status === "InProgress" ? "status-chip-warning" :
                      "status-chip-info"
                    }`}>{o.status}</span>
                  </td>
                  <td className="p-3">
                    <div className="space-y-2">
                      {o.status !== "Compliant" && (
                        <button onClick={() => markCompliant(o.id)} className="text-xs bg-success/10 text-success px-2 py-1 rounded hover:bg-success/20 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> Mark Compliant
                        </button>
                      )}
                      <div className="flex gap-1">
                        <input
                          className="border rounded px-2 py-1 text-xs bg-background w-32"
                          placeholder="Evidence URL"
                          value={evidenceInput[o.id] || ""}
                          onChange={(e) => setEvidenceInput((p) => ({ ...p, [o.id]: e.target.value }))}
                        />
                        <button onClick={() => addEvidence(o.id)} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded hover:bg-primary/20">Add</button>
                      </div>
                      {o.evidenceLinks.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {o.evidenceLinks.map((link, i) => (
                            <a key={i} href={link} target="_blank" rel="noopener noreferrer" className="text-xs text-secondary underline">Evidence {i + 1}</a>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
