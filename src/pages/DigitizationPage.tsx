import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText, Search, Upload, ScanLine, Eye, RefreshCw, MoreHorizontal,
  CheckCircle2, Clock, AlertTriangle, XCircle, Loader2, X, ChevronLeft,
  Pencil, Download, Printer,
} from "lucide-react";
import { api } from "@/services/mockApi";
import type { DigitizationDocument } from "@/data/seed";
import { seedPayerOptions, seedContractTypeOptions, seedSourceOptions } from "@/data/seed";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  Completed: "bg-emerald-100 text-emerald-700",
  "Needs Review": "bg-blue-100 text-blue-700",
  "AI Extraction": "bg-amber-100 text-amber-700",
  "OCR Scanning": "bg-amber-100 text-amber-700",
  Queued: "bg-muted text-muted-foreground",
  Failed: "bg-red-100 text-red-700",
};

const pipelineStages = ["Queued", "OCR Scanning", "AI Extraction", "Needs Review", "Completed"];
const pipelineColors = ["bg-muted-foreground", "bg-amber-400", "bg-secondary", "bg-blue-500", "bg-emerald-500"];

// Deterministic OCR page progress per doc
function getOcrPageProgress(doc: DigitizationDocument): { scanned: number; total: number } | null {
  if (doc.status !== "OCR Scanning") return null;
  const scanned = Math.round(doc.pages * (doc.progress / 100));
  return { scanned, total: doc.pages };
}

