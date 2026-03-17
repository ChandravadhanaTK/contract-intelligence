import { useState, useEffect } from "react";
import { api } from "@/services/mockApi";
import { DiffViewer } from "@/components/DiffViewer";
import { toast } from "sonner";
import type { Contract, Clause, ClauseVersion } from "@/types";

export default function Redlining() {
  const [contract, setContract] = useState<Contract | null>(null);
  const [selectedClause, setSelectedClause] = useState<Clause | null>(null);
  const [versions, setVersions] = useState<ClauseVersion[]>([]);
  const [editedText, setEditedText] = useState("");
  const [proposedText, setProposedText] = useState("");

  useEffect(() => {
    api.getContract().then(setContract);
    api.getClauseVersions().then(setVersions);
  }, []);

  const nonAligned = contract?.clauses.filter((c) => c.category === "nonAligned") || [];

  const handleSelect = (clause: Clause) => {
    setSelectedClause(clause);
    setEditedText(clause.currentText);
    setProposedText(clause.standardText);
  };

  const handleAccept = async () => {
    if (!selectedClause || !contract) return;
    const version: ClauseVersion = {
      id: `cv-${Date.now()}`,
      clauseId: selectedClause.id,
      contractId: contract.id,
      originalText: selectedClause.currentText,
      proposedText,
      acceptedText: proposedText,
      status: "accepted",
      timestamp: new Date().toISOString(),
    };
    await api.saveClauseVersion(version);
    setVersions((v) => [...v, version]);
    toast.success("Change accepted");
  };

  const handleReject = async () => {
    if (!selectedClause || !contract) return;
    const version: ClauseVersion = {
      id: `cv-${Date.now()}`,
      clauseId: selectedClause.id,
      contractId: contract.id,
      originalText: selectedClause.currentText,
      proposedText,
      acceptedText: null,
      status: "rejected",
      timestamp: new Date().toISOString(),
    };
    await api.saveClauseVersion(version);
    setVersions((v) => [...v, version]);
    toast.info("Change rejected");
  };

  const handleSaveVersion = async () => {
    if (!selectedClause || !contract) return;
    const version: ClauseVersion = {
      id: `cv-${Date.now()}`,
      clauseId: selectedClause.id,
      contractId: contract.id,
      originalText: selectedClause.currentText,
      proposedText: editedText,
      acceptedText: null,
      status: "pending",
      timestamp: new Date().toISOString(),
    };
    await api.saveClauseVersion(version);
    setVersions((v) => [...v, version]);
    toast.success("Version saved");
  };

  const clauseVersions = versions.filter((v) => v.clauseId === selectedClause?.id);

  return (
    <div className="page-container">
      <h1 className="page-header">Redlining</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Clause List */}
        <div className="bg-card border rounded-lg overflow-hidden">
          <div className="p-3 border-b bg-muted/50">
            <h3 className="text-sm font-semibold">Non-Aligned Clauses</h3>
          </div>
          <div className="divide-y">
            {nonAligned.map((c) => (
              <button
                key={c.id}
                onClick={() => handleSelect(c)}
                className={`w-full text-left p-3 hover:bg-muted/30 transition-colors ${
                  selectedClause?.id === c.id ? "bg-accent" : ""
                }`}
              >
                <p className="text-xs text-muted-foreground">{c.articleName}</p>
                <p className="text-sm font-medium">{c.clauseName}</p>
              </button>
            ))}
            {nonAligned.length === 0 && <p className="p-3 text-sm text-muted-foreground">No clauses to redline</p>}
          </div>
        </div>

        {/* Editor */}
        <div className="lg:col-span-3 space-y-4">
          {!selectedClause ? (
            <div className="bg-card border rounded-lg p-8 text-center text-muted-foreground">
              Select a clause to begin redlining
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold">{selectedClause.clauseName}</h2>
                <span className="status-chip status-chip-error">Score: {selectedClause.matchScore}/5</span>
              </div>

              <DiffViewer original={editedText} proposed={proposedText} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium block mb-1.5">Edit Current Text</label>
                  <textarea className="w-full border rounded-lg px-3 py-2 text-sm bg-background h-32 resize-none" value={editedText} onChange={(e) => setEditedText(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">Proposed Text</label>
                  <textarea className="w-full border rounded-lg px-3 py-2 text-sm bg-background h-32 resize-none" value={proposedText} onChange={(e) => setProposedText(e.target.value)} />
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={handleAccept} className="px-4 py-2 bg-success text-success-foreground rounded-lg text-sm font-medium hover:opacity-90">Accept Change</button>
                <button onClick={handleReject} className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm font-medium hover:opacity-90">Reject Change</button>
                <button onClick={handleSaveVersion} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90">Save Version</button>
              </div>

              {/* Version History */}
              {clauseVersions.length > 0 && (
                <div className="bg-card border rounded-lg p-4">
                  <h3 className="text-sm font-semibold mb-3">Version History</h3>
                  <div className="space-y-2">
                    {clauseVersions.map((v) => (
                      <div key={v.id} className="flex items-center gap-3 text-sm border rounded-md p-2">
                        <span className={`status-chip ${v.status === "accepted" ? "status-chip-success" : v.status === "rejected" ? "status-chip-error" : "status-chip-info"}`}>
                          {v.status}
                        </span>
                        <span className="text-muted-foreground text-xs">{new Date(v.timestamp).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
