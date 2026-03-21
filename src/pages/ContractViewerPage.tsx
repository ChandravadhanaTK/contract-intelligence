import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, GitCompare, FileDown, ChevronDown, Shield, FileText,
  Bot, Send, X, Sparkles, Clock,
} from "lucide-react";
import { api } from "@/services/mockApi";
import { seedContractFamilies } from "@/data/seed";

// Get a flattened doc from families
function getDocById(id: string) {
  for (const fam of seedContractFamilies) {
    const doc = fam.documents.find(d => d.id === id);
    if (doc) return { doc, family: fam };
  }
  return null;
}

// Mock contract document sections
const mockSections = [
  { id: "s1", title: "RECITALS", content: "WHEREAS, Health Plan is a managed care organization licensed to operate under applicable state and federal regulations; and WHEREAS, Provider is a licensed healthcare entity duly organized and operating under the laws of the applicable state jurisdiction; and WHEREAS, the parties desire to enter into this Agreement for Provider to render Covered Services to Members within the designated Service Area." },
  { id: "s2", title: "ARTICLE I — DEFINITIONS", content: '1.1 "Clean Claim" means a claim submitted with all required data elements and documentation necessary for processing.\n1.2 "Covered Services" means medically necessary healthcare services as defined in the Member\'s Evidence of Coverage.\n1.3 "Member" means an individual enrolled in one of Health Plan\'s products.\n1.4 "Fee Schedule" means the schedule of reimbursement rates attached as Exhibit A.\n1.5 "PHI" means Protected Health Information as defined by HIPAA.' },
  { id: "s3", title: "ARTICLE II — TERM AND EFFECTIVE DATE", content: "2.1 This Agreement shall be effective as of January 1, 2025 and shall continue for an initial term of three (3) years through December 31, 2027.\n2.2 This Agreement shall automatically renew for successive one (1) year terms unless either party provides written notice of non-renewal at least one hundred eighty (180) days prior to the expiration of the then-current term." },
  { id: "s4", title: "ARTICLE III — PROVIDER OBLIGATIONS", content: "3.1 Provider shall deliver all Covered Services in accordance with accepted standards of medical practice.\n3.2 Provider shall maintain all required licenses, certifications, and accreditations.\n3.3 Provider shall participate in Health Plan's quality improvement and utilization management programs.\n3.4 Provider shall comply with all credentialing and recredentialing requirements." },
  { id: "s5", title: "ARTICLE IV — COMPENSATION", content: "4.1 Health Plan shall reimburse Provider in accordance with the Fee Schedule attached as Exhibit A, which is based on 120% of the Medicare Fee Schedule.\n4.2 Payment shall be made within thirty (30) calendar days of receipt of a Clean Claim.\n4.3 Claims must be submitted within ninety (90) days of the date of service.\n4.4 Annual rate adjustments shall be made based on CPI-U methodology, effective January 1 of each contract year." },
  { id: "s6", title: "ARTICLE V — UTILIZATION MANAGEMENT", content: "5.1 Certain services require prior authorization as specified in the Prior Authorization List.\n5.2 Emergency services are exempt from prior authorization requirements.\n5.3 Provider may request peer-to-peer review for authorization denials." },
  { id: "s7", title: "ARTICLE VI — QUALITY & REPORTING", content: "6.1 Provider shall participate in Health Plan quality improvement programs.\n6.2 HEDIS quality measures reporting is required on a quarterly basis.\n6.3 Patient satisfaction surveys shall be conducted quarterly.\n6.4 Provider shall participate in annual peer review activities." },
  { id: "s8", title: "ARTICLE VII — TERMINATION", content: "7.1 Either party may terminate this Agreement without cause upon one hundred eighty (180) days prior written notice to the other party.\n7.2 Health Plan may terminate immediately for cause, including but not limited to: loss of license, exclusion from federal healthcare programs, or fraud.\n7.3 Upon termination, Provider shall continue to render Covered Services to Members who are hospitalized at the time of termination until discharge." },
  { id: "s9", title: "ARTICLE VIII — HIPAA & PRIVACY", content: "8.1 Provider shall comply with all HIPAA Privacy and Security Rules.\n8.2 PHI shall be encrypted at rest using AES-256 and in transit using TLS 1.2 or higher.\n8.3 Any breach of PHI must be reported to Health Plan within twenty-four (24) hours of discovery.\n8.4 Provider shall maintain cyber liability insurance of no less than five million dollars ($5,000,000)." },
  { id: "s10", title: "SECTION 3.10 — CONTRACT RATE ADJUSTMENT", content: "3.10.1 The rate escalator percentage shall be 5% annually, applied using CPI-U methodology.\n3.10.2 Rate adjustments shall be effective on each contract anniversary date.\n3.10.3 Adjustments are subject to Health Plan's annual rate review and state regulatory approval where applicable.\n3.10.4 Separate negotiated rates may apply to specialized surgical categories and shall be documented in Exhibit B." },
];

