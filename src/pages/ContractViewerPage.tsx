import { useState, useRef, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, GitCompare, FileDown, ChevronDown, Shield, FileText,
  Bot, Send, X, Sparkles, Clock, ChevronUp, Search, ArrowRight,
  AlertTriangle, CheckCircle, Info,
} from "lucide-react";
import { api } from "@/services/mockApi";
import { seedContractFamilies } from "@/data/seed";
import { toast } from "sonner";

function getDocById(id: string) {
  for (const fam of seedContractFamilies) {
    const doc = fam.documents.find(d => d.id === id);
    if (doc) return { doc, family: fam };
  }
  return null;
}

// Clause data with section anchors, categories, and confidence
interface ExtractedClause {
  id: string;
  name: string;
  sectionId: string;
  sectionRef: string;
  pageRef: string;
  category: "Compliance" | "Financial" | "Risk" | "Operational" | "Legal";
  confidence: "High" | "Medium" | "Low";
  alignment: "aligned" | "nonAligned" | "missing";
  summary: string;
}

const extractedClauses: ExtractedClause[] = [
  { id: "ec-1", name: "Payment Terms", sectionId: "s5", sectionRef: "4.1", pageRef: "Page 18", category: "Financial", confidence: "High", alignment: "aligned", summary: "Standard reimbursement at 120% Medicare Fee Schedule" },
  { id: "ec-2", name: "Termination Without Cause", sectionId: "s8", sectionRef: "7.1", pageRef: "Page 22", category: "Risk", confidence: "High", alignment: "nonAligned", summary: "180-day notice required; continuity of care provisions apply" },
  { id: "ec-3", name: "HIPAA Compliance", sectionId: "s9", sectionRef: "8.1", pageRef: "Page 30", category: "Compliance", confidence: "High", alignment: "aligned", summary: "Full HIPAA compliance with 24-hour breach notification" },
  { id: "ec-4", name: "Rate Escalator", sectionId: "s10", sectionRef: "3.10", pageRef: "Page 43", category: "Financial", confidence: "Medium", alignment: "nonAligned", summary: "5% annual escalator using CPI-U methodology" },
  { id: "ec-5", name: "Prior Authorization", sectionId: "s6", sectionRef: "5.1", pageRef: "Page 20", category: "Operational", confidence: "Medium", alignment: "aligned", summary: "Required for advanced services; emergency exempt" },
  { id: "ec-6", name: "Credentialing", sectionId: "s4", sectionRef: "3.4", pageRef: "Page 12", category: "Compliance", confidence: "High", alignment: "aligned", summary: "NCQA standards required for all practitioners" },
  { id: "ec-7", name: "Scope of Agreement", sectionId: "s1", sectionRef: "1.0", pageRef: "Page 1", category: "Legal", confidence: "High", alignment: "aligned", summary: "Covers all medically necessary services within service area" },
  { id: "ec-8", name: "Quality & Reporting", sectionId: "s7", sectionRef: "6.1", pageRef: "Page 24", category: "Operational", confidence: "Medium", alignment: "aligned", summary: "HEDIS measures and quarterly reporting required" },
  { id: "ec-9", name: "Network Adequacy", sectionId: "missing", sectionRef: "—", pageRef: "—", category: "Compliance", confidence: "Low", alignment: "missing", summary: "Missing: No network adequacy clause found" },
  { id: "ec-10", name: "Dispute Resolution", sectionId: "s3", sectionRef: "2.2", pageRef: "Page 8", category: "Legal", confidence: "Low", alignment: "nonAligned", summary: "Binding arbitration without progressive escalation" },
];

