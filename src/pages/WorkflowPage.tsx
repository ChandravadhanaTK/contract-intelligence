import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Eye, Pencil, MessageSquare } from "lucide-react";
import { api } from "@/services/mockApi";
import { Timeline } from "@/components/Timeline";
import { JobChecklistModal } from "@/components/JobChecklistModal";
import { ReviewWorkspace } from "@/components/ReviewWorkspace";
import { toast } from "sonner";
import type { Contract, ReviewDocument, ReviewRequest, WorkflowStage } from "@/types";

const STAGES: WorkflowStage[] = ["Draft", "Review", "Redline", "Approval", "Signature", "Published"];

const statusChipClass: Record<string, string> = {
  "Manual review": "status-chip-error",
  "On hold": "bg-muted text-muted-foreground",
  "Exception": "status-chip-warning",
  "Sent for approval": "status-chip-info",
};

export default function WorkflowPage() {
  const [searchParams] = useSearchParams();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedContractId, setSelectedContractId] = useState<string>("");
  const [documents, setDocuments] = useState<ReviewDocument[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>("");
  const [requests, setRequests] = useState<ReviewRequest[]>([]);
  const [search, setSearch] = useState("");
  const [showLoadReady, setShowLoadReady] = useState(false);
  const [checklistReq, setChecklistReq] = useState<ReviewRequest | null>(null);
  const [workspaceReq, setWorkspaceReq] = useState<ReviewRequest | null>(null);
  const [activeTab, setActiveTab] = useState<"workflow" | "review">("review");

  // Load contracts
  useEffect(() => {
    api.getContracts().then((c) => {
      setContracts(c);
      const saved = api.getSelectedContract();
      const initial = saved && c.find((x) => x.id === saved) ? saved : c[0]?.id || "";
      setSelectedContractId(initial);
    });
  }, []);

  // Load documents when contract changes
  useEffect(() => {
    if (!selectedContractId) return;
    api.setSelectedContract(selectedContractId);
    api.getReviewDocuments(selectedContractId).then((d) => {
      setDocuments(d);
      const saved = api.getSelectedDocument();
      const initial = saved && d.find((x) => x.id === saved) ? saved : d[0]?.id || "";
      setSelectedDocId(initial);
    });
  }, [selectedContractId]);

  // Load requests when document changes
  useEffect(() => {
    if (!selectedDocId) return;
    api.setSelectedDocument(selectedDocId);
    api.getReviewRequests(selectedContractId, selectedDocId).then(setRequests);
  }, [selectedContractId, selectedDocId]);

  // Apply filter from dashboard
  useEffect(() => {
    const filter = searchParams.get("filter");
    if (filter) {
      setActiveTab("review");
      if (filter === "loadReady") {
        setShowLoadReady(true);
      } else {
        setSearch(filter);
      }
    }
  }, [searchParams]);

  const contract = contracts.find((c) => c.id === selectedContractId);
  const currentDoc = documents.find((d) => d.id === selectedDocId);

  const filteredRequests = useMemo(() => {
    let filtered = requests;
    if (showLoadReady) filtered = filtered.filter((r) => r.loadReady);
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter((r) =>
        r.jobNo.toLowerCase().includes(s) ||
        r.eventType.toLowerCase().includes(s) ||
        r.status.toLowerCase().includes(s) ||
        r.mpin.toLowerCase().includes(s) ||
        r.tin.toLowerCase().includes(s)
      );
    }
    return filtered;
  }, [requests, showLoadReady, search]);

  const handleRequestUpdate = (updated: ReviewRequest) => {
    setRequests((prev) => prev.map((r) => r.id === updated.id ? updated : r));
    if (workspaceReq?.id === updated.id) setWorkspaceReq(updated);
    if (checklistReq?.id === updated.id) setChecklistReq(updated);
  };

  // Workflow stage logic
  const wf = contract?.workflow;
  const currentIdx = wf ? STAGES.indexOf(wf.stage) : 0;

  const advanceStage = async () => {
    if (!contract || !wf || currentIdx >= STAGES.length - 1) return;
    const nextStage = STAGES[currentIdx + 1];
    const updated: Contract = {
      ...contract,
      workflow: {
        ...wf,
        stage: nextStage,
        history: [...wf.history, { time: new Date().toISOString(), stage: nextStage, actor: "ChandravadhanaTK", note: `Advanced to ${nextStage}` }],
      },
    };
    await api.saveContract(updated);
    setContracts((prev) => prev.map((c) => c.id === updated.id ? updated : c));
    await api.addAuditEntry({ id: `a-${Date.now()}`, timestamp: new Date().toISOString(), action: "Workflow Advanced", detail: `Moved to ${nextStage}`, actor: "ChandravadhanaTK" });
    toast.success(`Workflow advanced to ${nextStage}`);
  };

  const toggleTask = async (taskId: string) => {
    if (!contract || !wf) return;
    const updated: Contract = {
      ...contract,
      workflow: {
        ...wf,
        tasks: wf.tasks.map((t) =>
          t.id === taskId ? { ...t, status: t.status === "Done" ? "Todo" as const : t.status === "Todo" ? "Doing" as const : "Done" as const } : t
        ),
      },
    };
    await api.saveContract(updated);
    setContracts((prev) => prev.map((c) => c.id === updated.id ? updated : c));
  };

  if (contracts.length === 0) {
    return <div className="page-container"><h1 className="page-header">Workflow</h1><p className="text-muted-foreground">No contracts available.</p></div>;
  }

  // If in workspace view
  if (workspaceReq) {
    return (
      <div className="page-container">
        <h1 className="page-header">Review Workspace – {workspaceReq.jobNo}</h1>
        <ReviewWorkspace
          request={workspaceReq}
          document={currentDoc || null}
          onBack={() => setWorkspaceReq(null)}
          onRequestUpdate={handleRequestUpdate}
        />
      </div>
    );
  }

  return (
    <div className="page-container">
      <h1 className="page-header">Workflow Automation</h1>

      {/* Contract & Document Selectors */}
      <div className="flex flex-wrap gap-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Select Contract</label>
          <select
            value={selectedContractId}
            onChange={(e) => setSelectedContractId(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm bg-background min-w-[300px]"
          >
            {contracts.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Document Under Review</label>
          <select
            value={selectedDocId}
            onChange={(e) => setSelectedDocId(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm bg-background min-w-[250px]"
          >
            {documents.map((d) => (
              <option key={d.id} value={d.id}>{d.name} ({d.status})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        <button
          onClick={() => setActiveTab("workflow")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "workflow" ? "border-secondary text-secondary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Workflow
        </button>
        <button
          onClick={() => setActiveTab("review")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "review" ? "border-secondary text-secondary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Review Dashboard
        </button>
      </div>

      {activeTab === "workflow" && wf && (
        <>
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
              <div className="p-4 border-b bg-muted/50"><h3 className="font-semibold text-sm">Tasks</h3></div>
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
        </>
      )}

      {activeTab === "review" && (
        <>
          {/* Search + Toggle */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm bg-background"
                placeholder="Search jobs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={showLoadReady}
                onChange={(e) => setShowLoadReady(e.target.checked)}
                className="w-4 h-4 rounded accent-primary"
              />
              Show Load Ready
            </label>
            <span className="text-xs text-muted-foreground">{filteredRequests.length} requests</span>
          </div>

          {/* Queue Table */}
          <div className="bg-card border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Job No</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Event Type</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Effective Date</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">MPIN</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">TIN</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((r) => (
                    <tr key={r.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <button onClick={() => { setChecklistReq(r); api.addAuditEntry({ id: `a-${Date.now()}`, timestamp: new Date().toISOString(), action: "Opened Checklist", detail: `Opened checklist for Job ${r.jobNo}`, actor: "ChandravadhanaTK" }); }} className="text-secondary font-medium hover:underline">
                          {r.jobNo}
                        </button>
                      </td>
                      <td className="px-4 py-3">{r.eventType}</td>
                      <td className="px-4 py-3">{r.effectiveDate}</td>
                      <td className="px-4 py-3">{r.mpin}</td>
                      <td className="px-4 py-3">{r.tin}</td>
                      <td className="px-4 py-3">
                        <span className={`status-chip ${statusChipClass[r.status] || ""}`}>{r.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => setWorkspaceReq(r)} className="p-1 hover:bg-muted rounded" title="View">
                            <Eye className="w-4 h-4 text-muted-foreground" />
                          </button>
                          <button onClick={() => setChecklistReq(r)} className="p-1 hover:bg-muted rounded" title="Edit">
                            <Pencil className="w-4 h-4 text-muted-foreground" />
                          </button>
                          <button onClick={() => setWorkspaceReq(r)} className="p-1 hover:bg-muted rounded" title="Chat">
                            <MessageSquare className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredRequests.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No requests found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Job Checklist Modal */}
      {checklistReq && (
        <JobChecklistModal
          request={checklistReq}
          onClose={() => setChecklistReq(null)}
          onUpdate={handleRequestUpdate}
        />
      )}
    </div>
  );
}
