interface Props {
  leftTitle: string;
  rightTitle: string;
  leftText: string;
  rightText: string;
}

export function TwoColumnCompare({ leftTitle, rightTitle, leftText, rightText }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="border rounded-lg p-4 bg-card">
        <h4 className="text-sm font-semibold text-primary mb-2">{leftTitle}</h4>
        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{leftText}</p>
      </div>
      <div className="border rounded-lg p-4 bg-card">
        <h4 className="text-sm font-semibold text-secondary mb-2">{rightTitle}</h4>
        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{rightText || "— Not present in current contract —"}</p>
      </div>
    </div>
  );
}
