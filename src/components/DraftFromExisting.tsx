import { useState, useRef, useEffect, useCallback } from "react";
import { Upload, FileText, Send, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Plus, Loader2, MessageSquare } from "lucide-react";
import { toast } from "sonner";

function get<T>(key: string, fb: T): T {
  const r = localStorage.getItem(key);
  return r ? JSON.parse(r) : fb;
}
function set(key: string, v: unknown) {
  localStorage.setItem(key, JSON.stringify(v));
}

type Step = "upload" | "processing" | "viewer";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  citations?: { page: number; label: string }[];
  tableExcerpt?: string;
}

/* Mock contract pages */
const mockPages = [
  { page: 1, title: "PROVIDER SERVICES AGREEMENT", content: "This Provider Services Agreement (\"Agreement\") is entered into as of January 1, 2026, by and between OptumHealth Care Solutions, LLC (\"Plan\"), a subsidiary of UnitedHealth Group, Inc., and Northwell Health Systems (\"Provider\"), a healthcare provider duly licensed in the State of New York.\n\nWHEREAS, Plan operates managed care programs and arranges for the delivery of healthcare services to its Members; and\n\nWHEREAS, Provider desires to participate in Plan's provider network and provide Covered Services to Members;\n\nNOW, THEREFORE, in consideration of the mutual covenants contained herein, the parties agree as follows:" },
  { page: 2, title: "ARTICLE 1 – DEFINITIONS", content: "1.1 \"Covered Services\" means medically necessary health care services to which a Member is entitled under the Member's Benefit Contract.\n\n1.2 \"Clean Claim\" means a claim submitted using UB-04 or CMS-1500 with no defect or missing data elements per 42 CFR § 447.45.\n\n1.3 \"Member\" means an individual enrolled in a health benefit plan administered by Plan.\n\n1.4 \"Fee Schedule\" means the schedule of reimbursement rates as set forth in Exhibit A.\n\n1.5 \"Network\" means the panel of credentialed providers contracted to deliver Covered Services.\n\n1.6 \"Medical Policy\" means clinical policies and utilization management protocols adopted by Plan." },
  { page: 3, title: "ARTICLE 2 – TERM AND RENEWAL", content: "2.1 Effective Date. This Agreement shall be effective as of January 1, 2026.\n\n2.2 Initial Term. The initial term shall be three (3) years from the Effective Date.\n\n2.3 Renewal. Following the Initial Term, this Agreement shall automatically renew for successive one (1) year terms unless either party provides written notice of non-renewal at least 180 days prior to expiration.\n\n2.4 Rate Review. Annual rate review no later than 90 days prior to each anniversary." },
  { page: 4, title: "ARTICLE 3 – SCOPE OF SERVICES", content: "3.1 Covered Services. Provider shall deliver all medically necessary Covered Services to eligible Members including:\n- Inpatient acute care\n- Emergency department services\n- Outpatient surgical services\n- Laboratory and diagnostic imaging\n- Cardiology and orthopedic services\n\n3.2 Standards of Care. All services shall be rendered in accordance with generally accepted standards of medical practice.\n\n3.3 Access Standards.\n- Urgent care: within 24 hours\n- Routine sick visit: within 48 hours\n- Preventive visit: within 30 calendar days" },
  { page: 5, title: "ARTICLE 4 – COMPENSATION", content: "4.1 Reimbursement. Plan shall reimburse Provider per the Fee Schedule (Exhibit A).\n\n4.2 Rate Methodology.\n- Inpatient: MS-DRG at 125% of CMS Base Rate ($6,842.78)\n- Outpatient: APC at 140% of Medicare OPPS\n- Emergency: $385 facility fee + professional fees at 120% MPFS\n\n4.3 Claims Submission. Clean Claims within 90 calendar days of date of service. Electronic via ANSI X12 837.\n\n4.4 Payment Timeline. 30 calendar days for electronic, 45 for paper. Interest at 1.5%/month on late payments." },
  { page: 6, title: "ARTICLE 4 – COMPENSATION (continued)", content: "4.5 Coordination of Benefits. Provider shall verify Member eligibility prior to rendering non-emergency services.\n\n4.6 Rate Escalator. CPI-U Medical Care Component, capped at 3.5% annually, effective each January 1.\n\n4.7 Overpayment Recovery. Plan may recover overpayments by offset against future claims within 24 months of original payment." },
  { page: 7, title: "ARTICLE 5 – TERMINATION", content: "5.1 Without Cause. Either party may terminate with 180 days written notice.\n\n5.2 For Cause. 60 days written notice with 30-day cure period for material breach.\n\n5.3 Immediate Termination upon:\n(a) Revocation of license or DEA registration\n(b) Exclusion from Medicare/Medicaid\n(c) Conviction of healthcare fraud\n(d) Loss of liability insurance\n\n5.4 Continuity of Care. Provider continues treating Members with active treatment plans for 90 days post-termination.\n\n5.5 Run-Out. Claims for services prior to termination may be submitted for 180 days." },
  { page: 8, title: "ARTICLE 6 – COMPLIANCE", content: "6.1 HIPAA. Both parties shall comply with HIPAA Privacy and Security Rules (45 CFR Parts 160 and 164).\n\n6.2 Fraud, Waste & Abuse. Provider shall maintain an effective compliance program per OIG guidelines.\n\n6.3 Credentialing. Provider shall maintain current credentials per NCQA standards. Re-credentialing every 3 years.\n\n6.4 Audit Rights. Plan may audit Provider's records, facilities, and claims data with 30 days notice.\n\n6.5 No Surprises Act. Compliance per Public Law 116-260." },
  { page: 9, title: "ARTICLE 7 – QUALITY ASSURANCE", content: "7.1 Provider shall participate in Plan's quality improvement programs including HEDIS reporting, peer review, and utilization management.\n\n7.2 Performance Metrics:\n- HEDIS Composite Score: ≥ 75th percentile\n- CAHPS Patient Satisfaction: ≥ 4.0/5.0\n- Readmission Rate: ≤ 12%\n- ED Utilization: ≤ 450/1000 members\n\n7.3 Pay-for-Performance. Annual P4P incentive up to 3% of total reimbursement based on quality metrics." },
  { page: 10, title: "ARTICLE 8 – DISPUTE RESOLUTION", content: "8.1 Negotiation. Good-faith resolution within 30 days.\n\n8.2 Mediation. If unresolved, submit to mediation within 60 days.\n\n8.3 Arbitration. Binding arbitration under AAA Commercial Rules. Costs shared equally.\n\n8.4 Venue. State of Provider's principal office." },
  ...Array.from({ length: 42 }, (_, i) => ({
    page: 11 + i,
    title: i < 10 ? `EXHIBIT ${String.fromCharCode(65 + i)}` : `APPENDIX ${i - 9}`,
    content: `[${i < 10 ? `Exhibit ${String.fromCharCode(65 + i)}` : `Appendix ${i - 9}`} content — ${
      i === 0 ? "Fee Schedule & Reimbursement Methodology" :
      i === 1 ? "Service Area Map & Practice Locations" :
      i === 2 ? "Quality Performance Metrics & P4P Program" :
      i === 3 ? "HIPAA Business Associate Agreement" :
      i === 4 ? "Credentialing & Re-Credentialing Requirements" :
      i === 5 ? "Provider Manual (incorporated by reference)" :
      `Supporting documentation and schedules – Page ${11 + i}`
    }]\n\nThis section contains detailed specifications, rate tables, and supporting documentation referenced in the main agreement body.`
  })),
];

