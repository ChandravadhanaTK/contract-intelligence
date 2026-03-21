import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText, Search, ChevronRight, ChevronDown, Eye, GitCompare, FileDown,
  FolderOpen, X,
} from "lucide-react";
import { api } from "@/services/mockApi";
import type { ContractFamily } from "@/data/seed";
import { toast } from "sonner";

const statusChip: Record<string, string> = {
  Active: "bg-emerald-100 text-emerald-700",
  Expired: "bg-red-100 text-red-700",
  "Pending Review": "bg-amber-100 text-amber-700",
  "Under Review": "bg-amber-100 text-amber-700",
  Draft: "bg-blue-100 text-blue-700",
};
const typeChip: Record<string, string> = {
  MSA: "bg-primary/10 text-primary",
  BAA: "bg-secondary/10 text-secondary",
  SOW: "bg-emerald-100 text-emerald-700",
  Amendment: "bg-amber-100 text-amber-700",
};

// Deterministic version & compliance per doc id
const docVersions: Record<string, string> = {
  "fd-1": "v3.2", "fd-2": "v2.1", "fd-3": "v1.4", "fd-4": "v3.0",
  "fd-5": "v2.0", "fd-6": "v1.1", "fd-7": "v0.3", "fd-8": "v1.8",
  "fd-9": "v2.0", "fd-10": "v1.2", "fd-11": "v4.0", "fd-12": "v3.1",
  "fd-13": "v0.5", "fd-14": "v0.2",
};

const docCompliance: Record<string, number> = {
  "fd-1": 87, "fd-2": 100, "fd-3": 65, "fd-4": 92,
  "fd-5": 78, "fd-6": 95, "fd-7": 45, "fd-8": 72,
  "fd-9": 100, "fd-10": 68, "fd-11": 42, "fd-12": 55,
  "fd-13": 35, "fd-14": 40,
};

type SortBy = "Recent" | "Name" | "Docs";