const mockSections = [
  { id: "s1", title: "RECITALS", content: "WHEREAS, Health Plan is a managed care organization licensed to operate under applicable state and federal regulations; and WHEREAS, Provider is a licensed healthcare entity duly organized and operating under the laws of the applicable state jurisdiction; and WHEREAS, the parties desire to enter into this Agreement for Provider to render Covered Services to Members within the designated Service Area." },
  { id: "s2", title: "ARTICLE I — DEFINITIONS", content: '"Clean Claim" means a claim submitted with all required data elements and documentation necessary for processing.\n"Covered Services" means medically necessary healthcare services as defined in the Member\'s Evidence of Coverage.\n"Member" means an individual enrolled in one of Health Plan\'s products.\n"Fee Schedule" means the schedule of reimbursement rates attached as Exhibit A.\n"PHI" means Protected Health Information as defined by HIPAA.' },
  { id: "s3", title: "ARTICLE II — TERM AND EFFECTIVE DATE", content: "2.1 This Agreement shall be effective as of January 1, 2025 and shall continue for an initial term of three (3) years through December 31, 2027.\n2.2 This Agreement shall automatically renew for successive one (1) year terms unless either party provides written notice of non-renewal at least one hundred eighty (180) days prior to the expiration of the then-current term." },
  { id: "s4", title: "ARTICLE III — PROVIDER OBLIGATIONS", content: "3.1 Provider shall deliver all Covered Services in accordance with accepted standards of medical practice.\n3.2 Provider shall maintain all required licenses, certifications, and accreditations.\n3.3 Provider shall participate in Health Plan's quality improvement and utilization management programs.\n3.4 Provider shall comply with all credentialing and recredentialing requirements." },
  { id: "s5", title: "ARTICLE IV — COMPENSATION", content: "4.1 Health Plan shall reimburse Provider in accordance with the Fee Schedule attached as Exhibit A, which is based on 120% of the Medicare Fee Schedule.\n4.2 Payment shall be made within thirty (30) calendar days of receipt of a Clean Claim.\n4.3 Claims must be submitted within ninety (90) days of the date of service.\n4.4 Annual rate adjustments shall be made based on CPI-U methodology, effective January 1 of each contract year." },
  { id: "s6", title: "ARTICLE V — UTILIZATION MANAGEMENT", content: "5.1 Certain services require prior authorization as specified in the Prior Authorization List.\n5.2 Emergency services are exempt from prior authorization requirements.\n5.3 Provider may request peer-to-peer review for authorization denials." },
  { id: "s7", title: "ARTICLE VI — QUALITY & REPORTING", content: "6.1 Provider shall participate in Health Plan quality improvement programs.\n6.2 HEDIS quality measures reporting is required on a quarterly basis.\n6.3 Patient satisfaction surveys shall be conducted quarterly.\n6.4 Provider shall participate in annual peer review activities." },
  { id: "s8", title: "ARTICLE VII — TERMINATION", content: "7.1 Either party may terminate this Agreement without cause upon one hundred eighty (180) days prior written notice to the other party.\n7.2 Health Plan may terminate immediately for cause, including but not limited to: loss of license, exclusion from federal healthcare programs, or fraud.\n7.3 Upon termination, Provider shall continue to render Covered Services to Members who are hospitalized at the time of termination until discharge." },
  { id: "s9", title: "ARTICLE VIII — HIPAA & PRIVACY", content: "8.1 Provider shall comply with all HIPAA Privacy and Security Rules.\n8.2 PHI shall be encrypted at rest using AES-256 and in transit using TLS 1.2 or higher.\n8.3 Any breach of PHI must be reported to Health Plan within twenty-four (24) hours of discovery.\n8.4 Provider shall maintain cyber liability insurance of no less than five million dollars ($5,000,000)." },
  { id: "s10", title: "SECTION 3.10 — CONTRACT RATE ADJUSTMENT", content: "3.10.1 The rate escalator percentage shall be 5% annually, applied using CPI-U methodology.\n3.10.2 Rate adjustments shall be effective on each contract anniversary date.\n3.10.3 Adjustments are subject to Health Plan's annual rate review and state regulatory approval where applicable.\n3.10.4 Separate negotiated rates may apply to specialized surgical categories and shall be documented in Exhibit B." },
];

