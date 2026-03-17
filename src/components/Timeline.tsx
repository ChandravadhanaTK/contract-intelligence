import type { StatusEvent } from "@/types";

interface Props {
  events: StatusEvent[];
}

export function Timeline({ events }: Props) {
  return (
    <div className="relative pl-6 space-y-4">
      <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-border" />
      {events.map((e, i) => (
        <div key={i} className="relative">
          <div className="absolute -left-[14px] top-1.5 w-3 h-3 rounded-full bg-primary border-2 border-card" />
          <div className="bg-card border rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="status-chip status-chip-info">{e.stage}</span>
              <span className="text-xs text-muted-foreground">{new Date(e.time).toLocaleString()}</span>
            </div>
            <p className="text-sm"><span className="font-medium">{e.actor}</span>: {e.note}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