/* ── Compare Modal ── */
function CompareModal({ open, onClose, sourceDoc, allDocs }: {
  open: boolean;
  onClose: () => void;
  sourceDoc: { id: string; name: string } | null;
  allDocs: { id: string; name: string; familyName: string }[];
}) {
  const [targetId, setTargetId] = useState("");
  const navigate = useNavigate();

  if (!open || !sourceDoc) return null;

  const otherDocs = allDocs.filter(d => d.id !== sourceDoc.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-card border rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4 z-10">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-bold">Compare Contracts</h2>
          <button onClick={onClose}><X className="w-4 h-4" /></button>
        </div>
        <div>
          <label className="text-xs font-medium block mb-1">Source Document</label>
          <div className="border rounded-lg px-3 py-2 text-sm bg-muted/50">{sourceDoc.name}</div>
        </div>
        <div>
          <label className="text-xs font-medium block mb-1">Compare With</label>
          <select value={targetId} onChange={e => setTargetId(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm bg-background">
            <option value="">Select a contract...</option>
            {otherDocs.map(d => (
              <option key={d.id} value={d.id}>{d.name} ({d.familyName})</option>
            ))}
          </select>
        </div>
        <button
          disabled={!targetId}
          onClick={() => {
            onClose();
            navigate(`/compare?a=${sourceDoc.id}&b=${targetId}`);
          }}
          className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          Open Comparison
        </button>
      </div>
    </div>
  );
}

function exportContractDoc(docName: string) {
  const content = [
    `CONTRACT DOCUMENT EXPORT`,
    `Document: ${docName}`,
    `Exported: ${new Date().toISOString().slice(0, 10)}`,
    `=`.repeat(60),
    ``,
    `This is an exported summary of the contract document.`,
    `Full document contents would be included in a production system.`,
    ``,
    `--- END OF EXPORT ---`,
  ].join("\n");

  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${docName.replace(/\s+/g, "_")}_export.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast.success(`Exported: ${docName}`);
}

export default function ContractsPage() {
  const [families, setFamilies] = useState<ContractFamily[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [jurisdictionFilter, setJurisdictionFilter] = useState("All Jurisdictions");
  const [sortBy, setSortBy] = useState<SortBy>("Recent");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [compareDoc, setCompareDoc] = useState<{ id: string; name: string } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.getContractFamilies(statusFilter, search, jurisdictionFilter).then(fams => {
      let sorted = [...fams];
      if (sortBy === "Name") sorted.sort((a, b) => a.name.localeCompare(b.name));
      else if (sortBy === "Docs") sorted.sort((a, b) => b.documents.length - a.documents.length);
      else sorted.sort((a, b) => b.lastActivity.localeCompare(a.lastActivity));
      setFamilies(sorted);
    });
  }, [search, statusFilter, jurisdictionFilter, sortBy]);

  const totalFamilies = families.length;
  const totalDocs = families.reduce((a, f) => a + f.documents.length, 0);

  const allDocs = families.flatMap(f => f.documents.map(d => ({ ...d, familyName: f.name.split("—")[0].trim() })));

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div className="page-container">
      <h1 className="page-header">Contracts</h1>
      <p className="text-sm text-muted-foreground">{totalFamilies} Contract Families • {totalDocs} Total Documents</p>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap mt-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input className="w-full pl-8 pr-3 py-2 text-sm border rounded-lg bg-background" placeholder="Search families, contracts, tags…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="text-sm border rounded-lg px-3 py-2 bg-background">
          <option>All Statuses</option>
          <option>Active</option>
          <option>Expired</option>
          <option>Pending Review</option>
          <option>Draft</option>
        </select>
        <select className="text-sm border rounded-lg px-3 py-2 bg-background">
          <option>All Jurisdictions</option>
          <option>NY</option>
          <option>FL</option>
          <option>CA</option>
          <option>OH</option>
          <option>TX</option>
          <option>Multi-State</option>
        </select>
        <div className="ml-auto flex border rounded-lg overflow-hidden">
          {(["Recent", "Name", "Docs"] as SortBy[]).map(s => (
            <button key={s} onClick={() => setSortBy(s)} className={`px-3 py-1.5 text-xs font-medium ${sortBy === s ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Families accordion */}
      <div className="space-y-3 mt-4">
        {families.map(fam => {
          const isExpanded = expandedIds.has(fam.id);
          return (
            <div key={fam.id} className="bg-card border rounded-lg overflow-hidden">
              <button
                onClick={() => toggleExpand(fam.id)}
                className="w-full text-left p-4 flex items-center gap-3 hover:bg-muted/30 transition-colors"
              >
                {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                <FolderOpen className="w-4 h-4 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{fam.name}</p>
                  <p className="text-xs text-muted-foreground">{fam.documents.length} documents • {fam.jurisdiction} • Last activity: {fam.lastActivity}</p>
                </div>
                <span className={`status-chip ${statusChip[fam.status]}`}>{fam.status}</span>
              </button>

              {isExpanded && (
                <div className="border-t divide-y">
                  {fam.documents.map(doc => {
                    const version = docVersions[doc.id] || "v1.0";
                    const compliance = docCompliance[doc.id] || 0;
                    return (
                      <div key={doc.id} className="px-6 py-3 flex items-center gap-3 hover:bg-muted/20 transition-colors">
                        <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground">{doc.name}</p>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${typeChip[doc.type]}`}>{doc.type}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">{version}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {doc.tags.map(t => (
                              <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{t}</span>
                            ))}
                          </div>
                        </div>
                        {/* Compliance % */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <div className="w-10 bg-muted rounded-full h-1.5">
                            <div className={`h-1.5 rounded-full ${compliance >= 80 ? "bg-emerald-500" : compliance >= 60 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${compliance}%` }} />
                          </div>
                          <span className="text-[10px] font-medium text-muted-foreground w-8">{compliance}%</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{doc.lastActivity}</span>
                        <span className={`status-chip ${statusChip[doc.status]}`}>{doc.status}</span>
                        <div className="flex items-center gap-1">
                          <button className="p-1.5 hover:bg-muted rounded" title="View" onClick={() => navigate(`/contracts/${doc.id}`)}>
                            <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                          <button className="p-1.5 hover:bg-muted rounded" title="Compare" onClick={() => setCompareDoc({ id: doc.id, name: doc.name })}>
                            <GitCompare className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                          <button className="p-1.5 hover:bg-muted rounded" title="Export" onClick={() => exportContractDoc(doc.name)}>
                            <FileDown className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <CompareModal
        open={!!compareDoc}
        onClose={() => setCompareDoc(null)}
        sourceDoc={compareDoc}
        allDocs={allDocs}
      />
    </div>
  );
}
