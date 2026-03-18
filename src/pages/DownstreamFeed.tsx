import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Send, CheckCircle, ArrowRight, AlertTriangle, Eye } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/services/mockApi";
import type { Contract, IntegrityFinding, DownstreamMapping } from "@/types";

function get<T>(key: string, fb: T): T { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fb; }

const targets = [
  { id: "um", name: "Publish UM", description: "Utilization Management system feed", mappingFields: [
    { field: "Prior Auth Rules", value: "12 rules extracted", confidence: "High" as const },
    { field: "Service Categories", value: "8 categories mapped", confidence: "High" as const },
    { field: "Network Restrictions", value: "In-network only", confidence: "Medium" as const },
  ]},
  { id: "claims", name: "Publish Claims", description: "Claims processing system integration", mappingFields: [
    { field: "Fee Schedule", value: "Table 1C – 8 codes", confidence: "High" as const },
    { field: "Timely Filing", value: "90 days", confidence: "High" as const },
    { field: "COB Rules", value: "Standard coordination", confidence: "Medium" as const },
  ]},
  { id: "fee", name: "Publish Fee Schedules", description: "Fee schedule distribution", mappingFields: [
    { field: "Rate Table", value: "8 CPT/DRG rates", confidence: "High" as const },
    { field: "Escalator", value: "5% CPI-U annual", confidence: "High" as const },
    { field: "Effective Date", value: "2025-01-01", confidence: "High" as const },
  ]},
  { id: "directory", name: "Publish Directory", description: "Provider directory updates", mappingFields: [
    { field: "Provider Name", value: "Northeast Regional Medical Center", confidence: "High" as const },
    { field: "Locations", value: "3 locations extracted", confidence: "Medium" as const },
    { field: "Specialties", value: "12 specialties", confidence: "Low" as const },
  ]},
  { id: "analytics", name: "Publish Analytics Dashboard", description: "Analytics & reporting pipeline", mappingFields: [
    { field: "KPI Metrics", value: "HEDIS, CAHPS, Claims accuracy", confidence: "High" as const },
    { field: "Reporting Cadence", value: "Quarterly", confidence: "High" as const },
    { field: "Benchmark Data", value: "Regional benchmarks", confidence: "Medium" as const },
  ]},
];