const suggestedQuestions = [
  "What are the payment terms and reimbursement rates?",
  "What are the termination provisions?",
  "What HIPAA compliance requirements are included?",
  "What are the quality metrics and performance thresholds?",
  "What is the contract term and renewal process?",
  "What are the dispute resolution procedures?",
  "Summarize the key obligations of the Provider",
  "What exhibits are included in this agreement?",
];

/* Deterministic chat responses */
function generateChatResponse(question: string): ChatMessage {
  const q = question.toLowerCase();
  const id = `msg-${Date.now()}`;

  if (q.includes("payment") || q.includes("reimbursement") || q.includes("rate") || q.includes("compensation")) {
    return {
      id, role: "assistant",
      text: "The agreement specifies a multi-tiered reimbursement methodology:\n\n**Inpatient:** MS-DRG at 125% of CMS Base Rate ($6,842.78)\n**Outpatient:** APC at 140% of Medicare OPPS\n**Emergency:** $385 facility fee + professional fees at 120% MPFS\n\nClean Claims must be submitted within 90 calendar days via EDI 837. Payment timeline is 30 days for electronic submissions with 1.5%/month interest on late payments.\n\nAnnual rate escalator is tied to CPI-U Medical Care Component, capped at 3.5%.",
      citations: [{ page: 5, label: "Page 5" }, { page: 6, label: "Page 6" }],
      tableExcerpt: "| Service Type | Rate Basis | Rate |\n|---|---|---|\n| Inpatient | MS-DRG | 125% CMS ($6,842.78) |\n| Outpatient | APC | 140% Medicare OPPS |\n| Emergency | Flat + MPFS | $385 + 120% MPFS |\n| Escalator | CPI-U | Capped at 3.5%/yr |",
    };
  }
  if (q.includes("termination")) {
    return {
      id, role: "assistant",
      text: "The contract includes comprehensive termination provisions:\n\n**Without Cause:** Either party may terminate with 180 days written notice.\n**For Cause:** 60 days notice with a 30-day cure period for material breach.\n**Immediate Termination:** Upon license revocation, federal exclusion, fraud conviction, or loss of liability insurance.\n\n**Continuity of Care:** Provider must continue treating Members with active treatment plans for 90 days post-termination.\n**Run-Out:** Claims can be submitted up to 180 days after termination.",
      citations: [{ page: 7, label: "Page 7" }],
    };
  }
  if (q.includes("hipaa") || q.includes("compliance") || q.includes("regulatory")) {
    return {
      id, role: "assistant",
      text: "The agreement includes robust compliance requirements:\n\n**HIPAA:** Full compliance with Privacy and Security Rules (45 CFR Parts 160 and 164).\n**FWA:** Provider must maintain an effective compliance program per OIG guidelines.\n**Credentialing:** NCQA standards with re-credentialing every 3 years.\n**Audit Rights:** Plan may audit records and claims data with 30 days notice.\n**No Surprises Act:** Compliance per Public Law 116-260.",
      citations: [{ page: 8, label: "Page 8" }],
    };
  }
  if (q.includes("quality") || q.includes("performance") || q.includes("metric")) {
    return {
      id, role: "assistant",
      text: "Quality assurance requirements include participation in Plan's improvement programs:\n\n**Performance Thresholds:**\n- HEDIS Composite Score: ≥ 75th percentile\n- CAHPS Patient Satisfaction: ≥ 4.0/5.0\n- Readmission Rate: ≤ 12%\n- ED Utilization: ≤ 450/1000 members\n\n**Pay-for-Performance:** Annual P4P incentive up to 3% of total reimbursement based on quality metrics.",
      citations: [{ page: 9, label: "Page 9" }],
      tableExcerpt: "| Metric | Threshold |\n|---|---|\n| HEDIS Score | ≥ 75th percentile |\n| CAHPS | ≥ 4.0/5.0 |\n| Readmission Rate | ≤ 12% |\n| ED Utilization | ≤ 450/1000 |",
    };
  }
  if (q.includes("term") || q.includes("renewal") || q.includes("effective")) {
    return {
      id, role: "assistant",
      text: "**Effective Date:** January 1, 2026\n**Initial Term:** Three (3) years\n**Renewal:** Automatic renewal for successive one-year terms unless 180 days written notice of non-renewal is provided.\n**Rate Review:** Annual review no later than 90 days prior to each anniversary.",
      citations: [{ page: 3, label: "Page 3" }],
    };
  }
  if (q.includes("dispute") || q.includes("resolution") || q.includes("arbitration")) {
    return {
      id, role: "assistant",
      text: "The agreement provides progressive dispute resolution:\n\n1. **Negotiation:** Good-faith resolution within 30 days\n2. **Mediation:** If unresolved, submit to mediation within 60 days\n3. **Arbitration:** Binding arbitration under AAA Commercial Rules with costs shared equally\n\n**Venue:** State of Provider's principal office.",
      citations: [{ page: 10, label: "Page 10" }],
    };
  }
  if (q.includes("obligation") || q.includes("provider") || q.includes("summarize") || q.includes("summary")) {
    return {
      id, role: "assistant",
      text: "**Key Provider Obligations:**\n\n1. Deliver all medically necessary Covered Services to eligible Members\n2. Maintain staffing, facilities, and access standards (urgent within 24h, routine within 48h)\n3. Submit Clean Claims within 90 days via EDI 837\n4. Maintain NCQA credentials with re-credentialing every 3 years\n5. Comply with HIPAA Privacy & Security Rules\n6. Participate in quality programs (HEDIS, CAHPS, P4P)\n7. Maintain FWA compliance program\n8. Provide 90-day continuity of care post-termination",
      citations: [{ page: 4, label: "Page 4" }, { page: 8, label: "Page 8" }, { page: 9, label: "Page 9" }],
    };
  }
  if (q.includes("exhibit") || q.includes("appendix") || q.includes("attachment")) {
    return {
      id, role: "assistant",
      text: "The agreement includes the following exhibits:\n\n- **Exhibit A** – Fee Schedule & Reimbursement Methodology\n- **Exhibit B** – Service Area Map & Practice Locations\n- **Exhibit C** – Quality Performance Metrics & P4P Program\n- **Exhibit D** – HIPAA Business Associate Agreement\n- **Exhibit E** – Credentialing & Re-Credentialing Requirements\n- **Exhibit F** – Provider Manual (incorporated by reference)\n\nEach exhibit may be amended by mutual written agreement. Provider Manual amendments take effect 30 days after written notice.",
      citations: [{ page: 11, label: "Page 11" }, { page: 12, label: "Page 12" }],
    };
  }

  return {
    id, role: "assistant",
    text: `Based on my analysis of this 52-page Provider Services Agreement, I can help you with specific questions about:\n\n• Payment terms & rates (Article 4)\n• Termination provisions (Article 5)\n• HIPAA & compliance (Article 6)\n• Quality metrics (Article 7)\n• Dispute resolution (Article 8)\n• Exhibits & appendices\n\nPlease ask about any specific section or topic.`,
    citations: [{ page: 1, label: "Page 1" }],
  };
}

