import { useState } from "react";
import { Eye, Pencil, RefreshCw, Download, Copy, Send, X } from "lucide-react";
import { toast } from "sonner";
import type { ContractDraftDocument } from "@/types";

interface Props {
  document: ContractDraftDocument;
  onRegenerate: () => void;
  onSendToRedlining: () => void;
  onUpdateSections: (sections: ContractDraftDocument["sections"]) => void;
  onClose?: () => void;
}

export function ContractDocumentPreview({ document, onRegenerate, onSendToRedlining, onUpdateSections, onClose }: Props) {
  const [editMode, setEditMode] = useState(true);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");

  const handleCopy = () => {
    navigator.clipboard.writeText(document.renderedText);
    toast.success("Document copied to clipboard");
  };

  const handlePrint = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<html><head><title>${document.title}</title><style>
      body { font-family: 'Inter', Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; color: #1a1a1a; }
      h1 { color: #002677; border-bottom: 3px solid #FF612B; padding-bottom: 10px; }
      h2 { color: #002677; margin-top: 28px; }
      hr { border: none; border-top: 1px solid #e5e7eb; margin: 24px 0; }
      strong { color: #002677; }
    </style></head><body>`);
    w.document.write(document.renderedText.replace(/\n/g, "<br>").replace(/#{1,3}\s(.+)/g, (_, t) => `<h2>${t}</h2>`).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>"));
    w.document.write("</body></html>");
    w.document.close();
    w.print();
  };

  const startEdit = (secId: string, body: string) => {
    setEditingSectionId(secId);
    setEditBody(body);
  };

  const saveEdit = () => {
    if (!editingSectionId) return;
    const updated = document.sections.map(s => s.id === editingSectionId ? { ...s, body: editBody } : s);
    onUpdateSections(updated);
    setEditingSectionId(null);
    toast.success("Section updated");
  };

  return (
    <div className="bg-card border rounded-xl">
      <div className="flex items-center justify-between p-4 border-b flex-wrap gap-2">
        <h3 className="text-sm font-semibold text-foreground">Generated Provider Contract Document (Optum Standard)</h3>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setEditMode(!editMode)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border ${editMode ? "bg-secondary text-secondary-foreground" : "bg-background hover:bg-muted"}`}>
            {editMode ? <><Pencil className="w-3 h-3" /> Edit Mode</> : <><Eye className="w-3 h-3" /> Preview</>}
          </button>
          <button onClick={onRegenerate} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border bg-background hover:bg-muted">
            <RefreshCw className="w-3 h-3" /> Regenerate
          </button>
          <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border bg-background hover:bg-muted">
            <Download className="w-3 h-3" /> Print / PDF
          </button>
          <button onClick={handleCopy} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border bg-background hover:bg-muted">
            <Copy className="w-3 h-3" /> Copy
          </button>
          <button onClick={onSendToRedlining} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-primary text-primary-foreground">
            <Send className="w-3 h-3" /> Send to Redlining
          </button>
          {onClose && (
            <button onClick={onClose} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border bg-background hover:bg-destructive hover:text-destructive-foreground transition-colors">
              <X className="w-3 h-3" /> Close
            </button>
          )}
        </div>
      </div>

      <div className="p-6 max-h-[600px] overflow-y-auto bg-white">
        <div className="max-w-[700px] mx-auto px-12 py-8" style={{ fontFamily: "'Times New Roman', Georgia, serif" }}>
          {/* Document title — Optum Provider Agreement style */}
          <h1 className="text-center font-bold text-sm text-foreground mb-6 uppercase tracking-wide leading-snug">
            OPTUMHEALTH CARE SOLUTIONS, LLC<br />PROVIDER AGREEMENT
          </h1>

          <p className="text-[13px] text-foreground leading-[1.7] text-justify mb-6">
            THIS AGREEMENT ("Agreement") is entered into by and between OptumHealth Care Solutions, LLC. ("Optum") and the undersigned Provider, and sets forth the terms and conditions under which Provider shall participate in one or more networks developed by Optum to render Covered Services to Members.
          </p>

          <hr className="border-muted my-6" />

          {document.sections.map((sec, i) => (
            <div key={sec.id} className="mb-6" data-section={sec.headingNumber}>
              {/* Section header — centered bold like the real document */}
              <div className="text-center mb-3 mt-6">
                <p className="font-bold text-sm text-foreground uppercase tracking-wide">SECTION {sec.headingNumber}</p>
                <p className="font-bold text-sm text-foreground">{sec.title}</p>
              </div>

              {editMode && editingSectionId === sec.id ? (
                <div className="space-y-2">
                  <textarea className="w-full border rounded-lg px-3 py-2 text-sm bg-background min-h-[120px] resize-y" style={{ fontFamily: "'Times New Roman', Georgia, serif" }} value={editBody} onChange={e => setEditBody(e.target.value)} />
                  <div className="flex gap-2">
                    <button onClick={saveEdit} className="px-3 py-1 bg-primary text-primary-foreground rounded text-xs font-medium">Save</button>
                    <button onClick={() => setEditingSectionId(null)} className="px-3 py-1 border rounded text-xs font-medium">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="relative group">
                  <div className="text-[13px] text-foreground whitespace-pre-wrap leading-[1.7] text-justify">{sec.body}</div>
                  {editMode && (
                    <button onClick={() => startEdit(sec.id, sec.body)} className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 p-1 bg-muted rounded text-xs">
                      <Pencil className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Exhibits */}
          <div className="text-center mb-3 mt-8">
            <p className="font-bold text-sm text-foreground uppercase tracking-wide">EXHIBITS AND APPENDICES</p>
          </div>
          <ul className="text-[13px] space-y-2 text-foreground leading-[1.7]" style={{ fontFamily: "'Times New Roman', Georgia, serif" }}>
            {document.exhibits.map(ex => (
              <li key={ex.id}><strong>{ex.name}:</strong> {ex.description}{ex.required ? " (Required)" : ""}</li>
            ))}
          </ul>

          {/* Footer — matching the Optum document style */}
          <div className="mt-12 pt-4 border-t border-muted flex items-center justify-between text-[10px] text-muted-foreground" style={{ fontFamily: "'Arial', sans-serif" }}>
            <span>OHCS-PhysHealthProviderAgmt(v2011) (2)</span>
            <span>Version {document.version}</span>
            <span className="text-right">(Rev. {new Date(document.lastGeneratedAt).toLocaleDateString()})<br />Confidential and Proprietary</span>
          </div>
        </div>
      </div>
    </div>
  );
}