export default function DownstreamFeed() {
  const navigate = useNavigate();
  const [publishing, setPublishing] = useState<Record<string, boolean>>({});
  const [published, setPublished] = useState<Record<string, boolean>>({});
  const [expandedTarget, setExpandedTarget] = useState<string | null>(null);
  const [integrityFindings, setIntegrityFindings] = useState<IntegrityFinding[]>([]);

  useEffect(() => {
    setIntegrityFindings(get<IntegrityFinding[]>("oci_integrity_findings", []));
  }, []);

  const openFindings = integrityFindings.filter(f => f.status === "Open").length;

  const getLoadReadyScore = (targetId: string) => {
    const t = targets.find(x => x.id === targetId);
    if (!t) return 100;
    const lowConfidence = t.mappingFields.filter(f => f.confidence === "Low").length;
    const medConfidence = t.mappingFields.filter(f => f.confidence === "Medium").length;
    return Math.max(0, 100 - (lowConfidence * 25) - (medConfidence * 10) - (openFindings * 5));
  };

  const getExceptions = (targetId: string) => {
    const t = targets.find(x => x.id === targetId);
    if (!t) return [];
    return t.mappingFields.filter(f => f.confidence === "Low" || f.confidence === "Medium").map(f => ({ field: f.field, issue: `${f.confidence} confidence – manual review recommended` }));
  };

  const handlePublish = async (id: string, name: string) => {
    setPublishing((p) => ({ ...p, [id]: true }));
    await new Promise((r) => setTimeout(r, 2000));
    setPublishing((p) => ({ ...p, [id]: false }));
    setPublished((p) => ({ ...p, [id]: true }));
    await api.addAuditEntry({ id: `a-${Date.now()}`, timestamp: new Date().toISOString(), action: "Published to Downstream", detail: `Published to ${name}`, actor: "ChandravadhanaTK" });
    toast.success(`Successfully published to ${name}`, {
      action: { label: "Monitor for drift", onClick: () => navigate("/monitoring") },
    });
  };

  const sendExceptionToReview = async (targetName: string, field: string) => {
    // Create a review request in the workflow queue
    const reqs = get<any[]>("oci_review_requests", []);
    reqs.push({
      id: `req-exception-${Date.now()}`,
      contractId: "contract-001",
      documentId: "doc-001",
      jobNo: `EXC${Math.floor(Date.now() % 10000)}`,
      eventType: `${targetName} – ${field} Exception`,
      effectiveDate: new Date().toISOString().split("T")[0],
      mpin: "N/A",
      tin: "N/A",
      status: "Exception",
      loadReady: false,
      checklist: [],
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem("oci_review_requests", JSON.stringify(reqs));
    toast.success("Exception sent to Workflow Review Queue");
  };

  return (
    <div className="page-container">
      <h1 className="page-header">Downstream Feed</h1>
      <p className="text-sm text-muted-foreground">Publish contract data to downstream systems with mapping preview and load-ready scoring.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {targets.map((t) => {
          const score = getLoadReadyScore(t.id);
          const exceptions = getExceptions(t.id);
          const isExpanded = expandedTarget === t.id;
          return (
            <div key={t.id} className="bg-card border rounded-lg p-5 flex flex-col">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Send className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold">{t.name}</h3>
                  <p className="text-xs text-muted-foreground">{t.description}</p>
                </div>
              </div>

              {/* Load Ready Score */}
              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Load-Ready Score</span>
                  <span className={`font-semibold ${score >= 80 ? "text-success" : score >= 50 ? "text-warning" : "text-destructive"}`}>{score}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div className={`h-1.5 rounded-full ${score >= 80 ? "bg-success" : score >= 50 ? "bg-warning" : "bg-destructive"}`} style={{ width: `${score}%` }} />
                </div>
              </div>

              {/* Expand toggle */}
              <button onClick={() => setExpandedTarget(isExpanded ? null : t.id)} className="text-xs text-secondary hover:underline mb-3 text-left flex items-center gap-1">
                <Eye className="w-3 h-3" /> {isExpanded ? "Hide" : "Show"} Mapping Preview
              </button>

              {isExpanded && (
                <div className="bg-muted/30 rounded-lg p-3 mb-3 space-y-2">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase">Field Mapping</p>
                  {t.mappingFields.map((f, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span>{f.field}: <span className="text-muted-foreground">{f.value}</span></span>
                      <span className={`status-chip text-[10px] ${f.confidence === "High" ? "status-chip-success" : f.confidence === "Medium" ? "status-chip-warning" : "status-chip-error"}`}>{f.confidence}</span>
                    </div>
                  ))}
                  {exceptions.length > 0 && (
                    <div className="mt-2 pt-2 border-t">
                      <p className="text-[10px] font-semibold text-destructive uppercase mb-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Exceptions</p>
                      {exceptions.map((ex, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{ex.field}: {ex.issue}</span>
                          <button onClick={() => sendExceptionToReview(t.name, ex.field)} className="text-[10px] text-secondary hover:underline">Send to Review</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Fee schedule specific CTA */}
              {t.id === "fee" && (
                <button onClick={() => navigate("/rates")} className="text-xs text-secondary hover:underline mb-3 text-left flex items-center gap-1">
                  <ArrowRight className="w-3 h-3" /> Preview extracted rates
                </button>
              )}

              {published[t.id] ? (
                <div className="flex items-center gap-2 text-sm text-success mt-auto">
                  <CheckCircle className="w-4 h-4" /> Published
                </div>
              ) : (
                <button
                  onClick={() => handlePublish(t.id, t.name)}
                  disabled={publishing[t.id]}
                  className="mt-auto w-full bg-primary text-primary-foreground py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
                >
                  {publishing[t.id] ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-3 h-3 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Publishing...
                    </span>
                  ) : "Publish"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
