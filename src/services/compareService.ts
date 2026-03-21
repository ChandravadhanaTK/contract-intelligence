import type { CompareSession, ClauseDiff } from "@/types/compare";
import { seedContractFamilies } from "@/data/seed";

function get<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : fallback;
}
function set(key: string, val: unknown) {
  localStorage.setItem(key, JSON.stringify(val));
}

// Deterministic clause diffs per pair
const clauseGroupsBase: Omit<ClauseDiff, "id">[] = [
  {
    groupName: "Termination", clauseName: "Termination Notice Period",
    status: "modified",
    textA: "Either party may terminate this Agreement with 180 days written notice. Termination for cause requires 60 days notice with a 30-day cure period.",
    textB: "Plan may terminate with 90 days notice. Provider requires 180 days notice to terminate. No cure period specified.",
    unifiedDiffHtml: '<span class="diff-removed">Plan may terminate with 90 days notice. Provider requires 180 days notice to terminate. No cure period specified.</span><span class="diff-added">Either party may terminate this Agreement with 180 days written notice. Termination for cause requires 60 days notice with a 30-day cure period.</span>',
    changeStats: { added: 0, removed: 0, modified: 2 },
    citations: [{ sectionRef: "7.1", pageRef: "Page 22" }],
  },
  {
    groupName: "Payment Terms", clauseName: "Claims Processing Timeline",
    status: "modified",
    textA: "All clean claims shall be processed and paid within 30 calendar days of receipt. Contested claims shall be resolved within 60 calendar days.",
    textB: "Claims will be processed within 45 business days. Contested claims timeline is not specified.",
    unifiedDiffHtml: '<span class="diff-removed">Claims will be processed within 45 business days. Contested claims timeline is not specified.</span><span class="diff-added">All clean claims shall be processed and paid within 30 calendar days of receipt. Contested claims shall be resolved within 60 calendar days.</span>',
    changeStats: { added: 1, removed: 0, modified: 1 },
    citations: [{ sectionRef: "3.1", pageRef: "Page 15" }],
  },
  {
    groupName: "Payment Terms", clauseName: "Late Payment Interest",
    status: "added",
    textA: "Interest at 1.5% per month shall accrue on claims not paid within the specified timeline.",
    textB: "",
    unifiedDiffHtml: '<span class="diff-added">Interest at 1.5% per month shall accrue on claims not paid within the specified timeline.</span>',
    changeStats: { added: 1, removed: 0, modified: 0 },
    citations: [{ sectionRef: "3.5", pageRef: "Page 17" }],
  },
  {
    groupName: "Liability", clauseName: "Liability Cap",
    status: "modified",
    textA: "Each party's total liability shall not exceed the greater of $5M or fees paid in the prior 12 months.",
    textB: "Provider's total liability shall not exceed the fees paid in the prior 12 months.",
    unifiedDiffHtml: '<span class="diff-removed">Provider\'s total liability shall not exceed the fees paid in the prior 12 months.</span><span class="diff-added">Each party\'s total liability shall not exceed the greater of $5M or fees paid in the prior 12 months.</span>',
    changeStats: { added: 0, removed: 0, modified: 1 },
    citations: [{ sectionRef: "10.1", pageRef: "Page 35" }],
  },
  {
    groupName: "Confidentiality", clauseName: "Post-Termination Protection",
    status: "modified",
    textA: "Confidential information shall be protected for 5 years after termination.",
    textB: "Confidential information shall be protected for 2 years after termination.",
    unifiedDiffHtml: '<span class="diff-removed">Confidential information shall be protected for 2 years after termination.</span><span class="diff-added">Confidential information shall be protected for 5 years after termination.</span>',
    changeStats: { added: 0, removed: 0, modified: 1 },
    citations: [{ sectionRef: "9.1", pageRef: "Page 33" }],
  },
  {
    groupName: "HIPAA Compliance", clauseName: "PHI Encryption Standards",
    status: "modified",
    textA: "Provider shall comply with all HIPAA Privacy and Security Rules. PHI shall be encrypted at rest (AES-256) and in transit (TLS 1.2+).",
    textB: "Provider shall comply with HIPAA regulations.",
    unifiedDiffHtml: '<span class="diff-removed">Provider shall comply with HIPAA regulations.</span><span class="diff-added">Provider shall comply with all HIPAA Privacy and Security Rules. PHI shall be encrypted at rest (AES-256) and in transit (TLS 1.2+).</span>',
    changeStats: { added: 0, removed: 0, modified: 1 },
    citations: [{ sectionRef: "8.1", pageRef: "Page 30" }],
  },
  {
    groupName: "HIPAA Compliance", clauseName: "Breach Notification",
    status: "added",
    textA: "Any breach of PHI must be reported within 24 hours of discovery. Provider shall maintain cyber liability insurance of no less than $5M.",
    textB: "",
    unifiedDiffHtml: '<span class="diff-added">Any breach of PHI must be reported within 24 hours of discovery. Provider shall maintain cyber liability insurance of no less than $5M.</span>',
    changeStats: { added: 1, removed: 0, modified: 0 },
    citations: [{ sectionRef: "8.3", pageRef: "Page 31" }],
  },
  {
    groupName: "Data Protection", clauseName: "Data Sharing",
    status: "removed",
    textA: "",
    textB: "Provider may share data with affiliates without notice.",
    unifiedDiffHtml: '<span class="diff-removed">Provider may share data with affiliates without notice.</span>',
    changeStats: { added: 0, removed: 1, modified: 0 },
    citations: [{ sectionRef: "11.2", pageRef: "Page 38" }],
  },
  {
    groupName: "Scope of Services", clauseName: "Covered Services",
    status: "unchanged",
    textA: "Provider shall deliver all medically necessary Covered Services as defined in the Member's Evidence of Coverage.",
    textB: "Provider shall deliver all medically necessary Covered Services as defined in the Member's Evidence of Coverage.",
    unifiedDiffHtml: 'Provider shall deliver all medically necessary Covered Services as defined in the Member\'s Evidence of Coverage.',
    changeStats: { added: 0, removed: 0, modified: 0 },
    citations: [{ sectionRef: "2.1", pageRef: "Page 5" }],
  },
  {
    groupName: "Scope of Services", clauseName: "Service Area",
    status: "unchanged",
    textA: "Services shall be rendered within the designated Service Area as defined in Exhibit B.",
    textB: "Services shall be rendered within the designated Service Area as defined in Exhibit B.",
    unifiedDiffHtml: 'Services shall be rendered within the designated Service Area as defined in Exhibit B.',
    changeStats: { added: 0, removed: 0, modified: 0 },
    citations: [{ sectionRef: "2.3", pageRef: "Page 6" }],
  },
];

