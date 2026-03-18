import { useState } from "react";
import { Eye, Send, Pause, AlertTriangle } from "lucide-react";
import type { ReviewRequest, ReviewDocument } from "@/types";
import { CoAuthorChatWidget } from "./CoAuthorChatWidget";
import { ApprovalCommentsModal } from "./ApprovalCommentsModal";

interface Props {
  request: ReviewRequest;
  document: ReviewDocument | null;
  onBack: () => void;
  onRequestUpdate: (req: ReviewRequest) => void;
}

export function ReviewWorkspace({ request, document, onBack, onRequestUpdate }: Props) {
  const [showPreview, setShowPreview] = useState(false);
  const [showApproval, setShowApproval] = useState(false);

  const statusChip = (status: string) => {
    const map: Record<string, string> = {
      "Manual review": "status-chip-error",
      "On hold": "bg-muted text-muted-foreground",
      "Exception": "status-chip-warning",
      "Sent for approval": "status-chip-info",
    };
    return map[status] || "";
  };

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-sm text-secondary hover:underline">← Back to Queue</button>
        <div className="flex items-center gap-2">
          <span className={`status-chip ${statusChip(request.status)}`}>{request.status}</span>
          <button onClick={() => setShowPreview(true)} className="flex items-center gap-1.5 text-xs px-3 py-1.5 border rounded-lg hover:bg-muted">
            <Eye className="w-3.5 h-3.5" /> Preview
          </button>
          <button className="flex items-center gap-1.5 text-xs px-3 py-1.5 border rounded-lg hover:bg-muted text-muted-foreground">
            <Pause className="w-3.5 h-3.5" /> On hold
          </button>
          <button className="flex items-center gap-1.5 text-xs px-3 py-1.5 border rounded-lg hover:bg-muted text-warning">
            <AlertTriangle className="w-3.5 h-3.5" /> Exception
          </button>
          <button
            onClick={() => setShowApproval(true)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
          >
            <Send className="w-3.5 h-3.5" /> Send for review
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: General Details + Rate Table */}
        <div className="lg:col-span-2 space-y-4">
          {/* General Details */}
          <div className="bg-card border rounded-lg p-4">
            <h3 className="text-sm font-semibold mb-3">General Details</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground">Job No:</span> <span className="font-medium">{request.jobNo}</span></div>
              <div><span className="text-muted-foreground">Event Type:</span> <span className="font-medium">{request.eventType}</span></div>
              <div><span className="text-muted-foreground">Effective Date:</span> <span className="font-medium">{request.effectiveDate}</span></div>
              <div><span className="text-muted-foreground">MPIN:</span> <span className="font-medium">{request.mpin}</span></div>
              <div><span className="text-muted-foreground">TIN:</span> <span className="font-medium">{request.tin}</span></div>
              <div><span className="text-muted-foreground">Status:</span> <span className={`status-chip ${statusChip(request.status)}`}>{request.status}</span></div>
            </div>
          </div>

          {/* Rate Table */}
          {document && (
            <div className="bg-card border rounded-lg overflow-hidden">
              <div className="p-4 border-b bg-muted/50">
                <h3 className="text-sm font-semibold">{document.name} – Rate Table</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left px-4 py-2 font-medium text-muted-foreground">Category</th>
                      <th className="text-left px-4 py-2 font-medium text-muted-foreground">Current Rate</th>
                      <th className="text-left px-4 py-2 font-medium text-muted-foreground">Escalated Rate</th>
                      <th className="text-left px-4 py-2 font-medium text-muted-foreground">Rounded</th>
                      <th className="text-left px-4 py-2 font-medium text-muted-foreground">Method</th>
                      <th className="text-left px-4 py-2 font-medium text-muted-foreground">Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {document.tableData.map((row, i) => (
                      <tr key={i} className={`border-b ${row.exception ? "bg-destructive/5" : ""}`}>
                        <td className="px-4 py-2 font-medium">{row.category}</td>
                        <td className="px-4 py-2">{row.currentRate}</td>
                        <td className="px-4 py-2">{row.escalatedRate}</td>
                        <td className="px-4 py-2">{row.rounded}</td>
                        <td className="px-4 py-2">{row.method}</td>
                        <td className="px-4 py-2">
                          <span className={`status-chip ${
                            row.confidence === "High" ? "status-chip-success" :
                            row.confidence === "Medium" ? "status-chip-warning" :
                            "status-chip-error"
                          }`}>{row.confidence}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right: Chat Widget */}
        <div className="h-[500px]">
          <CoAuthorChatWidget requestId={request.id} />
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40">
          <div className="bg-card rounded-xl border shadow-lg w-full max-w-3xl mx-4 h-[70vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold">Document Preview – {document?.name || "Document"}</h2>
              <button onClick={() => setShowPreview(false)} className="text-muted-foreground hover:text-foreground text-lg">✕</button>
            </div>
            <div className="flex-1 flex items-center justify-center bg-muted/30 p-8">
              <div className="text-center space-y-3">
                <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center mx-auto">
                  <Eye className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">PDF Preview Placeholder</p>
                <p className="text-xs text-muted-foreground">{document?.pdfMockRef || "document.pdf"}</p>
                <div className="bg-card border rounded-lg p-4 text-left text-xs text-muted-foreground max-w-md mx-auto space-y-1">
                  <p className="font-medium text-foreground">Mock Document Content</p>
                  <p>Page 1: Agreement between parties...</p>
                  <p>Page 15: Exhibit A – Provider Details...</p>
                  <p>Page 38: Appendix C – Payment Terms...</p>
                  <p>Page 43: Rate Escalation Schedule...</p>
                  <p>Page 50: Compliance Requirements...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {showApproval && (
        <ApprovalCommentsModal
          request={request}
          onClose={() => setShowApproval(false)}
          onSent={onRequestUpdate}
        />
      )}
    </div>
  );
}
