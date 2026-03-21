import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  FileText, Search, ChevronRight, ChevronDown, Eye, GitCompare, FileDown,
  FolderOpen, ScanLine, FilePlus, Upload, Bell, ScrollText,
} from "lucide-react";
import { api } from "@/services/mockApi";
import type { ContractFamily } from "@/data/seed";
import ContractCreation from "./ContractCreation";
import DigitizationPage from "./DigitizationPage";
import UploadContract from "./UploadContract";
import { AuditLogDrawer } from "@/components/AuditLogDrawer";

/* ── status / type chip maps ── */
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

type SortBy = "Recent" | "Name" | "Docs";
type TabId = "contracts" | "digitize" | "creation" | "upload" | "notifications" | "audit";

const tabs: { id: TabId; label: string; icon: React.ElementType; iconOnly?: boolean }[] = [
  { id: "contracts", label: "Contracts", icon: FolderOpen },
  { id: "digitize", label: "Digitize Legacy", icon: ScanLine },
  { id: "creation", label: "Contract Creation", icon: FilePlus },
  { id: "upload", label: "Upload Contracts", icon: Upload },
  { id: "notifications", label: "Notifications", icon: Bell, iconOnly: true },
  { id: "audit", label: "Audit Log", icon: ScrollText, iconOnly: true },
];

/* ── Notifications panel (simple deterministic) ── */
const seedNotifications = [
  { id: "n1", text: "BAA Compliance Certification due in 3 days", time: "2h ago", read: false },
  { id: "n2", text: "BlueCross MSA renewal submitted for review", time: "5h ago", read: false },
  { id: "n3", text: "Digitization completed for Aetna Fee Schedule", time: "1d ago", read: true },
  { id: "n4", text: "SLA review requested by Legal team", time: "1d ago", read: true },
  { id: "n5", text: "New amendment uploaded for UnitedHealth SOW", time: "2d ago", read: true },
];

function NotificationsPanel() {
  return (
    <div className="page-container">
      <h2 className="text-lg font-semibold text-foreground mb-4">Notifications</h2>
      <div className="space-y-2">
        {seedNotifications.map(n => (
          <div key={n.id} className={`bg-card border rounded-lg p-4 flex items-start gap-3 ${!n.read ? "border-primary/30 bg-primary/5" : ""}`}>
            <Bell className={`w-4 h-4 mt-0.5 flex-shrink-0 ${!n.read ? "text-primary" : "text-muted-foreground"}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground">{n.text}</p>
              <p className="text-xs text-muted-foreground mt-1">{n.time}</p>
            </div>
            {!n.read && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Contracts Repository (existing list) ── */
function ContractsRepository() {
  const [families, setFamilies] = useState<ContractFamily[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [sortBy, setSortBy] = useState<SortBy>("Recent");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    api.getContractFamilies(statusFilter, search).then(fams => {
      let sorted = [...fams];
      if (sortBy === "Name") sorted.sort((a, b) => a.name.localeCompare(b.name));
      else if (sortBy === "Docs") sorted.sort((a, b) => b.documents.length - a.documents.length);
      else sorted.sort((a, b) => b.lastActivity.localeCompare(a.lastActivity));
      setFamilies(sorted);
    });
  }, [search, statusFilter, sortBy]);

  const totalFamilies = families.length;
  const totalDocs = families.reduce((a, f) => a + f.documents.length, 0);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{totalFamilies} contract families • {totalDocs} total documents</p>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
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
      <div className="space-y-3">
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
                  {fam.documents.map(doc => (
                    <div key={doc.id} className="px-6 py-3 flex items-center gap-3 hover:bg-muted/20 transition-colors">
                      <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground">{doc.name}</p>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${typeChip[doc.type]}`}>{doc.type}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {doc.tags.map(t => (
                            <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{t}</span>
                          ))}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">{doc.lastActivity}</span>
                      <span className={`status-chip ${statusChip[doc.status]}`}>{doc.status}</span>
                      <div className="flex items-center gap-1">
                        <button className="p-1.5 hover:bg-muted rounded" title="View" onClick={() => navigate(`/contracts/${doc.id}`)}>
                          <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                        <button className="p-1.5 hover:bg-muted rounded" title="Compare">
                          <GitCompare className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                        <button className="p-1.5 hover:bg-muted rounded" title="Export">
                          <FileDown className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Audit Log tab (inline version) ── */
function AuditLogTab() {
  const [entries, setEntries] = useState<any[]>([]);
  useEffect(() => { api.getAuditLog().then(setEntries); }, []);
  return (
    <div className="page-container">
      <h2 className="text-lg font-semibold text-foreground mb-4">Audit Log</h2>
      <div className="space-y-3">
        {entries.length === 0 && <p className="text-sm text-muted-foreground">No entries yet.</p>}
        {entries.map((e: any) => (
          <div key={e.id} className="bg-card border rounded-lg p-4">
            <div className="flex justify-between items-start mb-1">
              <span className="text-sm font-medium text-foreground">{e.action}</span>
              <span className="text-xs text-muted-foreground">{new Date(e.timestamp).toLocaleString()}</span>
            </div>
            <p className="text-xs text-muted-foreground">{e.detail}</p>
            <p className="text-xs text-muted-foreground mt-1">By: {e.actor}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main ContractsPage ── */
export default function ContractsPage() {
  return (
    <div className="page-container">
      <h1 className="page-header">Contracts</h1>
      <ContractsRepository />
    </div>
  );
}
