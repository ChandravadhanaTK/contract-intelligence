import type { Contract, StandardClause, AuditEntry, DraftContract, ClauseVersion, AgentLog, ReviewDocument, ReviewRequest, ChatMessage } from "@/types";
import { chatAnswerMap } from "@/data/seed";
import type { DigitizationDocument, TrackerObligation, ContractFamily, RedlineClauseGroup, RedlineDocument } from "@/data/seed";

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function get<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : fallback;
}
function set(key: string, val: unknown) {
  localStorage.setItem(key, JSON.stringify(val));
}

export const api = {
  getContract: async (): Promise<Contract | null> => {
    await delay(100);
    return get<Contract | null>("oci_contract", null);
  },
  saveContract: async (c: Contract) => {
    await delay(50);
    set("oci_contract", c);
    const contracts = get<Contract[]>("oci_contracts", []);
    const idx = contracts.findIndex((x) => x.id === c.id);
    if (idx >= 0) contracts[idx] = c;
    set("oci_contracts", contracts);
  },
  getContracts: async (): Promise<Contract[]> => {
    await delay(100);
    return get<Contract[]>("oci_contracts", []);
  },
  getStandardClauses: async (): Promise<StandardClause[]> => {
    await delay(100);
    return get("oci_standard_clauses", []);
  },
  saveStandardClauses: async (c: StandardClause[]) => {
    await delay(50);
    set("oci_standard_clauses", c);
  },
  getAuditLog: async (): Promise<AuditEntry[]> => {
    await delay(50);
    return get("oci_audit_log", []);
  },
  addAuditEntry: async (entry: AuditEntry) => {
    const log = get<AuditEntry[]>("oci_audit_log", []);
    log.push(entry);
    set("oci_audit_log", log);
  },
  getDrafts: async (): Promise<DraftContract[]> => {
    await delay(100);
    return get("oci_drafts", []);
  },
  saveDraft: async (d: DraftContract) => {
    const drafts = get<DraftContract[]>("oci_drafts", []);
    const idx = drafts.findIndex((x) => x.id === d.id);
    if (idx >= 0) drafts[idx] = d; else drafts.push(d);
    set("oci_drafts", drafts);
  },
  getClauseVersions: async (): Promise<ClauseVersion[]> => {
    await delay(50);
    return get("oci_clause_versions", []);
  },
  saveClauseVersion: async (v: ClauseVersion) => {
    const versions = get<ClauseVersion[]>("oci_clause_versions", []);
    const idx = versions.findIndex((x) => x.id === v.id);
    if (idx >= 0) versions[idx] = v; else versions.push(v);
    set("oci_clause_versions", versions);
  },
  getReviewDocuments: async (contractId?: string): Promise<ReviewDocument[]> => {
    await delay(100);
    const docs = get<ReviewDocument[]>("oci_review_documents", []);
    return contractId ? docs.filter((d) => d.contractId === contractId) : docs;
  },
  getReviewRequests: async (contractId?: string, documentId?: string): Promise<ReviewRequest[]> => {
    await delay(100);
    let reqs = get<ReviewRequest[]>("oci_review_requests", []);
    if (contractId) reqs = reqs.filter((r) => r.contractId === contractId);
    if (documentId) reqs = reqs.filter((r) => r.documentId === documentId);
    return reqs;
  },
  updateReviewRequest: async (req: ReviewRequest) => {
    const reqs = get<ReviewRequest[]>("oci_review_requests", []);
    const idx = reqs.findIndex((r) => r.id === req.id);
    if (idx >= 0) reqs[idx] = req;
    set("oci_review_requests", reqs);
  },
  getChatMessages: async (requestId: string): Promise<ChatMessage[]> => {
    await delay(50);
    return get<ChatMessage[]>(`oci_chat_${requestId}`, []);
  },
  saveChatMessages: async (requestId: string, messages: ChatMessage[]) => {
    set(`oci_chat_${requestId}`, messages);
  },
  sendChatMessage: async (requestId: string, userText: string): Promise<string> => {
    await delay(1200);
    const lower = userText.toLowerCase();
    for (const [keyword, response] of Object.entries(chatAnswerMap)) {
      if (keyword !== "default" && lower.includes(keyword)) {
        return response;
      }
    }
    return chatAnswerMap["default"];
  },
  saveChecklist: async (requestId: string, checklist: { id: string; label: string; section: "manual" | "auto"; checked: boolean }[]) => {
    const reqs = get<ReviewRequest[]>("oci_review_requests", []);
    const idx = reqs.findIndex((r) => r.id === requestId);
    if (idx >= 0) {
      reqs[idx].checklist = checklist;
      set("oci_review_requests", reqs);
    }
  },
  simulateAgents: async (onLog: (log: AgentLog) => void): Promise<void> => {
    const agents = [
      { name: "Intake Agent", messages: ["Extracting contract metadata...", "Identifying 53 clauses from document...", "Metadata extraction complete."] },
      { name: "Clause Matching Agent", messages: ["Loading standard clauses library (12 standards)...", "Matching clauses against standards...", "Categorized: 8 aligned, 4 non-aligned, 10 missing."] },
      { name: "Redlining Agent", messages: ["Analyzing non-aligned clauses...", "Generating proposed edits for 4 clauses...", "Redline proposals generated."] },
      { name: "Workflow Agent", messages: ["Creating workflow tasks based on deviations...", "Assigned 6 tasks across 3 team members.", "Workflow instance created."] },
      { name: "Compliance Agent", messages: ["Extracting obligations from contract...", "Identified 8 obligations with due dates.", "Compliance tracking initialized."] },
    ];
    for (const agent of agents) {
      for (let i = 0; i < agent.messages.length; i++) {
        const isLast = i === agent.messages.length - 1;
        onLog({
          id: `${agent.name}-${i}`,
          agentName: agent.name,
          timestamp: new Date().toISOString(),
          message: agent.messages[i],
          status: isLast ? "DONE" : "RUNNING",
        });
        await delay(800);
      }
    }
  },
  simulateDraftAgent: async (prompt: string): Promise<string> => {
    await delay(1500);
    return `Based on your requirements, here is a draft clause:\n\n"The Provider shall deliver all medically necessary services as outlined in Exhibit A, maintaining compliance with applicable federal and state regulations. Services shall be rendered within the designated service area and meet quality standards as defined in the Quality Improvement Program."\n\nThis clause covers the key elements of scope, compliance, and quality. Shall I refine any specific aspect?`;
  },
  getSelectedContract: (): string | null => localStorage.getItem("oci_selected_contract"),
  setSelectedContract: (id: string) => localStorage.setItem("oci_selected_contract", id),
  getSelectedDocument: (): string | null => localStorage.getItem("oci_selected_document"),
  setSelectedDocument: (id: string) => localStorage.setItem("oci_selected_document", id),

  // ─── New APIs ───
  getDigitizationQueue: async (statusFilter?: string): Promise<DigitizationDocument[]> => {
    await delay(100);
    let docs = get<DigitizationDocument[]>("oci_digitization_docs", []);
    if (statusFilter && statusFilter !== "All Statuses") {
      docs = docs.filter(d => d.status === statusFilter);
    }
    return docs;
  },
  digitizeLegacyUpload: async (fileName: string, payer: string, contractType: string, source: string): Promise<DigitizationDocument> => {
    await delay(500);
    const docs = get<DigitizationDocument[]>("oci_digitization_docs", []);
    const hash = fileName.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    const newDoc: DigitizationDocument = {
      id: `dig-${Date.now()}`,
      name: fileName,
      payer,
      type: contractType === "Auto-detect" ? "Provider Agreement" : contractType,
      source,
      pages: 20 + (hash % 40),
      status: "Queued",
      ocrScore: 0,
      progress: 0,
    };
    docs.push(newDoc);
    set("oci_digitization_docs", docs);
    return newDoc;
  },
  getContractFamilies: async (statusFilter?: string, search?: string, jurisdictionFilter?: string): Promise<ContractFamily[]> => {
    await delay(100);
    let fams = get<ContractFamily[]>("oci_contract_families", []);
    if (statusFilter && statusFilter !== "All Status") {
      fams = fams.filter(f => f.status === statusFilter);
    }
    if (jurisdictionFilter && jurisdictionFilter !== "All Jurisdictions") {
      fams = fams.filter(f => f.jurisdiction === jurisdictionFilter);
    }
    if (search) {
      const s = search.toLowerCase();
      fams = fams.filter(f =>
        f.name.toLowerCase().includes(s) ||
        f.documents.some(d => d.name.toLowerCase().includes(s) || d.tags.some(t => t.toLowerCase().includes(s)))
      );
    }
    return fams;
  },
  getTrackerObligations: async (statusFilter?: string, categoryFilter?: string): Promise<TrackerObligation[]> => {
    await delay(100);
    let obs = get<TrackerObligation[]>("oci_tracker_obligations", []);
    if (statusFilter && statusFilter !== "All Statuses") {
      obs = obs.filter(o => o.status === statusFilter);
    }
    if (categoryFilter && categoryFilter !== "All Categories") {
      obs = obs.filter(o => o.category === categoryFilter);
    }
    return obs;
  },
  getRedlineDocuments: async (): Promise<RedlineDocument[]> => {
    await delay(50);
    return get<RedlineDocument[]>("oci_redline_documents", []);
  },
  getRedlineGroups: async (documentId?: string): Promise<RedlineClauseGroup[]> => {
    await delay(100);
    const all = get<RedlineClauseGroup[]>("oci_redline_groups", []);
    return documentId ? all.filter(g => g.documentId === documentId) : all;
  },
  saveRedlineGroups: async (groups: RedlineClauseGroup[]) => {
    await delay(50);
    set("oci_redline_groups", groups);
  },
  globalSearch: async (query: string): Promise<{ contracts: { id: string; name: string; match: string }[]; clauses: { id: string; name: string; match: string }[]; obligations: { id: string; name: string; match: string }[] }> => {
    await delay(300);
    const q = query.toLowerCase();
    const families = get<ContractFamily[]>("oci_contract_families", []);
    const standardClauses = get<{ id: string; clauseName: string; tags: string[] }[]>("oci_standard_clauses", []);
    const trackerObs = get<TrackerObligation[]>("oci_tracker_obligations", []);

    const contractResults = families
      .flatMap(f => f.documents.filter(d => d.name.toLowerCase().includes(q) || d.tags.some(t => t.toLowerCase().includes(q))))
      .slice(0, 5)
      .map(d => ({ id: d.id, name: d.name, match: d.type }));

    const clauseResults = standardClauses
      .filter(c => c.clauseName.toLowerCase().includes(q) || c.tags.some(t => t.toLowerCase().includes(q)))
      .slice(0, 5)
      .map(c => ({ id: c.id, name: c.clauseName, match: c.tags.join(", ") }));

    const obligationResults = trackerObs
      .filter(o => o.title.toLowerCase().includes(q) || o.contract.toLowerCase().includes(q))
      .slice(0, 5)
      .map(o => ({ id: o.id, name: o.title, match: o.contract }));

    return { contracts: contractResults, clauses: clauseResults, obligations: obligationResults };
  },
  getNotifications: async () => {
    await delay(50);
    return get<{ id: string; text: string; time: string; read: boolean }[]>("oci_notifications", []);
  },
};
