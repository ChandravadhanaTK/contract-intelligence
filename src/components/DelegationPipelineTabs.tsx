import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, Eye, RotateCcw, ArrowRight, CheckCircle2, XCircle, AlertTriangle,
  ChevronDown, ChevronRight, FileText, Send, Shield, Calculator, Database,
  Users, Briefcase, ClipboardList, Clock, AlertCircle, Zap,
} from "lucide-react";
import { toast } from "sonner";
import {
  type PipelineDigitizationDoc, type DelegationType, type DelegatedValidationResults, type NonDelegatedValidationResults,
  type DelegatedIntakeRequest,
  DELEGATED_STAGES, NON_DELEGATED_STAGES,
  getDelegationDocs, saveDelegationDocs, getDelegatedIntakes, saveDelegatedIntakes,
} from "@/data/delegationData";

const statusColors: Record<string, string> = {
  Queued: "bg-muted text-muted-foreground",
  OCRScanning: "bg-amber-100 text-amber-700",
  AIExtraction: "bg-blue-100 text-blue-700",
  NeedsReview: "bg-orange-100 text-orange-700",
  Completed: "bg-emerald-100 text-emerald-700",
  Failed: "bg-red-100 text-red-700",
};

/* ───────── MAIN COMPONENT ───────── */
export default function DelegationPipelineTabs() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<DelegationType>("Delegated");
  const [docs, setDocs] = useState<PipelineDigitizationDoc[]>(getDelegationDocs());
  const [intakes, setIntakes] = useState<DelegatedIntakeRequest[]>(getDelegatedIntakes());
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [sourceFilter, setSourceFilter] = useState("All Sources");
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [intakeFilter, setIntakeFilter] = useState<"All" | DelegationType>("All");
  const [selectedStageIdx, setSelectedStageIdx] = useState<number | null>(null);

  const filteredDocs = docs.filter(d => {
    if (d.delegationType !== activeTab) return false;
    if (selectedStageIdx !== null) {
      const stageList = d.delegationType === "Delegated" ? DELEGATED_STAGES : NON_DELEGATED_STAGES;
      if (stageList.indexOf(d.pipelineStage) !== selectedStageIdx) return false;
    }
    if (statusFilter !== "All Statuses" && d.status !== statusFilter) return false;
    if (typeFilter !== "All Types" && d.contractType !== typeFilter) return false;
    if (sourceFilter !== "All Sources" && d.source !== sourceFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return d.documentName.toLowerCase().includes(s) || d.providerName.toLowerCase().includes(s) || d.tin.includes(s);
    }
    return true;
  });

  const stages = activeTab === "Delegated" ? DELEGATED_STAGES : NON_DELEGATED_STAGES;
  const selectedDoc = docs.find(d => d.id === selectedDocId) || null;

  const filteredIntakes = intakes.filter(i => intakeFilter === "All" || i.delegationType === intakeFilter);
  const delCount = intakes.filter(i => i.delegationType === "Delegated").length;
  const ndCount = intakes.filter(i => i.delegationType === "NonDelegated").length;

  const advanceDoc = (docId: string) => {
    const updated = docs.map(d => {
      if (d.id !== docId) return d;
      const stageList = d.delegationType === "Delegated" ? DELEGATED_STAGES : NON_DELEGATED_STAGES;
      const curIdx = stageList.indexOf(d.pipelineStage);
      if (curIdx >= stageList.length - 1) return d;
      const nextStage = stageList[curIdx + 1];
      const nextPct = Math.min(100, Math.round(((curIdx + 2) / stageList.length) * 100));
      const isLast = curIdx + 2 >= stageList.length;
      return {
        ...d,
        pipelineStage: nextStage,
        progressPct: nextPct,
        ocrScore: Math.min(100, d.ocrScore + 15),
        status: isLast ? "Completed" as const : "AIExtraction" as const,
        updatedAt: new Date().toISOString(),
        logs: [...d.logs, { time: new Date().toISOString(), stage: nextStage, message: `Advanced to ${nextStage}`, level: "info" as const }],
      };
    });
    setDocs(updated);
    saveDelegationDocs(updated);
    toast.success("Document advanced to next stage");
  };

  const retryDoc = (docId: string) => {
    const updated = docs.map(d => {
      if (d.id !== docId) return d;
      const stageList = d.delegationType === "Delegated" ? DELEGATED_STAGES : NON_DELEGATED_STAGES;
      return { ...d, status: "Queued" as const, pipelineStage: stageList[0], progressPct: 5, logs: [...d.logs, { time: new Date().toISOString(), stage: stageList[0], message: "Retrying from start", level: "info" as const }], updatedAt: new Date().toISOString() };
    });
    setDocs(updated);
    saveDelegationDocs(updated);
    toast.success("Document queued for retry");
  };

  const sendIntakeToDigitization = (intake: DelegatedIntakeRequest) => {
    const newDoc: PipelineDigitizationDoc = {
      id: `ddoc-${Date.now()}`,
      intakeId: intake.id,
      documentName: `${intake.providerName.replace(/\s+/g, "_")}_Contract.pdf`,
      providerName: intake.providerName,
      tin: intake.tin,
      mpin: intake.mpin,
      contractType: intake.contractType,
      delegationType: intake.delegationType,
      source: intake.delegationType === "Delegated" ? "Delegate Portal" : "PEGA Intake",
      pages: 25,
      status: "Queued",
      pipelineStage: intake.delegationType === "Delegated" ? DELEGATED_STAGES[0] : NON_DELEGATED_STAGES[0],
      progressPct: 0,
      ocrScore: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      logs: [{ time: new Date().toISOString(), stage: intake.delegationType === "Delegated" ? DELEGATED_STAGES[0] : NON_DELEGATED_STAGES[0], message: `Created from intake ${intake.id}`, level: "info" }],
    };
    const updatedDocs = [...docs, newDoc];
    setDocs(updatedDocs);
    saveDelegationDocs(updatedDocs);
    setActiveTab(intake.delegationType);
    toast.success(`Sent to ${intake.delegationType === "Delegated" ? "Delegate" : "Non-Delegate"} Pipeline`);
  };

  const getStageIdx = (doc: PipelineDigitizationDoc) => {
    const stageList = doc.delegationType === "Delegated" ? DELEGATED_STAGES : NON_DELEGATED_STAGES;
    return stageList.indexOf(doc.pipelineStage);
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center gap-1 bg-muted/60 rounded-lg p-1 w-fit">
        {(["Delegated", "NonDelegated"] as DelegationType[]).map(t => (
          <button
            key={t}
            onClick={() => { setActiveTab(t); setSelectedDocId(null); setSelectedStageIdx(null); }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === t ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            {t === "Delegated" ? "Delegate Contracts Pipeline" : "Non-Delegate Contract Pipeline"}
          </button>
        ))}
      </div>

      {/* Pipeline Stepper */}
      <div className="bg-card border rounded-lg p-4">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-3">
          {activeTab === "Delegated" ? "Delegated" : "Non-Delegated"} Pipeline Stages
        </h3>
        <div className="flex items-center gap-1 overflow-x-auto">
          {stages.map((stage, i) => {
            const docsAtStage = filteredDocs.filter(d => getStageIdx(d) === i).length;
            return (
              <div key={stage} className="flex items-center flex-shrink-0">
                <div className={`text-center px-3 py-2 rounded-md text-[10px] font-semibold leading-tight min-w-[100px] ${
                  docsAtStage > 0 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                }`}>
                  {stage.split(": ")[1] || stage}
                  {docsAtStage > 0 && <span className="block text-[9px] mt-0.5 font-normal">({docsAtStage} docs)</span>}
                </div>
                {i < stages.length - 1 && <div className="w-3 h-0.5 bg-muted flex-shrink-0" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Delegation-specific widgets */}
      {activeTab === "Delegated" ? <DelegatedWidgets docs={filteredDocs} selectedDoc={selectedDoc} /> : <NonDelegatedWidgets docs={filteredDocs} selectedDoc={selectedDoc} />}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input className="w-full pl-9 pr-3 py-2 border rounded-lg text-xs bg-background" placeholder="Search documents…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="border rounded-lg px-3 py-2 text-xs bg-background" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option>All Statuses</option><option>Queued</option><option>OCRScanning</option><option>AIExtraction</option><option>NeedsReview</option><option>Completed</option><option>Failed</option>
        </select>
        <select className="border rounded-lg px-3 py-2 text-xs bg-background" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option>All Types</option>
          {[...new Set(docs.filter(d => d.delegationType === activeTab).map(d => d.contractType))].map(t => <option key={t}>{t}</option>)}
        </select>
        <select className="border rounded-lg px-3 py-2 text-xs bg-background" value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}>
          <option>All Sources</option>
          {[...new Set(docs.filter(d => d.delegationType === activeTab).map(d => d.source))].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Queue Table + Details Panel */}
      <div className="flex gap-4">
        <div className="flex-1 min-w-0">
          <div className="bg-card border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-2.5 font-semibold">Document</th>
                    <th className="text-left p-2.5 font-semibold">Provider</th>
                    <th className="text-left p-2.5 font-semibold">TIN</th>
                    <th className="text-left p-2.5 font-semibold">MPIN</th>
                    <th className="text-left p-2.5 font-semibold">Type</th>
                    <th className="text-left p-2.5 font-semibold">Source</th>
                    <th className="text-center p-2.5 font-semibold">Pages</th>
                    <th className="text-center p-2.5 font-semibold">Status</th>
                    <th className="text-center p-2.5 font-semibold">OCR %</th>
                    <th className="text-center p-2.5 font-semibold">Progress</th>
                    <th className="text-center p-2.5 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocs.length === 0 && (
                    <tr><td colSpan={11} className="text-center py-8 text-muted-foreground">No documents found</td></tr>
                  )}
                  {filteredDocs.map(d => (
                    <tr
                      key={d.id}
                      className={`border-b hover:bg-muted/30 cursor-pointer transition-colors ${selectedDocId === d.id ? "bg-primary/5" : ""}`}
                      onClick={() => setSelectedDocId(d.id)}
                    >
                      <td className="p-2.5 font-medium truncate max-w-[160px]">{d.documentName}</td>
                      <td className="p-2.5 truncate max-w-[120px]">{d.providerName}</td>
                      <td className="p-2.5 font-mono">{d.tin}</td>
                      <td className="p-2.5 font-mono">{d.mpin}</td>
                      <td className="p-2.5">{d.contractType}</td>
                      <td className="p-2.5">{d.source}</td>
                      <td className="p-2.5 text-center">{d.pages}</td>
                      <td className="p-2.5 text-center">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColors[d.status] || "bg-muted"}`}>{d.status}</span>
                      </td>
                      <td className="p-2.5 text-center">{d.ocrScore}%</td>
                      <td className="p-2.5">
                        <div className="flex items-center gap-1.5">
                          <div className="flex-1 h-1.5 bg-muted rounded-full">
                            <div className={`h-1.5 rounded-full transition-all ${d.progressPct >= 100 ? "bg-emerald-500" : d.progressPct > 50 ? "bg-blue-500" : "bg-amber-400"}`} style={{ width: `${d.progressPct}%` }} />
                          </div>
                          <span className="text-[10px] w-8 text-right">{d.progressPct}%</span>
                        </div>
                      </td>
                      <td className="p-2.5">
                        <div className="flex gap-1 justify-center" onClick={e => e.stopPropagation()}>
                          <button onClick={() => setSelectedDocId(d.id)} className="p-1 rounded hover:bg-muted" title="View"><Eye className="w-3 h-3" /></button>
                          {d.status !== "Completed" && d.status !== "Failed" && (
                            <button onClick={() => advanceDoc(d.id)} className="p-1 rounded hover:bg-muted text-primary" title="Advance"><ArrowRight className="w-3 h-3" /></button>
                          )}
                          {d.status !== "Completed" && (
                            <button onClick={() => toast.info(`Sent ${d.documentName} for review`)} className="p-1 rounded hover:bg-muted text-secondary" title="Send to Review"><Send className="w-3 h-3" /></button>
                          )}
                          {d.status === "Failed" && (
                            <button onClick={() => retryDoc(d.id)} className="p-1 rounded hover:bg-muted text-amber-600" title="Retry"><RotateCcw className="w-3 h-3" /></button>
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

        {/* Details Panel */}
        {selectedDoc && (
          <div className="w-80 flex-shrink-0 bg-card border rounded-lg overflow-y-auto max-h-[500px]">
            <div className="p-3 border-b bg-muted/50 flex items-center justify-between">
              <span className="text-xs font-bold">Document Details</span>
              <button onClick={() => setSelectedDocId(null)} className="text-muted-foreground hover:text-foreground">
                <XCircle className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="p-3 space-y-3">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Document</p>
                <p className="text-xs font-medium">{selectedDoc.documentName}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-muted-foreground">Provider:</span> {selectedDoc.providerName}</div>
                <div><span className="text-muted-foreground">TIN:</span> {selectedDoc.tin}</div>
                <div><span className="text-muted-foreground">Stage:</span></div>
                <div className="col-span-2">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">{selectedDoc.pipelineStage}</span>
                </div>
              </div>

              {/* Step Logs */}
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5">Step Logs</p>
                <div className="space-y-1 max-h-[200px] overflow-y-auto">
                  {selectedDoc.logs.map((log, i) => (
                    <div key={i} className={`text-[10px] p-2 rounded border-l-2 ${
                      log.level === "error" ? "border-l-destructive bg-red-50" :
                      log.level === "warn" ? "border-l-amber-500 bg-amber-50" :
                      "border-l-primary bg-muted/30"
                    }`}>
                      <p className="font-medium">{log.message}</p>
                      <p className="text-muted-foreground">{new Date(log.time).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Validation outputs */}
              {selectedDoc.validationResults && selectedDoc.delegationType === "Delegated" && (
                <DelegatedValidationPanel results={selectedDoc.validationResults as DelegatedValidationResults} />
              )}
              {selectedDoc.validationResults && selectedDoc.delegationType === "NonDelegated" && (
                <NonDelegatedValidationPanel results={selectedDoc.validationResults as NonDelegatedValidationResults} />
              )}
            </div>
          </div>
        )}
      </div>

      {/* ──── PROVIDER INTAKE SEGREGATION ──── */}
      <div className="bg-card border rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold">Provider Intake — Delegation Segregation</h3>
          <div className="flex items-center gap-3 text-xs">
            <span className="px-2 py-1 rounded-md bg-primary/10 text-primary font-medium">Delegated: {delCount}</span>
            <span className="px-2 py-1 rounded-md bg-secondary/10 text-secondary font-medium">Non-Delegated: {ndCount}</span>
          </div>
        </div>
        {/* Filter chips */}
        <div className="flex gap-1.5 mb-4">
          {(["All", "Delegated", "NonDelegated"] as const).map(f => (
            <button
              key={f}
              onClick={() => setIntakeFilter(f)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${intakeFilter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
            >
              {f === "NonDelegated" ? "Non-Delegated" : f} {f === "All" ? `(${intakes.length})` : f === "Delegated" ? `(${delCount})` : `(${ndCount})`}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filteredIntakes.map(intake => (
            <IntakeCard key={intake.id} intake={intake} onSendToDigitization={sendIntakeToDigitization} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ───────── DELEGATED WIDGETS ───────── */
function DelegatedWidgets({ docs, selectedDoc }: { docs: PipelineDigitizationDoc[]; selectedDoc: PipelineDigitizationDoc | null }) {
  const completedDocs = docs.filter(d => d.validationResults && d.delegationType === "Delegated");
  const workBasketTotals = { "Dell Research vendor": 0, "Tax ID transaction": 0, "Demographic": 0 };
  completedDocs.forEach(d => {
    const v = d.validationResults as DelegatedValidationResults;
    if (v?.workBaskets) v.workBaskets.forEach(wb => { workBasketTotals[wb.name] = (workBasketTotals[wb.name] || 0) + wb.count; });
  });

  const [effDateInput, setEffDateInput] = useState("2026-04-01");
  const [processingDays, setProcessingDays] = useState(30);
  const computedDate = (() => {
    try {
      const d = new Date(effDateInput);
      d.setDate(d.getDate() + processingDays);
      return d.toISOString().split("T")[0];
    } catch { return ""; }
  })();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {/* Work Baskets Summary */}
      <div className="bg-card border rounded-lg p-4">
        <h4 className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5 text-secondary" /> NDB Work Baskets</h4>
        <div className="space-y-2">
          {Object.entries(workBasketTotals).map(([name, count]) => (
            <div key={name} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{name}</span>
              <span className="font-semibold text-foreground">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Opera AI Validation checklist */}
      <div className="bg-card border rounded-lg p-4">
        <h4 className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-primary" /> Opera AI Validation</h4>
        {selectedDoc?.validationResults && selectedDoc.delegationType === "Delegated" ? (
          <OperaAIChecklist results={selectedDoc.validationResults as DelegatedValidationResults} />
        ) : (
          <p className="text-[10px] text-muted-foreground">Select a document to view validation</p>
        )}
      </div>

      {/* Effective Date Hub Calculator */}
      <div className="bg-card border rounded-lg p-4">
        <h4 className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5"><Calculator className="w-3.5 h-3.5 text-amber-600" /> Effective Date Hub Calculator</h4>
        <div className="space-y-2">
          <div>
            <label className="text-[10px] text-muted-foreground">Requested Effective Date</label>
            <input type="date" className="w-full border rounded px-2 py-1 text-xs bg-background mt-0.5" value={effDateInput} onChange={e => setEffDateInput(e.target.value)} />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground">Processing Days</label>
            <input type="number" className="w-full border rounded px-2 py-1 text-xs bg-background mt-0.5" value={processingDays} onChange={e => setProcessingDays(Number(e.target.value))} />
          </div>
          <div className="bg-accent/50 rounded p-2">
            <p className="text-[10px] text-muted-foreground">Computed Effective Date</p>
            <p className="text-sm font-bold text-primary">{computedDate}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────── NON-DELEGATED WIDGETS ───────── */
function NonDelegatedWidgets({ docs, selectedDoc }: { docs: PipelineDigitizationDoc[]; selectedDoc: PipelineDigitizationDoc | null }) {
  const ndResults = selectedDoc?.validationResults as NonDelegatedValidationResults | undefined;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {/* PEGA/Spiken Case Summary */}
      <div className="bg-card border rounded-lg p-4">
        <h4 className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5"><ClipboardList className="w-3.5 h-3.5 text-secondary" /> PEGA/Spiken Case Summary</h4>
        {ndResults?.pegaCase ? (
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between"><span className="text-muted-foreground">Case ID</span><span className="font-mono font-medium">{ndResults.pegaCase.caseId}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Owner</span><span>{ndResults.pegaCase.owner}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Status</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${ndResults.pegaCase.status === "Closed" ? "bg-emerald-100 text-emerald-700" : ndResults.pegaCase.status === "Failed" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>{ndResults.pegaCase.status}</span>
            </div>
          </div>
        ) : (
          <p className="text-[10px] text-muted-foreground">Select a non-delegated document</p>
        )}
      </div>

      {/* Validation Sources */}
      <div className="bg-card border rounded-lg p-4">
        <h4 className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5"><Database className="w-3.5 h-3.5 text-primary" /> Validation Sources</h4>
        {ndResults?.validationSources ? (
          <div className="space-y-1.5">
            {Object.entries(ndResults.validationSources).map(([src, passed]) => (
              <div key={src} className="flex items-center justify-between text-xs">
                <span>{src}</span>
                {passed ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-destructive" />}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[10px] text-muted-foreground">Select a document to view</p>
        )}
      </div>

      {/* SOP 30 Screens Progress */}
      <div className="bg-card border rounded-lg p-4">
        <h4 className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-amber-600" /> SOP 30 Screens Progress</h4>
        {ndResults?.sop ? (
          <div className="space-y-2">
            <div>
              <label className="text-[10px] text-muted-foreground">SOP</label>
              <select className="w-full border rounded px-2 py-1 text-xs bg-background mt-0.5" value={ndResults.sop.selectedSop} disabled>
                <option>SOP J4100</option><option>CSDSNT</option><option>Effective Date Rules</option><option>Address Update Rules</option><option>Tax ID Rules</option>
              </select>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground mb-1">Screens Completed</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-muted rounded-full">
                  <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${(ndResults.sop.screensCompleted / 30) * 100}%` }} />
                </div>
                <span className="text-xs font-bold">{ndResults.sop.screensCompleted}/{ndResults.sop.totalScreens}</span>
              </div>
            </div>
            {ndResults.followUps?.required && (
              <div className="bg-amber-50 border border-amber-200 rounded p-2">
                <p className="text-[10px] font-medium text-amber-700 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Follow-up Required</p>
                {ndResults.followUps.notes && <p className="text-[10px] text-amber-600 mt-0.5">{ndResults.followUps.notes}</p>}
                <div className="flex gap-1 mt-1">
                  <button onClick={() => toast.info("Clarification requested")} className="text-[9px] px-2 py-0.5 bg-amber-100 text-amber-700 rounded font-medium">Request Clarification</button>
                  <button onClick={() => toast.info("Escalated")} className="text-[9px] px-2 py-0.5 bg-red-100 text-red-700 rounded font-medium">Escalate</button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-[10px] text-muted-foreground">Select a document to view</p>
        )}
      </div>
    </div>
  );
}

/* ───────── Sub-components ───────── */
function OperaAIChecklist({ results }: { results: DelegatedValidationResults }) {
  const fields = [
    { label: "Degree", pass: results.operaAI.degree },
    { label: "Gender", pass: results.operaAI.gender },
    { label: "Date of Birth", pass: results.operaAI.dob },
    { label: "SSN", pass: results.operaAI.ssn },
    { label: "Effective Dates", pass: results.operaAI.effectiveDate },
  ];
  return (
    <div className="space-y-1">
      {fields.map(f => (
        <div key={f.label} className="flex items-center justify-between text-xs">
          <span>{f.label}</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${f.pass ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>{f.pass ? "Pass" : "Fail"}</span>
        </div>
      ))}
      <div className="text-[10px] text-muted-foreground mt-1">Computed: {results.operaAI.computedEffectiveDate}</div>
    </div>
  );
}

function DelegatedValidationPanel({ results }: { results: DelegatedValidationResults }) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold text-muted-foreground uppercase">Validation Results</p>
      <OperaAIChecklist results={results} />
      <div className="text-xs">
        <span className="text-muted-foreground">NDB Linkage: </span>
        <span className={results.ndbLinkage.linked ? "text-emerald-700 font-medium" : "text-amber-700 font-medium"}>
          {results.ndbLinkage.linked ? `Linked to ${results.ndbLinkage.delegateContractId}` : "Not linked"}
        </span>
      </div>
    </div>
  );
}

