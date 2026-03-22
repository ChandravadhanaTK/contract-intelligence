import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, PenLine, Users, Eye, CheckCircle2, Globe, ArrowDownToLine, ClipboardList, UserCheck, Bot, Zap, Upload, ArrowRight, Shield, AlertTriangle, TrendingDown, Send, ToggleLeft, ToggleRight, List, Library, BookOpen, GitCommit, History, Check, X, Edit3, MessageSquare, Clock, BarChart3, Pen, ImagePlus } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import WorkflowPage from "./WorkflowPage";
import ContractCreation from "./ContractCreation";

const complianceScoreData = [
  { name: "Compliant", value: 24 },
  { name: "Review", value: 9 },
  { name: "Non-Compliant", value: 5 },
  { name: "Overdue", value: 4 },
];
const complianceScoreColors = ["hsl(142, 71%, 45%)", "hsl(38, 92%, 50%)", "hsl(0, 84%, 60%)", "hsl(0, 72%, 50%)"];
const complianceTotal = complianceScoreData.reduce((a, b) => a + b.value, 0);
const compliancePercent = Math.round((complianceScoreData[0].value / complianceTotal) * 100);

const categoryCompliance = [
  { category: "Payment Terms", compliant: 8, total: 10 },
  { category: "Termination", compliant: 6, total: 7 },
  { category: "HIPAA", compliant: 5, total: 5 },
  { category: "Liability", compliant: 3, total: 6 },
  { category: "Confidentiality", compliant: 7, total: 8 },
  { category: "Dispute Res.", compliant: 4, total: 6 },
];

const complianceMetrics = [
  { label: "Fully Signed", value: 18, icon: <CheckCircle2 className="w-4 h-4" />, accent: "bg-emerald-100 text-emerald-700", subtitle: "Execution complete" },
  { label: "Compliant", value: 24, icon: <Shield className="w-4 h-4" />, accent: "bg-blue-100 text-blue-700", subtitle: "Meets all standards" },
  { label: "Compliance Review", value: 9, icon: <AlertTriangle className="w-4 h-4" />, accent: "bg-amber-100 text-amber-700", subtitle: "Pending review" },
  { label: "Deviation Score", value: "3.2%", icon: <TrendingDown className="w-4 h-4" />, accent: "bg-red-100 text-red-700", subtitle: "Avg across contracts" },
];

const deviationData = [
  { name: "Payment Terms", score: 4.1, fill: "hsl(var(--destructive))" },
  { name: "Termination", score: 2.8, fill: "hsl(var(--warning, 38 92% 50%))" },
  { name: "Liability", score: 5.2, fill: "hsl(var(--destructive))" },
  { name: "Confidentiality", score: 1.4, fill: "hsl(var(--primary))" },
  { name: "Compliance", score: 3.6, fill: "hsl(var(--warning, 38 92% 50%))" },
  { name: "Dispute Res.", score: 2.1, fill: "hsl(var(--primary))" },
  { name: "Force Majeure", score: 0.8, fill: "hsl(var(--primary))" },
  { name: "Indemnification", score: 4.7, fill: "hsl(var(--destructive))" },
];

