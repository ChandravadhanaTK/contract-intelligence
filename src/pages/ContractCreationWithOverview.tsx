import { useState, useRef, useEffect } from "react";
import { FileText, PenLine, Users, Eye, CheckCircle2, Globe, ArrowDownToLine, ClipboardList, UserCheck, Bot, Zap, Upload, ArrowRight, Shield, AlertTriangle, TrendingDown, Send, ToggleLeft, ToggleRight, List, Library, BookOpen, GitCommit, History, Check, X, Edit3, MessageSquare } from "lucide-react";
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

/* ─── ContractPilot – AI Contract Coauthor Tab ─── */
const contractPilotClauses = [
  { id: "conf", name: "Confidentiality", body: "Both parties agree to maintain the confidentiality of all proprietary information exchanged during the term of this Agreement. Confidential Information shall not be disclosed to any third party without prior written consent.", category: "Standard" },
  { id: "liab", name: "Limitation of Liability", body: "Neither party shall be liable for any indirect, incidental, special, consequential, or punitive damages, regardless of the cause of action or the theory of liability.", category: "Standard" },
  { id: "pay", name: "Payment Terms", body: "Provider shall submit claims within thirty (30) days of service delivery. Plan shall remit payment within forty-five (45) days of clean claim receipt, subject to the fee schedule in Exhibit A.", category: "Financial" },
  { id: "term", name: "Termination", body: "Either party may terminate this Agreement without cause upon ninety (90) days' prior written notice. Termination for cause may be immediate upon material breach that remains uncured after thirty (30) days' written notice.", category: "Standard" },
  { id: "disp", name: "Dispute Resolution", body: "Any dispute arising under this Agreement shall first be submitted to mediation. If mediation fails within sixty (60) days, the dispute shall be resolved by binding arbitration under the rules of the American Arbitration Association.", category: "Legal" },
  { id: "hipaa", name: "HIPAA Compliance", body: "Provider agrees to comply with all applicable provisions of the Health Insurance Portability and Accountability Act (HIPAA), including the Privacy Rule, Security Rule, and Breach Notification Rule.", category: "Compliance" },
];

const pilotQuickPrompts = [
  "Draft full Provider Services Agreement",
  "Add Payment & Rate section",
  "Add Termination clause",
  "Add HIPAA Compliance clause",
  "Insert Exhibit A – Fee Schedule",
  "Review and improve current draft",
  "Highlight missing clauses",
];

interface PilotMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  time: string;
  suggestion?: { clause: string; body: string; reason: string };
}

interface DraftClause {
  id: string;
  name: string;
  body: string;
  version: number;
  status: "draft" | "accepted" | "rejected";
  history: { version: number; body: string; timestamp: string }[];
}

