import { useState, useEffect } from "react";
import { X, Search } from "lucide-react";
import { api } from "@/services/mockApi";
import type { StandardClause } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onInsert: (clause: StandardClause) => void;
}

export function ClauseInsertDialog({ open, onClose, onInsert }: Props) {
  const [clauses, setClauses] = useState<StandardClause[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (open) {
      api.getStandardClauses().then(setClauses);
    }
  }, [open]);

  if (!open) return null;

  const filtered = clauses.filter(c =>
    c.clauseName.toLowerCase().includes(search.toLowerCase()) ||
    c.tags.some(t => t.toLowerCase().includes(search.toLowerCase())) ||
    c.articleName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-foreground/20" onClick={onClose} />
      <div className="relative bg-card border rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-sm font-semibold">Insert from Standard Clauses Library</h3>
          <button onClick={onClose}><X className="w-4 h-4" /></button>
        </div>
        <div className="px-4 py-2 border-b">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              className="w-full border rounded-lg pl-9 pr-3 py-2 text-xs bg-background"
              placeholder="Search clauses by name, article, or tag..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filtered.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8">No clauses found.</p>
          )}
          {filtered.map(c => (
            <div key={c.id} className="border rounded-lg p-3 hover:bg-muted/50 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">{c.articleName}</p>
                  <p className="text-sm font-medium text-foreground">{c.clauseName}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{c.text}</p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {c.tags.map(t => (
                      <span key={t} className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full">{t}</span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => onInsert(c)}
                  className="flex-shrink-0 px-3 py-1.5 bg-secondary text-secondary-foreground rounded text-xs font-medium hover:opacity-90"
                >
                  Insert
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
