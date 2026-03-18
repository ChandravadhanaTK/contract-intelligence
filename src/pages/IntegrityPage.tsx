import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, AlertTriangle, CheckCircle, ArrowRight, ArrowLeft, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import type { IntegrityFinding, Contract } from "@/types";
import { api } from "@/services/mockApi";

function get<T>(key: string, fb: T): T { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fb; }
function set(key: string, v: unknown) { localStorage.setItem(key, JSON.stringify(v)); }

const seedFindings: IntegrityFinding[] = [
  { id: "if-1", contractId: "all", severity: "Critical", category: "Missing Signatures", title: "Provider signature block incomplete", description: "The signature block on page 48 is missing the Provider representative signature and date fields.", sectionRef: "Section 14.0", pageRef: "Page 48", remediation: "Add complete signature block with name, title, and date fields", status: "Open" },
  { id: "if-2", contractId: "contract-001", severity: "High", category: "Cross-Reference Mismatch", title: "Appendix C referenced but not attached", description: "Section 3.2 references 'Exhibit C – Reporting & Quality' but the exhibit is not included in the document package.", sectionRef: "Section 3.2", pageRef: "Page 12", remediation: "Attach Exhibit C or update cross-reference", status: "Open" },
  { id: "if-3", contractId: "contract-001", severity: "High", category: "Product List Mismatch", title: "Rate table products don't match services scope", description: "Rate Table 1C includes 'Behavioral Health' services not listed in the Services Scope (Section 3.1).", sectionRef: "Section 3.1 vs Exhibit A", pageRef: "Page 8, 38", remediation: "Add Behavioral Health to Services Scope or remove from rate table", status: "Open" },
  { id: "if-4", contractId: "contract-001", severity: "Medium", category: "Conflicting Terms", title: "Termination notice period conflict", description: "Section 7.1 states 180 days notice but the Summary of Terms on Page 2 states 90 days.", sectionRef: "Section 7.1 vs Summary", pageRef: "Page 2, 22", remediation: "Align both references to 180 days", status: "Open" },
  { id: "if-5", contractId: "contract-001", severity: "Medium", category: "Incomplete Section", title: "Dispute resolution costs not specified", description: "Section 10.3 references cost sharing but doesn't specify the allocation percentage.", sectionRef: "Section 10.3", pageRef: "Page 30", remediation: "Specify equal sharing of arbitration costs", status: "Open" },
  { id: "if-6", contractId: "contract-001", severity: "Low", category: "Formatting", title: "Inconsistent section numbering", description: "Section 8 uses different numbering format than other sections.", sectionRef: "Section 8.0", pageRef: "Page 25", remediation: "Standardize to X.Y numbering format", status: "Open" },
  { id: "if-7", contractId: "contract-002", severity: "High", category: "Missing Signatures", title: "Amendment signature page absent", description: "The amendment addendum is missing a separate signature page.", sectionRef: "Amendment", pageRef: "Page 52", remediation: "Add amendment signature page", status: "Open" },
  { id: "if-8", contractId: "contract-002", severity: "Medium", category: "Cross-Reference Mismatch", title: "Fee schedule effective date mismatch", description: "Base agreement states January 1 effective date but fee schedule shows February 1.", sectionRef: "Section 2.1 vs Exhibit A", pageRef: "Page 2, 35", remediation: "Align effective dates", status: "Open" },
  { id: "if-9", contractId: "contract-003", severity: "Critical", category: "Conflicting Terms", title: "Claims timeline exceeds regulatory limit", description: "Section 4.3 allows 60-day clean claims processing which exceeds the 30-day state requirement.", sectionRef: "Section 4.3", pageRef: "Page 15", remediation: "Reduce to 30 calendar days per state regulation", status: "Open" },
];