function buildSession(contractAId: string, contractBId: string): CompareSession {
  // Slightly vary diffs for different pairs using a hash
  const hash = (contractAId + contractBId).split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const diffs: ClauseDiff[] = clauseGroupsBase.map((d, i) => ({
    ...d,
    id: `cd-${hash}-${i}`,
  }));

  const summary = {
    added: diffs.filter(d => d.status === "added").length,
    removed: diffs.filter(d => d.status === "removed").length,
    modified: diffs.filter(d => d.status === "modified").length,
    unchanged: diffs.filter(d => d.status === "unchanged").length,
  };

  return {
    id: `cs-${hash}`,
    contractAId,
    contractBId,
    mode: "sideBySide",
    selectedClauseGroupId: null,
    summary,
    clauseDiffs: diffs,
    reviewedClauseIds: [],
    createdAt: new Date().toISOString(),
  };
}

export function getDocNameById(id: string): string {
  for (const fam of seedContractFamilies) {
    const doc = fam.documents.find(d => d.id === id);
    if (doc) return `${doc.name} (${fam.payer})`;
  }
  return id;
}

export function getAllDocOptions(): { id: string; name: string; family: string }[] {
  return seedContractFamilies.flatMap(f =>
    f.documents.map(d => ({ id: d.id, name: d.name, family: f.name.split("—")[0].trim() }))
  );
}

export const compareApi = {
  getCompareSession: async (contractAId: string, contractBId: string): Promise<CompareSession> => {
    await new Promise(r => setTimeout(r, 200));
    const key = `oci_compare_${contractAId}_${contractBId}`;
    const existing = get<CompareSession | null>(key, null);
    if (existing) return existing;
    const session = buildSession(contractAId, contractBId);
    set(key, session);
    return session;
  },
  saveCompareSession: async (session: CompareSession) => {
    await new Promise(r => setTimeout(r, 50));
    set(`oci_compare_${session.contractAId}_${session.contractBId}`, session);
  },
};
