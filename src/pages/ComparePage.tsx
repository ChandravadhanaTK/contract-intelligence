import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  GitCompare, ArrowLeft, FileDown, ChevronDown, ChevronUp,
  Check, CheckCheck, Plus, Minus, Pencil, Equal, Eye,
} from "lucide-react";
import { compareApi, getDocNameById, getAllDocOptions } from "@/services/compareService";
import { api } from "@/services/mockApi";
import type { CompareSession, ClauseDiff } from "@/types/compare";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  added: "bg-emerald-100 text-emerald-700",
  removed: "bg-red-100 text-red-700",
  modified: "bg-amber-100 text-amber-700",
  unchanged: "bg-muted text-muted-foreground",
};
const statusIcons: Record<string, typeof Plus> = {
  added: Plus, removed: Minus, modified: Pencil, unchanged: Equal,
};

function groupDiffs(diffs: ClauseDiff[]): { name: string; diffs: ClauseDiff[]; counts: { added: number; removed: number; modified: number } }[] {
  const map = new Map<string, ClauseDiff[]>();
  for (const d of diffs) {
    if (!map.has(d.groupName)) map.set(d.groupName, []);
    map.get(d.groupName)!.push(d);
  }
  return Array.from(map.entries()).map(([name, diffs]) => ({
    name,
    diffs,
    counts: {
      added: diffs.filter(d => d.status === "added").length,
      removed: diffs.filter(d => d.status === "removed").length,
      modified: diffs.filter(d => d.status === "modified").length,
    },
  }));
}