/* ── Contract Viewer Modal (PDF-style with Edit/View modes) ── */
function ContractViewerModal({ open, onClose, doc }: { open: boolean; onClose: () => void; doc: DigitizationDocument | null }) {
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [editedSections, setEditedSections] = useState<Record<string, string>>({});

  // Reset state when doc changes
  useEffect(() => {
    if (doc) {
      setMode("view");
      setEditedSections({});
    }
  }, [doc?.id]);

  if (!open || !doc) return null;

  const isCompleted = doc.status === "Completed";
  const canEdit = !isCompleted;

  const sections = [
    { id: "header", title: "", content: `PROVIDER SERVICES AGREEMENT\n\nPayer: ${doc.payer}\nDocument: ${doc.name}\nType: ${doc.type}\nPages: ${doc.pages}\nOCR Score: ${doc.ocrScore > 0 ? `${doc.ocrScore}%` : "Not yet scanned"}` },
    { id: "art1", title: "ARTICLE I — SCOPE OF AGREEMENT", content: `This Agreement is entered into between ${doc.payer} ("Plan") and the Provider for the delivery of Covered Services to enrolled Members within the designated Service Area. The Provider agrees to furnish medically necessary services in accordance with the terms of this Agreement.` },
    { id: "art2", title: "ARTICLE II — TERM", content: `This Agreement shall be effective upon execution and continue for a period of three (3) years unless terminated earlier pursuant to Article VII. The Agreement shall automatically renew for successive one (1) year terms unless either party provides written notice of non-renewal at least ninety (90) days prior to the end of the then-current term.` },
    { id: "art3", title: "ARTICLE III — PROVIDER OBLIGATIONS", content: `Provider shall deliver all medically necessary services in accordance with accepted standards of medical practice and applicable regulatory requirements. Provider shall maintain all required licensure, certifications, and accreditations throughout the term of this Agreement.` },
    { id: "art4", title: "ARTICLE IV — COMPENSATION", content: `Reimbursement shall be in accordance with the Fee Schedule attached as Exhibit A. Clean Claims shall be processed within thirty (30) calendar days of receipt. Annual rate adjustments shall be applied based on CPI-U methodology effective January 1 of each contract year.` },
    { id: "art5", title: "ARTICLE V — CONFIDENTIALITY & HIPAA", content: `Provider shall comply with all HIPAA Privacy and Security Rules. Protected Health Information shall be encrypted at rest using AES-256 and in transit using TLS 1.2 or higher. Any breach of PHI must be reported within twenty-four (24) hours of discovery.` },
    { id: "art6", title: "ARTICLE VI — TERMINATION", content: `Either party may terminate this Agreement without cause upon one hundred eighty (180) days prior written notice. Optum may terminate immediately for cause, including loss of license, exclusion from federal healthcare programs, or fraud. Upon termination, Provider shall continue care for hospitalized Members until discharge.` },
    { id: "art7", title: "ARTICLE VII — GENERAL PROVISIONS", content: `This Agreement constitutes the entire agreement between the parties. Any dispute shall first be submitted to mediation. This Agreement shall be governed by the laws of the State in which Covered Services are rendered.\n\n[Document continues for ${doc.pages} pages...]` },
  ];

  const getSectionContent = (id: string, original: string) => editedSections[id] ?? original;

  const handleSectionEdit = (id: string, value: string) => {
    setEditedSections(prev => ({ ...prev, [id]: value }));
  };

  const handleDownloadPdf = () => {
    const printContent = sections.map(s => {
      const content = getSectionContent(s.id, s.content);
      return `${s.title ? `<h2 style="font-size:14px;font-weight:bold;margin:18px 0 8px 0;font-family:'Times New Roman',serif;">${s.title}</h2>` : ""}
      <p style="font-size:12px;line-height:1.8;font-family:'Times New Roman',serif;white-space:pre-wrap;margin:0 0 12px 0;">${content}</p>`;
    }).join("");

    const html = `<!DOCTYPE html><html><head><title>${doc.name}</title>
      <style>@page{margin:1in;}body{font-family:'Times New Roman',serif;padding:0;margin:0;}</style>
    </head><body style="padding:40px;">${printContent}</body></html>`;

    const w = window.open("", "_blank");
    if (w) {
      w.document.write(html);
      w.document.close();
      w.setTimeout(() => { w.print(); }, 400);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-card border rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col z-10">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-sm font-bold truncate">{doc.name}</h2>
            <p className="text-xs text-muted-foreground">{doc.payer} • {doc.type} • {doc.pages} pages</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Edit/View toggle — only for non-completed */}
            {canEdit && (
              <div className="flex items-center bg-muted rounded-lg p-0.5">
                <button
                  onClick={() => setMode("view")}
                  className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${mode === "view" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <Eye className="w-3 h-3" /> View
                </button>
                <button
                  onClick={() => setMode("edit")}
                  className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${mode === "edit" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <Pencil className="w-3 h-3" /> Edit
                </button>
              </div>
            )}
            {isCompleted && (
              <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3" /> Completed
              </span>
            )}
            <button onClick={handleDownloadPdf} className="p-1.5 hover:bg-muted rounded-lg" title="Download / Print PDF">
              <Download className="w-4 h-4 text-muted-foreground" />
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PDF-style body */}
        <div className="flex-1 overflow-y-auto bg-muted/30 p-6">
          <div className="bg-white mx-auto max-w-[680px] shadow-lg rounded border p-10" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
            {sections.map((section) => {
              const content = getSectionContent(section.id, section.content);
              return (
                <div key={section.id} className="mb-5">
                  {section.title && (
                    <h2 className="text-sm font-bold mb-2" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
                      {section.title}
                    </h2>
                  )}
                  {mode === "edit" && canEdit ? (
                    <textarea
                      value={content}
                      onChange={e => handleSectionEdit(section.id, e.target.value)}
                      className="w-full text-xs leading-relaxed bg-yellow-50/60 border border-yellow-300 rounded p-3 focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-y min-h-[60px]"
                      style={{ fontFamily: "'Times New Roman', Times, serif", minHeight: 80 }}
                      rows={content.split("\n").length + 1}
                    />
                  ) : (
                    <p className="text-xs leading-relaxed whitespace-pre-wrap" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
                      {content}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        {mode === "edit" && canEdit && (
          <div className="p-3 border-t bg-muted/20 flex items-center justify-between">
            <p className="text-[10px] text-muted-foreground">Editing mode — changes are local to this session</p>
            <button
              onClick={() => { setMode("view"); toast.success("Changes applied to preview"); }}
              className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:opacity-90"
            >
              Done Editing
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── More Actions Menu ── */
function MoreActionsMenu({ doc, onViewContract, onViewCompliance }: {
  doc: DigitizationDocument;
  onViewContract: () => void;
  onViewCompliance: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button className="p-1 hover:bg-muted rounded" title="More" onClick={() => setOpen(!open)}>
        <MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 bg-card border rounded-lg shadow-xl z-50 py-1 w-48">
            <button onClick={() => { setOpen(false); onViewContract(); }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted flex items-center gap-2">
              <Eye className="w-3 h-3" /> View Contract
            </button>
            <button onClick={() => { setOpen(false); onViewCompliance(); }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3" /> View Compliance Details
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function UploadModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [payer, setPayer] = useState("");
  const [contractType, setContractType] = useState("Auto-detect");
  const [source, setSource] = useState("");
  const [fileName, setFileName] = useState("");
  const [agreed, setAgreed] = useState(false);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!fileName) {
      toast.error("Please select a file");
      return;
    }
    await api.digitizeLegacyUpload(fileName, payer || "Unknown", contractType, source || "Manual Upload");
    toast.success("Document added to digitization queue");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-card border rounded-xl shadow-2xl w-full max-w-lg p-6 space-y-5 z-10">
        <h2 className="text-lg font-bold text-foreground">Upload Legacy Contracts</h2>
        <div
          className="border-2 border-dashed rounded-lg p-8 text-center hover:border-secondary transition-colors cursor-pointer"
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) setFileName(f.name); }}
          onDragOver={e => e.preventDefault()}
        >
          <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-medium">{fileName || "Drop scanned contracts here"}</p>
          <p className="text-xs text-muted-foreground mt-1">PDF, TIFF, PNG — Max 50MB</p>
          <label className="inline-flex items-center gap-1 mt-3 px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium cursor-pointer hover:opacity-90">
            Browse Files
            <input type="file" className="hidden" accept=".pdf,.tiff,.tif,.png" onChange={e => { const f = e.target.files?.[0]; if (f) setFileName(f.name); }} />
          </label>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Provider</label>
            <select value={payer} onChange={e => setPayer(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm bg-background">
              <option value="">Select provider...</option>
              {seedPayerOptions.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Contract Type</label>
            <select value={contractType} onChange={e => setContractType(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm bg-background">
              {seedContractTypeOptions.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Source</label>
            <select value={source} onChange={e => setSource(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm bg-background">
              <option value="">Select source...</option>
              {seedSourceOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <label className="flex items-start gap-2 text-xs text-muted-foreground cursor-pointer">
          <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="mt-0.5 rounded" />
          All uploaded documents are encrypted at rest (AES-256) and processed in a secure environment.
        </label>
        <button onClick={handleSubmit} disabled={!fileName || !agreed} className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed">
          Start Digitization Pipeline
        </button>
      </div>
    </div>
  );
}

export default function DigitizationPage({ onBack }: { onBack?: () => void }) {
  const [docs, setDocs] = useState<DigitizationDocument[]>([]);
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [search, setSearch] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<DigitizationDocument | null>(null);
  const navigate = useNavigate();

  const loadDocs = () => {
    api.getDigitizationQueue(statusFilter).then(results => {
      if (search.trim()) {
        const s = search.toLowerCase();
        setDocs(results.filter(d => d.name.toLowerCase().includes(s) || d.payer.toLowerCase().includes(s)));
      } else {
        setDocs(results);
      }
    });
  };

  useEffect(() => { loadDocs(); }, [statusFilter, search]);

  const handleRetry = async (doc: DigitizationDocument) => {
    toast.info(`Retrying ${doc.name}...`);
    // Simulate retry: reset to Queued, then progress
    const allDocs = JSON.parse(localStorage.getItem("oci_digitization_docs") || "[]") as DigitizationDocument[];
    const idx = allDocs.findIndex(d => d.id === doc.id);
    if (idx >= 0) {
      allDocs[idx] = { ...allDocs[idx], status: "OCR Scanning", progress: 10, ocrScore: 0 };
      localStorage.setItem("oci_digitization_docs", JSON.stringify(allDocs));
    }
    loadDocs();
    // Simulate progress after delay
    setTimeout(() => {
      const allDocs2 = JSON.parse(localStorage.getItem("oci_digitization_docs") || "[]") as DigitizationDocument[];
      const idx2 = allDocs2.findIndex(d => d.id === doc.id);
      if (idx2 >= 0) {
        allDocs2[idx2] = { ...allDocs2[idx2], status: "AI Extraction", progress: 55, ocrScore: 78 };
        localStorage.setItem("oci_digitization_docs", JSON.stringify(allDocs2));
      }
      loadDocs();
      toast.success(`${doc.name} retry in progress`);
    }, 2000);
  };

  const total = docs.length;
  const completed = docs.filter(d => d.status === "Completed").length;
  const processing = docs.filter(d => ["OCR Scanning", "AI Extraction"].includes(d.status)).length;
  const needsReview = docs.filter(d => d.status === "Needs Review").length;
  const failed = docs.filter(d => d.status === "Failed").length;
  const avgAccuracy = docs.filter(d => d.ocrScore > 0).length > 0
    ? Math.round(docs.filter(d => d.ocrScore > 0).reduce((a, d) => a + d.ocrScore, 0) / docs.filter(d => d.ocrScore > 0).length)
    : 0;

  const pipelineCounts = pipelineStages.map(s => docs.filter(d => d.status === s).length);
  const pipelineTotal = pipelineCounts.reduce((a, b) => a + b, 0) || 1;

  return (
    <div className={onBack ? "space-y-4" : "page-container"}>
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div>
          {onBack && (
            <button onClick={onBack} className="flex items-center gap-1 text-xs text-primary hover:underline mb-2">
              <ChevronLeft className="w-3.5 h-3.5" /> Back to Contracts
            </button>
          )}
          <h1 className="page-header">Legacy Contract Digitization</h1>
          <p className="text-sm text-muted-foreground mt-1">OCR + AI pipeline for converting legacy provider contracts into structured data</p>
        </div>
        <button onClick={() => setUploadOpen(true)} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 flex items-center gap-2">
          <Upload className="w-4 h-4" /> Upload Legacy Contracts
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Total Documents", value: total, icon: <FileText className="w-4 h-4" /> },
          { label: "Completed", value: completed, icon: <CheckCircle2 className="w-4 h-4" />, accent: "bg-emerald-100 text-emerald-700" },
          { label: "In Processing", value: processing, icon: <Loader2 className="w-4 h-4" />, accent: "bg-amber-100 text-amber-700" },
          { label: "Needs Review", value: needsReview, icon: <Eye className="w-4 h-4" />, accent: "bg-blue-100 text-blue-700" },
          { label: "Failed", value: failed, icon: <XCircle className="w-4 h-4" />, accent: "bg-red-100 text-red-700" },
          { label: "Accuracy", value: `${avgAccuracy}%`, icon: <ScanLine className="w-4 h-4" />, accent: "bg-primary/10 text-primary" },
        ].map(kpi => (
          <div key={kpi.label} className="kpi-card flex items-start gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${kpi.accent || "bg-primary/10 text-primary"}`}>{kpi.icon}</div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">{kpi.label}</p>
              <p className="text-xl font-bold text-foreground">{kpi.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Pipeline status bar */}
      <div className="bg-card border rounded-lg p-5">
        <h3 className="text-sm font-semibold mb-3">Legacy Contract Digitization Pipeline</h3>
        <div className="w-full h-4 rounded-full bg-muted flex overflow-hidden">
          {pipelineStages.map((stage, i) => {
            const width = (pipelineCounts[i] / pipelineTotal) * 100;
            if (width === 0) return null;
            return <div key={stage} className={`h-full ${pipelineColors[i]}`} style={{ width: `${width}%` }} />;
          })}
        </div>
        <div className="flex flex-wrap gap-4 mt-3">
          {pipelineStages.map((stage, i) => (
            <div key={stage} className="flex items-center gap-1.5 text-xs">
              <div className={`w-3 h-3 rounded-sm ${pipelineColors[i]}`} />
              <span className="text-muted-foreground">{stage} ({pipelineCounts[i]})</span>
            </div>
          ))}
        </div>
      </div>

      {/* Document Queue */}
      <div className="bg-card border rounded-lg overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between flex-wrap gap-3">
          <h3 className="text-sm font-semibold">Document Queue</h3>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input className="pl-8 pr-3 py-1.5 text-xs border rounded-lg bg-background w-48" placeholder="Search documents…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="text-xs border rounded-lg px-2 py-1.5 bg-background">
              {["All Statuses", ...pipelineStages, "Failed"].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-xs">
                <th className="text-left p-3 font-medium">Document</th>
                <th className="text-left p-3 font-medium">Payer</th>
                <th className="text-left p-3 font-medium">Type</th>
                <th className="text-left p-3 font-medium">Source</th>
                <th className="text-right p-3 font-medium">Pages</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-right p-3 font-medium">OCR Score</th>
                <th className="text-left p-3 font-medium w-32">Progress</th>
                <th className="text-center p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {docs.map(d => {
                const ocrProgress = getOcrPageProgress(d);
                return (
                  <tr key={d.id} className="hover:bg-muted/20">
                    <td className="p-3 text-xs font-medium truncate max-w-[200px]">{d.name}</td>
                    <td className="p-3 text-xs">{d.payer}</td>
                    <td className="p-3 text-xs">{d.type}</td>
                    <td className="p-3 text-xs">{d.source}</td>
                    <td className="p-3 text-xs text-right">{d.pages}</td>
                    <td className="p-3">
                      <span className={`status-chip ${statusColors[d.status] || "bg-muted"}`}>{d.status}</span>
                      {ocrProgress && (
                        <p className="text-[10px] text-amber-600 mt-0.5">{ocrProgress.scanned}/{ocrProgress.total} pages scanned</p>
                      )}
                    </td>
                    <td className="p-3 text-xs text-right">{d.ocrScore > 0 ? `${d.ocrScore}%` : "—"}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div className={`h-2 rounded-full transition-all ${d.status === "Failed" ? "bg-destructive" : "bg-secondary"}`} style={{ width: `${d.progress}%` }} />
                        </div>
                        <span className="text-[10px] text-muted-foreground w-8 text-right">{d.progress}%</span>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button className="p-1 hover:bg-muted rounded" title="View Contract" onClick={() => navigate(`/contracts/${d.id}`)}>
                          <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                        <button className="p-1 hover:bg-muted rounded" title="Retry" onClick={() => handleRetry(d)}>
                          <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                        <MoreActionsMenu
                          doc={d}
                          onViewContract={() => navigate(`/contracts/${d.id}`)}
                          onViewCompliance={() => navigate(`/compliance-hub?tab=overview`)}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <UploadModal open={uploadOpen} onClose={() => { setUploadOpen(false); loadDocs(); }} />
      <ContractViewerModal open={!!viewingDoc} onClose={() => setViewingDoc(null)} doc={viewingDoc} />
    </div>
  );
}
