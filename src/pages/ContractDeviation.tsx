import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Target, CheckCircle, XCircle, AlertTriangle, ArrowLeft, ArrowRight, MessageSquare, ChevronDown, Bot } from "lucide-react";
import { KPIStatCard } from "@/components/KPIStatCard";
import { ClauseAccordionList } from "@/components/ClauseAccordionList";
import { TwoColumnCompare } from "@/components/TwoColumnCompare";
import { api } from "@/services/mockApi";
import type { Contract, Clause } from "@/types";

// Multi-contract deviation data with varying metrics
const deviationMetrics: Record<string, { alignedExtra: number; nonAlignedExtra: number; missingExtra: number }> = {
  "contract-001": { alignedExtra: 0, nonAlignedExtra: 0, missingExtra: 0 },
  "contract-002": { alignedExtra: 2, nonAlignedExtra: -2, missingExtra: -5 },
  "contract-003": { alignedExtra: 1, nonAlignedExtra: 1, missingExtra: -7 },
};

const deviationChatAnswers: Record<string, Record<string, string>> = {
  "contract-001": {
    "rate escalator": "For the Northeast Region contract, the rate escalator is 5% annually using CPI-U methodology. See Section 4.2, Page 43.",
    "termination": "Termination requires 180 days written notice. For cause: 60 days with cure period. See Article 7, Page 22.",
    "missing clauses": "This contract is missing 10 clauses including: Network Adequacy (Article 12), Member Grievance (Article 14), Quality Improvement (Article 16), PHI Protection (Article 18), and more.",
    "non-aligned": "4 non-aligned clauses found: Claims Processing Timeline (Article 3), Provider Reimbursement Rates (Article 5), Termination Notice Period (Article 7), and Dispute Resolution (Article 9).",
    "compliance": "Compliance requirements include HEDIS data submission, quarterly claims audits, and monthly provider directory updates. See Article 12, Page 50.",
    "default": "I can help you analyze this contract. Try asking about: rate escalator, termination terms, missing clauses, non-aligned clauses, or compliance requirements.",
  },
  "contract-002": {
    "rate escalator": "For the Southeast Region contract, the rate escalator is 3.5% annually using a blended CPI-U/negotiated methodology. See Section 4.2, Page 38.",
    "termination": "Termination notice is 120 days for either party. No specific cure period defined. See Article 7, Page 18.",
    "missing clauses": "This contract is missing 5 clauses: Network Adequacy, Member Grievance, Quality Improvement, PHI Protection, and Subcontractor Oversight.",
    "non-aligned": "2 non-aligned clauses: Claims Processing Timeline (45 business days vs 30 calendar days standard) and Provider Reimbursement Rates (100% of Medicare vs 110% standard).",
    "compliance": "Basic compliance section present but missing FWA program details and credentialing standards. See Article 10, Page 42.",
    "default": "I can help you analyze the Southeast Region contract. Ask about rate escalator, termination, missing clauses, non-aligned clauses, or compliance.",
  },
  "contract-003": {
    "rate escalator": "For the Midwest Region contract, the rate escalator is 4% annually with a CPI-U floor and 5% cap. See Section 4.3, Page 41.",
    "termination": "Mutual 180-day termination notice with a 45-day cure period for cause. See Article 7, Page 20.",
    "missing clauses": "This contract is missing 3 clauses: Network Adequacy, Member Grievance, and Quality Improvement Program.",
    "non-aligned": "4 non-aligned clauses including Claims Processing (40 business days), Reimbursement Rates (105% Medicare), Termination Notice (asymmetric), and Dispute Resolution (no mediation step).",
    "compliance": "Comprehensive compliance section with HIPAA, FWA, and credentialing requirements. See Articles 10-12, Pages 44-52.",
    "default": "I can help analyze the Midwest Region contract. Ask about rate escalator, termination, missing clauses, non-aligned clauses, or compliance.",
  },
};

