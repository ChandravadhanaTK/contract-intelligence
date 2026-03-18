import type { Citation } from "@/types";

interface Props {
  citations: Citation[];
  onJumpToSection?: (sectionRef: string) => void;
}

export function CitationChips({ citations, onJumpToSection }: Props) {
  if (!citations || citations.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {citations.map((c, i) => (
        <button
          key={i}
          onClick={() => onJumpToSection?.(c.sectionRef)}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors cursor-pointer ${
            c.refType === "ContractDraft"
              ? "bg-primary/10 text-primary hover:bg-primary/20"
              : "bg-secondary/10 text-secondary hover:bg-secondary/20"
          }`}
          title={`Jump to ${c.sectionRef}`}
        >
          §{c.sectionRef} · {c.pageRef}
          {c.refType === "UploadedDoc" && " (Uploaded)"}
        </button>
      ))}
    </div>
  );
}
