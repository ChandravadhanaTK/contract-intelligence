import { useState, useEffect } from "react";
import { CheckCircle, XCircle, AlertTriangle, Shield, RotateCcw, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { CredentialingCheck } from "@/types";

function get<T>(key: string, fb: T): T { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fb; }
function set(key: string, v: unknown) { localStorage.setItem(key, JSON.stringify(v)); }

const defaultChecks: Omit<CredentialingCheck, "id" | "intakeId">[] = [
  { checkType: "CAQH Profile Verification", status: "Pass", evidenceLink: "https://proview.caqh.org/check/12345", lastCheckedAt: "2025-01-15T10:00:00Z", notes: "Profile complete and current" },
  { checkType: "NPI Validation", status: "Pass", evidenceLink: "https://npiregistry.cms.hhs.gov/12345", lastCheckedAt: "2025-01-15T10:02:00Z", notes: "NPI active, matches provider" },
  { checkType: "State License Expiry", status: "Fail", evidenceLink: "", lastCheckedAt: "2025-01-15T10:03:00Z", notes: "License expired 2024-12-31. Renewal required." },
  { checkType: "OIG/SAM Exclusion Check", status: "Pass", evidenceLink: "https://oig.hhs.gov/exclusions/check", lastCheckedAt: "2025-01-15T10:04:00Z", notes: "No exclusion found" },
  { checkType: "Address Normalization", status: "Pending", evidenceLink: "", lastCheckedAt: "2025-01-15T10:05:00Z", notes: "Address validation in progress" },
  { checkType: "Duplicate Provider Check", status: "Pass", evidenceLink: "", lastCheckedAt: "2025-01-15T10:06:00Z", notes: "No duplicates detected in provider master" },
];

export default function CredentialingPage() {
  const navigate = useNavigate();
  const [checks, setChecks] = useState<CredentialingCheck[]>([]);
  const [overrideId, setOverrideId] = useState<string | null>(null);
  const [overrideReason, setOverrideReason] = useState("");

  useEffect(() => {
    let stored = get<CredentialingCheck[]>("oci_credentialing", []);
    if (stored.length === 0) {
      stored = defaultChecks.map((c, i) => ({ ...c, id: `cred-${i}`, intakeId: "intake-default" }));
      set("oci_credentialing", stored);
    }
    setChecks(stored);
  }, []);

  const save = (updated: CredentialingCheck[]) => { setChecks(updated); set("oci_credentialing", updated); };

  const handleApprove = (id: string) => {
    save(checks.map(c => c.id === id ? { ...c, status: "Pass" as const, lastCheckedAt: new Date().toISOString() } : c));
    toast.success("Check approved");
  };

  const handleRequestCorrection = (id: string) => {
    save(checks.map(c => c.id === id ? { ...c, status: "Fail" as const, notes: c.notes + " | Correction requested " + new Date().toLocaleString() } : c));
    toast.info("Correction requested");
  };

  const handleOverride = (id: string) => {
    if (!overrideReason.trim()) { toast.error("Override reason required"); return; }
    save(checks.map(c => c.id === id ? { ...c, status: "Overridden" as const, overriddenBy: "ChandravadhanaTK", overrideReason: overrideReason, lastCheckedAt: new Date().toISOString() } : c));
    setOverrideId(null);
    setOverrideReason("");
    toast.success("Check overridden");
  };

  const passCount = checks.filter(c => c.status === "Pass" || c.status === "Overridden").length;
  const failCount = checks.filter(c => c.status === "Fail").length;
  const pendingCount = checks.filter(c => c.status === "Pending").length;

  const statusIcon = (s: string) => {
    if (s === "Pass") return <CheckCircle className="w-4 h-4 text-success" />;
    if (s === "Fail") return <XCircle className="w-4 h-4 text-destructive" />;
    if (s === "Overridden") return <Shield className="w-4 h-4 text-warning" />;
    return <RotateCcw className="w-4 h-4 text-muted-foreground animate-spin" />;
  };

  return (
    <div className="page-container">
      <h1 className="page-header">Credentialing & Provider Validation</h1>

      <div className="grid grid-cols-3 gap-4">
        <div className="kpi-card"><p className="text-xs text-muted-foreground">Passed</p><p className="text-2xl font-bold text-success">{passCount}</p></div>
        <div className="kpi-card"><p className="text-xs text-muted-foreground">Failed</p><p className="text-2xl font-bold text-destructive">{failCount}</p></div>
        <div className="kpi-card"><p className="text-xs text-muted-foreground">Pending</p><p className="text-2xl font-bold text-muted-foreground">{pendingCount}</p></div>
      </div>

      {failCount > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-destructive" />
          <span className="text-sm text-destructive font-medium">{failCount} check(s) failed — action required before proceeding</span>
        </div>
      )}

      <div className="space-y-3">
        {checks.map(check => (
          <div key={check.id} className="bg-card border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                {statusIcon(check.status)}
                <span className="font-medium text-sm">{check.checkType}</span>
                <span className={`status-chip ${check.status === "Pass" ? "status-chip-success" : check.status === "Fail" ? "status-chip-error" : check.status === "Overridden" ? "status-chip-warning" : "bg-muted text-muted-foreground"}`}>{check.status}</span>
              </div>
              <span className="text-xs text-muted-foreground">Last: {new Date(check.lastCheckedAt).toLocaleString()}</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">{check.notes}</p>
            {check.evidenceLink && <a href={check.evidenceLink} target="_blank" rel="noreferrer" className="text-xs text-secondary underline mb-2 block">View Evidence</a>}
            {check.overriddenBy && <p className="text-xs text-warning">Overridden by {check.overriddenBy}: {check.overrideReason}</p>}

            <div className="flex gap-2 mt-2">
              {check.status !== "Pass" && <button onClick={() => handleApprove(check.id)} className="px-3 py-1 bg-success text-success-foreground rounded text-xs font-medium">Approve</button>}
              {check.status === "Fail" && <button onClick={() => handleRequestCorrection(check.id)} className="px-3 py-1 border rounded text-xs font-medium">Request Correction</button>}
              {check.status === "Fail" && overrideId !== check.id && <button onClick={() => setOverrideId(check.id)} className="px-3 py-1 bg-warning text-warning-foreground rounded text-xs font-medium">Override</button>}
            </div>

            {overrideId === check.id && (
              <div className="mt-3 flex gap-2 items-end">
                <div className="flex-1">
                  <label className="text-xs font-medium block mb-1">Override Reason</label>
                  <input className="w-full border rounded px-2 py-1.5 text-sm bg-background" value={overrideReason} onChange={e => setOverrideReason(e.target.value)} placeholder="Reason for override..." />
                </div>
                <button onClick={() => handleOverride(check.id)} className="px-3 py-1.5 bg-warning text-warning-foreground rounded text-xs font-medium">Confirm</button>
                <button onClick={() => { setOverrideId(null); setOverrideReason(""); }} className="px-3 py-1.5 border rounded text-xs">Cancel</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
