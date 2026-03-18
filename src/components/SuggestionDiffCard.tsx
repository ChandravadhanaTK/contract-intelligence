import { Check, X, Pencil } from "lucide-react";
import type { CoAuthorAction } from "@/types";

interface Props {
  action: CoAuthorAction;
  onApply: () => void;
  onReject: () => void;
}

export function SuggestionDiffCard({ action, onApply, onReject }: Props) {
  if (action.type !== "update_section" && action.type !== "replace_text") return null;
  if (!action.oldText && !action.newText) return null;

  return (
    <div className="border rounded-lg overflow-hidden mt-2 text-xs">
      <div className="bg-muted/50 px-3 py-1.5 flex items-center gap-2 border-b">
        <Pencil className="w-3 h-3 text-muted-foreground" />
        <span className="font-medium text-foreground">Suggested Change — {action.sectionRef || "Section"}</span>
      </div>
      {action.oldText && (
        <div className="px-3 py-2 bg-destructive/5 border-l-2 border-destructive">
          <p className="text-[10px] font-semibold text-muted-foreground mb-1">Before:</p>
          <p className="text-foreground line-through whitespace-pre-wrap">{action.oldText.substring(0, 300)}{action.oldText.length > 300 ? "..." : ""}</p>
        </div>
      )}
      {action.newText && (
        <div className="px-3 py-2 bg-emerald-50 border-l-2 border-emerald-500 dark:bg-emerald-950/20">
          <p className="text-[10px] font-semibold text-muted-foreground mb-1">After:</p>
          <p className="text-foreground whitespace-pre-wrap">{action.newText.substring(0, 300)}{action.newText.length > 300 ? "..." : ""}</p>
        </div>
      )}
      <div className="flex gap-2 p-2 bg-muted/30">
        <button onClick={onApply} className="flex items-center gap-1 px-3 py-1 bg-primary text-primary-foreground rounded text-[11px] font-medium hover:opacity-90">
          <Check className="w-3 h-3" /> Apply
        </button>
        <button onClick={onReject} className="flex items-center gap-1 px-3 py-1 border rounded text-[11px] font-medium hover:bg-muted">
          <X className="w-3 h-3" /> Reject
        </button>
      </div>
    </div>
  );
}
