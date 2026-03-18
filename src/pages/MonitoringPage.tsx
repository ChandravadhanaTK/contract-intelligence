import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, TrendingDown, TrendingUp, Shield, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import type { ClaimsSample, UMSample, DisputeTicket, Contract } from "@/types";

function get<T>(key: string, fb: T): T { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fb; }
function set(key: string, v: unknown) { localStorage.setItem(key, JSON.stringify(v)); }

const seedClaims: ClaimsSample[] = [
  { id: "cs1", contractId: "contract-001", codeType: "CPT", code: "99213", expected: 144.38, paid: 125.00, variance: -19.38, reason: "Rate table not updated to escalated rate" },
  { id: "cs2", contractId: "contract-001", codeType: "CPT", code: "27447", expected: 4725.00, paid: 4500.00, variance: -225.00, reason: "Escalator not applied to negotiated rate" },
  { id: "cs3", contractId: "contract-001", codeType: "CPT", code: "99281", expected: 1260.00, paid: 1400.00, variance: 140.00, reason: "Overpayment – paid at non-contracted rate" },
  { id: "cs4", contractId: "contract-002", codeType: "CPT", code: "90834", expected: 113.30, paid: 110.00, variance: -3.30, reason: "Escalator not applied" },
  { id: "cs5", contractId: "contract-003", codeType: "DRG", code: "470", expected: 12875.00, paid: 13500.00, variance: 625.00, reason: "Paid at prior year rate + incorrect adjustment" },
];

const seedUM: UMSample[] = [
  { id: "um1", contractId: "contract-001", service: "Outpatient MRI", contractRule: "Prior auth required", systemRule: "No prior auth", mismatchFlag: true },
  { id: "um2", contractId: "contract-001", service: "Physical Therapy > 20 visits", contractRule: "Auth after 12 visits", systemRule: "Auth after 20 visits", mismatchFlag: true },
  { id: "um3", contractId: "contract-001", service: "Primary Care Visit", contractRule: "No auth required", systemRule: "No auth required", mismatchFlag: false },
  { id: "um4", contractId: "contract-002", service: "Behavioral Health – Group", contractRule: "No auth required", systemRule: "Prior auth required", mismatchFlag: true },
];

const seedDisputes: DisputeTicket[] = [
  { id: "dt1", contractId: "contract-001", category: "Underpayment", count: 47, codes: ["99213", "99214", "27447"], createdAt: "2025-01-10", status: "Open" },
  { id: "dt2", contractId: "contract-001", category: "UM Mismatch", count: 12, codes: ["70553", "97110"], createdAt: "2025-01-12", status: "Open" },
  { id: "dt3", contractId: "contract-002", category: "Overpayment", count: 8, codes: ["90834"], createdAt: "2025-01-14", status: "In Review" },
  { id: "dt4", contractId: "contract-003", category: "Rate Drift", count: 23, codes: ["470", "99213"], createdAt: "2025-01-08", status: "Open" },
];

