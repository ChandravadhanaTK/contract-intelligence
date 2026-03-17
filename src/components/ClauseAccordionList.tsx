import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { Clause } from "@/types";

interface Props {
  title: string;
  clauses: Clause[];
  color: "red" | "green" | "yellow";
  onClauseClick?: (clause: Clause) => void;
}

const dotColor = { red: "bg-destructive", green: "bg-success", yellow: "bg-warning" };

export function ClauseAccordionList({ title, clauses, color, onClauseClick }: Props) {
  const [open, setOpen] = useState(true);

  return (
    <div className="border rounded-lg bg-card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
      >
        {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        <span className={`w-2.5 h-2.5 rounded-full ${dotColor[color]}`} />
        <span className="font-semibold text-sm">{title}</span>
        <span className="text-xs text-muted-foreground ml-auto">{clauses.length} clauses</span>
      </button>
      {open && (
        <div className="border-t divide-y">
          {clauses.map((c) => (
            <button
              key={c.id}
              onClick={() => onClauseClick?.(c)}
              className="w-full text-left px-4 py-2.5 hover:bg-muted/30 transition-colors flex items-center gap-3"
            >
              <span className={`w-2 h-2 rounded-full ${dotColor[color]} flex-shrink-0`} />
              <div className="min-w-0">
                <span className="text-xs text-muted-foreground">{c.articleName}</span>
                <p className="text-sm font-medium truncate">{c.clauseName}</p>
              </div>
              {c.matchScore > 0 && (
                <span className="ml-auto text-xs text-muted-foreground flex-shrink-0">{c.matchScore}/5</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
