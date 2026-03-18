import { useState } from "react";
import { X } from "lucide-react";
import type { ReviewRequest } from "@/types";
import { api } from "@/services/mockApi";
import { toast } from "sonner";

const networkManagers = [
  "Jennifer Martinez",
  "Robert Chen",
  "Aisha Patel",
  "Michael O'Brien",
];

interface Props {
  request: ReviewRequest;
  onClose: () => void;
  onSent: (req: ReviewRequest) => void;
}

export function ApprovalCommentsModal({ request, onClose, onSent }: Props) {
  const [manager, setManager] = useState(networkManagers[0]);
  const [comments, setComments] = useState("");

  const handleSend = async () => {
    const updated: ReviewRequest = { ...request, status: "Sent for approval" };
    await api.updateReviewRequest(updated);
    await api.addAuditEntry({
      id: `a-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: "Sent for Approval",
      detail: `Job ${request.jobNo} sent to ${manager}. Comment: ${comments || "(none)"}`,
      actor: "ChandravadhanaTK",
    });
    toast.success(`Job ${request.jobNo} sent to ${manager} for approval`);
    onSent(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40">
      <div className="bg-card rounded-xl border shadow-lg w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-foreground">Approval Comments</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Select Network Manager</label>
            <select
              value={manager}
              onChange={(e) => setManager(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
            >
              {networkManagers.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Add Comments</label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm bg-background h-24 resize-none"
              placeholder="Add review comments..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-muted">
            Cancel
          </button>
          <button onClick={handleSend} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90">
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
