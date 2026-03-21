export interface ClauseDiff {
  id: string;
  groupName: string;
  clauseName: string;
  status: "added" | "removed" | "modified" | "unchanged";
  textA: string;
  textB: string;
  unifiedDiffHtml: string;
  changeStats: { added: number; removed: number; modified: number };
  citations?: { sectionRef: string; pageRef: string }[];
}

export interface CompareSession {
  id: string;
  contractAId: string;
  contractBId: string;
  mode: "sideBySide" | "unified";
  selectedClauseGroupId: string | null;
  summary: { added: number; removed: number; modified: number; unchanged: number };
  clauseDiffs: ClauseDiff[];
  reviewedClauseIds: string[];
  createdAt: string;
}
