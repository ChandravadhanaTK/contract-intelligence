import { useState } from "react";
import { Send, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/services/mockApi";

const targets = [
  { id: "um", name: "Publish UM", description: "Utilization Management system feed" },
  { id: "claims", name: "Publish Claims", description: "Claims processing system integration" },
  { id: "fee", name: "Publish Fee Schedules", description: "Fee schedule distribution" },
  { id: "directory", name: "Publish Directory", description: "Provider directory updates" },
  { id: "analytics", name: "Publish Analytics Dashboard", description: "Analytics & reporting pipeline" },
];

export default function DownstreamFeed() {
  const [publishing, setPublishing] = useState<Record<string, boolean>>({});
  const [published, setPublished] = useState<Record<string, boolean>>({});

  const handlePublish = async (id: string, name: string) => {
    setPublishing((p) => ({ ...p, [id]: true }));
    await new Promise((r) => setTimeout(r, 2000));
    setPublishing((p) => ({ ...p, [id]: false }));
    setPublished((p) => ({ ...p, [id]: true }));
    await api.addAuditEntry({ id: `a-${Date.now()}`, timestamp: new Date().toISOString(), action: "Published to Downstream", detail: `Published to ${name}`, actor: "Current User" });
    toast.success(`Successfully published to ${name}`);
  };

  return (
    <div className="page-container">
      <h1 className="page-header">Downstream Feed</h1>
      <p className="text-sm text-muted-foreground">Publish contract data to downstream systems.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {targets.map((t) => (
          <div key={t.id} className="bg-card border rounded-lg p-5 flex flex-col">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Send className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">{t.name}</h3>
                <p className="text-xs text-muted-foreground">{t.description}</p>
              </div>
            </div>
            {published[t.id] ? (
              <div className="flex items-center gap-2 text-sm text-success mt-auto">
                <CheckCircle className="w-4 h-4" /> Published
              </div>
            ) : (
              <button
                onClick={() => handlePublish(t.id, t.name)}
                disabled={publishing[t.id]}
                className="mt-auto w-full bg-primary text-primary-foreground py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
              >
                {publishing[t.id] ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3 h-3 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Publishing...
                  </span>
                ) : "Publish"}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
