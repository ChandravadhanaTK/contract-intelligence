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
  { id: "s1", sectionNum: "", title: "OPTUMHEALTH CARE SOLUTIONS, LLC\nPROVIDER AGREEMENT", isTitle: true, content: "THIS AGREEMENT (\"Agreement\") is entered into by and between OptumHealth Care Solutions, LLC. (\"Optum\") and the undersigned person (\"Individual\") or entity (\"Group\"), (Individual and Group are also individually and collectively referred to as \"Provider\"), and sets forth the terms and conditions under which Provider shall participate in one or more networks developed by Optum to render Covered Services to Members. This Agreement supersedes and replaces any existing provider agreements between the parties related to the provision of Covered Services.\n\nThrough contracts with Providers of health care services, Optum maintains one or more networks of providers that are available to Members. Provider is a provider of health care services.\n\nOptum wishes to arrange to make Provider's services available to Members. Provider wishes to provide such services, under the terms and conditions set forth in this Agreement.\n\nThe parties therefore enter into this Agreement." },
  { id: "s2", sectionNum: "SECTION 1", title: "Definitions", content: "The following terms when used in this Agreement have the meanings set forth below:\n\n1.1\t\"Benefit Contract\" is a benefit plan that includes health care coverage, is sponsored, issued or administered by Plan and contains the terms and conditions of a Member's coverage, including applicable copayments, deductibles, and limits on coverage for services rendered outside specified networks.\n\n1.2\t\"Covered Service\" is a health care service or product for which a Member is entitled to receive coverage from a Payer, including the terms of the Member's Benefit Contract with that Payer.\n\n1.3\t\"Customary Charge\" is the fee for health care services charged by Provider that does not exceed the fee Provider would ordinarily charge another person regardless of whether the person is a Member.\n\n1.4\t\"Emergency Services\" are services provided for a medical condition manifesting itself by acute symptoms of sufficient severity, including severe pain, such that the absence of immediate medical attention could reasonably be expected to result in any of the following:\n\n\t(1) Placing the patient's health in serious jeopardy;\n\t(2) Serious impairment to bodily functions;\n\t(3) Serious dysfunction of any bodily organ or part.\n\n1.5\t\"Member\" is a person eligible and enrolled to receive coverage from a Payer for Covered Services.\n\n1.6\t\"Member Expenses\" are any amounts that are the Member's responsibility to pay Provider in accordance with Member's Benefit Contract.\n\n1.7\t\"Participating Provider\" is an Optum contracted and credentialed health care professional, duly licensed and qualified under the laws of the jurisdiction in which Covered Services are provided.\n\n1.8\t\"Payer\" is an entity or person obligated to a Member to provide reimbursement for Covered Services.\n\n1.9\t\"Plan\" is the entity or person authorized by Optum to access one or more networks of Participating Providers developed by Optum.\n\n1.10\t\"Plan Summary\" is a written summary that identifies the Plan, the applicable fee schedule and specific unique requirements for the particular Plan.\n\n1.11\t\"Protocols\" are the programs and administrative procedures adopted by Optum or a Plan to be followed by Provider and Participating Providers in providing services and doing business with Optum and Plans under this Agreement." },
  { id: "s3", sectionNum: "SECTION 2", title: "Applicability of this Agreement", content: "2.1\tProvider's Services. This Agreement applies to Provider's practice locations established as of the Effective Date of this Agreement, which shall be updated from time to time upon agreement of the parties.\n\n2.2\tProvider Participation. Provider shall participate in those Plans designated by Optum in Plan Summaries. Optum and Plan reserve the right to determine Provider's participation in one or more networks.\n\n2.3\tPlan Summaries. Upon execution of this Agreement, and within 30 calendar days of receiving a written request from Provider, Optum shall supply applicable Plan Summaries.\n\n2.4\tServices not Covered under a Benefit Contract. This Agreement does not apply to services not covered under the applicable Benefit Contract.\n\n2.5\tHealth Care. Provider acknowledges that this Agreement and Member Benefit Contracts do not dictate the health care provided by Provider.\n\n2.6\tCommunication with Members. Nothing in this Agreement is intended to limit Provider's right or ability to communicate fully with a Member regarding the Member's health condition and treatment options." },
  { id: "s4", sectionNum: "SECTION 3", title: "Participation in Optum's Network", content: "3.1\tParticipating Providers. All health care professionals employed by or under contract with Provider will participate in Optum's network.\n\n3.2\tRequirements for Participating Providers. A Participating Provider must not have been denied participation in Optum's credentialing process and must have been notified of approval for participation after completion of the credentialing process.\n\n3.3\tCredentialing. Provider and Participating Providers will participate in and cooperate with Optum's credentialing process.\n\n3.4\tNew Participating Providers. The new health care professional must complete the Optum credentialing process and receive notice from Optum of credentialing approval prior to becoming a Participating Provider.\n\n3.5\tTermination of a Participating Provider from Optum's Network. Optum may terminate a Participating Provider's participation immediately upon becoming aware of material breach, suspension of license, felony indictment, government sanctions, or pursuant to credentialing risk management.\n\n3.6\tCovered Services by Non-Participating Providers. A health care professional who does not meet the requirements for participation shall not render Covered Services to a Member." },
  { id: "s5", sectionNum: "SECTION 4", title: "Duties of Provider", content: "4.1\tMember Eligibility. Provider is responsible to verify Member's eligibility in accordance with instructions in the applicable Plan Summary.\n\n4.2\tProvide Covered Services. Provider will provide Covered Services to Members.\n\n4.3\tNondiscrimination. Provider shall accept Members as new patients on the same basis as Provider is accepting non-Members as new patients.\n\n4.4\tAccessibility. Provider shall ensure that Members have timely and reasonable access to Covered Services and shall at all times be reasonably available to Members.\n\n4.5\tContinuity of Care. Provider shall furnish Covered Services in a manner providing continuity of care and ready referral of Members to other Providers.\n\n4.6\tCooperation with Protocols. Provider and Participating Provider will cooperate with and be bound by Optum's, Plan's and Payer's Protocols.\n\n4.7\tLicensure. Provider and Participating Providers will maintain all required licensure, registration, and permits.\n\n4.8\tLiability Insurance. Provider will assure that Provider, and all health care professionals, are covered by liability insurance." },
  { id: "s6", sectionNum: "SECTION 5", title: "Duties of Optum", content: "5.1\tPrior Authorization. Certain services require prior authorization as specified in the Prior Authorization List. Emergency services are exempt from prior authorization requirements.\n\n5.2\tNotification. Optum shall notify Provider of any changes to the Plan Summaries or Protocols within 30 days of such changes.\n\n5.3\tPayment Processing. Optum shall process all Clean Claims within the time frames specified in this Agreement." },
  { id: "s7", sectionNum: "SECTION 6", title: "Compensation", content: "6.1\tFee Schedule. Optum shall reimburse Provider in accordance with the Fee Schedule attached as Exhibit A, which is based on 120% of the Medicare Fee Schedule.\n\n6.2\tClean Claim Payment. Payment shall be made within thirty (30) calendar days of receipt of a Clean Claim.\n\n6.3\tClaim Submission. Claims must be submitted within ninety (90) days of the date of service.\n\n6.4\tRate Adjustments. Annual rate adjustments shall be made based on CPI-U methodology, effective January 1 of each contract year.\n\n6.5\tMember Expenses. Provider may collect Member Expenses from Members in accordance with the applicable Benefit Contract." },
  { id: "s8", sectionNum: "SECTION 7", title: "Term and Termination", content: "7.1\tTerm. This Agreement shall be effective as of the Effective Date and shall continue for an initial term of three (3) years.\n\n7.2\tTermination Without Cause. Either party may terminate this Agreement without cause upon one hundred eighty (180) days prior written notice to the other party.\n\n7.3\tTermination for Cause. Optum may terminate immediately for cause, including loss of license, exclusion from federal healthcare programs, or fraud.\n\n7.4\tContinuity of Care. Upon termination, Provider shall continue to render Covered Services to Members who are hospitalized at the time of termination until discharge.\n\n7.5\tSurvival. The provisions of Sections 8, 9, and 10 shall survive termination of this Agreement." },
  { id: "s9", sectionNum: "SECTION 8", title: "Confidentiality and HIPAA Compliance", content: "8.1\tHIPAA Compliance. Provider shall comply with all HIPAA Privacy and Security Rules.\n\n8.2\tData Encryption. PHI shall be encrypted at rest using AES-256 and in transit using TLS 1.2 or higher.\n\n8.3\tBreach Notification. Any breach of PHI must be reported to Optum within twenty-four (24) hours of discovery.\n\n8.4\tCyber Liability Insurance. Provider shall maintain cyber liability insurance of no less than five million dollars ($5,000,000).\n\n8.5\tConfidential Information. Each party agrees to keep confidential all proprietary or trade secret information disclosed by the other party during the term of this Agreement." },
  { id: "s10", sectionNum: "SECTION 9", title: "General Provisions", content: "9.1\tIndemnification. Provider shall indemnify, defend, and hold harmless Optum from and against any claims arising from Provider's negligence, willful misconduct, or breach of this Agreement.\n\n9.2\tDispute Resolution. Any dispute arising under this Agreement shall first be submitted to mediation. If mediation fails within sixty (60) days, the dispute shall be resolved by binding arbitration.\n\n9.3\tGoverning Law. This Agreement shall be governed by and construed in accordance with the laws of the State in which the Covered Services are rendered.\n\n9.4\tEntire Agreement. This Agreement, including all exhibits and Plan Summaries, constitutes the entire agreement between the parties.\n\n9.5\tAmendment. This Agreement may be amended only by a written instrument signed by both parties.\n\n9.6\tAssignment. Neither party may assign this Agreement without the prior written consent of the other party." },
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

        {/* Document content — Optum Provider Agreement format */}
        <div className="flex-1 overflow-y-auto relative">
          <div className="max-w-[800px] mx-auto bg-white shadow-sm border my-4 px-16 py-12" style={{ fontFamily: "'Times New Roman', Georgia, serif", minHeight: '900px' }}>
            {mockSections.map((section, secIdx) => {
              const clause = extractedClauses.find(c => c.sectionId === section.id);
              const hlClass = getHighlightClass(section.id);
              return (
                <div
                  key={section.id}
                  ref={el => { sectionRefs.current[section.id] = el; }}
                  data-clause-id={clause?.id || ""}
                  className={`mb-6 transition-all cursor-pointer rounded px-3 py-2 ${hlClass}`}
                  onClick={() => {
                    if (clause) {
                      setPopoverClauseId(popoverClauseId === clause.id ? null : clause.id);
                      setSelectedClauseId(clause.id);
                    }
                  }}
                >
                  {/* Section header */}
                  {(section as any).isTitle ? (
                    <h1 className="text-center font-bold text-sm text-foreground mb-6 uppercase leading-snug whitespace-pre-line tracking-wide">{section.title}</h1>
                  ) : (
                    <div className="text-center mb-4 mt-8">
                      <p className="font-bold text-sm text-foreground uppercase tracking-wide">{(section as any).sectionNum}</p>
                      <p className="font-bold text-sm text-foreground">{section.title}</p>
                    </div>
                  )}

                  {/* Section content */}
                  <div className="text-[13px] text-foreground leading-[1.7] whitespace-pre-wrap text-justify" style={{ fontFamily: "'Times New Roman', Georgia, serif" }}>
                    {section.content}
                  </div>

                  {/* Clause popover/tooltip */}
                  {popoverClauseId === clause?.id && clause && (
                    <div className="mt-3 bg-background border rounded-lg p-3 shadow-lg" style={{ fontFamily: "'Inter', sans-serif" }} onClick={e => e.stopPropagation()}>
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

            {/* Footer */}
            <div className="mt-12 pt-4 border-t border-muted flex items-center justify-between text-[10px] text-muted-foreground" style={{ fontFamily: "'Arial', sans-serif" }}>
              <span>OHCS-PhysHealthProviderAgmt(v2011) (2)</span>
              <span>{mockSections.length}</span>
              <span>(Rev. 100411) BLA 042517<br />Confidential and Proprietary</span>
            </div>
          </div>
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
