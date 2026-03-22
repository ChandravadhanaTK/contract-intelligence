import { useState, useRef, useEffect, useCallback } from "react";
import { BackToPipelineBanner } from "@/components/BackToPipelineBanner";
import { useNavigate } from "react-router-dom";
import {
  FileText, Layers, BookOpen, ArrowRight, ArrowLeft, Bot, Send, ChevronDown, ChevronRight,
  Edit3, MessageSquare, Plus, Upload, Download, RotateCcw, Save, Check, X,
  CheckCircle2, AlertCircle, XCircle, Info, Sparkles, ToggleLeft, ToggleRight,
  Eye, Copy, Trash2, Search, FolderOpen, ArrowUp, ArrowDown,
} from "lucide-react";
import { toast } from "sonner";

/* ─── localStorage helpers ─── */
function get<T>(key: string, fb: T): T {
  const r = localStorage.getItem(key);
  return r ? JSON.parse(r) : fb;
}
function set(key: string, v: unknown) {
  localStorage.setItem(key, JSON.stringify(v));
}

/* ─── Types ─── */
type CreateMode = "full" | "clause" | "playbook";
type SectionStatus = "drafted" | "needs-input" | "missing" | "updated";

interface ContractSection {
  id: string;
  headingNumber: string;
  title: string;
  body: string;
  status: SectionStatus;
}

interface DraftMeta {
  id: string;
  name: string;
  createdAt: string;
  status: "Draft" | "In Review" | "Final";
  sections: ContractSection[];
}

interface ChatMsg {
  id: string;
  role: "user" | "assistant";
  text: string;
  proposedClause?: { title: string; body: string; rationale: string; citation: string; sectionRef: string };
  suggestedNext?: string;
}

/* ─── Section templates ─── */
const allSectionTemplates: ContractSection[] = [
  { id: "s1", headingNumber: "§1", title: "Definitions", body: "\"Covered Services\" means health care services provided to Members under the Plan.\n\n\"Clean Claim\" means a claim submitted with all required data elements.\n\n\"Member\" means an individual enrolled in a health benefit plan administered by the Plan.", status: "drafted" },
  { id: "s2", headingNumber: "§2", title: "Term", body: "This Agreement shall be effective as of January 1, 2025 and shall continue for a period of three (3) years, automatically renewing for successive one-year terms unless either party provides one hundred eighty (180) days written notice of non-renewal.", status: "drafted" },
  { id: "s3", headingNumber: "§3", title: "Provider Obligations", body: "Provider shall:\n(a) Deliver all medically necessary Covered Services to eligible Members;\n(b) Maintain appropriate staffing levels and facility standards;\n(c) Comply with all applicable licensing and accreditation requirements;\n(d) Accept assignment of benefits for all Covered Services.", status: "drafted" },
  { id: "s4", headingNumber: "§4", title: "Compensation / Reimbursement Rates", body: "Plan shall reimburse Provider in accordance with the Fee Schedule attached as Exhibit A.\n\nInpatient: DRG-based case rates at 115% of Medicare.\nOutpatient: Fee-for-Service at 140% of Medicare OPPS.\nEmergency: Per-visit flat rate of $385.\n\nClean Claims processed within 30 calendar days.", status: "needs-input" },
  { id: "s5", headingNumber: "§5", title: "Claims Submission", body: "Provider shall submit Clean Claims within ninety (90) days of the date of service. Claims not submitted within the filing deadline shall be denied. Electronic submission via EDI 837 is required.", status: "drafted" },
  { id: "s6", headingNumber: "§6", title: "Credentialing", body: "Provider shall maintain current credentials per NCQA standards. Plan shall re-credential Provider every three (3) years. Provider must notify Plan within 30 days of any adverse credentialing action.", status: "drafted" },
  { id: "s7", headingNumber: "§7", title: "Quality Assurance", body: "Provider shall participate in Plan's quality improvement programs including HEDIS reporting, peer review, and utilization management. Provider shall meet minimum quality thresholds as defined in Exhibit C.", status: "needs-input" },
  { id: "s8", headingNumber: "§8", title: "Confidentiality / HIPAA Compliance", body: "Both parties shall comply with HIPAA Privacy and Security Rules (45 CFR Parts 160 and 164). All Protected Health Information (PHI) shall be encrypted using AES-256 at rest and TLS 1.2+ in transit. A Business Associate Agreement is attached as Exhibit D.", status: "drafted" },
  { id: "s9", headingNumber: "§9", title: "Data Protection", body: "Provider shall implement reasonable administrative, physical, and technical safeguards to protect Member data. Data breach notification within 72 hours of discovery.", status: "missing" },
  { id: "s10", headingNumber: "§10", title: "Dispute Resolution", body: "Disputes shall be resolved through progressive escalation:\n(1) Good-faith negotiation (30 days);\n(2) Mediation (60 days);\n(3) Binding arbitration under AAA rules.\nCosts shared equally between parties.", status: "drafted" },
  { id: "s11", headingNumber: "§11", title: "Termination", body: "Either party may terminate without cause with 180 days written notice.\nTermination for cause: 60 days notice with 30-day cure period.\nImmediate termination upon: loss of license, federal exclusion, fraud.\nContinuity of care: 90 days post-termination.", status: "drafted" },
  { id: "s12", headingNumber: "§12", title: "Notices", body: "All notices shall be in writing and delivered by certified mail, return receipt requested, or by nationally recognized overnight courier to the addresses specified on the signature page.", status: "missing" },
  { id: "s13", headingNumber: "§13", title: "Signature Blocks", body: "IN WITNESS WHEREOF, the parties have executed this Agreement:\n\nPLAN: UnitedHealthcare Insurance Company\nBy: ___________________ Date: ___________\nTitle: VP, Network Management\n\nPROVIDER: _______________\nBy: ___________________ Date: ___________\nTitle: _______________", status: "needs-input" },
];