const categoryIcons: Record<string, typeof Shield> = {
  Compliance: Shield, Financial: FileText, Risk: AlertTriangle, Operational: CheckCircle, Legal: Info,
};
const categoryColors: Record<string, string> = {
  Compliance: "bg-blue-100 text-blue-700", Financial: "bg-emerald-100 text-emerald-700",
  Risk: "bg-red-100 text-red-700", Operational: "bg-purple-100 text-purple-700", Legal: "bg-amber-100 text-amber-700",
};
const confidenceColors: Record<string, string> = {
  High: "bg-emerald-100 text-emerald-700", Medium: "bg-amber-100 text-amber-700", Low: "bg-red-100 text-red-700",
};
const alignmentStyles: Record<string, string> = {
  aligned: "border-l-4 border-l-emerald-400",
  nonAligned: "border-l-4 border-l-red-400",
  missing: "border-l-4 border-l-gray-300",
};
const highlightBg: Record<string, string> = {
  selected: "bg-yellow-100 ring-2 ring-yellow-400",
  aligned: "border-emerald-200 bg-emerald-50/30",
  nonAligned: "border-red-200 bg-red-50/30",
  hover: "bg-yellow-50",
};

const mockIntelligence = [
  { label: "HIPAA Compliance", badge: "Pass", summary: "Full compliance with Privacy and Security Rules. AES-256 encryption verified.", citation: "Section 8.1 • Page 30" },
  { label: "Data Protection", badge: "Review", summary: "Cyber liability insurance meets $5M minimum. Breach notification within 24 hours.", citation: "Section 8.3 • Page 31" },
  { label: "Confidentiality", badge: "Pass", summary: "5-year post-termination protection period. Return/destroy provisions included.", citation: "Section 9.1 • Page 35" },
  { label: "Risk Signals", badge: "2 Found", summary: "Non-compete clause and unilateral rate adjustment identified as potential risks.", citation: "Section 11.1 • Page 40" },
];

const badgeColors: Record<string, string> = {
  Pass: "bg-emerald-100 text-emerald-700",
  Review: "bg-amber-100 text-amber-700",
  "2 Found": "bg-red-100 text-red-700",
};