const mockClauses = [
  { id: "ec-1", name: "Payment Terms", section: "Article IV", risk: "low" as const, summary: "Standard reimbursement at 120% Medicare Fee Schedule" },
  { id: "ec-2", name: "Termination Without Cause", section: "Article VII", risk: "high" as const, summary: "180-day notice required; continuity of care provisions apply" },
  { id: "ec-3", name: "HIPAA Compliance", section: "Article VIII", risk: "high" as const, summary: "Full HIPAA compliance with 24-hour breach notification" },
  { id: "ec-4", name: "Rate Escalator", section: "Section 3.10", risk: "medium" as const, summary: "5% annual escalator using CPI-U methodology" },
  { id: "ec-5", name: "Prior Authorization", section: "Article V", risk: "medium" as const, summary: "Required for advanced services; emergency exempt" },
  { id: "ec-6", name: "Credentialing", section: "Article III", risk: "low" as const, summary: "NCQA standards required for all practitioners" },
];

const mockIntelligence = [
  { label: "HIPAA Compliance", badge: "Pass", summary: "Full compliance with Privacy and Security Rules. AES-256 encryption verified.", citation: "Section 8.1 • Page 30" },
  { label: "Data Protection", badge: "Review", summary: "Cyber liability insurance meets $5M minimum. Breach notification within 24 hours.", citation: "Section 8.3 • Page 31" },
  { label: "Confidentiality", badge: "Pass", summary: "5-year post-termination protection period. Return/destroy provisions included.", citation: "Section 9.1 • Page 35" },
  { label: "Risk Signals", badge: "2 Found", summary: "Non-compete clause and unilateral rate adjustment identified as potential risks.", citation: "Section 11.1 • Page 40" },
];

const riskColors = {
  low: "bg-emerald-100 text-emerald-700",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-red-100 text-red-700",
};

const badgeColors: Record<string, string> = {
  Pass: "bg-emerald-100 text-emerald-700",
  Review: "bg-amber-100 text-amber-700",
  "2 Found": "bg-red-100 text-red-700",
};

export default function ContractViewerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [highlightSection, setHighlightSection] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const result = id ? getDocById(id) : null;
  const docName = result?.doc.name || "Contract Document";
  const familyName = result?.family.name || "";

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
        <div className="p-4 border-b bg-card flex items-center gap-3">
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
          <button className="px-3 py-1.5 text-xs font-medium border rounded-lg hover:bg-muted flex items-center gap-1">
            <GitCompare className="w-3.5 h-3.5" /> Compare
          </button>
          <button className="px-3 py-1.5 text-xs font-medium border rounded-lg hover:bg-muted flex items-center gap-1">
            <FileDown className="w-3.5 h-3.5" /> Export
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {mockSections.map(section => (
            <div
              key={section.id}
              id={`section-${section.id}`}
              className={`rounded-lg border p-4 transition-all ${
                highlightSection === section.id
                  ? "border-secondary bg-secondary/5 ring-2 ring-secondary/20"
                  : "border-border bg-card"
              }`}
            >
              <h3 className="text-sm font-bold text-foreground mb-2">{section.title}</h3>
              <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-sans leading-relaxed">{section.content}</pre>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Intelligence panel */}
      <div className="w-80 flex-shrink-0 border-l bg-card flex flex-col overflow-y-auto">
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

        {/* Extracted Clauses */}
        <div className="p-4 border-b">
          <h3 className="text-xs font-bold text-muted-foreground uppercase mb-3">Extracted Clauses ({mockClauses.length})</h3>
          <div className="space-y-2">
            {mockClauses.map(clause => (
              <button
                key={clause.id}
                onClick={() => {
                  const sectionMap: Record<string, string> = {
                    "Article IV": "s5",
                    "Article VII": "s8",
                    "Article VIII": "s9",
                    "Section 3.10": "s10",
                    "Article V": "s6",
                    "Article III": "s4",
                  };
                  setHighlightSection(sectionMap[clause.section] || null);
                }}
                className="w-full text-left p-2 rounded hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">{clause.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${riskColors[clause.risk]}`}>{clause.risk}</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">{clause.section}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Contract Intelligence */}
        <div className="p-4 border-b">
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

        {/* Embedded Chat */}
        <div className="flex-1 flex flex-col min-h-[200px]">
          <button onClick={() => setChatOpen(!chatOpen)} className="p-3 border-b flex items-center gap-2 hover:bg-muted/30">
            <Bot className="w-4 h-4 text-secondary" />
            <span className="text-xs font-semibold flex-1 text-left">Talk to Agent – Your CoAuthor</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${chatOpen ? "rotate-180" : ""}`} />
          </button>
          {chatOpen && (
            <div className="flex-1 flex flex-col">
              <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0 max-h-48">
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