export default function MonitoringPage() {
  const navigate = useNavigate();
  const [claims, setClaims] = useState<ClaimsSample[]>([]);
  const [umSamples, setUmSamples] = useState<UMSample[]>([]);
  const [disputes, setDisputes] = useState<DisputeTicket[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedContract, setSelectedContract] = useState("");

  useEffect(() => {
    let c = get<ClaimsSample[]>("oci_claims_samples", []);
    if (c.length === 0) { c = seedClaims; set("oci_claims_samples", c); }
    setClaims(c);
    let u = get<UMSample[]>("oci_um_samples", []);
    if (u.length === 0) { u = seedUM; set("oci_um_samples", u); }
    setUmSamples(u);
    let d = get<DisputeTicket[]>("oci_disputes", []);
    if (d.length === 0) { d = seedDisputes; set("oci_disputes", d); }
    setDisputes(d);
    const ct = get<Contract[]>("oci_contracts", []);
    setContracts(ct);
    setSelectedContract(ct[0]?.id || "");
  }, []);

  const cc = claims.filter(c => c.contractId === selectedContract);
  const um = umSamples.filter(u => u.contractId === selectedContract);
  const dt = disputes.filter(d => d.contractId === selectedContract);
  const mismatches = um.filter(u => u.mismatchFlag);
  const totalVariance = cc.reduce((s, c) => s + Math.abs(c.variance), 0);
  const disputeRisk = Math.min(100, Math.round((dt.reduce((s, d) => s + d.count, 0) / 10) + mismatches.length * 10 + (totalVariance / 100)));

  const createRemediationTask = (desc: string) => {
    const cts = get<Contract[]>("oci_contracts", []);
    const c = cts.find(x => x.id === selectedContract);
    if (!c) return;
    const task = { id: `task-rem-${Date.now()}`, name: desc, assignee: "ChandravadhanaTK", status: "Todo" as const, dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0] };
    c.workflow.tasks.push(task);
    c.workflow.history.push({ time: new Date().toISOString(), stage: c.workflow.stage, actor: "System", note: `Remediation task created: ${desc}` });
    const updated = cts.map(x => x.id === c.id ? c : x);
    set("oci_contracts", updated);
    toast.success("Remediation task added to Workflow");
  };

  return (
    <div className="page-container">
      <h1 className="page-header">Post-Execution Monitoring</h1>

      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-1">Contract</label>
        <select className="border rounded-lg px-3 py-2 text-sm bg-background min-w-[300px]" value={selectedContract} onChange={e => setSelectedContract(e.target.value)}>
          {contracts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="kpi-card">
          <p className="text-xs text-muted-foreground">Dispute Risk Index</p>
          <p className={`text-2xl font-bold ${disputeRisk >= 70 ? "text-destructive" : disputeRisk >= 40 ? "text-warning" : "text-success"}`}>{disputeRisk}/100</p>
        </div>
        <div className="kpi-card">
          <p className="text-xs text-muted-foreground">Total Variance</p>
          <p className="text-2xl font-bold text-destructive">${totalVariance.toLocaleString()}</p>
        </div>
        <div className="kpi-card">
          <p className="text-xs text-muted-foreground">UM Mismatches</p>
          <p className="text-2xl font-bold text-warning">{mismatches.length}</p>
        </div>
        <div className="kpi-card">
          <p className="text-xs text-muted-foreground">Open Disputes</p>
          <p className="text-2xl font-bold text-destructive">{dt.filter(d => d.status === "Open").length}</p>
        </div>
      </div>

      {/* Claims Variance */}
      <div className="bg-card border rounded-lg overflow-hidden">
        <div className="p-4 border-b bg-muted/50 flex items-center justify-between">
          <h3 className="font-semibold text-sm">Claims Variance Alerts</h3>
          <button onClick={() => createRemediationTask("Investigate claims variance for " + contracts.find(c => c.id === selectedContract)?.name)} className="px-3 py-1 bg-primary text-primary-foreground rounded text-xs font-medium flex items-center gap-1"><ArrowRight className="w-3 h-3" /> Create Remediation Task</button>
        </div>
        <table className="w-full text-sm">
          <thead><tr className="border-b bg-muted/30"><th className="text-left px-4 py-2 text-xs text-muted-foreground">Code</th><th className="text-right px-4 py-2 text-xs text-muted-foreground">Expected</th><th className="text-right px-4 py-2 text-xs text-muted-foreground">Paid</th><th className="text-right px-4 py-2 text-xs text-muted-foreground">Variance</th><th className="text-left px-4 py-2 text-xs text-muted-foreground">Reason</th></tr></thead>
          <tbody>
            {cc.map(c => (
              <tr key={c.id} className="border-b">
                <td className="px-4 py-2 font-mono text-xs">{c.codeType} {c.code}</td>
                <td className="px-4 py-2 text-right">${c.expected.toLocaleString()}</td>
                <td className="px-4 py-2 text-right">${c.paid.toLocaleString()}</td>
                <td className={`px-4 py-2 text-right font-semibold ${c.variance < 0 ? "text-destructive" : "text-warning"}`}>
                  <span className="flex items-center justify-end gap-1">
                    {c.variance < 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                    ${Math.abs(c.variance).toLocaleString()}
                  </span>
                </td>
                <td className="px-4 py-2 text-xs text-muted-foreground">{c.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* UM Mismatches */}
      <div className="bg-card border rounded-lg overflow-hidden">
        <div className="p-4 border-b bg-muted/50"><h3 className="font-semibold text-sm">UM Configuration Mismatches</h3></div>
        <table className="w-full text-sm">
          <thead><tr className="border-b bg-muted/30"><th className="text-left px-4 py-2 text-xs text-muted-foreground">Service</th><th className="text-left px-4 py-2 text-xs text-muted-foreground">Contract Rule</th><th className="text-left px-4 py-2 text-xs text-muted-foreground">System Rule</th><th className="text-left px-4 py-2 text-xs text-muted-foreground">Status</th></tr></thead>
          <tbody>
            {um.map(u => (
              <tr key={u.id} className={`border-b ${u.mismatchFlag ? "bg-destructive/5" : ""}`}>
                <td className="px-4 py-2">{u.service}</td>
                <td className="px-4 py-2">{u.contractRule}</td>
                <td className="px-4 py-2">{u.systemRule}</td>
                <td className="px-4 py-2">{u.mismatchFlag ? <span className="status-chip status-chip-error">Mismatch</span> : <span className="status-chip status-chip-success">Aligned</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Disputes */}
      <div className="bg-card border rounded-lg overflow-hidden">
        <div className="p-4 border-b bg-muted/50"><h3 className="font-semibold text-sm">Dispute Tickets</h3></div>
        <div className="divide-y">
          {dt.map(d => (
            <div key={d.id} className="p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  <span className="font-medium text-sm">{d.category}</span>
                  <span className={`status-chip ${d.status === "Open" ? "status-chip-error" : d.status === "In Review" ? "status-chip-warning" : "status-chip-success"}`}>{d.status}</span>
                </div>
                <p className="text-xs text-muted-foreground">{d.count} affected claims · Codes: {d.codes.join(", ")}</p>
              </div>
              <button onClick={() => createRemediationTask(`Resolve ${d.category} dispute – ${d.count} claims`)} className="px-3 py-1.5 border rounded text-xs font-medium hover:bg-muted flex items-center gap-1">
                <Shield className="w-3 h-3" /> Create Task
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