function NonDelegatedValidationPanel({ results }: { results: NonDelegatedValidationResults }) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold text-muted-foreground uppercase">Validation Results</p>
      <div className="text-xs space-y-1">
        <div><span className="text-muted-foreground">Case:</span> {results.pegaCase.caseId} ({results.pegaCase.status})</div>
        <div><span className="text-muted-foreground">SOP:</span> {results.sop.selectedSop} — {results.sop.screensCompleted}/{results.sop.totalScreens}</div>
        <div><span className="text-muted-foreground">Eff Date:</span> {results.effectiveDate.computed || "Pending"} {results.effectiveDate.validated ? "✓" : ""}</div>
        <div className="flex gap-2">
          {Object.entries(results.validationSources).map(([k, v]) => (
            <span key={k} className={`text-[10px] px-1.5 py-0.5 rounded ${v ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>{k} {v ? "✓" : "✗"}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function IntakeCard({ intake, onSendToDigitization }: { intake: DelegatedIntakeRequest; onSendToDigitization: (i: DelegatedIntakeRequest) => void }) {
  const [showTimeline, setShowTimeline] = useState(false);
  const navigate = useNavigate();

  const delegatedTimeline = [
    "Credentialing done by Delegate (external)",
    "Contract executed by Delegate",
    "United loads provider under delegate umbrella contract",
    "NDB work baskets routing (Dell Research / Tax ID / Demographic)",
    "Opera AI validation for Tax ID transactions",
    "Effective Date Hub calculator validation",
    "Linkage to delegated group contract in NDB",
  ];

  const nonDelegatedTimeline = [
    "PEGA/Spiken case created",
    "Cross-system validation (NDB + PR Notes + SOT + PICON)",
    "SOP-guided processing (~30 screens)",
    "Effective Date Calculator",
    "Data entry + auto-flow propagation",
    "Follow-ups/clarifications and escalation",
    "Completion after all validations",
  ];

  const timeline = intake.delegationType === "Delegated" ? delegatedTimeline : nonDelegatedTimeline;

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <FileText className="w-3.5 h-3.5 text-primary" />
            <span className="text-sm font-semibold">{intake.providerName}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${intake.delegationType === "Delegated" ? "bg-violet-100 text-violet-700" : "bg-cyan-100 text-cyan-700"}`}>
              {intake.delegationType === "Delegated" ? "Delegated" : "Non-Delegated"}
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
              intake.triageStatus === "Ready for Drafting" ? "bg-emerald-100 text-emerald-700" :
              intake.triageStatus === "Ready for Credentialing" ? "bg-blue-100 text-blue-700" :
              intake.triageStatus === "Need more info" ? "bg-amber-100 text-amber-700" :
              "bg-muted text-muted-foreground"
            }`}>{intake.triageStatus}</span>
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground mb-2">
            <span>TIN: {intake.tin}</span><span>MPIN: {intake.mpin}</span><span>Type: {intake.contractType}</span><span>Eff: {intake.requestedEffectiveDate}</span>
          </div>
        </div>
        <div className="flex gap-1.5 flex-shrink-0">
          <button onClick={() => setShowTimeline(!showTimeline)} className="px-2.5 py-1 border rounded text-[10px] font-medium hover:bg-muted flex items-center gap-1">
            {showTimeline ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />} Timeline
          </button>
          <button onClick={() => onSendToDigitization(intake)} className="px-2.5 py-1 bg-primary text-primary-foreground rounded text-[10px] font-medium hover:opacity-90 flex items-center gap-1">
            <Send className="w-3 h-3" /> Send to Digitization
          </button>
        </div>
      </div>

      {showTimeline && (
        <div className="mt-3 border-t pt-3">
          <p className="text-[10px] font-bold text-muted-foreground uppercase mb-2">
            End-to-End Workflow Timeline ({intake.delegationType === "Delegated" ? "Delegated" : "Non-Delegated"})
          </p>
          <div className="space-y-1.5 pl-3 border-l-2 border-primary/20">
            {timeline.map((step, i) => (
              <div key={i} className="flex items-start gap-2 relative">
                <div className="absolute -left-[17px] top-1 w-2 h-2 rounded-full bg-primary/40" />
                <span className="text-xs text-foreground">{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
