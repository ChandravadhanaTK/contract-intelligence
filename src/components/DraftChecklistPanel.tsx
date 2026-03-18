import { CheckCircle, Circle } from "lucide-react";
import type { ChecklistItem } from "@/services/coAuthorAgent";

interface Props {
  items: ChecklistItem[];
}

export function DraftChecklistPanel({ items }: Props) {
  const doneCount = items.filter(i => i.done).length;

  return (
    <div className="bg-card border rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-semibold text-foreground">Draft Checklist</h4>
        <span className="text-[10px] font-medium text-muted-foreground">{doneCount}/{items.length}</span>
      </div>
      <div className="w-full bg-muted rounded-full h-1.5 mb-3">
        <div
          className="h-1.5 rounded-full bg-secondary transition-all duration-300"
          style={{ width: `${items.length > 0 ? (doneCount / items.length) * 100 : 0}%` }}
        />
      </div>
      <div className="space-y-1.5">
        {items.map(item => (
          <div key={item.id} className="flex items-center gap-2">
            {item.done ? (
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
            ) : (
              <Circle className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            )}
            <span className={`text-xs ${item.done ? "text-foreground" : "text-muted-foreground"}`}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