export default function IntegrityPage() {
  const navigate = useNavigate();
  const [findings, setFindings] = useState<IntegrityFinding[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedContract, setSelectedContract] = useState("all");
  const [filterSeverity, setFilterSeverity] = useState<string>("all");

  useEffect(() => {
    let stored = get<IntegrityFinding[]>("oci_integrity_findings", []);
    if (stored.length === 0) { stored = seedFindings; set("oci_integrity_findings", stored); }
    setFindings(stored);
    api.getContracts().then(c => {
      setContracts(c);
    });
  }, []);

  const contractFindings = selectedContract === "all" ? findings : findings.filter(f => f.contractId === selectedContract);
  const filtered = filterSeverity === "all" ? contractFindings : contractFindings.filter(f => f.severity === filterSeverity);
  const openCount = contractFindings.filter(f => f.status === "Open").length;
  const totalCount = contractFindings.length;
  const score = totalCount === 0 ? 100 : Math.round(((totalCount - openCount) / totalCount) * 100);

  const resolveFinding = (id: string) => {
    const updated = findings.map(f => f.id === id ? { ...f, status: "Resolved" as const } : f);
    setFindings(updated);
    set("oci_integrity_findings", updated);
    toast.success("Finding resolved");
  };

  const pushToRedlining = (finding: IntegrityFinding) => {
    // Create a clause version suggestion
    const versions = get<any[]>("oci_clause_versions", []);
    versions.push({
      id: `cv-integrity-${Date.now()}`,
      clauseId: `integrity-${finding.id}`,
      contractId: finding.contractId,
      originalText: finding.description,
      proposedText: finding.remediation,
      acceptedText: null,
      status: "pending",
      timestamp: new Date().toISOString(),
    });
    set("oci_clause_versions", versions);
    toast.success("Redlining suggestion created");
    navigate("/redlining");
  };

  const severityColor = (s: string) => s === "Critical" ? "status-chip-error" : s === "High" ? "status-chip-warning" : s === "Medium" ? "status-chip-info" : "bg-muted text-muted-foreground";

  const severityCounts = {
    Critical: contractFindings.filter(f => f.severity === "Critical").length,
    High: contractFindings.filter(f => f.severity === "High").length,
    Medium: contractFindings.filter(f => f.severity === "Medium").length,
    Low: contractFindings.filter(f => f.severity === "Low").length,
  };

  return (
    <div className="page-container">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg border hover:bg-muted transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="page-header !mb-0">Contract Integrity Validation</h1>
      </div>

      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Contract</label>
          <div className="relative">
            <select className="border rounded-lg px-3 py-2 text-sm bg-background min-w-[300px] appearance-none pr-8" value={selectedContract} onChange={e => setSelectedContract(e.target.value)}>
              <option value="all">All Contracts</option>
              {contracts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Severity</label>
          <select className="border rounded-lg px-3 py-2 text-sm bg-background" value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)}>
            <option value="all">All</option><option value="Critical">Critical</option><option value="High">High</option><option value="Medium">Medium</option><option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Severity Breakdown Bar */}
      <div className="bg-card border rounded-lg p-4">
        <h3 className="text-xs font-semibold text-muted-foreground mb-3">Severity Breakdown</h3>
        <div className="flex gap-3 mb-3">
          {(["Critical", "High", "Medium", "Low"] as const).map(sev => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(filterSeverity === sev ? "all" : sev)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${filterSeverity === sev ? "ring-2 ring-secondary" : ""} ${
                sev === "Critical" ? "bg-destructive/10 text-destructive border-destructive/20" :
                sev === "High" ? "bg-warning/10 text-warning border-warning/20" :
                sev === "Medium" ? "bg-primary/10 text-primary border-primary/20" :
                "bg-muted text-muted-foreground border-border"
              }`}
            >
              <span className="font-bold">{severityCounts[sev]}</span> {sev}
            </button>
          ))}
        </div>
        {contractFindings.length > 0 && (
          <div className="w-full h-3 rounded-full bg-muted flex overflow-hidden">
            {severityCounts.Critical > 0 && <div className="h-full bg-destructive" style={{ width: `${(severityCounts.Critical / contractFindings.length) * 100}%` }} />}
            {severityCounts.High > 0 && <div className="h-full bg-warning" style={{ width: `${(severityCounts.High / contractFindings.length) * 100}%` }} />}
            {severityCounts.Medium > 0 && <div className="h-full bg-primary" style={{ width: `${(severityCounts.Medium / contractFindings.length) * 100}%` }} />}
            {severityCounts.Low > 0 && <div className="h-full bg-muted-foreground/30" style={{ width: `${(severityCounts.Low / contractFindings.length) * 100}%` }} />}
          </div>
        )}
      </div>

      {/* Integrity Score */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="kpi-card flex items-center gap-4">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold ${score >= 80 ? "bg-success/10 text-success" : score >= 50 ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive"}`}>
            {score}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Integrity Score</p>
            <p className="text-sm font-medium">{openCount} open findings of {totalCount}</p>
          </div>
        </div>
        <div className="kpi-card">
          <p className="text-xs text-muted-foreground">Critical / High</p>
          <p className="text-2xl font-bold text-destructive">{contractFindings.filter(f => (f.severity === "Critical" || f.severity === "High") && f.status === "Open").length}</p>
        </div>
        <div className="kpi-card">
          <p className="text-xs text-muted-foreground">Resolved</p>
          <p className="text-2xl font-bold text-success">{contractFindings.filter(f => f.status === "Resolved").length}</p>
        </div>
      </div>

      {/* Findings */}
      <div className="space-y-3">
        {filtered.map(f => (
          <div key={f.id} className={`bg-card border rounded-lg p-4 ${f.status === "Resolved" ? "opacity-60" : ""}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {f.severity === "Critical" ? <AlertTriangle className="w-4 h-4 text-destructive" /> : <Shield className="w-4 h-4 text-primary" />}
                  <span className="font-semibold text-sm">{f.title}</span>
                  <span className={`status-chip ${severityColor(f.severity)}`}>{f.severity}</span>
                  <span className="text-xs text-muted-foreground">{f.category}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{f.description}</p>
                <div className="flex gap-4 text-xs text-muted-foreground mb-2">
                  <span>📄 {f.sectionRef}</span>
                  <span>📃 {f.pageRef}</span>
                </div>
                <p className="text-xs"><strong>Remediation:</strong> {f.remediation}</p>
              </div>
              {f.status === "Resolved" && <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />}
            </div>
            {f.status === "Open" && (
              <div className="flex gap-2 mt-3">
                <button onClick={() => resolveFinding(f.id)} className="px-3 py-1 bg-success text-success-foreground rounded text-xs font-medium">Mark Resolved</button>
                <button onClick={() => pushToRedlining(f)} className="px-3 py-1 bg-primary text-primary-foreground rounded text-xs font-medium flex items-center gap-1"><ArrowRight className="w-3 h-3" /> Create Redlining Suggestion</button>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No findings for this contract.</p>}
      </div>
    </div>
  );
}