/* ── Side-by-side diff viewer ── */
function SideBySideDiffViewer({ diffs, reviewed, onAccept, onReview, selectedGroup }: {
  diffs: ClauseDiff[];
  reviewed: Set<string>;
  onAccept: (id: string, side: "A" | "B") => void;
  onReview: (id: string) => void;
  selectedGroup: string | null;
}) {
  const refs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (selectedGroup) {
      const first = diffs.find(d => d.groupName === selectedGroup);
      if (first && refs.current[first.id]) {
        refs.current[first.id]!.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [selectedGroup, diffs]);

  const filtered = selectedGroup ? diffs.filter(d => d.groupName === selectedGroup) : diffs;

  return (
    <div className="space-y-3">
      {filtered.map(diff => {
        const Icon = statusIcons[diff.status];
        const isReviewed = reviewed.has(diff.id);
        return (
          <div key={diff.id} ref={el => { refs.current[diff.id] = el; }} className={`border rounded-lg overflow-hidden ${isReviewed ? "border-emerald-300 bg-emerald-50/30" : "border-border"}`}>
            <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 border-b">
              <Icon className="w-3.5 h-3.5" />
              <span className="text-xs font-semibold flex-1">{diff.groupName} — {diff.clauseName}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${statusColors[diff.status]}`}>{diff.status}</span>
              {diff.citations?.map((c, i) => (
                <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-secondary/10 text-secondary font-medium">
                  §{c.sectionRef} • {c.pageRef}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-2 divide-x">
              <div className="p-3">
                <p className="text-[10px] font-semibold text-muted-foreground mb-1">Contract A</p>
                {diff.textA ? (
                  <p className={`text-xs leading-relaxed whitespace-pre-wrap ${diff.status === "added" ? "bg-emerald-100/50 rounded p-1" : diff.status === "modified" ? "" : ""}`}>
                    {diff.status === "modified" && <span className="bg-amber-100 rounded px-0.5">{diff.textA}</span>}
                    {diff.status !== "modified" && diff.textA}
                  </p>
                ) : <p className="text-xs text-muted-foreground italic">— Not present —</p>}
              </div>
              <div className="p-3">
                <p className="text-[10px] font-semibold text-muted-foreground mb-1">Contract B</p>
                {diff.textB ? (
                  <p className={`text-xs leading-relaxed whitespace-pre-wrap ${diff.status === "removed" ? "bg-red-100/50 line-through rounded p-1" : diff.status === "modified" ? "" : ""}`}>
                    {diff.status === "modified" && <span className="bg-amber-100 rounded px-0.5">{diff.textB}</span>}
                    {diff.status !== "modified" && diff.textB}
                  </p>
                ) : <p className="text-xs text-muted-foreground italic">— Not present —</p>}
              </div>
            </div>
            {diff.status !== "unchanged" && (
              <div className="flex items-center gap-2 px-4 py-2 border-t bg-muted/30">
                <button onClick={() => onAccept(diff.id, "A")} className="text-[10px] px-2 py-1 rounded border hover:bg-emerald-50 font-medium">Accept from A</button>
                <button onClick={() => onAccept(diff.id, "B")} className="text-[10px] px-2 py-1 rounded border hover:bg-blue-50 font-medium">Accept from B</button>
                <button onClick={() => onReview(diff.id)} className={`text-[10px] px-2 py-1 rounded border font-medium flex items-center gap-1 ${isReviewed ? "bg-emerald-100 text-emerald-700" : "hover:bg-muted"}`}>
                  <CheckCheck className="w-3 h-3" /> {isReviewed ? "Reviewed" : "Mark as Reviewed"}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Unified diff viewer ── */
function UnifiedDiffViewer({ diffs, selectedGroup, currentChangeIdx, onJumpTo }: {
  diffs: ClauseDiff[];
  selectedGroup: string | null;
  currentChangeIdx: number;
  onJumpTo: (idx: number) => void;
}) {
  const refs = useRef<Record<number, HTMLDivElement | null>>({});
  const filtered = selectedGroup ? diffs.filter(d => d.groupName === selectedGroup) : diffs;
  const changes = filtered.filter(d => d.status !== "unchanged");

  useEffect(() => {
    if (refs.current[currentChangeIdx]) {
      refs.current[currentChangeIdx]!.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [currentChangeIdx]);

  let changeCounter = -1;

  return (
    <div className="space-y-2">
      {filtered.map((diff, i) => {
        const isChange = diff.status !== "unchanged";
        if (isChange) changeCounter++;
        const myIdx = changeCounter;
        const isHighlighted = isChange && myIdx === currentChangeIdx;
        return (
          <div
            key={diff.id}
            ref={el => { if (isChange) refs.current[myIdx] = el; }}
            className={`rounded-lg border p-3 transition-all ${isHighlighted ? "ring-2 ring-primary border-primary" : "border-border"}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold text-muted-foreground">{diff.groupName}</span>
              <span className="text-[10px] text-muted-foreground">—</span>
              <span className="text-xs font-medium">{diff.clauseName}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ml-auto ${statusColors[diff.status]}`}>{diff.status}</span>
            </div>
            {diff.status === "unchanged" ? (
              <p className="text-xs text-muted-foreground leading-relaxed">{diff.textA}</p>
            ) : (
              <div className="text-xs leading-relaxed space-y-1">
                {diff.textB && <p className="bg-red-50 text-red-800 line-through rounded px-1 py-0.5">{diff.textB}</p>}
                {diff.textA && <p className="bg-emerald-50 text-emerald-800 rounded px-1 py-0.5">{diff.textA}</p>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function ComparePage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const allDocs = getAllDocOptions();
  const [contractAId, setContractAId] = useState(params.get("a") || allDocs[0]?.id || "");
  const [contractBId, setContractBId] = useState(params.get("b") || allDocs[3]?.id || "");
  const [mode, setMode] = useState<"sideBySide" | "unified">("sideBySide");
  const [session, setSession] = useState<CompareSession | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(params.get("group") || null);
  const [reviewed, setReviewed] = useState<Set<string>>(new Set());
  const [unifiedChangeIdx, setUnifiedChangeIdx] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadSession = async () => {
    if (!contractAId || !contractBId || contractAId === contractBId) return;
    setLoading(true);
    const s = await compareApi.getCompareSession(contractAId, contractBId);
    setSession(s);
    setReviewed(new Set(s.reviewedClauseIds));
    setLoading(false);
  };

  useEffect(() => { loadSession(); }, [contractAId, contractBId]);

  const groups = session ? groupDiffs(session.clauseDiffs) : [];

  const handleAccept = async (diffId: string, side: "A" | "B") => {
    toast.success(`Accepted clause from Contract ${side}`);
    await api.addAuditEntry({
      id: `audit-cmp-${Date.now()}`, timestamp: new Date().toISOString(),
      action: "Compare Accept", detail: `Accepted ${side} for clause ${diffId}`, actor: "Current User",
    });
  };

  const handleReview = async (diffId: string) => {
    setReviewed(prev => {
      const next = new Set(prev);
      if (next.has(diffId)) next.delete(diffId); else next.add(diffId);
      if (session) {
        session.reviewedClauseIds = Array.from(next);
        compareApi.saveCompareSession(session);
      }
      return next;
    });
  };

  const exportReport = async () => {
    if (!session) return;
    const nameA = getDocNameById(contractAId);
    const nameB = getDocNameById(contractBId);
    const lines = [
      "CONTRACT COMPARISON REPORT",
      "=".repeat(60),
      `Contract A: ${nameA}`,
      `Contract B: ${nameB}`,
      `Date: ${new Date().toISOString().slice(0, 10)}`,
      "",
      "SUMMARY",
      `  Added: ${session.summary.added}`,
      `  Removed: ${session.summary.removed}`,
      `  Modified: ${session.summary.modified}`,
      `  Unchanged: ${session.summary.unchanged}`,
      "",
      "CLAUSE-BY-CLAUSE CHANGES",
      "=".repeat(60),
    ];
    for (const diff of session.clauseDiffs) {
      lines.push("", `[${diff.status.toUpperCase()}] ${diff.groupName} — ${diff.clauseName}`);
      if (diff.citations?.length) lines.push(`  Reference: §${diff.citations[0].sectionRef} • ${diff.citations[0].pageRef}`);
      if (diff.textA) lines.push(`  Contract A: ${diff.textA}`);
      if (diff.textB) lines.push(`  Contract B: ${diff.textB}`);
    }
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "comparison_report.txt";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Comparison report exported");
    await api.addAuditEntry({
      id: `audit-export-${Date.now()}`, timestamp: new Date().toISOString(),
      action: "Compare Export", detail: `Exported comparison: ${nameA} vs ${nameB}`, actor: "Current User",
    });
  };

  const totalChanges = session ? session.clauseDiffs.filter(d => d.status !== "unchanged").length : 0;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Left: Clause Groups */}
      <div className="w-64 flex-shrink-0 border-r bg-card flex flex-col overflow-hidden">
        <div className="p-3 border-b">
          <div className="flex items-center gap-2 mb-2">
            <button onClick={() => navigate(-1)} className="p-1 hover:bg-muted rounded"><ArrowLeft className="w-4 h-4" /></button>
            <GitCompare className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold">Compare</span>
          </div>
        </div>

        {/* Selectors */}
        <div className="p-3 border-b space-y-2">
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground block mb-0.5">Contract A</label>
            <select value={contractAId} onChange={e => setContractAId(e.target.value)} className="w-full text-[11px] border rounded px-2 py-1.5 bg-background">
              {allDocs.map(d => <option key={d.id} value={d.id}>{d.name} ({d.family})</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground block mb-0.5">Contract B</label>
            <select value={contractBId} onChange={e => setContractBId(e.target.value)} className="w-full text-[11px] border rounded px-2 py-1.5 bg-background">
              {allDocs.map(d => <option key={d.id} value={d.id}>{d.name} ({d.family})</option>)}
            </select>
          </div>
        </div>

        {/* Groups */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <button onClick={() => setSelectedGroup(null)} className={`w-full text-left p-2 rounded text-xs font-medium ${!selectedGroup ? "bg-primary/10 text-primary" : "hover:bg-muted"}`}>
            All Clauses
          </button>
          {groups.map(g => (
            <button key={g.name} onClick={() => setSelectedGroup(g.name)} className={`w-full text-left p-2 rounded transition-colors ${selectedGroup === g.name ? "bg-primary/10 text-primary" : "hover:bg-muted"}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">{g.name}</span>
                <span className="text-[10px] text-muted-foreground">{g.diffs.length}</span>
              </div>
              <div className="flex gap-1.5 mt-1">
                {g.counts.added > 0 && <span className="text-[9px] px-1 rounded bg-emerald-100 text-emerald-700">+{g.counts.added}</span>}
                {g.counts.removed > 0 && <span className="text-[9px] px-1 rounded bg-red-100 text-red-700">-{g.counts.removed}</span>}
                {g.counts.modified > 0 && <span className="text-[9px] px-1 rounded bg-amber-100 text-amber-700">~{g.counts.modified}</span>}
                {g.counts.added === 0 && g.counts.removed === 0 && g.counts.modified === 0 && <span className="text-[9px] px-1 rounded bg-muted text-muted-foreground">unchanged</span>}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right: Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="p-3 border-b bg-card flex items-center gap-3 flex-wrap">
          {/* Summary chips */}
          {session && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] px-2 py-1 rounded bg-emerald-100 text-emerald-700 font-medium">Added: {session.summary.added}</span>
              <span className="text-[10px] px-2 py-1 rounded bg-red-100 text-red-700 font-medium">Removed: {session.summary.removed}</span>
              <span className="text-[10px] px-2 py-1 rounded bg-amber-100 text-amber-700 font-medium">Modified: {session.summary.modified}</span>
              <span className="text-[10px] px-2 py-1 rounded bg-muted text-muted-foreground font-medium">Unchanged: {session.summary.unchanged}</span>
            </div>
          )}
          <div className="ml-auto flex items-center gap-2">
            {/* Mode toggle */}
            <div className="flex border rounded-lg overflow-hidden">
              <button onClick={() => setMode("sideBySide")} className={`px-3 py-1.5 text-[11px] font-medium ${mode === "sideBySide" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}>Side-by-side</button>
              <button onClick={() => setMode("unified")} className={`px-3 py-1.5 text-[11px] font-medium ${mode === "unified" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}>Unified</button>
            </div>
            {mode === "unified" && totalChanges > 0 && (
              <div className="flex items-center gap-1">
                <button onClick={() => setUnifiedChangeIdx(Math.max(0, unifiedChangeIdx - 1))} className="p-1 border rounded hover:bg-muted"><ChevronUp className="w-3 h-3" /></button>
                <span className="text-[10px] font-medium">{unifiedChangeIdx + 1}/{totalChanges}</span>
                <button onClick={() => setUnifiedChangeIdx(Math.min(totalChanges - 1, unifiedChangeIdx + 1))} className="p-1 border rounded hover:bg-muted"><ChevronDown className="w-3 h-3" /></button>
              </div>
            )}
            <button onClick={exportReport} className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-medium border rounded-lg hover:bg-muted">
              <FileDown className="w-3.5 h-3.5" /> Export Report
            </button>
          </div>
        </div>

        {/* Diff area */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading && <p className="text-sm text-muted-foreground text-center mt-8">Loading comparison…</p>}
          {!loading && !session && <p className="text-sm text-muted-foreground text-center mt-8">Select two different contracts to compare.</p>}
          {!loading && session && contractAId === contractBId && <p className="text-sm text-muted-foreground text-center mt-8">Please select two different contracts.</p>}
          {!loading && session && contractAId !== contractBId && mode === "sideBySide" && (
            <SideBySideDiffViewer
              diffs={session.clauseDiffs}
              reviewed={reviewed}
              onAccept={handleAccept}
              onReview={handleReview}
              selectedGroup={selectedGroup}
            />
          )}
          {!loading && session && contractAId !== contractBId && mode === "unified" && (
            <UnifiedDiffViewer
              diffs={session.clauseDiffs}
              selectedGroup={selectedGroup}
              currentChangeIdx={unifiedChangeIdx}
              onJumpTo={setUnifiedChangeIdx}
            />
          )}
        </div>
      </div>
    </div>
  );
}
