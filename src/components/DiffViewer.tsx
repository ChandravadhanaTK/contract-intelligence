interface Props {
  original: string;
  proposed: string;
}

export function DiffViewer({ original, proposed }: Props) {
  const origWords = original.split(/(\s+)/);
  const propWords = proposed.split(/(\s+)/);
  const origSet = new Set(origWords);
  const propSet = new Set(propWords);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="border rounded-lg p-4 bg-card">
        <h4 className="text-sm font-semibold text-destructive mb-2">Original</h4>
        <p className="text-sm leading-relaxed">
          {origWords.map((w, i) => (
            <span key={i} className={!propSet.has(w) && w.trim() ? "bg-red-100 text-red-800 px-0.5 rounded" : ""}>
              {w}
            </span>
          ))}
        </p>
      </div>
      <div className="border rounded-lg p-4 bg-card">
        <h4 className="text-sm font-semibold text-success mb-2">Proposed</h4>
        <p className="text-sm leading-relaxed">
          {propWords.map((w, i) => (
            <span key={i} className={!origSet.has(w) && w.trim() ? "bg-emerald-100 text-emerald-800 px-0.5 rounded" : ""}>
              {w}
            </span>
          ))}
        </p>
      </div>
    </div>
  );
}
