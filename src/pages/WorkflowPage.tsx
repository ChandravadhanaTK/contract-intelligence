import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Search, Eye, Pencil, MessageSquare, ArrowRight, Shield, Play, FileText, ChevronDown } from "lucide-react";
import { api } from "@/services/mockApi";
import { Timeline } from "@/components/Timeline";
import { JobChecklistModal } from "@/components/JobChecklistModal";
import { ReviewWorkspace } from "@/components/ReviewWorkspace";
import { toast } from "sonner";
import type { Contract, ReviewDocument, ReviewRequest, WorkflowStage, IntegrityFinding, AgentLog } from "@/types";

function get<T>(key: string, fb: T): T { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fb; }

const STAGES: WorkflowStage[] = ["Draft", "Review", "Redline", "Approval", "Signature", "Published"];

const statusChipClass: Record<string, string> = {
  "Manual review": "status-chip-error",
  "On hold": "bg-muted text-muted-foreground",
  "Exception": "status-chip-warning",
  "Sent for approval": "status-chip-info",
};

export default function WorkflowPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedContractId, setSelectedContractId] = useState<string>("");
  const [documents, setDocuments] = useState<ReviewDocument[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>("");
  const [requests, setRequests] = useState<ReviewRequest[]>([]);
  const [search, setSearch] = useState("");
  const [showLoadReady, setShowLoadReady] = useState(false);
  const [checklistReq, setChecklistReq] = useState<ReviewRequest | null>(null);
  const [workspaceReq, setWorkspaceReq] = useState<ReviewRequest | null>(null);
  const [activeTab, setActiveTab] = useState<"workflow" | "review" | "hitl" | "agents">("review");

  // Agent workspace state
  const [agentLogs, setAgentLogs] = useState<AgentLog[]>([]);
  const [agentRunning, setAgentRunning] = useState(false);
  const [agentContractId, setAgentContractId] = useState<string>("all");

  // HITL items
  const [hitlItems, setHitlItems] = useState<any[]>([]);

  useEffect(() => {
    api.getContracts().then((c) => {
      setContracts(c);
      const saved = api.getSelectedContract();
      const initial = saved && c.find((x) => x.id === saved) ? saved : c[0]?.id || "";
      setSelectedContractId(initial);
    });
  }, []);

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

  useEffect(() => {
    if (!selectedDocId) return;
    api.setSelectedDocument(selectedDocId);
    api.getReviewRequests(selectedContractId, selectedDocId).then(setRequests);
  }, [selectedContractId, selectedDocId]);

  useEffect(() => {
    const filter = searchParams.get("filter");
    if (filter) {
      setActiveTab("review");
      if (filter === "loadReady") setShowLoadReady(true);
      else setSearch(filter);
    }
  }, [searchParams]);

  // Build HITL aggregated items
  useEffect(() => {
    const findings = get<IntegrityFinding[]>("oci_integrity_findings", []).filter(f => f.status === "Open" && f.contractId === selectedContractId);
    const exceptions = requests.filter(r => r.status === "Exception");
    const items: any[] = [
      ...findings.map(f => ({ id: f.id, type: "integrity" as const, title: f.title, detail: f.description, severity: f.severity, source: "Integrity Validation" })),
      ...exceptions.map(r => ({ id: r.id, type: "exception" as const, title: `Exception: ${r.jobNo}`, detail: r.eventType, severity: "Medium", source: "Review Queue" })),
    ];
    setHitlItems(items);
  }, [selectedContractId, requests]);

  const contract = contracts.find((c) => c.id === selectedContractId);
  const currentDoc = documents.find((d) => d.id === selectedDocId);

  const filteredRequests = useMemo(() => {
    let filtered = requests;
    if (showLoadReady) filtered = filtered.filter((r) => r.loadReady);
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter((r) =>
        r.jobNo.toLowerCase().includes(s) || r.eventType.toLowerCase().includes(s) ||
        r.status.toLowerCase().includes(s) || r.mpin.toLowerCase().includes(s) || r.tin.toLowerCase().includes(s)
      );
    }
    return filtered;
  }, [requests, showLoadReady, search]);

  const handleRequestUpdate = (updated: ReviewRequest) => {
    setRequests((prev) => prev.map((r) => r.id === updated.id ? updated : r));
    if (workspaceReq?.id === updated.id) setWorkspaceReq(updated);
    if (checklistReq?.id === updated.id) setChecklistReq(updated);
  };

  const wf = contract?.workflow;
  const currentIdx = wf ? STAGES.indexOf(wf.stage) : 0;

  const advanceStage = async () => {
    if (!contract || !wf || currentIdx >= STAGES.length - 1) return;
    const nextStage = STAGES[currentIdx + 1];
    const updated: Contract = { ...contract, workflow: { ...wf, stage: nextStage, history: [...wf.history, { time: new Date().toISOString(), stage: nextStage, actor: "ChandravadhanaTK", note: `Advanced to ${nextStage}` }] } };
    await api.saveContract(updated);
    setContracts((prev) => prev.map((c) => c.id === updated.id ? updated : c));
    await api.addAuditEntry({ id: `a-${Date.now()}`, timestamp: new Date().toISOString(), action: "Workflow Advanced", detail: `Moved to ${nextStage}`, actor: "ChandravadhanaTK" });
    toast.success(`Workflow advanced to ${nextStage}`);
  };

  const toggleTask = async (taskId: string) => {
    if (!contract || !wf) return;
    const updated: Contract = { ...contract, workflow: { ...wf, tasks: wf.tasks.map((t) =>
      t.id === taskId ? { ...t, status: t.status === "Done" ? "Todo" as const : t.status === "Todo" ? "Doing" as const : "Done" as const } : t
    ) } };
    await api.saveContract(updated);
    setContracts((prev) => prev.map((c) => c.id === updated.id ? updated : c));
  };

  const handleHitlAction = (itemId: string, action: string, reason: string) => {
    const overrides = get<any[]>("oci_hitl_overrides", []);
    overrides.push({ id: `override-${Date.now()}`, sourceId: itemId, action, reason, actor: "ChandravadhanaTK", time: new Date().toISOString() });
    localStorage.setItem("oci_hitl_overrides", JSON.stringify(overrides));
    api.addAuditEntry({ id: `a-${Date.now()}`, timestamp: new Date().toISOString(), action: `HITL ${action}`, detail: `Item ${itemId}: ${reason}`, actor: "ChandravadhanaTK" });
    setHitlItems(prev => prev.filter(i => i.id !== itemId));
    toast.success(`Item ${action.toLowerCase()}d`);
  };

  if (contracts.length === 0) return <div className="page-container"><h1 className="page-header">Workflow</h1><p className="text-muted-foreground">No contracts available.</p></div>;

  if (workspaceReq) {
    return (
      <div className="page-container">
        <h1 className="page-header">Review Workspace – {workspaceReq.jobNo}</h1>
        <ReviewWorkspace request={workspaceReq} document={currentDoc || null} onBack={() => setWorkspaceReq(null)} onRequestUpdate={handleRequestUpdate} />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="page-header">Workflow Automation</h1>
        <div className="flex gap-2">
          <button onClick={() => navigate("/intake")} className="flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-medium hover:bg-muted">
            <ArrowRight className="w-3 h-3" /> View Intake & Triage
          </button>
          <button onClick={() => navigate("/credentialing")} className="flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-medium hover:bg-muted">
            <Shield className="w-3 h-3" /> Credentialing Gate
          </button>
        </div>
      </div>

      {/* Contract & Document Selectors */}
      <div className="flex flex-wrap gap-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Select Contract</label>
          <select value={selectedContractId} onChange={(e) => setSelectedContractId(e.target.value)} className="border rounded-lg px-3 py-2 text-sm bg-background min-w-[300px]">
            {contracts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Document Under Review</label>
          <select value={selectedDocId} onChange={(e) => setSelectedDocId(e.target.value)} className="border rounded-lg px-3 py-2 text-sm bg-background min-w-[250px]">
            {documents.map((d) => <option key={d.id} value={d.id}>{d.name} ({d.status})</option>)}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {(["workflow", "review", "hitl"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? "border-secondary text-secondary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {tab === "workflow" ? "Workflow" : tab === "review" ? "Review Dashboard" : `HITL Center (${hitlItems.length})`}
          </button>
        ))}
      </div>

      {activeTab === "workflow" && wf && (
        <>
          <div className="bg-card border rounded-lg p-5">
            <div className="flex items-center gap-1">
              {STAGES.map((stage, i) => (
                <div key={stage} className="flex items-center flex-1">
                  <div className={`flex-1 text-center py-2 rounded-md text-xs font-semibold transition-colors ${i < currentIdx ? "bg-success/20 text-success" : i === currentIdx ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground"}`}>{stage}</div>
                  {i < STAGES.length - 1 && <div className={`w-4 h-0.5 ${i < currentIdx ? "bg-success" : "bg-muted"}`} />}
                </div>
              ))}
            </div>
            {currentIdx < STAGES.length - 1 && (
              <button onClick={advanceStage} className="mt-4 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:opacity-90">Advance to {STAGES[currentIdx + 1]}</button>
            )}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card border rounded-lg overflow-hidden">
              <div className="p-4 border-b bg-muted/50"><h3 className="font-semibold text-sm">Tasks</h3></div>
              <div className="divide-y">
                {wf.tasks.map((t) => (
                  <div key={t.id} className="p-3 flex items-center gap-3">
                    <button onClick={() => toggleTask(t.id)} className={`w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center text-xs ${t.status === "Done" ? "bg-success border-success text-success-foreground" : t.status === "Doing" ? "bg-warning border-warning text-warning-foreground" : "border-border"}`}>
                      {t.status === "Done" ? "✓" : t.status === "Doing" ? "●" : ""}
                    </button>
                    <div className="flex-1 min-w-0"><p className="text-sm font-medium">{t.name}</p><p className="text-xs text-muted-foreground">{t.assignee} · Due {t.dueDate}</p></div>
                    <span className={`status-chip ${t.status === "Done" ? "status-chip-success" : t.status === "Doing" ? "status-chip-warning" : "status-chip-info"}`}>{t.status}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-card border rounded-lg p-4">
              <h3 className="font-semibold text-sm mb-4">Timeline</h3>
              <Timeline events={wf.history} />
            </div>
          </div>
        </>
      )}

      {activeTab === "review" && (
        <>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm bg-background" placeholder="Search jobs..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={showLoadReady} onChange={(e) => setShowLoadReady(e.target.checked)} className="w-4 h-4 rounded accent-primary" />
              Show Load Ready
            </label>
            <span className="text-xs text-muted-foreground">{filteredRequests.length} requests</span>
          </div>
          <div className="bg-card border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Job No</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Event Type</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Effective Date</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">MPIN</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">TIN</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Actions</th>
                </tr></thead>
                <tbody>
                  {filteredRequests.map((r) => (
                    <tr key={r.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3"><button onClick={() => { setChecklistReq(r); api.addAuditEntry({ id: `a-${Date.now()}`, timestamp: new Date().toISOString(), action: "Opened Checklist", detail: `Opened checklist for Job ${r.jobNo}`, actor: "ChandravadhanaTK" }); }} className="text-secondary font-medium hover:underline">{r.jobNo}</button></td>
                      <td className="px-4 py-3">{r.eventType}</td>
                      <td className="px-4 py-3">{r.effectiveDate}</td>
                      <td className="px-4 py-3">{r.mpin}</td>
                      <td className="px-4 py-3">{r.tin}</td>
                      <td className="px-4 py-3"><span className={`status-chip ${statusChipClass[r.status] || ""}`}>{r.status}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => setWorkspaceReq(r)} className="p-1 hover:bg-muted rounded" title="View"><Eye className="w-4 h-4 text-muted-foreground" /></button>
                          <button onClick={() => setChecklistReq(r)} className="p-1 hover:bg-muted rounded" title="Edit"><Pencil className="w-4 h-4 text-muted-foreground" /></button>
                          <button onClick={() => setWorkspaceReq(r)} className="p-1 hover:bg-muted rounded" title="Chat"><MessageSquare className="w-4 h-4 text-muted-foreground" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredRequests.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No requests found</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === "hitl" && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Unified review center for pending items across extraction, integrity, and mapping.</p>
          {hitlItems.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No pending items requiring review.</p>}
          {hitlItems.map(item => (
            <HITLItemCard key={item.id} item={item} onAction={handleHitlAction} />
          ))}
        </div>
      )}

      {checklistReq && <JobChecklistModal request={checklistReq} onClose={() => setChecklistReq(null)} onUpdate={handleRequestUpdate} />}
    </div>
  );
}

function HITLItemCard({ item, onAction }: { item: any; onAction: (id: string, action: string, reason: string) => void }) {
  const [reason, setReason] = useState("");
  const [showOverride, setShowOverride] = useState(false);
  return (
    <div className="bg-card border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className={`status-chip ${item.severity === "Critical" ? "status-chip-error" : item.severity === "High" ? "status-chip-warning" : "status-chip-info"}`}>{item.severity}</span>
        <span className="font-medium text-sm">{item.title}</span>
        <span className="text-xs text-muted-foreground ml-auto">{item.source}</span>
      </div>
      <p className="text-xs text-muted-foreground mb-3">{item.detail}</p>
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => onAction(item.id, "Approve", "Approved in HITL review")} className="px-3 py-1 bg-success text-success-foreground rounded text-xs font-medium">Approve</button>
        <button onClick={() => setShowOverride(!showOverride)} className="px-3 py-1 bg-warning text-warning-foreground rounded text-xs font-medium">Override</button>
        <button onClick={() => onAction(item.id, "Request Info", "Additional information requested")} className="px-3 py-1 border rounded text-xs font-medium">Request Info</button>
      </div>
      {showOverride && (
        <div className="mt-2 flex gap-2 items-end">
          <input className="flex-1 border rounded px-2 py-1.5 text-xs bg-background" placeholder="Override reason..." value={reason} onChange={e => setReason(e.target.value)} />
          <button onClick={() => { if (reason.trim()) { onAction(item.id, "Override", reason); setShowOverride(false); } }} className="px-3 py-1.5 bg-warning text-warning-foreground rounded text-xs font-medium">Confirm</button>
        </div>
      )}
    </div>
  );
}
