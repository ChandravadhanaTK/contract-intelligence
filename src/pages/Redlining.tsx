import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "@/services/mockApi";
import { toast } from "sonner";
import type { RedlineClauseGroup, RedlineChange, RedlineDocument } from "@/data/seed";
import { Check, X, FileDown, Columns, AlignJustify, ChevronDown, FileText } from "lucide-react";

const changeColors = {
  added: { bg: "bg-emerald-50", border: "border-emerald-300", text: "text-emerald-800" },
  removed: { bg: "bg-red-50", border: "border-red-300", text: "text-red-800 line-through" },
  modified: { bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-900" },
};

export default function Redlining() {
  const [searchParams] = useSearchParams();
  const [documents, setDocuments] = useState<RedlineDocument[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [allGroups, setAllGroups] = useState<RedlineClauseGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"side-by-side" | "unified">("side-by-side");
  const [docDropdownOpen, setDocDropdownOpen] = useState(false);

  useEffect(() => {
    Promise.all([api.getRedlineDocuments(), api.getRedlineGroups()]).then(([docs, groups]) => {
      setDocuments(docs);
      setAllGroups(groups);
      if (docs.length > 0) {
        setSelectedDocId(docs[0].id);
        const docGroups = groups.filter(g => g.documentId === docs[0].id);
        if (docGroups.length > 0) setSelectedGroupId(docGroups[0].id);
      }
    });
  }, []);

  // When document changes, auto-select first clause group & scroll to matching section from URL
  useEffect(() => {
    if (!selectedDocId) return;
    const docGroups = allGroups.filter(g => g.documentId === selectedDocId);
    const sectionParam = searchParams.get("section");
    if (sectionParam) {
      const match = docGroups.find(g => g.name.toLowerCase() === sectionParam.toLowerCase());
      setSelectedGroupId(match ? match.id : docGroups[0]?.id ?? null);
    } else {
      setSelectedGroupId(docGroups[0]?.id ?? null);
    }
  }, [selectedDocId, allGroups, searchParams]);

  const filteredGroups = allGroups.filter(g => g.documentId === selectedDocId);
  const selectedGroup = allGroups.find(g => g.id === selectedGroupId);
  const selectedDoc = documents.find(d => d.id === selectedDocId);

  const totalChanges = filteredGroups.reduce((sum, g) => sum + g.changes.length, 0);
  const totalAdded = filteredGroups.reduce((sum, g) => sum + g.added, 0);
  const totalRemoved = filteredGroups.reduce((sum, g) => sum + g.removed, 0);
  const totalModified = filteredGroups.reduce((sum, g) => sum + g.modified, 0);

  const handleChangeStatus = async (changeId: string, newStatus: "accepted" | "rejected") => {
    const updated = allGroups.map(g => ({
      ...g,
      changes: g.changes.map(c => c.id === changeId ? { ...c, status: newStatus } : c),
    }));
    setAllGroups(updated);
    await api.saveRedlineGroups(updated);
    toast.success(newStatus === "accepted" ? "Change accepted" : "Change rejected");
  };

  return (
    <div className="page-container">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="page-header">Redlining</h1>
        <div className="flex items-center gap-2">
          <div className="flex border rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("side-by-side")}
              className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1 ${viewMode === "side-by-side" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
            >
              <Columns className="w-3.5 h-3.5" /> Side-by-side
            </button>
            <button
              onClick={() => setViewMode("unified")}
              className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1 ${viewMode === "unified" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
            >
              <AlignJustify className="w-3.5 h-3.5" /> Unified
            </button>
          </div>
          <button className="px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 flex items-center gap-1.5">
            <FileDown className="w-3.5 h-3.5" /> Export Report
          </button>
        </div>
      </div>

      {/* Document Selector */}
      <div className="bg-card border rounded-lg p-3 flex items-center gap-4 flex-wrap">
        <div className="relative">
          <button
            onClick={() => setDocDropdownOpen(!docDropdownOpen)}
            className="flex items-center gap-2 px-3 py-2 border rounded-lg bg-background hover:bg-muted text-sm font-medium min-w-[320px] justify-between"
          >
            <span className="flex items-center gap-2 truncate">
              <FileText className="w-4 h-4 text-primary flex-shrink-0" />
              {selectedDoc?.name ?? "Select a document"}
            </span>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${docDropdownOpen ? "rotate-180" : ""}`} />
          </button>
          {docDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-full bg-popover border rounded-lg shadow-lg z-50 overflow-hidden">
              {documents.map(doc => {
                const docGroupCount = allGroups.filter(g => g.documentId === doc.id).length;
                const docChangeCount = allGroups.filter(g => g.documentId === doc.id).reduce((s, g) => s + g.changes.length, 0);
                return (
                  <button
                    key={doc.id}
                    onClick={() => { setSelectedDocId(doc.id); setDocDropdownOpen(false); }}
                    className={`w-full text-left px-3 py-2.5 hover:bg-muted/50 transition-colors flex items-center justify-between ${
                      selectedDocId === doc.id ? "bg-accent" : ""
                    }`}
                  >
                    <span className="flex items-center gap-2 text-sm">
                      <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="truncate">{doc.name}</span>
                    </span>
                    <span className="text-[10px] text-muted-foreground flex-shrink-0 ml-2">
                      {docGroupCount} sections • {docChangeCount} changes
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Summary chips */}
        <div className="flex items-center gap-3 text-xs">
          <span className="px-2 py-1 rounded bg-muted text-muted-foreground font-medium">{totalChanges} total changes</span>
          <span className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 font-medium">+{totalAdded} added</span>
          <span className="px-2 py-1 rounded bg-red-50 text-red-700 font-medium">-{totalRemoved} removed</span>
          <span className="px-2 py-1 rounded bg-amber-50 text-amber-700 font-medium">{totalModified} modified</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: Clause groups for selected document */}
        <div className="bg-card border rounded-lg overflow-hidden">
          <div className="p-3 border-b bg-muted/50">
            <h3 className="text-sm font-semibold">Document Sections</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">{filteredGroups.length} clause groups</p>
          </div>
          <div className="divide-y">
            {filteredGroups.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">No redline sections for this document</div>
            ) : (
              filteredGroups.map(g => (
                <button
                  key={g.id}
                  onClick={() => setSelectedGroupId(g.id)}
                  className={`w-full text-left p-3 hover:bg-muted/30 transition-colors ${selectedGroupId === g.id ? "bg-accent" : ""}`}
                >
                  <p className="text-sm font-medium">{g.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    <span className="text-emerald-600">+{g.added} added</span>
                    {" • "}
                    <span className="text-red-600">-{g.removed} removed</span>
                    {" • "}
                    <span className="text-amber-600">{g.modified} modified</span>
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right: Changes */}
        <div className="lg:col-span-3 space-y-4">
          {!selectedGroup ? (
            <div className="bg-card border rounded-lg p-8 text-center text-muted-foreground">Select a clause group</div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold">{selectedGroup.name}</h2>
                <span className="text-xs text-muted-foreground">{selectedGroup.changes.length} changes</span>
              </div>

              {selectedGroup.changes.map(change => (
                <div key={change.id} className="bg-card border rounded-lg overflow-hidden">
                  {viewMode === "side-by-side" ? (
                    <div className="grid grid-cols-2 divide-x">
                      <div className="p-4">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-2">Original</p>
                        {change.originalText ? (
                          <p className={`text-sm leading-relaxed ${change.type === "removed" ? "text-red-800 line-through bg-red-50 p-2 rounded" : ""}`}>
                            {change.originalText}
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">No original text</p>
                        )}
                      </div>
                      <div className="p-4">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-2">Proposed</p>
                        {change.proposedText ? (
                          <p className={`text-sm leading-relaxed ${change.type === "added" ? "text-emerald-800 bg-emerald-50 p-2 rounded" : change.type === "modified" ? "text-amber-900 bg-amber-50 p-2 rounded" : ""}`}>
                            {change.proposedText}
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">Removed</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 space-y-2">
                      {change.originalText && (
                        <p className="text-sm leading-relaxed text-red-800 line-through bg-red-50 p-2 rounded">{change.originalText}</p>
                      )}
                      {change.proposedText && (
                        <p className="text-sm leading-relaxed text-emerald-800 bg-emerald-50 p-2 rounded">{change.proposedText}</p>
                      )}
                    </div>
                  )}

                  <div className="px-4 py-2 border-t bg-muted/30 flex items-center gap-2">
                    <span className={`status-chip ${
                      change.status === "accepted" ? "status-chip-success" :
                      change.status === "rejected" ? "status-chip-error" :
                      "status-chip-info"
                    }`}>{change.status}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${changeColors[change.type].bg} ${changeColors[change.type].text}`}>{change.type}</span>
                    <div className="ml-auto flex gap-1.5">
                      <button
                        onClick={() => handleChangeStatus(change.id, "accepted")}
                        className="px-2.5 py-1 text-xs bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 flex items-center gap-1"
                        disabled={change.status === "accepted"}
                      >
                        <Check className="w-3 h-3" /> Accept
                      </button>
                      <button
                        onClick={() => handleChangeStatus(change.id, "rejected")}
                        className="px-2.5 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 flex items-center gap-1"
                        disabled={change.status === "rejected"}
                      >
                        <X className="w-3 h-3" /> Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