const statusConfig: Record<SectionStatus, { label: string; color: string; icon: React.ElementType }> = {
  drafted: { label: "Drafted", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  "needs-input": { label: "Needs Input", color: "bg-amber-100 text-amber-700", icon: AlertCircle },
  missing: { label: "Missing", color: "bg-red-100 text-red-700", icon: XCircle },
  updated: { label: "Updated", color: "bg-blue-100 text-blue-700", icon: Info },
};

/* ─── Playbook Rules ─── */
const playbookRules = [
  { rule: "HIPAA required", pass: true },
  { rule: "Termination >= 60 days", pass: true },
  { rule: "Dispute clause mandatory", pass: true },
  { rule: "Rate escalator documented", pass: false },
  { rule: "Credentialing per NCQA", pass: true },
  { rule: "Data breach notification <= 72h", pass: true },
];

/* ─── Deterministic chat responses ─── */
function generateResponse(text: string, sections: ContractSection[], selectedId: string | null): ChatMsg {
  const l = text.toLowerCase();
  const id = `chat-${Date.now()}`;

  if (l.includes("reimbursement") || l.includes("rate")) {
    return {
      id, role: "assistant",
      text: "I've drafted reimbursement terms based on standard Optum payer agreements. This includes DRG-based inpatient rates and OPPS-based outpatient rates.",
      proposedClause: {
        title: "Reimbursement Terms",
        body: "**4.1 Reimbursement.** Plan shall reimburse Provider based on the Fee Schedule (Exhibit A).\n\n**4.2 Rate Methodology.** Inpatient: MS-DRG at 120% of Medicare. Outpatient: APC at 145% of Medicare OPPS.\n\n**4.3 Rate Escalator.** Annual CPI-U adjustment of 2.5%, effective January 1 of each contract year, capped at 4%.",
        rationale: "Industry-standard rate methodology ensures competitive compensation while maintaining cost predictability.",
        citation: "§4.2 • Page 8",
        sectionRef: "s4",
      },
      suggestedNext: "Would you like to add termination provisions next?",
    };
  }
  if (l.includes("termination")) {
    return {
      id, role: "assistant",
      text: "Here's a comprehensive termination clause covering without-cause, for-cause, and immediate termination scenarios.",
      proposedClause: {
        title: "Termination Provisions",
        body: "**11.1 Without Cause.** Either party may terminate with 180 days written notice.\n\n**11.2 For Cause.** 60 days notice with 30-day cure period for material breach.\n\n**11.3 Immediate.** Upon license revocation, federal exclusion, or criminal conviction.\n\n**11.4 Continuity.** Provider continues care for 90 days post-termination for Members in active treatment.",
        rationale: "Balanced termination rights with adequate notice periods and patient protection through continuity of care.",
        citation: "§11.1 • Page 22",
        sectionRef: "s11",
      },
      suggestedNext: "Should I add HIPAA compliance language next?",
    };
  }
  if (l.includes("hipaa") || l.includes("compliance")) {
    return {
      id, role: "assistant",
      text: "I've prepared HIPAA compliance language aligned with 45 CFR Parts 160 and 164.",
      proposedClause: {
        title: "HIPAA Compliance",
        body: "**8.1 Privacy.** Both parties shall comply with HIPAA Privacy Rule (45 CFR Part 164, Subpart E).\n\n**8.2 Security.** PHI encrypted using AES-256 at rest and TLS 1.3 in transit.\n\n**8.3 Breach Notification.** Notification within 60 days of discovery per 45 CFR §164.410.\n\n**8.4 BAA.** Business Associate Agreement attached as Exhibit D.",
        rationale: "Federal requirement for all healthcare contracts handling Protected Health Information.",
        citation: "§8.1 • Page 16",
        sectionRef: "s8",
      },
      suggestedNext: "Would you like to add dispute resolution terms?",
    };
  }
  if (l.includes("dispute")) {
    return {
      id, role: "assistant",
      text: "Here's a progressive dispute resolution framework from negotiation through binding arbitration.",
      proposedClause: {
        title: "Dispute Resolution",
        body: "**10.1 Negotiation.** Parties shall attempt good-faith resolution within 30 days.\n\n**10.2 Mediation.** If unresolved, submit to mediation within 60 days.\n\n**10.3 Arbitration.** Binding arbitration under AAA Commercial Rules. Costs shared equally.\n\n**10.4 Venue.** Proceedings conducted in the state of Provider's principal office.",
        rationale: "Progressive escalation minimizes litigation costs while preserving party relationships.",
        citation: "§10.1 • Page 20",
        sectionRef: "s10",
      },
      suggestedNext: "Would you like me to summarize the current draft?",
    };
  }
  if (l.includes("summarize")) {
    const drafted = sections.filter(s => s.status === "drafted" || s.status === "updated").length;
    const missing = sections.filter(s => s.status === "missing").length;
    const needsInput = sections.filter(s => s.status === "needs-input").length;
    return {
      id, role: "assistant",
      text: `**Draft Summary:**\n\n• **${drafted}** sections fully drafted\n• **${needsInput}** sections need additional input\n• **${missing}** sections are missing\n• **Completion:** ${Math.round((drafted / sections.length) * 100)}%\n\n**Key areas to address:**\n${sections.filter(s => s.status !== "drafted" && s.status !== "updated").map(s => `- ${s.headingNumber} ${s.title}: ${statusConfig[s.status].label}`).join("\n")}`,
      suggestedNext: "Would you like me to draft the missing sections?",
    };
  }

  return {
    id, role: "assistant",
    text: `I can help you with that. Based on the current draft, I'd suggest focusing on ${selectedId ? `the selected section` : "adding key contract provisions"}. Try asking me to:\n\n• Add reimbursement terms\n• Add termination clause\n• Add HIPAA compliance\n• Add dispute resolution\n• Summarize this draft`,
  };
}

/* ─── Component ─── */
export default function AIContractCreation() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<CreateMode | null>(() => get<CreateMode | null>("oci_create_mode", null));
  const [sections, setSections] = useState<ContractSection[]>(() => {
    const saved = get<ContractSection[] | null>("oci_create_sections", null);
    return saved || [];
  });
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [collapsedPanels, setCollapsedPanels] = useState<Record<string, boolean>>({ sections: false, summary: true, drafts: true });
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>(() => get("oci_create_chat", []));
  const [chatInput, setChatInput] = useState("");
  const [autoApply, setAutoApply] = useState(false);
  const [drafts, setDrafts] = useState<DraftMeta[]>(() => get("oci_my_drafts", []));
  const [draftSearch, setDraftSearch] = useState("");
  const centerRef = useRef<HTMLDivElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { set("oci_create_sections", sections); }, [sections]);
  useEffect(() => { set("oci_create_chat", chatMessages); }, [chatMessages]);
  useEffect(() => { set("oci_my_drafts", drafts); }, [drafts]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const selectMode = (m: CreateMode) => {
    setMode(m);
    set("oci_create_mode", m);
    if (m === "full") {
      setSections(allSectionTemplates);
    } else if (m === "clause") {
      setSections(allSectionTemplates.slice(0, 4).map((s, i) => i < 3 ? s : { ...s, status: "needs-input" as SectionStatus }));
    } else {
      setSections(allSectionTemplates);
    }
  };

  const scrollToSection = (id: string) => {
    setSelectedSection(id);
    const el = document.getElementById(`section-${id}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    el?.classList.add("ring-2", "ring-primary");
    setTimeout(() => el?.classList.remove("ring-2", "ring-primary"), 2000);
  };

  const handleSendChat = (text: string) => {
    if (!text.trim()) return;
    const userMsg: ChatMsg = { id: `u-${Date.now()}`, role: "user", text };
    const response = generateResponse(text, sections, selectedSection);
    setChatMessages(prev => [...prev, userMsg, response]);
    setChatInput("");
    if (autoApply && response.proposedClause) {
      handleApplyClause(response.proposedClause, "replace");
    }
  };

  const handleApplyClause = (clause: NonNullable<ChatMsg["proposedClause"]>, action: "insert" | "replace" | "add") => {
    setSections(prev => {
      if (action === "replace") {
        return prev.map(s => s.id === clause.sectionRef ? { ...s, body: clause.body, status: "updated" as SectionStatus } : s);
      }
      if (action === "add") {
        const newId = `s-new-${Date.now()}`;
        const newSection: ContractSection = {
          id: newId,
          headingNumber: `§${prev.length + 1}`,
          title: clause.title,
          body: clause.body,
          status: "updated",
        };
        return [...prev, newSection];
      }
      // insert = replace selected section
      const target = selectedSection || clause.sectionRef;
      return prev.map(s => s.id === target ? { ...s, body: clause.body, status: "updated" as SectionStatus } : s);
    });
    toast.success("Draft updated");
    scrollToSection(clause.sectionRef);
  };

  const handleSaveDraft = () => {
    const draft: DraftMeta = {
      id: `draft-${Date.now()}`,
      name: "Payer Agreement – Standard",
      createdAt: new Date().toISOString(),
      status: "Draft",
      sections: [...sections],
    };
    setDrafts(prev => [draft, ...prev].slice(0, 5));
    toast.success("Draft saved");
  };

  const handleLoadDraft = (draft: DraftMeta) => {
    setSections(draft.sections);
    toast.success(`Loaded: ${draft.name}`);
  };

  const handleDeleteDraft = (id: string) => {
    setDrafts(prev => prev.filter(d => d.id !== id));
    toast.success("Draft deleted");
  };

  const handleAddNewClause = () => {
    const newId = `s-new-${Date.now()}`;
    const newSection: ContractSection = {
      id: newId,
      headingNumber: `§${sections.length + 1}`,
      title: "New Clause",
      body: "Enter clause text here...",
      status: "needs-input",
    };
    setSections(prev => [...prev, newSection]);
    setTimeout(() => scrollToSection(newId), 100);
  };

  const handleDeleteSection = (id: string) => {
    setSections(prev => {
      const filtered = prev.filter(s => s.id !== id);
      return filtered.map((s, i) => ({ ...s, headingNumber: `§${i + 1}` }));
    });
    if (selectedSection === id) setSelectedSection(null);
    if (editingSection === id) setEditingSection(null);
    toast.success("Clause deleted");
  };

  const handleMoveSection = (id: string, direction: "up" | "down") => {
    setSections(prev => {
      const idx = prev.findIndex(s => s.id === id);
      if (idx < 0) return prev;
      const targetIdx = direction === "up" ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];
      return next.map((s, i) => ({ ...s, headingNumber: `§${i + 1}` }));
    });
  };

  const completionPercent = sections.length > 0
    ? Math.round((sections.filter(s => s.status === "drafted" || s.status === "updated").length / sections.length) * 100)
    : 0;

  const togglePanel = (key: string) => setCollapsedPanels(p => ({ ...p, [key]: !p[key] }));

  const filteredDrafts = drafts.filter(d => d.name.toLowerCase().includes(draftSearch.toLowerCase()));

  /* ─── Landing View (no mode selected) ─── */
  if (!mode) {
    return (
      <div className="page-container max-w-5xl">
        <BackToPipelineBanner />
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">AI Contract Creation</h1>
          <p className="text-muted-foreground">Choose how you'd like to create your healthcare provider contract</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {([
            { mode: "full" as CreateMode, icon: FileText, title: "Full Draft Generation", desc: "Generate a complete contract draft from your inputs in one step." },
            { mode: "clause" as CreateMode, icon: Layers, title: "Clause-by-Clause Co-Authoring", desc: "Build your contract section by section with AI suggestions and edits." },
            { mode: "playbook" as CreateMode, icon: BookOpen, title: "Playbook-Guided with AI Review", desc: "Draft using your playbook rules with compliance and risk checks." },
          ]).map(card => (
            <div key={card.mode} className="bg-card border rounded-xl p-6 flex flex-col items-center text-center hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <card.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-2">{card.title}</h3>
              <p className="text-sm text-muted-foreground mb-4 flex-1">{card.desc}</p>
              <button
                onClick={() => selectMode(card.mode)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90"
              >
                Get started <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ─── Workspace ─── */
  return (
    <div className="flex flex-col h-[calc(100vh-3rem)] overflow-hidden">
      {/* TOP COLLAPSIBLE BARS */}
      <div className="flex-shrink-0 border-b bg-card">
        {/* Contract Sections */}
        <div className="border-b">
          <button onClick={() => togglePanel("sections")} className="w-full flex items-center justify-between px-4 py-2 hover:bg-muted/50 text-sm font-semibold text-foreground">
            <span className="flex items-center gap-2">
              <span className={`flex items-center justify-center w-5 h-5 rounded transition-colors ${collapsedPanels.sections ? "bg-muted" : "bg-primary/10"}`}>
                {collapsedPanels.sections ? <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-primary" />}
              </span>
              Contract Sections
            </span>
            <span className="text-[10px] text-muted-foreground">{sections.length} sections • {completionPercent}% complete</span>
          </button>
          {!collapsedPanels.sections && (
            <div className="px-4 pb-3 flex flex-wrap gap-1.5">
              {sections.map(s => {
                const sc = statusConfig[s.status];
                const isSelected = selectedSection === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => scrollToSection(s.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-colors ${
                      isSelected ? "bg-primary/10 text-primary font-medium ring-1 ring-primary/30" : "bg-muted/50 text-foreground hover:bg-muted"
                    }`}
                  >
                    <span>{s.headingNumber} {s.title}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${sc.color}`}>{sc.label}</span>
                  </button>
                );
              })}
              <button
                onClick={handleAddNewClause}
                className="flex items-center gap-1 px-2.5 py-1 text-xs text-primary hover:bg-primary/5 rounded-md border border-dashed border-primary/30"
              >
                <Plus className="w-3 h-3" /> Add clause
              </button>
            </div>
          )}
        </div>

        {/* Draft Summary */}
        <div className="border-b">
          <button onClick={() => togglePanel("summary")} className="w-full flex items-center justify-between px-4 py-2 hover:bg-muted/50 text-sm font-semibold text-foreground">
            <span className="flex items-center gap-2">
              <span className={`flex items-center justify-center w-5 h-5 rounded transition-colors ${collapsedPanels.summary ? "bg-muted" : "bg-primary/10"}`}>
                {collapsedPanels.summary ? <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-primary" />}
              </span>
              Draft Summary
            </span>
          </button>
          {!collapsedPanels.summary && (
            <div className="px-4 pb-3 flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground uppercase">Draft:</span>
                <span className="text-xs font-medium">Payer Agreement – Standard</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground uppercase">Completion:</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 bg-muted rounded-full">
                    <div className="h-1.5 rounded-full bg-primary transition-all" style={{ width: `${completionPercent}%` }} />
                  </div>
                  <span className="text-xs font-medium">{completionPercent}%</span>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span><span className="text-muted-foreground">Effective:</span> 01/01/2025</span>
                <span><span className="text-muted-foreground">Term:</span> 3 Years</span>
                <span><span className="text-muted-foreground">Payment:</span> Blended</span>
              </div>
              {sections.filter(s => s.status === "missing" || s.status === "needs-input").length > 0 && (
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="w-3 h-3 text-amber-600" />
                  <span className="text-[10px] text-amber-600">{sections.filter(s => s.status === "missing" || s.status === "needs-input").length} sections need attention</span>
                </div>
              )}
              <div className="flex gap-1.5 ml-auto">
                <button onClick={handleSaveDraft} className="flex items-center gap-1 px-2.5 py-1 bg-primary text-primary-foreground rounded text-[10px] font-medium hover:opacity-90">
                  <Save className="w-3 h-3" /> Save
                </button>
                <button className="flex items-center gap-1 px-2.5 py-1 border rounded text-[10px] font-medium hover:bg-muted">
                  <Download className="w-3 h-3" /> Export
                </button>
                <button onClick={() => { setMode(null); setSections([]); set("oci_create_mode", null); }} className="flex items-center gap-1 px-2.5 py-1 border rounded text-[10px] font-medium hover:bg-muted text-destructive">
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              </div>
            </div>
          )}
        </div>

        {/* My Generated Contracts */}
        <div>
          <button onClick={() => togglePanel("drafts")} className="w-full flex items-center justify-between px-4 py-2 hover:bg-muted/50 text-sm font-semibold text-foreground">
            <span className="flex items-center gap-2">
              <span className={`flex items-center justify-center w-5 h-5 rounded transition-colors ${collapsedPanels.drafts ? "bg-muted" : "bg-primary/10"}`}>
                {collapsedPanels.drafts ? <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-primary" />}
              </span>
              <FolderOpen className="w-3.5 h-3.5 text-secondary" />
              My Generated Contracts
            </span>
            <span className="text-[10px] text-muted-foreground">{drafts.length} drafts</span>
          </button>
          {!collapsedPanels.drafts && (
            <div className="px-4 pb-3 flex items-start gap-3 overflow-x-auto">
              <div className="relative flex-shrink-0">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                <input
                  className="w-40 pl-7 pr-2 py-1 text-xs border rounded bg-background"
                  placeholder="Search drafts…"
                  value={draftSearch}
                  onChange={e => setDraftSearch(e.target.value)}
                />
              </div>
              {filteredDrafts.length === 0 && <p className="text-[10px] text-muted-foreground py-1">No saved drafts</p>}
              {filteredDrafts.map(d => (
                <div key={d.id} className="flex-shrink-0 border rounded-lg p-2 text-xs space-y-1 w-48">
                  <div className="flex items-center justify-between">
                    <span className="font-medium truncate">{d.name}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                      d.status === "Final" ? "bg-emerald-100 text-emerald-700" :
                      d.status === "In Review" ? "bg-blue-100 text-blue-700" :
                      "bg-muted text-muted-foreground"
                    }`}>{d.status}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{new Date(d.createdAt).toLocaleDateString()}</p>
                  <div className="flex gap-1">
                    <button onClick={() => handleLoadDraft(d)} className="text-[10px] text-primary hover:underline flex items-center gap-0.5">
                      <FolderOpen className="w-3 h-3" /> Open
                    </button>
                    <button onClick={() => {
                      const dup = { ...d, id: `draft-${Date.now()}`, name: d.name + " (Copy)", createdAt: new Date().toISOString() };
                      setDrafts(prev => [dup, ...prev].slice(0, 5));
                      toast.success("Duplicated");
                    }} className="text-[10px] text-muted-foreground hover:underline flex items-center gap-0.5">
                      <Copy className="w-3 h-3" /> Dup
                    </button>
                    <button onClick={() => handleDeleteDraft(d.id)} className="text-[10px] text-destructive hover:underline flex items-center gap-0.5">
                      <Trash2 className="w-3 h-3" /> Del
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* CENTER PANEL - Contract Document (MSA Format) */}
        <div className="flex-1 overflow-y-auto bg-muted/30" ref={centerRef}>
          <div className="max-w-3xl mx-auto py-6 px-8">
            {/* Header toolbar */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setMode(null); set("oci_create_mode", null); }}
                  className="flex items-center gap-1 px-2.5 py-1.5 border rounded-lg text-xs font-medium hover:bg-muted"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
                <div>
                  <h2 className="text-lg font-bold text-foreground">Contract Document</h2>
                  <p className="text-xs text-muted-foreground">
                    {mode === "full" ? "Full Draft Generation" : mode === "clause" ? "Clause-by-Clause Co-Authoring" : "Playbook-Guided with AI Review"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate("/contracts/newgen")}
                  className="flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-medium hover:bg-muted"
                >
                  <Upload className="w-3.5 h-3.5" /> Upload for reference
                </button>
                <button
                  onClick={() => {
                    handleSaveDraft();
                    navigate("/compliance-hub?tab=redlining");
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-secondary-foreground rounded-lg text-xs font-medium hover:opacity-90"
                >
                  Send to Redlining
                </button>
              </div>
            </div>

            {/* Quick Setup for Full Draft */}
            {mode === "full" && sections.length === 0 && (
              <div className="bg-accent/50 border border-primary/10 rounded-xl p-5 mb-4">
                <h3 className="text-sm font-semibold mb-3">Quick Setup</h3>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase">Contract Type</label>
                    <select className="w-full mt-1 border rounded-lg px-3 py-1.5 text-xs bg-background">
                      <option>Payer Agreement</option>
                      <option>Provider Agreement</option>
                      <option>Amendment</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase">Template</label>
                    <select className="w-full mt-1 border rounded-lg px-3 py-1.5 text-xs bg-background">
                      <option>Payer Agreement – Standard</option>
                      <option>Provider Agreement – Facility</option>
                    </select>
                  </div>
                </div>
                <button
                  onClick={() => setSections(allSectionTemplates)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90"
                >
                  <Sparkles className="w-4 h-4" /> Use Template
                </button>
              </div>
            )}

            {/* MSA-FORMATTED CONTRACT DOCUMENT */}
            {sections.length > 0 && (
              <div className="bg-card border rounded-lg shadow-sm p-8" style={{ fontFamily: "'Times New Roman', 'Georgia', serif" }}>
                {/* MSA Title Block */}
                <div className="text-center mb-8 border-b pb-6">
                  <p className="text-[11px] tracking-widest text-muted-foreground uppercase mb-4">Confidential and Proprietary</p>
                  <h1 className="text-xl font-bold uppercase tracking-wide mb-2">MASTER SERVICES AGREEMENT</h1>
                  <p className="text-sm font-semibold uppercase">Provider Participation Agreement</p>
                  <div className="mt-4 text-xs text-muted-foreground space-y-0.5">
                    <p>By and Between</p>
                    <p className="font-semibold text-foreground">UnitedHealthcare Insurance Company ("Plan")</p>
                    <p>and</p>
                    <p className="font-semibold text-foreground">[Provider Name] ("Provider")</p>
                  </div>
                  <p className="mt-4 text-xs text-muted-foreground">Effective Date: January 1, 2025</p>
                  <p className="text-xs text-muted-foreground">Contract No.: OHCS-PA-2025-001</p>
                </div>

                {/* Recitals */}
                <div className="mb-6">
                  <p className="text-sm font-bold text-center uppercase mb-3">RECITALS</p>
                  <div className="text-xs leading-relaxed text-justify space-y-2">
                    <p><strong>WHEREAS,</strong> Plan is a health insurance company duly authorized to conduct business in the applicable states and administers health benefit plans for its enrolled Members; and</p>
                    <p><strong>WHEREAS,</strong> Provider is a duly licensed healthcare provider who desires to participate in Plan's provider network and render Covered Services to Members; and</p>
                    <p><strong>NOW, THEREFORE,</strong> in consideration of the mutual covenants and agreements set forth herein, and for other good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, the parties agree as follows:</p>
                  </div>
                </div>

                {/* Section blocks */}
                <div className="space-y-5">
                  {sections.map((s, i) => {
                    const isSelected = selectedSection === s.id;
                    const isEditing = editingSection === s.id;
                    return (
                      <div
                        key={s.id}
                        id={`section-${s.id}`}
                        onClick={() => setSelectedSection(s.id)}
                        className={`rounded-md p-4 cursor-pointer transition-all border ${
                          isSelected ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-transparent hover:border-primary/20 hover:bg-accent/20"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">
                            {s.headingNumber.replace("§", "SECTION ")} — {s.title.toUpperCase()}
                          </h3>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${statusConfig[s.status].color}`}>
                              {statusConfig[s.status].label}
                            </span>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleMoveSection(s.id, "up"); }}
                              disabled={i === 0}
                              className="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed" title="Move up"
                            >
                              <ArrowUp className="w-3 h-3 text-muted-foreground" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleMoveSection(s.id, "down"); }}
                              disabled={i === sections.length - 1}
                              className="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed" title="Move down"
                            >
                              <ArrowDown className="w-3 h-3 text-muted-foreground" />
                            </button>
                            {isEditing ? (
                              <>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setEditingSection(null); }}
                                  className="p-1 rounded hover:bg-emerald-100 text-emerald-600" title="Done editing"
                                >
                                  <Check className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const saved = get<ContractSection[] | null>("oci_create_sections", null);
                                    const original = saved?.find(x => x.id === s.id);
                                    if (original) setSections(prev => prev.map(p => p.id === s.id ? original : p));
                                    setEditingSection(null);
                                  }}
                                  className="p-1 rounded hover:bg-red-100 text-destructive" title="Cancel"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={(e) => { e.stopPropagation(); setEditingSection(s.id); setSelectedSection(s.id); }}
                                className="p-1 rounded hover:bg-muted" title="Edit this section"
                              >
                                <Edit3 className="w-3 h-3 text-muted-foreground" />
                              </button>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteSection(s.id); }}
                              className="p-1 rounded hover:bg-destructive/10 text-destructive" title="Delete clause"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                            <button className="p-1 rounded hover:bg-muted" title="Comment"><MessageSquare className="w-3 h-3 text-muted-foreground" /></button>
                          </div>
                        </div>
                        {isEditing ? (
                          <textarea
                            className="w-full text-xs text-foreground leading-relaxed text-justify bg-background border rounded-md p-3 min-h-[120px] resize-y focus:outline-none focus:ring-1 focus:ring-primary"
                            style={{ fontFamily: "'Times New Roman', 'Georgia', serif" }}
                            value={s.body}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => setSections(prev => prev.map(p => p.id === s.id ? { ...p, body: e.target.value, status: "updated" as SectionStatus } : p))}
                          />
                        ) : (
                          <div className="text-xs text-foreground whitespace-pre-line leading-relaxed text-justify">
                            {s.body}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Footer */}
                <div className="mt-8 pt-4 border-t text-center text-[10px] text-muted-foreground space-y-0.5">
                  <p>OHCS-PhysHealthProviderAgmt | Rev. 2025-01</p>
                  <p>Confidential and Proprietary — Do not distribute without authorization</p>
                </div>
              </div>
            )}

            {sections.length === 0 && mode !== "full" && (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">Use the AI CoAuthor to start building your contract</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL - AI CoAuthor Chat */}
        <div className="w-80 flex-shrink-0 border-l bg-card flex flex-col overflow-hidden">
          <div className="p-3 border-b flex items-center gap-2 bg-muted/50">
            <Bot className="w-4 h-4 text-secondary" />
            <span className="font-semibold text-sm">AI CoAuthor</span>
          </div>

          {/* Context chip */}
          {selectedSection && (
            <div className="px-3 py-2 border-b bg-accent/30">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                Editing: {sections.find(s => s.id === selectedSection)?.headingNumber} {sections.find(s => s.id === selectedSection)?.title}
              </span>
            </div>
          )}

          {/* Playbook Rules (playbook mode only) */}
          {mode === "playbook" && (
            <div className="px-3 py-2 border-b space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Playbook Rules</p>
              <div className="flex flex-wrap gap-1">
                {playbookRules.map(r => (
                  <span key={r.rule} className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${
                    r.pass ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                  }`}>
                    {r.pass ? "✓" : "⚠"} {r.rule}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Quick prompts */}
          <div className="p-2 flex flex-wrap gap-1 border-b">
            {["Add reimbursement terms", "Add termination clause", "Add HIPAA compliance", "Add dispute resolution", "Summarize this draft"].map(p => (
              <button
                key={p}
                onClick={() => handleSendChat(p)}
                className="text-[10px] px-2 py-0.5 rounded-full bg-accent text-accent-foreground hover:bg-secondary hover:text-secondary-foreground transition-colors"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
            {chatMessages.length === 0 && (
              <div className="text-center mt-4 space-y-2">
                <Bot className="w-8 h-8 mx-auto text-muted-foreground opacity-40" />
                <p className="text-xs text-muted-foreground">I'm your AI CoAuthor. I can help you draft clauses, review sections, and ensure compliance. Select a section or describe a clause to get started.</p>
              </div>
            )}
            {chatMessages.map(m => (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[95%] space-y-1.5">
                  <div className={`rounded-lg px-3 py-2 text-xs leading-relaxed ${
                    m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                  }`}>
                    {m.text.split("\n").map((line, i) => <p key={i}>{line}</p>)}
                  </div>
                  {m.proposedClause && (
                    <div className="border rounded-lg p-2.5 bg-accent/30 space-y-1.5">
                      <p className="text-[10px] font-bold text-foreground">{m.proposedClause.title}</p>
                      <div className="text-[10px] text-foreground whitespace-pre-line leading-relaxed border-l-2 border-primary pl-2" style={{ fontFamily: "'Times New Roman', serif" }}>
                        {m.proposedClause.body.slice(0, 200)}…
                      </div>
                      <p className="text-[10px] text-muted-foreground italic">{m.proposedClause.rationale}</p>
                      <button
                        onClick={() => scrollToSection(m.proposedClause!.sectionRef)}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-secondary/10 text-secondary font-medium hover:bg-secondary/20 cursor-pointer"
                      >
                        {m.proposedClause.citation}
                      </button>
                      <div className="flex gap-1 pt-1">
                        <button onClick={() => handleApplyClause(m.proposedClause!, "insert")} className="text-[9px] px-2 py-0.5 bg-primary text-primary-foreground rounded font-medium hover:opacity-90">Insert</button>
                        <button onClick={() => handleApplyClause(m.proposedClause!, "replace")} className="text-[9px] px-2 py-0.5 border rounded font-medium hover:bg-muted">Replace</button>
                        <button onClick={() => handleApplyClause(m.proposedClause!, "add")} className="text-[9px] px-2 py-0.5 border rounded font-medium hover:bg-muted">Add new</button>
                      </div>
                    </div>
                  )}
                  {m.suggestedNext && (
                    <button
                      onClick={() => handleSendChat(m.suggestedNext!)}
                      className="text-[10px] px-2 py-1 rounded-full bg-accent text-accent-foreground hover:bg-secondary hover:text-secondary-foreground transition-colors"
                    >
                      {m.suggestedNext}
                    </button>
                  )}
                </div>
              </div>
            ))}
            <div ref={chatBottomRef} />
          </div>

          {/* Auto-apply toggle + input */}
          <div className="border-t">
            <div className="px-3 py-1.5 flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">Auto-apply suggestions</span>
              <button onClick={() => setAutoApply(!autoApply)} className="text-muted-foreground">
                {autoApply ? <ToggleRight className="w-5 h-5 text-primary" /> : <ToggleLeft className="w-5 h-5" />}
              </button>
            </div>
            <div className="p-2 flex gap-2">
              <input
                className="flex-1 border rounded-lg px-3 py-1.5 text-xs bg-background"
                placeholder="Describe a clause to draft…"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSendChat(chatInput)}
              />
              <button onClick={() => handleSendChat(chatInput)} className="bg-secondary text-secondary-foreground p-1.5 rounded-lg hover:opacity-90">
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
