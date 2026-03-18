import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, FileText, ArrowRight, TrendingUp, Shield, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import type { Contract, DraftContract } from "@/types";

function get<T>(key: string, fb: T): T { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fb; }
function set(key: string, v: unknown) { localStorage.setItem(key, JSON.stringify(v)); }

interface RenewalItem {
  contractId: string;
  contractName: string;
  renewalDate: string;
  daysUntil: number;
  complianceStatus: string;
  integrityScore: number;
  disputeCount: number;
  escalationHistory: string;
  briefGenerated: boolean;
  draftGenerated: boolean;
}

export default function RenewalsPage() {
  const navigate = useNavigate();
  const [renewals, setRenewals] = useState<RenewalItem[]>([]);

  useEffect(() => {
    const contracts = get<Contract[]>("oci_contracts", []);
    const now = Date.now();
    const items: RenewalItem[] = [
      { contractId: "contract-001", contractName: contracts.find(c => c.id === "contract-001")?.name || "Northeast Region", renewalDate: new Date(now + 28 * 86400000).toISOString().split("T")[0], daysUntil: 28, complianceStatus: "3 Overdue, 5 Open", integrityScore: 67, disputeCount: 2, escalationHistory: "5% CPI-U annual", briefGenerated: false, draftGenerated: false },
      { contractId: "contract-002", contractName: contracts.find(c => c.id === "contract-002")?.name || "Southeast Region", renewalDate: new Date(now + 55 * 86400000).toISOString().split("T")[0], daysUntil: 55, complianceStatus: "1 Overdue, 3 Open", integrityScore: 82, disputeCount: 1, escalationHistory: "3% flat annual", briefGenerated: false, draftGenerated: false },
      { contractId: "contract-003", contractName: contracts.find(c => c.id === "contract-003")?.name || "Midwest Region", renewalDate: new Date(now + 85 * 86400000).toISOString().split("T")[0], daysUntil: 85, complianceStatus: "All Compliant", integrityScore: 95, disputeCount: 0, escalationHistory: "3% CPI-U annual", briefGenerated: false, draftGenerated: false },
    ];
    const stored = get<RenewalItem[]>("oci_renewals", []);
    if (stored.length > 0) setRenewals(stored); else { setRenewals(items); set("oci_renewals", items); }
  }, []);

  const generateBrief = (idx: number) => {
    const updated = [...renewals];
    updated[idx].briefGenerated = true;
    setRenewals(updated);
    set("oci_renewals", updated);
    toast.success("Renewal brief generated");
  };

  const generateDraft = (item: RenewalItem, idx: number) => {
    const drafts = get<DraftContract[]>("oci_drafts", []);
    const draft: DraftContract = {
      id: `draft-renewal-${Date.now()}`,
      name: `Renewal – ${item.contractName}`,
      parties: "United HealthCare Services, Inc., Provider Organization",
      effectiveDate: item.renewalDate,
      term: "Three (3) years",
      paymentRate: `Rates per prior agreement with ${item.escalationHistory} escalation applied`,
      servicesScope: "All Covered Services per prior agreement scope with updated terms",
      clauses: [],
      createdAt: new Date().toISOString(),
    };
    drafts.push(draft);
    set("oci_drafts", drafts);
    const updated = [...renewals];
    updated[idx].draftGenerated = true;
    setRenewals(updated);
    set("oci_renewals", updated);
    toast.success("Renewal draft created – opening Contract Creation");
    navigate("/create");
  };

  const urgencyColor = (days: number) => days <= 30 ? "text-destructive" : days <= 60 ? "text-warning" : "text-success";
  const urgencyBg = (days: number) => days <= 30 ? "border-destructive/30 bg-destructive/5" : days <= 60 ? "border-warning/30 bg-warning/5" : "border-success/30 bg-success/5";

  return (
    <div className="page-container">
      <h1 className="page-header">AI-Driven Renewals</h1>
      <p className="text-sm text-muted-foreground">Contracts approaching renewal with AI-generated briefs and draft preparation.</p>

      <div className="space-y-4">
        {renewals.map((item, idx) => (
          <div key={item.contractId} className={`bg-card border rounded-lg p-5 ${urgencyBg(item.daysUntil)}`}>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <FileText className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-sm">{item.contractName}</span>
                  <span className={`text-xs font-bold ${urgencyColor(item.daysUntil)}`}>{item.daysUntil} days until renewal</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" /> Renewal: {item.renewalDate}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="bg-background rounded-lg p-3">
                <p className="text-[10px] text-muted-foreground uppercase">Compliance</p>
                <p className="text-xs font-medium mt-1">{item.complianceStatus}</p>
              </div>
              <div className="bg-background rounded-lg p-3">
                <p className="text-[10px] text-muted-foreground uppercase">Integrity Score</p>
                <p className={`text-lg font-bold ${item.integrityScore >= 80 ? "text-success" : item.integrityScore >= 50 ? "text-warning" : "text-destructive"}`}>{item.integrityScore}</p>
              </div>
              <div className="bg-background rounded-lg p-3">
                <p className="text-[10px] text-muted-foreground uppercase">Open Disputes</p>
                <p className={`text-lg font-bold ${item.disputeCount > 0 ? "text-warning" : "text-success"}`}>{item.disputeCount}</p>
              </div>
              <div className="bg-background rounded-lg p-3">
                <p className="text-[10px] text-muted-foreground uppercase">Rate History</p>
                <p className="text-xs font-medium mt-1">{item.escalationHistory}</p>
              </div>
            </div>

            {item.briefGenerated && (
              <div className="bg-accent/50 rounded-lg p-4 mb-4 text-sm">
                <p className="font-semibold text-xs mb-2 flex items-center gap-1"><CheckCircle className="w-3 h-3 text-success" /> Renewal Brief</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Contract "{item.contractName}" is due for renewal on {item.renewalDate} ({item.daysUntil} days). 
                  Compliance status: {item.complianceStatus}. Integrity score: {item.integrityScore}/100. 
                  {item.disputeCount > 0 ? ` There are ${item.disputeCount} open dispute(s) to resolve before renewal.` : " No open disputes."} 
                  Rate escalation history: {item.escalationHistory}. Recommendation: {item.integrityScore >= 80 ? "Proceed with standard renewal terms." : "Address integrity findings before renewal."}
                </p>
              </div>
            )}

            <div className="flex gap-2 flex-wrap">
              {!item.briefGenerated && <button onClick={() => generateBrief(idx)} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-xs font-medium flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Generate Renewal Brief</button>}
              <button onClick={() => generateDraft(item, idx)} className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded-md text-xs font-medium flex items-center gap-1">
                <ArrowRight className="w-3 h-3" /> Generate Renewal Draft
              </button>
              <button onClick={() => navigate("/monitoring")} className="px-3 py-1.5 border rounded-md text-xs font-medium hover:bg-muted flex items-center gap-1">
                <Shield className="w-3 h-3" /> View Monitoring
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
