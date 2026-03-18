import { useState } from "react";
import { Eye, Pencil, RefreshCw, Download, Copy, Send } from "lucide-react";
import { toast } from "sonner";
import type { ContractDraftDocument } from "@/types";

interface Props {
  document: ContractDraftDocument;
  onRegenerate: () => void;
  onSendToRedlining: () => void;
  onUpdateSections: (sections: ContractDraftDocument["sections"]) => void;
}

export function ContractDocumentPreview({ document, onRegenerate, onSendToRedlining, onUpdateSections }: Props) {
  const [editMode, setEditMode] = useState(false);
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
      {/* Toolbar */}
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
        </div>
      </div>

      {/* Document body */}
      <div className="p-6 max-h-[600px] overflow-y-auto">
        <div className="prose prose-sm max-w-none">
          <h1 className="text-xl font-bold text-primary border-b-2 border-secondary pb-2 mb-6">PROVIDER SERVICES AGREEMENT</h1>
          <h2 className="text-lg font-semibold text-primary mb-4">{document.title}</h2>
          <hr className="my-4" />

          {document.sections.map((sec) => (
            <div key={sec.id} className="mb-6">
              <h3 className="text-sm font-bold text-primary mb-2">{sec.headingNumber} {sec.title}</h3>
              {editMode && editingSectionId === sec.id ? (
                <div className="space-y-2">
                  <textarea className="w-full border rounded-lg px-3 py-2 text-sm bg-background min-h-[120px] resize-y" value={editBody} onChange={e => setEditBody(e.target.value)} />
                  <div className="flex gap-2">
                    <button onClick={saveEdit} className="px-3 py-1 bg-primary text-primary-foreground rounded text-xs font-medium">Save</button>
                    <button onClick={() => setEditingSectionId(null)} className="px-3 py-1 border rounded text-xs font-medium">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="relative group">
                  <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{sec.body}</div>
                  {editMode && (
                    <button onClick={() => startEdit(sec.id, sec.body)} className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 p-1 bg-muted rounded text-xs">
                      <Pencil className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}

          <h3 className="text-sm font-bold text-primary mb-2 mt-8">EXHIBITS AND APPENDICES</h3>
          <ul className="text-sm space-y-1">
            {document.exhibits.map(ex => (
              <li key={ex.id}><strong>{ex.name}:</strong> {ex.description}{ex.required ? " (Required)" : ""}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="p-3 border-t text-xs text-muted-foreground">
        Version {document.version} · Generated {new Date(document.lastGeneratedAt).toLocaleString()}
      </div>
    </div>
  );
}