function ContractPilotTab() {
  const [mode, setMode] = useState<"pilot" | "guided" | "freeform">("freeform");
  const [messages, setMessages] = useState<PilotMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "👋 Welcome to **ContractPilot** — your AI Contract Coauthor!\n\nI work like GitHub Copilot, but for contracts. I can:\n• **Suggest clauses** like autocomplete snippets\n• **Explain why** each clause matters\n• **Help you draft** in guided or freeform mode\n\nChoose **Guided Mode** for step-by-step drafting, or stay in **Freeform** to type naturally and get inline suggestions.\n\nWhat would you like to draft today?",
      time: new Date().toISOString(),
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [draftClauses, setDraftClauses] = useState<DraftClause[]>([]);
  const [guidedStep, setGuidedStep] = useState(0);
  const [showDiff, setShowDiff] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"chat" | "document" | "history">("chat");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const guidedSteps = [
    { field: "Contract Type", question: "What type of contract are you drafting? (e.g., Provider Services Agreement, Vendor Agreement, Amendment)", sample: "Provider Services Agreement" },
    { field: "Parties", question: "Who are the parties involved? Please provide full legal entity names.", sample: "Optum Health Plan, Inc. & Northwell Health Systems, LLC" },
    { field: "Effective Date", question: "What is the effective date of this agreement?", sample: "January 1, 2025" },
    { field: "Term", question: "What is the contract term (duration)?", sample: "3 years with auto-renewal" },
    { field: "Services Scope", question: "Describe the scope of services covered.", sample: "Inpatient, outpatient, and emergency medical services across all network facilities" },
    { field: "Payment Terms", question: "What are the payment terms and rate structure?", sample: "Fee-for-service based on Medicare RBRVS with 110% multiplier" },
    { field: "Key Clauses", question: "Any specific clauses you'd like included? (confidentiality, termination, HIPAA, etc.)", sample: "Confidentiality, Termination, HIPAA Compliance, Dispute Resolution, Indemnification" },
  ];

  const addAssistantMessage = (text: string, suggestion?: PilotMessage["suggestion"]) => {
    const msg: PilotMessage = {
      id: `pilot-${Date.now()}-${Math.random()}`,
      role: "assistant",
      text,
      time: new Date().toISOString(),
      suggestion,
    };
    setMessages(prev => [...prev, msg]);
    return msg;
  };

  const handleSend = async (text?: string) => {
    const msg = text || input;
    if (!msg.trim()) return;

    const userMsg: PilotMessage = { id: `user-${Date.now()}`, role: "user", text: msg, time: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    await new Promise(r => setTimeout(r, 800 + Math.random() * 600));

    const lower = msg.toLowerCase();

    if (lower.includes("confidentiality") || lower.includes("payment") || lower.includes("termination") || lower.includes("hipaa") || lower.includes("dispute") || lower.includes("liability")) {
      const matched = contractPilotClauses.find(c => lower.includes(c.name.toLowerCase()));
      if (matched) {
        addAssistantMessage(
          `📋 **Suggested: ${matched.name} Clause**\n\n> ${matched.body}\n\n💡 **Why this matters:** This is a standard ${matched.category.toLowerCase()} clause that protects both parties and ensures regulatory compliance. It follows industry best practices for healthcare contracts.\n\nWould you like to **Accept**, **Edit**, or **Reject** this clause?`,
          { clause: matched.name, body: matched.body, reason: `Standard ${matched.category} clause` }
        );
      }
    } else if (lower.includes("draft full") || lower.includes("full contract") || lower.includes("full provider")) {
      addAssistantMessage(
        "📝 **Generating full Provider Services Agreement...**\n\nI'll create a comprehensive contract with these sections:\n\n1. **Parties & Definitions**\n2. **Scope of Services**\n3. **Compensation & Payment**\n4. **Term & Termination**\n5. **Confidentiality & HIPAA**\n6. **Representations & Warranties**\n7. **Indemnification**\n8. **Dispute Resolution**\n9. **General Provisions**\n\nEach clause is modular — you can rearrange, edit, or replace any section. Shall I proceed with all sections?"
      );
      contractPilotClauses.forEach(c => {
        if (!draftClauses.find(dc => dc.id === c.id)) {
          setDraftClauses(prev => [...prev, { id: c.id, name: c.name, body: c.body, version: 1, status: "draft", history: [{ version: 1, body: c.body, timestamp: new Date().toISOString() }] }]);
        }
      });
    } else if (lower.includes("review") || lower.includes("improve")) {
      addAssistantMessage(
        "🔍 **Reviewing current draft...**\n\n**Findings:**\n- ✅ Confidentiality clause is well-structured\n- ⚠️ Payment terms could include late fee provisions\n- ⚠️ Missing Force Majeure clause (recommended post-pandemic)\n- ✅ Termination clause covers both cause and convenience\n- ⚠️ Consider adding a data breach notification timeline\n\n**Suggested improvements:**\n1. Add milestone-based payment schedule with late fee clause\n2. Insert Force Majeure provision\n3. Specify 72-hour breach notification requirement\n\nWould you like me to draft any of these improvements?"
      );
    } else if (lower.includes("missing")) {
      addAssistantMessage(
        "📊 **Clause Gap Analysis:**\n\n| Clause | Status |\n|--------|--------|\n| Parties & Definitions | ✅ Present |\n| Scope of Services | ⚠️ Needs detail |\n| Payment Terms | ✅ Present |\n| Termination | ✅ Present |\n| Confidentiality | ✅ Present |\n| HIPAA Compliance | ✅ Present |\n| Force Majeure | ❌ Missing |\n| Indemnification | ❌ Missing |\n| Insurance Requirements | ❌ Missing |\n| Amendment Procedures | ❌ Missing |\n\nWould you like me to draft the missing clauses?"
      );
    } else {
      addAssistantMessage(
        `I understand you'd like to work on: **"${msg}"**\n\nLet me suggest some relevant content:\n\n> *Based on your input, consider adding specific terms, conditions, or definitions that clarify the scope and obligations of both parties.*\n\n💡 **Tip:** You can ask me to:\n- \"Add [clause name] clause\"\n- \"Review and improve current draft\"\n- \"Highlight missing clauses\"\n- Or type naturally and I'll suggest improvements inline.`
      );
    }
    setLoading(false);
  };

  const handleAcceptClause = (suggestion: PilotMessage["suggestion"]) => {
    if (!suggestion) return;
    const existing = draftClauses.find(c => c.name === suggestion.clause);
    if (existing) {
      setDraftClauses(prev => prev.map(c => c.name === suggestion.clause ? { ...c, status: "accepted" } : c));
    } else {
      setDraftClauses(prev => [...prev, {
        id: `clause-${Date.now()}`, name: suggestion.clause, body: suggestion.body,
        version: 1, status: "accepted",
        history: [{ version: 1, body: suggestion.body, timestamp: new Date().toISOString() }],
      }]);
    }
    addAssistantMessage(`✅ **${suggestion.clause}** clause accepted and added to the draft document.`);
  };

  const handleRejectClause = (suggestion: PilotMessage["suggestion"]) => {
    if (!suggestion) return;
    addAssistantMessage(`⏭️ **${suggestion.clause}** clause rejected. I can suggest an alternative if you'd like.`);
  };

  const handleGuidedNext = () => {
    if (guidedStep < guidedSteps.length) {
      const step = guidedSteps[guidedStep];
      addAssistantMessage(`**Step ${guidedStep + 1} of ${guidedSteps.length}: ${step.field}**\n\n${step.question}\n\n*💡 Example: "${step.sample}"*`);
      setGuidedStep(prev => prev + 1);
    } else {
      addAssistantMessage("🎉 **All steps complete!** I have all the information needed.\n\n📝 **Shall I generate the full contract now?** Type **\"Draft full contract\"** or click the quick prompt above.");
    }
  };

  const renderDocumentView = () => (
    <div className="space-y-3 p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-foreground">📄 Draft Document</h3>
        <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{draftClauses.length} clauses</span>
      </div>
      {draftClauses.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-8">No clauses drafted yet. Start a conversation to build your contract.</p>
      ) : (
        draftClauses.map(clause => (
          <div key={clause.id} className={`border rounded-lg p-3 transition-all ${
            clause.status === "accepted" ? "border-emerald-200 bg-emerald-50/30" :
            clause.status === "rejected" ? "border-red-200 bg-red-50/30 opacity-60" :
            "border-border"
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-foreground">{clause.name}</span>
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                  clause.status === "accepted" ? "bg-emerald-100 text-emerald-700" :
                  clause.status === "rejected" ? "bg-red-100 text-red-700" :
                  "bg-amber-100 text-amber-700"
                }`}>{clause.status}</span>
                <span className="text-[10px] text-muted-foreground">v{clause.version}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{clause.body}</p>
            <div className="flex gap-1.5 mt-2">
              {clause.status === "draft" && (
                <>
                  <button onClick={() => setDraftClauses(prev => prev.map(c => c.id === clause.id ? { ...c, status: "accepted" } : c))} className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200">
                    <Check className="w-3 h-3 inline mr-0.5" /> Accept
                  </button>
                  <button onClick={() => setDraftClauses(prev => prev.map(c => c.id === clause.id ? { ...c, status: "rejected" } : c))} className="text-[10px] px-2 py-0.5 bg-red-100 text-red-700 rounded hover:bg-red-200">
                    <X className="w-3 h-3 inline mr-0.5" /> Reject
                  </button>
                </>
              )}
              <button onClick={() => setShowDiff(showDiff === clause.id ? null : clause.id)} className="text-[10px] px-2 py-0.5 bg-muted text-muted-foreground rounded hover:bg-muted/80">
                <History className="w-3 h-3 inline mr-0.5" /> History
              </button>
            </div>
            {showDiff === clause.id && (
              <div className="mt-2 border-t pt-2 space-y-1">
                {clause.history.map(h => (
                  <div key={h.version} className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                    <GitCommit className="w-3 h-3" />
                    <span>v{h.version} — {new Date(h.timestamp).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );

  const chatModes = [
    { id: "pilot" as const, label: "ContractPilot", icon: Bot, desc: "AI autocomplete & clause suggestions" },
    { id: "freeform" as const, label: "Freeform", icon: MessageSquare, desc: "Type naturally, get inline suggestions" },
    { id: "guided" as const, label: "Guided", icon: Zap, desc: "Step-by-step interview drafting" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main chat panel */}
        <div className="lg:col-span-2">
          <div className="bg-card border rounded-xl flex flex-col h-[650px]">
            {/* Mode selector icons */}
            <div className="p-3 border-b flex items-center justify-between">
              <div className="flex items-center gap-1">
                {chatModes.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id)}
                    title={`${m.label}: ${m.desc}`}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      mode === m.id
                        ? "bg-secondary text-secondary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <m.icon className="w-3.5 h-3.5" />
                    {m.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                {(["chat", "document", "history"] as const).map(v => (
                  <button key={v} onClick={() => setActiveView(v)}
                    className={`text-[10px] px-2 py-1 rounded font-medium transition-colors ${
                      activeView === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                    }`}>
                    {v === "chat" ? "💬" : v === "document" ? "📄" : "📜"}
                  </button>
                ))}
              </div>
            </div>

            {/* Mode context banner */}
            <div className="px-3 py-1.5 bg-accent/40 border-b flex items-center gap-2">
              <span className="text-[10px] text-accent-foreground">
                {mode === "pilot" && "🤖 ContractPilot — AI autocomplete for clauses with Accept/Reject/Edit workflow"}
                {mode === "freeform" && "✍️ Freeform — Type naturally and get inline clause suggestions & improvements"}
                {mode === "guided" && `📋 Guided Interview — Step ${Math.min(guidedStep + 1, guidedSteps.length)} of ${guidedSteps.length}`}
              </span>
              {mode === "guided" && (
                <button onClick={handleGuidedNext} className="ml-auto text-[10px] px-2.5 py-0.5 bg-secondary text-secondary-foreground rounded font-medium">
                  {guidedStep === 0 ? "Start" : guidedStep >= guidedSteps.length ? "Complete" : "Next Step"}
                </button>
              )}
            </div>

            {activeView === "chat" ? (
              <>
                {/* Quick prompts */}
                <div className="p-2 flex flex-wrap gap-1 border-b">
                  {pilotQuickPrompts.map(p => (
                    <button key={p} onClick={() => handleSend(p)} className="text-[10px] px-2 py-0.5 rounded-full bg-accent text-accent-foreground hover:bg-secondary hover:text-secondary-foreground transition-colors">
                      {p}
                    </button>
                  ))}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
                  {messages.map(m => (
                    <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className="max-w-[85%]">
                        <div className={`rounded-lg px-3 py-2 text-sm ${
                          m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                        }`}>
                          <pre className="whitespace-pre-wrap font-sans text-sm">{m.text}</pre>
                        </div>
                        {m.suggestion && (
                          <div className="flex gap-1.5 mt-1.5">
                            <button onClick={() => handleAcceptClause(m.suggestion)} className="text-[10px] px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full hover:bg-emerald-200 font-medium flex items-center gap-1">
                              <Check className="w-3 h-3" /> Accept
                            </button>
                            <button onClick={() => handleRejectClause(m.suggestion)} className="text-[10px] px-2.5 py-1 bg-red-100 text-red-700 rounded-full hover:bg-red-200 font-medium flex items-center gap-1">
                              <X className="w-3 h-3" /> Reject
                            </button>
                            <button className="text-[10px] px-2.5 py-1 bg-muted text-muted-foreground rounded-full hover:bg-muted/80 font-medium flex items-center gap-1">
                              <Edit3 className="w-3 h-3" /> Edit
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {loading && <div className="flex justify-start"><div className="bg-muted rounded-lg px-3 py-2 text-sm animate-pulse">✨ Drafting...</div></div>}
                  <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div className="p-2 border-t flex gap-1.5">
                  <input
                    className="flex-1 border rounded-lg px-3 py-1.5 text-sm bg-background"
                    placeholder={
                      mode === "pilot" ? "Ask ContractPilot to draft, review, or suggest clauses..." :
                      mode === "freeform" ? "Type naturally — I'll suggest clauses inline..." :
                      "Answer the guided question or type freely..."
                    }
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSend()}
                  />
                  <button onClick={() => handleSend()} className="bg-secondary text-secondary-foreground p-1.5 rounded-lg hover:opacity-90">
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : activeView === "document" ? (
              <div className="flex-1 overflow-y-auto">
                {renderDocumentView()}
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-4">
                <h3 className="text-sm font-semibold mb-3">📜 Version History</h3>
                {draftClauses.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">No changes recorded yet.</p>
                ) : (
                  <div className="space-y-2">
                    {draftClauses.flatMap(c => c.history.map(h => ({ ...h, clauseName: c.name, clauseId: c.id }))).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((entry, i) => (
                      <div key={i} className="flex items-start gap-2 border-l-2 border-secondary/30 pl-3 py-1">
                        <GitCommit className="w-3.5 h-3.5 text-secondary mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-foreground">{entry.clauseName} — v{entry.version}</p>
                          <p className="text-[10px] text-muted-foreground">{new Date(entry.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-card border rounded-xl p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
              <Library className="w-4 h-4 text-secondary" /> Clause Library
            </h3>
            <div className="space-y-2">
              {contractPilotClauses.map(c => (
                <button key={c.id} onClick={() => handleSend(`Add ${c.name} clause`)}
                  className="w-full text-left rounded-lg border p-2 hover:border-secondary/50 hover:bg-accent/50 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-foreground">{c.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground">{c.category}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{c.body}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-card border rounded-xl p-4">
            <h3 className="text-sm font-semibold text-foreground mb-2">Draft Stats</h3>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">Total Clauses</span><span className="font-semibold">{draftClauses.length}</span></div>
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">Accepted</span><span className="font-semibold text-emerald-600">{draftClauses.filter(c => c.status === "accepted").length}</span></div>
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">Pending</span><span className="font-semibold text-amber-600">{draftClauses.filter(c => c.status === "draft").length}</span></div>
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">Rejected</span><span className="font-semibold text-red-600">{draftClauses.filter(c => c.status === "rejected").length}</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Existing CoAuthor features preserved */}
      <ContractCreation embedded initialTab="coauthor" />
    </div>
  );
}

const kpiCards = [
  { label: "Total Documents", value: 42, icon: <FileText className="w-4 h-4" />, accent: "bg-primary/10 text-primary" },
  { label: "Draft", value: 12, icon: <PenLine className="w-4 h-4" />, accent: "bg-amber-100 text-amber-700" },
  { label: "Collaboration", value: 8, icon: <Users className="w-4 h-4" />, accent: "bg-blue-100 text-blue-700" },
  { label: "Review", value: 7, icon: <Eye className="w-4 h-4" />, accent: "bg-violet-100 text-violet-700" },
  { label: "Approved", value: 5, icon: <CheckCircle2 className="w-4 h-4" />, accent: "bg-orange-100 text-orange-700" },
  { label: "Published", value: 6, icon: <Globe className="w-4 h-4" />, accent: "bg-emerald-100 text-emerald-700" },
  { label: "Processed to Downstream", value: 4, icon: <ArrowDownToLine className="w-4 h-4" />, accent: "bg-teal-100 text-teal-700" },
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
            <Bot className="w-3.5 h-3.5" /> Talk to your Agent - Your CoAuthor
          </TabsTrigger>
        </TabsList>

        <TabsContent value="newgen">
          <div className="space-y-6">
            <div>
              <h1 className="page-header">NewGen Contract Digitization</h1>
              <p className="text-sm text-muted-foreground mt-1">OCR + AI pipeline for creating payer contracts into structured data</p>
              <div className="mt-4" />
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {kpiCards.map(kpi => (
                  <div key={kpi.label} className="kpi-card flex items-start gap-3">
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

            {/* Compliance Score, By Category, and Deviation Graph — side by side */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {complianceMetrics.map(metric => (
                <div key={metric.label} className="kpi-card flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${metric.accent}`}>
                    {metric.icon}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">{metric.label}</p>
                    <p className="text-xl font-bold text-foreground">{metric.value}</p>
                    {metric.subtitle && <p className="text-[10px] text-muted-foreground">{metric.subtitle}</p>}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Compliance Score — Donut */}
              <div className="bg-card border rounded-lg p-5 flex items-center gap-6">
                <div className="relative w-28 h-28 flex-shrink-0">
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
                <div>
                  <h4 className="text-sm font-semibold mb-1">Compliance Score</h4>
                  <p className="text-xs text-muted-foreground">{complianceScoreData[0].value} of {complianceTotal} obligations compliant</p>
                  <p className="text-xs text-muted-foreground mt-1">{complianceScoreData[3].value} overdue • {complianceScoreData[1].value} in review</p>
                </div>
              </div>

              {/* Compliance by Category — Progress Bars */}
              <div className="bg-card border rounded-lg p-5">
                <h4 className="text-sm font-semibold mb-3">Compliance by Category</h4>
                <div className="space-y-2.5">
                  {categoryCompliance.map(c => (
                    <div key={c.category} className="flex items-center gap-3">
                      <span className="text-xs text-foreground w-24 truncate">{c.category}</span>
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div className="h-2 rounded-full bg-emerald-500" style={{ width: c.total ? `${(c.compliant / c.total) * 100}%` : "0%" }} />
                      </div>
                      <span className="text-xs text-muted-foreground w-10 text-right">{c.compliant}/{c.total}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Compliance Deviation Score Graph */}
              <ComplianceDeviationGraph />
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
          <ContractPilotTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
