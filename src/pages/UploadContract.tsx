import { useState, useCallback } from "react";
import { Upload, FileText, CheckCircle, ChevronDown, ChevronRight, ArrowRight } from "lucide-react";
import { ProgressStepper } from "@/components/ProgressStepper";
import { api } from "@/services/mockApi";
import { seedContract } from "@/data/seed";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import type { ContractDocumentProcessing } from "@/types";

type Phase = "idle" | "uploading" | "identifying" | "matching" | "completed";

const docProcessingStages = [
  { stage: "Contract Type Identification", detail: "Identified as Provider Services Agreement – Standard" },
  { stage: "OCR Detection", detail: "Document is digitally native – OCR not required" },
  { stage: "Layout Extraction", detail: "Found 14 sections, 3 tables, 4 appendix references" },
  { stage: "Entity Extraction", detail: "Extracted TIN: 90-7000000, Effective: 2025-01-01, Term: 3 years, Products: Commercial, Medicare Advantage" },
  { stage: "Hierarchy & Appendix Map", detail: "Mapped Section 3.1→Exhibit B, Section 4.1→Exhibit A, Section 5.2→Exhibit D" },
  { stage: "Clause Extraction", detail: "Extracted 22 clauses across 14 articles" },
  { stage: "Standard Matching", detail: "Matched against 12 standard clauses: 8 aligned, 4 non-aligned, 10 missing" },
];

export default function UploadContract() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [fileName, setFileName] = useState("");
  const [progress, setProgress] = useState(0);
  const [pipelineResults, setPipelineResults] = useState<typeof docProcessingStages>([]);
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const navigate = useNavigate();

  const steps = [
    { label: "Identifying Clauses", done: phase === "matching" || phase === "completed", active: phase === "identifying" },
    { label: "Matching with Standard Clauses", done: phase === "completed", active: phase === "matching" },
    { label: "Completed", done: phase === "completed", active: false },
  ];

  const handleUpload = useCallback(async (name: string) => {
    setFileName(name);
    setPhase("uploading");
    setProgress(0);
    setPipelineResults([]);

    // Simulate upload progress
    for (let i = 0; i <= 30; i += 5) {
      await new Promise((r) => setTimeout(r, 150));
      setProgress(i);
    }

    setPhase("identifying");

    // Document intelligence pipeline
    for (let si = 0; si < docProcessingStages.length; si++) {
      await new Promise((r) => setTimeout(r, 600));
      setPipelineResults(prev => [...prev, docProcessingStages[si]]);
      const pct = 30 + Math.round((si / docProcessingStages.length) * 40);
      setProgress(pct);
      if (si === 4) setPhase("matching");
    }

    for (let i = 70; i <= 95; i += 3) {
      await new Promise((r) => setTimeout(r, 150));
      setProgress(i);
    }

    setProgress(100);
    setPhase("completed");

    // Save contract with processing data
    const processing: ContractDocumentProcessing = {
      id: `proc-${Date.now()}`,
      contractId: seedContract.id,
      docType: "Provider Services Agreement",
      needsOcr: false,
      layoutSummary: "14 sections, 3 tables, 4 appendix references",
      extractedEntities: { TIN: "90-7000000", "Effective Date": "2025-01-01", Term: "3 years", Products: "Commercial, Medicare Advantage" },
      hierarchyMap: [
        { section: "Section 3.1 – Services", appendixRef: "Exhibit B" },
        { section: "Section 4.1 – Payment", appendixRef: "Exhibit A" },
        { section: "Section 5.2 – HIPAA", appendixRef: "Exhibit D" },
      ],
      confidenceByStage: { "Contract Type": 98, OCR: 100, Layout: 95, Entities: 91, Hierarchy: 88, Clauses: 92, Matching: 89 },
      stageLogs: docProcessingStages.map((s, i) => ({ stage: s.stage, status: "Done", detail: s.detail, timestamp: new Date(Date.now() - (docProcessingStages.length - i) * 600).toISOString() })),
    };

    await api.saveContract({ ...seedContract, name, uploadDate: new Date().toISOString().split("T")[0], status: "completed", docProcessing: processing });
    await api.addAuditEntry({ id: `audit-${Date.now()}`, timestamp: new Date().toISOString(), action: "Contract Uploaded", detail: `${name} uploaded and processed via document intelligence pipeline`, actor: "ChandravadhanaTK" });
    toast.success("Contract uploaded and processed successfully!");
  }, []);

  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); const file = e.dataTransfer.files[0]; if (file) handleUpload(file.name); };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) handleUpload(file.name); };

  return (
    <div className="page-container">
      <h1 className="page-header">Upload Contract</h1>

      {phase === "idle" && (
        <div onDrop={handleDrop} onDragOver={(e) => e.preventDefault()} className="border-2 border-dashed rounded-xl p-16 text-center hover:border-secondary transition-colors cursor-pointer bg-card">
          <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium mb-2">Drag & drop your contract here</p>
          <p className="text-sm text-muted-foreground mb-4">Supports PDF, DOCX files</p>
          <label className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg cursor-pointer hover:opacity-90 transition-opacity font-medium text-sm">
            Browse Files
            <input type="file" className="hidden" accept=".pdf,.docx" onChange={handleFileSelect} />
          </label>
        </div>
      )}

      {phase !== "idle" && (
        <div className="bg-card border rounded-xl p-8 space-y-6">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-secondary" />
            <span className="font-medium">{fileName}</span>
            {phase === "completed" && <CheckCircle className="w-5 h-5 text-success" />}
          </div>

          <div className="w-full bg-muted rounded-full h-2.5">
            <div className="h-2.5 rounded-full bg-secondary transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>

          <ProgressStepper steps={steps} />

          {/* Document Intelligence Pipeline Output */}
          {pipelineResults.length > 0 && (
            <div className="bg-muted/30 rounded-lg p-4">
              <h3 className="text-sm font-semibold mb-3">Document Intelligence Pipeline</h3>
              <div className="space-y-1">
                {pipelineResults.map((s, i) => (
                  <div key={i} className="border rounded-md bg-background">
                    <button onClick={() => setExpandedStage(expandedStage === s.stage ? null : s.stage)} className="w-full flex items-center gap-2 p-2.5 text-left">
                      <CheckCircle className="w-3.5 h-3.5 text-success flex-shrink-0" />
                      <span className="text-xs font-medium flex-1">{s.stage}</span>
                      {expandedStage === s.stage ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
                    </button>
                    {expandedStage === s.stage && (
                      <div className="px-2.5 pb-2.5 pt-0">
                        <p className="text-xs text-muted-foreground bg-muted/50 rounded p-2">{s.detail}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {phase === "completed" && (
            <>
              <div className="bg-accent border border-secondary/20 rounded-lg p-4">
                <p className="text-sm font-medium text-accent-foreground">
                  ✅ Processing complete! Please navigate to the{" "}
                  <button onClick={() => navigate("/deviation")} className="text-secondary underline font-semibold">Contract Deviation Section</button>
                  {" "}for Deviation & Recommendations.
                </p>
              </div>
              <div className="flex gap-3 flex-wrap">
                <button onClick={() => navigate("/integrity")} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90">
                  <ArrowRight className="w-4 h-4" /> View Integrity Validation
                </button>
                <button onClick={() => navigate("/rates")} className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium hover:bg-muted">
                  <ArrowRight className="w-4 h-4" /> View Rate Tables
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