const samplePrompts = [
  "What are the missing clauses?",
  "Show non-aligned clauses",
  "What is the rate escalator?",
  "Termination terms",
  "Compliance requirements",
  "Compare with standard",
];

export default function ContractDeviation() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedContractId, setSelectedContractId] = useState<string>("");
  const [selectedClause, setSelectedClause] = useState<Clause | null>(null);
  const [talkToContract, setTalkToContract] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.getContracts().then(c => {
      setContracts(c);
      if (c.length > 0) setSelectedContractId(c[0].id);
    });
  }, []);

  const contract = contracts.find(c => c.id === selectedContractId) || null;

  // Reset chat when contract changes
  useEffect(() => {
    setChatMessages([]);
  }, [selectedContractId]);

  const handleChat = async (text?: string) => {
    const msg = text || chatInput;
    if (!msg.trim()) return;
    setChatMessages(m => [...m, { role: "user", text: msg }]);
    setChatInput("");
    setChatLoading(true);

    await new Promise(r => setTimeout(r, 1000));

    const contractAnswers = deviationChatAnswers[selectedContractId] || deviationChatAnswers["contract-001"];
    const lower = msg.toLowerCase();
    let response = contractAnswers["default"];
    for (const [keyword, answer] of Object.entries(contractAnswers)) {
      if (keyword !== "default" && lower.includes(keyword)) {
        response = answer;
        break;
      }
    }

    setChatMessages(m => [...m, { role: "assistant", text: response }]);
    setChatLoading(false);
  };

  if (!contract) {
    return (
      <div className="page-container">
        <h1 className="page-header">Contract Deviation & Recommendations</h1>
        <div className="bg-card border rounded-lg p-8 text-center">
          <p className="text-muted-foreground">No contract uploaded yet. Please <button onClick={() => navigate("/upload")} className="text-secondary underline">upload a contract</button> first.</p>
        </div>
      </div>
    );
  }

  const aligned = contract.clauses.filter((c) => c.category === "aligned");
  const nonAligned = contract.clauses.filter((c) => c.category === "nonAligned");
  const missing = contract.clauses.filter((c) => c.category === "missing");
  const total = contract.clauses.length;
  const avgScore = (contract.clauses.reduce((s, c) => s + c.matchScore, 0) / total).toFixed(2);

  if (selectedClause) {
    return (
      <div className="page-container">
        <button onClick={() => setSelectedClause(null)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Deviations
        </button>
        <div className="flex items-center gap-3 mb-6">
          <h1 className="page-header">{selectedClause.clauseName}</h1>
          <span className="status-chip status-chip-info">{selectedClause.articleName}</span>
          <span className={`status-chip ${selectedClause.category === "nonAligned" ? "status-chip-error" : selectedClause.category === "missing" ? "status-chip-warning" : "status-chip-success"}`}>
            Match Score: {selectedClause.matchScore}/5
          </span>
        </div>
        <TwoColumnCompare leftTitle="Standard Clause" rightTitle="Current Clause" leftText={selectedClause.standardText} rightText={selectedClause.currentText} />
        {selectedClause.deviationNotes.length > 0 && (
          <div className="bg-card border rounded-lg p-5 mt-4">
            <h3 className="font-semibold text-sm mb-3 text-destructive">Deviation</h3>
            <ul className="space-y-2">{selectedClause.deviationNotes.map((n, i) => (<li key={i} className="text-sm flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-destructive mt-1.5 flex-shrink-0" />{n}</li>))}</ul>
          </div>
        )}
        {selectedClause.recommendations.length > 0 && (
          <div className="bg-card border rounded-lg p-5 mt-4">
            <h3 className="font-semibold text-sm mb-3 text-success">Recommendation</h3>
            <ul className="space-y-2">{selectedClause.recommendations.map((r, i) => (<li key={i} className="text-sm flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-success mt-1.5 flex-shrink-0" />{r}</li>))}</ul>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="page-header">Contract Deviation & Recommendations</h1>
        <div className="flex gap-2">
          <button onClick={() => navigate("/integrity")} className="flex items-center gap-2 px-3 py-1.5 border rounded-lg text-sm font-medium hover:bg-muted">
            <ArrowRight className="w-4 h-4" /> Run Integrity Validation
          </button>
          <button onClick={() => setTalkToContract(!talkToContract)} className="flex items-center gap-2 px-3 py-1.5 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:opacity-90">
            <Bot className="w-4 h-4" /> Talk to Contract Agent – Your CoAuthor
          </button>
        </div>
      </div>

      {/* Contract selector */}
      <div className="flex items-center gap-3 bg-card border rounded-lg p-3">
        <FileText className="w-4 h-4 text-secondary" />
        <span className="text-sm font-medium">Contract File Name:</span>
        <div className="relative flex-1 max-w-lg">
          <select
            value={selectedContractId}
            onChange={e => setSelectedContractId(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm bg-background appearance-none pr-8 font-medium"
          >
            {contracts.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPIStatCard title="Overall Score" value={`${avgScore}/5`} icon={<Target className="w-5 h-5" />} />
        <KPIStatCard title="Total Aligned Clauses" value={`${aligned.length}/${total}`} variant="success" icon={<CheckCircle className="w-5 h-5" />} />
        <KPIStatCard title="Total Non-Aligned Clauses" value={`${nonAligned.length}/${total}`} variant="error" icon={<XCircle className="w-5 h-5" />} />
        <KPIStatCard title="Total Missing Clauses" value={`${missing.length}/${total}`} variant="warning" icon={<AlertTriangle className="w-5 h-5" />} />
      </div>

      <div className={`grid gap-6 ${talkToContract ? "grid-cols-1 lg:grid-cols-3" : "grid-cols-1"}`}>
        <div className={`space-y-4 ${talkToContract ? "lg:col-span-2" : ""}`}>
          <ClauseAccordionList title="Missing Clauses" clauses={missing} color="red" onClauseClick={setSelectedClause} />
          <ClauseAccordionList title="Non-Aligned Clauses" clauses={nonAligned} color="yellow" onClauseClick={setSelectedClause} />
          <ClauseAccordionList title="Aligned Clauses" clauses={aligned} color="green" onClauseClick={setSelectedClause} />
        </div>

        {talkToContract && (
          <div className="bg-card border rounded-xl flex flex-col h-[550px]">
            <div className="p-3 border-b flex items-center gap-2">
              <Bot className="w-4 h-4 text-secondary" />
              <span className="font-semibold text-xs">Talk to Contract Agent – Your CoAuthor</span>
            </div>
            <div className="p-2 border-b">
              <label className="text-[10px] font-medium text-muted-foreground block mb-1">Analyzing Contract:</label>
              <span className="text-xs font-medium text-foreground">{contract.name}</span>
            </div>
            {/* Sample prompts */}
            <div className="p-2 flex flex-wrap gap-1 border-b">
              {samplePrompts.map(p => (
                <button key={p} onClick={() => handleChat(p)} className="text-[10px] px-2 py-0.5 rounded-full bg-accent text-accent-foreground hover:bg-secondary hover:text-secondary-foreground transition-colors">
                  {p}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {chatMessages.length === 0 && <p className="text-xs text-muted-foreground text-center mt-6">Ask questions about this contract. Answers include clause citations.</p>}
              {chatMessages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[90%] rounded-lg px-2.5 py-1.5 text-xs ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {chatLoading && <div className="flex justify-start"><div className="bg-muted rounded-lg px-2.5 py-1.5 text-xs animate-pulse">Thinking...</div></div>}
            </div>
            <div className="p-2 border-t flex gap-1.5">
              <input className="flex-1 border rounded px-2 py-1.5 text-xs bg-background" placeholder="Ask about this contract..." value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleChat()} />
              <button onClick={() => handleChat()} className="bg-secondary text-secondary-foreground p-1.5 rounded hover:opacity-90"><MessageSquare className="w-3 h-3" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