const processingSteps = [
  "Extracting pages…",
  "Detecting sections…",
  "Extracting clauses & metadata…",
  "Building knowledge base…",
  "Ready",
];

export default function DraftFromExisting({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState<Step>(() => get("oci_dfe_step", "upload"));
  const [fileName, setFileName] = useState<string>(() => get("oci_dfe_filename", ""));
  const [processingIdx, setProcessingIdx] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => get("oci_dfe_chat", []));
  const [chatInput, setChatInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [zoom, setZoom] = useState(100);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const totalPages = mockPages.length;

  useEffect(() => { set("oci_dfe_step", step); }, [step]);
  useEffect(() => { set("oci_dfe_filename", fileName); }, [fileName]);
  useEffect(() => { set("oci_dfe_chat", chatMessages); }, [chatMessages]);
  useEffect(() => { chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  const handleFileSelect = (name: string) => {
    setFileName(name);
  };

  const handleUseSample = () => {
    setFileName("Provider_Services_Agreement_52p.pdf");
  };

  const handleProcess = useCallback(() => {
    if (!fileName) return;
    setStep("processing");
    setProcessingIdx(0);
  }, [fileName]);

  useEffect(() => {
    if (step !== "processing") return;
    if (processingIdx >= processingSteps.length) {
      setTimeout(() => setStep("viewer"), 500);
      return;
    }
    const t = setTimeout(() => setProcessingIdx(i => i + 1), 1500);
    return () => clearTimeout(t);
  }, [step, processingIdx]);

  const handleSend = (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: "user", text };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput("");
    setLoading(true);
    setTimeout(() => {
      const resp = generateChatResponse(text);
      setChatMessages(prev => [...prev, resp]);
      setLoading(false);
    }, 800 + Math.random() * 600);
  };

  const handleCitationClick = (page: number) => {
    setCurrentPage(page);
  };

  const handleNewContract = () => {
    setStep("upload");
    setFileName("");
    setChatMessages([]);
    setCurrentPage(1);
    setProcessingIdx(0);
    localStorage.removeItem("oci_dfe_step");
    localStorage.removeItem("oci_dfe_filename");
    localStorage.removeItem("oci_dfe_chat");
  };

  const currentPageData = mockPages[currentPage - 1];

  /* ─── UPLOAD STEP ─── */
  if (step === "upload") {
    return (
      <div className="min-h-[70vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <div className="w-px h-5 bg-border" />
            <span className="text-sm font-semibold text-primary">Contract Intelligence</span>
          </div>
          <button disabled className="px-3 py-1.5 bg-muted text-muted-foreground rounded-lg text-xs font-medium opacity-50 cursor-not-allowed flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> New contract
          </button>
        </div>

        {/* Center Content */}
        <div className="flex-1 flex flex-col items-center justify-center max-w-xl mx-auto w-full">
          <h2 className="text-2xl font-bold text-foreground mb-2 text-center">Contract intelligence, simplified</h2>
          <p className="text-sm text-muted-foreground mb-8 text-center">Upload a provider contract and get instant answers with precise citations</p>

          {fileName && (
            <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-primary/5 border border-primary/20 rounded-lg">
              <FileText className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">{fileName}</span>
              <button onClick={() => setFileName("")} className="text-muted-foreground hover:text-destructive ml-2">×</button>
            </div>
          )}

          {/* Drop zone */}
          <div
            onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFileSelect(f.name); }}
            onDragOver={e => e.preventDefault()}
            className="w-full border-2 border-dashed rounded-xl p-12 text-center hover:border-primary/50 transition-colors cursor-pointer bg-card"
          >
            <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-base font-medium text-foreground mb-1">Drag & drop a contract PDF here</p>
            <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
            <label className="inline-flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-lg cursor-pointer hover:opacity-90 font-medium text-sm">
              Browse Files
              <input type="file" className="hidden" accept=".pdf" onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f.name); }} />
            </label>
            <p className="text-xs text-muted-foreground mt-4">Supports PDF files up to 100 pages</p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 mt-6 w-full">
            <button
              onClick={handleProcess}
              disabled={!fileName}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Process Contract
            </button>
            <button onClick={handleUseSample} className="text-sm text-primary hover:underline whitespace-nowrap">
              Use sample contract
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ─── PROCESSING STEP ─── */
  if (step === "processing") {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <div className="flex items-center justify-between w-full max-w-md mb-12">
          <span className="text-sm font-semibold text-primary">Contract Intelligence</span>
          <button onClick={handleNewContract} className="px-3 py-1.5 bg-muted text-muted-foreground rounded-lg text-xs font-medium flex items-center gap-1.5 hover:bg-muted/80">
            <Plus className="w-3.5 h-3.5" /> New contract
          </button>
        </div>
        <div className="flex flex-col items-center gap-6 max-w-md">
          <div className="relative w-20 h-20">
            <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <Loader2 className="w-8 h-8 text-primary absolute inset-0 m-auto animate-pulse" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-foreground mb-2">Processing contract…</h2>
            <p className="text-sm text-muted-foreground">Extracting text and building knowledge base. This usually takes a minute or two.</p>
          </div>
          <div className="w-full space-y-2 mt-4">
            {processingSteps.map((s, i) => (
              <div key={s} className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg transition-all ${
                i < processingIdx ? "text-foreground bg-emerald-50" :
                i === processingIdx ? "text-foreground bg-primary/5 font-medium" :
                "text-muted-foreground"
              }`}>
                {i < processingIdx ? (
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs">✓</span>
                ) : i === processingIdx ? (
                  <Loader2 className="w-4 h-4 text-primary animate-spin" />
                ) : (
                  <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground">{i + 1}</span>
                )}
                {s}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <FileText className="w-3.5 h-3.5" />
            <span>{fileName}</span>
          </div>
        </div>
      </div>
    );
  }

  /* ─── VIEWER + CHAT STEP ─── */
  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between px-1 pb-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <div className="w-px h-5 bg-border" />
          <span className="text-sm font-semibold text-primary">Contract Intelligence</span>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground truncate max-w-[200px]">{fileName}</span>
        </div>
        <button onClick={handleNewContract} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium flex items-center gap-1.5 hover:opacity-90">
          <Plus className="w-3.5 h-3.5" /> New contract
        </button>
      </div>

      {/* Split View */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* LEFT: Contract Viewer */}
        <div className="flex-1 flex flex-col border rounded-xl bg-card overflow-hidden min-w-0">
          <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
            <span className="text-xs font-semibold text-foreground">Contract Viewer</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setZoom(z => Math.max(70, z - 10))} className="p-1 hover:bg-muted rounded" title="Zoom out">
                <ZoomOut className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
              <span className="text-[10px] text-muted-foreground w-8 text-center">{zoom}%</span>
              <button onClick={() => setZoom(z => Math.min(150, z + 10))} className="p-1 hover:bg-muted rounded" title="Zoom in">
                <ZoomIn className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Page content */}
          <div className="flex-1 overflow-y-auto p-6" style={{ fontSize: `${zoom}%` }}>
            <div className="max-w-[600px] mx-auto">
              <div className="text-center mb-6">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Page {currentPage} of {totalPages}</span>
              </div>
              {currentPageData && (
                <>
                  <h3 className="text-sm font-bold text-foreground mb-4 text-center tracking-wide">{currentPageData.title}</h3>
                  <div className="text-xs text-foreground leading-relaxed whitespace-pre-line font-serif">
                    {currentPageData.content}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Page navigation */}
          <div className="flex items-center justify-center gap-3 px-4 py-2 border-t bg-muted/30">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1} className="p-1.5 hover:bg-muted rounded disabled:opacity-30">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-medium text-foreground min-w-[60px] text-center">{currentPage} / {totalPages}</span>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} className="p-1.5 hover:bg-muted rounded disabled:opacity-30">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* RIGHT: Chat Panel */}
        <div className="w-[380px] flex-shrink-0 flex flex-col border rounded-xl bg-card overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2 border-b bg-muted/30">
            <MessageSquare className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold text-foreground">Ask about your contract</span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
            {chatMessages.length === 0 && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground text-center py-2">Ask questions about your contract. I'll provide answers with page-level citations.</p>
                <div className="space-y-1.5">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Suggested questions</p>
                  {suggestedQuestions.map(q => (
                    <button
                      key={q}
                      onClick={() => handleSend(q)}
                      className="w-full text-left text-xs px-3 py-2 rounded-lg border hover:bg-primary/5 hover:border-primary/30 transition-colors text-foreground"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {chatMessages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[90%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed ${
                  msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                }`}>
                  <div className="whitespace-pre-line">{msg.text}</div>
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-foreground/10">
                      {msg.citations.map(c => (
                        <button
                          key={c.page}
                          onClick={() => handleCitationClick(c.page)}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 font-medium transition-colors"
                        >
                          📄 {c.label}
                        </button>
                      ))}
                    </div>
                  )}
                  {msg.tableExcerpt && (
                    <div className="mt-2 pt-2 border-t border-foreground/10">
                      <div className="bg-background/50 rounded-lg p-2 text-[10px] font-mono overflow-x-auto">
                        <table className="w-full">
                          <tbody>
                            {msg.tableExcerpt.split("\n").filter(r => r.trim() && !r.startsWith("|---")).map((row, ri) => (
                              <tr key={ri} className={ri === 0 ? "font-semibold border-b border-border" : ""}>
                                {row.split("|").filter(c => c.trim()).map((cell, ci) => (
                                  <td key={ci} className="px-2 py-1 text-left">{cell.trim()}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-xl px-3.5 py-2.5 text-xs flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin" /> Analyzing contract…
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Suggested questions (after chat started) */}
          {chatMessages.length > 0 && (
            <div className="px-3 py-1.5 border-t flex gap-1 overflow-x-auto flex-shrink-0">
              {suggestedQuestions.slice(0, 4).map(q => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  className="text-[9px] px-2 py-1 rounded-full border whitespace-nowrap hover:bg-primary/5 hover:border-primary/30 transition-colors text-muted-foreground flex-shrink-0"
                >
                  {q.length > 30 ? q.slice(0, 30) + "…" : q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t flex gap-2 flex-shrink-0">
            <input
              className="flex-1 border rounded-lg px-3 py-2 text-xs bg-background"
              placeholder="Ask about your contract…"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSend(chatInput)}
            />
            <button
              onClick={() => handleSend(chatInput)}
              disabled={loading || !chatInput.trim()}
              className="bg-primary text-primary-foreground p-2 rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