function ComplianceDeviationGraph() {
  return (
    <div className="bg-card border rounded-lg p-5">
      <h3 className="text-sm font-semibold mb-1">Compliance Deviation Score by Clause Category</h3>
      <p className="text-xs text-muted-foreground mb-4">Higher scores indicate greater deviation from standard language</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={deviationData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="name" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
          <YAxis tick={{ fontSize: 10 }} className="fill-muted-foreground" domain={[0, 6]} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))' }} />
          <Bar dataKey="score" radius={[4, 4, 0, 0]} name="Deviation Score">
            {deviationData.map((entry, index) => (
              <Cell key={index} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const kpiCards = [
  { label: "Total Documents", value: 42, icon: <FileText className="w-4 h-4" />, accent: "bg-primary/10 text-primary", route: "/contracts" },
  { label: "Deviation Score", value: "3.2%", icon: <TrendingDown className="w-4 h-4" />, accent: "bg-red-100 text-red-700", route: "/deviation" },
  { label: "Avg Creation Time", value: "4.2d", icon: <Clock className="w-4 h-4" />, accent: "bg-violet-100 text-violet-700", route: "/workflow" },
];

const pipelineStages = ["Draft", "Collaboration", "Review", "Approval", "Published", "Downstream"];
const pipelineColors = ["bg-amber-400", "bg-blue-500", "bg-violet-500", "bg-orange-500", "bg-emerald-500", "bg-teal-500"];
const pipelineCounts = [12, 8, 7, 5, 6, 4];

function ContractWorkflowPipeline() {
  const pipelineTotal = pipelineCounts.reduce((a, b) => a + b, 0) || 1;
  return (
    <div className="bg-card border rounded-lg p-5">
      <h3 className="text-sm font-semibold mb-3">NewGen Contract Digitization Pipeline</h3>
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
  );
}

/* ─── ContractCoPilot – Interactive AI Contract Agent ─── */

interface CoPilotMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  time: string;
  clauseAdded?: string;
  options?: string[];
}

interface ContractClause {
  id: string;
  sectionNumber: string;
  title: string;
  body: string;
  status: "pending" | "filled" | "edited";
  filledFrom?: string;
}

const agentSteps = [
  {
    id: "parties",
    question: "Let's draft your contract! First, **who are the contracting parties?**\n\nPlease provide:\n- **Party A** (Plan/Payer)\n- **Party B** (Provider)",
    sectionNumber: "1.0",
    clauseTitle: "PARTIES AND DEFINITIONS",
    options: ["Optum Health Plan & Northwell Health", "UnitedHealthcare & Mercy Health System", "Custom (type below)"],
    buildClause: (answer: string) => {
      const parts = answer.includes("&") ? answer.split("&").map(s => s.trim()) : [answer, "Provider Organization"];
      return `This Provider Services Agreement ("Agreement") is entered into by and between:\n\n**Party A:** ${parts[0]} ("Plan")\n**Party B:** ${parts[1] || "Provider Organization"} ("Provider")\n\n**Definitions:**\n- "Covered Services" – health care services covered under a Member's benefit plan.\n- "Member" – an individual enrolled in a health benefit plan administered by Plan.\n- "Clean Claim" – a claim submitted with no defect, including all required data elements.\n- "Network" – the panel of providers contracted to deliver Covered Services to Members.`;
    },
  },
  {
    id: "contractType",
    question: "What **type of contract** is this?",
    sectionNumber: "1.1",
    clauseTitle: "CONTRACT TYPE",
    options: ["Facility – Inpatient/Outpatient", "Professional Services", "Ancillary Services", "Behavioral Health"],
    buildClause: (answer: string) => `This Agreement governs the provision of **${answer}** between the parties. The scope of contracted services shall be as defined in the applicable Exhibits and Attachments hereto.`,
  },
  {
    id: "effectiveDate",
    question: "What is the **effective date** and **term** of this agreement?",
    sectionNumber: "2.0",
    clauseTitle: "EFFECTIVE DATE AND TERM",
    options: ["Jan 1, 2025 – 3 years with auto-renewal", "Jul 1, 2025 – 2 years with auto-renewal", "Custom (type below)"],
    buildClause: (answer: string) => {
      const hasDate = answer.match(/(\w+ \d+,?\s*\d{4})/);
      const date = hasDate ? hasDate[1] : "January 1, 2025";
      const hasTerm = answer.match(/(\d+)\s*year/i);
      const term = hasTerm ? `${hasTerm[1]} year(s)` : "Three (3) years";
      return `**Effective Date:** ${date}\n**Initial Term:** ${term}\n\nThis Agreement shall automatically renew for successive one (1) year terms unless either party provides written notice of non-renewal at least one hundred eighty (180) days prior to the expiration of the then-current term.`;
    },
  },
  {
    id: "services",
    question: "Describe the **scope of services** the Provider will deliver.\n\nInclude specialties, service types, and locations if applicable.",
    sectionNumber: "3.0",
    clauseTitle: "SCOPE OF SERVICES",
    options: ["Full-service hospital (inpatient, outpatient, ED, labs)", "Cardiology & Orthopedics specialty clinic", "Multi-specialty physician group", "Custom (type below)"],
    buildClause: (answer: string) => `**3.1 Services.** Provider shall deliver all medically necessary Covered Services to eligible Members, including but not limited to: ${answer}.\n\n**3.2 Standards of Care.** All services shall be rendered in accordance with generally accepted medical practices and all applicable state and federal requirements.\n\n**3.3 Availability.** Provider shall maintain office hours and on-call coverage sufficient to meet the needs of Members seeking Covered Services.\n\n**3.4 Referrals.** Provider shall refer Members to in-network providers when reasonably available and clinically appropriate.`,
  },
  {
    id: "payment",
    question: "What **payment model and rates** should we use?",
    sectionNumber: "4.0",
    clauseTitle: "COMPENSATION AND PAYMENT TERMS",
    options: ["Fee-for-Service at 110% of Medicare", "DRG-based case rates at 115% of Medicare", "Blended: DRG inpatient + FFS outpatient", "Custom (type below)"],
    buildClause: (answer: string) => `**4.1 Reimbursement.** Plan shall reimburse Provider for Covered Services rendered to Members in accordance with the following methodology: ${answer}.\n\n**4.2 Claims Submission.** Provider shall submit Clean Claims within ninety (90) days of the date of service.\n\n**4.3 Payment Timeline.** Plan shall process and pay Clean Claims within thirty (30) calendar days of receipt. Contested claims shall be resolved within sixty (60) calendar days.\n\n**4.4 Coordination of Benefits.** Provider shall cooperate with Plan in coordinating benefits with other payors to avoid duplicate payment.`,
  },
  {
    id: "escalator",
    question: "Should we include a **rate escalator**? If yes, what percentage and schedule?",
    sectionNumber: "4.5",
    clauseTitle: "RATE ESCALATOR",
    options: ["2.5% annual CPI-U adjustment", "3% fixed annual increase", "No escalator", "Custom (type below)"],
    buildClause: (answer: string) => {
      if (answer.toLowerCase().includes("no")) return "No rate escalator provisions apply to this Agreement. Rate adjustments shall be mutually agreed upon in writing by both parties.";
      return `**4.5 Rate Escalator.** Reimbursement rates shall be adjusted annually as follows: ${answer}, effective January 1 of each contract year, subject to a maximum annual cap of four percent (4%). Any adjustment exceeding the cap shall require mutual written agreement.`;
    },
  },
  {
    id: "termination",
    question: "What **termination provisions** should be included?\n\nSpecify notice periods for with-cause and without-cause termination.",
    sectionNumber: "5.0",
    clauseTitle: "TERMINATION",
    options: ["180 days without cause, 60 days for cause", "90 days without cause, 30 days for cause", "Custom (type below)"],
    buildClause: (answer: string) => {
      const match90 = answer.includes("90");
      const withoutCause = match90 ? "ninety (90)" : "one hundred eighty (180)";
      const forCause = match90 ? "thirty (30)" : "sixty (60)";
      return `**5.1 Termination Without Cause.** Either party may terminate this Agreement without cause by providing ${withoutCause} days prior written notice to the other party.\n\n**5.2 Termination For Cause.** Either party may terminate for material breach upon ${forCause} days written notice, provided the breaching party fails to cure within thirty (30) days of receiving such notice.\n\n**5.3 Immediate Termination.** Plan may terminate immediately upon: (a) loss of Provider's license or accreditation; (b) exclusion from federal healthcare programs; (c) conviction of fraud or criminal activity.\n\n**5.4 Continuity of Care.** Upon termination, Provider shall continue providing services to Members with active treatment plans for up to ninety (90) days.`;
    },
  },
  {
    id: "compliance",
    question: "Which **compliance and regulatory** provisions should be included?",
    sectionNumber: "6.0",
    clauseTitle: "COMPLIANCE AND REGULATORY",
    options: ["Full compliance suite (HIPAA, FWA, credentialing, audits)", "HIPAA and credentialing only", "Custom (type below)"],
    buildClause: (answer: string) => `**6.1 Legal Compliance.** Both parties shall comply with all applicable federal, state, and local laws and regulations governing health care services and health insurance.\n\n**6.2 HIPAA.** All Protected Health Information (PHI) shall be handled in accordance with the Health Insurance Portability and Accountability Act (HIPAA) Privacy and Security Rules. PHI shall be encrypted at rest and in transit using AES-256 encryption.\n\n**6.3 Fraud, Waste, and Abuse.** Provider shall maintain an active FWA compliance program and shall cooperate with Plan's Special Investigations Unit.\n\n**6.4 Audits.** Plan may audit Provider's records, facilities, and claims upon reasonable notice. Provider shall retain records for a minimum of ten (10) years.\n\n**6.5 Credentialing.** Provider shall maintain all required credentials per NCQA standards and shall promptly notify Plan of any changes to licensure, certifications, or privileges.`,
  },
  {
    id: "disputes",
    question: "How should **disputes** be resolved?",
    sectionNumber: "7.0",
    clauseTitle: "DISPUTE RESOLUTION",
    options: ["Progressive: Negotiation → Mediation → Arbitration", "Direct binding arbitration (AAA)", "Litigation in state court", "Custom (type below)"],
    buildClause: (answer: string) => {
      if (answer.toLowerCase().includes("litigation")) return `**7.1 Governing Law.** This Agreement shall be governed by the laws of the state in which the services are primarily rendered.\n\n**7.2 Jurisdiction.** Any dispute arising under this Agreement shall be resolved exclusively in the state courts of competent jurisdiction.\n\n**7.3 Legal Fees.** Each party shall bear its own legal fees and costs unless otherwise ordered by the court.`;
      return `**7.1 Negotiation.** The parties shall first attempt to resolve any dispute through good-faith negotiation within thirty (30) days of written notice.\n\n**7.2 Mediation.** If negotiation fails, the parties shall submit the dispute to mediation within sixty (60) days, with costs shared equally.\n\n**7.3 Binding Arbitration.** If mediation is unsuccessful, the dispute shall be resolved by binding arbitration under the rules of the American Arbitration Association. The arbitrator's decision shall be final and enforceable in any court of competent jurisdiction.\n\n**7.4 Costs.** Each party shall bear its own costs of arbitration, with arbitrator fees shared equally.`;
    },
  },
  {
    id: "exhibits",
    question: "Which **exhibits and attachments** should be referenced?",
    sectionNumber: "8.0",
    clauseTitle: "EXHIBITS AND ATTACHMENTS",
    options: ["Full suite (Fee Schedule, Service Area, Quality Metrics, BAA, Credentialing)", "Fee Schedule and BAA only", "Custom (type below)"],
    buildClause: (answer: string) => {
      const full = answer.toLowerCase().includes("full") || answer.toLowerCase().includes("fee schedule, service");
      if (full) return `The following Exhibits are incorporated by reference and made a part of this Agreement:\n\n- **Exhibit A** – Fee Schedule (Reimbursement rates for Covered Services)\n- **Exhibit B** – Service Area Map (Geographic coverage definition)\n- **Exhibit C** – Quality Performance Metrics & Pay-for-Performance Incentives\n- **Exhibit D** – HIPAA Business Associate Agreement\n- **Exhibit E** – Credentialing Requirements and Standards\n\nEach Exhibit may be amended by mutual written agreement of the parties.`;
      return `The following Exhibits are incorporated by reference and made a part of this Agreement:\n\n- **Exhibit A** – Fee Schedule (Reimbursement rates for Covered Services)\n- **Exhibit D** – HIPAA Business Associate Agreement\n\nAdditional Exhibits may be added by mutual written agreement of the parties.`;
    },
  },
  {
    id: "signatures",
    question: "Who are the **authorized signatories** for each party?",
    sectionNumber: "9.0",
    clauseTitle: "SIGNATURE",
    options: ["VP Network + CEO", "Chief Medical Officer + Medical Director", "Custom (type below)"],
    buildClause: (answer: string) => `IN WITNESS WHEREOF, the parties have executed this Agreement as of the Effective Date.\n\n**PLAN:**\nBy: ___________________________\nName: _________________________\nTitle: ${answer.includes("VP") ? "VP of Network Management" : "Authorized Representative"}\nDate: _________________________\n\n**PROVIDER:**\nBy: ___________________________\nName: _________________________\nTitle: ${answer.includes("CEO") ? "Chief Executive Officer" : "Authorized Representative"}\nDate: _________________________`,
  },
];

function ContractCoPilotTab() {
  const [messages, setMessages] = useState<CoPilotMessage[]>([]);
  const [input, setInput] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const [clauses, setClauses] = useState<ContractClause[]>([]);
  const [activeView, setActiveView] = useState<"chat" | "document">("chat");
  const [editingClause, setEditingClause] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: "welcome",
        role: "assistant",
        text: "👋 Welcome to **ContractCoPilot** — your interactive AI contract drafting agent!\n\nI'll walk you through each section of your Provider Services Agreement. For each section, I'll ask you a question, and based on your answer I'll draft the clause and append it to your contract document.\n\nYou can pick a suggested option or type your own answer. Let's begin!",
        time: new Date().toISOString(),
      }, {
        id: "step-0",
        role: "assistant",
        text: agentSteps[0].question,
        time: new Date().toISOString(),
        options: agentSteps[0].options,
      }]);
    }
  }, []);

  const processAnswer = async (answer: string) => {
    const userMsg: CoPilotMessage = { id: `user-${Date.now()}`, role: "user", text: answer, time: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    await new Promise(r => setTimeout(r, 600 + Math.random() * 400));

    const step = agentSteps[currentStep];
    const clauseBody = step.buildClause(answer);

    const newClause: ContractClause = {
      id: `clause-${step.id}`,
      sectionNumber: step.sectionNumber,
      title: step.clauseTitle,
      body: clauseBody,
      status: "filled",
      filledFrom: answer,
    };
    setClauses(prev => [...prev, newClause]);

    const confirmMsg: CoPilotMessage = {
      id: `confirm-${Date.now()}`,
      role: "assistant",
      text: `✅ **Section ${step.sectionNumber} – ${step.clauseTitle}** has been drafted and added to your contract.\n\n📄 *Switch to Document View to see the full contract so far.*`,
      time: new Date().toISOString(),
      clauseAdded: step.clauseTitle,
    };

    const nextStep = currentStep + 1;
    if (nextStep < agentSteps.length) {
      const nextQ: CoPilotMessage = {
        id: `step-${nextStep}`,
        role: "assistant",
        text: `**${agentSteps.length - nextStep} of ${agentSteps.length} sections remaining.**\n\n${agentSteps[nextStep].question}`,
        time: new Date().toISOString(),
        options: agentSteps[nextStep].options,
      };
      setMessages(prev => [...prev, confirmMsg, nextQ]);
      setCurrentStep(nextStep);
    } else {
      const doneMsg: CoPilotMessage = {
        id: `done-${Date.now()}`,
        role: "assistant",
        text: "🎉 **All sections complete!** Your Provider Services Agreement has been fully drafted.\n\n📄 Switch to **Document View** to review, edit, and finalize the contract. You can click **Edit** on any section to modify the language.\n\n*The contract is ready for review and signature.*",
        time: new Date().toISOString(),
      };
      setMessages(prev => [...prev, confirmMsg, doneMsg]);
      setIsComplete(true);
    }
    setLoading(false);
  };

  const handleSend = (text?: string) => {
    const msg = text || input;
    if (!msg.trim() || loading) return;
    processAnswer(msg);
  };

  const handleEditSave = (clauseId: string) => {
    setClauses(prev => prev.map(c => c.id === clauseId ? { ...c, body: editText, status: "edited" } : c));
    setEditingClause(null);
    setEditText("");
  };

  const pendingClauses = agentSteps.filter((_, i) => i >= currentStep + (isComplete ? 0 : 1)).map(s => s.clauseTitle);
  const filledCount = clauses.length;
  const totalCount = agentSteps.length;

  const renderDocumentView = () => (
    <div className="p-4 overflow-y-auto flex-1">
      <div className="bg-white border shadow-sm max-w-[700px] mx-auto px-10 py-8" style={{ fontFamily: "'Times New Roman', Georgia, serif" }}>
        <h1 className="text-center font-bold text-sm text-foreground mb-1 uppercase tracking-wide leading-snug">
          OPTUMHEALTH CARE SOLUTIONS, LLC
        </h1>
        <h2 className="text-center font-bold text-xs text-foreground mb-4 uppercase tracking-wide">
          PROVIDER SERVICES AGREEMENT
        </h2>
        <p className="text-[11px] text-foreground leading-[1.7] text-justify mb-4">
          THIS AGREEMENT ("Agreement") is entered into by and between the parties identified herein, setting forth the terms and conditions under which Provider shall participate in networks developed and maintained by Plan.
        </p>
        <hr className="border-muted my-4" />

        {clauses.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-12" style={{ fontFamily: "'Inter', sans-serif" }}>
            No clauses drafted yet. Answer questions in the chat to build your contract.
          </p>
        ) : (
          clauses.map((clause) => (
            <div key={clause.id} className="mb-6 group">
              <div className="text-center mb-2 mt-3">
                <p className="font-bold text-[13px] text-foreground uppercase tracking-wide">
                  SECTION {clause.sectionNumber}
                </p>
                <p className="font-bold text-[12px] text-foreground">{clause.title}</p>
              </div>

              {editingClause === clause.id ? (
                <div style={{ fontFamily: "'Inter', sans-serif" }}>
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full border rounded-lg p-3 text-xs min-h-[150px] bg-background"
                  />
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => handleEditSave(clause.id)} className="text-[10px] px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg font-medium hover:bg-emerald-200">
                      <Check className="w-3 h-3 inline mr-1" />Save
                    </button>
                    <button onClick={() => setEditingClause(null)} className="text-[10px] px-3 py-1 bg-muted text-muted-foreground rounded-lg font-medium hover:bg-muted/80">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-[12px] text-foreground leading-[1.7] text-justify whitespace-pre-line">
                    {clause.body}
                  </div>
                  <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity" style={{ fontFamily: "'Inter', sans-serif" }}>
                    <button
                      onClick={() => { setEditingClause(clause.id); setEditText(clause.body); }}
                      className="text-[10px] px-2.5 py-0.5 bg-accent text-accent-foreground rounded hover:bg-accent/80 flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" /> Edit
                    </button>
                    {clause.status === "edited" && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full">Edited</span>
                    )}
                  </div>
                </>
              )}
            </div>
          ))
        )}

        {pendingClauses.length > 0 && (
          <div className="mt-6 border-t border-dashed pt-4" style={{ fontFamily: "'Inter', sans-serif" }}>
            <p className="text-[10px] text-muted-foreground font-semibold mb-2">⏳ Pending Sections:</p>
            {pendingClauses.map(name => (
              <p key={name} className="text-[10px] text-muted-foreground ml-3">• {name}</p>
            ))}
          </div>
        )}

        <div className="mt-8 pt-3 border-t border-muted flex items-center justify-between text-[9px] text-muted-foreground" style={{ fontFamily: "'Arial', sans-serif" }}>
          <span>OHCS-ProviderAgmt(v2025)</span>
          <span>{isComplete ? "Complete" : "Draft"}</span>
          <span>Confidential and Proprietary</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <div className="bg-card border rounded-xl flex flex-col h-[650px]">
            <div className="p-3 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-secondary" />
                <span className="font-semibold text-sm">ContractCoPilot — AI Contract Agent</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setActiveView("chat")}
                  className={`text-[10px] px-2.5 py-1 rounded font-medium transition-colors ${activeView === "chat" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>
                  💬 Chat
                </button>
                <button onClick={() => setActiveView("document")}
                  className={`text-[10px] px-2.5 py-1 rounded font-medium transition-colors ${activeView === "document" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>
                  📄 Document
                </button>
              </div>
            </div>

            <div className="px-3 py-2 bg-muted/30 border-b">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-muted-foreground font-medium">
                  Contract Progress: {filledCount}/{totalCount} sections
                </span>
                <span className="text-[10px] font-semibold text-foreground">
                  {Math.round((filledCount / totalCount) * 100)}%
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5">
                <div className="bg-secondary h-1.5 rounded-full transition-all duration-500" style={{ width: `${(filledCount / totalCount) * 100}%` }} />
              </div>
            </div>

            {activeView === "chat" ? (
              <>
                <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
                  {messages.map((m) => (
                    <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed ${
                        m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                      }`}>
                        <div className="whitespace-pre-line">{m.text}</div>
                        {m.options && m.role === "assistant" && !isComplete && currentStep === parseInt(m.id.replace("step-", "")) && (
                          <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2 border-t border-border/30">
                            {m.options.filter(o => !o.includes("Custom")).map(opt => (
                              <button
                                key={opt}
                                onClick={() => handleSend(opt)}
                                className="text-[10px] px-2.5 py-1 rounded-full bg-background text-foreground border hover:bg-accent hover:text-accent-foreground transition-colors"
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        )}
                        {m.clauseAdded && (
                          <div className="mt-2 pt-1.5 border-t border-border/30 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span className="text-[10px] font-medium text-emerald-600">Added: {m.clauseAdded}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-xl px-3.5 py-2.5 text-xs animate-pulse">
                        <Bot className="w-3 h-3 inline mr-1.5" />Drafting clause...
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>

                <div className="p-2.5 border-t flex gap-2">
                  <input
                    className="flex-1 border rounded-lg px-3 py-2 text-xs bg-background"
                    placeholder={isComplete ? "Contract complete! Switch to Document View to review." : "Type your answer or pick an option above…"}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    disabled={isComplete || loading}
                  />
                  <button onClick={() => handleSend()} disabled={isComplete || loading}
                    className="bg-secondary text-secondary-foreground p-2 rounded-lg hover:opacity-90 disabled:opacity-50">
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            ) : (
              renderDocumentView()
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-card border rounded-xl p-4">
            <h3 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
              <ClipboardList className="w-3.5 h-3.5 text-secondary" /> Contract Sections
            </h3>
            <div className="space-y-1.5">
              {agentSteps.map((step, i) => {
                const filled = clauses.find(c => c.id === `clause-${step.id}`);
                const isCurrent = i === currentStep && !isComplete;
                return (
                  <div key={step.id} className={`flex items-center gap-2 text-[11px] px-2 py-1.5 rounded-lg transition-colors ${
                    isCurrent ? "bg-secondary/10 border border-secondary/30" :
                    filled ? "bg-emerald-50" : ""
                  }`}>
                    {filled ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    ) : isCurrent ? (
                      <Bot className="w-3.5 h-3.5 text-secondary flex-shrink-0 animate-pulse" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-muted-foreground/30 flex-shrink-0" />
                    )}
                    <span className={`${filled ? "text-foreground" : isCurrent ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                      {step.sectionNumber} {step.clauseTitle}
                    </span>
                    {filled?.status === "edited" && (
                      <span className="text-[8px] px-1 py-0.5 bg-amber-100 text-amber-700 rounded ml-auto">edited</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-card border rounded-xl p-4">
            <h3 className="text-xs font-semibold text-foreground mb-3">Draft Summary</h3>
            <div className="space-y-2 text-[11px]">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sections Drafted</span>
                <span className="font-semibold text-foreground">{filledCount}/{totalCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Edited by User</span>
                <span className="font-semibold text-foreground">{clauses.filter(c => c.status === "edited").length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pending</span>
                <span className="font-semibold text-foreground">{totalCount - filledCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className={`font-semibold ${isComplete ? "text-emerald-600" : "text-amber-600"}`}>
                  {isComplete ? "✅ Complete" : "🔄 In Progress"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function UploadContractTab() {
  const [uploadMode, setUploadMode] = useState<"single" | "bulk">("single");

  return (
    <div className="space-y-4">
      <div className="bg-card border rounded-xl p-5">
        <h3 className="text-base font-semibold text-foreground mb-1">Upload Contract</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Choose how you'd like to upload your contract documents for processing.
        </p>
        <RadioGroup
          value={uploadMode}
          onValueChange={(v) => setUploadMode(v as "single" | "bulk")}
          className="flex gap-6"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="single" id="upload-single" />
            <Label htmlFor="upload-single" className="text-sm font-medium cursor-pointer">
              Single File Upload
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="bulk" id="upload-bulk" />
            <Label htmlFor="upload-bulk" className="text-sm font-medium cursor-pointer">
              Bulk File Upload
            </Label>
          </div>
        </RadioGroup>
        <p className="text-xs text-muted-foreground mt-3">
          {uploadMode === "single"
            ? "Upload a single contract document (PDF or DOCX) for OCR processing, contract type identification, and standard clause matching."
            : "Upload multiple contract documents at once for batch processing. Each file will go through the full OCR and extraction pipeline independently."}
        </p>
      </div>

      {uploadMode === "single" ? (
        <ContractCreation embedded initialTab="upload" />
      ) : (
        <ContractCreation embedded initialTab="bulk" />
      )}
    </div>
  );
}

export default function ContractCreationWithOverview() {
  const [subTab, setSubTab] = useState("newgen");
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <Tabs value={subTab} onValueChange={setSubTab}>
        <TabsList className="bg-muted/60 flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="newgen" className="flex items-center gap-1.5 text-xs">
            <Zap className="w-3.5 h-3.5" /> Dashboard
          </TabsTrigger>
          <TabsTrigger value="review" className="flex items-center gap-1.5 text-xs">
            <ClipboardList className="w-3.5 h-3.5" /> Review Contract
          </TabsTrigger>
          <TabsTrigger value="hitl" className="flex items-center gap-1.5 text-xs">
            <UserCheck className="w-3.5 h-3.5" /> HITL Center
          </TabsTrigger>
          <TabsTrigger value="agents" className="flex items-center gap-1.5 text-xs">
            <Bot className="w-3.5 h-3.5" /> Agent Workspace
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-1.5 text-xs">
            <Upload className="w-3.5 h-3.5" /> Upload Contract
          </TabsTrigger>
          <TabsTrigger value="intake" className="flex items-center gap-1.5 text-xs">
            <ArrowRight className="w-3.5 h-3.5" /> Provider Intake Contract
          </TabsTrigger>
          <TabsTrigger value="coauthor" className="flex items-center gap-1.5 text-xs">
            <Bot className="w-3.5 h-3.5" /> ContractCoPilot
          </TabsTrigger>
        </TabsList>

        <TabsContent value="newgen">
          <div className="space-y-6">
            <div>
              <h1 className="page-header">NewGen Contract Digitization</h1>
              <p className="text-sm text-muted-foreground mt-1">OCR + AI pipeline for creating payer contracts into structured data</p>
              <div className="mt-4" />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {kpiCards.map(kpi => (
                  <div key={kpi.label} className="kpi-card flex items-start gap-3 cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all" onClick={() => navigate(kpi.route)}>
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${kpi.accent}`}>
                      {kpi.icon}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">{kpi.label}</p>
                      <p className="text-xl font-bold text-foreground">{kpi.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Consolidated Compliance Overview card */}
            <div className="bg-card border rounded-lg p-5">
              <h3 className="text-sm font-semibold mb-4">Compliance Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left: Compliance Score Donut + legend */}
                <div className="flex flex-col items-center gap-3">
                  <div className="relative w-28 h-28">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={complianceScoreData} dataKey="value" innerRadius={35} outerRadius={52} startAngle={90} endAngle={-270} paddingAngle={2}>
                          {complianceScoreData.map((_, i) => <Cell key={i} fill={complianceScoreColors[i]} />)}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold">{compliancePercent}%</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-foreground">Compliance Score</p>
                    <p className="text-[10px] text-muted-foreground">{complianceScoreData[0].value}/{complianceTotal} compliant</p>
                    <p className="text-[10px] text-muted-foreground">{complianceScoreData[3].value} overdue · {complianceScoreData[1].value} review</p>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center">
                    {complianceScoreData.map((d, i) => (
                      <div key={d.name} className="flex items-center gap-1">
                        <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: complianceScoreColors[i] }} />
                        <span className="text-[10px] text-muted-foreground">{d.name} ({d.value})</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Center: Compliance by Category progress bars */}
                <div>
                  <h4 className="text-xs font-semibold mb-2.5 text-foreground">By Category</h4>
                  <div className="space-y-2">
                    {categoryCompliance.map(c => (
                      <div key={c.category} className="flex items-center gap-2">
                        <span className="text-[10px] text-foreground w-20 truncate">{c.category}</span>
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div className="h-2 rounded-full bg-emerald-500 transition-all" style={{ width: c.total ? `${(c.compliant / c.total) * 100}%` : "0%" }} />
                        </div>
                        <span className="text-[10px] text-muted-foreground w-8 text-right">{c.compliant}/{c.total}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Deviation Score bar chart */}
                <div>
                  <h4 className="text-xs font-semibold mb-2.5 text-foreground">Deviation by Clause</h4>
                  <ResponsiveContainer width="100%" height={170}>
                    <BarChart data={deviationData} margin={{ top: 0, right: 5, left: -15, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" tick={{ fontSize: 8 }} className="fill-muted-foreground" interval={0} angle={-30} textAnchor="end" height={45} />
                      <YAxis tick={{ fontSize: 9 }} className="fill-muted-foreground" domain={[0, 6]} />
                      <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid hsl(var(--border))' }} />
                      <Bar dataKey="score" radius={[3, 3, 0, 0]} name="Deviation Score">
                        {deviationData.map((entry, index) => (
                          <Cell key={index} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <ContractWorkflowPipeline />
            <WorkflowPage embedded initialTab="workflow" />
          </div>
        </TabsContent>
        <TabsContent value="review">
          <WorkflowPage embedded initialTab="review" />
        </TabsContent>
        <TabsContent value="hitl">
          <WorkflowPage embedded initialTab="hitl" />
        </TabsContent>
        <TabsContent value="agents">
          <WorkflowPage embedded initialTab="agents" />
        </TabsContent>
        <TabsContent value="upload">
          <UploadContractTab />
        </TabsContent>
        <TabsContent value="intake">
          <ContractCreation embedded initialTab="intake" />
        </TabsContent>
        <TabsContent value="coauthor">
          <ContractCoPilotTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
