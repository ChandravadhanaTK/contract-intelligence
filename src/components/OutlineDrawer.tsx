import { X } from "lucide-react";
import type { ContractDraftDocument } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  document: ContractDraftDocument | null;
  onJumpToSection?: (sectionRef: string) => void;
}

export function OutlineDrawer({ open, onClose, document, onJumpToSection }: Props) {
  if (!open || !document) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-80 bg-card border-l shadow-xl flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-sm font-semibold">Document Outline</h3>
        <button onClick={onClose}><X className="w-4 h-4" /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {document.sections.map((sec, i) => (
          <button
            key={sec.id}
            onClick={() => onJumpToSection?.(sec.headingNumber)}
            className="w-full text-left px-3 py-2 rounded-md hover:bg-muted/50 transition-colors"
          >
            <span className="text-xs font-medium text-primary">{sec.headingNumber}</span>
            <span className="text-xs text-foreground ml-2">{sec.title}</span>
            <span className="text-[10px] text-muted-foreground ml-2">Page {Math.max(1, Math.ceil((i + 1) * 1.8))}</span>
          </button>
        ))}
        {document.exhibits.length > 0 && (
          <>
            <div className="pt-3 pb-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Exhibits</p>
            </div>
            {document.exhibits.map(ex => (
              <div key={ex.id} className="px-3 py-1.5">
                <span className="text-xs text-foreground">{ex.name}</span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
