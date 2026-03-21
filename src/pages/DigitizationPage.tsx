import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText, Search, Upload, ScanLine, Eye, RefreshCw, MoreHorizontal,
  CheckCircle2, Clock, AlertTriangle, XCircle, Loader2,
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

        {/* Drop zone */}
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

        {/* Dropdowns */}
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Payer</label>
            <select value={payer} onChange={e => setPayer(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm bg-background">
              <option value="">Select payer...</option>
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

        {/* Disclaimer */}
        <label className="flex items-start gap-2 text-xs text-muted-foreground cursor-pointer">
          <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="mt-0.5 rounded" />
          All uploaded documents are encrypted at rest (AES-256) and processed in a secure environment.
        </label>

        <button
          onClick={handleSubmit}
          disabled={!fileName || !agreed}
          className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Start Digitization Pipeline
        </button>
      </div>
    </div>
  );
}

export default function DigitizationPage() {
  const [docs, setDocs] = useState<DigitizationDocument[]>([]);
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [search, setSearch] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);

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

  const total = docs.length;
  const completed = docs.filter(d => d.status === "Completed").length;
  const processing = docs.filter(d => ["OCR Scanning", "AI Extraction"].includes(d.status)).length;
  const needsReview = docs.filter(d => d.status === "Needs Review").length;
  const failed = docs.filter(d => d.status === "Failed").length;
  const avgAccuracy = docs.filter(d => d.ocrScore > 0).length > 0
    ? Math.round(docs.filter(d => d.ocrScore > 0).reduce((a, d) => a + d.ocrScore, 0) / docs.filter(d => d.ocrScore > 0).length)
    : 0;

  // Pipeline bar counts
  const pipelineCounts = pipelineStages.map(s => docs.filter(d => d.status === s).length);
  const pipelineTotal = pipelineCounts.reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="page-container">
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div>
          <h1 className="page-header">Legacy Contract Digitization</h1>
          <p className="text-sm text-muted-foreground mt-1">OCR + AI pipeline for converting legacy payer contracts into structured data</p>
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
        <h3 className="text-sm font-semibold mb-3">Digitization Pipeline</h3>
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
              {docs.map(d => (
                <tr key={d.id} className="hover:bg-muted/20">
                  <td className="p-3 text-xs font-medium truncate max-w-[200px]">{d.name}</td>
                  <td className="p-3 text-xs">{d.payer}</td>
                  <td className="p-3 text-xs">{d.type}</td>
                  <td className="p-3 text-xs">{d.source}</td>
                  <td className="p-3 text-xs text-right">{d.pages}</td>
                  <td className="p-3"><span className={`status-chip ${statusColors[d.status] || "bg-muted"}`}>{d.status}</span></td>
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
                      <button className="p-1 hover:bg-muted rounded" title="View"><Eye className="w-3.5 h-3.5 text-muted-foreground" /></button>
                      <button className="p-1 hover:bg-muted rounded" title="Retry"><RefreshCw className="w-3.5 h-3.5 text-muted-foreground" /></button>
                      <button className="p-1 hover:bg-muted rounded" title="More"><MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <UploadModal open={uploadOpen} onClose={() => { setUploadOpen(false); loadDocs(); }} />
    </div>
  );
}