export default function ContractViewerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedClauseId, setSelectedClauseId] = useState<string | null>(null);
  const [hoveredClauseId, setHoveredClauseId] = useState<string | null>(null);
  const [clauseSearch, setClauseSearch] = useState("");
  const [popoverClauseId, setPopoverClauseId] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [rightTab, setRightTab] = useState<"clauses" | "intelligence">("clauses");
  const bottomRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const result = id ? getDocById(id) : null;
  const docName = result?.doc.name || "Contract Document";
  const familyName = result?.family.name || "";

  // Filtered clauses
  const filteredClauses = useMemo(() => {
    if (!clauseSearch) return extractedClauses;
    const q = clauseSearch.toLowerCase();
    return extractedClauses.filter(c =>
      c.name.toLowerCase().includes(q) || c.category.toLowerCase().includes(q) || c.summary.toLowerCase().includes(q)
    );
  }, [clauseSearch]);

  // Non-aligned / high-risk iterators
  const nonAlignedIds = extractedClauses.filter(c => c.alignment === "nonAligned").map(c => c.id);
  const highRiskIds = extractedClauses.filter(c => c.confidence === "Low" || c.alignment === "nonAligned").map(c => c.id);

  const scrollToClause = (clause: ExtractedClause) => {
    if (clause.sectionId !== "missing" && sectionRefs.current[clause.sectionId]) {
      sectionRefs.current[clause.sectionId]!.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    setSelectedClauseId(clause.id);
    setPopoverClauseId(null);
  };

  const navigateClause = (direction: "next" | "prev", list?: string[]) => {
    const ids = list || extractedClauses.filter(c => c.sectionId !== "missing").map(c => c.id);
    if (ids.length === 0) return;
    const currentIdx = selectedClauseId ? ids.indexOf(selectedClauseId) : -1;
    let nextIdx = direction === "next" ? currentIdx + 1 : currentIdx - 1;
    if (nextIdx < 0) nextIdx = ids.length - 1;
    if (nextIdx >= ids.length) nextIdx = 0;
    const clause = extractedClauses.find(c => c.id === ids[nextIdx]);
    if (clause) scrollToClause(clause);
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatLoading]);

  const sendChat = async (text: string) => {
    if (!text.trim()) return;
    setChatMessages(m => [...m, { role: "user", text }]);
    setChatInput("");
    setChatLoading(true);
    const response = await api.sendChatMessage("viewer-chat", text);
    setChatMessages(m => [...m, { role: "assistant", text: response }]);
    setChatLoading(false);
  };

  const exportDoc = () => {
    const content = mockSections.map(s => `${s.title}\n${"─".repeat(40)}\n${s.content}\n`).join("\n");
    const blob = new Blob([`CONTRACT: ${docName}\nExported: ${new Date().toISOString().slice(0, 10)}\n${"═".repeat(60)}\n\n${content}`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${docName.replace(/\s+/g, "_")}.txt`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Contract exported");
  };

  // Determine highlight class for a section
  const getHighlightClass = (sectionId: string) => {
    const clause = extractedClauses.find(c => c.sectionId === sectionId);
    if (!clause) return "";
    if (selectedClauseId === clause.id) return highlightBg.selected;
    if (hoveredClauseId === clause.id) return highlightBg.hover;
    if (clause.alignment === "nonAligned") return highlightBg.nonAligned;
    if (clause.alignment === "aligned") return highlightBg.aligned;
    return "";
  };

  const renderCitations = (text: string) => {
    const regex = /(Section [\d.]+\s*•\s*Page \d+)/g;
    const parts = text.split(regex);
    return parts.map((part, i) => {
      if (regex.test(part)) {
        return (
          <span key={i} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 mx-0.5 bg-secondary/10 text-secondary rounded text-[10px] font-medium cursor-pointer hover:bg-secondary/20">
            {part}
          </span>
        );
      }
      regex.lastIndex = 0;
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Left: Document */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="p-3 border-b bg-card flex items-center gap-3">
          <button onClick={() => navigate("/contracts")} className="p-1 hover:bg-muted rounded">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{docName}</p>
            <p className="text-xs text-muted-foreground">{familyName}</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" /> Last modified: 10m ago
          </div>
          <button onClick={() => navigate(`/compare?a=${id}&b=${id === "fd-1" ? "fd-4" : "fd-1"}`)} className="px-3 py-1.5 text-xs font-medium border rounded-lg hover:bg-muted flex items-center gap-1">
            <GitCompare className="w-3.5 h-3.5" /> Compare
          </button>
          <button onClick={exportDoc} className="px-3 py-1.5 text-xs font-medium border rounded-lg hover:bg-muted flex items-center gap-1">
            <FileDown className="w-3.5 h-3.5" /> Export
          </button>
        </div>

        {/* Jump controls */}
        <div className="px-4 py-2 border-b bg-muted/30 flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-semibold text-muted-foreground">NAVIGATE:</span>
          <button onClick={() => navigateClause("prev")} className="text-[10px] px-2 py-1 rounded border hover:bg-muted font-medium">← Previous clause</button>
          <button onClick={() => navigateClause("next")} className="text-[10px] px-2 py-1 rounded border hover:bg-muted font-medium">Next clause →</button>
          <span className="text-muted-foreground text-[10px]">|</span>
          <button onClick={() => navigateClause("next", nonAlignedIds)} className="text-[10px] px-2 py-1 rounded border border-red-200 hover:bg-red-50 font-medium text-red-700">Next non-aligned</button>
          <button onClick={() => navigateClause("next", highRiskIds)} className="text-[10px] px-2 py-1 rounded border border-amber-200 hover:bg-amber-50 font-medium text-amber-700">Next high risk</button>
        </div>

        {/* Document content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 relative">
          {mockSections.map(section => {
            const clause = extractedClauses.find(c => c.sectionId === section.id);
            const hlClass = getHighlightClass(section.id);
            return (
              <div
                key={section.id}
                ref={el => { sectionRefs.current[section.id] = el; }}
                data-clause-id={clause?.id || ""}
                className={`rounded-lg border p-4 transition-all cursor-pointer ${hlClass || "border-border bg-card"}`}
                onClick={() => {
                  if (clause) {
                    setPopoverClauseId(popoverClauseId === clause.id ? null : clause.id);
                    setSelectedClauseId(clause.id);
                  }
                }}
              >
                <h3 className="text-sm font-bold text-foreground mb-2">{section.title}</h3>
                <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-sans leading-relaxed">{section.content}</pre>

                {/* Clause popover/tooltip */}
                {popoverClauseId === clause?.id && clause && (
                  <div className="mt-3 bg-background border rounded-lg p-3 shadow-lg" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold">{clause.name}</span>
                      <button onClick={() => setPopoverClauseId(null)} className="p-0.5 hover:bg-muted rounded"><X className="w-3 h-3" /></button>
                    </div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${categoryColors[clause.category]}`}>{clause.category}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${confidenceColors[clause.confidence]}`}>{clause.confidence} confidence</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-secondary/10 text-secondary font-medium">§{clause.sectionRef} • {clause.pageRef}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mb-2">{clause.summary}</p>
                    <div className="flex gap-1.5">
                      <button onClick={() => navigate("/compliance-hub?tab=deviations")} className="text-[10px] px-2 py-1 rounded border hover:bg-muted font-medium">View Deviation</button>
                      <button onClick={() => { setChatOpen(true); setChatInput(`Tell me about ${clause.name}`); }} className="text-[10px] px-2 py-1 rounded border hover:bg-muted font-medium">Ask Agent</button>
                      <button onClick={() => navigate("/compliance-hub?tab=redlining")} className="text-[10px] px-2 py-1 rounded border hover:bg-muted font-medium">Add to Redlining</button>
                      <button onClick={() => navigate(`/compare?a=${id}&b=${id === "fd-1" ? "fd-4" : "fd-1"}&group=${clause.name}`)} className="text-[10px] px-2 py-1 rounded border border-primary/30 hover:bg-primary/5 font-medium text-primary">Compare across contracts</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: Intelligence panel */}
      <div className="w-80 flex-shrink-0 border-l bg-card flex flex-col overflow-hidden">
        {/* Tab switcher */}
        <div className="flex border-b">
          <button onClick={() => setRightTab("clauses")} className={`flex-1 py-2 text-xs font-semibold ${rightTab === "clauses" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}>Extracted Clauses</button>
          <button onClick={() => setRightTab("intelligence")} className={`flex-1 py-2 text-xs font-semibold ${rightTab === "intelligence" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}>Intelligence</button>
        </div>

        {rightTab === "clauses" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Search */}
            <div className="p-2 border-b">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                <input className="w-full pl-7 pr-2 py-1.5 text-[11px] border rounded bg-background" placeholder="Find in clauses…" value={clauseSearch} onChange={e => setClauseSearch(e.target.value)} />
              </div>
            </div>

            {/* Clause list */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredClauses.map(clause => {
                const CatIcon = categoryIcons[clause.category];
                const isSelected = selectedClauseId === clause.id;
                return (
                  <button
                    key={clause.id}
                    onClick={() => scrollToClause(clause)}
                    onMouseEnter={() => setHoveredClauseId(clause.id)}
                    onMouseLeave={() => setHoveredClauseId(null)}
                    className={`w-full text-left p-2 rounded transition-colors ${alignmentStyles[clause.alignment]} ${isSelected ? "bg-yellow-50 ring-1 ring-yellow-300" : "hover:bg-muted/50"}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <CatIcon className="w-3 h-3 flex-shrink-0" />
                      <span className="text-xs font-medium flex-1 truncate">{clause.name}</span>
                      {clause.alignment === "missing" && <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />}
                    </div>
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className={`text-[9px] px-1 py-0.5 rounded font-medium ${categoryColors[clause.category]}`}>{clause.category}</span>
                      <span className={`text-[9px] px-1 py-0.5 rounded font-medium ${confidenceColors[clause.confidence]}`}>{clause.confidence}</span>
                      {clause.sectionRef !== "—" && (
                        <span className="text-[9px] px-1 py-0.5 rounded bg-secondary/10 text-secondary font-medium cursor-pointer" onClick={e => { e.stopPropagation(); scrollToClause(clause); }}>
                          §{clause.sectionRef} • {clause.pageRef}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{clause.summary}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {rightTab === "intelligence" && (
          <div className="flex-1 overflow-y-auto">
            {/* Contract Metadata */}
            <div className="p-4 border-b">
              <h3 className="text-xs font-bold text-muted-foreground uppercase mb-3">Contract Metadata</h3>
              <div className="space-y-2 text-xs">
                {[
                  { label: "Type", value: result?.doc.type || "MSA" },
                  { label: "Parties", value: "Health Plan / Provider" },
                  { label: "Effective Date", value: "Jan 1, 2025" },
                  { label: "Termination Date", value: "Dec 31, 2027" },
                  { label: "Jurisdiction", value: result?.family.jurisdiction || "NY" },
                  { label: "Status", value: result?.doc.status || "Active" },
                ].map(m => (
                  <div key={m.label} className="flex justify-between">
                    <span className="text-muted-foreground">{m.label}</span>
                    <span className="font-medium text-foreground">{m.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Contract Intelligence */}
            <div className="p-4">
              <h3 className="text-xs font-bold text-muted-foreground uppercase mb-3">Contract Intelligence</h3>
              <div className="space-y-2">
                {mockIntelligence.map(intel => (
                  <div key={intel.label} className="p-2 rounded border bg-background">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">{intel.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${badgeColors[intel.badge]}`}>{intel.badge}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{intel.summary}</p>
                    <span className="inline-flex items-center gap-0.5 mt-1 px-1.5 py-0.5 bg-secondary/10 text-secondary rounded text-[9px] font-medium">{intel.citation}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Embedded Chat */}
        <div className="flex-shrink-0 border-t">
          <button onClick={() => setChatOpen(!chatOpen)} className="w-full p-3 flex items-center gap-2 hover:bg-muted/30">
            <Bot className="w-4 h-4 text-secondary" />
            <span className="text-xs font-semibold flex-1 text-left">Talk to Agent – Your CoAuthor</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${chatOpen ? "rotate-180" : ""}`} />
          </button>
          {chatOpen && (
            <div className="flex flex-col">
              <div className="overflow-y-auto p-3 space-y-2 max-h-48">
                {chatMessages.length === 0 && <p className="text-[10px] text-muted-foreground text-center mt-4">Ask about this contract…</p>}
                {chatMessages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[90%] rounded-lg px-2.5 py-1.5 text-[11px] leading-relaxed ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                      {m.role === "assistant" ? renderCitations(m.text) : m.text}
                    </div>
                  </div>
                ))}
                {chatLoading && <div className="flex justify-start"><div className="bg-muted rounded-lg px-2.5 py-1.5 text-[11px] animate-pulse">Thinking...</div></div>}
                <div ref={bottomRef} />
              </div>
              <div className="p-2 border-t flex gap-1.5">
                <input className="flex-1 border rounded px-2 py-1 text-[11px] bg-background" placeholder="Ask a question…" value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendChat(chatInput)} />
                <button onClick={() => sendChat(chatInput)} className="bg-secondary text-secondary-foreground p-1 rounded hover:opacity-90"><Send className="w-3 h-3" /></button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
